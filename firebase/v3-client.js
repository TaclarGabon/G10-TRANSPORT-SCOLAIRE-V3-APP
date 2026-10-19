/* G10 V3 — client Firebase isolé. Ne modifie jamais demoState. 
   Compatible avec Firebase compat 10.x déjà utilisé dans le dépôt.
   Les règles serveur doivent être installées et testées avant toute écriture.
*/
(function(global){
"use strict";
const ROOT="g10TransportScolaireV3";
const SOURCEREAD="g10TransportScolaireV2/demoState/state";
const MODULES=new Set(["subs","payments","expenses","circuits","movements","drivers","staff"]);
const KEY=/^[a-zA-Z0-9_-]{1,128}$/;
function assertKey(k){if(typeof k!=="string"||!KEY.test(k))throw Error("Identifiant invalide");return k;}
function db(){if(!global.firebase||!global.firebase.apps.length)throw Error("Firebase non initialisé");return global.firebase.database();}
function auth(){const u=global.firebase?.auth?.().currentUser;if(!u)throw Error("Connexion Firebase requise");return u;}
function ref(p){return db().ref(p);}
function docPath(module,id){if(!MODULES.has(module))throw Error("Module inconnu");return ROOT+"/data/"+module+"/"+assertKey(id);}
async function role(){const u=auth();const s=await ref(ROOT+"/roles/"+assertKey(u.uid)).once("value");const r=s.val();if(!r||r.enabled!==true||!["admin","direction"].includes(r.role))throw Error("Compte V3 non autorisé");return r.role;}
async function readSourceSnapshot(){auth();return (await ref(SOURCEREAD).once("value")).val();}
async function readModule(module){await role();if(!MODULES.has(module))throw Error("Module inconnu");return (await ref(ROOT+"/data/"+module).once("value")).val()||{};}
async function save(module,id,data){await role();if(!data||typeof data!=="object"||Array.isArray(data))throw Error("Objet attendu");const p=docPath(module,id),u=auth();const old=await ref(p).once("value");const base=old.val();const payload={...data,id,updatedAt:global.firebase.database.ServerValue.TIMESTAMP,updatedBy:u.uid};if(base&&base.createdAt!==undefined)payload.createdAt=base.createdAt;else payload.createdAt=global.firebase.database.ServerValue.TIMESTAMP;await ref(p).set(payload);return {path:p,id};}
async function add(module,data){const id=ref(ROOT+"/data/"+module).push().key;return save(module,id,data);}
async function watch(module,callback){await role();if(!MODULES.has(module))throw Error("Module inconnu");const p=ref(ROOT+"/data/"+module);const handler=s=>callback(s.val()||{});p.on("value",handler);return ()=>p.off("value",handler);}
async function checkRoundTrip(){await role();const id="test_"+ref(ROOT+"/diagnostics").push().key;const p=ref(ROOT+"/diagnostics/"+id);const payload={by:auth().uid,stamp:global.firebase.database.ServerValue.TIMESTAMP,nonce:id};try{await p.set(payload);const got=(await p.once("value")).val();if(!got||got.nonce!==id||typeof got.stamp!=="number")throw Error("Relecture incorrecte");return {ok:true,path:p.toString(),serverTimestamp:got.stamp};}finally{await p.remove();}}
global.G10V3Firebase=Object.freeze({ROOT,SOURCEREAD,role,readSourceSnapshot,readModule,save,add,watch,checkRoundTrip});
})(window);
