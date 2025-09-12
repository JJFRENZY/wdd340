-- ======================================================
-- Database Rebuild Script  (Task Two)
-- File: database/rebuild.sql
-- Idempotent: safe to run multiple times
-- ======================================================

-- Ensure we’re in the public schema
SET search_path = public;

BEGIN;

-- ---------- Clean slate ----------
DROP TABLE IF EXISTS inventory        CASCADE;
DROP TABLE IF EXISTS classification   CASCADE;
DROP TABLE IF EXISTS account          CASCADE;
DROP TYPE  IF EXISTS account_type     CASCADE;

-- ---------- Type ----------
-- Enum for account.account_type (default will be 'Client' on the table)
CREATE TYPE account_type AS ENUM ('Admin','Client','Employee');

-- ---------- Tables ----------
-- 1) account
CREATE TABLE account (
  account_id        SERIAL PRIMARY KEY,
  account_firstname VARCHAR(50)  NOT NULL,
  account_lastname  VARCHAR(50)  NOT NULL,
  account_email     VARCHAR(255) NOT NULL UNIQUE,
  account_password  VARCHAR(255) NOT NULL,
  account_type      account_type NOT NULL DEFAULT 'Client'
);

-- 2) classification
CREATE TABLE classification (
  classification_id   SERIAL PRIMARY KEY,
  classification_name VARCHAR(50) NOT NULL UNIQUE
);

-- 3) inventory
CREATE TABLE inventory (
  inv_id            SERIAL PRIMARY KEY,
  inv_make          VARCHAR(50)  NOT NULL,
  inv_model         VARCHAR(50)  NOT NULL,
  inv_year          INT          NOT NULL,
  inv_description   TEXT         NOT NULL,
  inv_image         TEXT         NOT NULL,
  inv_thumbnail     TEXT         NOT NULL,
  inv_price         NUMERIC(10,2) NOT NULL,
  inv_miles         INT           NOT NULL,
  inv_color         VARCHAR(30)   NOT NULL,
  classification_id INT           NOT NULL,
  CONSTRAINT inventory_classification_fk
    FOREIGN KEY (classification_id)
    REFERENCES classification (classification_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
);

-- ---------- Seed Data ----------
-- Classification rows
INSERT INTO classification (classification_name) VALUES
  ('Sedan'),
  ('SUV'),
  ('Truck'),
  ('Sport'),
  ('Utility')
ON CONFLICT (classification_name) DO NOTHING;

-- Helper: get IDs by name
WITH ids AS (
  SELECT
    (SELECT classification_id FROM classification WHERE classification_name='Sedan')   AS sedan_id,
    (SELECT classification_id FROM classification WHERE classification_name='SUV')     AS suv_id,
    (SELECT classification_id FROM classification WHERE classification_name='Truck')   AS truck_id,
    (SELECT classification_id FROM classification WHERE classification_name='Sport')   AS sport_id,
    (SELECT classification_id FROM classification WHERE classification_name='Utility') AS util_id
)
-- Inventory rows (include GM Hummer with "small interiors" for Task 1 #4)
INSERT INTO inventory (
  inv_make, inv_model, inv_year, inv_description,
  inv_image, inv_thumbnail, inv_price, inv_miles, inv_color, classification_id
)
SELECT
  'GM', 'Hummer', 2022, 'A rugged off-roader with small interiors and big presence.',
  '/images/hummer.jpg', '/images/hummer-tn.jpg', 89999.00, 12000, 'Yellow', ids.suv_id
FROM ids
UNION ALL
SELECT
  'Ford', 'Mustang', 2021, 'A classic American muscle coupe built for speed.',
  '/images/mustang.jpg', '/images/mustang-tn.jpg', 55999.00, 8000, 'Red', ids.sport_id
FROM ids
UNION ALL
SELECT
  'Chevrolet', 'Camaro', 2020, 'Modern performance coupe with track-focused options.',
  '/images/camaro.jpg', '/images/camaro-tn.jpg', 52999.00, 9500, 'Blue', ids.sport_id
FROM ids
UNION ALL
SELECT
  'Toyota', 'Tundra', 2019, 'Full-size pickup ready for work and weekend towing.',
  '/images/tundra.jpg', '/images/tundra-tn.jpg', 42999.00, 25000, 'Black', ids.truck_id
FROM ids;

-- ---------- As required: copies of Task 1 queries #4 and #6 LAST ----------
-- #4 Replace "small interiors" -> "a huge interior" for GM Hummer
UPDATE inventory
   SET inv_description = REPLACE(inv_description, 'small interiors', 'a huge interior')
 WHERE inv_make = 'GM'
   AND inv_model = 'Hummer';

-- #6 Insert "/vehicles" into both image paths
UPDATE inventory
   SET inv_image     = REPLACE(inv_image, '/images/', '/images/vehicles/'),
       inv_thumbnail = REPLACE(inv_thumbnail, '/images/', '/images/vehicles/');

COMMIT;

-- Quick checks (optional):
-- SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;
-- SELECT inv_make, inv_model, inv_description, inv_image, inv_thumbnail FROM inventory ORDER BY inv_id;
