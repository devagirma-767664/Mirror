const jwt=require('jsonwebtoken');
const pool=require('../db');
const Shop=require('./shopModel');
const Subscription=require('./subscriptionModel');
async function user(id) {
  const row=(await pool.query('SELECT id,name,email,phone,role,profile_picture,shop_id,has_workspace,staff_type,active FROM users WHERE id=$1',[id])).rows[0];
  if(!row) return null;
  const shop=row.shop_id?await Shop.getById(row.shop_id):null;
  if(row.role!=='platform_admin'&&!shop) return null;
  const subscription=shop?Subscription.access(shop):null;
  return {id:row.id,name:row.name,email:row.email,phone:row.phone,role:row.role,profilePicture:row.profile_picture,active:row.active,shopId:row.shop_id,
    shop:shop?{id:shop.id,name:shop.name,slug:shop.slug,planCode:shop.plan_code,planName:shop.plan_name,subscriptionStatus:shop.subscription_status,currency:shop.currency,timezone:shop.timezone}:null,
    subscription,features:{...shop?.features,publicWebsite:!!subscription?.canRequestWebsite,onlineBooking:!!subscription?.canRequestWebsite&&shop?.website_enabled&&shop?.features?.onlineBooking===true,telegramDailyDigest:!!subscription?.canUseTelegram},limits:shop?.limits||{}};
}
async function session(id) {
  const current=await user(id);
  return {user:current,token:jwt.sign({id:current.id,role:current.role,shopId:current.shopId},process.env.JWT_SECRET||'secretkey',{expiresIn:'1h'}),expiresIn:3600};
}
module.exports={user,session};
