-- db/verify.sql
SELECT 'classification_count' AS what, COUNT(*) FROM public.classification;
SELECT 'inventory_count'      AS what, COUNT(*) FROM public.inventory;
SELECT 'account_count'        AS what, COUNT(*) FROM public.account;
SELECT 'favorite_count'       AS what, COUNT(*) FROM public.favorite;
