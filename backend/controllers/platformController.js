const ShopModel = require('../models/shopModel');

const PlatformController = {
  async overview(_req, res) {
    try {
      const [rows, plans] = await Promise.all([ShopModel.getAllWithMetrics(), require('../models/planModel').list()]);
      const shops=rows.map(shop=>({...shop,access:require('../models/subscriptionModel').access(shop)}));
      const metrics = {
        shops: shops.length,
        active: shops.filter((shop) => shop.access.status==='active').length,
        trial: shops.filter((shop) => shop.access.status==='trial').length,
        cancelled: shops.filter((shop) => shop.access.status==='cancelled').length,
        expired: shops.filter((shop) => ['trial_expired','past_due'].includes(shop.access.status)).length,
        pending: shops.filter((shop) => shop.pending_payment).length,
        recurringRevenue: shops.filter((shop) => shop.access.status==='active'&&shop.subscription_source!=='free_grant').reduce((sum, shop) => sum + Number(shop.monthly_price || 0), 0),
      };
      res.json({ shops, plans, metrics });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

};

module.exports = PlatformController;
