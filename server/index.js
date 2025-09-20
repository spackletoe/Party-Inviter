import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  initializeDatabase,
  query,
  mapEventRow,
  generateId,
  generateShareToken,
  hashPassword,
  verifyPassword,
  generateManageToken,
  getConnection,
} from './db.js';
import { sendNotificationEmail } from './email.js';
import {
  signAdminToken,
  verifyAdminToken,
  signGuestToken,
  verifyGuestToken,
  extractBearerToken,
} from './auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
dotenv.config();

const app = express();
const port = Number.parseInt(process.env.PORT || '4000', 10);

app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
  credentials: true,
}));
app.use(express.json({ limit: '5mb' }));

const mapGuestRow = row => ({
  id: row.id,
  name: row.name,
  plusOnes: row.plus_ones,
  comment: row.comment || '',
  email: row.email || undefined,
  status: row.status,
  respondedAt: row.responded_at ? row.responded_at.toISOString() : undefined,
  manageToken: row.manage_token || undefined,
});

const getEventGuests = async eventId => {
  const [rows] = await query('SELECT * FROM guests WHERE event_id = ? ORDER BY responded_at DESC', [eventId]);
  return rows.map(mapGuestRow);
};

const getEventById = async eventId => {
  const [rows] = await query('SELECT * FROM events WHERE id = ?', [eventId]);
  const row = rows[0];
  if (!row) {
    return null;
  }
  const guests = await getEventGuests(row.id);
  return mapEventRow(row, guests);
};

const getEventByShareToken = async shareToken => {
  const [rows] = await query('SELECT * FROM events WHERE share_token = ?', [shareToken]);
  return rows[0] || null;
};

const sanitizeGuestsForPublic = (eventRow, guests) => {
  if (eventRow.show_guest_list !== 1) {
    return [];
  }
  return guests.map(({ manageToken, ...guest }) => guest);
};

const authenticateAdmin = (req, res, next) => {
  const token = extractBearerToken(req.headers.authorization || '');
  if (!token) {
    return res.status(401).json({ message: 'Admin authorization required.' });
  }

  try {
    verifyAdminToken(token);
    return next();
  } catch (error) {
    console.error('Invalid admin token:', error);
    return res.status(401).json({ message: 'Invalid admin token.' });
  }
};

const requireGuestAuthorization = (eventRow, req, res) => {
  if (!eventRow.password_hash) {
    return { authorized: true, guestToken: null };
  }

  const token = extractBearerToken(req.headers.authorization || '');
  if (!token) {
    return { authorized: false, guestToken: null };
  }

  try {
    const payload = verifyGuestToken(token);
    if (payload.eventId !== eventRow.id) {
      return { authorized: false, guestToken: null };
    }
    return { authorized: true, guestToken: token };
  } catch (error) {
    console.error('Invalid guest token:', error);
    return { authorized: false, guestToken: null };
  }
};

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/access', async (req, res) => {
  const { password } = req.body || {};
  if (!password) {
    return res.status(400).json({ message: 'Password is required.' });
  }

  const adminSecret = process.env.ADMIN_PASSWORD;
  const adminHash = process.env.ADMIN_PASSWORD_HASH;

  try {
    let adminValid = false;
    if (adminHash) {
      adminValid = await verifyPassword(password, adminHash);
    } else if (adminSecret) {
      adminValid = password === adminSecret;
    }

    if (adminValid) {
      const token = signAdminToken();
      return res.json({ type: 'admin', token });
    }

    const [eventRows] = await query('SELECT * FROM events WHERE password_hash IS NOT NULL');
    for (const row of eventRows) {
      const matches = await verifyPassword(password, row.password_hash);
      if (matches) {
        const guestToken = signGuestToken(row.id);
        return res.json({ type: 'event', eventId: row.id, shareToken: row.share_token, guestToken });
      }
    }

    return res.status(401).json({ message: 'No event or admin area matched that password. Please try again.' });
  } catch (error) {
    console.error('Access check failed:', error);
    return res.status(500).json({ message: 'Unable to verify password.' });
  }
});

app.post('/api/admin/token', authenticateAdmin, (_req, res) => {
  const token = signAdminToken();
  res.json({ token });
});

