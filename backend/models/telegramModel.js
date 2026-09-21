const crypto = require('node:crypto');
const pool = require('../db');
const Reports = require('./ownerReportModel');
const short = (value,n=65)=>Array.from(String(value??'').replace(/\s+/g,' ').trim()).slice(0,n).join('');
const key = () => {
  const secret=process.env.TELEGRAM_ENCRYPTION_KEY || process.env.JWT_SECRET;
  if(!secret || secret==='secretkey')throw new Error('Set TELEGRAM_ENCRYPTION_KEY in the backend environment before connecting Telegram.');
  return crypto.createHash('sha256').update('barberbook-telegram:'+secret).digest();
};
function encrypt(token){const iv=crypto.randomBytes(12),cipher=crypto.createCipheriv('aes-256-gcm',key(),iv);return [iv.toString('base64'),Buffer.concat([cipher.update(token,'utf8'),cipher.final()]).toString('base64'),cipher.getAuthTag().toString('base64')].join('.');}
function decrypt(value){const [iv,body,tag]=value.split('.').map(v=>Buffer.from(v,'base64'));const cipher=crypto.createDecipheriv('aes-256-gcm',key(),iv);cipher.setAuthTag(tag);return Buffer.concat([cipher.update(body),cipher.final()]).toString('utf8');}
function destination(value,label='Telegram username'){
  const raw=String(value||'').trim();
  if(/^-?\d{1,20}$/.test(raw))return raw;
  const username=raw.startsWith('@')?raw:`@${raw}`;
  if(!/^@[A-Za-z0-9_]{5,32}$/.test(username))throw new Error(`Enter a valid ${label}, for example @yourname.`);
  return username;
}
function digest(report, closing) {
  const money=value=>`${report.shop.currency} ${Number(value||0).toLocaleString('en-US',{maximumFractionDigits:2})}`;
  const stock=report.stock.slice(0,3).map(i=>`${short(i.name,28)} (${Number(i.quantity)} ${short(i.unit,12)})`).join('; ');
  return [
    `${short(report.shop.name,50)} · ${closing.date}`,
    '',
    `Customer flow: ${report.totals.completed} served${report.totals.cancelled?` · ${report.totals.cancelled} cancelled`:''}`,
    `Income${closing.vat?' (excl. VAT)':''}: ${money(closing.services)}`,
    `Expenses: ${money(closing.expenses)}`,
    `Low stock: ${stock||'None'}${report.stock.length>3?`; +${report.stock.length-3} more`:''}`,
  ].join('\n');
}
async function apiCall(token,methodName,body,transport=fetch){
  let response,data;
  try{response=await transport(`https://api.telegram.org/bot${token}/${methodName}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(12000)});data=await response.json();}
  catch(cause){
    const offline=['ENOTFOUND','EAI_AGAIN','ECONNREFUSED','ENETUNREACH'].includes(cause.cause?.code||cause.code);
    const error=new Error(offline?'Telegram could not be reached. Delivery will retry when the connection returns.':'Delivery could not be confirmed. Check Telegram before trying again.');
    error.uncertain=!offline;error.retryable=offline;throw error;
  }
  if(!data.ok){
    // Telegram treats an edit with identical text as an error, although it is already delivered.
    if(methodName==='editMessageText' && String(data.description).includes('message is not modified'))return {message_id:body.message_id};
    const code=data.error_code||response.status;
    const error=new Error(code===401?'Bot token was rejected.':code===403?'The bot cannot message this chat. Start or unblock it in Telegram.':code===429?'Telegram is busy. Delivery will retry shortly.':'Telegram rejected the chat or message. Check the connection settings.');
    error.retryAfter=Number(data.parameters?.retry_after)||60;error.retryable=code===429||code>=500;throw error;
  }
  return data.result;
}
async function resolveUsername(token,username,transport=fetch){
  const expected=String(username||'').replace(/^@/,'').toLowerCase();
  const updates=await apiCall(token,'getUpdates',{limit:100,timeout:0,allowed_updates:['message']},transport);
  const match=(Array.isArray(updates)?updates:[]).find(update=>{
    const message=update?.message;
    const candidate=message?.chat?.username||message?.from?.username;
    return message?.chat?.type==='private'&&String(candidate||'').toLowerCase()===expected;
  });
  if(!match?.message?.chat?.id)throw new Error('Open the Mirror bot in Telegram, press Start, then verify again.');
  const updateId=Number(match.update_id);
  if(Number.isSafeInteger(updateId)){
    try{await apiCall(token,'getUpdates',{offset:updateId+1,limit:1,timeout:0},transport);}catch{/* Delivery is already resolved; the next verification can retry cleanup. */}
  }
  return String(match.message.chat.id);
}
const Telegram={
  encrypt,decrypt,apiCall,resolveUsername,
  digest,
  async settings(shopId){
    const setting=(await pool.query('SELECT enabled,chat_id AS "chatId",telegram_username AS "telegramUsername",updated_at FROM shop_telegram WHERE shop_id=$1',[shopId])).rows[0];
    const shop=(await pool.query(`SELECT s.*,p.features,p.tier FROM shops s JOIN subscription_plans p ON p.code=s.plan_code WHERE s.id=$1`,[shopId])).rows[0];
    const access=shop?require('./subscriptionModel').access(shop):{canUseTelegram:false,status:'unknown'};
    const history=(await pool.query('SELECT id,business_date::text AS day,status,attempts,last_error AS error,sent_at AS "sentAt",updated_at,body FROM owner_daily_messages WHERE shop_id=$1 ORDER BY business_date DESC LIMIT 14',[shopId])).rows;
    const chatId=setting?.chatId||'';
    return {configured:!!setting,enabled:setting?.enabled||false,available:!!access.canUseTelegram,subscriptionStatus:access.status,chatId,telegramUsername:setting?.telegramUsername||'',history};
  },
  async save(shopId,data){
    if(typeof data.enabled!=='boolean')throw new Error('Choose whether daily Telegram reports are enabled.');
    const shop=(await pool.query(`SELECT s.*,p.features,p.tier FROM shops s JOIN subscription_plans p ON p.code=s.plan_code WHERE s.id=$1`,[shopId])).rows[0];
    if(data.enabled&&!require('./subscriptionModel').access(shop).canUseTelegram)throw new Error('Daily Telegram report is included with Mirror Plus or Max. It is available during the free trial.');
    const requested=data.telegramUsername||data.username||data.chatId;
    const chatId=destination(requested);
    const username=String(requested||'').trim().startsWith('@')?chatId:null;
    const existing=(await pool.query('SELECT token_cipher FROM shop_telegram WHERE shop_id=$1',[shopId])).rows[0];
    const token=String(data.botToken||'').trim();
    if(token && !/^\d{5,20}:[A-Za-z0-9_-]{20,100}$/.test(token))throw new Error('Enter the bot token supplied by BotFather.');
    if(!token&&!existing)throw new Error('Enter a Telegram bot token.');
    const tokenCipher=token?encrypt(token):existing.token_cipher;
    await pool.query(`INSERT INTO shop_telegram(shop_id,enabled,token_cipher,chat_id,telegram_username) VALUES($1,$2,$3,$4,$5)
      ON CONFLICT(shop_id) DO UPDATE SET enabled=EXCLUDED.enabled,token_cipher=EXCLUDED.token_cipher,chat_id=EXCLUDED.chat_id,telegram_username=COALESCE(EXCLUDED.telegram_username,shop_telegram.telegram_username),updated_at=NOW()`,[shopId,data.enabled,tokenCipher,chatId,username]);
    return this.settings(shopId);
  },
  async verify(shopId,transport){
    const row=(await pool.query('SELECT * FROM shop_telegram WHERE shop_id=$1',[shopId])).rows[0];
    if(!row)throw new Error('Save the Telegram connection first.');
    const token=decrypt(row.token_cipher);
    if(String(row.chat_id).startsWith('@')){
      const resolved=await resolveUsername(token,row.chat_id,transport);
      await pool.query('UPDATE shop_telegram SET chat_id=$2,updated_at=NOW() WHERE shop_id=$1',[shopId,resolved]);
      row.chat_id=resolved;
    }
    const bot=await apiCall(token,'getMe',{},transport);
    const chat=await apiCall(token,'getChat',{chat_id:row.chat_id},transport);
    return {bot:bot.username,chat:chat.title||chat.first_name||row.chat_id,message:'Connection verified. Daily reports will be sent when reception closes the day.'};
  },
  async sendNotification(shopId,{title,body,path:link='/admin'},transport=fetch){
    const row=(await pool.query(`SELECT t.token_cipher,t.chat_id,s.*,p.features,p.tier FROM shop_telegram t
      JOIN shops s ON s.id=t.shop_id JOIN subscription_plans p ON p.code=s.plan_code WHERE t.shop_id=$1`,[shopId])).rows[0];
    if(!row||!require('./subscriptionModel').access(row).canUseTelegram)return {sent:false,reason:'Telegram notifications are unavailable for this shop’s current package.'};
    if(!/^-?\d{1,20}$/.test(String(row.chat_id||'')))return {sent:false,reason:'The owner has not verified the Telegram bot connection.'};
    const origin=String(process.env.PUBLIC_APP_URL||'http://127.0.0.1:5173').replace(/\/$/,'');
    const safePath=String(link||'/admin');
    if(!safePath.startsWith('/'))throw new Error('Notification links must stay inside Mirror.');
    const text=[String(title||'Mirror update').slice(0,160),String(body||'').slice(0,1000),`Open in Mirror: ${origin}${safePath}`].filter(Boolean).join('\n\n');
    await apiCall(decrypt(row.token_cipher),'sendMessage',{chat_id:row.chat_id,text,disable_notification:false,link_preview_options:{is_disabled:true}},transport);
    return {sent:true};
  },
  async enqueue(shopId,closing,db){
    const shop=(await db.query(`SELECT s.*,p.features,p.tier FROM shops s JOIN subscription_plans p ON p.code=s.plan_code WHERE s.id=$1`,[shopId])).rows[0];
    if(!shop||!require('./subscriptionModel').access(shop).canUseTelegram)return;
    if(!(await db.query('SELECT shop_id FROM shop_telegram WHERE shop_id=$1 AND enabled=true',[shopId])).rowCount)return;
    const report=await Reports.report(shopId,{period:'daily',date:closing.date},db);
    await db.query(`INSERT INTO owner_daily_messages(shop_id,business_date,closing_id,body) VALUES($1,$2,$3,$4)
      ON CONFLICT(shop_id,business_date) DO UPDATE SET closing_id=EXCLUDED.closing_id,body=EXCLUDED.body,revision=owner_daily_messages.revision+1,
      status=CASE WHEN owner_daily_messages.status IN ('sending','uncertain') THEN owner_daily_messages.status ELSE 'queued' END,
      attempts=0,last_error=NULL,next_attempt_at=NOW(),updated_at=NOW()`,[shopId,closing.date,closing.closing.id,digest(report,closing)]);
  },
  async enforceEligibility(db,shopId){
    const shop=(await db.query(`SELECT s.*,p.features,p.tier FROM shops s JOIN subscription_plans p ON p.code=s.plan_code WHERE s.id=$1`,[shopId])).rows[0];
    if(shop&&require('./subscriptionModel').access(shop).canUseTelegram)return;
    await db.query(`UPDATE owner_daily_messages SET status='skipped',last_error='Daily Telegram report is included with Mirror Plus or Max only.',updated_at=NOW()
      WHERE shop_id=$1 AND status IN ('queued','sending')`,[shopId]);
  },
  async retry(shopId,id){
    const result=await pool.query("UPDATE owner_daily_messages SET status='queued',attempts=0,next_attempt_at=NOW(),last_error=NULL WHERE id=$1 AND shop_id=$2 AND status='failed' RETURNING id",[id,shopId]);
    if(!result.rowCount)throw new Error('Only a confirmed failed delivery can be retried.');
    return {queued:true};
  },
  async deliverOne(transport=fetch){
    // Do not blindly resend after a process crash: Telegram has no sendMessage idempotency key.
    await pool.query("UPDATE owner_daily_messages SET status='uncertain',last_error='Delivery interrupted. Check Telegram before sending another report.' WHERE status='sending' AND updated_at<NOW()-INTERVAL '2 minutes'");
    const db=await pool.connect();let row;
    try{
      await db.query('BEGIN');
      row=(await db.query(`SELECT m.*,s.token_cipher,s.chat_id,shop.subscription_status,shop.trial_ends_at,shop.current_period_end,shop.timezone,p.features,p.tier FROM owner_daily_messages m JOIN shop_telegram s ON s.shop_id=m.shop_id
        JOIN shops shop ON shop.id=m.shop_id JOIN subscription_plans p ON p.code=shop.plan_code
        JOIN daily_closings c ON c.id=m.closing_id AND c.reopened_at IS NULL
        WHERE m.status='queued' AND m.next_attempt_at<=NOW() AND s.enabled=true ORDER BY m.id LIMIT 1 FOR UPDATE OF m SKIP LOCKED`)).rows[0];
      if(row&&!require('./subscriptionModel').access(row).canUseTelegram){
        await db.query("UPDATE owner_daily_messages SET status='skipped',last_error='Daily Telegram report is included with Mirror Plus or Max only.',updated_at=NOW() WHERE id=$1",[row.id]);
        row=null;
      } else if(row)await db.query("UPDATE owner_daily_messages SET status='sending',attempts=attempts+1,updated_at=NOW() WHERE id=$1",[row.id]);
      await db.query('COMMIT');
    }catch(error){await db.query('ROLLBACK');throw error;}finally{db.release();}
    if(!row)return false;
    let confirmedDelivery=false;
    try{
      const token=decrypt(row.token_cipher),botId=token.split(':')[0];
      if(row.telegram_message_id&&(row.delivered_chat_id!==row.chat_id||row.delivered_bot_id!==botId))throw new Error('This day was already delivered to a different connection. Its report remains in the workspace.');
      const result=await apiCall(token,row.telegram_message_id?'editMessageText':'sendMessage',{chat_id:row.chat_id,text:row.body,disable_notification:false,...(row.telegram_message_id?{message_id:Number(row.telegram_message_id)}:{})},transport);
      confirmedDelivery=true;
      await pool.query(`UPDATE owner_daily_messages SET status=CASE WHEN revision=$2 THEN 'sent' ELSE 'queued' END,telegram_message_id=$3,delivered_chat_id=$4,delivered_bot_id=$5,sent_at=NOW(),updated_at=NOW(),last_error=NULL WHERE id=$1`,[row.id,row.revision,result.message_id,row.chat_id,botId]);
    }catch(error){
      const status=confirmedDelivery||error.uncertain?'uncertain':error.retryable&&row.attempts<4?'queued':'failed';
      const message=confirmedDelivery?'Telegram accepted the report, but its delivery record could not be saved. Check Telegram before sending again.':error.message;
      await pool.query("UPDATE owner_daily_messages SET status=$2,last_error=$3,next_attempt_at=NOW()+($4 * INTERVAL '1 second'),updated_at=NOW() WHERE id=$1",[row.id,status,message,Math.min(error.retryAfter||60,3600)]);
    }
    return true;
  },
  start(){let busy=false;const tick=async()=>{if(busy)return;busy=true;try{for(let i=0;i<10;i++){if(!await this.deliverOne())break;}}catch{console.error('Telegram report queue could not be processed. Check local database availability.');}finally{busy=false;}};const timer=setInterval(tick,15000);timer.unref();void tick();return ()=>clearInterval(timer);},
};
module.exports=Telegram;
