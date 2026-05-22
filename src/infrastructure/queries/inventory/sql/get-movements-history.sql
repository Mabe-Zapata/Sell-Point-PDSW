-- Get movements history with filters
SELECT
  sm.id,
  sm.war_id AS "warehouseId",
  sm.pro_id AS "productId",
  sm.typ_mov AS "type",
  sm.qty_mov AS quantity,
  sm.sto_bef AS "stockBefore",
  sm.sto_aft AS "stockAfter",
  sm.usr_id AS "userId",
  sm.ref_typ AS "referenceType",
  sm.ref_id AS "referenceId",
  sm.des_mov AS description,
  sm.cre_at AS "createdAt",
  p.nam_pro AS "productName",
  p.cod_pro AS "productCode",
  w.nam_war AS "warehouseName",
  usr.usr_usr AS "userUsername"
FROM stock_movements sm
INNER JOIN products p ON sm.pro_id = p.id
INNER JOIN warehouses w ON sm.war_id = w.id
LEFT JOIN users usr ON sm.usr_id = usr.id
WHERE ($1::uuid IS NULL OR sm.war_id = $1)
  AND ($2::uuid IS NULL OR sm.pro_id = $2)
  AND ($3::varchar IS NULL OR sm.typ_mov = $3)
  AND ($4::timestamp IS NULL OR sm.cre_at >= $4)
  AND ($5::timestamp IS NULL OR sm.cre_at <= $5)
ORDER BY sm.cre_at DESC
LIMIT $6 OFFSET $7;