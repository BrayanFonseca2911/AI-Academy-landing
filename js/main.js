/* =========================================================
   Campuslands AI Academy · Interacciones de la misión
   1. Hero reactivo (elección de perfil + campo estelar + parallax)
   2. Recorrido narrativo con el scroll (progreso, riel y revelados)
   3. Recomendador de planes (3 preguntas -> misión sugerida)
   4. Exploración libre (constelación de 14 herramientas + antes/después + calculadora)
   ========================================================= */

(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  // ---------- Año dinámico ----------
  const yearEl = $('[data-year]');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---------- Menú móvil ----------
  const menuBtn = $('.menu-toggle');
  const mainNav = $('#main-nav');
  if (menuBtn && mainNav) {
    const closeMenu = () => {
      menuBtn.setAttribute('aria-expanded', 'false');
      mainNav.classList.remove('is-open');
    };
    menuBtn.addEventListener('click', () => {
      const open = menuBtn.getAttribute('aria-expanded') === 'true';
      menuBtn.setAttribute('aria-expanded', String(!open));
      mainNav.classList.toggle('is-open', !open);
    });
    $$('a', mainNav).forEach((a) => a.addEventListener('click', closeMenu));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
    });
  }

  // =========================================================
  // 01 · HERO REACTIVO (Perfiles + Campo estelar + Parallax)
  // =========================================================
  const PERSONAS = {
    empresa: {
      lead: 'Lleva la IA a las áreas clave de tu empresa con un programa práctico, casos de tu industria y métricas claras para dirección.',
      points: [
        'Programas para equipos o toda la empresa',
        'Presencial en tus oficinas, Campuslands o virtual',
        'Diagnóstico y ruta a la medida (Odyssey / Liftoff)'
      ],
      mission: 'Odyssey · Liftoff',
      crew: 'Tu empresa',
      recommended: 'odyssey',
      caseIdx: 0
    },
    lider: {
      lead: 'Libera a tu equipo de tareas repetitivas. En 8 o 12 horas construyen asistentes y flujos que ahorran horas desde la primera semana.',
      points: [
        'Ejercicios con las tareas reales de tu equipo',
        'Banco de prompts y agentes personalizados por rol',
        'Acompañamiento por WhatsApp después de clase'
      ],
      mission: 'Booster · 8 h',
      crew: 'Tu equipo',
      recommended: 'booster',
      caseIdx: 1
    },
    independiente: {
      lead: 'Multiplica tu capacidad sin trabajar más horas. Domina asistentes, prompting y automatizaciones para entregar mejor y más rápido.',
      points: [
        'Rutas desde 4 horas o a tu ritmo 24/7',
        'Prompts y agentes listos para tu trabajo diario',
        'Certificación oficial por horas cursadas'
      ],
      mission: 'Ignition · Nebula',
      crew: 'Profesional',
      recommended: 'ignition',
      caseIdx: 2
    }
  };

  const personaBtns = $$('.persona');
  const heroLead = $('[data-hero-lead]');
  const heroPoints = $('[data-hero-points]');
  const hudMission = $('[data-hud-mission]');
  const hudCrew = $('[data-hud-crew]');
  const maxImgs = $$('[data-max]');

  function highlightRecommendedMission(planKey) {
    $$('[data-plan]').forEach((card) => {
      card.classList.toggle('is-recommended', card.dataset.plan === planKey);
    });
  }

  function selectPersona(key) {
    const data = PERSONAS[key];
    if (!data) return;

    personaBtns.forEach((btn) => {
      const active = btn.dataset.persona === key;
      btn.setAttribute('aria-checked', String(active));
    });

    if (heroLead && heroPoints) {
      heroLead.classList.add('is-swapping');
      heroPoints.classList.add('is-swapping');
      setTimeout(() => {
        heroLead.textContent = data.lead;
        heroPoints.innerHTML = data.points.map((p) => `<li>${p}</li>`).join('');
        heroLead.classList.remove('is-swapping');
        heroPoints.classList.remove('is-swapping');
      }, 160);
    }

    if (hudMission) {
      hudMission.textContent = data.mission;
      hudMission.classList.remove('is-pulse');
      void hudMission.offsetWidth;
      hudMission.classList.add('is-pulse');
    }
    if (hudCrew) hudCrew.textContent = data.crew;

    maxImgs.forEach((img) => {
      img.classList.toggle('max-active', img.dataset.max === key);
    });

    highlightRecommendedMission(data.recommended);
    if (typeof activateCaseTab === 'function') activateCaseTab(data.caseIdx, false);
  }

  personaBtns.forEach((btn, idx) => {
    btn.addEventListener('click', () => selectPersona(btn.dataset.persona));
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const dir = e.key === 'ArrowRight' ? 1 : -1;
        const next = personaBtns[(idx + dir + personaBtns.length) % personaBtns.length];
        next.focus();
        selectPersona(next.dataset.persona);
      }
    });
  });

  // Parallax suave con cursor / inclinación en el hero y constelación
  const heroSection = $('.hero');
  if (heroSection && !reduceMotion) {
    let tx = 0, ty = 0, cx = 0, cy = 0, rafId = null;
    const tick = () => {
      cx += (tx - cx) * 0.12;
      cy += (ty - cy) * 0.12;
      document.documentElement.style.setProperty('--mx', cx.toFixed(3));
      document.documentElement.style.setProperty('--my', cy.toFixed(3));
      if (Math.abs(tx - cx) > 0.002 || Math.abs(ty - cy) > 0.002) {
        rafId = requestAnimationFrame(tick);
      } else {
        rafId = null;
      }
    };
    window.addEventListener('pointermove', (e) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
      if (!rafId) rafId = requestAnimationFrame(tick);
    }, { passive: true });
  }

  // Campo estelar interactivo en canvas
  const canvas = $('.starfield');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, stars = [];
    const createStars = () => {
      w = canvas.width = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
      const count = Math.min(90, Math.floor((w * h) / 14000));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.7 + 0.4,
        a: Math.random() * 0.65 + 0.2,
        v: (Math.random() * 0.25 + 0.05) * (reduceMotion ? 0 : 1),
        violet: Math.random() > 0.68
      }));
    };
    const drawStars = () => {
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        s.y -= s.v;
        if (s.y < 0) { s.y = h; s.x = Math.random() * w; }
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = s.violet ? `rgba(183,131,255,${s.a})` : `rgba(255,255,255,${s.a})`;
        ctx.fill();
      }
      if (!reduceMotion) requestAnimationFrame(drawStars);
    };
    createStars();
    drawStars();
    window.addEventListener('resize', createStars, { passive: true });
  }

  // =========================================================
  // 02 · RECORRIDO NARRATIVO CON EL SCROLL
  // =========================================================
  const header = $('.site-header');
  const dock = $('[data-dock]');
  const tripLabel = $('.trip-bar-label');
  const railLinks = $$('.mission-rail a');
  const navLinks = $$('.main-nav a[href^="#"]');
  const stages = $$('main > section[id]');

  // Revelado progresivo de bloques
  const revealEls = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-in'));
  }

  const updateScroll = () => {
    const y = window.scrollY;
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const progress = Math.min(1, Math.max(0, y / max));
    document.documentElement.style.setProperty('--progress', progress.toFixed(4));

    if (header) header.classList.toggle('is-scrolled', y > 24);
    if (dock) dock.classList.toggle('is-visible', y > 360);

    // Determinar etapa activa
    const pivot = y + window.innerHeight * 0.36;
    let current = stages[0];
    for (const sec of stages) {
      if (sec.offsetTop <= pivot) current = sec;
    }
    if (current) {
      const id = current.id;
      const stageName = current.dataset.stageName || id;
      if (tripLabel) tripLabel.textContent = stageName;

      let passed = true;
      railLinks.forEach((link) => {
        const isCur = link.dataset.stage === id;
        if (isCur) passed = false;
        link.classList.toggle('is-current', isCur);
        link.classList.toggle('is-done', passed && !isCur);
      });
      navLinks.forEach((link) => {
        link.classList.toggle('is-current', link.getAttribute('href') === `#${id}`);
      });
    }
  };
  updateScroll();
  window.addEventListener('scroll', updateScroll, { passive: true });
  window.addEventListener('resize', updateScroll, { passive: true });

  // =========================================================
  // 03 · ELEMENTO DE EXPLORACIÓN LIBRE: CONSTELACIÓN 14 HERRAMIENTAS
  // =========================================================
  const TOOLS = [
    {
      id: 'chatgpt', name: 'ChatGPT', cat: 'asistentes', catLabel: 'Asistentes',
      logo: 'assets/tools/chatgpt-6.svg', x: 18, y: 26,
      tagline: 'Asistente conversacional para ideas y código',
      desc: 'Potencia tu flujo creativo y técnico con respuestas contextualizadas, generación de contenido y soporte en múltiples lenguajes.',
      hl: ['Redacción inteligente', 'Desarrollo y depuración', 'Flujos personalizados'],
      links: ['claude', 'gemini', 'notion']
    },
    {
      id: 'claude', name: 'Claude', cat: 'asistentes', catLabel: 'Asistentes',
      logo: 'assets/tools/claudeLogo.svg', x: 34, y: 18,
      tagline: 'IA colaborativa con atención al detalle',
      desc: 'Diseñada para equipos que requieren precisión, auditoría, análisis de documentos extensos y controles de seguridad en sus procesos.',
      hl: ['Memoria extendida', 'Verificación y control', 'Privacidad corporativa'],
      links: ['chatgpt', 'notebooklm']
    },
    {
      id: 'gemini', name: 'Gemini', cat: 'asistentes', catLabel: 'Asistentes',
      logo: 'assets/tools/geminiLogo.svg', x: 52, y: 24,
      tagline: 'Visión multimodal impulsada por Google',
      desc: 'Analiza texto, imágenes y datos complejos para crear soluciones de alto impacto conectadas con Google Workspace.',
      hl: ['Procesamiento multimodal', 'Insights a escala', 'Google Workspace'],
      links: ['notebooklm', 'perplexity']
    },
    {
      id: 'mscopilot', name: 'Microsoft Copilot', cat: 'productividad', catLabel: 'Productividad',
      logo: 'assets/tools/microsoft-copilot-1.svg', x: 72, y: 19,
      tagline: 'Asistencia integrada en el ecosistema Microsoft',
      desc: 'Automatiza documentos en Word, presentaciones en PowerPoint y análisis en Excel con seguridad empresarial.',
      hl: ['Microsoft 365', 'Reportes automáticos', 'Seguridad empresarial'],
      links: ['readai', 'notion']
    },
    {
      id: 'ghcopilot', name: 'GitHub Copilot', cat: 'codigo', catLabel: 'Código',
      logo: 'assets/tools/github-icon-1.svg', x: 87, y: 31,
      tagline: 'Colaborador de código en tiempo real',
      desc: 'Aumenta la productividad de tus repositorios con sugerencias contextuales, generación de pruebas y refactorización.',
      hl: ['Múltiples lenguajes', 'Explicaciones de código', 'Integraciones IDE'],
      links: ['chatgpt', 'make']
    },
    {
      id: 'make', name: 'Make', cat: 'automatizacion', catLabel: 'Automatización',
      logo: 'assets/tools/makeLogo.svg', x: 26, y: 54,
      tagline: 'Orquestación visual de procesos',
      desc: 'Diseña escenarios visuales con IA para conectar formularios, hojas de cálculo, CRM y canales de atención sin código.',
      hl: ['Editor visual', 'Conectores amplios', 'Monitoreo real'],
      links: ['zapier', 'chatgpt']
    },
    {
      id: 'zapier', name: 'Zapier', cat: 'automatizacion', catLabel: 'Automatización',
      logo: 'assets/tools/zapier.svg', x: 13, y: 74,
      tagline: 'Automatización con inteligencia contextual',
      desc: 'Conecta aplicaciones y flujos de trabajo con agentes que comprenden la intención y ejecutan tareas repetitivas.',
      hl: ['Sin código', 'Plantillas inteligentes', 'Flujos multietapa'],
      links: ['make', 'notion']
    },
    {
      id: 'perplexity', name: 'Perplexity', cat: 'investigacion', catLabel: 'Investigación',
      logo: 'assets/tools/perplexity-color-1-.svg', x: 46, y: 48,
      tagline: 'Investigación asistida por IA',
      desc: 'Encuentra respuestas verificables con fuentes citadas, análisis comparativo de mercado y navegación de referencias.',
      hl: ['Citas en contexto', 'Temas relacionados', 'Descubrimiento enfocado'],
      links: ['notebooklm', 'gemini']
    },
    {
      id: 'notebooklm', name: 'NotebookLM', cat: 'investigacion', catLabel: 'Investigación',
      logo: 'assets/tools/notebook-lm-dark.svg', x: 64, y: 46,
      tagline: 'Tu asistente de investigación con tus documentos',
      desc: 'Sube tus manuales, PDF, notas e informes para hacer preguntas, resumir y generar guías basadas solo en tus fuentes.',
      hl: ['Fuentes propias', 'Resúmenes y guías', 'Escritura contextual'],
      links: ['perplexity', 'claude']
    },
    {
      id: 'notion', name: 'Notion AI', cat: 'productividad', catLabel: 'Productividad',
      logo: 'assets/tools/notion-2.svg', x: 38, y: 76,
      tagline: 'Organización y contenido en un solo espacio',
      desc: 'Transforma tus documentos, actas, bases de datos y proyectos con redacción asistida y resúmenes automáticos.',
      hl: ['Resúmenes automáticos', 'Notas e ideas', 'Integración Notion'],
      links: ['readai', 'make']
    },
    {
      id: 'readai', name: 'Read AI', cat: 'productividad', catLabel: 'Productividad',
      logo: 'assets/tools/ReadAI.svg', x: 58, y: 74,
      tagline: 'Resúmenes y análisis para tus reuniones',
      desc: 'Genera transcripciones, acuerdos y tareas clave de tus videollamadas para que te enfoques en la conversación.',
      hl: ['Transcripciones automáticas', 'Temas clave', 'Análisis sentimiento'],
      links: ['notion', 'mscopilot']
    },
    {
      id: 'midjourney', name: 'Midjourney', cat: 'creacion', catLabel: 'Creación',
      logo: 'assets/tools/midjourney.svg', x: 82, y: 56,
      tagline: 'Diseño visual impulsado por prompts',
      desc: 'Crea identidades visuales, conceptos de campaña y prototipos gráficos con resultados de alta fidelidad.',
      hl: ['Imágenes alta fidelidad', 'Estilos artísticos', 'Iteración rápida'],
      links: ['heygen', 'elevenlabs']
    },
    {
      id: 'elevenlabs', name: 'ElevenLabs', cat: 'creacion', catLabel: 'Creación',
      logo: 'assets/tools/elevenlabs.svg', x: 74, y: 82,
      tagline: 'Voces sintéticas realistas y clonación de voz',
      desc: 'Genera locuciones naturales en múltiples idiomas y acentos para videos formativos, anuncios y asistentes.',
      hl: ['TTS natural', 'Clonación voz', 'Voces personalizables'],
      links: ['heygen', 'midjourney']
    },
    {
      id: 'heygen', name: 'HeyGen', cat: 'creacion', catLabel: 'Creación',
      logo: 'assets/tools/icons8-heygen.svg', x: 90, y: 78,
      tagline: 'Creación de avatares y videos con IA',
      desc: 'Produce videos profesionales con avatares personalizables, sincronización de labios y traducción a otros idiomas.',
      hl: ['Avatares personalizables', 'Traducción video', 'Videos desde texto'],
      links: ['elevenlabs', 'midjourney']
    }
  ];

  const constellation = $('[data-constellation]');
  const linesSvg = $('.constellation-lines');
  const toolPanel = $('[data-tool-panel]');
  const filterBtns = $$('.tool-filters [data-filter]');
  const seenTools = new Set();

  if (constellation && linesSvg && toolPanel) {
    const byId = Object.fromEntries(TOOLS.map((t) => [t.id, t]));
    const drawnPairs = new Set();

    // Dibujar líneas entre estrellas conectadas
    linesSvg.setAttribute('viewBox', '0 0 100 100');
    TOOLS.forEach((t) => {
      t.links.forEach((targetId) => {
        const key = [t.id, targetId].sort().join('--');
        if (drawnPairs.has(key) || !byId[targetId]) return;
        drawnPairs.add(key);
        const target = byId[targetId];
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', t.x);
        line.setAttribute('y1', t.y);
        line.setAttribute('x2', target.x);
        line.setAttribute('y2', target.y);
        line.dataset.from = t.id;
        line.dataset.to = targetId;
        linesSvg.appendChild(line);
      });
    });

    // Crear botones de estrella
    TOOLS.forEach((t, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'star';
      btn.style.setProperty('--x', `${t.x}%`);
      btn.style.setProperty('--y', `${t.y}%`);
      btn.style.setProperty('--depth', `${((i % 3) + 1) * 4}px`);
      btn.dataset.tool = t.id;
      btn.dataset.cat = t.cat;
      btn.dataset.name = t.name;
      btn.setAttribute('aria-label', `${t.name}: ${t.tagline}`);
      btn.innerHTML = `<span class="star-icon"><img src="${t.logo}" width="28" height="28" alt="" loading="lazy" /></span><span class="star-label">${t.name}</span>`;
      btn.addEventListener('click', () => {
        selectTool(t.id);
        if (window.innerWidth <= 920) {
          toolPanel.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
        }
      });
      constellation.appendChild(btn);
    });

    function selectTool(id) {
      const t = byId[id];
      if (!t) return;
      seenTools.add(id);

      $$('.star', constellation).forEach((b) => {
        const isAct = b.dataset.tool === id;
        b.classList.toggle('is-active', isAct);
        if (seenTools.has(b.dataset.tool)) b.classList.add('is-seen');
      });

      $$('line', linesSvg).forEach((ln) => {
        const lit = ln.dataset.from === id || ln.dataset.to === id;
        ln.classList.toggle('is-lit', lit);
      });

      toolPanel.innerHTML = `
        <div class="tool-detail">
          <div class="tool-detail-head">
            <span class="tool-detail-logo"><img src="${t.logo}" width="28" height="28" alt="" /></span>
            <div>
              <p class="tool-cat">${t.catLabel}</p>
              <h3>${t.name}</h3>
            </div>
          </div>
          <p class="tool-tagline">${t.tagline}</p>
          <p class="tool-desc">${t.desc}</p>
          <ul class="tool-hl" aria-label="Qué trabajamos con ${t.name}">
            ${t.hl.map((h) => `<li>${h}</li>`).join('')}
          </ul>
          <p class="tool-progress">Has explorado <strong>${seenTools.size} de ${TOOLS.length}</strong> herramientas de la constelación.</p>
        </div>
      `;
    }

    filterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const f = btn.dataset.filter;
        filterBtns.forEach((b) => {
          const on = b === btn;
          b.classList.toggle('is-active', on);
          b.setAttribute('aria-pressed', String(on));
        });
        let firstMatch = null;
        $$('.star', constellation).forEach((star) => {
          const match = f === 'all' || star.dataset.cat === f;
          star.classList.toggle('is-dim', !match);
          if (match && !firstMatch) firstMatch = star.dataset.tool;
        });
        if (firstMatch) selectTool(firstMatch);
      });
    });

    // Seleccionar ChatGPT por defecto para mostrar cómo funciona
    selectTool('chatgpt');
  }

  // =========================================================
  // 04 · RECOMENDADOR DE PLANES (3 preguntas -> misión)
  // =========================================================
  const PLAN_META = {
    ignition: {
      name: 'Ignition', dur: '4 horas', cta: 'Inscríbete en Ignition',
      programValue: 'Ignition (4 horas)',
      why: 'Ideal para dar el primer salto en medio día: entiendes cómo impacta la IA en tu trabajo, dominas un asistente diario y creas tu primer agente en vivo.'
    },
    booster: {
      name: 'Booster', dur: '8 horas', cta: 'Inscríbete en Booster',
      programValue: 'Booster (8 horas)',
      why: 'Perfecta cuando necesitas resultados precisos para tu rol: técnicas de prompting profesional, dos herramientas a fondo y agentes hechos para tus tareas.'
    },
    liftoff: {
      name: 'Liftoff', dur: '12 horas', cta: 'Inscríbete en Liftoff',
      programValue: 'Liftoff (12 horas)',
      why: 'Tu misión si buscas escalar y automatizar: suma n8n para conectar procesos reales y dejar flujos automáticos trabajando para tu operación.'
    },
    odyssey: {
      name: 'Odyssey', dur: 'Personalizado', cta: 'Inscríbete en Odyssey',
      programValue: 'Odyssey (Personalizado)',
      why: 'Diseñada 100 % a la medida de tu empresa: elegimos juntos las herramientas, la duración y los casos de uso según tu industria y tus equipos.'
    },
    nebula: {
      name: 'Nebula', dur: 'Pregrabado · 24/7', cta: 'Accede a Nebula',
      programValue: 'Nebula (Pregrabado)',
      why: 'Aprendes a tu propio ritmo con acceso 24/7 por niveles, evaluaciones continuas y comunidad activa para resolver dudas.'
    }
  };

  const recWrap = $('[data-recommender]');
  if (recWrap) {
    const qFieldsets = $$('.rec-q', recWrap);
    const stepDots = $$('.rec-steps li', recWrap);
    const resultBox = $('[data-rec-result]', recWrap);
    const recForm = $('.rec-form', recWrap);
    const backBtn = $('[data-rec-back]', recWrap);
    const resetBtn = $('[data-rec-reset]', recWrap);
    const seeBtn = $('[data-rec-see]', recWrap);
    const recName = $('[data-rec-name]', recWrap);
    const recDur = $('[data-rec-dur]', recWrap);
    const recWhy = $('[data-rec-why]', recWrap);
    const recCta = $('[data-rec-cta]', recWrap);

    let currentStep = 0;
    let chosenKey = 'booster';
    const answers = {};

    const showStep = (idx) => {
      currentStep = idx;
      recForm.hidden = false;
      resultBox.hidden = true;
      qFieldsets.forEach((fs, i) => fs.classList.toggle('is-active', i === idx));
      stepDots.forEach((li, i) => {
        li.classList.toggle('is-current', i === idx);
        li.classList.toggle('is-done', i < idx);
      });
      if (backBtn) backBtn.hidden = idx === 0;
    };

    const computeMission = () => {
      const { q1, q2, q3 } = answers;
      if (q2 === 'ritmo') return 'nebula';
      if (q1 === 'empresa' || q3 === 'medida') return 'odyssey';
      if (q3 === 'automatizar' || q2 === '12') return 'liftoff';
      if (q3 === 'agentes' || q2 === '8' || q1 === 'equipo') return 'booster';
      return 'ignition';
    };

    const showResult = () => {
      chosenKey = computeMission();
      const meta = PLAN_META[chosenKey];
      recForm.hidden = true;
      if (backBtn) backBtn.hidden = true;
      stepDots.forEach((li) => {
        li.classList.remove('is-current');
        li.classList.add('is-done');
      });
      recName.textContent = meta.name;
      recDur.textContent = meta.dur;
      recWhy.textContent = meta.why;
      recCta.textContent = meta.cta;
      recCta.dataset.selectProgram = meta.programValue;
      resultBox.hidden = false;
      resultBox.focus();
      highlightRecommendedMission(chosenKey);
    };

    $$('input[type="radio"]', recForm).forEach((input) => {
      input.addEventListener('change', () => {
        answers[input.name] = input.value;
        if (currentStep < qFieldsets.length - 1) {
          showStep(currentStep + 1);
        } else {
          showResult();
        }
      });
    });

    if (backBtn) {
      backBtn.addEventListener('click', () => {
        if (currentStep > 0) showStep(currentStep - 1);
      });
    }
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        $$('input[type="radio"]', recForm).forEach((i) => { i.checked = false; });
        showStep(0);
      });
    }
    if (seeBtn) {
      seeBtn.addEventListener('click', () => {
        const card = $(`#mision-${chosenKey}`);
        if (card) card.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      });
    }
  }

  // =========================================================
  // 05 · CALCULADORA "¿POR QUÉ AHORA?"
  // =========================================================
  const calcBox = $('[data-calc]');
  if (calcBox) {
    const inPeople = $('#calc-people', calcBox);
    const inHours = $('#calc-hours', calcBox);
    const outPeople = $('[data-out-people]', calcBox);
    const outHours = $('[data-out-hours]', calcBox);
    const outTotal = $('[data-calc-total]', calcBox);

    const setRangeFill = (input) => {
      const min = Number(input.min) || 0;
      const max = Number(input.max) || 100;
      const val = Number(input.value);
      const pct = ((val - min) / (max - min)) * 100;
      input.style.setProperty('--fill', `${pct}%`);
    };

    const updateCalc = () => {
      const p = Number(inPeople.value);
      const h = Number(inHours.value);
      outPeople.textContent = p;
      outHours.textContent = `${h} h`;
      const total = p * h * 46;
      outTotal.textContent = total.toLocaleString('es-CO');
      setRangeFill(inPeople);
      setRangeFill(inHours);
    };
    inPeople.addEventListener('input', updateCalc);
    inHours.addEventListener('input', updateCalc);
    updateCalc();
  }

  // =========================================================
  // 06 · CASOS DE USO (4 perfiles + comparador dinámico sin recortes)
  // =========================================================
  const CASES = [
    {
      role: 'Empresario / Emprendedor',
      roleAfter: 'Empresario con asistentes de IA',
      before: 'Procesos comerciales manuales, lanzamientos lentos y decisiones a ciegas por falta de contenido y reportes actualizados.',
      after: 'Asistentes de IA que crean correos, propuestas y reportes en minutos, con métricas claras para escalar ventas sin fricción.',
      pains: ['Horas en tareas manuales', 'Reportes tardíos', 'Fricción comercial'],
      gains: ['Propuestas en minutos', 'Métricas al día', 'Ventas escalables']
    },
    {
      role: 'Director(a) de innovación',
      roleAfter: 'Líder con pilotos que sí escalan',
      before: 'Pilotos desconectados que no escalan y escasa evidencia para justificar la inversión ante la dirección.',
      after: 'Sesiones intensivas desde 4 horas con agentes funcionales, casos de uso claros y métricas de eficiencia listas para presentar.',
      pains: ['Pilotos aislados', 'Sin métricas claras', 'Adopción lenta'],
      gains: ['Agentes en 4 horas', 'Casos por área', 'ROI demostrable']
    },
    {
      role: 'Profesional independiente',
      roleAfter: 'Independiente potenciado con IA',
      before: 'Demasiado tiempo en tareas repetitivas, poco foco en vender y mínima diferenciación frente al mercado.',
      after: 'Prompts estratégicos que generan propuestas, automatizan el seguimiento y entregan resultados personalizados en segundos.',
      pains: ['Operación absorbente', 'Seguimiento manual', 'Poca diferenciación'],
      gains: ['Prompts de alto nivel', 'Seguimiento automático', 'Entregas en segundos']
    },
    {
      role: 'Líder de RR. HH.',
      roleAfter: 'Talento humano con rutas inteligentes',
      before: 'Inducción genérica, procesos manuales y nulo acompañamiento adaptado a cada rol.',
      after: 'Rutas de microaprendizaje con asistentes que guían, responden dudas frecuentes y recogen retroalimentación continua.',
      pains: ['Inducción plana', 'Consultas repetidas', 'Cero seguimiento'],
      gains: ['Asistente por rol', 'Respuestas 24/7', 'Feedback continuo']
    }
  ];

  const caseTabs = $$('[data-case]');
  const casePanel = $('#case-panel');
  const beforeText = $('[data-case-before]');
  const afterText = $('[data-case-after]');
  const roleBefore = $('[data-case-role-before]');
  const roleAfter = $('[data-case-role-after]');
  const painsList = $('[data-case-pains]');
  const gainsList = $('[data-case-gains]');
  const compareBox = $('[data-compare]');
  const compareRange = $('#compare-range');
  const compareStatus = $('[data-compare-status]');
  const modeBtns = $$('[data-compare-mode]');
  const panels = $$('[data-panel]');
  const swapBtn = $('[data-compare-toggle]');

  function activateCaseTab(idx, focusTab = false) {
    const item = CASES[idx];
    if (!item || !beforeText || !afterText) return;
    caseTabs.forEach((tab, i) => {
      const on = i === idx;
      tab.classList.toggle('is-active', on);
      tab.setAttribute('aria-selected', String(on));
      tab.setAttribute('tabindex', on ? '0' : '-1');
      if (on && focusTab) tab.focus();
    });
    if (casePanel) casePanel.setAttribute('aria-labelledby', `tab-case-${idx}`);

    panels.forEach((p) => p.classList.add('is-swapping'));
    setTimeout(() => {
      beforeText.textContent = item.before;
      afterText.textContent = item.after;
      if (roleBefore) roleBefore.textContent = item.role;
      if (roleAfter) roleAfter.textContent = item.roleAfter;
      if (painsList) painsList.innerHTML = item.pains.map((p) => `<li>${p}</li>`).join('');
      if (gainsList) gainsList.innerHTML = item.gains.map((g) => `<li>${g}</li>`).join('');
      panels.forEach((p) => p.classList.remove('is-swapping'));
    }, 150);
  }

  caseTabs.forEach((tab, idx) => {
    tab.addEventListener('click', () => activateCaseTab(idx, false));
    tab.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const dir = e.key === 'ArrowRight' ? 1 : -1;
        const next = (idx + dir + caseTabs.length) % caseTabs.length;
        activateCaseTab(next, true);
      }
    });
  });

  if (compareBox && compareRange) {
    const applyMix = (val) => {
      const v = Math.max(0, Math.min(100, Number(val)));
      compareRange.value = v;
      compareBox.style.setProperty('--mix', v);
      compareRange.style.setProperty('--fill', `${v}%`);

      let mode = 'split';
      let label = 'Comparando Antes vs. Después';
      if (v <= 25) {
        mode = 'before';
        label = 'Foco en el Antes · Operación manual sin IA';
      } else if (v >= 75) {
        mode = 'after';
        label = 'Foco en el Después · Equipo operando con IA';
      }
      compareBox.dataset.mode = mode;
      if (compareStatus) compareStatus.textContent = label;
      modeBtns.forEach((b) => {
        b.classList.toggle('is-active', b.dataset.compareMode === mode);
      });
    };

    const setMode = (mode) => {
      if (mode === 'before') applyMix(0);
      else if (mode === 'after') applyMix(100);
      else applyMix(50);
    };

    compareRange.addEventListener('input', () => applyMix(compareRange.value));
    modeBtns.forEach((btn) => {
      btn.addEventListener('click', () => setMode(btn.dataset.compareMode));
    });
    panels.forEach((panel) => {
      panel.addEventListener('click', () => {
        const targetMode = panel.dataset.panel;
        if (compareBox.dataset.mode === targetMode) setMode('split');
        else setMode(targetMode);
      });
    });
    if (swapBtn) {
      swapBtn.addEventListener('click', () => {
        const cur = compareBox.dataset.mode;
        if (cur === 'before') setMode('after');
        else if (cur === 'after') setMode('before');
        else setMode('after');
      });
    }
    $$('[data-mobile-to]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        setMode(btn.dataset.mobileTo);
      });
    });

    // Soporte swipe táctil izquierda / derecha en móvil sobre la tarjeta
    let touchStartX = 0;
    let touchStartY = 0;
    compareBox.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });
    compareBox.addEventListener('touchend', (e) => {
      if (!touchStartX || e.changedTouches.length !== 1) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        if (dx < 0) setMode('after');
        else setMode('before');
      }
      touchStartX = 0;
    }, { passive: true });

    // En celular arrancamos en modo interactivo de tarjeta con foco (After/Before con 1 toque o swipe)
    // y en computador arrancamos con las dos tarjetas cara a cara (split)
    applyMix(window.innerWidth <= 920 ? 0 : 50);
  }

  // =========================================================
  // 07 · FORMULARIO DE REGISTRO Y NOTIFICACIÓN TELEGRAM / N8N (RETO 4)
  // =========================================================
  const leadForm = $('#lead-form');
  const leadConf = $('#lead-confirmation');
  const leadProgramSelect = $('#lead-program');
  const leadNameInput = $('#lead-name');
  const leadEmailInput = $('#lead-email');
  const leadPhoneInput = $('#lead-phone');
  const globalError = $('#lead-form-global-error');
  const newLeadBtn = $('#lead-new-btn');
  const submitBtn = $('#lead-submit-btn');

  // Preseleccionar programa al hacer clic en cualquier botón "Inscríbete en X"
  $$('[data-select-program]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const prog = btn.dataset.selectProgram;
      if (leadProgramSelect && prog) {
        leadProgramSelect.value = prog;
        if (leadForm && leadConf && !leadConf.hidden) {
          leadConf.hidden = true;
          leadForm.hidden = false;
        }
        setTimeout(() => {
          if (leadNameInput) leadNameInput.focus();
        }, 350);
      }
    });
  });

  if (leadForm && window.AIAcademyStore) {
    const fieldMap = {
      name: { input: leadNameInput, err: $('#err-lead-name') },
      email: { input: leadEmailInput, err: $('#err-lead-email') },
      program: { input: leadProgramSelect, err: $('#err-lead-program') },
      phone: { input: leadPhoneInput, err: $('#err-lead-phone') }
    };

    const clearFieldErrors = () => {
      if (globalError) {
        globalError.hidden = true;
        globalError.textContent = '';
      }
      Object.values(fieldMap).forEach(({ input, err }) => {
        if (input) input.removeAttribute('aria-invalid');
        if (err) {
          err.hidden = true;
          err.textContent = '';
        }
      });
    };

    const showFieldErrors = (errors) => {
      let firstInvalid = null;
      Object.entries(errors).forEach(([key, msg]) => {
        const entry = fieldMap[key];
        if (!entry) return;
        if (entry.input) {
          entry.input.setAttribute('aria-invalid', 'true');
          if (!firstInvalid) firstInvalid = entry.input;
        }
        if (entry.err) {
          entry.err.textContent = msg;
          entry.err.hidden = false;
        }
      });
      if (globalError) {
        globalError.textContent = 'Revisa los campos marcados. No se generó ningún registro ni aviso por Telegram porque faltan datos obligatorios o tienen formato inválido.';
        globalError.hidden = false;
      }
      if (firstInvalid) firstInvalid.focus();
    };

    // Limpiar error individual cuando el usuario corrige el campo
    Object.entries(fieldMap).forEach(([key, { input, err }]) => {
      if (!input) return;
      input.addEventListener('input', () => {
        input.removeAttribute('aria-invalid');
        if (err) {
          err.hidden = true;
          err.textContent = '';
        }
      });
    });

    leadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearFieldErrors();

      const raw = {
        name: leadNameInput?.value || '',
        email: leadEmailInput?.value || '',
        program: leadProgramSelect?.value || '',
        phone: leadPhoneInput?.value || ''
      };

      const check = window.AIAcademyStore.validateLeadInput(raw);
      if (!check.valid) {
        showFieldErrors(check.errors);
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.querySelector('span').textContent = 'Guardando y notificando por Telegram...';
      }

      const result = await window.AIAcademyStore.createLead(raw);

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.querySelector('span').textContent = 'Enviar solicitud y notificar al equipo';
      }

      if (!result.ok) {
        showFieldErrors(result.errors || {});
        return;
      }

      const { lead, notification } = result;
      $('[data-conf-id]').textContent = lead.id;
      $('[data-conf-date]').textContent = window.AIAcademyStore.formatDateTime(lead.createdAt);
      $('[data-conf-name]').textContent = lead.name;
      $('[data-conf-email]').textContent = lead.email;
      $('[data-conf-program]').textContent = lead.program;
      $('[data-conf-phone]').textContent = lead.phone ? lead.phone : 'No proporcionado';
      $('[data-conf-tg-text]').innerHTML = window.AIAcademyStore.formatTelegramHtml
        ? window.AIAcademyStore.formatTelegramHtml(lead.telegramMessage)
        : lead.telegramMessage;

      const modeBadge = $('[data-conf-n8n-mode]');
      if (modeBadge) {
        modeBadge.textContent = notification.sentToRemote
          ? 'Enviado a Webhook n8n'
          : 'Aviso Telegram listo';
      }

      const adminLink = $('[data-conf-admin-link]');
      if (adminLink) {
        adminLink.href = `admin.html?id=${encodeURIComponent(lead.id)}`;
      }

      leadForm.reset();
      leadForm.hidden = true;
      leadConf.hidden = false;
      leadConf.focus();
    });

    if (newLeadBtn) {
      newLeadBtn.addEventListener('click', () => {
        clearFieldErrors();
        leadConf.hidden = true;
        leadForm.hidden = false;
        if (leadNameInput) leadNameInput.focus();
      });
    }
  }
})();
