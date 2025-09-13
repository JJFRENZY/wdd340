-- ===========================================
-- Assignment 2 — Task One (6 queries)
-- File: database/assignment2.sql
-- ===========================================

-- Ensure we use the public schema
SET search_path = public;

-- 1) Insert Tony Stark (account_id + account_type handled by defaults)
INSERT INTO account (account_firstname, account_lastname, account_email, account_password)
VALUES ('Tony', 'Stark', 'tony@starkent.com', 'Iam1ronM@n');

-- 2) Promote Tony to Admin (use PRIMARY KEY via subquery)
UPDATE account
   SET account_type = 'Admin'
 WHERE account_id = (
   SELECT account_id FROM account WHERE account_email = 'tony@starkent.com'
 );

-- 3) Delete Tony Stark (use PRIMARY KEY via subquery)
DELETE FROM account
 WHERE account_id = (
   SELECT account_id FROM account WHERE account_email = 'tony@starkent.com'
 );

-- 4) Update GM Hummer description using REPLACE (don’t retype full text)
UPDATE inventory
   SET inv_description = REPLACE(inv_description, 'small interiors', 'a huge interior')
 WHERE inv_make = 'GM'
   AND inv_model = 'Hummer';

-- 5) INNER JOIN: make + model + classification for the “Sport” category
SELECT i.inv_make,
       i.inv_model,
       c.classification_name
  FROM inventory AS i
  INNER JOIN classification AS c
          ON i.classification_id = c.classification_id
 WHERE c.classification_name = 'Sport';

-- 6) Add "/vehicles" into both image paths (single query)
--    /images/xyz.jpg -> /images/vehicles/xyz.jpg
UPDATE inventory
   SET inv_image     = REPLACE(inv_image, '/images/', '/images/vehicles/'),
       inv_thumbnail = REPLACE(inv_thumbnail, '/images/', '/images/vehicles/');