app.get('/api/admin/events', authenticateAdmin, async (_req, res) => {
  const [rows] = await query('SELECT * FROM events ORDER BY created_at DESC');
  const events = await Promise.all(
    rows.map(async row => {
      const guests = await getEventGuests(row.id);
      return mapEventRow(row, guests);
    }),
  );
  res.json(events);
});

app.post('/api/admin/events', authenticateAdmin, async (req, res) => {
  const {
    title,
    host,
    date,
    endDate,
    location,
    message,
    showGuestList,
    allowShareLink,
    password,
    theme,
    backgroundImage,
    heroImages,
  } = req.body || {};

  if (!title || !host || !date || !location) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  const id = generateId();
  const shareToken = generateShareToken();
  const startDate = new Date(date);
  const endDateValue = endDate ? new Date(endDate) : null;

  try {
    const passwordHash = password ? await hashPassword(password) : null;
    await query(
      `INSERT INTO events (id, title, host, start_date, end_date, location, message, show_guest_list, password_hash, allow_share_link, theme, background_image, hero_images, share_token)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        title,
        host,
        startDate,
        endDateValue,
        location,
        message || '',
        showGuestList ? 1 : 0,
        passwordHash,
        allowShareLink ? 1 : 0,
        theme ? JSON.stringify(theme) : null,
        backgroundImage || null,
        heroImages ? JSON.stringify(heroImages) : null,
        shareToken,
      ],
    );

    const event = await getEventById(id);
    return res.status(201).json(event);
  } catch (error) {
    console.error('Unable to create event:', error);
    return res.status(500).json({ message: 'Unable to create event.' });
  }
});

app.put('/api/admin/events/:eventId', authenticateAdmin, async (req, res) => {
  const { eventId } = req.params;
  const [existingRows] = await query('SELECT * FROM events WHERE id = ?', [eventId]);
  const existingRow = existingRows[0];
  if (!existingRow) {
    return res.status(404).json({ message: 'Event not found.' });
  }

  const {
    title,
    host,
    date,
    endDate,
    location,
    message,
    showGuestList,
    allowShareLink,
    password,
    removePassword,
    theme,
    backgroundImage,
    heroImages,
  } = req.body || {};

  if (!title || !host || !date || !location) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  try {
    let passwordHash = existingRow.password_hash;
    if (removePassword) {
      passwordHash = null;
    } else if (password) {
      passwordHash = await hashPassword(password);
    }

    await query(
      `UPDATE events SET
        title = ?,
        host = ?,
        start_date = ?,
        end_date = ?,
        location = ?,
        message = ?,
        show_guest_list = ?,
        password_hash = ?,
        allow_share_link = ?,
        theme = ?,
        background_image = ?,
        hero_images = ?
      WHERE id = ?`,
      [
        title,
        host,
        new Date(date),
        endDate ? new Date(endDate) : null,
        location,
        message || '',
        showGuestList ? 1 : 0,
        passwordHash,
        allowShareLink ? 1 : 0,
        theme ? JSON.stringify(theme) : null,
        backgroundImage || null,
        heroImages ? JSON.stringify(heroImages) : null,
        eventId,
      ],
    );

    const updated = await getEventById(eventId);
    return res.json(updated);
  } catch (error) {
    console.error('Unable to update event:', error);
    return res.status(500).json({ message: 'Unable to update event.' });
  }
});

app.delete('/api/admin/events/:eventId', authenticateAdmin, async (req, res) => {
  const { eventId } = req.params;
  await query('DELETE FROM events WHERE id = ?', [eventId]);
  res.status(204).end();
});

app.get('/api/public/events/:shareToken', async (req, res) => {
  const { shareToken } = req.params;
  const eventRow = await getEventByShareToken(shareToken);
  if (!eventRow) {
    return res.status(404).json({ message: 'Event not found.' });
  }

  const { authorized, guestToken } = requireGuestAuthorization(eventRow, req, res);
  if (eventRow.password_hash && !authorized) {
    return res.status(401).json({ requiresPassword: true });
  }

  const guests = await getEventGuests(eventRow.id);
  const event = mapEventRow(eventRow, sanitizeGuestsForPublic(eventRow, guests));
  return res.json({ event, guestToken: guestToken || undefined });
});

app.post('/api/public/events/:shareToken/access', async (req, res) => {
  const { shareToken } = req.params;
  const { password } = req.body || {};
  if (!password) {
    return res.status(400).json({ message: 'Password is required.' });
  }

  const eventRow = await getEventByShareToken(shareToken);
  if (!eventRow) {
    return res.status(404).json({ message: 'Event not found.' });
  }

  if (!eventRow.password_hash) {
    const guestToken = signGuestToken(eventRow.id);
    return res.json({ guestToken, eventId: eventRow.id });
  }

  const matches = await verifyPassword(password, eventRow.password_hash);
  if (!matches) {
    return res.status(401).json({ message: 'Incorrect password.' });
  }

  const guestToken = signGuestToken(eventRow.id);
  return res.json({ guestToken, eventId: eventRow.id });
});

app.post('/api/public/events/:shareToken/rsvps', async (req, res) => {
  const { shareToken } = req.params;
  const { name, plusOnes = 0, comment, email, status, manageToken } = req.body || {};

  if (!name || !status || !['attending', 'not-attending'].includes(status)) {
    return res.status(400).json({ message: 'Name and valid status are required.' });
  }

  const eventRow = await getEventByShareToken(shareToken);
  if (!eventRow) {
    return res.status(404).json({ message: 'Event not found.' });
  }

  const { authorized } = requireGuestAuthorization(eventRow, req, res);
  if (eventRow.password_hash && !authorized) {
    return res.status(401).json({ message: 'Password required to submit RSVP.' });
  }

  const connection = await getConnection();
  const now = new Date();
  try {
    await connection.beginTransaction();

    let guestRow;
    if (manageToken) {
      const [rows] = await connection.query('SELECT * FROM guests WHERE manage_token = ? AND event_id = ?', [manageToken, eventRow.id]);
      guestRow = rows[0];
    }

    if (!guestRow && email) {
      const [rows] = await connection.query('SELECT * FROM guests WHERE event_id = ? AND email = ?', [eventRow.id, email]);
      guestRow = rows[0];
    }

    if (guestRow) {
      await connection.query(
        `UPDATE guests SET name = ?, plus_ones = ?, comment = ?, email = ?, status = ?, responded_at = ?, manage_token = ? WHERE id = ?`,
        [
          name,
          Number.parseInt(plusOnes, 10) || 0,
          comment || '',
          email || null,
          status,
          now,
          guestRow.manage_token,
          guestRow.id,
        ],
      );
    } else {
      const newGuestId = generateId();
      const newManageToken = manageToken || generateManageToken();
      await connection.query(
        `INSERT INTO guests (id, event_id, name, plus_ones, comment, email, status, responded_at, manage_token)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newGuestId,
          eventRow.id,
          name,
          Number.parseInt(plusOnes, 10) || 0,
          comment || '',
          email || null,
          status,
          now,
          newManageToken,
        ],
      );
      const [rows] = await connection.query('SELECT * FROM guests WHERE id = ?', [newGuestId]);
      guestRow = rows[0];
    }

    await connection.commit();

    const guests = await getEventGuests(eventRow.id);
    const event = mapEventRow(eventRow, sanitizeGuestsForPublic(eventRow, guests));
    const guest = mapGuestRow(guestRow);

    const subject = `RSVP update for ${eventRow.title}`;
    const emailText = `${guest.name} is ${guest.status === 'attending' ? 'attending' : 'not attending'}${
      guest.plusOnes > 0 ? ` with +${guest.plusOnes}` : ''
    }`;
    await sendNotificationEmail({
      subject,
      text: `${emailText}\nEvent: ${eventRow.title}\nComment: ${guest.comment || '—'}`,
      html: `<p>${emailText}</p><p><strong>Event:</strong> ${eventRow.title}</p><p><strong>Comment:</strong> ${guest.comment || '—'}</p>`,
    });

    res.json({
      event,
      guest,
      guestToken: eventRow.password_hash ? signGuestToken(eventRow.id) : undefined,
      manageToken: guest.manageToken,
    });
  } catch (error) {
    await connection.rollback();
    console.error('Unable to process RSVP:', error);
    res.status(500).json({ message: 'Unable to submit RSVP.' });
  } finally {
    connection.release();
  }
});

const start = async () => {
  try {
    await initializeDatabase();
    app.listen(port, () => {
      console.log(`Party Inviter server listening on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();
