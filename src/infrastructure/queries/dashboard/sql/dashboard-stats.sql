-- Dashboard stats aggregation
SELECT
  COALESCE(SUM(sal.tot_sal), 0) AS total_revenue,
  COUNT(sal.id) AS total_sales,
  COALESCE(SUM(sal.tot_sal) FILTER (WHERE DATE(sal.cre_at) = CURRENT_DATE), 0) AS today_revenue,
  COUNT(sal.id) FILTER (WHERE DATE(sal.cre_at) = CURRENT_DATE) AS today_sales
FROM sales sal
WHERE ($1::uuid IS NULL OR sal.bra_id = $1)
  AND sal.sta_sal = 'CONFIRMED';