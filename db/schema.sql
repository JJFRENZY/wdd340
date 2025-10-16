-- db/schema.sql
BEGIN;

CREATE EXTENSION IF NOT EXISTS citext;

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

CREATE TABLE IF NOT EXISTS public.account (
  account_id SERIAL PRIMARY KEY,
  account_firstname VARCHAR(50) NOT NULL,
  account_lastname  VARCHAR(50) NOT NULL,
  account_email     CITEXT      NOT NULL UNIQUE,
  account_password  TEXT        NOT NULL,
  account_type      VARCHAR(20) NOT NULL DEFAULT 'Client',
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.favorite (
  favorite_id  BIGSERIAL PRIMARY KEY,
  account_id   INT NOT NULL REFERENCES public.account(account_id) ON DELETE CASCADE,
  inv_id       INT NOT NULL REFERENCES public.inventory(inv_id)   ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, inv_id)
);

CREATE INDEX IF NOT EXISTS idx_favorite_account ON public.favorite(account_id);
CREATE INDEX IF NOT EXISTS idx_favorite_inv     ON public.favorite(inv_id);

COMMIT;
