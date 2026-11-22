(function(root){
'use strict';
function phoneForms(value){let d=String(value||'').replace(/\D/g,'');if(d.startsWith('00'))d=d.slice(2);const forms=new Set(d?[d]:[]);if(d.startsWith('241')&&d.length>10){const n=d.slice(3);forms.add(n);if(n.length===8)forms.add('0'+n)}if(d.length===9&&d.startsWith('0')){forms.add(d.slice(1));forms.add('241'+d.slice(1))}if(d.length===8){forms.add('0'+d);forms.add('241'+d)}if(d.length===11&&d.startsWith('1'))forms.add(d.slice(1));return forms}
function samePhone(a,b){const x=phoneForms(a),y=phoneForms(b);for(const v of x)if(y.has(v))return true;return false}
const api=Object.freeze({phoneForms,samePhone});root.G10ParentPhone=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
