const pool=require('../db');
const Finance=require('./deskFinanceModel');

const text=(value,max,label)=>Finance.text(value,max,label);
const optional=(value,max,label)=>Finance.text(value,max,label,false);
const path=value=>{
  const result=optional(value,240,'Notification link')||'/admin';
  if(!result.startsWith('/')||/^\/[\\/]/.test(result))throw new Error('Notification links must stay inside Mirror.');
  return result;
};
const audience=value=>{
  const result=String(value||'admin').trim().toLowerCase();
  if(!['admin','staff','all'].includes(result))throw new Error('Choose who should receive this notification.');
  return result;
};
const canRead=`(n.audience='all' OR ($3='admin' AND n.audience='admin') OR ($3<>'admin' AND n.audience='staff'))`;
const Notifications={
  async create(db,shopId,{kind='platform_message',title,body,path:link='/admin',createdBy=null,audience:recipient='admin'}){
    return (await db.query(`INSERT INTO shop_notifications(shop_id,kind,title,body,path,created_by,audience)
      VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id`,[shopId,String(kind).slice(0,40),text(title,160,'Message title'),text(body,1000,'Message'),path(link),createdBy,audience(recipient)])).rows[0];
  },
  async send(userId,data={}){
    const title=text(data.title,160,'Message title'),body=text(data.body,1000,'Message'),link=path(data.path);
    const target=String(data.shopId||'all'),recipient=audience(data.audience);
    return Finance.transaction(async db=>{
      let shops;
      if(target==='all')shops=(await db.query(`SELECT s.id FROM shops s WHERE EXISTS(SELECT 1 FROM users WHERE shop_id=s.id AND role='admin') ORDER BY s.id`)).rows;
      else {if(!/^\d+$/.test(target))throw new Error('Choose a valid shop or every shop.');shops=(await db.query(`SELECT s.id FROM shops s WHERE s.id=$1 AND EXISTS(SELECT 1 FROM users WHERE shop_id=s.id AND role='admin')`,[target])).rows;}
      if(!shops.length)throw new Error('No shop owners are available for this message.');
      for(const shop of shops)await this.create(db,shop.id,{title,body,path:link,createdBy:userId,audience:recipient});
      return {sent:shops.length};
    });
  },
  async platformHistory(){return (await pool.query(`SELECT n.id,n.shop_id AS "shopId",s.name AS "shopName",n.title,n.body,n.path,n.audience,n.created_at AS "createdAt",COALESCE((SELECT MIN(r.read_at) FROM shop_notification_reads r WHERE r.notification_id=n.id),n.read_at) AS "readAt"
    FROM shop_notifications n JOIN shops s ON s.id=n.shop_id ORDER BY n.id DESC LIMIT 100`)).rows;},
  async forUser(user){
    const shopId=user.shopId;
    if(!shopId)return {unread:0,notifications:[]};
    const rows=(await pool.query(`SELECT n.id,n.kind,n.title,n.body,n.path,n.audience,n.created_at AS "createdAt",r.read_at AS "readAt"
      FROM shop_notifications n
      LEFT JOIN shop_notification_reads r ON r.notification_id=n.id AND r.user_id=$1
      WHERE n.shop_id=$2 AND ${canRead}
      ORDER BY n.id DESC LIMIT 60`,[user.id,shopId,user.role])).rows;
    return {unread:rows.filter(row=>!row.readAt).length,notifications:rows};
  },
  async forShop(shopId){
    const rows=(await pool.query(`SELECT id,kind,title,body,path,created_at AS "createdAt",read_at AS "readAt"
      FROM shop_notifications WHERE shop_id=$1 ORDER BY id DESC LIMIT 60`,[shopId])).rows;
    return {unread:rows.filter(row=>!row.readAt).length,notifications:rows};
  },
  async markReadForUser(user,id){
    if(!/^\d+$/.test(String(id)))throw new Error('Notification not found.');
    const shopId=user.shopId;
    if(!shopId)throw new Error('Notification not found.');
    const notification=(await pool.query(`SELECT n.id FROM shop_notifications n WHERE n.id=$1 AND n.shop_id=$2 AND ${canRead}`,[id,shopId,user.role])).rows[0];
    if(!notification)throw new Error('Notification not found.');
    await pool.query(`INSERT INTO shop_notification_reads(notification_id,user_id) VALUES($1,$2) ON CONFLICT(notification_id,user_id) DO NOTHING`,[id,user.id]);
    return {read:true};
  },
  async markRead(shopId,id){
    if(!/^\d+$/.test(String(id)))throw new Error('Notification not found.');
    const row=(await pool.query('UPDATE shop_notifications SET read_at=COALESCE(read_at,NOW()) WHERE id=$1 AND shop_id=$2 RETURNING id',[id,shopId])).rows[0];
    if(!row)throw new Error('Notification not found.');return {read:true};
  },
};
module.exports=Notifications;
