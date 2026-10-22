// Development-only verification; run: node question-audit.js
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const c={window:{},console};vm.createContext(c);vm.runInContext(fs.readFileSync('kanji-bank.js','utf8'),c);
const rows=c.window.NOUKATSU_KANJI_BANK;const grades=['小3','小4','小5','小6','中1','中2','中3'];
assert(rows.length>0);const seen=new Set();for(const r of rows){assert(grades.includes(r.grade));for(const k of ['kanji','reading','word'])assert(typeof r[k]==='string'&&r[k].trim());assert(r.word.includes(r.kanji),JSON.stringify(r));const key=r.grade+'|'+r.kanji;assert(!seen.has(key),'duplicate: '+key);seen.add(key)}
console.log('Kanji entries verified:',rows.length);for(const g of grades)console.log(g,rows.filter(x=>x.grade===g).length);
console.log('Note: dataset size and formatting checks DO NOT establish official grade coverage or every reading correctness.');
