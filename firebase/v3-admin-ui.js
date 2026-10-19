/* Extension opérationnelle V3 : ne touche jamais aux lignes fictives en mode déconnecté. */
(()=>{'use strict';
const cfg={apiKey:"AIzaSyA-Pduk1GBBJ2B1-fC3-f00l-WQO3Tiq-o",authDomain:"g10-transport-scolaire-v2.firebaseapp.com",databaseURL:"https://g10-transport-scolaire-v2-default-rtdb.europe-west1.firebasedatabase.app",projectId:"g10-transport-scolaire-v2",appId:"1:836907463780:web:585e2b4f075c8ff172db71"};
if(!firebase.apps.length)firebase.initializeApp(cfg);
const client=window.G10V3Firebase;
const modules={abonnes:'subs',abonnement:'subs',paiements:'payments',circuit:'circuits',mouvements:'movements',chauffeurs:'drivers',staff:'staff',depenses:'expenses'};
const fields={subs:['name','school','className','guardian','phone','busId','serviceZone','subscriptionStatus','price','amountReceived'],payments:['subscriberId','date','month','amountDue','amountPaid','status','paymentMethod'],expenses:['date','type','amount','status','busId','notes'],circuits:['name','zone','busId','school','stop','order'],movements:['subscriberId','busId','phase','status'],drivers:['name','phone','zone','busId'],staff:['name','department','phone','active']};
const labels={name:'Nom',school:'École',className:'Classe',guardian:'Parent/tuteur',phone:'Téléphone',busId:'Bus',serviceZone:'Axe',subscriptionStatus:'Statut abonnement',price:'Tarif FCFA',amountReceived:'Encaissé FCFA',subscriberId:'Identifiant abonné',date:'Date',month:'Mois',amountDue:'Montant dû FCFA',amountPaid:'Payé FCFA',status:'Statut',paymentMethod:'Mode de paiement',type:'Objet',amount:'Montant FCFA',notes:'Notes',zone:'Axe',stop:'Arrêt',order:'Ordre',phase:'Étape',active:'Actif'};
let authorized=false,unsubscribe=null,current='abonnes',items={};
const host=document.createElement('section');host.id='v3-control';host.style.cssText='margin:10px 0;padding:14px;border:2px solid #bfd5e9;border-radius:14px;background:#fff;color:#17324f';
host.innerHTML='<h2>Administration V3 — Connexion sécurisée</h2><p id="v3-status">Non connecté : les tableaux ci-dessous restent des démonstrations.</p><div id="v3-login"><input type="email" id="v3-email" placeholder="Email Firebase" autocomplete="username" style="padding:10px;margin:4px"><input type="password" id="v3-password" placeholder="Mot de passe Firebase" autocomplete="current-password" style="padding:10px;margin:4px"><button type="button" id="v3-connect" style="padding:10px;background:#176fd1;color:white;border:0;border-radius:8px">Se connecter à la V3</button></div><button type="button" id="v3-disconnect" hidden>Se déconnecter</button><button type="button" id="v3-migrate" hidden style="padding:10px;margin:5px;background:#a65c05;color:white;border:0;border-radius:8px">Copier 33 abonnés vers V3</button><button type="button" id="v3-preview" hidden style="padding:10px;margin:5px;background:#8554a5;color:white;border:0;border-radius:8px">Prévisualiser reprise V2 → V3</button><button type="button" id="v3-source" hidden style="padding:10px;margin:5px;background:#175caa;color:white;border:0;border-radius:8px">Contrôler données V2 (lecture seule)</button><button type="button" id="v3-check" hidden style="padding:10px;margin:5px;background:#087b48;color:white;border:0;border-radius:8px">Vérifier écriture V3</button><p id="v3-mode" style="color:#a14e00">Aucune écriture autorisée en démonstration.</p>';
document.querySelector('.top')?.insertAdjacentElement('beforebegin',host);
const $=s=>document.querySelector(s);
const setStatus=s=>{$('#v3-status').textContent=s};
const clean=val=>String(val??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const findRecords=v=>Object.entries(v||{}).filter(([,x])=>x&&typeof x==='object');
function selectedTab(){return document.querySelector('#tabs button.on')?.dataset.tab||current}
async function display(tab){
 current=tab;const m=modules[tab];if(!authorized||!m)return;
 if(unsubscribe){unsubscribe();unsubscribe=null}
 const p=$('#panel');
 p.innerHTML='<div class="card"><h2>V3 — '+clean(tab)+' (données Firebase)</h2><p id="v3-progress">Chargement…</p><div id="v3-records"></div><div id="v3-form"></div></div>';
 try{
  unsubscribe=await client.watch(m,data=>{items=data;renderRecords(m)});
 }catch(e){setStatus('Lecture impossible : '+e.message);}
}
function renderRecords(m){
 const records=findRecords(items);
 $('#v3-progress').textContent=records.length+' dossier(s) V3 enregistré(s). Les données V2 ne sont pas copiées.';
 const selected=$('#v3-records');selected.replaceChildren();
 const select=document.createElement('select');select.id='v3-record-id';select.style.cssText='padding:10px;max-width:100%;margin:8px';
 select.add(new Option('Nouveau dossier individuel',''));
 for(const [id,v] of records)select.add(new Option((v.name||v.subscriberId||v.type||v.busId||id)+' — '+id,id));
 selected.append('Choisir un dossier : ',select);
 const form=$('#v3-form');form.innerHTML='<div id="v3-fields" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px;margin:12px 0"></div><button type="button" id="v3-save" style="padding:11px;background:#087b48;color:white;border:0;border-radius:8px">Enregistrer dans Firebase V3</button><p id="v3-save-result"></p>';
 function populate(){
  const doc=items[select.value]||{},grid=$('#v3-fields');grid.replaceChildren();
  fields[m].forEach(k=>{const label=document.createElement('label');label.textContent=labels[k]||k;label.style.cssText='display:block;font-weight:650;font-size:12px';const input=document.createElement('input');input.dataset.key=k;input.value=doc[k]??'';input.style.cssText='width:100%;padding:9px;margin-top:5px;border:1px solid #bdd0e5;border-radius:7px';if(['price','amountReceived','amountDue','amountPaid','amount','order'].includes(k)){input.type='number';input.min='0';input.step='1'}label.append(input);grid.append(label)});
 }
 select.onchange=populate;populate();
 $('#v3-save').onclick=async()=>{
  const result=$('#v3-save-result');result.textContent='Enregistrement en cours…';
  try{
   const obj={...(items[select.value]||{})};
   for(const el of $('#v3-fields').querySelectorAll('input')){
    const k=el.dataset.key;obj[k]=el.type==='number'?(el.value===''?null:Number(el.value)):el.value.trim();
   }
   if(m==='movements')throw Error('Les scans QR doivent passer par une fonction serveur dédiée (horodatage et journal immuable).');
   if(!confirm('Enregistrer uniquement ce dossier dans g10TransportScolaireV3 ?')){result.textContent='Annulé';return;}
   const saved=select.value?await client.save(m,select.value,obj):await client.add(m,obj);
   const snap=await firebase.database().ref(saved.path).once('value');
   if(!snap.exists())throw Error('Dossier non retrouvé après écriture');
   result.textContent='Écriture V3 et relecture vérifiées pour le dossier '+saved.id;
  }catch(e){result.textContent='Enregistrement refusé : '+e.message}
 };
}
$('#v3-connect').onclick=async()=>{
 setStatus('Connexion en cours…');
 try{
  const cred=await firebase.auth().signInWithEmailAndPassword($('#v3-email').value.trim(),$('#v3-password').value);
  $('#v3-password').value='';
  const r=await client.role();authorized=true;
  $('#v3-login').hidden=true;$('#v3-disconnect').hidden=false;$('#v3-check').hidden=false;$('#v3-source').hidden=false;$('#v3-preview').hidden=false;$('#v3-migrate').hidden=false;
  $('#v3-mode').textContent='Mode V3 authentifié — données réelles dans les modules raccordés.';
  setStatus('Compte autorisé : '+cred.user.email+' ('+r+').');
  await display(selectedTab());
 }catch(e){authorized=false;setStatus('Accès V3 refusé : '+e.message);await firebase.auth().signOut()}
};
$('#v3-migrate').onclick=async()=>{
 const b=$('#v3-migrate');b.disabled=true;
 try{
  setStatus('Contrôle préalable de migration…');
  if(await client.role()!=='direction')throw Error('Migration réservée à la Direction');
  const [source,target]=await Promise.all([client.readSourceSnapshot(),client.readModule('subs')]);
  if(!source?.subs)throw Error('Source V2 introuvable');
  if(Object.keys(target).length)throw Error('V3 non vide : copie annulée pour éviter tout écrasement');
  const rows=Array.isArray(source.subs)?source.subs.filter(x=>x&&typeof x==='object'):Object.values(source.subs).filter(x=>x&&typeof x==='object');
  const ids=rows.map(x=>String(x.id||''));
  if(rows.length!==33||ids.some(id=>!/^[a-zA-Z0-9_-]{1,128}$/.test(id))||new Set(ids).size!==rows.length)throw Error('Comptage, identifiants ou doublons non conformes : aucune copie');
  const total=rows.reduce((a,x)=>a+(Number(x.amountReceived)||0),0);
  if(!Number.isFinite(total)||total!==899500)throw Error('Écart de total source : aucune copie; refaire le rapprochement');
  if(!confirm('Copier 33 dossiers V2 vers l’espace V3 uniquement ? La V2 ne sera pas modifiée. Cette copie reprend les données personnelles des dossiers dans l’espace V3 protégé.'))return;
  let written=0;
  for(const x of rows){
   const data={...x};
   delete data.createdAt;delete data.updatedAt;delete data.updatedBy;
   if(x.createdAt!=null)data.sourceCreatedAt=x.createdAt;
   await client.save('subs',String(x.id),data);
   written++;
   setStatus('Reprise V3 en cours : '+written+'/'+rows.length+' dossiers. Ne ferme pas cette page.');
  }
  const current=await client.readModule('subs');
  const values=Object.values(current);
  const copiedTotal=values.reduce((sum,x)=>sum+(Number(x.amountReceived)||0),0);
  const match=values.length===rows.length&&copiedTotal===total&&rows.every(x=>current[String(x.id)]?.id===String(x.id));
  if(!match)throw Error('La relecture V3 diffère de la source : vérifier avant utilisation');
  setStatus('COPIE TERMINÉE ET RELUE : '+values.length+' abonnés, '+copiedTotal.toLocaleString('fr-FR')+' FCFA en V3. V2 non écrite. Paiements, dépenses et circuits indépendants non migrés.');
 }catch(e){setStatus('REPRISE NON VALIDÉE : '+e.message+'. En cas de copie partielle, ne pas relancer sans contrôle : aucun dossier existant ne doit être écrasé.')}finally{b.disabled=false}
};
$('#v3-preview').onclick=async()=>{setStatus('Prévisualisation de la reprise en cours…');try{const [s,target]=await Promise.all([client.readSourceSnapshot(),client.readModule('subs')]);if(!s?.subs)throw Error('Abonnés V2 introuvables');const arr=Array.isArray(s.subs)?s.subs.filter(x=>x&&typeof x==='object'):Object.values(s.subs).filter(x=>x&&typeof x==='object');const ids=arr.map(x=>String(x.id||'')).filter(Boolean);const duplicates=ids.length-new Set(ids).size;const missing=arr.length-ids.length;const total=arr.reduce((t,x)=>t+(Number(x.amountReceived)||0),0);setStatus('APERÇU UNIQUEMENT — V2 : '+arr.length+' abonnés, '+total.toLocaleString('fr-FR')+' FCFA ; '+missing+' ID manquant(s), '+duplicates+' doublon(s) ; V3 : '+Object.keys(target||{}).length+' dossier(s). Aucune copie réalisée.');}catch(e){setStatus('Prévisualisation impossible : '+e.message)}};
$('#v3-source').onclick=async()=>{setStatus('Lecture source V2 en cours…');try{const s=await client.readSourceSnapshot();if(!s||!s.subs)throw Error('Liste des abonnés indisponible');const a=Array.isArray(s.subs)?s.subs:Object.values(s.subs);const sum=a.reduce((t,x)=>t+(Number(x?.amountReceived)||0),0);setStatus('Source V2 (lecture seule) : '+a.length+' abonnés ; '+sum.toLocaleString('fr-FR')+' FCFA enregistrés. Aucune copie et aucune écriture effectuée.');}catch(e){setStatus('Contrôle source V2 impossible : '+e.message)}};
$('#v3-check').onclick=async()=>{setStatus('Contrôle isolé V3 en cours…');try{const out=await client.checkRoundTrip();setStatus('Contrôle V3 : écriture, relecture, horodatage serveur et suppression effectués. '+new Date(out.serverTimestamp).toLocaleString('fr-FR'));}catch(e){setStatus('Contrôle V3 non validé : '+e.message)}};
$('#v3-disconnect').onclick=async()=>{authorized=false;if(unsubscribe){unsubscribe();unsubscribe=null}await firebase.auth().signOut();$('#v3-login').hidden=false;$('#v3-disconnect').hidden=true;$('#v3-check').hidden=true;$('#v3-source').hidden=true;$('#v3-preview').hidden=true;$('#v3-migrate').hidden=true;$('#v3-mode').textContent='Mode démonstration — aucune écriture';setStatus('Déconnecté');document.querySelector('#tabs button.on')?.click()};
$('#tabs').addEventListener('click',e=>{const b=e.target.closest('button[data-tab]');if(!b||!authorized)return;if(modules[b.dataset.tab])queueMicrotask(()=>display(b.dataset.tab));else{if(unsubscribe){unsubscribe();unsubscribe=null}}});
})();