'use strict';
const $ = id => document.getElementById(id);
const G = Genetics;
const initialMaterials = [
  { id: 'p-female', name: '野生型红眼雌果蝇', source: '亲本', sex: 'female', eye: 'red', x: 'XᵂXᵂ', xy: 'XᵂXᵂ' },
  { id: 'wild-male', name: '野生型红眼雄果蝇', source: '野生型', sex: 'male', eye: 'red', x: 'XᵂY', xy: 'XᵂYᵂ' },
  { id: 'p-male', name: '白眼雄果蝇', source: '亲本', sex: 'male', eye: 'white', x: 'XʷY', xy: 'XʷYʷ' },
  { id: 'f1-female', name: 'F1红眼雌果蝇', source: 'F1', sex: 'female', eye: 'red', x: 'XᵂXʷ', xy: 'XᵂXʷ' },
  { id: 'f1-male', name: 'F1红眼雄果蝇', source: 'F1', sex: 'male', eye: 'red', x: 'XᵂY', xy: 'XᵂYʷ' },
  { id: 'f2-female', name: 'F2红眼雌果蝇', source: 'F2', sex: 'female', eye: 'red', x: 'XᵂXᵂ / XᵂXʷ', xy: 'XᵂXᵂ / XᵂXʷ' },
  { id: 'f2-male', name: 'F2红眼雄果蝇', source: 'F2', sex: 'male', eye: 'red', x: 'XᵂY', xy: 'XᵂYʷ' }
];
const unlockedMaterials = [
  { id: 'offspring-wf', name: '白眼雌果蝇', source: '测交实验（二）材料', sex: 'female', eye: 'white', x: 'XʷXʷ', xy: 'XʷXʷ', new: true },
];
const observedCounts = { 1: [126, 132, 120, 115], 2: [307, 0, 0, 289] }; // Fixed teaching data, not historical counts.
let state, cultureTimer, toastTimer;
let drag = null;
let suppressClickUntil = 0;
function flyArt(sex, eye, compact = false) {
  const abdomen = sex === 'female'
    ? '<path d="M46 49 C30 59 33 83 46 95 C59 83 62 59 46 49" fill="#bba773"/><path d="M35 64H57 M36 74H56 M40 84H52" stroke="#544d3c" stroke-width="3"/>'
    : '<ellipse cx="46" cy="70" rx="13" ry="20" fill="#bba773"/><path d="M34 71 Q46 65 58 71 L56 81 Q46 94 36 81Z" fill="#413e33"/><path d="M34 62H58" stroke="#544d3c" stroke-width="3"/>';
  return `<svg class="${compact ? 'mini-fly' : 'fly-art'}" viewBox="0 0 92 110" aria-hidden="true"><g stroke="#625b44" stroke-width="1.5" fill="none"><path d="M40 38 26 31 18 18 M52 38 65 31 74 18 M37 48 20 47 12 57 M55 48 71 47 80 57 M39 57 26 67 22 85 M53 57 67 67 70 85"/></g><ellipse cx="30" cy="46" rx="12" ry="25" transform="rotate(-35 30 46)" fill="#e3e8d3" fill-opacity=".8" stroke="#abb39a"/><ellipse cx="62" cy="46" rx="12" ry="25" transform="rotate(35 62 46)" fill="#e3e8d3" fill-opacity=".8" stroke="#abb39a"/>${abdomen}<ellipse cx="46" cy="43" rx="10" ry="14" fill="#978966"/><ellipse cx="46" cy="23" rx="11" ry="10" fill="#a99974"/><ellipse cx="37" cy="22" rx="5" ry="7" fill="${eye === 'red' ? '#c5503e' : '#fffdf0'}" stroke="${eye === 'red' ? '#a64638' : '#b9b7a0'}"/><ellipse cx="55" cy="22" rx="5" ry="7" fill="${eye === 'red' ? '#c5503e' : '#fffdf0'}" stroke="${eye === 'red' ? '#a64638' : '#b9b7a0'}"/><path d="M43 16 40 10 M49 16 52 10" stroke="#625b44" stroke-width="1.5"/></svg>`;
}
function bottleArt(material, empty = false) {
  let flies = '';
  if (!empty) {
    const positions = [[35, 57, -16], [65, 80, 23], [38, 100, 12]];
    flies = positions.map(([x,y,r], i) => `<g transform="translate(${x} ${y}) rotate(${r})"><g class="fly-in-bottle"><svg x="-9" y="-10" width="18" height="23" viewBox="0 0 92 110">${flyArt(material?.sex || (i % 2 ? 'male' : 'female'), material?.eye || 'red', true).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</svg></g></g>`).join('');
  }
  return `<svg class="bottle-art" viewBox="0 0 100 145" aria-hidden="true"><ellipse cx="50" cy="139" rx="29" ry="4" fill="#334628" opacity=".09"/><path d="M28 15V36 Q15 42 15 53V127 Q15 135 25 135H75 Q85 135 85 127V53 Q85 42 72 36V15Z" fill="#f5f9ec" fill-opacity=".65" stroke="#a9b99a" stroke-width="1.7"/><path d="M17 115 Q50 107 83 115 V126 Q83 132 75 132H25 Q17 132 17 126Z" fill="#d1ba7d"/><path d="M18 116 Q49 109 82 116" stroke="#b9a367" fill="none"/><path d="M22 54V107" stroke="white" stroke-width="4" stroke-linecap="round"/><path d="M78 53V105" stroke="#cfdbbf" stroke-width="1.5"/>${flies}<path d="M26 12 Q50 6 74 12V26 Q50 32 26 26Z" fill="#e1dac1" stroke="#b8b096" stroke-width="1.5"/><path d="M31 15V24 M39 13V26 M48 12V26 M57 13V26 M66 14V25" stroke="#c5bda2" stroke-width="1"/><path d="M25 29H75" stroke="#aebc9e" stroke-width="1.4"/></svg>`;
}
function notify(message) {
  $('toast').textContent = message;
  $('toast').classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 4200);
}
function materials() { return state.round === 1 ? initialMaterials : [...initialMaterials, ...unlockedMaterials]; }
function materialById(id) { return materials().find(m => m.id === id); }
function reset() {
  clearTimeout(cultureTimer);
  cancelDrag();
  state = { round: 1, phase: 'select', female: null, male: null, selectedMaterial: null, selectedSpecimen: null, classified: [], records: [], showGenotypes: false, showDiagram: false, showAllDiagrams: false, showHelp: false, complete: false };
  $('hint').hidden = true;
  render();
}
function render() {
  renderTask();
  renderMaterials();
  renderBench();
  $('hypothesis-section').hidden = !state.showDiagram;
  if (state.showDiagram) state.showAllDiagrams ? renderAllHypotheses() : renderHypotheses();
  $('conclusion').hidden = !state.complete;
  if (state.complete) renderConclusion();
  $('records').hidden = state.records.length === 0;
  renderRecords();
  $('round-one').className = 'round ' + (state.round === 1 ? 'active' : 'done');
  $('round-two').className = 'round ' + (state.complete ? 'done' : state.round === 2 ? 'active' : '');
  $('round-three').className = 'round ' + (state.complete ? 'active' : '');
}
function renderTask() {
  const first = state.round === 1;
  $('task-title').textContent = state.complete ? '从观察出发，形成结论' : first ? '测交实验（一）' : '测交实验（二）';
  $('task-description').textContent = state.complete ? '回看两轮证据：为什么第一轮无法区分，而第二轮可以？' : first ? '比较两种假说：眼色基因仅在X上，或位于XY同源区段。选择亲本，观察后代。' : '选择白眼雌果蝇与野生型红眼雄果蝇，完成关键验证。';
  $('hint-button').hidden = state.complete;
}
function renderMaterials() {
  $('material-count').textContent = materials().length;
  $('materials').innerHTML = materials().map(m => `<button class="material-card ${state.selectedMaterial === m.id ? 'selected' : ''}" data-material="${m.id}" aria-label="${m.source}，${m.name}，${m.sex === 'female' ? '雌性' : '雄性'}，${m.eye === 'red' ? '红眼' : '白眼'}" aria-pressed="${state.selectedMaterial === m.id}" ${state.phase !== 'select' ? 'disabled' : ''}><span class="sample-badges"><b class="sex-badge ${m.sex}">${m.sex === 'female' ? '♀ 雌' : '♂ 雄'}</b><b class="eye-badge ${m.eye}"><i></i>${m.eye === 'red' ? '红眼' : '白眼'}</b></span>${bottleArt(m)}<span class="material-name">${m.name}</span><span class="material-source">${m.source}</span></button>`).join('');
  $('genotype-button').textContent = state.showGenotypes ? '收起基因型' : '查看基因型';
  $('genotype-button').setAttribute('aria-expanded', String(state.showGenotypes));
  $('material-detail').hidden = !state.showGenotypes;
  if (state.showGenotypes) {
    const m = materialById(state.selectedMaterial) || materialById(state.female) || materials()[0];
    $('material-detail').innerHTML = `<b>${m.source} · ${m.name}</b><div>假说二 · 仅X：${m.x}</div><div>假说三 · XY同源区段：${m.xy}</div><div>${m.id === 'wild-male' ? '“纯合”指假说三下为XᵂYᵂ；假说二下雄性仅有一份眼色基因，不称纯合。' : m.id === 'f2-female' ? '该瓶含两种红眼基因型，不能将整瓶视为同一基因型。' : '基因型是按各自假说推演的写法，不是对基因位置的预先确认。'}</div>`;
  }
}
function fillSlot(sex) {
  const el = $(sex + '-slot');
  const m = materialById(state[sex]);
  el.className = 'parent-slot' + (m ? ' filled' : '');
  el.innerHTML = m ? `<span class="sample-badges"><b class="sex-badge ${m.sex}">${m.sex === 'female' ? '♀ 雌' : '♂ 雄'}</b><b class="eye-badge ${m.eye}"><i></i>${m.eye === 'red' ? '红眼' : '白眼'}</b></span>${bottleArt(m)}<span class="slot-label">${m.name}</span><small>${m.source} · 点选新材料可替换</small>` : `<span class="slot-sex">${sex === 'female' ? '♀' : '♂'}</span><span class="slot-label">放入${sex === 'female' ? '雌性' : '雄性'}亲本</span><small>拖放 / 点选</small>`;
  el.setAttribute('aria-label', m ? `${sex === 'female' ? '雌性' : '雄性'}亲本：${m.source} ${m.name}，点选材料后可替换` : `放入${sex === 'female' ? '雌性' : '雄性'}亲本`);
}
function renderBench() {
  ['selection', 'culture', 'parents', 'inspection', 'observation', 'result'].forEach(v => $(v + '-view').hidden = state.phase !== ({ selection: 'select' }[v] || v));
  const phases = { select: ['配置你的杂交实验', '选择亲本'], culture: ['观察果蝇的生活史', '时间快进'], parents: ['将亲本与后代分开', '移走亲本'], inspection: ['鉴别后代性状', '放大观察'], observation: ['观察并分类后代', '放大观察'], result: ['后代给出的证据', '实验结果'] };
  [$('bench-title').textContent, $('step-chip').textContent] = phases[state.phase];
  if (state.phase === 'select') {
    fillSlot('female'); fillSlot('male');
    $('culture-bottle').innerHTML = bottleArt(null, true);
    $('start-button').disabled = !(state.female && state.male);
    $('clear-button').disabled = !(state.female || state.male || state.selectedMaterial);
  }
  if (state.phase === 'culture') $('growing-bottle').innerHTML = bottleArt(null);
  if (state.phase === 'parents') { $('parent-culture').innerHTML = bottleArt(null); $('empty-bottle-art').innerHTML = bottleArt(null, true); }
  if (state.phase === 'inspection') renderInspection();
  if (state.phase === 'observation') renderObservation();
  if (state.phase === 'result') renderResult();
}
function renderInspection() {
  $('inspection-message').textContent = `${state.round === 1 ? '第一轮测交' : '第二轮验证'}：正在用放大镜鉴别雌雄与眼色……`;
}
function selectMaterial(id) {
  if (state.phase !== 'select') return;
  state.selectedMaterial = state.selectedMaterial === id ? null : id;
  renderMaterials();
  document.querySelectorAll('.parent-slot').forEach(el => el.classList.toggle('drop-ready', !!state.selectedMaterial && materialById(state.selectedMaterial).sex === el.dataset.sex));
  if (state.selectedMaterial) notify(`已选${materialById(id).name}，请点${materialById(id).sex === 'female' ? '雌性' : '雄性'}亲本位置。`);
}
function placeMaterial(id, sex) {
  if (state.phase !== 'select') return;
  const m = materialById(id);
  if (!m) return;
  if (m.sex !== sex) { notify(`这瓶是${m.sex === 'female' ? '雌性' : '雄性'}果蝇，请放到对应位置。`); return; }
  state[sex] = id;
  state.selectedMaterial = null;
  renderMaterials(); fillSlot('female'); fillSlot('male');
  $('start-button').disabled = !(state.female && state.male);
  $('clear-button').disabled = false;
  notify('亲本已放入。可以继续选择，或更换材料。');
}
function startExperiment() {
  if (state.phase !== 'select') return;
  const valid = state.round === 1 ? state.female === 'f1-female' && state.male === 'p-male' : state.female === 'offspring-wf' && state.male === 'wild-male';
  if (!valid) {
    const message = state.round === 1 ? '本轮需检验F₁杂合红眼雌性的遗传情况。请选F₁红眼雌性与隐性的白眼雄性；其他组合暂不在本教学模拟中展开。' : state.male === 'f1-male' || state.male === 'f2-male' || state.male === 'offspring-rm' ? '红眼不代表基因型相同：这些雄性在假说三下为XᵂYʷ，不能替代纯合野生型XᵂYᵂ。请换用野生型红眼雄果蝇。' : '本轮需要白眼雌果蝇与野生型红眼雄果蝇，才能比较两个假说的不同预测。';
    $('hint').hidden = false; $('hint').textContent = message; notify('请根据材料来源和基因型调整亲本。'); return;
  }
  $('hint').hidden = true;
  state.phase = 'culture'; state.selectedMaterial = null;
  render();
  let step = 0;
  const messages = ['卵 · 受精后开始发育', '幼虫 · 在培养基中取食、生长', '蛹 · 在蛹内完成变态发育', '羽化前 · 先移走亲本，再观察成虫'];
  const tick = () => {
    if (state.phase !== 'culture') return;
    $('culture-message').textContent = messages[step];
    document.querySelectorAll('.life-cycle span').forEach((el, i) => el.classList.toggle('current', i === step));
    step++;
    cultureTimer = setTimeout(step < 4 ? tick : finishCulture, 1100);
  };
  tick();
}
function finishCulture() {
  if (state.phase !== 'culture') return;
  clearTimeout(cultureTimer);
  state.phase = 'parents'; render();
}
function specimens() {
  return state.round === 1
    ? [{ id: 'a', sex: 'male', eye: 'white' }, { id: 'b', sex: 'female', eye: 'red' }, { id: 'c', sex: 'male', eye: 'red' }, { id: 'd', sex: 'female', eye: 'white' }]
    : [{ id: 'a', sex: 'female', eye: 'red' }, { id: 'b', sex: 'male', eye: 'white' }, { id: 'c', sex: 'male', eye: 'white' }, { id: 'd', sex: 'female', eye: 'red' }];
}
function renderObservation() {
  $('identify-help').hidden = !state.showHelp;
  $('identify-button').setAttribute('aria-expanded', String(state.showHelp));
  $('identify-button').textContent = state.showHelp ? '收起辨认提示' : '雌雄怎么辨认？';
  $('specimens').innerHTML = specimens().map((s, i) => `<button class="specimen ${state.classified.includes(s.id) ? 'classified' : ''} ${state.selectedSpecimen === s.id ? 'selected' : ''}" data-specimen="${s.id}" aria-label="样本 ${String.fromCharCode(65 + i)}，${s.eye === 'red' ? '红眼' : '白眼'}，${s.sex === 'female' ? '雌性' : '雄性'}" aria-pressed="${state.selectedSpecimen === s.id}" ${state.classified.includes(s.id) ? 'disabled' : ''}><span class="specimen-badges"><b class="sex-badge ${s.sex}">${s.sex === 'female' ? '♀ 雌' : '♂ 雄'}</b><b class="eye-badge ${s.eye}"><i></i>${s.eye === 'red' ? '红眼' : '白眼'}</b></span>${flyArt(s.sex, s.eye)}<span>样本 ${String.fromCharCode(65 + i)}</span></button>`).join('');
  $('classification').innerHTML = G.categories.map(c => {
    const n = specimens().filter(s => state.classified.includes(s.id) && s.sex === c.sex && s.eye === c.eye).length;
    return `<button class="category-bin ${c.eye === 'white' ? 'white' : ''}" data-category="${c.key}" aria-label="归入${c.label}"><span class="eye-mark"></span><strong>${c.label} ${c.sex === 'female' ? '♀' : '♂'}</strong><span class="bin-count">已归类 ${n} 只</span></button>`;
  }).join('');
  $('classification-count').textContent = `已归类 ${state.classified.length} / 4`;
}
function classify(id, category) {
  if (state.phase !== 'observation' || state.classified.includes(id)) return;
  const s = specimens().find(s => s.id === id);
  if (!s) return;
  if (`${s.eye}-${s.sex}` !== category) { notify('再观察一下眼色和腹部末端。可以展开“雌雄怎么辨认？”查看提示。'); return; }
  state.classified.push(id); state.selectedSpecimen = null;
  renderObservation();
  if (state.classified.length === 4) {
    state.phase = 'result';
    if (!state.records.some(r => r.round === state.round)) state.records.push({ round: state.round, counts: observedCounts[state.round].slice() });
    render();
    notify('代表样本归类完成，已统计整批后代。');
  } else notify('归类正确，继续观察下一只。');
}
function renderResult() {
  const counts = observedCounts[state.round];
  const max = Math.max(...counts);
  $('results').innerHTML = `<div class="result-heading"><h3>第${state.round === 1 ? '一' : '二'}轮实验结果</h3><span>整批模拟计数</span></div><div class="result-chart">${G.categories.map((c,i) => `<div class="bar-column"><span class="bar-number">${counts[i]}</span><div class="bar-track"><div class="bar ${c.eye === 'white' ? 'white' : ''} ${counts[i] === 0 ? 'zero' : ''}" style="height:${counts[i] / max * 100}%"></div></div><span class="bar-label">${c.label}</span></div>`).join('')}</div><p class="result-meta">共 ${counts.reduce((a,b) => a+b, 0)} 只 · 固定教学模拟数据，并非历史实验原始数据。<br>${state.round === 1 ? '理论比例：红眼雌 ∶ 红眼雄 ∶ 白眼雌 ∶ 白眼雄 = 1 ∶ 1 ∶ 1 ∶ 1' : '理论结果：雌性全红眼，雄性全白眼；雌雄数量约为1∶1。'}</p>`;
  $('result-callout').innerHTML = state.round === 1 ? '<strong>两种假说，都能解释这个结果。</strong>第一次测交暂时无法区分两种假说。' : '<strong>雌性全红眼，雄性全白眼。</strong>与“仅位于X上”的预测一致；与“XY同源区段”的纯合野生型杂交预测不符。';
  $('diagram-button').textContent = state.showDiagram ? '收起两种假说' : '比较两种假说';
  $('diagram-button').setAttribute('aria-expanded', String(state.showDiagram));
  $('next-button').textContent = state.round === 1 ? '进入测交实验（二） →' : state.complete ? '回看实验图解 ↓' : '形成实验结论 →';
}
function chromosomeArt(c) { return `<span class="chromosome ${c.type === 'Y' ? 'y' : ''}">${c.type}${c.allele ? `<sup>${c.allele}</sup>` : ''}</span>`; }
function pairArt(cs) { return `<div class="chromosome-pair">${cs.map(chromosomeArt).join('')}</div>`; }
function plainChromosome(c) { return c.type + (c.allele === 'W' ? 'ᵂ' : c.allele === 'w' ? 'ʷ' : ''); }
function polishedDiagram(round, hypothesis) {
  const shared = hypothesis === 'XY';
  const female = round === 1 ? ['Xᵂ','Xʷ'] : ['Xʷ','Xʷ'];
  const male = round === 1 ? ['Xʷ', shared ? 'Yʷ' : 'Y'] : ['Xᵂ', shared ? 'Yᵂ' : 'Y'];
  const outcomes = round === 1
    ? [['XᵂXʷ','红眼 ♀'],['XᵂY' + (shared ? 'ʷ' : ''),'红眼 ♂'],['XʷXʷ','白眼 ♀'],['XʷY' + (shared ? 'ʷ' : ''),'白眼 ♂']]
    : (shared ? [['XᵂXʷ','红眼 ♀'],['XᵂYᵂ','红眼 ♂'],['XʷXᵂ','红眼 ♀'],['XʷYᵂ','红眼 ♂']] : [['XʷXᵂ','红眼 ♀'],['XʷY','白眼 ♂']]);
  const cell = (x, y, text, tone='green') => `<g><rect x="${x}" y="${y}" width="${text.length > 7 ? 126 : 102}" height="34" rx="10" class="diag-${tone}"/><text x="${x + (text.length > 7 ? 63 : 51)}" y="${y + 22}" text-anchor="middle">${text}</text></g>`;
  return `<svg class="polished-diagram" viewBox="0 0 620 278" role="img" aria-label="${round === 1 ? '第一次' : '第二次'}测交${hypothesis === 'X' ? '假说二' : '假说三'}遗传图解"><defs><marker id="arrow-${round}-${hypothesis}" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7Z" fill="#92a582"/></marker></defs><text x="22" y="28" class="diag-kicker">${round === 1 ? '测交实验（一）' : '测交实验（二）'} · ${hypothesis === 'X' ? '假说二' : '假说三'}</text><text x="22" y="55" class="diag-parent">${round === 1 ? 'F₁红眼雌' : '白眼雌'}　×　${round === 1 ? '白眼雄' : '野生型红眼雄'}</text>${cell(34,72,female.join('  '))}<text x="180" y="94" class="diag-multiply">×</text>${cell(220,72,male.join('  '),'gold')}<path d="M85 110 C95 137 170 130 178 160" class="diag-arrow" marker-end="url(#arrow-${round}-${hypothesis})"/><path d="M271 110 C270 137 245 132 230 160" class="diag-arrow" marker-end="url(#arrow-${round}-${hypothesis})"/><text x="22" y="145" class="diag-label">配子</text>${cell(34,160,female[0],'light')}${cell(154,160,female[1],'light')}${cell(274,160,male[0],'light')}${cell(394,160,male[1],'gold')}`+outcomes.map((o,i)=>cell(34+(i%4)*145,218,o[0],o[1].includes('白眼')?'white':'result')).join('')+`<text x="22" y="265" class="diag-foot">${round === 1 ? '四类后代：理论上约 1∶1∶1∶1' : (shared ? '预测：雌雄后代均为红眼' : '预测：雌性全红眼，雄性全白眼')}</text></svg>`;
}
function polishedDiagramGrid(round, hypothesis) {
  const shared = hypothesis === 'XY';
  const female = round === 1 ? ['Xᵂ','Xʷ'] : ['Xʷ','Xʷ'];
  const male = round === 1 ? ['Xʷ', shared ? 'Yʷ' : 'Y'] : ['Xᵂ', shared ? 'Yᵂ' : 'Y'];
  const outcomes = round === 1 ? [['XᵂXʷ','红眼♀'],['XᵂY' + (shared ? 'ʷ' : ''),'红眼♂'],['XʷXʷ','白眼♀'],['XʷY' + (shared ? 'ʷ' : ''),'白眼♂']] : (shared ? [['XᵂXʷ','红眼♀'],['XᵂYᵂ','红眼♂'],['XʷXᵂ','红眼♀'],['XʷYᵂ','红眼♂']] : [['XʷXᵂ','红眼♀'],['XʷY','白眼♂']]);
  const box=(x,y,w,text,tone='green')=>`<g><rect x="${x}" y="${y}" width="${w}" height="30" rx="9" class="diag-${tone}"/><text x="${x+w/2}" y="${y+20}" text-anchor="middle">${text}</text></g>`;
  const marker=`arrow-grid-${round}-${hypothesis}`;
  const outcome=(o,x,y)=>box(x,y,116,`${o[0]}  ${o[1]}`,o[1].includes('白眼')?'white':'result');
  return `<svg class="polished-diagram" viewBox="0 0 620 330" role="img" aria-label="${round === 1 ? '第一次' : '第二次'}测交${hypothesis === 'X' ? '假说二' : '假说三'}遗传图解"><defs><marker id="${marker}" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7Z" fill="#91a986"/></marker></defs><text x="24" y="25" class="diag-kicker">${round === 1 ? '测交实验（一）' : '测交实验（二）'} · ${hypothesis === 'X' ? '假说二' : '假说三'}</text><text x="24" y="52" class="diag-parent">${round === 1 ? 'F₁红眼雌' : '白眼雌'}　×　${round === 1 ? '白眼雄' : '野生型红眼雄'}</text>${box(44,68,150,female.join('  '))}<text x="289" y="89" class="diag-multiply">×</text>${box(370,68,150,male.join('  '),'gold')}<text x="24" y="128" class="diag-label">配子分离</text><g class="diag-grid-arrows" marker-end="url(#${marker})"><path d="M119 98 C108 111 94 122 91 146"/><path d="M119 98 C140 116 171 124 205 146"/><path d="M445 98 C430 115 420 125 411 146"/><path d="M445 98 C464 115 494 126 524 146"/></g>${box(34,146,114,female[0],'light')}${box(170,146,114,female[1],'light')}${box(354,146,114,male[0],'light')}${box(490,146,114,male[1],'gold')}<text x="304" y="132" class="diag-label">配子组合</text><path d="M148 161 H230 V215" class="diag-grid-line" marker-end="url(#${marker})"/><path d="M148 161 H230 V260" class="diag-grid-line" marker-end="url(#${marker})"/><path d="M468 161 H420 V215" class="diag-grid-line" marker-end="url(#${marker})"/><path d="M468 161 H420 V260" class="diag-grid-line" marker-end="url(#${marker})"/>${outcome(outcomes[0],230,202)}${outcome(outcomes[1],370,202)}${outcome(outcomes[2] || outcomes[0],230,247)}${outcome(outcomes[3] || outcomes[1],370,247)}<text x="24" y="302" class="diag-foot">${round === 1 ? '四类后代：理论上约 1∶1∶1∶1' : (shared ? '预测：雌雄后代均为红眼' : '预测：雌性全红眼，雄性全白眼')}</text></svg>`;
}
function renderHypotheses() {
  $('hypotheses').innerHTML = ['X', 'XY'].map(h => {
    const model = G.experiment(state.round, h);
    const dist = G.distribution(model.offspring);
    const rejected = state.round === 2 && h === 'XY';
    const diagram = state.round === 1 ? (h === 'X' ? '图片/测交1假说2.jpg' : '图片/测交1假说3.jpg') : (h === 'X' ? '图片/测交2假说2.jpg' : '图片/测交2假说3.jpg');
    const prediction = state.round === 1 ? '预测：四类后代约为 1 ∶ 1 ∶ 1 ∶ 1。与本轮观察相符，暂不能区分。' : h === 'X' ? '预测：雌性全红眼、雄性全白眼。与观察一致，获得支持。' : '预测：雌雄后代全部红眼。与观察不符，在本实验条件下被排除。';
    return `<article data-model="${h}" class="hypothesis-card ${rejected ? 'rejected' : ''}"><div class="hypothesis-title"><span>假说${h === 'X' ? '二' : '三'}</span>${h === 'X' ? '眼色基因仅位于X上' : '眼色基因位于XY同源区段'}</div><p>${h === 'X' ? 'Y染色体上没有对应的眼色等位基因。' : 'X、Y对应区段均有眼色基因；W为显性。'}</p><button class="small-button replay-model" data-play-model="${h}">播放遗传过程 ▷</button><div class="genetic-parents"><div>${pairArt(model.female)}<div class="genetic-label">${state.round === 1 ? 'F₁红眼雌性' : '白眼雌性'}</div></div><span>×</span><div>${pairArt(model.male)}<div class="genetic-label">${state.round === 1 ? '白眼雄性' : '野生型红眼雄性'}</div></div></div><div class="gametes"><b>↓ 成对染色体分离，分别进入生殖细胞 ↓</b><div class="gamete-visual"><div><small>卵细胞</small><div>${model.female.map(c => `<span class="gamete-cell">${chromosomeArt(c)}</span>`).join('')}</div></div><div><small>精子</small><div>${model.male.map(c => `<span class="gamete-cell">${chromosomeArt(c)}</span>`).join('')}</div></div></div></div><div class="offspring-grid">${model.offspring.map(o => `<div class="offspring-cell">${pairArt(o.chromosomes)}<span>${o.eye === 'red' ? '红眼' : '白眼'} ${o.sex === 'female' ? '♀ 雌性' : '♂ 雄性'}</span><small>组合概率 ¼</small></div>`).join('')}</div><div class="prediction">${prediction}</div><p class="model-note">${h === 'XY' && state.round === 2 ? '关键材料条件：野生型雄性为XᵂYᵂ。F₁红眼雄性XᵂYʷ不能替代它。' : state.round === 2 && h === 'X' ? '女儿从父亲获得Xᵂ；儿子从父亲获得Y，眼色基因来自母亲的Xʷ。' : '每个格子表示一种等可能的受精组合，非实际观察数量。'}</p><p class="model-note">${dist.filter(d => d.probability).map(d => `${d.label} ${d.probability * 100}%`).join(' · ')}</p></article>`;
  }).join('');
  [...$('hypotheses').querySelectorAll('.hypothesis-card')].forEach(card => {
    const model = card.dataset.model;
    card.querySelectorAll('.replay-model,.genetic-parents,.gametes,.offspring-grid,.model-note').forEach(el => el.remove());
    const diagram = document.createElement('div'); diagram.className = 'diagram-art';
    const image = document.createElement('img'); image.className = 'reference-diagram';
    image.src = state.round === 1 ? (model === 'X' ? '图片/测交1假说2.jpg' : '图片/测交1假说3.jpg') : (model === 'X' ? '图片/测交2假说2.jpg' : '图片/测交2假说3.jpg');
    image.alt = `第${state.round}轮${model === 'X' ? '假说二' : '假说三'}遗传图解`; diagram.appendChild(image);
    card.querySelector('.hypothesis-title').after(diagram);
  });
}
function renderAllHypotheses() {
  const originalRound = state.round;
  const panels = [];
  [1, 2].forEach(round => {
    state.round = round;
    renderHypotheses();
    panels.push(`<div class="diagram-round-heading">测交实验（${round === 1 ? '一' : '二'}）</div><div class="hypotheses">${$('hypotheses').innerHTML}</div>`);
  });
  state.round = originalRound;
  $('hypotheses').innerHTML = panels.join('');
}
function renderConclusion() {
  $('conclusion').innerHTML = '<div class="eyebrow">EVIDENCE → CONCLUSION</div><h2>这个眼色基因，位于X染色体上。</h2><p>第一轮出现四类后代，两种假说都能解释。第二轮用白眼雌性与纯合野生型红眼雄性杂交，出现雌性全红眼、雄性全白眼，支持眼色基因仅位于X染色体上，Y上没有对应的等位基因。</p><p>实验的价值在于：让不同假说提出不同预测，再用观察到的结果进行检验。这个结论针对本实验研究的果蝇眼色基因。</p><div class="conclusion-actions"><button class="secondary" id="review-diagrams">回看两轮图解</button><button class="quiet" id="restart-final">再做一次实验 ↗</button></div>';
}
function renderRecords() {
  $('record-content').innerHTML = `<div class="record-grid">${state.records.map(r => `<article class="record-card"><h3>第${r.round === 1 ? '一' : '二'}轮 ${r.round === 1 ? '测交' : '验证'}</h3><div>${r.round === 1 ? 'F₁红眼雌性 × 白眼雄性' : '白眼雌性 × 纯合野生型红眼雄性'}</div><div>${G.categories.map((c,i) => `${c.label} ${r.counts[i]}`).join(' · ')}</div><div>${r.round === 1 ? '两个假说均符合。' : '支持假说二，排除本实验条件下的假说三。'}</div><button class="quiet" data-review="${r.round}">查看本轮遗传图解 →</button></article>`).join('')}</div>`;
}
function nextRound() {
  if (state.phase !== 'result') return;
  if (state.round === 1) {
    state.round = 2; state.phase = 'select'; state.female = state.male = null; state.classified = []; state.selectedSpecimen = null; state.showDiagram = false;
    $('hint').hidden = true; render();
    $('task-title').scrollIntoView({ behavior: 'smooth', block: 'start' });
    notify('已进入测交实验（二），请从材料架选择白眼雌果蝇。');
  } else {
    if (state.complete) { state.showDiagram = true; state.showAllDiagrams = true; render(); $('hypothesis-section').hidden = false; $('hypothesis-section').scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    state.complete = true; state.showDiagram = true; render();
    $('conclusion').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}
function reviewRound(round) {
  state.showDiagram = true;
  if (state.complete) {
    state.showAllDiagrams = true;
    render();
  } else {
    const previous = state.round;
    state.round = round;
    state.showAllDiagrams = false;
    renderHypotheses();
    state.round = previous;
  }
  $('hypothesis-section').hidden = false;
  $('hypothesis-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function toggleDiagram() {
  state.showDiagram = !state.showDiagram;
  state.showAllDiagrams = state.showDiagram && state.complete;
  render();
  if (state.showDiagram) $('hypothesis-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
// On touch, first select an item, then drag it (or tap its destination).
// Only the selected item disables native panning; the rest of the shelf remains scrollable.
function beginPointer(event) {
  if (event.button !== 0 || drag) return;
  const source = event.target.closest('[data-material], [data-specimen]');
  if (!source || source.disabled) return;
  const kind = source.dataset.material ? 'material' : 'specimen';
  if ((kind === 'material' && state.phase !== 'select') || (kind === 'specimen' && state.phase !== 'observation')) return;
  drag = { source, kind, id: source.dataset.material || source.dataset.specimen, pointerId: event.pointerId, x: event.clientX, y: event.clientY, lastX: event.clientX, lastY: event.clientY, active: false, holdReady: event.pointerType !== 'touch' || source.classList.contains('selected') };
}
function movePointer(event) {
  if (!drag || event.pointerId !== drag.pointerId) return;
  drag.lastX = event.clientX; drag.lastY = event.clientY;
  const distance = Math.hypot(event.clientX - drag.x, event.clientY - drag.y);
  if (!drag.active && distance > 8) {
    if (!drag.holdReady) { cancelDrag(); return; }
    drag.active = true;
    drag.source.classList.add('drag-source');
    const ghost = document.createElement('div'); ghost.className = 'drag-ghost';
    ghost.innerHTML = drag.kind === 'material' ? bottleArt(materialById(drag.id)) : flyArt(specimens().find(s => s.id === drag.id).sex, specimens().find(s => s.id === drag.id).eye);
    document.body.appendChild(ghost); drag.ghost = ghost;
    document.querySelectorAll(drag.kind === 'material' ? '.parent-slot' : '.category-bin').forEach(el => el.classList.add('drop-ready'));
  }
  if (!drag.active) return;
  if (event.cancelable) event.preventDefault();
  drag.ghost.style.left = event.clientX + 'px'; drag.ghost.style.top = event.clientY + 'px';
  document.querySelectorAll('.drop-hover').forEach(el => el.classList.remove('drop-hover'));
  const target = document.elementFromPoint(event.clientX, event.clientY)?.closest(drag.kind === 'material' ? '[data-sex]' : '[data-category]');
  if (target) target.classList.add('drop-hover');
}
function endPointer(event) {
  if (!drag || drag.pointerId !== event.pointerId) return;
  const current = drag;
  const target = current.active ? document.elementFromPoint(event.clientX, event.clientY)?.closest(current.kind === 'material' ? '[data-sex]' : '[data-category]') : null;
  cancelDrag();
  if (!current.active) return;
  suppressClickUntil = Date.now() + 350;
  if (!target) { notify('未放入目标位置。可以再拖一次，或使用点选。'); return; }
  if (current.kind === 'material') placeMaterial(current.id, target.dataset.sex);
  else classify(current.id, target.dataset.category);
}
function cancelDrag() {
  if (!drag) return;
  clearTimeout(drag.holdTimer);
  drag.source.classList.remove('drag-source'); drag.ghost?.remove();
  document.querySelectorAll('.drop-ready, .drop-hover').forEach(el => el.classList.remove('drop-ready', 'drop-hover'));
  drag = null;
}
document.addEventListener('pointerdown', beginPointer);
document.addEventListener('pointermove', movePointer, { passive: false });
document.addEventListener('pointerup', endPointer);
document.addEventListener('pointercancel', cancelDrag);
window.addEventListener('blur', cancelDrag);
window.addEventListener('resize', cancelDrag);
document.addEventListener('click', event => {
  if (Date.now() < suppressClickUntil) { event.preventDefault(); return; }
  const m = event.target.closest('[data-material]');
  if (m) return selectMaterial(m.dataset.material);
  const slot = event.target.closest('[data-sex]');
  if (slot) { if (state.selectedMaterial) placeMaterial(state.selectedMaterial, slot.dataset.sex); else notify('先在材料架点选一个培养瓶。'); return; }
  const s = event.target.closest('[data-specimen]');
  if (s && state.phase === 'observation' && !state.classified.includes(s.dataset.specimen)) { state.selectedSpecimen = s.dataset.specimen; renderObservation(); notify('已选样本，请点对应的分类位置。'); return; }
  const c = event.target.closest('[data-category]');
  if (c) { if (state.selectedSpecimen) classify(state.selectedSpecimen, c.dataset.category); else notify('先点选观察台上的一只果蝇。'); return; }
  const r = event.target.closest('[data-review]');
  if (r) return reviewRound(Number(r.dataset.review));
  if (event.target.closest('#restart-final')) return reset();
  if (event.target.closest('#review-diagrams')) return reviewRound(1);
  const play = event.target.closest('[data-play-model]');
  if (play) { const card = play.closest('.hypothesis-card'); card.classList.remove('playing'); void card.offsetWidth; card.classList.add('playing'); }
});
$('clear-button').addEventListener('click', () => { state.female = state.male = state.selectedMaterial = null; render(); });
$('start-button').addEventListener('click', startExperiment);
$('skip-button').addEventListener('click', finishCulture);
$('remove-parents').addEventListener('click', () => {
  if (state.phase !== 'parents') return;
  state.phase = 'inspection'; render(); notify('亲本已移走，放大镜正在鉴别后代。');
  setTimeout(() => {
    if (state.phase !== 'inspection') return;
    state.phase = 'result';
    if (!state.records.some(r => r.round === state.round)) state.records.push({ round: state.round, counts: observedCounts[state.round].slice() });
    render(); notify('鉴别完成，实验结果已生成。');
  }, 1500);
});
$('next-button').addEventListener('click', nextRound);
$('diagram-button').addEventListener('click', toggleDiagram);
$('close-diagram').addEventListener('click', () => { state.showDiagram = false; $('hypothesis-section').hidden = true; if (state.phase === 'result') renderResult(); });
$('genotype-button').addEventListener('click', () => { state.showGenotypes = !state.showGenotypes; renderMaterials(); });
$('identify-button').addEventListener('click', () => { state.showHelp = !state.showHelp; renderObservation(); });
  $('hint-button').addEventListener('click', () => { $('hint').hidden = !$('hint').hidden; $('hint').textContent = state.round === 1 ? '测交用隐性类型检验待测个体。先找F₁杂合红眼雌性，再找白眼雄性。两种假说分别会预测什么？' : '第二次测交请选择白眼雌果蝇和野生型红眼雄果蝇。注意，F₁红眼雄性不能替代野生型红眼雄果蝇。'; });
$('reset-button').addEventListener('click', () => { if (state.records.length || state.phase !== 'select' || state.female || state.male) { if (!confirm('重新开始将清空本次实验进度与记录。确定重新开始？')) return; } reset(); });
$('history-button').addEventListener('click', () => $('history-dialog').showModal());
$('close-history').addEventListener('click', () => $('history-dialog').close());
$('history-dialog').addEventListener('click', event => { if (event.target === $('history-dialog')) { const r = event.target.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) event.target.close(); } });
reset();
