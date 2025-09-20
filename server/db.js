import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const parseDatabaseUrl = (url) => {
  const { hostname, username, password, pathname, port } = new URL(url);
  const dbName = pathname.replace(/^\//, '');
  return {
    host: hostname,
    user: username,
    password,
    database: dbName,
    port: port ? Number.parseInt(port, 10) : 3306,
  };
};

const createPool = () => {
  const url = process.env.DATABASE_URL;
  const config = url ? parseDatabaseUrl(url) : {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'party_inviter',
    port: process.env.DB_PORT ? Number.parseInt(process.env.DB_PORT, 10) : 3306,
  };

  return mysql.createPool({
    ...config,
    waitForConnections: true,
    connectionLimit: Number.parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  });
};

export const pool = createPool();

export const query = (sql, params = []) => pool.query(sql, params);
export const getConnection = () => pool.getConnection();

const EVENT_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS events (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  host VARCHAR(255) NOT NULL,
  start_date DATETIME NOT NULL,
  end_date DATETIME NULL,
  location VARCHAR(255) NOT NULL,
  message TEXT,
  show_guest_list TINYINT(1) DEFAULT 1,
  password_hash VARCHAR(255) NULL,
  allow_share_link TINYINT(1) DEFAULT 1,
  theme JSON NULL,
  background_image LONGTEXT NULL,
  hero_images JSON NULL,
  share_token VARCHAR(64) NOT NULL UNIQUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

const GUEST_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS guests (
  id VARCHAR(36) PRIMARY KEY,
  event_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  plus_ones INT NOT NULL DEFAULT 0,
  comment TEXT,
  email VARCHAR(255),
  status ENUM('attending', 'not-attending') NOT NULL,
  responded_at DATETIME NOT NULL,
  manage_token VARCHAR(64) UNIQUE,
  UNIQUE KEY unique_guest_email (event_id, email),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

export const initializeDatabase = async () => {
  await query(EVENT_TABLE_SQL);
  await query(GUEST_TABLE_SQL);
};

export const generateId = () => crypto.randomUUID();
export const generateShareToken = () => crypto.randomBytes(9).toString('hex');
export const generateManageToken = () => crypto.randomBytes(12).toString('hex');

export const hashPassword = async (password) => {
  const rounds = Number.parseInt(process.env.BCRYPT_ROUNDS || '10', 10);
  return bcrypt.hash(password, rounds);
};

export const verifyPassword = (password, hash) => bcrypt.compare(password, hash);

export const mapEventRow = (row, guests = []) => ({
  id: row.id,
  title: row.title,
  host: row.host,
  date: row.start_date.toISOString(),
  endDate: row.end_date ? row.end_date.toISOString() : undefined,
  location: row.location,
  message: row.message || '',
  showGuestList: row.show_guest_list === 1,
  passwordProtected: Boolean(row.password_hash),
  allowShareLink: row.allow_share_link === 1,
  theme: row.theme ? JSON.parse(row.theme) : undefined,
  backgroundImage: row.background_image || undefined,
  heroImages: row.hero_images ? JSON.parse(row.hero_images) : undefined,
  shareToken: row.share_token,
  guests,
});
