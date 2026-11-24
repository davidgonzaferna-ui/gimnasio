window.GYM_FATIGA = 0.025;
window.GYM_PALETA = ['#e2463b', '#3a75e6', '#f5c330', '#25a866', '#e9e5dc', '#a77bff', '#f59e30', '#ff6fae', '#2ec4c4'];
window.GYM_RUTINA_DEF = {objetivo: 5, dias: [
  {nombre: 'Push', color: '#e2463b', semana: [0]}, {nombre: 'Pull', color: '#3a75e6', semana: [1]}, {nombre: 'Pierna', color: '#f5c330', semana: [2]},
  {nombre: 'Brazo', color: '#25a866', semana: [3]}, {nombre: 'Puntos débiles', color: '#e9e5dc', semana: [4]}]};
window.GYM_RUTINA = () => {
  const d = window.GYMAPP && window.GYMAPP.leerDoc('data/gym/rutina/yo');
  if (d && Array.isArray(d.dias) && d.dias.length) return {objetivo: Math.max(1, Number(d.objetivo) || d.dias.length), dias: d.dias.filter((x) => x && x.nombre)};
  return window.GYM_RUTINA_DEF;
};
window.GYM_NOMBRES_DIA = () => window.GYM_RUTINA().dias.map((d) => d.nombre);
window.GYM_DIA_HOY = () => { const wd = (new Date().getDay() + 6) % 7; const d = window.GYM_RUTINA().dias.find((x) => (x.semana || []).includes(wd)); return d ? d.nombre : null; };
window.GYM_ES_PIERNA = (n) => /pierna|leg|tren inferior|lower|cu[aá]driceps/i.test(String(n || ''));
Object.defineProperty(window, 'GYM_OBJETIVO', {get: () => window.GYM_RUTINA().objetivo, configurable: true});
window.GYMF = (() => {
  const loc = d3.formatLocale({decimal: ',', thousands: '.', grouping: [3], currency: ['', ' €']});
  const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const DIA = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  const pct = (v) => loc.format('+.1f')(v) + ' %';
  const pct0 = (v) => loc.format('+.1~f')(v) + ' %';
  const num = (v) => loc.format(',.1f')(v);
  const num1 = (v) => loc.format(',.1~f')(v);
  const fecha = (f) => { const s = String(f || ''); return s.length >= 10 ? `${+s.slice(8, 10)} ${MES[+s.slice(5, 7) - 1]} ${s.slice(0, 4)}` : s; };
  const fechaCorta = (f) => { const s = String(f || ''); return s.length >= 10 ? `${+s.slice(8, 10)} ${MES[+s.slice(5, 7) - 1]}` : s; };
  const fechaDia = (f) => { const d = new Date(String(f) + 'T00:00:00Z'); return `${DIA[d.getUTCDay()]} ${fechaCorta(f)}`; };
  const hoy = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const lunes = (f) => { const d = new Date(f + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); return d.toISOString().slice(0, 10); };
  const addDias = (f, n) => { const d = new Date(f + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  const ACC = new RegExp('[' + String.fromCharCode(0x300) + '-' + String.fromCharCode(0x36f) + ']', 'g');
  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(ACC, '').replace(/[^a-z0-9.,*× ]+/g, ' ').replace(/ +/g, ' ').trim();
  const slug = (s) => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'ejercicio';
  const sing = (w) => (w.length > 4 && w.endsWith('es') ? w.slice(0, -2) : w.length > 3 && w.endsWith('s') ? w.slice(0, -1) : w);
  const stem = (s) => norm(s).split(' ').filter((w) => w && !['de', 'con', 'en', 'el', 'la', 'al', 'a'].includes(w)).map(sing).join(' ');
  const parse = (texto, ejercicios) => {
    const t = norm(texto);
    const nombre = t.split(/[0-9]/)[0].trim();
    const tn = ' ' + t + ' ', ts = ' ' + stem(nombre) + ' ';
    let best = null, bestLen = 0;
    for (const e of ejercicios) {
      const al = [e.nombre, ...(Array.isArray(e.alias) ? e.alias : [])];
      for (const raw of al) {
        const a = norm(raw), s = stem(raw);
        if (a && tn.includes(' ' + a + ' ') && a.length > bestLen) { best = e.id; bestLen = a.length; }
        if (s && ts.includes(' ' + s + ' ') && s.length > bestLen) { best = e.id; bestLen = s.length; }
      }
    }
    const nm = (s) => Number(String(s).replace(',', '.'));
    const series = [];
    const re = /([0-9]+(?:[.,][0-9]+)?) *(?:kg|kilos|k)? *[x*×] *([0-9]+)(?: *[x*×] *([0-9]+))?/g;
    let m;
    while ((m = re.exec(t))) { const n = m[3] ? Math.min(10, Number(m[3])) : 1; for (let i = 0; i < n; i++) series.push({peso: nm(m[1]), reps: Number(m[2])}); }
    if (!series.length) {
      const kg = t.match(/([0-9]+(?:[.,][0-9]+)?) *(?:kg|kilos|k)(?![a-z])/);
      const rp = t.match(/([0-9]+) *(?:repeticiones|repes|reps|rep|r)(?![a-z])/);
      const sm = t.match(/([0-9]+) *(?:series|sets)(?![a-z])/);
      const nums = (t.match(/[0-9]+(?:[.,][0-9]+)?/g) || []).map(nm);
      const peso = kg ? nm(kg[1]) : (nums.length ? nums[0] : null);
      let reps = rp ? Number(rp[1]) : null;
      const nSeries = sm ? Number(sm[1]) : null;
      if (reps === null) { const rest = nums.filter((v) => v !== peso && v !== nSeries); if (rest.length) reps = rest[0]; }
      const n = nSeries ? Math.min(10, nSeries) : 1;
      if (peso !== null) for (let i = 0; i < n; i++) series.push({peso, reps});
    }
    return {ejercicio: best, nombre, series};
  };
  const CLASES = [
    {min: 0, nombre: 'Iniciación', color: '#e9e5dc', texto: '#1a1e23'},
    {min: 1, nombre: 'Principiante', color: '#25a866', texto: '#fff'},
    {min: 2, nombre: 'Novato', color: '#f5c330', texto: '#1a1e23'},
    {min: 3, nombre: 'Intermedio', color: '#3a75e6', texto: '#fff'},
    {min: 4, nombre: 'Avanzado', color: '#e2463b', texto: '#fff'},
    {min: 5, nombre: 'Élite', color: '#a77bff', texto: '#fff'}
  ];
  const clase = (n) => CLASES.slice().reverse().find((c) => n >= c.min) || CLASES[0];
  const DIAS = {};
  const diaColor = (d) => { const k = String(d || '').split(' + ')[0]; const r = window.GYM_RUTINA().dias.find((x) => x.nombre === k); return r && r.color ? r.color : '#6b737c'; };
  const rows = (id) => { const d = dash.data(id); return d.status === 'ok' && Array.isArray(d.data) ? d.data : null; };
  const fallo = (el, id) => { const d = dash.data(id); el.textContent = d.status === 'error' ? 'No se han podido cargar los datos. Recarga la página.' : '—'; };
  const tip = (el) => {
    const t = document.createElement('div'); t.className = 'g-tip'; t.hidden = true; el.appendChild(t);
    return {
      show(x, y, txt) { t.textContent = txt; t.hidden = false; const w = t.offsetWidth; t.style.left = Math.max(0, Math.min(x + 12, el.clientWidth - w)) + 'px'; t.style.top = Math.max(0, y - 40) + 'px'; },
      hide() { t.hidden = true; }
    };
  };
  const barras = (el, data, o) => {
    const W = Math.max(280, el.clientWidth || 600), rowH = 32, R = 86, H = data.length * rowH + 4;
    const svg = d3.select(el).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', o.aria);
    const yy = (i) => 2 + i * rowH;
    const lbl = svg.append('g').selectAll('text').data(data).join('text').attr('class', 'g-lbl').attr('y', (d, i) => yy(i) + rowH / 2).attr('dy', '0.35em').text((d) => d[o.label]);
    let lw = 0; lbl.each(function () { lw = Math.max(lw, this.getComputedTextLength()); });
    const L = Math.min(Math.ceil(lw || 110) + 14, W * 0.42);
    lbl.attr('x', L - 10).attr('text-anchor', 'end');
    const vals = data.map((d) => d[o.value]);
    const x = d3.scaleLinear().domain([Math.min(0, d3.min(vals)), Math.max(o.minMax || 1, d3.max(vals))]).range([L, W - R]);
    const t = tip(el);
    svg.append('g').selectAll('rect').data(data).join('rect').attr('x', L).attr('y', (d, i) => yy(i) + 7).attr('height', rowH - 14).attr('width', W - R - L).attr('rx', 5).style('fill', '#2d343c');
    svg.append('g').selectAll('rect').data(data).join('rect')
      .attr('x', (d) => Math.min(x(0), x(d[o.value]))).attr('y', (d, i) => yy(i) + 7).attr('height', rowH - 14)
      .attr('width', (d) => Math.max(3, Math.abs(x(d[o.value]) - x(0)))).attr('rx', 5)
      .style('fill', (d) => (o.color ? o.color(d) : '#3a75e6'))
      .on('mousemove click', (ev, d) => { const [px, py] = d3.pointer(ev, el); t.show(px, py, o.tip(d)); })
      .on('mouseleave', () => t.hide());
    svg.append('g').selectAll('text').data(data).join('text').attr('x', W - R + 8).attr('y', (d, i) => yy(i) + rowH / 2).attr('dy', '0.35em').attr('class', 'g-lbl').style('font-weight', 600).text((d) => o.fmt(d[o.value]));
  };
  const linea = (el, pts, o) => {
    const C = o.color || '#f5c330';
    const W = Math.max(280, el.clientWidth || 600), H = 250, M = {t: 14, r: 68, b: 28, l: 52};
    const svg = d3.select(el).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', o.aria);
    const x = d3.scaleUtc().range([M.l, W - M.r]);
    if (pts.length > 1) x.domain(d3.extent(pts, (p) => p.d)); else x.domain([d3.utcDay.offset(pts[0].d, -7), d3.utcDay.offset(pts[0].d, 7)]);
    const lo = Math.min(0, d3.min(pts, (p) => p.v)), hi = Math.max(1, d3.max(pts, (p) => p.v));
    const y = d3.scaleLinear().domain([lo, hi]).nice().range([H - M.b, M.t]);
    const yAx = svg.append('g').attr('transform', `translate(${M.l},0)`).call(d3.axisLeft(y).ticks(5).tickSize(-(W - M.l - M.r)).tickFormat((v) => pct0(v)));
    yAx.select('.domain').remove();
    yAx.selectAll('line').style('stroke', '#2d343c');
    const nT = Math.max(2, Math.min(pts.length, Math.floor((W - M.l - M.r) / 90)));
    const xs = pts.length > 1 ? x.ticks(nT) : [pts[0].d];
    const xAx = svg.append('g').attr('transform', `translate(0,${H - M.b})`).call(d3.axisBottom(x).tickValues(xs).tickSize(0).tickPadding(10).tickFormat((d) => fechaCorta(d.toISOString().slice(0, 10))));
    xAx.select('.domain').style('stroke', '#3a424b');
    svg.append('line').attr('x1', M.l).attr('x2', W - M.r).attr('y1', y(0)).attr('y2', y(0)).style('stroke', '#6b737c').style('stroke-dasharray', '3 3');
    svg.append('path').datum(pts).attr('fill', C).style('opacity', 0.12).attr('d', d3.area().x((p) => x(p.d)).y0(y(Math.max(lo, 0))).y1((p) => y(p.v)));
    svg.append('path').datum(pts).attr('fill', 'none').attr('stroke-width', 3).attr('stroke-linejoin', 'round').style('stroke', C).attr('d', d3.line().x((p) => x(p.d)).y((p) => y(p.v)));
    const t = tip(el);
    svg.append('g').selectAll('circle').data(pts).join('circle').attr('cx', (p) => x(p.d)).attr('cy', (p) => y(p.v)).attr('r', 5).style('fill', '#22282f').style('stroke', C).style('stroke-width', 2.5)
      .on('mousemove click', (ev, p) => { const [px, py] = d3.pointer(ev, el); t.show(px, py, o.tip(p)); })
      .on('mouseleave', () => t.hide());
    const last = pts[pts.length - 1];
    svg.append('text').attr('class', 'g-lbl').attr('x', x(last.d) + 10).attr('y', y(last.v)).attr('dy', '0.35em').style('font-weight', 700).text(pct(last.v));
    if (pts.length === 1) svg.append('text').attr('x', (M.l + W - M.r) / 2).attr('y', y((lo + hi) / 2)).attr('text-anchor', 'middle').text('Punto de partida. La línea crece con cada entreno.');
  };
  return {pct, pct0, num, num1, fecha, fechaCorta, fechaDia, hoy, lunes, addDias, norm, slug, parse, CLASES, clase, DIAS, diaColor, rows, fallo, tip, barras, linea};
})();
window.GYM_ARR = (v) => { if (Array.isArray(v)) return v; if (typeof v === 'string') { try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch (x) { return []; } } return []; };
window.GYM_MUSC = (e) => { let m = e.musculos; if (typeof m === 'string') { try { m = JSON.parse(m); } catch (x) { m = {}; } } return m && typeof m === 'object' ? m : {}; };
