import { createClient } from '@/lib/supabase/client';

export type FridgeItem = { id:string; name:string; quantity:number; unit?:string; place?:string; expires:string; createdAt:string };
export type FridgeShoppingItem = { id:string; name:string; checked:boolean };
export type FridgeSnapshot = { items:FridgeItem[]; shopping:FridgeShoppingItem[] };
const db = createClient();

function itemRow(item:FridgeItem,userId:string){return {id:item.id,user_id:userId,name:item.name,quantity:item.quantity,unit:item.unit??'개',expires:item.expires||null,created_at:item.createdAt};}
function shoppingRow(item:FridgeShoppingItem,userId:string){return {id:item.id,user_id:userId,name:item.name,checked:item.checked};}
function asItem(row:Record<string,unknown>):FridgeItem{return {id:String(row.id),name:String(row.name),quantity:Number(row.quantity),unit:String(row.unit??'개'),expires:typeof row.expires==='string'?row.expires:'',createdAt:String(row.created_at)};}
function asShopping(row:Record<string,unknown>):FridgeShoppingItem{return {id:String(row.id),name:String(row.name),checked:Boolean(row.checked)};}
export async function readFridge(userId:string):Promise<FridgeSnapshot>{
  if(!db)throw new Error('Supabase가 연결되지 않았어.');
  const [items,shopping]=await Promise.all([
    db.from('fridge_items').select('*').eq('user_id',userId),
    db.from('fridge_shopping').select('*').eq('user_id',userId)
  ]);
  if(items.error)throw items.error;if(shopping.error)throw shopping.error;
  return {items:(items.data??[]).map(row=>asItem(row)),shopping:(shopping.data??[]).map(row=>asShopping(row))};
}
export async function saveFridgeDiff(userId:string,before:FridgeSnapshot,after:FridgeSnapshot){
  if(!db)throw new Error('Supabase가 연결되지 않았어.');
  const removedItems=before.items.filter(x=>!after.items.some(y=>x.id===y.id)).map(x=>x.id);
  const removedShopping=before.shopping.filter(x=>!after.shopping.some(y=>x.id===y.id)).map(x=>x.id);
  const changedItems=after.items.filter(x=>JSON.stringify(before.items.find(y=>y.id===x.id))!==JSON.stringify(x));
  const changedShopping=after.shopping.filter(x=>JSON.stringify(before.shopping.find(y=>y.id===x.id))!==JSON.stringify(x));
  if(changedItems.length){const {error}=await db.from('fridge_items').upsert(changedItems.map(x=>itemRow(x,userId)));if(error)throw error;}
  if(changedShopping.length){const {error}=await db.from('fridge_shopping').upsert(changedShopping.map(x=>shoppingRow(x,userId)));if(error)throw error;}
  if(removedItems.length){const {error}=await db.from('fridge_items').delete().eq('user_id',userId).in('id',removedItems);if(error)throw error;}
  if(removedShopping.length){const {error}=await db.from('fridge_shopping').delete().eq('user_id',userId).in('id',removedShopping);if(error)throw error;}
}
