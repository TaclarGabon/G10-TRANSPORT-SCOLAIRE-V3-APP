/* G10 — adaptateur de lecture de l'état V2 pour la façade administrative validée.
 * Non chargé sur la branche main. AUCUNE écriture ou migration. */
(function (root) {
  'use strict';
  const SOURCE = 'g10TransportScolaireV2/demoState/state';
  const ROLES = 'g10TransportScolaireV3/roles';
  const object = x => x !== null && typeof x === 'object' && !Array.isArray(x);
  function records(value) {
    if (Array.isArray(value)) return value.filter(object);
    if (object(value)) return Object.values(value).filter(object);
    return null; // Structure inconnue ≠ liste vide.
  }
  function integerAmount(value) {
    if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) return value;
    if (typeof value === 'string' && /^\\d+$/.test(value.trim())) {
      const n = Number(value.trim());
      if (Number.isSafeInteger(n)) return n;
    }
    return null;
  }
  function amountSummary(rows, key, isCancelled) {
    if (!rows) return { total: null, counted: 0, excluded: 0, unknown: 0, complete: false };
    let total = 0, counted = 0, excluded = 0, unknown = 0;
    for (const row of rows) {
      if (isCancelled && isCancelled(row)) { excluded++; continue; }
      const val = integerAmount(row[key]);
      if (val === null || !Number.isSafeInteger(total + val)) { unknown++; continue; }
      total += val; counted++;
    }
    return { total: unknown ? null : total, counted, excluded, unknown, complete: unknown === 0 };
  }
  function summarize(state) {
    if (!object(state)) throw new TypeError('État V2 introuvable ou invalide : aucune donnée fictive substituée.');
    const subs = records(state.subs);
    const expenses = records(state.vehicleExpenses);
    const received = amountSummary(subs, 'amountReceived');
    const expenseAmounts = amountSummary(expenses, 'amount', x =>
      Boolean(x.cancelledAt) || /annul|cancel/i.test(String(x.status || '')));
    return {
      source: SOURCE,
      subscribers: { count: subs ? subs.length : null, encaissementsSurFiches: received },
      expenses: { count: expenses ? expenses.length : null, montantNonAnnule: expenseAmounts },
      circuits: {
        schoolOrdersV160Present: Object.prototype.hasOwnProperty.call(state, 'schoolOrdersV160'),
        morningRouteOrderPresent: Array.isArray(state.morningRouteOrder),
        routeFlagIsBoolean: typeof state.route === 'boolean'
      },
      payments: {
        representation: 'champs des fiches abonnés ; aucun registre indépendant attesté',
        paymentV147Fiches: subs ? subs.filter(x => object(x.paymentV147)).length : null,
        eventsNotClassifiedAsPayments: true,
        gestionJournalNotClassifiedAsPayments: true
      },
      qr: { qrJourneysPresent: Object.prototype.hasOwnProperty.call(state, 'qrJourneys') },
      staff: { count: records(state.staff)?.length ?? null },
      drivers: { count: records(state.drivers)?.length ?? null }
    };
  }
  async function readAuthorized(firebase) {
    if (!firebase || typeof firebase.auth !== 'function' || typeof firebase.database !== 'function')
      throw new Error('SDK Firebase App/Auth/Database requis.');
    const user = firebase.auth().currentUser;
    if (!user || !/^[A-Za-z0-9_-]{1,128}$/.test(user.uid)) throw new Error('Connexion Firebase autorisée requise.');
    const db = firebase.database();
    const roleSnapshot = await db.ref(ROLES + '/' + user.uid).once('value');
    const role = roleSnapshot.val();
    if (!role || role.enabled !== true || !['direction','admin'].includes(role.role))
      throw new Error('Compte non habilité à consulter le tableau Administration.');
    const snapshot = await db.ref(SOURCE).once('value');
    const state = snapshot.val();
    return { state, summary: summarize(state) }; // État uniquement en mémoire.
  }
  const api = Object.freeze({ SOURCE, summarize, readAuthorized });
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.G10V2ReadOnly = api;
})(typeof globalThis === 'object' ? globalThis : this);
