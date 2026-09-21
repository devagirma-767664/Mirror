import type {SubscriptionPlan} from './subscription';
export type PlanCode = string;
export const coreContents=['Walk-ins, payments, expenses and stock'];
export function planContents(plan:SubscriptionPlan){
  const daily=Number(plan.limits?.dailyCustomers);
  return [daily>0?`Up to ${daily} customers each day`:'Unlimited customers each day',
    plan.features?.telegramDigest?'Telegram report each day':'No Telegram report',
    `Up to ${plan.limits?.staff||'the configured number of'} staff accounts`,
    ...coreContents,...(plan.highlights||[]),
    ...(plan.tier==='max'&&plan.features?.publicWebsite?['Website and online booking support']:[])];
}
