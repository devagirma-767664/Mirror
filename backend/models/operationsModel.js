const pool = require('../db');

const OperationsModel = {
  async getInventory(shopId) {
    const result = await pool.query(
      `SELECT *, (quantity <= reorder_level) AS low_stock,
              ROUND((quantity * unit_cost)::numeric, 2) AS stock_value
       FROM inventory_items WHERE shop_id = $1 AND active = true ORDER BY low_stock DESC, name`,
      [shopId]
    );
    return result.rows;
  },

  async createInventoryItem(shopId, data) {
    const result = await pool.query(
      `INSERT INTO inventory_items (shop_id, name, sku, category, quantity, reorder_level, unit, unit_cost, supplier)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [shopId, data.name, data.sku || null, data.category || 'Supplies', Number(data.quantity || 0), Number(data.reorderLevel || 0), data.unit || 'items', Number(data.unitCost || 0), data.supplier || null]
    );
    return result.rows[0];
  },

  async updateInventoryItem(shopId, id, data) {
    const result = await pool.query(
      `UPDATE inventory_items SET name=$3, sku=$4, category=$5, reorder_level=$6, unit=$7, unit_cost=$8, supplier=$9, updated_at=NOW()
       WHERE id=$1 AND shop_id=$2 AND active=true RETURNING *`,
      [id, shopId, data.name, data.sku || null, data.category || 'Supplies', Number(data.reorderLevel || 0), data.unit || 'items', Number(data.unitCost || 0), data.supplier || null]
    );
    return result.rows[0];
  },

  async adjustInventory(shopId, id, quantityChange, reason, userId) {
    if (!Number.isFinite(Number(quantityChange)) || Number(quantityChange) === 0 || Math.abs(Number(quantityChange)) > 999999999) throw new Error('Enter a valid non-zero stock quantity.');
    if (Math.abs(Number(quantityChange)*100-Math.round(Number(quantityChange)*100))>0.00001) throw new Error('Stock quantities support at most two decimal places.');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const itemResult = await client.query(
        `UPDATE inventory_items SET quantity = quantity + $3, updated_at=NOW()
         WHERE id=$1 AND shop_id=$2 AND active=true AND quantity + $3 >= 0 RETURNING *`,
        [id, shopId, Number(quantityChange)]
      );
      if (!itemResult.rows[0]) throw new Error('Inventory adjustment would make stock negative or item was not found.');
      await client.query(
        `INSERT INTO inventory_movements (shop_id, inventory_item_id, quantity_change, reason, recorded_by)
         VALUES ($1,$2,$3,$4,$5)`,
        [shopId, id, Number(quantityChange), reason || 'Stock adjustment', userId]
      );
      await client.query('COMMIT');
      return itemResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async getExpenses(shopId) {
    const result = await pool.query(
      `SELECT e.*, u.name AS recorded_by_name FROM expenses e
       LEFT JOIN users u ON u.id=e.recorded_by WHERE e.shop_id=$1
       ORDER BY e.expense_date DESC, e.created_at DESC`,
      [shopId]
    );
    return result.rows;
  },

  async createExpense(shopId, userId, data) {
    const result = await pool.query(
      `INSERT INTO expenses (shop_id, category, description, amount, expense_date, recorded_by)
       VALUES ($1,$2,$3,$4,COALESCE($5::date,CURRENT_DATE),$6) RETURNING *`,
      [shopId, data.category, data.description, Number(data.amount), data.expenseDate || null, userId]
    );
    return result.rows[0];
  },
};

module.exports = OperationsModel;
