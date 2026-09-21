const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const auth=require('../middleware/authMiddleware');
const upload=require('../middleware/upload');
const Notifications=require('../models/shopNotificationModel');
const {rateLimit}=require('../middleware/rateLimit');

router.post('/login',rateLimit({windowMs:15*60*1000,max:20,message:'Too many sign-in attempts. Please wait 15 minutes before trying again.'}),AuthController.login);
router.post('/signup',rateLimit({windowMs:60*60*1000,max:8,message:'Too many trial signups from this connection. Please try again later.'}),AuthController.signup);
router.get('/me',auth,AuthController.me);
router.post('/refresh',auth,AuthController.refresh);
router.put('/profile',auth,upload.single('profilePicture'),AuthController.updateProfile);
router.get('/notifications',auth,async(req,res)=>{
  try {res.json(await Notifications.forUser(req.user));}
  catch(error){res.status(400).json({error:error.message});}
});
router.put('/notifications/:id/read',auth,async(req,res)=>{
  try {res.json(await Notifications.markReadForUser(req.user,req.params.id));}
  catch(error){res.status(400).json({error:error.message});}
});

module.exports = router;
