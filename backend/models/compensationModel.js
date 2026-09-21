const pool = require('../db');

const MODES = ['commission', 'salary', 'hybrid'];
const PERIODS = ['weekly', 'biweekly', 'monthly', 'custom'];
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function dateOnly(value, label = 'Date', required = false) {
  if (value === undefined || value === null || value === '') {
    if (required) throw new Error(`${label} is required.`);
    return null;
  }
  const result = String(value).slice(0, 10);
  if (!datePattern.test(result)) throw new Error(`${label} must be a valid date.`);
  const parsed = new Date(`${result}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== result) throw new Error(`${label} must be a valid date.`);
  return result;
}

function number(value, label, min = 0, max = 999999999) {
  if (value === '' || value === null || value === undefined || !Number.isFinite(Number(value)) || Number(value) < min || Number(value) > max) {
    throw new Error(`${label} must be between ${min} and ${max}.`);
  }
  return Math.round(Number(value) * 100) / 100;
}

function normalizeSetting(row) {
  if (!row) return null;
  return {
    barberId: Number(row.barber_id), barberName: row.barber_name || row.name,
    mode: row.mode, commissionRate: Number(row.commission_rate || 0), salaryAmount: Number(row.salary_amount || 0),
    showSalaryToBarber: Boolean(row.show_salary_to_barber), payDay: Number(row.pay_day || 30), periodType: row.period_type,
    periodAnchor: String(row.period_anchor).slice(0, 10), customStart: row.custom_start ? String(row.custom_start).slice(0, 10) : null,
    customEnd: row.custom_end ? String(row.custom_end).slice(0, 10) : null, effectiveFrom: String(row.effective_from).slice(0, 10),
    updatedAt: row.updated_at,
  };
}

function periodFor(setting, dateValue) {
  const date = dateOnly(dateValue || new Date().toISOString().slice(0, 10), 'Period date', true);
  if (setting.periodType === 'custom') return { start: setting.customStart, end: setting.customEnd, label: `${setting.customStart} to ${setting.customEnd}` };
  const current = new Date(`${date}T00:00:00Z`);
  if (setting.periodType === 'monthly') {
    const start = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), 1));
    const end = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + 1, 0));
    return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10), label: start.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }) };
  }
  const anchor = new Date(`${dateOnly(setting.periodAnchor, 'Period anchor', true)}T00:00:00Z`);
  const length = setting.periodType === 'biweekly' ? 14 : 7;
  const days = Math.floor((current.getTime() - anchor.getTime()) / 86400000);
  const offset = Math.floor(days / length) * length;
  const start = new Date(anchor.getTime() + offset * 86400000);
  const end = new Date(start.getTime() + (length - 1) * 86400000);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10), label: `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}` };
}

async function settingFor(shopId, barberId, db = pool) {
  const result = await db.query(`SELECT u.id AS barber_id,u.name AS barber_name,c.mode,c.commission_rate,c.salary_amount,c.show_salary_to_barber,c.pay_day,
    c.period_type,c.period_anchor::text,c.custom_start::text,c.custom_end::text,c.effective_from::text,c.updated_at
    FROM users u LEFT JOIN barber_compensation c ON c.barber_id=u.id AND c.shop_id=u.shop_id
    WHERE u.id=$1 AND u.shop_id=$2 AND u.role='barber'`, [barberId, shopId]);
  const row = result.rows[0];
  if (!row) throw new Error('Barber not found in this shop.');
  return normalizeSetting({ ...row, mode: row.mode || 'salary', commission_rate: row.commission_rate || 0, salary_amount: row.salary_amount || 0, show_salary_to_barber: row.show_salary_to_barber || false, pay_day:row.pay_day || 30, period_type: row.period_type || 'monthly', period_anchor: row.period_anchor || new Date().toISOString().slice(0, 10), effective_from: row.effective_from || new Date().toISOString().slice(0, 10) });
}

const Compensation = {
  MODES, PERIODS, periodFor, settingFor,
  async list(shopId) {
    const rows = (await pool.query(`SELECT u.id AS barber_id,u.name AS barber_name,c.mode,c.commission_rate,c.salary_amount,c.show_salary_to_barber,c.pay_day,
      c.period_type,c.period_anchor::text,c.custom_start::text,c.custom_end::text,c.effective_from::text,c.updated_at
      FROM users u LEFT JOIN barber_compensation c ON c.barber_id=u.id AND c.shop_id=u.shop_id
      WHERE u.shop_id=$1 AND u.role='barber' ORDER BY u.name`, [shopId])).rows;
    return rows.map(row => normalizeSetting({ ...row, mode: row.mode || 'salary', commission_rate: row.commission_rate || 0, salary_amount: row.salary_amount || 0, show_salary_to_barber: row.show_salary_to_barber || false, pay_day:row.pay_day || 30, period_type: row.period_type || 'monthly', period_anchor: row.period_anchor || new Date().toISOString().slice(0, 10), effective_from: row.effective_from || new Date().toISOString().slice(0, 10) }));
  },
  async save(shopId, userId, barberId, data = {}) {
    const mode = String(data.mode || 'salary').toLowerCase();
    const periodType = String(data.periodType || 'monthly').toLowerCase();
    if (!MODES.includes(mode)) throw new Error('Choose salary, commission, or hybrid pay.');
    if (!PERIODS.includes(periodType)) throw new Error('Choose a valid earnings period.');
    const rate = mode === 'salary' ? 0 : number(data.commissionRate, 'Commission rate', 0, 100);
    const salary = mode === 'commission' ? 0 : number(data.salaryAmount || 0, 'Salary amount');
    const payDay=Number(data.payDay || 30);
    if(!Number.isInteger(payDay)||payDay<1||payDay>30) throw new Error('Choose an Ethiopian calendar pay day from 1 to 30.');
    const anchor = dateOnly(data.periodAnchor || new Date().toISOString().slice(0, 10), 'Period anchor', true);
    const effective = dateOnly(data.effectiveFrom || new Date().toISOString().slice(0, 10), 'Effective date', true);
    const customStart = dateOnly(data.customStart, 'Custom period start', periodType === 'custom');
    const customEnd = dateOnly(data.customEnd, 'Custom period end', periodType === 'custom');
    if (periodType === 'custom' && customEnd < customStart) throw new Error('Custom period end must be on or after its start.');
    await settingFor(shopId, barberId);
    await pool.query(`INSERT INTO barber_compensation (barber_id,shop_id,mode,commission_rate,salary_amount,show_salary_to_barber,pay_day,period_type,period_anchor,custom_start,custom_end,effective_from,updated_by,updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW())
      ON CONFLICT (barber_id) DO UPDATE SET mode=EXCLUDED.mode,commission_rate=EXCLUDED.commission_rate,salary_amount=EXCLUDED.salary_amount,
      show_salary_to_barber=EXCLUDED.show_salary_to_barber,pay_day=EXCLUDED.pay_day,period_type=EXCLUDED.period_type,period_anchor=EXCLUDED.period_anchor,
      custom_start=EXCLUDED.custom_start,custom_end=EXCLUDED.custom_end,effective_from=EXCLUDED.effective_from,updated_by=EXCLUDED.updated_by,updated_at=NOW()
      RETURNING *`, [barberId,shopId,mode,rate,salary,data.showSalaryToBarber === true,payDay,periodType,anchor,customStart,customEnd,effective,userId]);
    return settingFor(shopId, barberId);
  },
  async snapshotForBill(shopId, barberId, baseValue, db = pool) {
    const setting = await settingFor(shopId, barberId, db);
    const base = Math.round(Number(baseValue || 0) * 100) / 100;
    if (setting.mode === 'salary') return { rate: null, base: null, amount: null };
    const amount = Math.round(base * setting.commissionRate) / 100;
    return { rate: setting.commissionRate, base, amount };
  },
  async earnings(shopId, barberId, dateValue) {
    const setting = await settingFor(shopId, barberId);
    const shop = (await pool.query('SELECT currency,timezone,(CURRENT_TIMESTAMP AT TIME ZONE timezone)::date::text AS today FROM shops WHERE id=$1', [shopId])).rows[0];
    if (!shop) throw new Error('Shop not found.');
    const target = dateOnly(dateValue || shop.today, 'Earnings date', true);
    const period = periodFor(setting, target);
    if (setting.mode === 'salary') return { visible: false, mode: setting.mode, barberName: setting.barberName };
    // A payroll item is the owner's explicit settlement record. Once it is marked
    // paid, only payments collected after that moment belong to the next balance.
    const settlement = (await pool.query(`SELECT i.paid_at,r.period_start::text AS period_start,r.period_end::text AS period_end
      FROM payroll_items i JOIN payroll_runs r ON r.id=i.payroll_run_id
      WHERE r.shop_id=$1 AND i.user_id=$2 AND i.paid_at IS NOT NULL
      ORDER BY i.paid_at DESC LIMIT 1`, [shopId, barberId])).rows[0] || null;
    const settledAt = settlement?.paid_at || null;
    const result = await pool.query(`SELECT COUNT(*)::int AS paid_services,
      COALESCE(SUM(CASE WHEN commission_amount IS NOT NULL THEN commission_base ELSE COALESCE(subtotal,total-COALESCE(tax,0)) END),0) AS service_sales,
      COALESCE(SUM(commission_amount),0) AS commission_earned,
      COUNT(*) FILTER (WHERE commission_amount IS NOT NULL)::int AS commission_services,
      COUNT(*) FILTER (WHERE commission_amount IS NULL)::int AS legacy_services
      FROM (SELECT DISTINCT ON (appointment_id) * FROM bills WHERE shop_id=$1 AND barber_id=$2 AND paid=true ORDER BY appointment_id,generated_at DESC,id DESC) b
      WHERE COALESCE(payment_day,paid_at::date,generated_at::date) BETWEEN $3 AND $4
        AND ($5::timestamptz IS NULL OR COALESCE(paid_at,generated_at)>$5::timestamptz)`, [shopId, barberId, period.start, period.end, settledAt]);
    const totals = result.rows[0] || {};
    return { visible: true, mode: setting.mode, barberName: setting.barberName, period, periodType: setting.periodType, commissionRate: setting.commissionRate,
      paidServices: Number(totals.paid_services || 0), commissionServices: Number(totals.commission_services || 0), legacyServices: Number(totals.legacy_services || 0), payDay:setting.payDay,
      serviceSales: Number(totals.service_sales || 0), commissionEarned: Number(totals.commission_earned || 0), salaryIncluded: setting.showSalaryToBarber && setting.salaryAmount > 0,
      salaryAmount: setting.showSalaryToBarber ? setting.salaryAmount : null, currency: shop.currency || 'ETB', lastUpdated: setting.updatedAt,
      lastPaidAt: settledAt, lastPaidPeriod: settlement ? { start: settlement.period_start, end: settlement.period_end } : null };
  },
};

module.exports = Compensation;
