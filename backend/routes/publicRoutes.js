const express = require('express');
const ShopModel = require('../models/shopModel');
const Website=require('../models/websiteModel');
const pool=require('../db');

const router = express.Router();
router.get('/plans',async(_req,res)=>{
  try {res.json((await ShopModel.getPlans()).map(({code,name,monthly_price,description,features,limits,tier,highlights,is_trial_default})=>({code,name,monthly_price,description,features,limits,tier,highlights,is_trial_default,currency:'ETB'})));}
  catch {res.status(503).json({error:'Package details are temporarily unavailable.'});}
});

router.get('/platform-contact',async(_req,res)=>{
  try {
    const contact=(await pool.query(`SELECT name,email,phone FROM users
      WHERE role='platform_admin' AND active=true
      ORDER BY id LIMIT 1`)).rows[0]||null;
    res.json(contact?{name:contact.name,email:contact.email,phone:contact.phone}:{name:'Mirror platform',email:null,phone:null});
  } catch {res.status(503).json({error:'Platform contact is temporarily unavailable.'});}
});

router.get('/shop', async (req, res) => {
  try {
    const shop = await ShopModel.getDefaultPublic({slug:req.query.shop,subdomain:req.query.subdomain});
    if (!shop) return res.status(404).json({ error: 'Shop not found.' });
    res.json({
      id: shop.id,
      name: shop.name,
      slug: shop.slug,
      websiteSubdomain:shop.website_subdomain||shop.slug,
      websiteUrl:Website.publicUrl(shop.website_subdomain),
      currency: shop.currency,
      address: shop.address,
      phone: shop.phone,
      planCode: shop.plan_code,
      features: {
        publicWebsite: shop.tier==='max'&&Boolean(shop.features?.publicWebsite),
        onlineBooking: shop.tier==='max'&&Boolean(shop.features?.onlineBooking),
      },
      website:await Website.publicConfig(shop.id),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
