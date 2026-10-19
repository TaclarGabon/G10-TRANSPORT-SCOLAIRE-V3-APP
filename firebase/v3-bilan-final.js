// G10 V3 : état de reprise sans modification de V2.
// Les données privées sont exclusivement récupérées par un utilisateur Firebase authentifié.
(function(){
'use strict';
const el=document.createElement('aside');
el.style.cssText='background:#fff;border:1px solid #c5d7e8;border-radius:10px;padding:12px;margin:10px 0';
el.innerHTML='<strong>État des données V3</strong><p>Les abonnés migrés sont conservés dans Firebase V3. Les données V2 restent indépendantes.</p><button id="g10-reconciliation" type="button">Afficher le bilan complet V2 / V3</button><pre id="g10-reconciliation-result" style="white-space:pre-wrap"></pre>';
document.querySelector('#v3-control')?.insertAdjacentElement('afterend',el);
document.getElementById('g10-reconciliation').onclick=async()=>{
const out=document.getElementById('g10-reconciliation-result');out.textContent='Lecture en cours…';
try{
 const v=window.G10V3Firebase;
 await v.role();
 const source=await v.readSourceSnapshot();
 const data=await Promise.all(['subs','payments','expenses','circuits','movements'].map(k=>v.readModule(k)));
 const count=x=>x&&typeof x==='object'?Object.values(x).filter(z=>z!=null).length:0;
 out.textContent='V2 : '+count(source.subs)+' abonnés, '+count(source.vehicleExpenses)+' dépenses, '+count(source.events)+' événements, '+count(source.gestionJournalV148)+' entrées journal.\nV3 : '+['Abonnés','Paiements','Dépenses','Circuits','Mouvements'].map((s,i)=>s+' '+count(data[i])).join(' / ')+'\nAucune écriture effectuée. La V2 continue comme source de travail.';
}catch(e){out.textContent='Connexion ou lecture indisponible : '+e.message}
};
})();