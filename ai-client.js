// Gemini is called ONLY through authenticated server-side Firebase callable functions.
import {firebaseConfig} from './firebase-config.js';
try{
 const [{getApp,getApps,initializeApp},{getAuth},{getFunctions,httpsCallable}]=await Promise.all([
 import('https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js'),
 import('https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js'),
 import('https://www.gstatic.com/firebasejs/10.14.1/firebase-functions.js')]);
 const app=getApps().length?getApp():initializeApp(firebaseConfig);const auth=getAuth(app);const call=httpsCallable(getFunctions(app,'asia-northeast1'),'newBrainPrompt');
 window.noukatsuAI={async generate(kind){if(!auth.currentUser)throw Error('ログインしてください');const res=await call({kind});return String(res.data?.prompt||'')},signedIn(){return !!auth.currentUser}};
}catch(err){console.warn('AIサービスの準備ができませんでした',err)}
