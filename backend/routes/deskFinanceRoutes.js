const express = require('express');
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const Finance = require('../models/deskFinanceModel');
const Desk = require('../models/receptionDeskModel');
const Operations = require('../models/operationsModel');
const run = fn => async(req,res)=>{ try {res.json(await fn(req));} catch(error) {res.status(400).json({error:error.code==='23505' ? 'An account with this name already exists.' : error.message});} };

const admin = express.Router();
admin.use(auth,role(['admin']));
admin.get('/finance',run(r=>Finance.settings(r.user.shopId,true)));
// Owners and reception use one expense ledger. Payroll also writes Salary entries here.
admin.get('/expenses',run(r=>Operations.getExpenses(r.user.shopId)));
admin.post('/expenses',run(r=>Finance.expense(r.user.shopId,r.user.id,r.body)));
admin.post('/finance/accounts',run(r=>Finance.createAccount(r.user.shopId,r.user.id,r.body)));
admin.put('/finance/accounts/:id',run(r=>Finance.setAccountActive(r.user.shopId,r.params.id,r.body.active)));
admin.put('/finance/vat',run(()=>{throw new Error('VAT is now optional at checkout: reception can add 15% to each payment.');}));
admin.get('/finance/closings',run(r=>Finance.closings(r.user.shopId)));
admin.post('/finance/closings/:id/reopen',run(r=>Finance.reopen(r.user.shopId,r.user.id,r.params.id,r.body.reason)));

const reception = express.Router();
reception.use(auth,role(['receptionist']));
reception.get('/finance',run(r=>Finance.settings(r.user.shopId)));
reception.get('/desk',run(r=>Desk.board(r.user.shopId)));
reception.post('/desk/visits',run(r=>Desk.create(r.user.shopId,r.user.id,r.body)));
reception.put('/desk/visits/:id/pay',run(r=>Desk.checkout(r.user.shopId,r.user.id,r.params.id,r.body)));
reception.put('/desk/visits/:id/:action',run(r=>Desk.update(r.user.shopId,r.user.id,r.params.id,r.params.action,r.body)));
reception.put('/desk/barbers/:id',run(r=>Desk.availability(r.user.shopId,r.user.id,r.params.id,r.body.status)));
reception.get('/daily',run(r=>Finance.daily(r.user.shopId,r.query.date)));
reception.put('/daily/opening',run(r=>Finance.opening(r.user.shopId,r.user.id,r.body)));
reception.post('/daily/close',run(r=>Finance.closeDay(r.user.shopId,r.user.id,r.body)));
module.exports={admin,reception};
