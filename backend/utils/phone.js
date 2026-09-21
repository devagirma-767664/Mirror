function normalizePhone(value) {
  const raw=String(value??'').trim();
  const digits=raw.replace(/[^0-9]/g,'');
  let canonical='';
  if (/^0[79]\d{8}$/.test(digits)) canonical=`+251${digits.slice(1)}`;
  else if (/^251[79]\d{8}$/.test(digits)) canonical=`+${digits}`;
  else if (/^\+251[79]\d{8}$/.test(raw)) canonical=raw;
  if(!canonical) throw new Error('Enter an Ethiopian mobile number, for example 0912345678.');
  return canonical;
}
module.exports={normalizePhone};
