-- ===========================================
-- Assignment 2 — Task One (6 queries)
-- File: database/assignment2.sql
-- ===========================================

-- 1) Insert Tony Stark (account_id + account_type handled by defaults)
INSERT INTO account (account_firstname, account_lastname, account_email, account_password)
VALUES ('Tony', 'Stark', 'tony@starkent.com', 'Iam1ronM@n');

-- 2) Promote Tony to Admin
-- (If you know Tony's account_id, use it in the WHERE for precision.)
UPDATE account
   SET account_type = 'Admin'
 WHERE account_email = 'tony@starkent.com';

-- 3) Delete Tony Stark
-- (Again, if you know the PK, use WHERE account_id = <id>.)
DELETE FROM account
 WHERE account_email = 'tony@starkent.com';

-- 4) Update GM Hummer description: replace text using PostgreSQL replace()
--     Do NOT retype the whole description.
UPDATE inventory
   SET inv_description = REPLACE(inv_description, 'small interiors', 'a huge interior')
 WHERE inv_make = 'GM'
   AND inv_model = 'Hummer';

-- 5) INNER JOIN: get make, model, and classification for "Sport"
SELECT i.inv_make,
       i.inv_model,
       c.classification_name
  FROM inventory AS i
  INNER JOIN classification AS c
          ON i.classification_id = c.classification_id
 WHERE c.classification_name = 'Sport';

-- 6) Add "/vehicles" into both image paths (one query)
--    Changes /images/xyz.jpg -> /images/vehicles/xyz.jpg
UPDATE inventory
   SET inv_image     = REPLACE(inv_image, '/images/', '/images/vehicles/'),
       inv_thumbnail = REPLACE(inv_thumbnail, '/images/', '/images/vehicles/');
