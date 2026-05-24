-- List customers with search and pagination
SELECT
  c.id,
  c.idt_typ AS "identificationType",
  c.idt_num AS "identificationNumber",
  c.nam_cus AS "names",
  c.ema_cus AS "email",
  c.pho_cus AS "phone",
  c.add_cus AS "address",
  c.cre_at AS "createdAt"
FROM customers c
WHERE ($1::varchar IS NULL OR c.nam_cus ILIKE $1 OR c.idt_num ILIKE $1)
  AND ($2::varchar IS NULL OR c.idt_typ = $2)
ORDER BY c.cre_at DESC
LIMIT $3 OFFSET $4;