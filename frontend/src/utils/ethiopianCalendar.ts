const DAY=86400000;
const EPOCH=1724221;
export const ethiopianMonths=['Meskerem','Tikimt','Hidar','Tahsas','Tir','Yekatit','Megabit','Miazia','Ginbot','Sene','Hamle','Nehase','Pagume'];
const jdn=(year:number,month:number,day:number)=>EPOCH+365*(year-1)+Math.floor(year/4)+30*(month-1)+day-1;
export const ethiopianDaysInMonth=(year:number,month:number)=>month<=12?30:year%4===3?6:5;
export function currentEthiopianDate(date=new Date()){
  const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'Africa/Addis_Ababa',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date).filter(part=>part.type!=='literal').map(part=>[part.type,part.value]));
  const gregorianYear=Number(parts.year),gregorianMonth=Number(parts.month),gregorianDay=Number(parts.day);
  const day=Math.floor(Date.UTC(gregorianYear,gregorianMonth-1,gregorianDay)/DAY)+2440588;
  let year=gregorianYear-8;
  while(day<jdn(year,1,1))year--;
  while(day>=jdn(year+1,1,1))year++;
  const offset=day-jdn(year,1,1);
  return {year,month:Math.floor(offset/30)+1,day:offset%30+1};
}
export const ethiopianLabel=(year:number,month:number)=>`${ethiopianMonths[month-1]} ${year}`;
