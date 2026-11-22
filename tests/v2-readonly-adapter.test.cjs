'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { SOURCE, summarize, readAuthorized } = require('../firebase/v2-readonly-adapter.js');

test('lecture V2 : les abonnés et dépenses conservent leur source', () => {
  const state = {
    subs: [
      { id: 'demo_1', amountReceived: 15000, paymentV147: { monthKey: '2026-10' } },
      { id: 'demo_2', amountReceived: 30000 }
    ],
    vehicleExpenses: {
      a: { amount: 5000, type: 'carburant' },
      b: { amount: 2000, cancelledAt: 'date-fictive' }
    },
    schoolOrdersV160: { exemple: {} }, morningRouteOrder: [1,2], route: true,
    events: [{ text: 'ceci n est pas un paiement' }], qrJourneys: {}
  };
  const before = JSON.stringify(state);
  const r = summarize(state);
  assert.equal(r.source, SOURCE);
  assert.equal(r.subscribers.count, 2);
  assert.equal(r.subscribers.encaissementsSurFiches.total, 45000);
  assert.equal(r.expenses.count, 2);
  assert.equal(r.expenses.montantNonAnnule.total, 5000);
  assert.equal(r.expenses.montantNonAnnule.excluded, 1);
  assert.equal(r.circuits.morningRouteOrderPresent, true);
  assert.equal(r.payments.paymentV147Fiches, 1);
  assert.equal(r.payments.eventsNotClassifiedAsPayments, true);
  assert.equal(r.qr.qrJourneysPresent, true);
  assert.equal(JSON.stringify(state), before);
});
test('sources absentes ou inconnues non remplacées par des zéros fictifs', () => {
  const r = summarize({ events: [{ amount: 1200 }], gestionJournalV148: [{}] });
  assert.equal(r.subscribers.count, null);
  assert.equal(r.expenses.count, null);
  assert.equal(r.subscribers.encaissementsSurFiches.total, null);
  assert.equal(r.expenses.montantNonAnnule.total, null);
  assert.equal(r.payments.eventsNotClassifiedAsPayments, true);
  assert.throws(() => summarize(null), TypeError);
});
test('montants ambigus ne produisent aucun total présenté comme certain', () => {
  const r = summarize({ subs: [{ amountReceived: 'inconnu' }, { amountReceived: 1000 }],
    vehicleExpenses: [{ amount: -10 }] });
  assert.equal(r.subscribers.encaissementsSurFiches.total, null);
  assert.equal(r.subscribers.encaissementsSurFiches.unknown, 1);
  assert.equal(r.expenses.montantNonAnnule.complete, false);
});
function mock({ role, state, uid = 'syntheticUid' }) {
  const calls = [];
  const database = () => ({ ref(path) {
    calls.push(path);
    return {
      once: async (event) => {
        assert.equal(event, 'value');
        return { val: () => path.startsWith('g10TransportScolaireV3/roles/') ? role : state };
      },
      set: () => { throw Error('Écriture interdite dans le test'); },
      update: () => { throw Error('Écriture interdite dans le test'); },
      remove: () => { throw Error('Écriture interdite dans le test'); }
    };
  } });
  return { firebase: { auth: () => ({ currentUser: uid ? { uid } : null }), database }, calls };
}
test('authentification direction : lectures des chemins attendus exclusivement', async () => {
  const { firebase, calls } = mock({ role: { enabled: true, role: 'direction' }, state: { subs: [] } });
  const r = await readAuthorized(firebase);
  assert.equal(r.summary.subscribers.count, 0);
  assert.deepEqual(calls, ['g10TransportScolaireV3/roles/syntheticUid', SOURCE]);
});
test('refus admin inactif ou utilisateur absent avant toute lecture source V2', async () => {
  for (const m of [
    mock({ role: { enabled: false, role: 'admin' }, state: {} }),
    mock({ role: { enabled: true, role: 'parent' }, state: {} }),
    mock({ role: null, state: {} }),
    mock({ role: null, uid: null, state: {} })
  ]) {
    await assert.rejects(() => readAuthorized(m.firebase));
    assert.equal(m.calls.includes(SOURCE), false);
  }
});
