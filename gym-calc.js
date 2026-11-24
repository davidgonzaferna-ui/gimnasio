dash.calc('sesiones_ejercicio', {
  title: 'Fuerza estimada por ejercicio y sesión',
  description: 'Mejor serie de cada ejercicio convertida en 1RM estimado (Epley) y ajustada por la posición del ejercicio en el entreno.',
  inputs: ['entrenos', 'ejercicios', 'sesiones'],
  fn: (entrenos, ejercicios, sesiones) => {
    const FATIGA = window.GYM_FATIGA;
    const cerrados = new Set((sesiones || []).map((s) => String(s.fecha || s.id || '')));
    const hoyF = window.GYMF.hoy();
    const nombres = new Map((ejercicios || []).map((e) => [e.id, e.nombre]));
    const lunes = (f) => { const d = new Date(f + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); return d.toISOString().slice(0, 10); };
    const out = [];
    for (const r of entrenos || []) {
      const series = window.GYM_ARR(r.series);
      const fecha = String(r.fecha || '');
      if (!Array.isArray(series) || fecha.length !== 10 || isNaN(Date.parse(fecha)) || !r.ejercicio) continue;
      if (fecha >= hoyF && !cerrados.has(fecha)) continue;
      const validas = series.map((s) => ({peso: Number(s.peso), reps: Number(s.reps)})).filter((s) => s.peso > 0 && s.reps > 0);
      if (!validas.length) continue;
      const orden = Math.max(1, Math.round(Number(r.orden)) || 1);
      const mejor = Math.max(...validas.map((s) => s.peso * (1 + s.reps / 30)));
      out.push({id: r.id, fecha, semana: lunes(fecha), dia: r.dia || '', ejercicio: r.ejercicio, nombre: nombres.get(r.ejercicio) || r.ejercicio, orden, series: validas.length, series_txt: validas.map((s) => `${String(s.peso).replace('.', ',')}×${s.reps}`).join(', '), e1rm: Math.round(mejor * 10) / 10, e1rm_ajustado: Math.round(mejor * (1 + FATIGA * (orden - 1)) * 10) / 10});
    }
    out.sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : a.orden - b.orden));
    return out;
  }
});
dash.calc('dias', {
  title: 'Días entrenados',
  description: 'Un registro por día con entreno: tipo de día, ejercicios y series.',
  inputs: ['entrenos'],
  fn: (entrenos) => {
    const acc = new Map();
    for (const r of entrenos || []) {
      const f = String(r.fecha || ''); if (f.length !== 10) continue;
      const a = acc.get(f) || {fecha: f, dias: new Set(), ejercicios: 0, series: 0};
      if (r.dia) a.dias.add(r.dia);
      const n = window.GYM_ARR(r.series).filter((s) => Number(s.peso) > 0 && Number(s.reps) > 0).length;
      if (n) { a.ejercicios += 1; a.series += n; }
      acc.set(f, a);
    }
    return [...acc.values()].map((a) => ({fecha: a.fecha, dia: [...a.dias].join(' + '), ejercicios: a.ejercicios, series: a.series})).sort((a, b) => (a.fecha < b.fecha ? -1 : 1));
  }
});
dash.calc('semana_actual', {
  title: 'Entrenos de esta semana',
  description: 'Días entrenados desde el lunes de la semana en curso.',
  inputs: ['dias'],
  fn: (dias) => {
    const G = window.GYMF; const lun = G.lunes(G.hoy()); const dom = G.addDias(lun, 6);
    return [{semana: lun, entrenos: (dias || []).filter((d) => d.fecha >= lun && d.fecha <= dom).length}];
  }
});
dash.calc('progreso', {
  title: 'Progreso semanal por músculo',
  description: 'Mejora (%) del 1RM ajustado de cada ejercicio frente a su primera sesión desde la fecha base del perfil, combinada por músculo según cuánto lo trabaja cada ejercicio.',
  inputs: ['sesiones_ejercicio', 'ejercicios', 'perfil'],
  fn: (sesiones, ejercicios, perfil) => {
    const reparto = new Map((ejercicios || []).map((e) => [e.id, window.GYM_MUSC(e)]));
    const base = new Map(), ultimo = new Map(), out = [];
    const ini = String(((perfil || [])[0] || {}).inicio_progreso || '');
    const lista = (sesiones || []).filter((s) => s.fecha >= ini);
    const semanas = [...new Set(lista.map((s) => s.semana))].sort();
    for (const sem of semanas) {
      const deSemana = new Map();
      for (const s of lista) {
        if (s.semana !== sem || !(s.e1rm_ajustado > 0)) continue;
        if (!base.has(s.ejercicio)) base.set(s.ejercicio, s.e1rm_ajustado);
        const l = deSemana.get(s.ejercicio) || [];
        l.push((s.e1rm_ajustado / base.get(s.ejercicio) - 1) * 100);
        deSemana.set(s.ejercicio, l);
      }
      for (const [ej, l] of deSemana) ultimo.set(ej, l.reduce((a, b) => a + b, 0) / l.length);
      const acc = new Map();
      for (const [ej, p] of ultimo) {
        for (const [m, w] of Object.entries(reparto.get(ej) || {})) {
          const peso = Number(w); if (!(peso > 0)) continue;
          const a = acc.get(m) || {s: 0, w: 0}; a.s += p * peso; a.w += peso; acc.set(m, a);
        }
      }
      for (const [m, a] of acc) out.push({id: `${m}|${sem}`, musculo: m, semana: sem, progreso_pct: Math.round((a.s / a.w) * 10) / 10});
    }
    return out;
  }
});
dash.calc('progreso_dia', {
  title: 'Progreso por sesión y tipo de día',
  description: 'Media de la mejora (%) del 1RM ajustado de los ejercicios de cada sesión frente a la primera vez que se hizo cada uno desde la fecha base del perfil.',
  inputs: ['sesiones_ejercicio', 'perfil'],
  fn: (sesiones, perfil) => {
    const base = new Map(), acc = new Map();
    const ini = String(((perfil || [])[0] || {}).inicio_progreso || '');
    for (const s of sesiones || []) {
      if (!(s.e1rm_ajustado > 0) || s.fecha < ini) continue;
      if (!base.has(s.ejercicio)) base.set(s.ejercicio, s.e1rm_ajustado);
      const k = `${s.fecha}|${s.dia}`;
      const a = acc.get(k) || {id: k, dia: s.dia || 'Sin día', fecha: s.fecha, l: []};
      a.l.push((s.e1rm_ajustado / base.get(s.ejercicio) - 1) * 100); acc.set(k, a);
    }
    return [...acc.values()].map((a) => ({id: a.id, dia: a.dia, fecha: a.fecha, ejercicios: a.l.length, progreso_pct: Math.round((a.l.reduce((x, y) => x + y, 0) / a.l.length) * 10) / 10})).sort((a, b) => (a.fecha < b.fecha ? -1 : 1));
  }
});
dash.calc('progreso_actual', {
  title: 'Progreso actual por músculo',
  description: 'Último valor semanal de progreso de cada músculo.',
  inputs: ['progreso'],
  fn: (progreso) => {
    const ult = new Map();
    for (const r of progreso || []) { const u = ult.get(r.musculo); if (!u || r.semana > u.semana) ult.set(r.musculo, r); }
    return [...ult.values()].map((r) => ({musculo: r.musculo, progreso_pct: r.progreso_pct, semana: r.semana})).sort((a, b) => b.progreso_pct - a.progreso_pct);
  }
});
dash.calc('volumen', {
  title: 'Series semanales por músculo',
  description: 'Series de cada semana repartidas entre músculos según cuánto trabaja cada ejercicio a cada uno.',
  inputs: ['sesiones_ejercicio', 'ejercicios'],
  fn: (sesiones, ejercicios) => {
    const reparto = new Map((ejercicios || []).map((e) => [e.id, window.GYM_MUSC(e)]));
    const acc = new Map();
    for (const s of sesiones || []) {
      for (const [m, w] of Object.entries(reparto.get(s.ejercicio) || {})) {
        const peso = Number(w); if (!(peso > 0)) continue;
        const k = `${m}|${s.semana}`;
        const a = acc.get(k) || {id: k, musculo: m, semana: s.semana, series: 0};
        a.series += s.series * peso; acc.set(k, a);
      }
    }
    return [...acc.values()].map((a) => ({...a, series: Math.round(a.series * 10) / 10}));
  }
});
dash.calc('resumen', {
  title: 'Resumen de entrenos',
  description: 'Sesiones y semanas registradas, último entreno y músculo que más ha progresado.',
  inputs: ['sesiones_ejercicio', 'progreso_actual'],
  fn: (sesiones, actual) => {
    const lista = sesiones || [], top = (actual || [])[0];
    if (!lista.length) return [];
    const fechas = lista.map((s) => s.fecha).sort();
    return [{sesiones: new Set(lista.map((s) => `${s.fecha}|${s.dia}`)).size, semanas: new Set(lista.map((s) => s.semana)).size, ultima_fecha: fechas[fechas.length - 1], mejor_musculo: top ? top.musculo : '', mejor_pct: top ? top.progreso_pct : 0}];
  }
});
dash.calc('reparto', {
  title: 'Reparto de cada ejercicio por músculo',
  description: 'Cuánto cuenta cada ejercicio para cada músculo.',
  inputs: ['ejercicios'],
  fn: (ejercicios) => (ejercicios || []).map((e) => ({id: e.id, nombre: e.nombre || e.id, dias: e.dias || '', reparto: Object.entries(window.GYM_MUSC(e)).sort((a, b) => b[1] - a[1]).map(([m, w]) => `${m} ${String(w).replace('.', ',')}`).join(', ') || 'Sin asignar'})).sort((a, b) => String(a.dias).localeCompare(String(b.dias)) || String(a.nombre).localeCompare(String(b.nombre)))
});
dash.calc('niveles_ejercicio', {
  title: 'Clase de fuerza por ejercicio',
  description: 'Tu mejor 1RM estimado de las últimas 12 semanas (o tu récord, en los básicos) comparado con los estándares de fuerza para tu peso corporal. Nivel 0–1 Iniciación, 1 Principiante, 2 Novato, 3 Intermedio, 4 Avanzado, 5 Élite.',
  inputs: ['sesiones_ejercicio', 'estandares', 'perfil', 'basicos', 'ejercicios'],
  fn: (sesiones, estandares, perfil, basicos, ejercicios) => {
    const yo = (perfil || [])[0] || {};
    const peso = Number(yo.peso);
    if (!(peso > 0)) return [];
    const NOMBRES = ['Iniciación', 'Principiante', 'Novato', 'Intermedio', 'Avanzado', 'Élite'];
    const nom = new Map((ejercicios || []).map((e) => [e.id, e.nombre]));
    const umbral = (s) => s.t80.map((v, i) => Math.max(1, peso <= 80 ? v + (s.t80[i] - s.t70[i]) * (peso - 80) / 10 : v + (s.t90[i] - s.t80[i]) * (peso - 80) / 10));
    const d = new Date(); d.setDate(d.getDate() - 84); const desde = d.toISOString().slice(0, 10);
    const rec = new Map((basicos || []).map((b) => [b.ejercicio, Number(b.marca) || 0]));
    const out = [];
    for (const s0 of estandares || []) {
      const s = {...s0, t70: window.GYM_ARR(s0.t70).map(Number), t80: window.GYM_ARR(s0.t80).map(Number), t90: window.GYM_ARR(s0.t90).map(Number)};
      if (s.t70.length < 5 || s.t80.length < 5 || s.t90.length < 5) continue;
      const ses = (sesiones || []).filter((x) => x.ejercicio === s.ejercicio && x.fecha >= desde);
      const e = Math.max(ses.length ? Math.max(...ses.map((x) => x.e1rm)) : 0, rec.get(s.ejercicio) || 0);
      if (!(e > 0)) continue;
      const T = umbral(s);
      let n;
      if (e < T[0]) n = e / T[0];
      else { let i = 0; while (i < 4 && e >= T[i + 1]) i++; n = i === 4 ? 5 + Math.min(0.99, (e - T[4]) / (T[4] - T[3])) : i + 1 + (e - T[i]) / (T[i + 1] - T[i]); }
      const k = Math.min(5, Math.floor(n));
      out.push({id: s.ejercicio, ejercicio: s.ejercicio, nombre: nom.get(s.ejercicio) || s.ejercicio, e1rm: Math.round(e * 10) / 10, nivel: Math.round(n * 100) / 100, clase: NOMBRES[k], siguiente: k < 5 ? NOMBRES[k + 1] : '', faltan: k < 5 ? Math.round((T[k] - e) * 10) / 10 : 0, aproximado: !!s.aproximado});
    }
    return out.sort((a, b) => b.nivel - a.nivel);
  }
});
dash.calc('niveles_musculo', {
  title: 'Clase de fuerza por músculo',
  description: 'Media del nivel de los ejercicios que trabajan cada músculo, ponderada por cuánto lo trabaja cada uno. Solo cuentan los ejercicios que lo trabajan al menos un 25 %.',
  inputs: ['niveles_ejercicio', 'ejercicios'],
  fn: (niveles, ejercicios) => {
    const NOMBRES = ['Iniciación', 'Principiante', 'Novato', 'Intermedio', 'Avanzado', 'Élite'];
    const rep = new Map((ejercicios || []).map((e) => [e.id, window.GYM_MUSC(e)]));
    const acc = new Map();
    for (const n of niveles || []) {
      for (const [m, w] of Object.entries(rep.get(n.ejercicio) || {})) {
        const p = Number(w); if (!(p >= 0.25)) continue;
        const a = acc.get(m) || {s: 0, w: 0, ej: []}; a.s += n.nivel * p; a.w += p; if (p >= 0.5) a.ej.push(n.nombre); acc.set(m, a);
      }
    }
    return [...acc].map(([m, a]) => { const nivel = Math.round((a.s / a.w) * 100) / 100; return {musculo: m, nivel, clase: NOMBRES[Math.min(5, Math.floor(nivel))], ejercicios: a.ej.slice(0, 3).join(', ')}; }).sort((a, b) => b.nivel - a.nivel);
  }
});
dash.calc('basicos_estado', {
  title: 'Tus básicos',
  description: 'Récord a una repetición (el mayor entre tu marca guardada y cualquier serie de 1 repetición registrada), 1RM estimado con Epley en las últimas 3 sesiones del ejercicio, meta y % alcanzado.',
  inputs: ['basicos', 'sesiones_ejercicio', 'entrenos'],
  fn: (basicos, sesiones, entrenos) => {
    const out = [];
    for (const b of (basicos || []).slice().sort((x, y) => (x.orden || 0) - (y.orden || 0))) {
      let rec = Number(b.marca) || 0;
      for (const e of entrenos || []) if (e.ejercicio === b.ejercicio) for (const s of window.GYM_ARR(e.series)) if (Number(s.reps) === 1 && Number(s.peso) > rec) rec = Number(s.peso);
      const ses = (sesiones || []).filter((s) => s.ejercicio === b.ejercicio).slice(-3);
      const e1 = ses.length ? Math.max(...ses.map((s) => s.e1rm)) : null;
      const meta = Number(b.meta) || null;
      const mejor = Math.max(rec, e1 || 0);
      out.push({id: b.id, nombre: b.nombre, ejercicio: b.ejercicio, record: rec, e1rm_actual: e1, meta, pct_meta: meta ? Math.round((mejor / meta) * 1000) / 10 : null, faltan: meta ? Math.round(Math.max(0, meta - mejor) * 10) / 10 : null});
    }
    return out;
  }
});
