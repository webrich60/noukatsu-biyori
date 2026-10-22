// IndexedDB backup bypasses the small per-origin localStorage quota without deleting user records.
const DB='noukatsu-biyori-records';
const STORE='records';
let ready;
export function openStore(){
 if(ready)return ready;
 ready=new Promise((resolve,reject)=>{
  if(!('indexedDB' in window))return reject(Error('IndexedDB unavailable'));
  const request=indexedDB.open(DB,1);
  request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE)};
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error);
 });return ready;
}
export async function readRecord(key){
 const db=await openStore();return new Promise((resolve,reject)=>{
  const req=db.transaction(STORE,'readonly').objectStore(STORE).get(key);
  req.onsuccess=()=>resolve(req.result??null);req.onerror=()=>reject(req.error);
 });
}
export async function writeRecord(key,value){
 const db=await openStore();return new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(value,key);
  tx.oncomplete=()=>resolve(true);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('IndexedDB aborted'));
 });
}
export async function removeRecord(key){
 const db=await openStore();return new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(key);
  tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);
 });
}
export async function prepareRecord(key){
 let existing=null;try{existing=await readRecord(key)}catch(e){console.warn('IndexedDB read failed:',e)}
 if(existing)return existing;
 try{const legacy=JSON.parse(localStorage.getItem(key));if(legacy){await writeRecord(key,legacy);return legacy}}catch(e){console.warn('Legacy record import failed:',e)}
 return null;
}
window.NOUKATSU_LOCAL_SAVE=(key,data)=>writeRecord(key,data);
window.NOUKATSU_LOCAL_DELETE=(key)=>removeRecord(key);
