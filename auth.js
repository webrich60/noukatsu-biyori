import {firebaseConfig} from './firebase-config.js';
const root=document.getElementById('app');
const configured=Boolean(firebaseConfig.apiKey&&firebaseConfig.authDomain&&firebaseConfig.projectId&&firebaseConfig.appId);
const escape=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const renderShell=(body)=>{root.innerHTML=`<main class="auth-wrap"><section class="auth-card"><img class="auth-owl" src="assets/owl.png" alt="公式マスコットのフクロウ"><h1>やさしい脳活日和</h1>${body}</section></main>`;};
let started=false;
function startApp(user){if(started)return;started=true;
 window.NOUKATSU_USER=user?{uid:user.uid,email:user.email}:null;
 const key=user?`noukatsu-v1-user-${user.uid}`:'noukatsu-v1-data';
 // 未ログイン時の保存記録は別アカウントへ自動的にコピーしない。
 if(user&&!localStorage.getItem(key)&&localStorage.getItem('noukatsu-v1-data')){
  if(confirm('この端末に以前の脳活記録があります。ログイン中のアカウントにコピーしますか？（ログイン後にクラウドへ保存されます）')){
   localStorage.setItem(key,localStorage.getItem('noukatsu-v1-data'));try{window.NOUKATSU_CLOUD_SAVE?.(JSON.parse(localStorage.getItem(key)))}catch{}
  }
 }
 const js=document.createElement('script');js.src='app.js';js.onerror=()=>renderShell('<p>アプリを読み込めませんでした。ページを再読み込みしてください。</p>');document.body.append(js);
}
window.NOUKATSU_SIGN_OUT=()=>location.reload();
if(!configured){
 renderShell(`<p>ログイン機能の利用には、Firebaseの初期設定が必要です。</p><p class="auth-note">設定前でも、これまでのゲームを体験できます。体験モードでは本人認証やクラウド保存は行われません。</p><button class="big-btn blue" id="demo">端末内で体験する</button>`);
 document.getElementById('demo').onclick=()=>startApp(null);
}else{
 try{
  const {initializeApp}=await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js');
  const {getAuth,onAuthStateChanged,GoogleAuthProvider,signInWithPopup,signInWithRedirect,getRedirectResult,createUserWithEmailAndPassword,signInWithEmailAndPassword,sendEmailVerification,sendPasswordResetEmail,signOut}=await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js');
  const auth=getAuth(initializeApp(firebaseConfig));auth.languageCode='ja';
  window.NOUKATSU_SIGN_OUT=async()=>{await signOut(auth);location.reload()};
  const authPage=(message='')=>{renderShell(`<p>Googleまたはメールアドレスでログイン</p><div id="auth-message" role="status" aria-live="polite">${escape(message)}</div><button id="google-login" class="big-btn blue">Googleでログイン</button><p class="auth-separator">または</p><form id="auth-form" class="auth-form"><label>メールアドレス<input id="login-email" type="email" autocomplete="email" required></label><label>パスワード<input id="login-password" type="password" minlength="8" autocomplete="current-password" required></label><button type="submit" class="big-btn blue">メールでログイン</button><button type="button" class="button-secondary" id="email-register">はじめての方：新規登録</button><button type="button" class="button-secondary" id="password-reset">パスワードを忘れた場合</button></form><p class="auth-note">初回ログイン後に、年齢・呼び名・任意の性別を設定できます。</p>`);
   const msg=document.getElementById('auth-message');
   const fail=e=>{const messages={'auth/email-already-in-use':'登録済みのメールアドレスです。ログインしてください。','auth/invalid-credential':'メールアドレスまたはパスワードが正しくありません。','auth/unauthorized-domain':'Firebaseでこのサイトのドメインが許可されていません。','auth/popup-blocked':'ポップアップがブロックされました。','auth/weak-password':'パスワードを8文字以上にしてください。'};msg.textContent=messages[e.code]||`ログイン処理に失敗しました（${e.code||'通信エラー'}）。`;};
   document.getElementById('google-login').onclick=async()=>{try{await signInWithPopup(auth,new GoogleAuthProvider())}catch(e){if(e.code==='auth/popup-blocked') {try{await signInWithRedirect(auth,new GoogleAuthProvider())}catch(er){fail(er)}}else fail(e)}};
   document.getElementById('auth-form').onsubmit=async e=>{e.preventDefault();try{await signInWithEmailAndPassword(auth,document.getElementById('login-email').value,document.getElementById('login-password').value)}catch(er){fail(er)}};
   document.getElementById('email-register').onclick=async()=>{const email=document.getElementById('login-email').value;const password=document.getElementById('login-password').value;if(!email||password.length<8){msg.textContent='メールアドレスと8文字以上のパスワードを入力してください。';return}try{let c=await createUserWithEmailAndPassword(auth,email,password);await sendEmailVerification(c.user);msg.textContent='確認メールを送りました。メール内のリンクで認証してください。';}catch(e){fail(e)}};
   document.getElementById('password-reset').onclick=async()=>{const email=document.getElementById('login-email').value;if(!email){msg.textContent='メールアドレスを入力してください。';return}try{await sendPasswordResetEmail(auth,email);msg.textContent='パスワード再設定メールの送信を受け付けました。';}catch(e){fail(e)}};
  };
  renderShell('<p>ログイン状態を確認しています…</p>');
  await getRedirectResult(auth).catch(()=>null);
  onAuthStateChanged(auth,async user=>{if(!user){authPage();return}if(started)return;try{const {initializeSync,queueSave}=await import('./cloud-sync.js');await initializeSync(user);window.NOUKATSU_CLOUD_SAVE=(data)=>queueSave(user.uid,data);}catch(e){console.warn('Cloud sync unavailable:',e);window.NOUKATSU_SYNC_STATUS='クラウド同期を利用できません。端末内で利用できます';}startApp(user)},e=>authPage(`認証エラー: ${e.code}`));
 }catch(e){renderShell(`<p>認証サービスを読み込めませんでした。</p><p class="auth-note">GitHub PagesなどHTTPSの公開先で開いてください。${escape(e.message)}</p>`)}
}
