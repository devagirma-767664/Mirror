const pool = require('../db');
const round = value => Math.round((Number(value) || 0) * 100) / 100;
const sum = (rows, field) => round(rows.reduce((total, row) => total + Number(row[field] || 0), 0));
const addDays = (day, n) => new Date(Date.parse(`${day}T00:00:00Z`) + n * 86400000).toISOString().slice(0,10);
function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0,10) !== value) throw new Error('Choose a valid report date.');
  return value;
}
function periodFor(kind, date, today) {
  date = validDate(date || today);
  if (date > today) throw new Error('Choose today or an earlier report date.');
  if (!['rolling','weekly','monthly','daily'].includes(kind)) throw new Error('Choose a weekly or monthly report.');
  let start = date, end = date;
  const d = new Date(`${date}T00:00:00Z`);
  if (kind === 'rolling') start = addDays(date,-6);
  if (kind === 'weekly') { start = addDays(date,-((d.getUTCDay()+6)%7)); end = addDays(start,6); }
  if (kind === 'monthly') { start = date.slice(0,7)+'-01'; end = new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).toISOString().slice(0,10); }
  const through = end > today ? today : end;
  const length = Math.round((Date.parse(through)-Date.parse(start))/86400000)+1;
  const previousStart = kind === 'monthly' ? new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()-1,1)).toISOString().slice(0,10) : addDays(start,kind==='weekly'?-7:-length);
  const previousLimit = addDays(start,-1);
  const comparableEnd = addDays(previousStart,length-1);
  return {kind,start,end,through,previousStart,previousEnd:comparableEnd<previousLimit?comparableEnd:previousLimit,partial:through<end};
}
const paid = `WITH paid AS (SELECT DISTINCT ON (appointment_id) *,COALESCE(payment_day,paid_at::date,generated_at::date) AS day
  FROM bills WHERE shop_id=$1 AND paid=true ORDER BY appointment_id,generated_at DESC,id DESC)`;
const numericFields=new Set(['id','customers','collected','sales','vat','commission','expenses','completed','cancelled','working_barbers','average_minutes','amount','count','active_days','monthly_salary','quantity','reorder_level']);
const numeric = row => Object.fromEntries(Object.entries(row).map(([key,value])=>[key, value!==null && numericFields.has(key) ? Number(value) : value]));

