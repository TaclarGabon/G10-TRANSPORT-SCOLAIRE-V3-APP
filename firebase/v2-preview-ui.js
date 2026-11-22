/* G10 Administration — prévisualisation V2 authentifiée, lecture seule.
 * Ne jamais connecter ce module au public sans revue et validation.
 * Les données restent sous g10TransportScolaireV2/demoState/state.
 */
(function () {
'use strict';
const cfg = {
  apiKey: 'AIzaSyA-Pduk1GBBJ2B1-fC3-f00l-WQO3Tiq-o',
  authDomain: 'g10-transport-scolaire-v2.firebaseapp.com',
  databaseURL: 'https://g10-transport-scolaire-v2-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'g10-transport-scolaire-v2',
  appId: '1:836907463780:web:585e2b4f075c8ff172db71'
};
if (!window.firebase || !window.G10V2ReadOnly) return;
if (!firebase.apps.length) firebase.initializeApp(cfg);
const nav = document.getElementById('tabs');
const panel = document.getElementById('panel');
const adapter = window.G10V2ReadOnly;
if (!nav || !panel) return;
let state = null, summary = null, busy = false;
const escape = x => String(x == null ? '' : x).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const label = (x, otherwise='—') => (x === null || x === undefined || x === '') ? otherwise : escape(x);
const list = x => Array.isArray(x) ? x.filter(v => v && typeof v === 'object' && !Array.isArray(v)) :
  (x && typeof x === 'object' ? Object.values(x).filter(v => v && typeof v === 'object' && !Array.isArray(v)) : null);
const subList = () => list(state?.subs);
const amount = x => x == null ? 'Indéterminé' : Number(x).toLocaleString('fr-FR') + ' FCFA';
const info = msg => '<div class="table-note">'+escape(msg)+'</div>';
const header = (title, note) => '<div class="card head"><div><h2>'+escape(title)+'</h2><div class="small">'+escape(note)+'</div></div></div>';
function table(headings, rows) {
  if (rows === null) return info('Structure source non disponible : aucun dossier fictif affiché.');
  return '<div class="master-wrap"><table class="master"><thead><tr>'+headings.map(x=>'<th>'+escape(x)+'</th>').join('')+'</tr></thead><tbody>'+
    rows.map((r,i)=>'<tr>'+[String(i+1),...r].map(x=>'<td>'+label(x)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
}
const subscriptionPrice = s => s.monthlyPrice ?? s.subscriptionPrice ?? s.price ?? s.tarif ?? null;
const subscriptionStatus = s => s.subscriptionStatus ?? s.status ?? s.etat ?? null;
const subscriptionFormula = s => s.subscriptionFormula ?? s.formula ?? s.planName ?? s.formule ?? null;
const identity = s => s.name ?? s.studentName ?? s.nom ?? null;
function render(tab) {
  if (!state || !summary) { panel.innerHTML=header('Administration — connexion requise','Aucune donnée réelle affichée avant identification.'); return; }
  const subs=subList(), expenses=list(state.vehicleExpenses), drivers=list(state.drivers), staff=list(state.staff);
  const title='Données V2 authentifiées — lecture seule : aucune modification possible.';
  const note=info(title);
  let content='';
  if (tab === 'abonnes') {
    content=header('Abonnés — Zone Akanda','Les fiches proviennent directement de la V2.')+note+
      table(['Enfant','École','Classe','Parent / tuteur','Téléphone','Adresse','Bus'],subs?.map(s=>[
        identity(s),s.school??s.ecole,s.className??s.classe,s.guardian??s.parentName,s.phone??s.parentPhone,s.address??s.adresse,s.busId??s.bus
      ]));
  } else if (tab === 'abonnement') {
    content=header('Abonnement','Présentation des attributs présents sur les fiches V2, sans créer de nouvel abonnement.')+note+
      table(['Élève','Formule','Tarif mensuel','Réduction','Statut','Référence QR'],subs?.map(s=>[
        identity(s),subscriptionFormula(s),subscriptionPrice(s),s.paymentV147?.discountPct != null ? s.paymentV147.discountPct+' %' : null,
        subscriptionStatus(s),s.qrRef
      ]));
  } else if (tab === 'paiements') {
    content=header('Paiements — informations des fiches V2','Aucun historique de paiements distinct n’a été identifié ni reconstitué.')+
      info('Les encaissements ci-dessous sont les montants cumulés figurant sur les fiches abonnés. Ce ne sont pas des transactions reconstituées.')+
      table(['Élève','Mois de référence','Montant encaissé indiqué','Avance prévue','Réduction'],subs?.map(s=>[
        identity(s),s.paymentV147?.monthKey,s.amountReceived,s.paymentV147?.advanceAmount,s.paymentV147?.discountPct != null ? s.paymentV147.discountPct+' %' : null
      ]));
  } else if (tab === 'depenses') {
    content=header('Dépenses véhicules','Lecture directe du module vehicleExpenses V2.')+note+
      table(['Date','Type','Montant','Statut','Facture','Justificatif'],expenses?.map(x=>[
        x.date??x.invoiceDate,x.type,x.amount,x.status??(x.cancelledAt?'Annulée':null),
        x.invoiceNumber, x.receipt ? 'Présent (consultation à valider)' : 'Non indiqué'
      ]));
  } else if (tab === 'circuit') {
    content=header('Circuit — état V2','La structure des ordres nécessite un rapprochement avant affichage opérationnel.')+
      info('Ordres écoles : '+(summary.circuits.schoolOrdersV160Present?'présents':'non disponibles')+
      ' ; ordre du matin : '+(summary.circuits.morningRouteOrderPresent?'présent':'non disponible')+
      '. La valeur route de la V2 n’est pas une liste de circuits.')+
      table(['Élève','École','Ordre renseigné','Bus'],subs?.map(s=>[identity(s),s.school??s.ecole,s.circuitOrder??s.routeOrder??s.pickupOrder,s.busId??s.bus]));
  } else if (tab === 'chauffeurs') {
    content=header('Chauffeurs','Affichage des entrées V2 reconnues.')+note+
      table(['Chauffeur','Téléphone','Zone','Bus'],drivers?.map(x=>[x.name,x.phone,x.zone,x.busId]));
    if (drivers === null && state.driver && typeof state.driver === 'object') content+=info('Un profil chauffeur principal existe en V2 mais son format reste à valider.');
  } else if (tab === 'staff') {
    content=header('Staff','Liste existante V2 ; les droits de modification seront raccordés ultérieurement.')+note+
      table(['Nom','Fonction','Téléphone','Statut'],staff?.map(x=>[x.name,x.department??x.role,x.phone,x.active===true?'Actif':x.status]));
  } else if (tab === 'qr') {
    content=header('QR élèves — consultation','Les références QR restent dans les dossiers V2, sans réattribution ni scan.')+note+
      table(['Élève','École','Référence QR'],subs?.map(s=>[identity(s),s.school??s.ecole,s.qrRef]));
  } else if (tab === 'rapports') {
    content=header('Rapports — indicateurs V2','Totaux indicatifs, jamais inventés si un montant ne peut pas être vérifié.')+
      '<div class="card"><p><strong>Abonnés : </strong>'+label(summary.subscribers.count)+'</p>'+
      '<p><strong>Encaissements renseignés sur fiches : </strong>'+escape(amount(summary.subscribers.encaissementsSurFiches.total))+'</p>'+
      '<p><strong>Dépenses V2 : </strong>'+label(summary.expenses.count)+'</p>'+
      '<p><strong>Dépenses non annulées dont les montants sont lisibles : </strong>'+escape(amount(summary.expenses.montantNonAnnule.total))+'</p></div>'+note;
  } else if (tab === 'astuce') {
    content=header('Astuce intelligente — données V2','Aucune recommandation financière automatique tant que les définitions métiers ne sont pas validées.')+
      info('Dossiers : '+(summary.subscribers.count??'non lus')+
      '. L’historique des paiements n’est pas déduit des événements ou du journal.');
  } else if (tab === 'reclamations') {
    content=header('Avis & réclamations','Le mapping des retours parents doit être confirmé.')+
      info('La V2 contient une structure locationFeedback ; elle ne constitue pas automatiquement un registre de réclamations. Aucune valeur fictive.');
  }
  panel.innerHTML=content;
}
const box=document.createElement('section');
box.id='g10-v2-preview-auth';
box.className='card';
box.innerHTML='<div class="section-heading">Prévisualisation de la nouvelle interface avec les données V2 — lecture seule</div>'+
  '<form id="g10-v2-auth-form" autocomplete="on">'+
  '<label>Email Firebase <input id="g10-v2-email" type="email" autocomplete="username" required></label>'+
  '<label>Mot de passe <input id="g10-v2-password" type="password" autocomplete="current-password" required></label>'+
  '<button class="btn blue" type="submit">Se connecter et charger la V2</button></form>'+
  '<button id="g10-v2-logout" class="btn light" type="button" hidden>Se déconnecter</button>'+
  '<p id="g10-v2-status" class="table-note" role="status">Mode lecture seule. Données V2 intactes.</p>';
nav.parentNode.insertBefore(box,nav);
const form=box.querySelector('#g10-v2-auth-form');
const status=box.querySelector('#g10-v2-status');
const logout=box.querySelector('#g10-v2-logout');
function currentTab(){return nav.querySelector('button.on')?.dataset.tab || 'abonnes';}
async function refresh() {
  if (busy) return;
  busy=true;status.textContent='Chargement de la source V2 en lecture seule…';
  try {
    const data=await adapter.readAuthorized(firebase);
    state=data.state;summary=data.summary;
    form.hidden=true;logout.hidden=false;
    status.textContent='Source : '+adapter.SOURCE+' — lecture autorisée. Aucune écriture.';
    render(currentTab());
  } catch(e) {
    state=null;summary=null;
    form.hidden=false;logout.hidden=true;render(currentTab());
    status.textContent='Accès non validé : '+(e?.message||'erreur inconnue');
  } finally {busy=false;}
}
form.addEventListener('submit',async e=>{
  e.preventDefault();
  if (busy) return;
  status.textContent='Connexion en cours…';
  try {
    await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.NONE);
    const email=box.querySelector('#g10-v2-email').value.trim();
    const password=box.querySelector('#g10-v2-password').value;
    await firebase.auth().signInWithEmailAndPassword(email,password);
    box.querySelector('#g10-v2-password').value='';
    await refresh();
  } catch(err) {
    box.querySelector('#g10-v2-password').value='';
    status.textContent='Connexion non validée : '+(err?.code||'échec');
  }
});
logout.addEventListener('click',async()=>{
  await firebase.auth().signOut();state=null;summary=null;
  form.hidden=false;logout.hidden=true;status.textContent='Déconnecté — aucune donnée réelle visible.';
  render(currentTab());
});
nav.addEventListener('click',e=>{
  const b=e.target.closest('button[data-tab]');
  if (!b) return;
  e.stopImmediatePropagation(); // Empêche les tableaux de démonstration de remplacer les vraies lectures.
  nav.querySelectorAll('button[data-tab]').forEach(x=>x.classList.toggle('on',x===b));
  render(b.dataset.tab);
},true);
render('abonnes');
})();
