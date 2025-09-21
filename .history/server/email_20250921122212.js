import nodemailer from 'nodemailer';

const MAIL_TO = process.env.MAIL_TO;

const mailgunConfigured = () => process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN;

const sendViaMailgun = async ({ to, subject, text, html }) => {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  const from = process.env.MAIL_FROM || `Party Inviter <mailgun@${domain}>`;

  const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      from,
      to,
      subject,
      text,
      html,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Mailgun request failed: ${response.status} ${body}`);
  }
};

let smtpTransport;

const getSmtpTransport = () => {
  if (smtpTransport) {
    return smtpTransport;
  }

  if (!process.env.SMTP_HOST) {
    return null;
  }

  smtpTransport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? Number.parseInt(process.env.SMTP_PORT, 10) : 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASSWORD
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          }
        : undefined,
  });

  return smtpTransport;
};

const sendViaSmtp = async ({ subject, text, html }) => {
  const transport = getSmtpTransport();
  if (!transport) {
    throw new Error('SMTP transport is not configured.');
  }

  await transport.sendMail({
    from: process.env.MAIL_FROM || 'party-inviter@localhost',
    to: MAIL_TO,
    subject,
    text,
    html,
  });
};

export const sendNotificationEmail = async ({ subject, text, html }) => {
  if (!MAIL_TO) {
    return;
  }

  try {
    if (mailgunConfigured()) {
      await sendViaMailgun({ subject, text, html });
    } else {
      await sendViaSmtp({ subject, text, html });
    }
  } catch (error) {
    console.error('Unable to send notification email:', error);
  }
};
