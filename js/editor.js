import { DATA } from "./data.js";

let reinitFn = null;
let fileHandle = null;

// ── color helpers ─────────────────────────────────────────────

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = n => {
    const k = (n + h / 30) % 12;
    const v = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * v).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function randomPastel() {
  return hslToHex(
    Math.floor(Math.random() * 360),
    30 + Math.floor(Math.random() * 20),
    66 + Math.floor(Math.random() * 12)
  );
}

// ── row builder ───────────────────────────────────────────────

function buildSlider(name, min, max, value, onChange) {
  const wrap = document.createElement('label');
  wrap.className = 'ed-ctrl';

  const lbl = document.createElement('span');
  lbl.className = 'ed-ctrl-name';
  lbl.textContent = name;

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = min;
  slider.max = max;
  slider.value = value;

  const val = document.createElement('span');
  val.className = 'ed-ctrl-val';
  val.textContent = value;

  slider.addEventListener('input', () => { val.textContent = slider.value; });
  slider.addEventListener('change', () => { onChange(parseInt(slider.value)); });

  wrap.append(lbl, slider, val);
  return wrap;
}

function buildRow(d) {
  const row = document.createElement('div');
  row.className = 'ed-row';

  const top = document.createElement('div');
  top.className = 'ed-row-top';

  const swatch = document.createElement('span');
  swatch.className = 'ed-swatch';
  swatch.style.background = d.color;
  swatch.style.cursor = 'pointer';
  swatch.title = 'Change colour';

  const colorInput = document.createElement('input');
  colorInput.type = 'color';
  colorInput.value = d.color;
  colorInput.style.cssText = 'position:absolute;opacity:0;pointer-events:none;width:0;height:0';
  swatch.addEventListener('click', () => colorInput.click());
  colorInput.addEventListener('input', () => {
    d.color = colorInput.value;
    swatch.style.background = d.color;
  });
  colorInput.addEventListener('change', () => reinitFn());

  const labelInput = document.createElement('input');
  labelInput.type = 'text';
  labelInput.className = 'ed-label-input';
  labelInput.value = d.label;
  labelInput.addEventListener('change', () => {
    const v = labelInput.value.trim();
    if (v) d.label = v; else labelInput.value = d.label;
  });

  const del = document.createElement('button');
  del.className = 'ed-del';
  del.textContent = '×';
  del.addEventListener('click', () => {
    DATA.splice(DATA.indexOf(d), 1);
    row.remove();
    reinitFn();
  });

  top.append(colorInput, swatch, labelInput, del);

  const sliders = document.createElement('div');
  sliders.className = 'ed-row-sliders';
  sliders.appendChild(buildSlider('Vol', 1, 10, d.volume, v => { d.volume = v; reinitFn(); }));
  sliders.appendChild(buildSlider('Mass', 1, 10, d.mass, v => { d.mass = v; reinitFn(); }));

  row.append(top, sliders);
  return row;
}

function renderList() {
  const list = document.getElementById('ed-list');
  list.innerHTML = '';
  DATA.forEach(d => list.appendChild(buildRow(d)));
}

// ── add dialog ────────────────────────────────────────────────

function openAddDialog() {
  const color = randomPastel();
  const dlg = document.getElementById('ed-dialog');
  dlg.dataset.color = color;
  document.getElementById('ed-dlg-swatch').style.background = color;
  document.getElementById('ed-dlg-name').value = '';
  document.getElementById('ed-dlg-vol').value = 50;
  document.getElementById('ed-dlg-vol-val').textContent = '50';
  document.getElementById('ed-dlg-mass').value = 50;
  document.getElementById('ed-dlg-mass-val').textContent = '50';
  dlg.classList.remove('hidden');
  document.getElementById('ed-dlg-name').focus();
}

function closeAddDialog() {
  document.getElementById('ed-dialog').classList.add('hidden');
}

