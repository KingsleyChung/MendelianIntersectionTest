'use strict';
const assert = require('node:assert/strict');
const { chromosome: c, cross, experiment, distribution } = require('../genetics');
const proportions = outcomes => distribution(outcomes).map(d => d.probability);
for (const shared of [false, true]) {
  const parental = cross([c('X', 'W'), c('X', 'W')], [c('X', 'w'), c('Y', shared ? 'w' : null)]);
  assert(parental.every(o => o.eye === 'red'));
  const f2 = cross([c('X', 'W'), c('X', 'w')], [c('X', 'W'), c('Y', shared ? 'w' : null)]);
  assert.deepEqual(proportions(f2), [0.5, 0.25, 0, 0.25]);
}
for (const h of ['X', 'XY']) {
  assert.deepEqual(proportions(experiment(1, h).offspring), [0.25, 0.25, 0.25, 0.25]);
  for (const round of [1, 2]) assert.equal(experiment(round, h).offspring.reduce((n, o) => n + o.probability, 0), 1);
}
assert.deepEqual(proportions(experiment(2, 'X').offspring), [0.5, 0, 0, 0.5]);
assert.deepEqual(proportions(experiment(2, 'XY').offspring), [0.5, 0.5, 0, 0]);
// F1 red males cannot substitute for the homozygous wild-type male in the second cross.
assert.deepEqual(proportions(cross([c('X', 'w'), c('X', 'w')], [c('X', 'W'), c('Y', 'w')])), [0.5, 0, 0, 0.5]);
console.log('PASS: original cross, F2, both hypotheses, both rounds, probabilities, F1 male substitution.');
