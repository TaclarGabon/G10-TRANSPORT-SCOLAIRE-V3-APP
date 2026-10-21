'use strict';
document.getElementById('simulate').addEventListener('click', function () {
  const api = globalThis.G10V3MigrationPlan;
  const example = api.syntheticExample();
  document.getElementById('result').textContent = JSON.stringify(api.plan(example.source, example.target), null, 2);
});
