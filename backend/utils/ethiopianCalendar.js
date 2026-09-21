const DAY_MS = 86400000;
const ETHIOPIAN_EPOCH_JDN = 1724221;

function validYear(value) {
  const year = Number(value);
  if (!Number.isInteger(year) || year < 2000 || year > 2200) throw new Error('Choose a valid Ethiopian calendar year.');
  return year;
}

function daysInMonth(year, month) {
  if (month <= 12) return 30;
  return year % 4 === 3 ? 6 : 5;
}

function toJdn(year, month, day) {
  year = validYear(year);
  month = Number(month);
  day = Number(day);
  if (!Number.isInteger(month) || month < 1 || month > 13 || !Number.isInteger(day) || day < 1 || day > daysInMonth(year, month)) throw new Error('Choose a valid Ethiopian calendar date.');
  return ETHIOPIAN_EPOCH_JDN + 365 * (year - 1) + Math.floor(year / 4) + 30 * (month - 1) + day - 1;
}

function jdnToIso(jdn) {
  return new Date((jdn - 2440588) * DAY_MS).toISOString().slice(0, 10);
}

function toGregorian(year, month, day) {
  return jdnToIso(toJdn(year, month, day));
}

function currentEthiopianDate(now = new Date()) {
  const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'Africa/Addis_Ababa',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now).filter(part=>part.type!=='literal').map(part=>[part.type,part.value]));
  const gregorianYear=Number(parts.year),gregorianMonth=Number(parts.month),gregorianDay=Number(parts.day);
  const jdn = Math.floor(Date.UTC(gregorianYear, gregorianMonth - 1, gregorianDay) / DAY_MS) + 2440588;
  let year = gregorianYear - 8;
  while (jdn < toJdn(year, 1, 1)) year -= 1;
  while (jdn >= toJdn(year + 1, 1, 1)) year += 1;
  const offset = jdn - toJdn(year, 1, 1);
  return { year, month: Math.floor(offset / 30) + 1, day: offset % 30 + 1 };
}

function monthRange(year, month) {
  year = validYear(year);
  month = Number(month);
  if (!Number.isInteger(month) || month < 1 || month > 13) throw new Error('Choose an Ethiopian calendar month.');
  const next = month === 13 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
  const end = new Date(`${toGregorian(next.year, next.month, 1)}T12:00:00Z`);
  end.setUTCDate(end.getUTCDate() - 1);
  return { start: toGregorian(year, month, 1), end: end.toISOString().slice(0, 10) };
}

module.exports = { daysInMonth, toGregorian, currentEthiopianDate, monthRange };
