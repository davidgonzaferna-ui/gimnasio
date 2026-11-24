const B = window.GYMF;
const SIL = 'M100,42 L89,42 C87,52 80,58 68,62 C52,64 40,72 34,86 C30,96 30,108 31,118 C26,132 22,148 20,162 C18,178 14,198 11,214 C9,224 8,232 9,238 C6,246 6,256 11,262 C15,266 19,262 20,256 C21,248 22,240 23,234 C27,214 33,194 37,178 C40,164 42,150 44,138 C46,126 48,118 52,112 C56,132 62,156 68,178 C71,190 72,200 71,210 C70,220 68,228 66,236 C61,258 60,286 63,310 C65,322 67,330 68,338 C63,352 62,372 66,392 C70,410 73,420 73,430 C69,436 69,442 75,444 L93,444 C94,438 92,432 91,428 C92,412 94,396 95,380 C96,364 94,350 93,340 C95,320 97,296 98,276 C99,262 100,254 100,250 Z';
const VISTAS = {
  frente: [
    ['Trapecio', 'M89,43 C87,52 80,58 70,61 C80,63 90,62 99,60 L99,48 C95,46 92,44 89,43 Z'],
    ['Hombro lateral', 'M60,63 C48,66 38,74 34,86 C31,96 31,108 32,118 C36,116 40,110 42,102 C44,88 50,74 60,63 Z'],
    ['Hombro anterior', 'M66,63 C57,68 50,78 46,90 C44,100 44,110 46,118 C52,114 56,106 59,96 C62,84 66,72 72,64 Z'],
    ['Pecho', 'M99,62 L99,116 C90,122 78,124 68,120 C62,114 59,104 60,94 C62,80 68,68 78,63 C86,61 93,61 99,62 Z'],
    ['Tríceps', 'M31,121 C27,134 24,148 22,160 C25,164 28,163 30,158 C32,146 35,134 39,124 Z'],
    ['Bíceps', 'M42,121 C37,132 33,146 32,160 C34,168 41,170 44,164 C46,152 47,138 47,126 C46,122 44,121 42,121 Z'],
    ['Antebrazo', 'M23,166 C18,182 15,198 13,214 C14,222 19,224 22,218 C25,204 28,188 31,172 C29,168 26,166 23,166 Z'],
    ['Antebrazo', 'M34,172 C31,188 27,206 24,226 C27,230 30,228 31,224 C34,208 37,192 41,176 C39,173 37,172 34,172 Z'],
    ['Oblicuos', 'M60,124 C62,136 64,148 67,160 L74,158 C72,146 70,134 67,122 Z'],
    ['Oblicuos', 'M70,122 C73,134 75,146 77,156 L86,156 L87,124 C81,124 75,123 70,122 Z'],
    ['Oblicuos', 'M68,164 C70,178 72,192 74,204 C78,212 83,216 86,214 C85,196 85,176 86,159 C80,160 74,162 68,164 Z'],
    ['Abdomen', 'M89,122 L99,122 L99,141 L88,141 C88,134 88,128 89,122 Z'],
    ['Abdomen', 'M88,144 L99,144 L99,163 L88,163 Z'],
    ['Abdomen', 'M88,166 L99,166 L99,185 L88,185 Z'],
    ['Abdomen', 'M88,188 L99,188 L99,222 C95,222 91,214 89,206 C88,200 88,194 88,188 Z'],
    ['Cuádriceps', 'M66,240 C61,262 60,288 63,310 C65,320 68,328 71,334 C75,328 77,316 77,302 C77,280 77,258 79,244 C75,241 70,240 66,240 Z'],
    ['Cuádriceps', 'M81,246 C79,264 79,288 80,306 C81,316 83,324 86,330 C89,322 91,310 91,298 C92,278 91,260 88,248 C86,246 84,246 81,246 Z'],
    ['Cuádriceps', 'M91,302 C88,314 88,326 91,334 C95,334 97,326 97,316 C96,310 94,305 91,302 Z'],
    ['Aductores', 'M90,248 C93,260 95,276 96,292 C98,284 99,270 99,256 L99,252 C96,250 93,248 90,248 Z'],
    ['Gemelos', 'M70,344 C66,360 66,378 70,396 C72,404 75,406 78,404 C79,388 80,368 80,350 C77,346 74,344 70,344 Z'],
    ['Gemelos', 'M83,348 C84,366 86,386 87,404 C91,398 94,382 94,366 C94,356 90,350 83,348 Z']
  ],
  espalda: [
    ['Trapecio', 'M99,44 C95,48 90,54 82,58 C72,62 62,62 56,63 C66,70 76,80 84,92 C90,104 94,118 99,134 Z'],
    ['Hombro posterior', 'M56,64 C46,68 38,76 34,88 C31,98 31,108 32,118 C37,114 42,106 45,96 C48,84 54,74 62,67 Z'],
    ['Espalda media', 'M64,72 C58,80 55,90 55,100 C63,104 73,104 81,100 C79,90 75,80 68,74 Z'],
    ['Tríceps', 'M46,118 C38,128 30,142 24,160 C27,168 37,170 42,164 C46,152 48,136 49,122 Z'],
    ['Antebrazo', 'M23,166 C18,182 15,198 13,214 C14,222 19,224 22,218 C25,204 28,188 31,172 C29,168 26,166 23,166 Z'],
    ['Antebrazo', 'M34,172 C31,188 27,206 24,226 C27,230 30,228 31,224 C34,208 37,192 41,176 C39,173 37,172 34,172 Z'],
    ['Dorsal', 'M55,106 C56,126 61,148 68,168 C72,182 76,194 82,204 C88,206 94,206 99,204 L99,142 C94,128 88,114 84,104 C74,108 63,108 55,106 Z'],
    ['Lumbar', 'M83,208 C87,214 90,220 92,226 L99,226 L99,208 Z'],
    ['Glúteo', 'M69,232 C63,246 64,266 73,276 C84,284 96,282 99,274 L99,230 C90,224 78,224 69,232 Z'],
    ['Isquiotibiales', 'M65,284 C61,304 62,322 68,336 C72,340 77,338 78,332 C78,314 78,298 80,284 C75,280 70,280 65,284 Z'],
    ['Isquiotibiales', 'M82,284 C81,302 82,320 85,336 C89,342 95,338 96,330 C97,312 97,296 96,286 C92,282 87,282 82,284 Z'],
    ['Gemelos', 'M68,346 C64,360 64,380 70,396 C74,400 79,398 80,392 C81,374 80,358 80,346 C76,342 72,342 68,346 Z'],
    ['Gemelos', 'M83,346 C84,362 86,380 87,396 C92,392 95,376 94,360 C93,350 89,346 83,346 Z']
  ]
};
dash.draw('cuerpo', (el) => {
  el.replaceChildren();
  const rows = B.rows('niveles_musculo');
  if (!rows) { B.fallo(el, 'niveles_musculo'); return; }
  const val = new Map(rows.map((r) => [r.musculo, r]));
  if (!val.has(window.gymMusc)) window.gymMusc = rows.length ? rows[0].musculo : null;
  const svg = d3.select(el).append('svg').attr('viewBox', '0 0 430 446').attr('role', 'group').attr('aria-label', 'Mapa del cuerpo coloreado según la clase de fuerza de cada músculo');
  const info = document.createElement('div'); info.className = 'g-info'; info.setAttribute('aria-live', 'polite'); el.appendChild(info);
  const pintarInfo = () => {
    info.replaceChildren();
    const m = window.gymMusc, r = val.get(m);
    const izq = document.createElement('div');
    const n = document.createElement('div'); n.className = 'g-info-n'; n.textContent = m || 'Elige un músculo';
    const s = document.createElement('div'); s.className = 'g-info-s'; s.textContent = r ? `Nivel ${B.num(r.nivel)} de 5${r.ejercicios ? ', según ' + r.ejercicios : ''}` : 'Ningún ejercicio con estándar lo trabaja todavía';
    izq.append(n, s);
    const v = document.createElement('div'); v.className = 'g-info-v'; v.textContent = r ? r.clase : '—';
    if (r) { v.dataset.source = 'niveles_musculo'; v.dataset.field = 'clase'; v.dataset.where = 'musculo=' + encodeURIComponent(m); v.style.color = B.clase(r.nivel).color; }
    info.append(izq, v);
    svg.selectAll('.musc').classed('sel', (d) => d === m);
  };
  const vista = (dx, titulo, partes) => {
    const g = svg.append('g').attr('transform', `translate(${dx},4)`);
    g.append('ellipse').attr('class', 'sil').attr('cx', 100).attr('cy', 24).attr('rx', 15).attr('ry', 19);
    g.append('path').attr('class', 'sil').attr('d', 'M89,36 L111,36 L111,50 L89,50 Z');
    const lados = [g.append('g'), g.append('g').attr('transform', 'translate(200,0) scale(-1,1)')];
    for (const lado of lados) {
      lado.append('path').attr('class', 'sil').attr('d', SIL);
      for (const [m, d] of partes) {
        const r = val.get(m);
        lado.append('path').datum(m).attr('class', 'musc').attr('d', d).attr('tabindex', 0).attr('role', 'button').attr('aria-label', r ? `${m}: ${r.clase}` : `${m}: sin datos`)
          .style('fill', r ? B.clase(r.nivel).color : '#4b545e')
          .on('click', () => { window.gymMusc = m; pintarInfo(); })
          .on('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); window.gymMusc = m; pintarInfo(); } });
      }
    }
    g.append('text').attr('class', 'vista').attr('x', 100).attr('y', 440).attr('text-anchor', 'middle').text(titulo);
  };
  vista(4, 'Frente', VISTAS.frente);
  vista(226, 'Espalda', VISTAS.espalda);
  pintarInfo();
});
