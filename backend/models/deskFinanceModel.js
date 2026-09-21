const pool = require('../db');
const Compensation = require('./compensationModel');

const methods = ['cash', 'bank_transfer', 'telebirr'];
const cents = (value) => Math.round(Number(value) * 100);
const money = (value, label = 'Amount') => {
  if (value === '' || value === null || value === undefined || !Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > 999999999 || Math.abs(Number(value) * 100 - cents(value)) > 0.00001) throw new Error(`${label} must be a valid amount with at most two decimal places.`);
  return cents(value) / 100;
};
const text = (value, max, label, required = true) => {
  const result = String(value ?? '').trim();
  if ((required && !result) || result.length > max) throw new Error(`${label} is required and must be at most ${max} characters.`);
  return result;
};

async function transaction(fn) {
  const client = await pool.connect();
  try { await client.query('BEGIN'); const value = await fn(client); await client.query('COMMIT'); return value; }
  catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}
async function shopDay(shopId, db = pool, lock = false) {
  const result = await db.query(`SELECT id,name,plan_code,currency,timezone,vat_enabled,vat_rate,(CURRENT_TIMESTAMP AT TIME ZONE timezone)::date::text AS today FROM shops WHERE id=$1 ${lock ? 'FOR UPDATE' : ''}`, [shopId]);
  if (!result.rows[0]) throw new Error('Shop not found.');
  return result.rows[0];
}
async function startOpenBusinessDays(db = pool) {
  await db.query(`INSERT INTO business_days(shop_id,business_date)
    SELECT id,(CURRENT_TIMESTAMP AT TIME ZONE timezone)::date FROM shops
    ON CONFLICT(shop_id,business_date) DO NOTHING`);
}
function validDay(date, today) {
  const value = date || today;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value || value > today) throw new Error('Choose today or an earlier valid date.');
  return value;
}
async function assertOpen(shopId, day, db) {
  if ((await db.query('SELECT id FROM daily_closings WHERE shop_id=$1 AND business_date=$2 AND reopened_at IS NULL', [shopId, day])).rowCount) throw new Error('This day is closed. Ask the owner to reopen it before recording changes.');
}
async function account(shopId, id, db = pool) {
  const row = (await db.query('SELECT * FROM payment_accounts WHERE id=$1 AND shop_id=$2 AND active=true', [id || null, shopId])).rows[0];
  if (!row) throw new Error('Select an active payment account created by the owner.');
  return row;
}