async function build(shopId, query, db) {
  const shop = (await db.query('SELECT id,name,currency,timezone,(CURRENT_TIMESTAMP AT TIME ZONE timezone)::date::text AS today FROM shops WHERE id=$1',[shopId])).rows[0];
  if (!shop) throw new Error('Shop not found.');
  const period = periodFor(query.period || 'rolling',query.date,shop.today);
  const args = [shopId,period.start,period.through];
  const financial = (await db.query(`${paid} SELECT day::text,COUNT(*)::int AS customers,SUM(total) AS collected,
    SUM(COALESCE(subtotal,total-COALESCE(tax,0))) AS sales,SUM(COALESCE(tax,0)) AS vat,SUM(COALESCE(commission_amount,0)) AS commission
    FROM paid WHERE day BETWEEN $2 AND $3 GROUP BY day ORDER BY day`,[shopId,period.previousStart,period.through])).rows.map(numeric);
  const expenseDays = (await db.query('SELECT expense_date::text AS day,SUM(amount) AS expenses FROM expenses WHERE shop_id=$1 AND expense_date BETWEEN $2 AND $3 GROUP BY expense_date',[shopId,period.previousStart,period.through])).rows.map(numeric);
  const operations = (await db.query(`SELECT COALESCE(end_time,start_time)::date::text AS day,
    COUNT(*) FILTER(WHERE status='Completed')::int AS completed,COUNT(*) FILTER(WHERE status='Cancelled')::int AS cancelled,
    COUNT(DISTINCT barber_id) FILTER(WHERE status='Completed')::int AS working_barbers,
    ROUND(AVG(actual_duration) FILTER(WHERE status='Completed' AND actual_duration>0),1) AS average_minutes
    FROM appointments WHERE shop_id=$1 AND COALESCE(end_time,start_time)::date BETWEEN $2 AND $3 GROUP BY 1`,args)).rows.map(numeric);
  const daily=[];
  for(let day=period.start;day<=period.through;day=addDays(day,1)) daily.push({day,customers:0,collected:0,sales:0,vat:0,commission:0,expenses:0,completed:0,cancelled:0,working_barbers:0,average_minutes:null,...financial.find(r=>r.day===day),...expenseDays.find(r=>r.day===day),...operations.find(r=>r.day===day)});
  // The overview uses a fixed Monday–Sunday canvas. Future days stay empty until
  // they happen, while financial totals and detailed reports still stop at today.
  const chartDaily=period.kind==='weekly' ? Array.from({length:7},(_,index)=>{
    const day=addDays(period.start,index);
    return daily.find(row=>row.day===day)||{day,customers:0,collected:0,sales:0,vat:0,commission:0,expenses:0,completed:0,cancelled:0,working_barbers:0,average_minutes:null};
  }) : daily;
  const totals = {sales:sum(daily,'sales'),collected:sum(daily,'collected'),vat:sum(daily,'vat'),expenses:sum(daily,'expenses'),customers:sum(daily,'customers'),completed:sum(daily,'completed'),cancelled:sum(daily,'cancelled'),commission:sum(daily,'commission')};
  totals.cashMovement=round(totals.collected-totals.expenses);
  totals.operatingBalance=round(totals.sales-totals.expenses);
  totals.averageTicket=totals.customers?round(totals.sales/totals.customers):0;
  const previousRows=financial.filter(r=>r.day>=period.previousStart&&r.day<=period.previousEnd);
  const previous={sales:sum(previousRows,'sales'),customers:sum(previousRows,'customers'),expenses:sum(expenseDays.filter(r=>r.day>=period.previousStart&&r.day<=period.previousEnd),'expenses')};
  const accounts = (await db.query(`${paid}, collected AS (SELECT payment_account_id AS id,COALESCE(payment_method,'unknown') AS method,
      COUNT(*)::int AS count,SUM(total) AS collected FROM paid WHERE day BETWEEN $2 AND $3 GROUP BY 1,2), spent AS (
      SELECT payment_account_id AS id,COALESCE(payment_method,'unknown') AS method,SUM(amount) AS expenses FROM expenses WHERE shop_id=$1 AND expense_date BETWEEN $2 AND $3 GROUP BY 1,2)
    SELECT COALESCE(c.id,e.id) AS id,COALESCE(a.name,'Account not recorded') AS name,COALESCE(c.method,e.method) AS method,
      COALESCE(c.count,0) AS count,COALESCE(c.collected,0) AS collected,COALESCE(e.expenses,0) AS expenses
    FROM collected c FULL JOIN spent e ON c.id IS NOT DISTINCT FROM e.id AND c.method=e.method
    LEFT JOIN payment_accounts a ON a.id=COALESCE(c.id,e.id) AND a.shop_id=$1 ORDER BY method,name`,args)).rows.map(numeric);
  const methods=[...new Set(accounts.map(a=>a.method))].map(method=>({method,collected:sum(accounts.filter(a=>a.method===method),'collected')}));
  const categories = (await db.query('SELECT category,SUM(amount) AS amount,COUNT(*)::int AS count FROM expenses WHERE shop_id=$1 AND expense_date BETWEEN $2 AND $3 GROUP BY category ORDER BY amount DESC',args)).rows.map(numeric);
  const expenses = (await db.query(`SELECT e.id,e.expense_date::text AS day,e.category,e.description,e.amount,COALESCE(e.payment_account_name,'Account not recorded') AS account,u.name AS recorded_by
    FROM expenses e LEFT JOIN users u ON u.id=e.recorded_by WHERE e.shop_id=$1 AND expense_date BETWEEN $2 AND $3 ORDER BY e.expense_date DESC,e.id DESC`,args)).rows.map(numeric);
  const barbers = (await db.query(`${paid}, sales AS (SELECT barber_id,COUNT(*)::int AS customers,SUM(COALESCE(subtotal,total-COALESCE(tax,0))) AS sales,
      SUM(COALESCE(commission_amount,0)) AS commission FROM paid WHERE day BETWEEN $2 AND $3 GROUP BY barber_id), work AS (
      SELECT barber_id,COUNT(*)::int AS completed,COUNT(DISTINCT end_time::date)::int AS active_days,ROUND(AVG(actual_duration) FILTER(WHERE actual_duration>0),1) AS average_minutes
      FROM appointments WHERE shop_id=$1 AND status='Completed' AND COALESCE(end_time,start_time)::date BETWEEN $2 AND $3 GROUP BY barber_id)
    SELECT u.id,u.name,u.desk_status,COALESCE(s.customers,0) AS customers,COALESCE(s.sales,0) AS sales,COALESCE(s.commission,0) AS commission,
      COALESCE(w.completed,0) AS completed,COALESCE(w.active_days,0) AS active_days,w.average_minutes,COALESCE(c.mode,'salary') AS pay_mode,COALESCE(c.salary_amount,0) AS monthly_salary
    FROM users u LEFT JOIN sales s ON s.barber_id=u.id LEFT JOIN work w ON w.barber_id=u.id LEFT JOIN barber_compensation c ON c.barber_id=u.id AND c.shop_id=$1
    WHERE u.shop_id=$1 AND u.role='barber' ORDER BY sales DESC,u.name`,args)).rows.map(numeric);
  const services = (await db.query(`${paid} SELECT COALESCE(line->>'name',service_name,'Service') AS name,COUNT(*)::int AS count,
    SUM(COALESCE((line->>'price')::numeric,subtotal,total-COALESCE(tax,0))) AS sales
    FROM paid LEFT JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(items)='array' AND jsonb_array_length(items)>0 THEN items ELSE '[null]'::jsonb END) line ON true
    WHERE day BETWEEN $2 AND $3 GROUP BY 1 ORDER BY sales DESC`,args)).rows.map(numeric);
  const closings=(await db.query(`SELECT c.id,c.business_date::text AS day,c.closed_at,u.name AS closed_by,c.notes,c.snapshot
    FROM daily_closings c LEFT JOIN users u ON u.id=c.closed_by WHERE c.shop_id=$1 AND c.business_date BETWEEN $2 AND $3 AND c.reopened_at IS NULL ORDER BY business_date DESC`,args)).rows.map(c=>({id:c.id,day:c.day,closedBy:c.closed_by,closedAt:c.closed_at,notes:c.notes,collected:Number(c.snapshot.collected),differences:(c.snapshot.accounts||[]).filter(a=>a.method==='cash').map(a=>({name:a.name,counted:a.counted||0,expected:a.expected_cash||0,difference:a.difference||0}))}));
  const stock=(await db.query('SELECT id,name,quantity,reorder_level,unit,supplier FROM inventory_items WHERE shop_id=$1 AND active=true AND quantity<=reorder_level ORDER BY quantity,name',[shopId])).rows.map(numeric);
  const team=(await db.query('SELECT role,COUNT(*)::int AS count FROM users WHERE shop_id=$1 GROUP BY role',[shopId])).rows;
  const requests=(await db.query("SELECT COUNT(*)::int AS count FROM day_off_requests WHERE shop_id=$1 AND LOWER(status)='pending'",[shopId])).rows[0].count;
  return {shop,period,totals,previous,daily,chartDaily,accounts,methods,categories,expenses,barbers,services,closings,stock,team,requests,generatedAt:new Date().toISOString()};
}
module.exports={periodFor,addDays,async report(shopId,query={},executor){
  if(executor)return build(shopId,query,executor);
  const db=await pool.connect();
  try{await db.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');const result=await build(shopId,query,db);await db.query('COMMIT');return result;}
  catch(error){await db.query('ROLLBACK');throw error;}finally{db.release();}
}};
