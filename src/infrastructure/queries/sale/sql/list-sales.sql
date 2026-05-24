-- List sales with pagination and filters
SELECT
  sal.id,
  sal.sal_num AS "saleNumber",
  sal.sta_sal AS "status",
  sal.sub_sal AS subtotal,
  sal.tax_amo_sal AS "taxAmount",
  sal.dis_amo_sal AS "discountAmount",
  sal.tot_sal AS total,
  sal.cre_at AS "createdAt",
  sal.bra_id AS "branchId",
  sal.cus_id AS "customerId",
  cus.nam_cus AS "customerName",
  usr.usr_usr AS "cashierUsername"
FROM sales sal
INNER JOIN customers cus ON sal.cus_id = cus.id
INNER JOIN users usr ON sal.cas_usr_id = usr.id
WHERE ($1::uuid IS NULL OR sal.bra_id = $1)
  AND ($2::uuid IS NULL OR sal.cus_id = $2)
  AND ($3::varchar IS NULL OR sal.sta_sal = $3)
  AND ($4::timestamp IS NULL OR sal.cre_at >= $4)
  AND ($5::timestamp IS NULL OR sal.cre_at <= $5)
ORDER BY sal.cre_at DESC
LIMIT $6 OFFSET $7;