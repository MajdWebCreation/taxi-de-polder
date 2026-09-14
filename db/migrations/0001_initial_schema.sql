-- Taxi De Polder - initieel MySQL schema (Hostinger).
-- Vertaling van het oorspronkelijke Supabase/PostgreSQL schema.
--
-- Afwijkingen t.o.v. PostgreSQL, bewust gekozen voor MySQL:
--   * `bigint generated always as identity` -> `BIGINT UNSIGNED AUTO_INCREMENT`
--   * `public.vehicle_type` / `public.reservation_status` enums -> kolom-`ENUM`
--   * `numeric(10,2)` -> `DECIMAL(10,2)` (identieke semantiek en precisie)
--   * `timestamptz` -> `DATETIME(3)`; de applicatie schrijft en leest
--     uitsluitend in UTC (mysql2 draait met `timezone: "Z"`)
--   * `uuid` action_token -> `CHAR(36)` met unieke index
--   * Row Level Security bestaat niet in MySQL. Autorisatie gebeurt
--     volledig server-side in de applicatie; de database-gebruiker wordt
--     nooit vanuit de browser benaderd.

CREATE TABLE IF NOT EXISTS pricing_settings (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  vehicle_type ENUM('auto', 'busje') NOT NULL,
  base_fare DECIMAL(10,2) NOT NULL,
  price_per_km DECIMAL(10,2) NOT NULL,
  price_per_minute DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  minimum_fare DECIMAL(10,2) NOT NULL,
  night_surcharge DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_pricing_settings_vehicle_type (vehicle_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS special_rates (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  from_label VARCHAR(190) NOT NULL,
  to_label VARCHAR(190) NOT NULL,
  vehicle_type ENUM('auto', 'busje') NOT NULL,
  fixed_price DECIMAL(10,2) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_special_rates_sort_order (sort_order, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reservations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  status ENUM('pending', 'confirmed', 'rejected') NOT NULL DEFAULT 'pending',
  first_name VARCHAR(190) NOT NULL,
  last_name VARCHAR(190) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(60) NOT NULL,
  pickup VARCHAR(500) NOT NULL,
  destination VARCHAR(500) NOT NULL,
  pickup_date DATE NOT NULL,
  pickup_time VARCHAR(10) NOT NULL,
  passengers INT NOT NULL,
  vehicle_type ENUM('auto', 'busje') NOT NULL,
  notes TEXT NULL,
  distance_km DECIMAL(10,2) NOT NULL,
  duration_text VARCHAR(60) NOT NULL,
  price_total DECIMAL(10,2) NOT NULL,
  pricing_mode VARCHAR(30) NOT NULL,
  admin_note TEXT NULL,
  action_token CHAR(36) NOT NULL,
  customer_email_sent_at DATETIME(3) NULL,
  status_email_sent_at DATETIME(3) NULL,
  confirmed_at DATETIME(3) NULL,
  rejected_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_reservations_action_token (action_token),
  KEY idx_reservations_created_at (created_at),
  KEY idx_reservations_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Vervangt Supabase Auth. Eén rij per beheerder.
CREATE TABLE IF NOT EXISTS admin_users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_admin_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Server-side sessies. De cookie bevat het ruwe token, de database
-- uitsluitend de SHA-256 hash daarvan.
CREATE TABLE IF NOT EXISTS admin_sessions (
  token_hash CHAR(64) NOT NULL,
  admin_user_id BIGINT UNSIGNED NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  last_seen_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (token_hash),
  KEY idx_admin_sessions_expires_at (expires_at),
  KEY idx_admin_sessions_admin_user_id (admin_user_id),
  CONSTRAINT fk_admin_sessions_admin_user
    FOREIGN KEY (admin_user_id) REFERENCES admin_users (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
