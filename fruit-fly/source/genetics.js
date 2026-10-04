(function (root) {
  'use strict';
  // Each chromosome carries its type and, only when the hypothesis allows it, an allele.
  function chromosome(type, allele) { return { type, allele: allele || null }; }
  function cross(female, male) {
    return female.flatMap(egg => male.map(sperm => {
      const sex = sperm.type === 'Y' ? 'male' : 'female';
      const eye = [egg, sperm].some(c => c.allele === 'W') ? 'red' : 'white';
      return { chromosomes: [egg, sperm], sex, eye, probability: 0.25 };
    }));
  }
  function experiment(round, hypothesis) {
    const shared = hypothesis === 'XY';
    const female = round === 1 ? [chromosome('X', 'W'), chromosome('X', 'w')] : [chromosome('X', 'w'), chromosome('X', 'w')];
    const male = round === 1 ? [chromosome('X', 'w'), chromosome('Y', shared ? 'w' : null)] : [chromosome('X', 'W'), chromosome('Y', shared ? 'W' : null)];
    return { female, male, offspring: cross(female, male) };
  }
  const categories = [
    { key: 'red-female', eye: 'red', sex: 'female', label: '红眼雌性' },
    { key: 'red-male', eye: 'red', sex: 'male', label: '红眼雄性' },
    { key: 'white-female', eye: 'white', sex: 'female', label: '白眼雌性' },
    { key: 'white-male', eye: 'white', sex: 'male', label: '白眼雄性' }
  ];
  function distribution(outcomes) {
    return categories.map(c => ({ ...c, probability: outcomes.filter(o => o.eye === c.eye && o.sex === c.sex).reduce((n, o) => n + o.probability, 0) }));
  }
  const api = { chromosome, cross, experiment, distribution, categories };
  root.Genetics = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
