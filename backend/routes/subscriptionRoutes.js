const express=require('express');
const auth=require('../middleware/authMiddleware');
const role=require('../middleware/roleMiddleware');
const Subscription=require('../models/subscriptionModel');
const Onboarding=require('../models/onboardingModel');
const receiptUpload=require('../middleware/paymentReceiptUpload');
const run=fn=>async(req,res)=>{try {res.json(await fn(req));} catch(error){res.status(400).json({error:error.code==='23505'?'These details are already recorded. Refresh and check your existing records.':error.message,...(error.step!==undefined?{step:error.step,field:error.field}: {})});}};
const admin=express.Router();admin.use(auth,role(['admin']));
admin.get('/subscription',run(r=>Subscription.details(r.user.shopId)));
admin.post('/subscription',receiptUpload,run(r=>Subscription.request(r.user.shopId,r.user.id,{...r.body,paymentConfirmed:r.body.paymentConfirmed===true||r.body.paymentConfirmed==='true'},r.file)));
admin.get('/onboarding',run(r=>Onboarding.details(r.user.shopId)));
admin.post('/onboarding',run(r=>Onboarding.complete(r.user.shopId,r.user.id,r.body)));
const Notifications=require('../models/shopNotificationModel');
admin.get('/notifications',run(r=>Notifications.forUser(r.user)));
admin.put('/notifications/:id/read',run(r=>Notifications.markReadForUser(r.user,r.params.id)));
const platform=express.Router();platform.use(auth,role(['platform_admin']));
platform.get('/billing',run(async()=>({accounts:await Subscription.accounts(),requests:await Subscription.requests()})));
platform.get('/billing/requests/:id',run(r=>Subscription.requestById(r.params.id)));
platform.get('/billing/requests/:id/receipt',async(req,res)=>{
  try {
    const receipt=await Subscription.receipt(req.params.id);
    res.setHeader('Content-Type',receipt.receipt_mime_type||'application/octet-stream');
    res.setHeader('Content-Disposition',`inline; filename="${String(receipt.receipt_original_name||'payment-receipt').replace(/[^a-zA-Z0-9._-]/g,'_')}"`);
    res.sendFile(receipt.filePath);
  } catch(error) {res.status(400).json({error:error.message});}
});
platform.post('/billing/accounts',run(r=>Subscription.saveAccount(r.user.id,r.body)));
platform.put('/billing/accounts/:id',run(r=>Subscription.setAccount(r.params.id,r.body.active)));
platform.put('/billing/requests/:id',run(r=>Subscription.review(r.params.id,r.user.id,r.body)));
platform.post('/billing/grants',run(r=>Subscription.grant(r.body.shopId,r.user.id,r.body)));
module.exports={admin,platform};
