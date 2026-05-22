-- List stock transfers with filters
SELECT
  st.id,
  st.sta_tra AS "status",
  st.not_tra AS "notes",
  st.cre_at AS "createdAt",
  st.upd_at AS "updatedAt",
  st.from_bra_id AS "fromBranchId",
  st.to_bra_id AS "toBranchId",
  st.req_usr_id AS "requesterUserId",
  st.app_usr_id AS "approverUserId",
  fb.nam_bra AS "fromBranchName",
  tb.nam_bra AS "toBranchName",
  ru.usr_usr AS "requesterUsername",
  au.usr_usr AS "approverUsername"
FROM stock_transfers st
INNER JOIN branches fb ON st.from_bra_id = fb.id
INNER JOIN branches tb ON st.to_bra_id = tb.id
INNER JOIN users ru ON st.req_usr_id = ru.id
LEFT JOIN users au ON st.app_usr_id = au.id
WHERE ($1::uuid IS NULL OR st.from_bra_id = $1 OR st.to_bra_id = $1)
  AND ($2::varchar IS NULL OR st.sta_tra = $2)
ORDER BY st.cre_at DESC
LIMIT $3 OFFSET $4;