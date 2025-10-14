-- ===========================================
-- Assignment 2 — Task One (6 queries)
-- File: database/assignment2.sql
-- ===========================================

SET search_path = public;

-- 1) Insert Tony Stark (guard reruns)
INSERT INTO account (account_firstname, account_lastname, account_email, account_password)
VALUES ('Tony', 'Stark', 'tony@starkent.com', 'Iam1ronM@n')
ON CONFLICT (account_email) DO NOTHING;

-- 2) Promote Tony to Admin (use PK via subquery; skip if already Admin)
UPDATE account
   SET account_type = 'Admin'
 WHERE account_id = (SELECT account_id FROM account WHERE account_email = 'tony@starkent.com')
   AND account_type <> 'Admin';

-- 3) Delete Tony Stark (use PK via subquery)
DELETE FROM account
 WHERE account_id = (SELECT account_id FROM account WHERE account_email = 'tony@starkent.com');

-- 4) Update GM Hummer description via REPLACE (don’t retype full text)
UPDATE inventory
   SET inv_description = REPLACE(inv_description, 'small interiors', 'a huge interior')
 WHERE inv_make = 'GM'
   AND inv_model = 'Hummer'
   AND inv_description LIKE '%small interiors%';

-- 5) INNER JOIN: make + model + classification for the “Sport” category
SELECT i.inv_make, i.inv_model, c.classification_name
  FROM inventory AS i
  INNER JOIN classification AS c
    ON i.classification_id = c.classification_id
 WHERE c.classification_name = 'Sport';

-- 6) Add "/vehicles" into both image paths (single query; guarded)
UPDATE inventory
   SET inv_image     = REGEXP_REPLACE(inv_image,     '^/images/(?!vehicles/)', '/images/vehicles/'),
       inv_thumbnail = REGEXP_REPLACE(inv_thumbnail, '^/images/(?!vehicles/)', '/images/vehicles/')
 WHERE inv_image     LIKE '/images/%'
    OR inv_thumbnail LIKE '/images/%';

