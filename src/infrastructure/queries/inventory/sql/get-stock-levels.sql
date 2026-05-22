-- Get stock levels across warehouses
SELECT
  i.id,
  i.war_id AS "warehouseId",
  i.pro_id AS "productId",
  i.cur_sto AS "currentStock",
  i.min_sto AS "minimumStock",
  i.max_sto AS "maximumStock",
  i.upd_at AS "updatedAt",
  p.nam_pro AS "productName",
  p.cod_pro AS "productCode",
  w.nam_war AS "warehouseName",
  b.nam_bra AS "branchName"
FROM inventories i
INNER JOIN products p ON i.pro_id = p.id
INNER JOIN warehouses w ON i.war_id = w.id
INNER JOIN branches b ON w.bra_id = b.id
WHERE ($1::uuid IS NULL OR w.bra_id = $1)
  AND ($2::uuid IS NULL OR w.id = $2)
  AND ($3::uuid IS NULL OR i.pro_id = $3)
ORDER BY b.nam_bra, w.nam_war, p.nam_pro;