const Finance = {
  transaction, shopDay, assertOpen, account, money, text, startOpenBusinessDays,
  async settings(shopId, admin = false) {
    const shop = await shopDay(shopId);
    const accounts = (await pool.query(`SELECT id,name,method,reference,active FROM payment_accounts WHERE shop_id=$1 ${admin ? '' : 'AND active=true'} ORDER BY method,name`, [shopId])).rows;
    return { ...shop, accounts };
  },
  async createAccount(shopId, userId, data) {
    if (!methods.includes(data.method)) throw new Error('Choose Cash, Bank transfer, or Telebirr.');
    let name = data.method==='cash' ? 'Cash' : text(data.name, 100, 'Account name');
    const reference = data.method==='cash' ? '' : text(data.reference, 100, 'Account number or phone');
    return transaction(async (db) => {
      await shopDay(shopId, db, true);
      if(data.method==='cash') {
        // Cash has no owner-entered account details. Reuse its ledger so enabling
        // it repeatedly cannot split daily cash totals across duplicate accounts.
        const existing=(await db.query("SELECT * FROM payment_accounts WHERE shop_id=$1 AND method='cash' ORDER BY active DESC,id LIMIT 1",[shopId])).rows[0];
        if(existing) return (await db.query("UPDATE payment_accounts SET name='Cash',active=true,reference='' WHERE id=$1 RETURNING *",[existing.id])).rows[0];
        const used=new Set((await db.query('SELECT name FROM payment_accounts WHERE shop_id=$1',[shopId])).rows.map(a=>a.name));
        for(let n=1;used.has(name);n++) name=n===1?'Cash till':`Cash till ${n}`;
      }
      return (await db.query('INSERT INTO payment_accounts(shop_id,name,method,reference,created_by) VALUES($1,$2,$3,$4,$5) RETURNING *', [shopId,name,data.method,reference,userId])).rows[0];
    });
  },
  async setAccountActive(shopId, id, active) {
    if (typeof active !== 'boolean') throw new Error('Account status must be active or inactive.');
    return transaction(async (db) => {
      await shopDay(shopId, db, true);
      const row = (await db.query('UPDATE payment_accounts SET active=$3 WHERE shop_id=$1 AND id=$2 RETURNING *', [shopId,id,active])).rows[0];
      if (!row) throw new Error('Account not found.');
      return row;
    });
  },
  async setVat(shopId, data) {
    if (typeof data.vatEnabled !== 'boolean') throw new Error('VAT must be on or off.');
    const rate = money(data.vatRate, 'VAT rate');
    if (rate > 100 || (data.vatEnabled && rate <= 0)) throw new Error('VAT rate must be greater than zero and at most 100.');
    return transaction(async (db) => {
      await shopDay(shopId, db, true);
      return (await db.query('UPDATE shops SET vat_enabled=$2,vat_rate=$3 WHERE id=$1 RETURNING vat_enabled,vat_rate', [shopId,data.vatEnabled,rate])).rows[0];
    });
  },
  async collect(shopId, userId, billId, data, executor) {
    const collect = async (db) => {
      if (data.addVat !== undefined && typeof data.addVat !== 'boolean') throw new Error('Choose whether to add 15% VAT.');
      const shop = await shopDay(shopId, db, true);
      const bill = (await db.query('SELECT * FROM bills WHERE id=$1 AND shop_id=$2 FOR UPDATE', [billId,shopId])).rows[0];
      if (!bill) throw new Error('Bill not found.');
      // An identical retry is safe, including after closing or account deactivation.
      if (bill.paid) {
        if (Number(bill.payment_account_id) === Number(data.accountId) && Number(bill.received_by) === Number(userId)
          && (bill.transaction_reference || '') === String(data.transactionReference || '').trim()
          && (data.addVat === undefined || Number(bill.vat_rate) === (data.addVat ? 15 : 0))
          && (data.expectedTotal === undefined || cents(money(data.expectedTotal, 'Total')) === cents(bill.total))
          && (bill.payment_method !== 'cash' || cents(money(data.cashReceived, 'Cash received')) === cents(bill.cash_received))) return bill;
        throw new Error('This bill has already been paid.');
      }
      await assertOpen(shopId, shop.today, db);
      // VAT is a per-payment choice, off unless reception explicitly selects it.
      const subtotal = money(bill.subtotal ?? Number(bill.total) - Number(bill.tax || 0), 'Service subtotal');
      const rate = data.addVat === true ? 15 : 0;
      const tax = Math.round(cents(subtotal) * rate / 100) / 100;
      const total = (cents(subtotal) + cents(tax)) / 100;
      if (data.expectedTotal !== undefined && cents(money(data.expectedTotal, 'Total')) !== cents(total)) throw new Error('The service total changed. Reopen checkout to review the updated amount.');
      const selected = await account(shopId, data.accountId, db);
      const ref = text(data.transactionReference, 100, 'Transaction reference', false);
      let received = null;
      if (selected.method === 'cash') {
        received = money(data.cashReceived, 'Cash received');
        if (cents(received) < cents(total)) throw new Error('Cash received must cover the bill.');
      } else if (data.paymentVerified !== true) throw new Error('Confirm the payment arrived in the selected account.');
      if (ref && (await db.query('SELECT id FROM bills WHERE shop_id=$1 AND payment_account_id=$2 AND transaction_reference=$3 AND paid=true', [shopId,selected.id,ref])).rowCount) throw new Error('This transaction reference has already been used for this account.');
      const commission = bill.barber_id
        ? await Compensation.snapshotForBill(shopId, bill.barber_id, subtotal, db)
        : { rate: null, base: null, amount: null };
      return (await db.query(`UPDATE bills SET paid=true,paid_at=CURRENT_TIMESTAMP AT TIME ZONE $10,received_by=$3,payment_method=$4,
        payment_account_id=$5,payment_account_name=$6,payment_account_reference=$7,transaction_reference=$8,cash_received=$9,
        payment_day=$11,payment_recorded_at=NOW(),commission_rate=$12,commission_base=$13,commission_amount=$14,
        subtotal=$15,tax=$16,total=$17,vat_rate=$18 WHERE id=$1 AND shop_id=$2 RETURNING *`,
      [billId,shopId,userId,selected.method,selected.id,selected.name,selected.reference,ref || null,received,shop.timezone,shop.today,commission.rate,commission.base,commission.amount,subtotal,tax,total,rate])).rows[0];
    };
    return executor ? collect(executor) : transaction(collect);
  },
  async expense(shopId, userId, data) {
    const amount = money(data.amount);
    if (amount <= 0) throw new Error('Expense must be greater than zero.');
    return transaction(async (db) => {
      const shop = await shopDay(shopId, db, true);
      const day = validDay(data.expenseDate, shop.today);
      await assertOpen(shopId, day, db);
      const selected = await account(shopId, data.accountId, db);
      return (await db.query(`INSERT INTO expenses(shop_id,category,description,amount,expense_date,recorded_by,payment_account_id,payment_account_name,payment_method)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`, [shopId,text(data.category,80,'Category'),text(data.description,220,'Description'),amount,day,userId,selected.id,selected.name,selected.method])).rows[0];
    });
  },
  async daily(shopId, date, db = pool, live = false) {
    const shop = await shopDay(shopId, db);
    const day = validDay(date, shop.today);
    if (day === shop.today) await db.query('INSERT INTO business_days(shop_id,business_date) VALUES($1,$2) ON CONFLICT DO NOTHING',[shopId,day]);
    const closing = (await db.query(`SELECT c.*,u.name AS closed_by_name FROM daily_closings c LEFT JOIN users u ON u.id=c.closed_by WHERE c.shop_id=$1 AND c.business_date=$2 AND c.reopened_at IS NULL`, [shopId,day])).rows[0];
    if (closing && !live) return { ...closing.snapshot, closing: { id:closing.id,closed_at:closing.closed_at,closed_by_name:closing.closed_by_name,notes:closing.notes } };
    const accounts = (await db.query('SELECT id,name,method,reference,active FROM payment_accounts WHERE shop_id=$1 ORDER BY method,name', [shopId])).rows;
    const payments = (await db.query(`SELECT payment_account_id AS account_id,COALESCE(payment_method,'unknown') AS method,COUNT(*)::int AS count,
      SUM(total) AS collected,SUM(COALESCE(subtotal,total-COALESCE(tax,0))) AS services,SUM(COALESCE(tax,0)) AS vat
      FROM (SELECT DISTINCT ON (appointment_id) * FROM bills WHERE shop_id=$1 AND paid=true ORDER BY appointment_id,generated_at DESC,id DESC) b
      WHERE COALESCE(payment_day,paid_at::date,generated_at::date)=$2 GROUP BY 1,2`, [shopId,day])).rows;
    const expenses = (await db.query(`SELECT payment_account_id AS account_id,COALESCE(payment_method,'unknown') AS method,COUNT(*)::int AS count,SUM(amount) AS expenses FROM expenses WHERE shop_id=$1 AND expense_date=$2 GROUP BY 1,2`, [shopId,day])).rows;
    const openings = (await db.query('SELECT account_id,amount FROM daily_opening_cash WHERE shop_id=$1 AND business_date=$2', [shopId,day])).rows;
    const rows = accounts.map(a => ({ ...a, collected:0,services:0,vat:0,expenses:0,count:0,opening:0,opening_set:false }));
    function getRow(entry) {
      let row = rows.find(r => r.id === entry.account_id && (entry.account_id || r.method === entry.method));
      if (!row) { row = { id:null,name:'Legacy — account not recorded',method:entry.method,reference:'',active:false,collected:0,services:0,vat:0,expenses:0,count:0,opening:0,opening_set:false }; rows.push(row); }
      return row;
    }
    payments.forEach(p => Object.assign(getRow(p), {collected:Number(p.collected),services:Number(p.services),vat:Number(p.vat),count:p.count}));
    expenses.forEach(e => { getRow(e).expenses = Number(e.expenses); });
    openings.forEach(o => { const r=rows.find(a=>a.id===o.account_id); if(r) { r.opening=Number(o.amount); r.opening_set=true; } });
    rows.forEach(r => { r.net=(cents(r.collected)-cents(r.expenses))/100; r.expected_cash=r.method==='cash' ? (cents(r.opening)+cents(r.net))/100 : null; });
    const visible = rows.filter(r=>r.active || r.collected || r.expenses || r.opening_set);
    const total = key => rows.reduce((sum,r)=>sum+cents(r[key]),0)/100;
    const pending = (await db.query('SELECT COUNT(*)::int AS count,COALESCE(SUM(total),0) AS total FROM bills WHERE shop_id=$1 AND paid=false AND generated_at::date <= $2', [shopId,day])).rows[0];
    const inShop = (await db.query("SELECT COUNT(*)::int AS count FROM appointments WHERE shop_id=$1 AND status IN ('Arrived','InProgress') AND start_time::date <= $2", [shopId,day])).rows[0].count;
    const byMethod = [...new Set(visible.map(r=>r.method))].map(method=>({method,collected:visible.filter(r=>r.method===method).reduce((s,r)=>s+cents(r.collected),0)/100}));
    return { date:day,today:shop.today,currency:shop.currency,accounts:visible,methods:byMethod,collected:total('collected'),services:total('services'),vat:total('vat'),expenses:total('expenses'),net:total('net'),pending,inShop,closing:null,autoStarted:day===shop.today };
  },
  async opening(shopId,userId,data) {
    return transaction(async db=>{
      const shop=await shopDay(shopId,db,true); const day=validDay(data.date,shop.today);
      await assertOpen(shopId,day,db);
      const selected=await account(shopId,data.accountId,db);
      if(selected.method!=='cash') throw new Error('Opening cash applies only to a cash account.');
      return (await db.query(`INSERT INTO daily_opening_cash(shop_id,business_date,account_id,amount,recorded_by) VALUES($1,$2,$3,$4,$5)
        ON CONFLICT(shop_id,business_date,account_id) DO UPDATE SET amount=EXCLUDED.amount,recorded_by=EXCLUDED.recorded_by,updated_at=NOW() RETURNING *`, [shopId,day,selected.id,money(data.amount,'Opening cash'),userId])).rows[0];
    });
  },
  async closeDay(shopId,userId,data) {
    return transaction(async db=>{
      const shop=await shopDay(shopId,db,true); const day=validDay(data.date,shop.today);
      await assertOpen(shopId,day,db);
      const report=await this.daily(shopId,day,db,true);
      if(report.inShop) throw new Error('Collect payment or cancel the remaining visits before closing this day.');
      if(report.pending.count) throw new Error('Complete checkout for every finished service before closing the day.');
      const notes=text(data.notes,1000,'Closing note',false);
      let discrepancy=false;
      for(const row of report.accounts.filter(r=>r.method==='cash' && r.id)) {
        row.counted=money(data.cashCounts?.[row.id],`Counted cash for ${row.name}`);
        row.difference=(cents(row.counted)-cents(row.expected_cash))/100;
        if(row.difference) discrepancy=true;
      }
      if((discrepancy || report.accounts.some(r=>!r.id)) && !notes) throw new Error('Add a handover note explaining cash differences or unallocated legacy entries.');
      if(data.digitalVerified!==true && report.accounts.some(r=>r.method!=='cash' && r.collected>0)) throw new Error('Check the digital collections against the receiving accounts before closing.');
      await db.query('INSERT INTO daily_closings(shop_id,business_date,snapshot,notes,closed_by) VALUES($1,$2,$3,$4,$5)', [shopId,day,JSON.stringify(report),notes,userId]);
      const closed=await this.daily(shopId,day,db);
      await require('./telegramModel').enqueue(shopId,closed,db);
      return closed;
    });
  },
  async closings(shopId) { return (await pool.query('SELECT id,business_date::text,closed_at,reopened_at,notes,snapshot FROM daily_closings WHERE shop_id=$1 ORDER BY closed_at DESC LIMIT 60',[shopId])).rows; },
  async reopen(shopId,userId,id,reason) {
    return transaction(async db=>{
      await shopDay(shopId,db,true);
      const row=(await db.query('UPDATE daily_closings SET reopened_at=NOW(),reopened_by=$3,reopen_reason=$4 WHERE shop_id=$1 AND id=$2 AND reopened_at IS NULL RETURNING id',[shopId,id,userId,text(reason,500,'Reopening reason')])).rows[0];
      if(!row) throw new Error('Closed day not found.');
      return row;
    });
  },
  startDailyClock() {
    let busy=false;
    const tick=async()=>{if(busy)return;busy=true;try{await startOpenBusinessDays();}catch{console.error('Business-day auto-start could not be processed. Check the local database and migrations.');}finally{busy=false;}};
    const timer=setInterval(tick,15*60*1000);
    timer.unref();void tick();
    return()=>clearInterval(timer);
  },
};
module.exports = Finance;