function confirmAdd() {
  const label = document.getElementById('ed-dlg-name').value.trim();
  if (!label) { document.getElementById('ed-dlg-name').focus(); return; }
  const dlg = document.getElementById('ed-dialog');
  DATA.push({
    id: label.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now(),
    label,
    color: dlg.dataset.color,
    volume: parseInt(document.getElementById('ed-dlg-vol').value),
    mass: parseInt(document.getElementById('ed-dlg-mass').value)
  });
  closeAddDialog();
  renderList();
  reinitFn();
}

// ── save ──────────────────────────────────────────────────────

function toDataJS() {
  const rows = DATA.map(d =>
    `  {\n    id: "${d.id}",\n    label: "${d.label}",\n    color: "${d.color}",\n    volume: ${d.volume},\n    mass: ${d.mass}\n  }`
  );
  return `export const DATA = [\n${rows.join(',\n')}\n];\n`;
}

async function saveToFile() {
  const btn = document.getElementById('ed-save');
  btn.disabled = true;
  btn.textContent = 'Saving…';
  try {
    if (!fileHandle) {
      fileHandle = await window.showSaveFilePicker({
        suggestedName: 'data.js',
        types: [{ description: 'JavaScript', accept: { 'text/javascript': ['.js'] } }]
      });
    }
    const w = await fileHandle.createWritable();
    await w.write(toDataJS());
    await w.close();
    btn.textContent = 'Saved ✓';
    setTimeout(() => { btn.textContent = 'Save'; btn.disabled = false; }, 1500);
  } catch (e) {
    if (e.name === 'AbortError') fileHandle = null;
    else console.error('Save failed:', e);
    btn.textContent = 'Save';
    btn.disabled = false;
  }
}

// ── init ──────────────────────────────────────────────────────

export function initEditor(reinit) {
  reinitFn = reinit;

  const panel = document.getElementById('ed-panel');

  const dlgColorInput = document.createElement('input');
  dlgColorInput.type = 'color';
  dlgColorInput.style.cssText = 'position:absolute;opacity:0;pointer-events:none;width:0;height:0';
  document.body.appendChild(dlgColorInput);

  const dlgSwatch = document.getElementById('ed-dlg-swatch');
  dlgSwatch.style.cursor = 'pointer';
  dlgSwatch.title = 'Change colour';
  dlgSwatch.addEventListener('click', () => {
    dlgColorInput.value = document.getElementById('ed-dialog').dataset.color;
    dlgColorInput.click();
  });
  dlgColorInput.addEventListener('input', () => {
    const color = dlgColorInput.value;
    document.getElementById('ed-dialog').dataset.color = color;
    dlgSwatch.style.background = color;
  });

  document.getElementById('ed-toggle').addEventListener('click', () => {
    const opening = panel.classList.toggle('open');
    if (opening) renderList();
  });
  document.getElementById('ed-close').addEventListener('click', () => panel.classList.remove('open'));
  document.getElementById('ed-add').addEventListener('click', openAddDialog);
  document.getElementById('ed-save').addEventListener('click', saveToFile);

  document.getElementById('ed-dlg-confirm').addEventListener('click', confirmAdd);
  document.getElementById('ed-dlg-cancel').addEventListener('click', closeAddDialog);
  document.getElementById('ed-dlg-name').addEventListener('keydown', e => {
    if (e.key === 'Enter') confirmAdd();
    if (e.key === 'Escape') closeAddDialog();
  });

  const dlgVol = document.getElementById('ed-dlg-vol');
  const dlgVolVal = document.getElementById('ed-dlg-vol-val');
  dlgVol.addEventListener('input', () => { dlgVolVal.textContent = dlgVol.value; });

  const dlgMass = document.getElementById('ed-dlg-mass');
  const dlgMassVal = document.getElementById('ed-dlg-mass-val');
  dlgMass.addEventListener('input', () => { dlgMassVal.textContent = dlgMass.value; });

  document.getElementById('ed-dialog').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeAddDialog();
  });
}
