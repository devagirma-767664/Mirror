const pool=require('../db');
const Finance=require('./deskFinanceModel');
const ReceiptStore=require('./subscriptionReceiptStore');

const requestColumns=`r.id,r.shop_id,r.requested_by,r.request_key,r.action,r.plan_code,r.plan_name,r.amount,r.currency,
  r.payment_account_id,r.payment_account_name,r.payment_method,r.payment_destination,r.transaction_reference,r.status,
  r.subscription_revision,r.requested_at,r.reviewed_at,r.reviewed_by,r.review_note,r.period_end::text AS period_end,
  r.receipt_original_name,r.receipt_mime_type,r.receipt_size,(r.receipt_path IS NOT NULL) AS receipt_available`;
const withoutPrivateReceipt=row=>{if(!row)return row;const {receipt_path,...safe}=row;return safe;};

function access(shop,now=new Date()) {
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:shop.timezone||'Africa/Addis_Ababa',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
  const end=shop.trial_ends_at?new Date(shop.trial_ends_at):null;
  const period=shop.current_period_end instanceof Date?shop.current_period_end.toLocaleDateString('en-CA'):shop.current_period_end?.slice(0,10);
  const status=shop.subscription_status==='trial'&&(!end||end<=now)?'trial_expired':shop.subscription_status==='active'&&period&&period<today?'past_due':shop.subscription_status;
  return {status,canOperate:['trial','active'].includes(status),canRequestWebsite:status==='active'&&shop.tier==='max'&&!!period&&shop.features?.publicWebsite===true,
    canUseTelegram:status==='trial'||(status==='active'&&shop.features?.telegramDigest===true),trialEndsAt:end?.toISOString()||null,
    daysRemaining:status==='trial'?Math.max(0,Math.ceil((end-now)/86400000)):0,periodEnd:period||null,onboardingComplete:!!shop.onboarding_completed_at};
}
async function lockedShop(db,id) {
  const row=(await db.query('SELECT *,current_period_end::text AS current_period_end FROM shops WHERE id=$1 FOR UPDATE',[id])).rows[0];
  if(!row) throw new Error('Shop not found.');
  return row;
}
async function checkStaffLimit(db,shopId,plan) {
  const count=Number((await db.query("SELECT COUNT(*) AS n FROM users WHERE has_workspace=true AND shop_id=$1",[shopId])).rows[0].n);
  if(plan.limits?.staff && count>Number(plan.limits.staff)) throw new Error(`${plan.name} supports ${plan.limits.staff} accounts, including the owner. Reduce the team before changing packages, or choose a package with more accounts.`);
}
async function assertDailyCustomerLimit(db,shop,day) {
  const plan=(await db.query('SELECT name,limits FROM subscription_plans WHERE code=$1',[shop.plan_code])).rows[0];
  const limit=Number(plan?.limits?.dailyCustomers);
  // Zero means that Mirror Max has no daily customer limit.
  if(!Number.isInteger(limit)||limit<=0)return;
  const count=Number((await db.query(`SELECT COUNT(*) AS n FROM appointments
    WHERE shop_id=$1 AND start_time::date=$2::date AND status NOT IN ('Cancelled','NoShow')`,[shop.id,day])).rows[0].n);
  if(count>=limit)throw new Error(`Daily customer limit reached. ${plan.name} allows up to ${limit} customers each day. Choose a higher package to serve more.`);
}
const Subscription={
  access,
  assertDailyCustomerLimit,
  GRANT_DURATIONS:[1,3,6,12],
  async details(shopId) {
    const shop=await require('./shopModel').getById(shopId);
    if(!shop) throw new Error('Shop not found.');
    const [plans,accounts,requests]=await Promise.all([
      pool.query('SELECT code,name,monthly_price,description,features,limits,tier,highlights,is_trial_default FROM subscription_plans WHERE active=true ORDER BY monthly_price'),
      pool.query('SELECT id,name,method,reference,account_holder FROM platform_payment_accounts WHERE active=true ORDER BY method,name'),
      pool.query(`SELECT ${requestColumns} FROM subscription_requests r WHERE r.shop_id=$1 ORDER BY r.requested_at DESC LIMIT 30`,[shopId]),
    ]);
    return {shop,access:access(shop),plans:plans.rows,accounts:accounts.rows,requests:requests.rows};
  },
  async request(shopId,userId,data,file) {
    if(!['renew','change'].includes(data.action)||typeof data.planCode!=='string'||!data.planCode.trim()) throw new Error('Choose an available package.');
    if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.requestKey||'')) throw new Error('Reopen package checkout and try again.');
    if(data.paymentConfirmed!==true) throw new Error('Confirm you have transferred the subscription payment.');
    let savedReceipt=null;
    return Finance.transaction(async db=>{
      const shop=await lockedShop(db,shopId);
      const previous=(await db.query('SELECT * FROM subscription_requests WHERE shop_id=$1 AND request_key=$2',[shopId,data.requestKey])).rows[0];
      if(previous) return withoutPrivateReceipt(previous);
      savedReceipt=await ReceiptStore.save(file);
      if(shop.subscription_status==='suspended') throw new Error('This shop is suspended. Contact the platform administrator.');
      if((await db.query("SELECT id FROM subscription_requests WHERE shop_id=$1 AND status='pending'",[shopId])).rowCount) throw new Error('A payment is already awaiting verification.');
      const plan=(await db.query('SELECT * FROM subscription_plans WHERE code=$1 AND active=true FOR SHARE',[data.planCode])).rows[0];
      if(!plan||Number(plan.monthly_price)<=0) throw new Error('This package is not available for purchase.');
      await checkStaffLimit(db,shopId,plan);
      if(Finance.money(data.expectedAmount,'Package price')!==Number(plan.monthly_price)) throw new Error('The package price changed. Refresh and review the amount before paying.');
      const account=(await db.query('SELECT * FROM platform_payment_accounts WHERE id=$1 AND active=true',[data.accountId])).rows[0];
      if(!account) throw new Error('Choose an active platform payment account.');
      const result=(await db.query(`INSERT INTO subscription_requests(shop_id,requested_by,request_key,action,plan_code,plan_name,amount,
        payment_account_id,payment_account_name,payment_method,payment_destination,transaction_reference,
        receipt_path,receipt_original_name,receipt_mime_type,receipt_size,subscription_revision)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NULL,$12,$13,$14,$15,$16) RETURNING *`,
      [shopId,userId,data.requestKey,data.action,plan.code,plan.name,plan.monthly_price,account.id,account.name,account.method,account.reference,
        savedReceipt.path,savedReceipt.originalName,savedReceipt.mimeType,savedReceipt.size,shop.subscription_revision])).rows[0];
      await require('./platformEventModel').shopEvent(db,shopId,{key:`payment_requested:${result.id}`,kind:'payment_requested',title:'Payment approval needed',details:`${plan.name} · ETB ${Number(plan.monthly_price).toLocaleString('en-US')}\n${account.name} · Transfer receipt attached`,path:`/platform?view=billing&request=${result.id}`});
      return withoutPrivateReceipt(result);
    }).catch(async error=>{if(savedReceipt?.path) await ReceiptStore.remove(savedReceipt.path);throw error;});
  },
  async cancel(shopId) {
    return Finance.transaction(async db=>{
      const shop=await lockedShop(db,shopId);
      if(shop.subscription_status==='cancelled') return {id:shop.id,subscription_status:'cancelled'};
      if((await db.query("SELECT id FROM subscription_requests WHERE shop_id=$1 AND status='pending'",[shopId])).rowCount) throw new Error('A transferred payment is awaiting verification. Resolve it with the platform administrator before cancelling.');
      const result=(await db.query("UPDATE shops SET subscription_status='cancelled',cancelled_at=NOW(),subscription_revision=subscription_revision+1 WHERE id=$1 RETURNING id,subscription_status,subscription_revision",[shopId])).rows[0];
      await require('./telegramModel').enforceEligibility(db,shopId);
      await require('./platformEventModel').shopEvent(db,shopId,{key:`cancelled:${shopId}:${result.subscription_revision}`,kind:'cancelled',title:'Owner cancelled their subscription'});
      return result;
    });
  },
  async grant(shopId,userId,data={}) {
    const durationMonths=Number(data.durationMonths);
    if(!Number.isInteger(Number(shopId))||Number(shopId)<1) throw new Error('Choose a shop whose trial has ended.');
    if(!this.GRANT_DURATIONS.includes(durationMonths)) throw new Error('Choose 1, 3, 6, or 12 months for the complimentary subscription.');
    const planCode=String(data.planCode||'').trim();
    if(!planCode) throw new Error('Choose the package to grant.');
    const note=Finance.text(data.note,500,'Grant note',false);
    return Finance.transaction(async db=>{
      const shop=await lockedShop(db,shopId);
      if(access(shop).status!=='trial_expired') throw new Error('Complimentary subscriptions can only be granted after this shop has completed its free trial.');
      if((await db.query("SELECT id FROM subscription_requests WHERE shop_id=$1 AND status='pending'",[shopId])).rowCount) throw new Error('Resolve the shop’s pending payment request before granting complimentary access.');
      const plan=(await db.query('SELECT * FROM subscription_plans WHERE code=$1 AND active=true FOR SHARE',[planCode])).rows[0];
      if(!plan) throw new Error('Choose an available package.');
      await checkStaffLimit(db,shop.id,plan);
      const activated=(await db.query(`UPDATE shops SET plan_code=$2::varchar,subscription_status='active',subscription_source='free_grant',cancelled_at=NULL,
        current_period_end=(((NOW() AT TIME ZONE timezone)::date+make_interval(months=>$3)-INTERVAL '1 day')::date),subscription_revision=subscription_revision+1
        WHERE id=$1 RETURNING id,plan_code,current_period_end::text AS period_end,subscription_revision`,[shop.id,plan.code,durationMonths])).rows[0];
      await db.query(`INSERT INTO subscription_grants(shop_id,granted_by,plan_code,plan_name,duration_months,starts_on,ends_on,note)
        VALUES($1,$2,$3,$4,$5,(NOW() AT TIME ZONE $6)::date,$7::date,$8)`,[shop.id,userId,plan.code,plan.name,durationMonths,shop.timezone||'Africa/Addis_Ababa',activated.period_end,note]);
      await require('./telegramModel').enforceEligibility(db,shop.id);
      await require('./shopNotificationModel').create(db,shop.id,{kind:'subscription',createdBy:userId,
        title:'Complimentary subscription activated',
        body:`${plan.name} is active through ${activated.period_end} on a ${durationMonths}-month complimentary subscription.${note?` ${note}`:''}`,
        path:'/admin?view=package'});
      await require('./platformEventModel').shopEvent(db,shop.id,{key:`free_grant:${shop.id}:${activated.subscription_revision}`,kind:'complimentary_subscription',title:'Complimentary subscription granted',details:`${plan.name} · ${durationMonths} month${durationMonths===1?'':'s'} · through ${activated.period_end}`,path:`/platform?view=shops&shop=${shop.id}`});
      return {shopId:shop.id,planCode:plan.code,planName:plan.name,durationMonths,periodEnd:activated.period_end,subscriptionSource:'free_grant'};
    });
  },
  async accounts() {return (await pool.query('SELECT * FROM platform_payment_accounts ORDER BY id')).rows;},
  async saveAccount(userId,data) {
    if(!['bank_transfer','telebirr'].includes(data.method)) throw new Error('Choose bank transfer or Telebirr.');
    return (await pool.query('INSERT INTO platform_payment_accounts(name,method,reference,account_holder,created_by) VALUES($1,$2,$3,$4,$5) RETURNING *',
      [Finance.text(data.name,100,'Account name'),data.method,Finance.text(data.reference,100,'Account number'),Finance.text(data.accountHolder,140,'Account holder'),userId])).rows[0];
  },
  async setAccount(id,active) {
    if(typeof active!=='boolean') throw new Error('Choose active or inactive.');
    const row=(await pool.query('UPDATE platform_payment_accounts SET active=$2 WHERE id=$1 RETURNING *',[id,active])).rows[0];
    if(!row) throw new Error('Account not found.');return row;
  },
  async requests() {return (await pool.query(`SELECT ${requestColumns},s.name AS shop_name,u.email AS owner_email
    FROM subscription_requests r JOIN shops s ON s.id=r.shop_id JOIN users u ON u.id=r.requested_by
    ORDER BY (r.status='pending') DESC,r.requested_at DESC LIMIT 200`)).rows;},
  async requestById(id){
    if(!/^\d+$/.test(String(id))) throw new Error('Payment request not found.');
    const row=(await pool.query(`SELECT ${requestColumns},s.name AS shop_name,u.email AS owner_email
      FROM subscription_requests r JOIN shops s ON s.id=r.shop_id JOIN users u ON u.id=r.requested_by WHERE r.id=$1`,[id])).rows[0];
    if(!row) throw new Error('Payment request not found.');return row;
  },
  async receipt(id) {
    if(!/^\d+$/.test(String(id))) throw new Error('Payment receipt not found.');
    const row=(await pool.query('SELECT receipt_path,receipt_mime_type,receipt_original_name FROM subscription_requests WHERE id=$1',[id])).rows[0];
    const file=await ReceiptStore.read(row?.receipt_path);
    if(!row||!file) throw new Error('Payment receipt not found.');
    return {...row,file};
  },
  async review(id,userId,data) {
    if(!['approve','reject'].includes(data.decision)) throw new Error('Choose approve or reject.');
    if(data.decision==='approve'&&data.paymentVerified!==true) throw new Error('Verify the payment in the receiving account before approval.');
    return Finance.transaction(async db=>{
      const lookup=(await db.query('SELECT shop_id FROM subscription_requests WHERE id=$1',[id])).rows[0];
      if(!lookup) throw new Error('Payment request not found.');
      const shop=await lockedShop(db,lookup.shop_id);
      const request=(await db.query('SELECT * FROM subscription_requests WHERE id=$1 FOR UPDATE',[id])).rows[0];
      if(request.status===(data.decision==='approve'?'approved':'rejected')) return request;
      if(request.status!=='pending') throw new Error('This payment request is no longer awaiting review.');
      const note=Finance.text(data.note,500,'Review note',data.decision==='reject');
      let period=null;
      if(data.decision==='approve') {
        if(shop.subscription_status==='suspended'||shop.subscription_revision!==request.subscription_revision) throw new Error('The shop subscription changed. Reject this request and ask the owner to review their package.');
        const plan=(await db.query('SELECT name,limits,features,tier FROM subscription_plans WHERE code=$1',[request.plan_code])).rows[0];
        await checkStaffLimit(db,shop.id,plan);
        // Same-plan early renewals retain the remaining paid days. A new plan starts a fresh month.
        period=(await db.query(`UPDATE shops SET plan_code=$2::varchar,subscription_status='active',subscription_source='paid',cancelled_at=NULL,subscription_revision=subscription_revision+1,
          current_period_end=((CASE WHEN subscription_status='active' AND plan_code=$2::varchar AND current_period_end >= (NOW() AT TIME ZONE timezone)::date
          THEN current_period_end+1 ELSE (NOW() AT TIME ZONE timezone)::date END)+INTERVAL '1 month'-INTERVAL '1 day')::date
          WHERE id=$1 RETURNING current_period_end::text AS period_end`,[shop.id,request.plan_code])).rows[0].period_end;
      }
      const result=(await db.query(`UPDATE subscription_requests SET status=$2,reviewed_by=$3,reviewed_at=NOW(),review_note=$4,period_end=$5 WHERE id=$1 RETURNING *`,
        [id,data.decision==='approve'?'approved':'rejected',userId,note,period])).rows[0];
      const approved=data.decision==='approve';
      if(approved)await require('./telegramModel').enforceEligibility(db,shop.id);
      await require('./shopNotificationModel').create(db,shop.id,{kind:'subscription',createdBy:userId,
        title:approved?'Payment approved':'Payment needs attention',
        body:approved?`${request.plan_name} is active through ${period}. ${note||'Thank you for your payment.'}`:`Your ${request.plan_name} payment was not approved. ${note}`,
        path:'/admin?view=package'});
      await require('./platformEventModel').shopEvent(db,shop.id,{key:`payment_reviewed:${id}`,kind:'payment_reviewed',title:data.decision==='approve'?'Payment approved · package activated':'Payment rejected',details:`${request.plan_name} · ETB ${Number(request.amount).toLocaleString('en-US')}`,path:`/platform?view=billing&request=${id}`});
      return result;
    });
  },
};
module.exports=Subscription;
