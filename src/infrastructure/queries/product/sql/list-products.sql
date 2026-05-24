-- List products with search and pagination
SELECT
  p.id,
  p.cod_pro AS "productCode",
  p.nam_pro AS "productName",
  p.sal_pri_pro AS "salePrice",
  p.cos_pri_pro AS "costPrice",
  p.act_pro AS "isActive",
  p.cre_at AS "createdAt",
  p.cat_id AS "categoryId",
  c.nam_cat AS "categoryName"
FROM products p
LEFT JOIN categories c ON p.cat_id = c.id
WHERE ($1::varchar IS NULL OR p.nam_pro ILIKE $1 OR p.cod_pro ILIKE $1)
  AND ($2::uuid IS NULL OR p.cat_id = $2)
  AND ($3::boolean IS NULL OR p.act_pro = $3)
ORDER BY p.cre_at DESC
LIMIT $4 OFFSET $5;