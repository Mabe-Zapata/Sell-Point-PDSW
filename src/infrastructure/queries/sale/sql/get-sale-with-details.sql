-- Get sale with full details
SELECT
  sal.id,
  sal.sal_num AS "saleNumber",
  sal.sta_sal AS "status",
  sal.sub_sal AS subtotal,
  sal.tax_amo_sal AS "taxAmount",
  sal.dis_amo_sal AS "discountAmount",
  sal.tot_sal AS total,
  sal.cre_at AS "createdAt",
  sal.upd_at AS "updatedAt",
  sal.bra_id AS "branchId",
  sal.cus_id AS "customerId",
  sal.cas_usr_id AS "cashierUserId",
  sal.tax_rat_id AS "taxRateId",
  cus.nam_cus AS "customerName",
  cus.idt_typ AS "customerIdentificationType",
  cus.idt_num AS "customerIdentificationNumber",
  usr.usr_usr AS "cashierUsername"
FROM sales sal
INNER JOIN customers cus ON sal.cus_id = cus.id
INNER JOIN users usr ON sal.cas_usr_id = usr.id
WHERE sal.id = $1;