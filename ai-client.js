// Browser connector. Gemini secret stays in Firebase Functions, never in GitHub Pages.
const cfg=window.NOUKATSU_AI_CONFIG;
if(cfg?.enabled && cfg.firebase?.apiKey && cfg.firebase?.projectId){
  const base='https://www.gstatic.com/firebasejs/11.6.0/';
  try{
    const [{initializeApp},{getAuth,GoogleAuthProvider,signInWithPopup},{getFunctions,httpsCallable}]=await Promise.all([
      import(base+'firebase-app.js'),import(base+'firebase-auth.js'),import(base+'firebase-functions.js')
    ]);
    const app=(await import(base+'firebase-app.js')).getApps()[0] || initializeApp(cfg.firebase);const auth=getAuth(app);const fn=getFunctions(app,'asia-northeast1');
    const getPrompt=httpsCallable(fn,'newBrainPrompt');
    window.noukatsuAI={
      async generate(kind){if(!auth.currentUser)await signInWithPopup(auth,new GoogleAuthProvider());const result=await getPrompt({kind});return String(result.data.prompt||'')},
      signedIn(){return !!auth.currentUser}
    };
  }catch(err){console.warn('AI接続を準備できませんでした',err)}
}
