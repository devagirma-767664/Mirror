const bcrypt=require('bcrypt');
const UserModel=require('../models/userModel');
const Session=require('../models/sessionModel');
const Onboarding=require('../models/onboardingModel');
const Finance=require('../models/deskFinanceModel');
const {normalizePhone}=require('../utils/phone');
const PublicUploads=require('../storage/publicUploadStore');
const AuthController={
  async login(req,res) {
    try {
      const {email,identifier,password}=req.body||{};
      const raw=String(identifier ?? email ?? '').trim();
      if(!raw||typeof password!=='string') return res.status(400).json({error:'Enter your phone number or email and password.'});
      let login=raw;
      if(!raw.includes('@')) { try {login=normalizePhone(raw);} catch(error) { return res.status(400).json({error:error.message});} }
      const user=await UserModel.findByLogin(login);
      if(!user||!user.active||!user.has_workspace||!user.password||!await bcrypt.compare(password,user.password)) return res.status(401).json({error:'Phone number or email and password are incorrect.'});
      res.json(await Session.session(user.id));
    } catch {res.status(500).json({error:'Unable to sign in. Please try again.'});}
  },
  async signup(req,res) {
    try {res.status(201).json(await Onboarding.signup(req.body||{}));}
    catch(error) {res.status(400).json({error:error.code==='23505'?'That email already has a workspace. Sign in to continue.':error.message});}
  },
  async updateProfile(req,res) {
    try {
      const name=Finance.text(req.body?.name,100,'Your name');
      const password=String(req.body?.password||'');
      if(password&&(password.length<8||Buffer.byteLength(password)>72))return res.status(400).json({error:'Use a password of at least 8 characters and at most 72 bytes.'});
      const phone=(['admin','barber','receptionist','platform_admin'].includes(req.user.role)&&req.body?.phone)?normalizePhone(req.body.phone):null;
      const image=req.file?await PublicUploads.save(req.file):null;
      const hash=password?await bcrypt.hash(password,10):null;
      await require('../db').query(`UPDATE users SET name=$2,profile_picture=COALESCE($3,profile_picture),password=COALESCE($4,password),phone=COALESCE($5,phone)
        WHERE id=$1`,[req.user.id,name,image,hash,phone]);
      res.json({user:await Session.user(req.user.id)});
    } catch(error) {res.status(400).json({error:error.code==='23505'?'This phone number is already used by a Mirror account.':error.message});}
  },
  async me(req,res) {res.json({user:req.currentUser});},
  async refresh(req,res) {res.json(await Session.session(req.user.id));},
};
module.exports=AuthController;
