const pool=require('../db');
const Finance=require('./deskFinanceModel');
const {encrypt,decrypt,apiCall,resolveUsername}=require('./telegramModel');
const line=value=>String(value??'').replace(/\s+/g,' ').trim().slice(0,180);
function destination(value){
  const raw=String(value||'').trim();
  if(/^-?\d{1,20}$/.test(raw))return raw;
  const username=raw.startsWith('@')?raw:`@${raw}`;
  if(!/^@[A-Za-z0-9_]{5,32}$/.test(username))throw new Error('Enter a valid Telegram username, for example @yourname.');
  return username;
}
const Events={
  async enqueue(db,{key,kind,shopId,title,body,path}){
    await db.query(`INSERT INTO platform_events(event_key,kind,shop_id,title,body,path,status)
      VALUES($1,$2,$3,$4,$5,$6,CASE WHEN EXISTS(SELECT 1 FROM platform_telegram WHERE enabled) THEN 'queued' ELSE 'skipped' END)
      ON CONFLICT(event_key) DO NOTHING`,[key,kind,shopId||null,line(title),body,path]);
  },
  async shopEvent(db,shopId,{key,kind,title,details='',path}){
    const shop=(await db.query(`SELECT s.name,p.name AS plan_name,u.name AS owner_name,u.email
      FROM shops s JOIN subscription_plans p ON p.code=s.plan_code
      LEFT JOIN LATERAL(SELECT name,email FROM users WHERE shop_id=s.id AND role='admin' ORDER BY id LIMIT 1) u ON true WHERE s.id=$1`,[shopId])).rows[0];
    await this.enqueue(db,{key,kind,shopId,title,body:[line(shop.name),`${line(shop.owner_name)} · ${line(shop.email)}`,details||`Package: ${line(shop.plan_name)}`].join('\n'),path:path||`/platform?view=shops&shop=${shopId}`});
  },
  async settings(){
    const setting=(await pool.query('SELECT enabled,chat_id AS "chatId",telegram_username AS "telegramUsername",workspace_url AS "workspaceUrl" FROM platform_telegram WHERE id=1')).rows[0];
    const history=(await pool.query('SELECT id,kind,title,body,path,status,attempts,last_error AS error,created_at,sent_at FROM platform_events ORDER BY id DESC LIMIT 60')).rows;
    const chatId=setting?.chatId||'';
    return {configured:!!setting,enabled:setting?.enabled||false,chatId,telegramUsername:setting?.telegramUsername||'',workspaceUrl:setting?.workspaceUrl||'',history};
  },
  async notificationsForUser(userId){
    const rows=(await pool.query(`SELECT e.id,e.kind,e.title,e.body,e.path,e.created_at AS "createdAt",r.read_at AS "readAt"
      FROM platform_events e
      LEFT JOIN platform_event_reads r ON r.event_id=e.id AND r.user_id=$1
      ORDER BY e.id DESC LIMIT 60`,[userId])).rows;
    return {unread:rows.filter(row=>!row.readAt).length,notifications:rows};
  },
  async markNotificationRead(userId,id){
    if(!/^\d+$/.test(String(id)))throw new Error('Notification not found.');
    const event=(await pool.query('SELECT id FROM platform_events WHERE id=$1',[id])).rows[0];
    if(!event)throw new Error('Notification not found.');
    await pool.query(`INSERT INTO platform_event_reads(event_id,user_id) VALUES($1,$2)
      ON CONFLICT(event_id,user_id) DO NOTHING`,[id,userId]);
    return {read:true};
  },
  async save(data){
    if(typeof data.enabled!=='boolean') throw new Error('Choose whether platform alerts are enabled.');
    const requested=data.telegramUsername||data.username||data.chatId;
    const chatId=destination(requested),username=String(requested||'').trim().startsWith('@')?chatId:null,token=String(data.botToken||'').trim();
    if(token&&!/^\d{5,20}:[A-Za-z0-9_-]{20,100}$/.test(token)) throw new Error('Enter the bot token supplied by BotFather.');
    let url;try{url=new URL(String(data.workspaceUrl||''));}catch{throw new Error('Enter the Mirror website address, for example http://127.0.0.1:5173.');}
    if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.search||url.hash||!['','/'].includes(url.pathname)) throw new Error('Enter only the website origin, without a path, password or query.');
    await Finance.transaction(async db=>{
      const existing=(await db.query('SELECT token_cipher FROM platform_telegram WHERE id=1 FOR UPDATE')).rows[0];
      if(!token&&!existing) throw new Error('Enter a Telegram bot token.');
      await db.query(`INSERT INTO platform_telegram(id,enabled,chat_id,telegram_username,token_cipher,workspace_url) VALUES(1,$1,$2,$3,$4,$5)
        ON CONFLICT(id) DO UPDATE SET enabled=EXCLUDED.enabled,chat_id=EXCLUDED.chat_id,telegram_username=COALESCE(EXCLUDED.telegram_username,platform_telegram.telegram_username),token_cipher=EXCLUDED.token_cipher,workspace_url=EXCLUDED.workspace_url,updated_at=NOW()`,
        [data.enabled,chatId,username,token?encrypt(token):existing.token_cipher,url.origin]);
      if(!data.enabled) await db.query("UPDATE platform_events SET status='skipped',last_error=NULL,updated_at=NOW() WHERE status='queued'");
    });
    return this.settings();
  },
  async verify(transport){
    const row=(await pool.query('SELECT * FROM platform_telegram WHERE id=1')).rows[0];
    if(!row) throw new Error('Save the platform Telegram connection first.');
    const token=decrypt(row.token_cipher),bot=await apiCall(token,'getMe',{},transport);
    if(String(row.chat_id).startsWith('@')){
      row.chat_id=await resolveUsername(token,row.chat_id,transport);
      await pool.query('UPDATE platform_telegram SET chat_id=$1,updated_at=NOW() WHERE id=1',[row.chat_id]);
    }
    const chat=await apiCall(token,'getChat',{chat_id:row.chat_id},transport);
    return {bot:bot.username,chat:chat.title||chat.first_name||row.chat_id};
  },
  async retry(id){
    const result=await pool.query(`UPDATE platform_events SET status='queued',attempts=0,next_attempt_at=NOW(),last_error=NULL,updated_at=NOW()
      WHERE id=$1 AND status='failed' AND EXISTS(SELECT 1 FROM platform_telegram WHERE enabled) RETURNING id`,[id]);
    if(!result.rowCount) throw new Error('Only failed alerts can be retried with an enabled connection.');
    return {queued:true};
  },
  async detectExpiries(){
    return Finance.transaction(async db=>{
      const rows=(await db.query(`SELECT id,subscription_status,trial_ends_at,current_period_end::text AS period_end FROM shops s
        WHERE (subscription_status='trial' AND trial_ends_at<=NOW() AND NOT EXISTS(SELECT 1 FROM platform_events WHERE event_key='trial_expired:'||s.id||':'||EXTRACT(EPOCH FROM s.trial_ends_at)::text))
        OR (subscription_status='active' AND current_period_end<(NOW() AT TIME ZONE timezone)::date AND NOT EXISTS(SELECT 1 FROM platform_events WHERE event_key='plan_expired:'||s.id||':'||s.current_period_end::text)) FOR UPDATE OF s SKIP LOCKED`)).rows;
      for(const s of rows){
        const trial=s.subscription_status==='trial';
        const stamp=trial?(await db.query('SELECT EXTRACT(EPOCH FROM trial_ends_at)::text AS stamp FROM shops WHERE id=$1',[s.id])).rows[0].stamp:s.period_end;
        await this.shopEvent(db,s.id,{key:`${trial?'trial':'plan'}_expired:${s.id}:${stamp}`,kind:'expiry',title:trial?'Free trial ended':'Paid package expired'});
      }
    });
  },
  async deliverOne(transport=fetch){
    await pool.query("UPDATE platform_events SET status='uncertain',last_error='Delivery interrupted. Check Telegram before sending again.' WHERE status='sending' AND updated_at<NOW()-INTERVAL '2 minutes'");
    const row=await Finance.transaction(async db=>{
      const row=(await db.query(`SELECT e.*,t.token_cipher,t.chat_id,t.workspace_url FROM platform_events e CROSS JOIN platform_telegram t
        WHERE e.status='queued' AND e.next_attempt_at<=NOW() AND t.enabled ORDER BY e.id LIMIT 1 FOR UPDATE OF e SKIP LOCKED`)).rows[0];
      if(row) await db.query("UPDATE platform_events SET status='sending',attempts=attempts+1,updated_at=NOW() WHERE id=$1",[row.id]);
      return row;
    });
    if(!row)return false;
    let confirmed=false;
    try{
      const result=await apiCall(decrypt(row.token_cipher),'sendMessage',{chat_id:row.chat_id,text:`${row.title}\n${row.body}\n\nOpen workspace: ${row.workspace_url}${row.path}`,disable_notification:false,link_preview_options:{is_disabled:true}},transport);
      confirmed=true;
      await pool.query("UPDATE platform_events SET status='sent',telegram_message_id=$2,sent_at=NOW(),updated_at=NOW(),last_error=NULL WHERE id=$1",[row.id,result.message_id]);
    }catch(error){
      const status=confirmed||error.uncertain?'uncertain':error.retryable&&row.attempts<4?'queued':'failed';
      await pool.query("UPDATE platform_events SET status=$2,last_error=$3,next_attempt_at=NOW()+($4 * INTERVAL '1 second'),updated_at=NOW() WHERE id=$1",
        [row.id,status,confirmed?'Telegram accepted the alert but its delivery record could not be saved. Check Telegram.':error.message,Math.min(error.retryAfter||60,3600)]);
    }
    return true;
  },
  start(){let busy=false,lastScan=0;const tick=async()=>{if(busy)return;busy=true;try{if(Date.now()-lastScan>60000){await this.detectExpiries();lastScan=Date.now();}for(let n=0;n<10;n++)if(!await this.deliverOne())break;}catch{console.error('Platform activity queue could not be processed. Check the local database and migrations.');}finally{busy=false;}};const timer=setInterval(tick,15000);timer.unref();void tick();return ()=>clearInterval(timer);},
};
module.exports=Events;
