const UserModel = require('../models/userModel');
const DayOffModel = require('../models/dayOffModel');
const AppointmentModel = require('../models/appointmentModel');
const BillModel = require('../models/billModel');
const RatingModel = require('../models/ratingModel');
const ShopModel = require('../models/shopModel');
const bcrypt = require('bcrypt');
const Finance = require('../models/deskFinanceModel');
const {normalizePhone}=require('../utils/phone');
const PublicUploads = require('../storage/publicUploadStore');

const AdminController = {
  async addUser(req, res) {
    try {
      const { name, phone, role, password, staffType, monthlySalary } = req.body;
      const normalizedRole = String(role || '').toLowerCase();
      if (!['barber', 'receptionist', 'support'].includes(normalizedRole)) {
        return res.status(400).json({ error: 'Choose stylist, reception, or support staff.' });
      }
      const shop = await ShopModel.getById(req.user.shopId);
      const currentUsers = await UserModel.getAllUsers(req.user.shopId);
      const workspaceUsers=currentUsers.filter(user=>user.has_workspace!==false);
      if (normalizedRole!=='support' && workspaceUsers.length >= Number(shop?.limits?.staff || 8)) {
        return res.status(403).json({ error: `Your ${shop.plan_name} plan allows ${shop.limits.staff} staff accounts.` });
      }
      const profilePicture = req.file ? await PublicUploads.save(req.file) : null;
      const support=normalizedRole==='support';
      const staffKind=support?String(staffType||'').toLowerCase():null;
      if(support&&!['cleaner','washer','other'].includes(staffKind)) return res.status(400).json({error:'Choose cleaner, washer, or other support staff.'});
      const memberName=Finance.text(name,100,'Full name');
      const salary=Finance.money(monthlySalary||0,'Monthly salary');
      const normalizedPhone=support?null:normalizePhone(phone);
      if(!support&&(typeof password!=='string'||password.length<8||Buffer.byteLength(password)>72)) return res.status(400).json({error:'Use a password of at least 8 characters and at most 72 bytes.'});
      const hashedPassword = support?null:await bcrypt.hash(password, 10);

      const user = await UserModel.createUser(
        memberName,
        null,
        normalizedPhone,
        normalizedRole,
        hashedPassword,
        profilePicture,
        req.user.shopId,
        !support,
        staffKind,
        salary
      );

      res.json(user);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async removeUser(req, res) {
    try {
      const user = await UserModel.deleteUser(req.params.id, req.user.shopId);
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getAllUsers(req, res) {
    try {
      const users = await UserModel.getAllUsers(req.user.shopId);
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // ✅ Aggregated income report
  async getIncomeReport(req, res) {
    try {
      const result = await BillModel.getIncomeAggregates(req.user.shopId);
      res.json(result); // { daily, weekly, monthly }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // ✅ Barber performance report
  async getCustomerFlow(req, res) {
    try {
      const result = await AppointmentModel.getBarberPerformance(req.user.shopId);
      res.json({ barbers: result });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getAllDayOffRequests(req, res) {
    try {
      const requests = await DayOffModel.getAllRequests(req.user.shopId);
      res.json(requests);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async handleDayOff(req, res) {
    try {
      const { status } = req.body;
      const updated = await DayOffModel.updateRequestStatus(req.params.id, status, req.user.shopId);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getBillsReport(req, res) {
    try {
      const result = await BillModel.getBillsReport(req.user.shopId);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async updateMonthlySalary(req,res) {
    try {
      const salary=Finance.money(req.body?.monthlySalary,'Monthly salary');
      const user=(await require('../db').query(`UPDATE users SET monthly_salary=$3 WHERE id=$1 AND shop_id=$2 AND role IN ('receptionist','support')
        RETURNING id,monthly_salary`,[req.params.id,req.user.shopId,salary])).rows[0];
      if(!user)return res.status(404).json({error:'Reception or support staff member not found.'});
      res.json({id:user.id,monthly_salary:Number(user.monthly_salary)});
    } catch(error) {res.status(400).json({error:error.message});}
  },

  async updateCredentials(req,res) {
    try {
      const phone=normalizePhone(req.body?.phone);
      const password=String(req.body?.password||'');
      if(password&&(password.length<8||Buffer.byteLength(password)>72)) return res.status(400).json({error:'Use a password of at least 8 characters and at most 72 bytes.'});
      const hash=password?await bcrypt.hash(password,10):null;
      const user=(await require('../db').query(`UPDATE users SET phone=$3,has_workspace=true,password=COALESCE($4,password)
        WHERE id=$1 AND shop_id=$2 AND role IN ('barber','receptionist')
        RETURNING id,phone`,[req.params.id,req.user.shopId,phone,hash])).rows[0];
      if(!user)return res.status(404).json({error:'Workspace staff member not found.'});
      res.json(user);
    } catch(error) {res.status(400).json({error:error.code==='23505'?'This phone number is already used by a Mirror account.':error.message});}
  },

  async setUserActive(req,res) {
    try {
      if(typeof req.body?.active!=='boolean')return res.status(400).json({error:'Choose whether the account is active.'});
      const user=(await require('../db').query(`UPDATE users SET active=$3 WHERE id=$1 AND shop_id=$2 AND role IN ('barber','receptionist','support')
        RETURNING id,active`,[req.params.id,req.user.shopId,req.body.active])).rows[0];
      if(!user)return res.status(404).json({error:'Team account not found.'});
      res.json(user);
    } catch(error){res.status(400).json({error:error.message});}
  },

  async getShop(req, res) {
    try {
      const shop = await ShopModel.getById(req.user.shopId);
      res.json(shop);
    } catch (err) {
      res.status(err.code==='23505'?400:400).json({ error: err.code==='23505'?'This phone number is already used by a Mirror account.':err.message });
    }
  },

  async manageSubscription(req, res) {
    try {
      const { action, planCode } = req.body || {};
      const shop = await ShopModel.manageSubscription(req.user.shopId, action, planCode);
      if (!shop) return res.status(404).json({ error: 'Shop not found.' });
      res.json(shop);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },
};

module.exports = AdminController;
