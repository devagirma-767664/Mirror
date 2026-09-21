const express = require('express');
const PlatformController = require('../controllers/platformController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();
router.use(authMiddleware, roleMiddleware(['platform_admin']));
router.get('/overview', PlatformController.overview);
router.put('/shops/:id/subscription', (_req,res)=>res.status(403).json({error:'Only the shop owner can choose or cancel a package. Verify submitted payments from Payments.'}));
const Plans=require('../models/planModel');
const Events=require('../models/platformEventModel');
const Notifications=require('../models/shopNotificationModel');
const run=fn=>async(req,res)=>{try{res.json(await fn(req));}catch(error){res.status(400).json({error:error.code==='23505'?'This record already exists.':error.message});}};
router.get('/packages',run(()=>Plans.list()));
router.post('/packages',run(r=>Plans.save(null,r.body)));
router.put('/packages/:code',run(r=>Plans.save(r.params.code,r.body)));
router.delete('/packages/:code',run(r=>Plans.availability(r.params.code,false)));
router.post('/packages/:code/restore',run(r=>Plans.availability(r.params.code,true)));
router.post('/packages/:code/trial',run(r=>Plans.trialDefault(r.params.code)));
router.get('/telegram',run(()=>Events.settings()));
router.get('/alerts',run(r=>Events.notificationsForUser(r.user.id)));
router.put('/alerts/:id/read',run(r=>Events.markNotificationRead(r.user.id,r.params.id)));
router.put('/telegram',run(r=>Events.save(r.body)));
router.post('/telegram/verify',run(()=>Events.verify()));
router.post('/telegram/:id/retry',run(r=>Events.retry(r.params.id)));
router.get('/notifications',run(async()=>({history:await Notifications.platformHistory()})));
router.post('/notifications',run(r=>Notifications.send(r.user.id,r.body)));

module.exports = router;
