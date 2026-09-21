const pool=require('../db');
const Finance=require('./deskFinanceModel');
const Ethiopian=require('../utils/ethiopianCalendar');

const money=value=>{
  if(value===''||value===null||value===undefined||!Number.isFinite(Number(value))||Math.abs(Number(value))>999999999||Math.abs(Number(value)*100-Math.round(Number(value)*100))>.00001) throw new Error('Enter a valid payroll adjustment with at most two decimal places.');
  return Math.round(Number(value)*100)/100;
};
const number=value=>{const n=Number(value);if(!Number.isInteger(n))throw new Error('Choose a valid Ethiopian calendar month.');return n;};
function choice(data={}){
  const current=Ethiopian.currentEthiopianDate();
  const year=data.year===undefined||data.year===''?current.year:number(data.year);
  const month=data.month===undefined||data.month===''?current.month:number(data.month);
  const range=Ethiopian.monthRange(year,month);
  return {year,month,...range};
}
const safeText=(value,max,label)=>Finance.text(value,max,label,false);
async function detail(shopId,selection,db=pool) {
  const run=(await db.query(`SELECT id,ethiopian_year AS year,ethiopian_month AS month,period_start::text,period_end::text,status,created_at,finalized_at
    FROM payroll_runs WHERE shop_id=$1 AND ethiopian_year=$2 AND ethiopian_month=$3`,[shopId,selection.year,selection.month])).rows[0];
  const shop=(await db.query('SELECT currency FROM shops WHERE id=$1',[shopId])).rows[0];
  if(!run)return {run:null,selection,currency:shop?.currency||'ETB',items:[]};
  const items=(await db.query(`SELECT id,user_id AS "userId",employee_name AS "employeeName",role,staff_type AS "staffType",
    base_salary AS "baseSalary",commission_amount AS commission,adjustment,gross_amount AS gross,
    ethiopian_pay_day AS "payDay",pay_due_date::text AS "payDueDate",note,paid_at AS "paidAt",expense_id AS "expenseId",payment_account_name AS "paymentAccountName"
    FROM payroll_items WHERE payroll_run_id=$1 ORDER BY employee_name`,[run.id])).rows.map(row=>({...row,baseSalary:Number(row.baseSalary),commission:Number(row.commission),adjustment:Number(row.adjustment),gross:Number(row.gross),payDay:Number(row.payDay)}));
  return {run:{...run,periodStart:run.period_start,periodEnd:run.period_end},selection,currency:shop?.currency||'ETB',items};
}
const Payroll={
  choice,
  async get(shopId,data={}) {return detail(shopId,choice(data));},
  async prepare(shopId,userId,data={}) {
    const selection=choice(data);
    return Finance.transaction(async db=>{
      const existing=(await db.query('SELECT id FROM payroll_runs WHERE shop_id=$1 AND ethiopian_year=$2 AND ethiopian_month=$3 FOR UPDATE',[shopId,selection.year,selection.month])).rows[0];
      if(existing)return detail(shopId,selection,db);
      const run=(await db.query(`INSERT INTO payroll_runs(shop_id,ethiopian_year,ethiopian_month,period_start,period_end,created_by)
        VALUES($1,$2,$3,$4,$5,$6) RETURNING id`,[shopId,selection.year,selection.month,selection.start,selection.end,userId])).rows[0];
      const employees=(await db.query(`SELECT u.id,u.name,u.role,u.staff_type,u.monthly_salary,
        COALESCE(c.mode,'salary') AS pay_mode,COALESCE(c.salary_amount,0) AS stylist_salary,
        COALESCE(c.pay_day,30) AS pay_day
        FROM users u LEFT JOIN barber_compensation c ON c.barber_id=u.id AND c.shop_id=u.shop_id
        WHERE u.shop_id=$1 AND u.role IN ('barber','receptionist','support') ORDER BY u.name FOR UPDATE OF u`,[shopId])).rows;
      const commissions=(await db.query(`SELECT b.barber_id,COALESCE(SUM(b.commission_amount),0) AS amount
        FROM (SELECT DISTINCT ON (appointment_id) * FROM bills WHERE shop_id=$1 AND paid=true ORDER BY appointment_id,generated_at DESC,id DESC) b
        WHERE COALESCE(b.payment_day,b.paid_at::date,b.generated_at::date) BETWEEN $2 AND $3 AND b.barber_id IS NOT NULL
        GROUP BY b.barber_id`,[shopId,selection.start,selection.end])).rows;
      const earned=new Map(commissions.map(row=>[Number(row.barber_id),Number(row.amount)]));
      for(const employee of employees){
        const stylist=employee.role==='barber';
        const base=stylist&&employee.pay_mode==='commission'?0:Number(stylist?employee.stylist_salary:employee.monthly_salary||0);
        const commission=stylist&&employee.pay_mode!=='salary'?(earned.get(Number(employee.id))||0):0;
        const payDay=Math.min(Number(employee.pay_day)||30,Ethiopian.daysInMonth(selection.year,selection.month));
        const due=Ethiopian.toGregorian(selection.year,selection.month,payDay);
        await db.query(`INSERT INTO payroll_items(payroll_run_id,user_id,employee_name,role,staff_type,base_salary,commission_amount,gross_amount,ethiopian_pay_day,pay_due_date)
          VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,[run.id,employee.id,employee.name,employee.role,employee.staff_type,base,commission,base+commission,payDay,due]);
      }
      return detail(shopId,selection,db);
    });
  },
  async updateItem(shopId,userId,itemId,data={}) {
    const item=(await pool.query(`SELECT i.*,r.shop_id,r.status FROM payroll_items i JOIN payroll_runs r ON r.id=i.payroll_run_id WHERE i.id=$1 AND r.shop_id=$2 FOR UPDATE`,[itemId,shopId])).rows[0];
    if(!item)throw new Error('Payroll item not found.');
    if(item.status!=='draft')throw new Error('Finalized payroll cannot be changed.');
    const adjustment=money(data.adjustment??item.adjustment);
    const note=safeText(data.note??item.note,500,'Payroll note');
    const gross=Math.round((Number(item.base_salary)+Number(item.commission_amount)+adjustment)*100)/100;
    return (await pool.query(`UPDATE payroll_items SET adjustment=$2,note=$3,gross_amount=$4 WHERE id=$1
      RETURNING id,adjustment,note,gross_amount AS gross`,[itemId,adjustment,note,gross])).rows[0];
  },
  async finalize(shopId,userId,runId) {
    const row=(await pool.query(`UPDATE payroll_runs SET status='finalized',finalized_at=NOW(),finalized_by=$3
      WHERE id=$1 AND shop_id=$2 AND status='draft' RETURNING ethiopian_year AS year,ethiopian_month AS month`,[runId,shopId,userId])).rows[0];
    if(!row)throw new Error('Only a draft payroll can be finalized.');
    return detail(shopId,choice(row));
  },
  async markPaid(shopId,userId,itemId,data={}) {
    return Finance.transaction(async db=>{
      const item=(await db.query(`SELECT i.*,r.shop_id,r.status,r.ethiopian_year,r.ethiopian_month FROM payroll_items i
        JOIN payroll_runs r ON r.id=i.payroll_run_id WHERE i.id=$1 AND r.shop_id=$2 FOR UPDATE`,[itemId,shopId])).rows[0];
      if(!item)throw new Error('Payroll item not found.');
      if(item.paid_at)return {paid:true,expenseId:item.expense_id};
      if(item.status!=='finalized')throw new Error('Finalize the payroll before marking a payment made.');
      const shop=await Finance.shopDay(shopId,db,true);
      await Finance.assertOpen(shopId,shop.today,db);
      const account=await Finance.account(shopId,data.accountId,db);
      const description=`Salary · ${item.employee_name} · Ethiopian ${item.ethiopian_year}/${item.ethiopian_month}`;
      const expense=(await db.query(`INSERT INTO expenses(shop_id,category,description,amount,expense_date,recorded_by,payment_account_id,payment_account_name,payment_method)
        VALUES($1,'Salary',$2,$3,$4,$5,$6,$7,$8) RETURNING id`,[shopId,description,Number(item.gross_amount),shop.today,userId,account.id,account.name,account.method])).rows[0];
      await db.query(`UPDATE payroll_items SET paid_at=NOW(),expense_id=$2,payment_account_id=$3,payment_account_name=$4 WHERE id=$1`,[itemId,expense.id,account.id,account.name]);
      return {paid:true,expenseId:expense.id};
    });
  },
};
module.exports=Payroll;
