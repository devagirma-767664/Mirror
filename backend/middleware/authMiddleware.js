const jwt=require('jsonwebtoken');
const Session=require('../models/sessionModel');
const billingPaths=new Set(['/auth/me','/auth/notifications','/admin/shop','/admin/shop/subscription','/admin/subscription']);
module.exports=async(req,res,next)=>{
  const token=req.headers.authorization?.split(' ')[1];
  if(!token) return res.status(401).json({error:'Sign in to your workspace.'});
  let verified;
  try {verified=jwt.verify(token,process.env.JWT_SECRET||'secretkey');}
  catch {return res.status(401).json({error:'Your session has expired. Sign in again.'});}
  try {
    const user=await Session.user(verified.id);
    if(!user||!user.active||user.role!==verified.role||user.shopId!==(verified.shopId||null)) return res.status(401).json({error:'Your account is inactive or changed. Ask the shop owner for help.'});
    req.user={id:user.id,role:user.role,shopId:user.shopId};req.currentUser=user;
    const path=req.originalUrl.split('?')[0].replace(/\/$/,'');
    if(user.role!=='platform_admin'&&!user.subscription?.canOperate
      &&path!=='/auth/me'&&path!=='/auth/refresh'&&!(user.role==='admin'&&(billingPaths.has(path)||path.startsWith('/auth/notifications/')))) {
      return res.status(402).json({code:'SUBSCRIPTION_REQUIRED',error:'Your shop needs an active package. The owner can choose an available package.',subscription:user.subscription});
    }
    next();
  } catch {res.status(503).json({error:'Unable to check workspace access. Please try again.'});}
};
