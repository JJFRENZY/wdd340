-- ======================================================
-- Database Rebuild Script  (Task Two)
-- File: database/rebuild.sql
-- Idempotent: safe to run multiple times
-- ======================================================

SET search_path = public;

BEGIN;

-- ---------- Clean slate ----------
DROP TABLE IF EXISTS inventory        CASCADE;
DROP TABLE IF EXISTS classification   CASCADE;
DROP TABLE IF EXISTS account          CASCADE;
DROP TYPE  IF EXISTS account_type     CASCADE;

-- ---------- Type ----------
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
  inv_make          VARCHAR(50)   NOT NULL,
  inv_model         VARCHAR(50)   NOT NULL,
  inv_year          INT           NOT NULL,
  inv_description   TEXT          NOT NULL,
  inv_image         TEXT          NOT NULL,
  inv_thumbnail     TEXT          NOT NULL,
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
INSERT INTO classification (classification_name) VALUES
  ('Sedan'),('SUV'),('Truck'),('Sport'),('Utility')
ON CONFLICT (classification_name) DO NOTHING;

WITH ids AS (
  SELECT
    (SELECT classification_id FROM classification WHERE classification_name='Sedan')   AS sedan_id,
    (SELECT classification_id FROM classification WHERE classification_name='SUV')     AS suv_id,
    (SELECT classification_id FROM classification WHERE classification_name='Truck')   AS truck_id,
    (SELECT classification_id FROM classification WHERE classification_name='Sport')   AS sport_id,
    (SELECT classification_id FROM classification WHERE classification_name='Utility') AS util_id
)
INSERT INTO inventory (
  inv_make, inv_model, inv_year, inv_description,
  inv_image, inv_thumbnail, inv_price, inv_miles, inv_color, classification_id
)
SELECT 'GM','Hummer',2022,'A rugged off-roader with small interiors and big presence.',
       '/images/hummer.jpg','/images/hummer-tn.jpg',89999.00,12000,'Yellow',ids.suv_id FROM ids
UNION ALL SELECT 'Ford','Mustang',2021,'A classic American muscle coupe built for speed.',
       '/images/mustang.jpg','/images/mustang-tn.jpg',55999.00,8000,'Red',ids.sport_id FROM ids
UNION ALL SELECT 'Chevrolet','Camaro',2020,'Modern performance coupe with track-focused options.',
       '/images/camaro.jpg','/images/camaro-tn.jpg',52999.00,9500,'Blue',ids.sport_id FROM ids
UNION ALL SELECT 'Toyota','Tundra',2019,'Full-size pickup ready for work and weekend towing.',
       '/images/tundra.jpg','/images/tundra-tn.jpg',42999.00,25000,'Black',ids.truck_id FROM ids
UNION ALL SELECT 'Honda','Civic',2020,'Reliable compact sedan with great fuel economy.',
       '/images/civic.jpg','/images/civic-tn.jpg',21999.00,30000,'Silver',ids.sedan_id FROM ids
UNION ALL SELECT 'Toyota','Camry',2021,'Comfortable midsize sedan with advanced safety features.',
       '/images/camry.jpg','/images/camry-tn.jpg',25999.00,22000,'White',ids.sedan_id FROM ids
UNION ALL SELECT 'Tesla','Model 3',2022,'All-electric sedan with instant torque and modern tech.',
       '/images/model3.jpg','/images/model3-tn.jpg',39999.00,15000,'Pearl',ids.sedan_id FROM ids
UNION ALL SELECT 'BMW','3 Series',2019,'Sporty luxury sedan with balanced handling.',
       '/images/3series.jpg','/images/3series-tn.jpg',32999.00,28000,'Gray',ids.sedan_id FROM ids
UNION ALL SELECT 'Jeep','Wrangler',2018,'Iconic off-road SUV with removable top and doors.',
       '/images/wrangler.jpg','/images/wrangler-tn.jpg',31999.00,40000,'Green',ids.suv_id FROM ids
UNION ALL SELECT 'Nissan','Rogue',2020,'Compact SUV suited for families and commuting.',
       '/images/rogue.jpg','/images/rogue-tn.jpg',23999.00,26000,'Silver',ids.suv_id FROM ids
UNION ALL SELECT 'Chevrolet','Tahoe',2019,'Full-size SUV with three-row seating and towing capability.',
       '/images/tahoe.jpg','/images/tahoe-tn.jpg',42999.00,35000,'Black',ids.suv_id FROM ids
UNION ALL SELECT 'Ford','F-150',2020,'Best-selling full-size pickup with multiple powertrains.',
       '/images/f150.jpg','/images/f150-tn.jpg',37999.00,30000,'Blue',ids.truck_id FROM ids
UNION ALL SELECT 'Chevrolet','Silverado',2021,'Capable truck with modern driver assistance.',
       '/images/silverado.jpg','/images/silverado-tn.jpg',40999.00,18000,'Red',ids.truck_id FROM ids
UNION ALL SELECT 'Ram','1500',2019,'Smooth-riding full-size pickup with upscale cabin.',
       '/images/ram1500.jpg','/images/ram1500-tn.jpg',34999.00,32000,'Maroon',ids.truck_id FROM ids
UNION ALL SELECT 'Mercedes-Benz','Sprinter',2018,'High-roof cargo van ideal for business utility.',
       '/images/sprinter.jpg','/images/sprinter-tn.jpg',45999.00,42000,'White',ids.util_id FROM ids;

-- ---------- Task 1 #4 and #6 (must be LAST) ----------
-- #4 Replace phrase for GM Hummer
UPDATE inventory
   SET inv_description = REPLACE(inv_description, 'small interiors', 'a huge interior')
 WHERE inv_make = 'GM'
   AND inv_model = 'Hummer'
   AND inv_description LIKE '%small interiors%';

-- #6 Prefix image paths with /images/vehicles (guarded, all rows as needed)
UPDATE inventory
   SET inv_image     = REGEXP_REPLACE(inv_image,     '^/images/(?!vehicles/)', '/images/vehicles/'),
       inv_thumbnail = REGEXP_REPLACE(inv_thumbnail, '^/images/(?!vehicles/)', '/images/vehicles/')
 WHERE inv_image     LIKE '/images/%'
    OR inv_thumbnail LIKE '/images/%';

COMMIT;

-- Quick checks (optional):
-- SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;
-- SELECT COUNT(*) AS inventory_count FROM inventory;  -- expect 15
-- SELECT i.inv_make,i.inv_model,c.classification_name
--   FROM inventory i JOIN classification c USING (classification_id)
--  WHERE c.classification_name='Sport' ORDER BY 1,2;  -- expect 2 rows
