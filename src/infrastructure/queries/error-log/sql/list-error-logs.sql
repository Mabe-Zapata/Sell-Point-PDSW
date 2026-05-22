-- List error logs with filters
SELECT
  el.id,
  el.exc_typ AS "exceptionType",
  el.mes_err AS "message",
  el.sta_tra AS "stackTrace",
  el.src_err AS "source",
  el.usr_id AS "userId",
  el.cre_at AS "createdAt",
  usr.usr_usr AS "userUsername"
FROM error_logs el
LEFT JOIN users usr ON el.usr_id = usr.id
WHERE ($1::varchar IS NULL OR el.exc_typ = $1)
  AND ($2::timestamp IS NULL OR el.cre_at >= $2)
  AND ($3::timestamp IS NULL OR el.cre_at <= $3)
ORDER BY el.cre_at DESC
LIMIT $4 OFFSET $5;