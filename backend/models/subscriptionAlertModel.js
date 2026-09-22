const pool=require('../db');
const Finance=require('./deskFinanceModel');
const Telegram=require('./telegramModel');
const Notifications=require('./shopNotificationModel');

const date=value=>String(value||'').slice(0,10);
const hasVerifiedChat=row=>!!row.telegram_enabled&&!!row.token_cipher&&/^-?\d{1,20}$/.test(String(row.chat_id||''));
const origin=()=>String(process.env.PUBLIC_APP_URL||'http://127.0.0.1:5173').replace(/\/$/,'');

function reminder(row){
  if(row.subscription_status==='trial'){
    return {
      key:`trial-ending:${row.id}:${new Date(row.trial_ends_at).toISOString()}`,
      title:'Your free trial ends tomorrow',
      body:'Choose a package today so your shop can keep working without a break.',
    };
  }
  return {
    key:`package-ending:${row.id}:${date(row.current_period_end)}`,
    title:'Your package ends tomorrow',
    body:`${row.plan_name} ends on ${date(row.current_period_end)}. Renew today so your shop can keep working without a break.`,
  };
}

const Alerts={
  async detectUpcoming(){
    return Finance.transaction(async db=>{
      const rows=(await db.query(`SELECT s.*,p.name AS plan_name,t.enabled AS telegram_enabled,t.chat_id,t.token_cipher
        FROM shops s
        JOIN subscription_plans p ON p.code=s.plan_code
        LEFT JOIN shop_telegram t ON t.shop_id=s.id
        WHERE (s.subscription_status='trial' AND s.trial_ends_at>NOW() AND s.trial_ends_at<=NOW()+INTERVAL '1 day')
          OR (s.subscription_status='active' AND s.current_period_end=((NOW() AT TIME ZONE s.timezone)::date+1))
        FOR UPDATE OF s SKIP LOCKED`)).rows;
      for(const row of rows){
        const next=reminder(row);
        const status=hasVerifiedChat(row)?'queued':'skipped';
        const created=(await db.query(`INSERT INTO subscription_expiry_alerts(shop_id,alert_key,title,body,status,last_error)
          VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(alert_key) DO NOTHING RETURNING id`,[
          row.id,next.key,next.title,next.body,status,status==='skipped'?'Owner Telegram is not connected and verified.':null,
        ])).rows[0];
        if(created)await Notifications.create(db,row.id,{kind:'subscription',title:next.title,body:next.body,path:'/admin?view=package'});
      }
    });
  },
  async deliverOne(transport=fetch){
    // Telegram cannot deduplicate sendMessage calls. After an interrupted send,
    // keep the record for review instead of sending a possible duplicate.
    await pool.query("UPDATE subscription_expiry_alerts SET status='uncertain',last_error='Delivery interrupted. Check Telegram before sending again.',updated_at=NOW() WHERE status='sending' AND updated_at<NOW()-INTERVAL '2 minutes'");
    const row=await Finance.transaction(async db=>{
      const candidate=(await db.query(`SELECT a.*,t.enabled AS telegram_enabled,t.chat_id,t.token_cipher
        FROM subscription_expiry_alerts a
        LEFT JOIN shop_telegram t ON t.shop_id=a.shop_id
        WHERE a.status='queued' AND a.next_attempt_at<=NOW()
        ORDER BY a.id LIMIT 1 FOR UPDATE OF a SKIP LOCKED`)).rows[0];
      if(!candidate)return null;
      if(!hasVerifiedChat(candidate)){
        await db.query("UPDATE subscription_expiry_alerts SET status='skipped',last_error='Owner Telegram is not connected and verified.',updated_at=NOW() WHERE id=$1",[candidate.id]);
        return null;
      }
      await db.query("UPDATE subscription_expiry_alerts SET status='sending',attempts=attempts+1,updated_at=NOW() WHERE id=$1",[candidate.id]);
      return candidate;
    });
    if(!row)return false;
    let confirmed=false;
    try{
      const result=await Telegram.apiCall(Telegram.decrypt(row.token_cipher),'sendMessage',{
        chat_id:row.chat_id,
        text:`${row.title}\n\n${row.body}\n\nOpen package: ${origin()}/admin?view=package`,
        disable_notification:false,
        link_preview_options:{is_disabled:true},
      },transport);
      confirmed=true;
      await pool.query("UPDATE subscription_expiry_alerts SET status='sent',telegram_message_id=$2,sent_at=NOW(),last_error=NULL,updated_at=NOW() WHERE id=$1",[row.id,result.message_id]);
    }catch(error){
      const status=confirmed||error.uncertain?'uncertain':error.retryable&&row.attempts<4?'queued':'failed';
      const message=confirmed?'Telegram accepted this alert, but its delivery record could not be saved. Check Telegram.':error.message;
      await pool.query("UPDATE subscription_expiry_alerts SET status=$2,last_error=$3,next_attempt_at=NOW()+($4 * INTERVAL '1 second'),updated_at=NOW() WHERE id=$1",[row.id,status,message,Math.min(error.retryAfter||60,3600)]);
    }
    return true;
  },
  start(){
    let busy=false,lastScan=0;
    const tick=async()=>{
      if(busy)return;
      busy=true;
      try{
        if(Date.now()-lastScan>=60_000){await this.detectUpcoming();lastScan=Date.now();}
        for(let count=0;count<10;count++)if(!await this.deliverOne())break;
      }catch{console.error('Subscription reminder queue could not be processed. Check the database and migrations.');}
      finally{busy=false;}
    };
    const timer=setInterval(tick,15_000);
    timer.unref();
    void tick();
    return()=>clearInterval(timer);
  },
};

module.exports=Alerts;
