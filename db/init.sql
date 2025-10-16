-- db/init.sql
-- One-shot schema + seed to make the app work (classification, inventory, account, favorites).
-- Safe to re-run: uses IF NOT EXISTS and ON CONFLICT where possible.

BEGIN;

-- =========================
-- Core tables
-- =========================

CREATE TABLE IF NOT EXISTS public.classification (
  classification_id SERIAL PRIMARY KEY,
  classification_name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS public.inventory (
  inv_id SERIAL PRIMARY KEY,
  inv_make        VARCHAR(50)  NOT NULL,
  inv_model       VARCHAR(50)  NOT NULL,
  inv_year        INT          NOT NULL CHECK (inv_year BETWEEN 1886 AND extract(year from now())::int + 1),
  inv_description TEXT         NOT NULL,
  inv_image       TEXT         NOT NULL,
  inv_thumbnail   TEXT         NOT NULL,
  inv_price       NUMERIC(12,2) NOT NULL CHECK (inv_price >= 0),
  inv_miles       INT          NOT NULL CHECK (inv_miles >= 0),
  inv_color       VARCHAR(30)  NOT NULL,
  classification_id INT        NOT NULL REFERENCES public.classification(classification_id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_inventory_classification_id ON public.inventory(classification_id);

-- Accounts (simplified; your app hashes password in Node)
CREATE TABLE IF NOT EXISTS public.account (
  account_id SERIAL PRIMARY KEY,
  account_firstname VARCHAR(50) NOT NULL,
  account_lastname  VARCHAR(50) NOT NULL,
  account_email     CITEXT      NOT NULL UNIQUE,
  account_password  TEXT        NOT NULL,
  account_type      VARCHAR(20) NOT NULL DEFAULT 'Client',
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- Favorites (your enhancement)
CREATE TABLE IF NOT EXISTS public.favorite (
  favorite_id  BIGSERIAL PRIMARY KEY,
  account_id   INT NOT NULL REFERENCES public.account(account_id)   ON DELETE CASCADE,
  inv_id       INT NOT NULL REFERENCES public.inventory(inv_id)     ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, inv_id)
);

CREATE INDEX IF NOT EXISTS idx_favorite_account ON public.favorite(account_id);
CREATE INDEX IF NOT EXISTS idx_favorite_inv     ON public.favorite(inv_id);

-- Optional: connect-pg-simple session table (your server.js is set to auto-create it,
-- so you usually DON'T need this. Keep commented unless you want to manage it yourself.)
-- CREATE TABLE IF NOT EXISTS public."session" (
--   sid TEXT PRIMARY KEY,
--   sess JSON NOT NULL,
--   expire TIMESTAMP(6) NOT NULL
-- );
-- CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON public."session" ("expire");

-- =========================
-- Seed data (idempotent)
-- =========================

-- Classifications (show up in the nav)
INSERT INTO public.classification (classification_name) VALUES
  ('SUV'), ('Truck'), ('Sedan'), ('Coupe'), ('Sports'), ('Van')
ON CONFLICT (classification_name) DO NOTHING;

-- Minimal inventory so each view works out-of-the-box
-- thumbnail vs image can be the same asset paths for now
INSERT INTO public.inventory
(inv_make, inv_model, inv_year, inv_description, inv_image, inv_thumbnail, inv_price, inv_miles, inv_color, classification_id)
VALUES
('Toyota', 'RAV4', 2022, 'Versatile compact SUV with great mileage.',
 '/images/vehicles/no-image.png', '/images/vehicles/no-image-tn.png', 28990, 15234, 'Silver',
 (SELECT classification_id FROM public.classification WHERE classification_name='SUV')),
('Ford', 'F-150', 2021, 'Workhorse truck with solid towing capacity.',
 '/images/vehicles/no-image.png', '/images/vehicles/no-image-tn.png', 35950, 28410, 'Blue',
 (SELECT classification_id FROM public.classification WHERE classification_name='Truck')),
('Honda', 'Accord', 2023, 'Comfortable midsize sedan with advanced safety.',
 '/images/vehicles/no-image.png', '/images/vehicles/no-image-tn.png', 27995, 5030, 'White',
 (SELECT classification_id FROM public.classification WHERE classification_name='Sedan'))
ON CONFLICT DO NOTHING;

-- Example account (password is "ChangeMe_123!" hashed in app; here just a placeholder)
-- You can delete this or replace with your own account created via the UI.
INSERT INTO public.account (account_firstname, account_lastname, account_email, account_password, account_type)
VALUES ('Demo', 'User', 'demo@example.com', 'REPLACE_WITH_HASH', 'Client')
ON CONFLICT (account_email) DO NOTHING;

COMMIT;

-- =========================
-- Quick sanity checks (optional to run)
-- SELECT * FROM public.classification;
-- SELECT inv_id, inv_make, inv_model FROM public.inventory LIMIT 5;
