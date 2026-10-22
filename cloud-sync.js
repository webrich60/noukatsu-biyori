import {prepareRecord,writeRecord} from './storage.js?v=2.0.0-rc1';
// Per-user Firestore backup/sync. Firebase Auth user ID is the sole document owner.
// Never put billing entitlements, admin permissions, or API secrets in this writable document.
import {firebaseConfig} from './firebase-config.js';
import {getApp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {getFirestore,doc,getDoc,setDoc} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
const db=getFirestore(getApp());
const valid=x=>x&&typeof x==='object'&&!Array.isArray(x)&&Array.isArray(x.history);
const keyFor=uid=>'noukatsu-v1-user-'+uid;
let pending=Promise.resolve();
function status(s){window.NOUKATSU_SYNC_STATUS=s;document.dispatchEvent(new CustomEvent('noukatsu-sync-status',{detail:s}));}
export async function initializeSync(user){
 const ref=doc(db,'users',user.uid),key=keyFor(user.uid);
 let cloud;
 try{const snap=await getDoc(ref);if(snap.exists()){const rec=snap.data();if(valid(rec.gameData))cloud=rec.gameData;}}catch(e){status('クラウド読込失敗：端末内で利用できます');return;}
 let local=await prepareRecord(key);
 if(cloud){
   // Never silently overwrite user data from this device.
   if(valid(local) && JSON.stringify(local)!==JSON.stringify(cloud)){
     const preferLocal=confirm(`この端末の記録とクラウドの記録が異なります。

「OK」：この端末の記録をクラウドへ保存
「キャンセル」：クラウドの記録をこの端末に読み込む

※安全のため、必要なら先にJSONでバックアップしてください。`);
     if(preferLocal){queueSave(user.uid,local);status('端末の記録をクラウドへ保存中');return;}
   }
   try{await writeRecord(key,cloud);try{localStorage.setItem(key,JSON.stringify(cloud))}catch{};status('クラウドの記録を読み込みました');}catch{status('端末への記録保存に失敗しました');}
 }else if(valid(local)){
   queueSave(user.uid,local);status('初回バックアップ中');
 }else status('クラウド同期の準備ができました');
}
export function queueSave(uid,data){
 if(!uid||!valid(data))return;
 const copy=JSON.parse(JSON.stringify(data));
 // Sequence writes to prevent an older save from overwriting a newer one.
 pending=pending.catch(()=>{}).then(async()=>{
   try{
     const byteSize=new Blob([JSON.stringify(copy)]).size;
     if(byteSize>750000){status('クラウド保存の容量上限に近づきました。JSONで記録をバックアップしてください');return;}
     await setDoc(doc(db,'users',uid),{gameData:copy,updatedAt:new Date().toISOString()},{merge:true});
     status('クラウドに保存しました');
   }catch(e){console.warn('Cloud sync failed:',e.code||e.message);status('クラウド保存に失敗。端末には保存されています');}
 });
}
