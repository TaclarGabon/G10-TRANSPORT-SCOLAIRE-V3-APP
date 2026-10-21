'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { plan, syntheticExample } = require('../firebase/v3-migration-plan.js');
const base = path.join(__dirname, '..');
const empty = () => ({ expenses: {}, circuits: {}, payments: {} });

test('simulation bloquée, abonnés et QR exclus, entrées inchangées', () => {
  const { source, target } = syntheticExample();
  source.subs = Array.from({ length: 33 }, (_, i) => ({ id: `synthetic-${i}` }));
  source.qrJourneys = [{ id: 'synthetic-qr' }];
  const before = JSON.stringify({ source, target });
  const report = plan(source, target);
  assert.equal(report.executionAllowed, false);
  assert.equal(report.subscribersExcluded, true);
  assert.equal(report.qrExcluded, true);
  assert.deepEqual(Object.keys(report.modules), ['expenses', 'circuits', 'payments']);
  assert.equal(report.modules.expenses.existing, 1);
  assert.equal(report.modules.expenses.candidates, 1);
  assert.equal(report.modules.circuits.candidates, 1);
  assert.equal(report.modules.payments.candidates, 1);
  for (const result of Object.values(report.modules)) assert.equal(result.blocked, true);
  assert.equal(JSON.stringify({ source, target }), before);
});

test('journaux, événements et structures alternatives jamais interprétés', () => {
  const report = plan({ events: [{ amount: 123 }], gestionJournalV148: [{ amount: 123 }], vehicleExpenses: [{}], route: [{}] }, empty());
  for (const result of Object.values(report.modules)) {
    assert.equal(result.candidates, 0);
    assert.ok(result.reasons.includes('source-alternative-non-validee'));
    assert.ok(result.reasons.includes('source-canonique-absente'));
  }
});

test('refus des montants ambigus, formes invalides et doublons source', () => {
  const source = { expenses: [
    { id: 'duplicate', amount: 1 }, { id: 'duplicate', amount: 2 },
    { id: 'text', amount: '100' }, { id: 'negative', amount: -1 },
    { id: 'fraction', amount: 1.5 }, { id: 'infinity', amount: Infinity },
    { id: 'zero', amount: 0 }, { id: 'unsafe', amount: Number.MAX_SAFE_INTEGER + 1 },
    { id: 'bad/id', amount: 1 }, {}, false
  ], circuits: [{ id: 'blank', name: ' ' }], payments: 'invalid' };
  const report = plan(source, empty());
  assert.equal(report.modules.expenses.conflicts, 2);
  assert.equal(report.modules.expenses.invalid, 9);
  assert.equal(report.modules.expenses.candidates, 0);
  assert.equal(report.modules.circuits.invalid, 1);
  assert.ok(report.modules.payments.reasons.includes('structure-invalide-ou-cible-non-lue'));
});

test('exclusion des identités déjà reprises et signalement des cibles incohérentes', () => {
  const source = { expenses: [{ id: 'old', amount: 100 }, { id: 'legacy', amount: 200 }] };
  const target = empty();
  target.expenses = { new: { id: 'new', sourceId: 'old', legacyId: 'legacy' } };
  assert.equal(plan(source, target).modules.expenses.existing, 2);
  target.expenses.new.id = 'other';
  assert.ok(plan(source, target).modules.expenses.reasons.includes('identite-cible-incoherente'));
});

test('cible non lue distincte de cible vide et racines invalides refusées', () => {
  const source = { expenses: { entry: { id: 'entry', amount: 1 } } };
  for (const target of [{}, { expenses: [] }, { expenses: null }]) {
    const result = plan(source, target).modules.expenses;
    assert.equal(result.candidates, 0);
    assert.ok(result.reasons.includes('structure-invalide-ou-cible-non-lue'));
  }
  for (const invalid of [null, [], 'text', undefined]) assert.throws(() => plan(invalid, empty()), TypeError);
});

test('rapport agrégé sans recopier identifiants, champs ou valeurs source', () => {
  const report = JSON.stringify(plan({ circuits: [{ id: 'fictional-sensitive-id', name: '<script>fictional</script>', confidentialField: 'fictional-value' }] }, empty()));
  for (const value of ['fictional-sensitive-id', '<script>', 'confidentialField', 'fictional-value']) assert.ok(!report.includes(value));
});

test('page isolée : scripts locaux uniquement et simulation sans API réseau/stockage', () => {
  const html = fs.readFileSync(path.join(base, 'migration-v3-simulation.html'), 'utf8');
  assert.ok(html.includes("connect-src 'none'"));
  assert.ok(html.includes("form-action 'none'"));
  const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
  assert.deepEqual(scripts, ['firebase/v3-migration-plan.js', 'firebase/v3-simulation-ui.js']);
  let click;
  const output = { textContent: '' };
  const context = vm.createContext({ document: { getElementById(id) {
    return id === 'simulate' ? { addEventListener(event, callback) { assert.equal(event, 'click'); click = callback; } } : output;
  } } });
  for (const name of ['firebase', 'fetch', 'XMLHttpRequest', 'WebSocket', 'localStorage', 'sessionStorage']) {
    Object.defineProperty(context, name, { get() { throw new Error(`Accès interdit : ${name}`); } });
  }
  for (const script of scripts) vm.runInContext(fs.readFileSync(path.join(base, script), 'utf8'), context);
  click();
  const report = JSON.parse(output.textContent);
  assert.equal(report.executionAllowed, false);
  assert.equal(report.modules.expenses.existing, 1);
});
