/* Planificateur pur : aucun SDK, réseau, stockage ou traitement d'abonnés. */
(function (root) {
  'use strict';
  const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  const validId = v => typeof v === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(v);
  const modules = ['expenses', 'circuits', 'payments'];
  const alternatives = {
    expenses: ['vehicleExpenses'], circuits: ['routes', 'schoolRoutes', 'route', 'schoolOrdersV160', 'morningRouteOrder'],
    payments: ['paymentHistory', 'paymentRecords', 'events', 'gestionJournalV148', 'gestionJournalMigratedV148']
  };
  function rows(value) {
    if (Array.isArray(value)) return value.filter(v => v !== null);
    if (object(value)) return Object.values(value);
    return null;
  }
  function plan(source, target) {
    if (!object(source) || !object(target)) throw new TypeError('Deux objets source et cible sont requis.');
    const report = { mode: 'simulation-only', executionAllowed: false, subscribersExcluded: true, qrExcluded: true, modules: {} };
    for (const module of modules) {
      const result = { sourceCount: 0, targetCount: 0, candidates: 0, existing: 0, invalid: 0, conflicts: 0, blocked: true, reasons: [] };
      report.modules[module] = result;
      if (alternatives[module].some(k => own(source, k))) result.reasons.push('source-alternative-non-validee');
      if (!own(source, module)) { result.reasons.push('source-canonique-absente'); continue; }
      const input = rows(source[module]);
      // Une cible absente ne prouve pas qu'elle est vide : exiger un objet explicite.
      const output = own(target, module) && object(target[module]) ? target[module] : null;
      if (!input || !output) { result.reasons.push('structure-invalide-ou-cible-non-lue'); continue; }
      result.sourceCount = input.length;
      result.targetCount = Object.keys(output).length;
      const sourceIds = new Map();
      const targetIds = new Set();
      let targetInvalid = false;
      for (const [key, row] of Object.entries(output)) {
        if (!validId(key) || !object(row) || row.id !== key) targetInvalid = true;
        for (const id of [key, row?.id, row?.sourceId, row?.legacyId]) if (validId(id)) targetIds.add(id);
      }
      for (const row of input) if (object(row) && validId(row.id)) sourceIds.set(row.id, (sourceIds.get(row.id) || 0) + 1);
      for (const row of input) {
        const valid = object(row) && validId(row.id) && (module === 'circuits'
          ? typeof row.name === 'string' && row.name.trim().length > 0
          : typeof row.amount === 'number' && Number.isSafeInteger(row.amount) && row.amount > 0);
        if (!valid) { result.invalid++; continue; }
        if (sourceIds.get(row.id) > 1) { result.conflicts++; continue; }
        if (targetIds.has(row.id)) { result.existing++; continue; }
        result.candidates++;
      }
      if (targetInvalid) result.reasons.push('identite-cible-incoherente');
      if (result.invalid) result.reasons.push('enregistrements-invalides');
      if (result.conflicts) result.reasons.push('identifiants-source-dupliques');
      // Même une simulation sans anomalie exige la validation métier du mapping réel.
      result.reasons.push('mapping-metier-et-validation-distincte-requis');
    }
    return report;
  }
  function syntheticExample() {
    return {
      source: {
        subs: [{ id: 'synthetic-subscriber' }],
        expenses: [{ id: 'expense-demo-1', amount: 1200 }, { id: 'expense-demo-2', amount: 300 }],
        circuits: [{ id: 'circuit-demo-1', name: 'Circuit fictif' }],
        payments: [{ id: 'payment-demo-1', amount: 2000 }]
      },
      target: { expenses: { 'expense-demo-1': { id: 'expense-demo-1', amount: 1200 } }, circuits: {}, payments: {} }
    };
  }
  const api = Object.freeze({ plan, syntheticExample });
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.G10V3MigrationPlan = api;
})(typeof globalThis === 'object' ? globalThis : this);
