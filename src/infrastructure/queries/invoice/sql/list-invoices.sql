-- List invoices with filters
SELECT
  i.id,
  i.inv_num AS "invoiceNumber",
  i.aut_num AS "authorizationNumber",
  i.iss_dat_inv AS "issueDate",
  i.sta_inv AS "status",
  i.can_at_inv AS "cancelledAt",
  i.cre_at AS "createdAt",
  i.sal_id AS "saleId",
  i.ser_id AS "seriesId",
  sal.sal_num AS "saleNumber",
  ser.est_cod_ser AS "establishmentCode",
  ser.emi_poi_cod_ser AS "emissionPointCode",
  bra.nam_bra AS "branchName",
  sal.tot_sal AS "total",
  cus.nam_cus AS "customerName",
  cus.idt_num AS "customerIdentificationNumber"
FROM invoices i
INNER JOIN invoice_series ser ON i.ser_id = ser.id
INNER JOIN sales sal ON i.sal_id = sal.id
INNER JOIN customers cus ON sal.cus_id = cus.id
INNER JOIN branches bra ON sal.bra_id = bra.id
WHERE ($1::uuid IS NULL OR ser.bra_id = $1)
  AND ($2::varchar IS NULL OR i.sta_inv = $2)
  AND ($3::varchar IS NULL OR i.inv_num ILIKE $3)
  AND ($4::timestamp IS NULL OR i.cre_at >= $4)
  AND ($5::timestamp IS NULL OR i.cre_at <= $5)
ORDER BY i.cre_at DESC
LIMIT $6 OFFSET $7;
