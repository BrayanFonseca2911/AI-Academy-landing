/* =========================================================
   Campuslands AI Academy · Reto 4: Automatización y Seguimiento
   Capa unificada de persistencia, validación, auditoría y
   notificación vía Webhook n8n -> Telegram.
   - Sin credenciales quemadas en código fuente.
   - Sincronización en tiempo real entre Landing (index.html)
     y Panel Admin (admin.html) vía localStorage + BroadcastChannel.
   ========================================================= */

(function (global) {
  'use strict';

  const STORAGE_KEY = 'ai_academy_leads_v1';
  const CONFIG_KEY = 'ai_academy_n8n_config_v1';
  const SESSION_KEY = 'ai_academy_admin_session_v1';
  const CHANNEL_NAME = 'ai_academy_leads_sync';

  const VALID_STATES = ['Nuevo', 'Contactado', 'En seguimiento', 'Cerrado'];

  const VALID_PROGRAMS = [
    'Ignition (4 horas)',
    'Booster (8 horas)',
    'Liftoff (12 horas)',
    'Odyssey (Personalizado)',
    'Nebula (Pregrabado)'
  ];

  // Administradores de prueba (sin secretos reales expuestos)
  const DEMO_ADMINS = [
    {
      id: 'admin-andres',
      name: 'Andrés Cristancho',
      role: 'Coordinador & Community · AI Academy',
      email: 'andres@campuslands.com',
      accessCode: 'AI-2026'
    },
    {
      id: 'admin-mafe',
      name: 'Mafe Góngora',
      role: 'Líder Comercial · AI Academy',
      email: 'mafe@campuslands.com',
      accessCode: 'AI-2026'
    },
    {
      id: 'admin-santiago',
      name: 'Santiago Laguado',
      role: 'Trainer Líder · AI Academy',
      email: 'santiago@campuslands.com',
      accessCode: 'AI-2026'
    }
  ];

  const bc = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL_NAME) : null;

  function nowISO() {
    return new Date().toISOString();
  }

  function formatDateTime(iso) {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      return d.toLocaleString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (_) {
      return iso;
    }
  }

  function generateId() {
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    const ts = Date.now().toString(36).slice(-4).toUpperCase();
    return `AIA-${ts}-${rand}`;
  }

  // ---------- Validación estricta ----------
  function validateLeadInput(raw) {
    const errors = {};
    const name = String(raw?.name ?? '').trim();
    const email = String(raw?.email ?? '').trim();
    const program = String(raw?.program ?? '').trim();
    const phone = String(raw?.phone ?? '').trim();

    if (!name) {
      errors.name = 'El nombre es obligatorio.';
    } else if (name.length < 3) {
      errors.name = 'Ingresa un nombre válido (mínimo 3 caracteres).';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!email) {
      errors.email = 'El correo electrónico es obligatorio.';
    } else if (!emailRegex.test(email)) {
      errors.email = 'Ingresa un correo electrónico con formato válido (ej. nombre@empresa.com).';
    }

    if (!program) {
      errors.program = 'Selecciona un programa de interés.';
    }

    if (phone) {
      const cleanPhone = phone.replace(/[\s\-().+]/g, '');
      if (!/^\d{7,15}$/.test(cleanPhone)) {
        errors.phone = 'El teléfono es opcional, pero si lo ingresas debe tener entre 7 y 15 dígitos.';
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
      sanitized: {
        name,
        email: email.toLowerCase(),
        program,
        phone: phone || ''
      }
    };
  }

  // ---------- Lectura y escritura de registros ----------
  function getLeads() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return seedInitialLeads();
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : seedInitialLeads();
    } catch (_) {
      return [];
    }
  }

  function saveLeads(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    if (bc) bc.postMessage({ type: 'leads-updated', at: nowISO() });
  }

  function seedInitialLeads() {
    const t1 = new Date(Date.now() - 1000 * 60 * 85).toISOString();
    const t2 = new Date(Date.now() - 1000 * 60 * 40).toISOString();
    const initial = [
      {
        id: 'AIA-DEMO-01',
        name: 'Camila Mendoza (Ficticio Demo)',
        email: 'camila.mendoza@agroindustrial-santander.co',
        program: 'Booster (8 horas)',
        phone: '315 842 9910',
        status: 'En seguimiento',
        createdAt: t1,
        updatedAt: t2,
        telegramNotified: true,
        telegramMessage: buildTelegramText({
          id: 'AIA-DEMO-01',
          name: 'Camila Mendoza (Ficticio Demo)',
          email: 'camila.mendoza@agroindustrial-santander.co',
          program: 'Booster (8 horas)',
          phone: '315 842 9910',
          createdAt: t1
        }),
        notes: [
          {
            id: 'N-101',
            text: 'Llamada inicial completada. Buscan formar a 12 líderes de operaciones en Bucaramanga.',
            author: 'Andrés Cristancho (andres@campuslands.com)',
            at: t2
          }
        ],
        history: [
          {
            id: 'H-101',
            action: 'Registro creado desde la landing',
            detail: 'Estado inicial: Nuevo · Programa: Booster (8 horas)',
            author: 'Sistema Landing · AI Academy',
            at: t1
          },
          {
            id: 'H-102',
            action: 'Cambio de estado: Nuevo → Contactado',
            detail: 'Se estableció primer contacto por WhatsApp y correo.',
            author: 'Andrés Cristancho (andres@campuslands.com)',
            at: t2
          },
          {
            id: 'H-103',
            action: 'Nota agregada y estado: Contactado → En seguimiento',
            detail: 'Nota: «Llamada inicial completada. Buscan formar a 12 líderes de operaciones en Bucaramanga.»',
            author: 'Mafe Góngora (mafe@campuslands.com)',
            at: t2
          }
        ]
      }
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }

  function buildTelegramText(lead) {
    const phoneLine = lead.phone && lead.phone.trim()
      ? `📞 *Teléfono:* ${lead.phone.trim()}`
      : '📞 *Teléfono:* No proporcionado';

    return [
      '🚀 *Nuevo interesado · Campuslands AI Academy*',
      '',
      `🆔 *Folio:* ${lead.id}`,
      `👤 *Nombre:* ${lead.name}`,
      `✉️ *Correo:* ${lead.email}`,
      `🎯 *Programa:* ${lead.program}`,
      phoneLine,
      `📌 *Estado:* Nuevo`,
      `🕒 *Fecha:* ${formatDateTime(lead.createdAt)}`
    ].join('\n');
  }

  function formatTelegramHtml(str) {
    const escaped = String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
    return escaped
      .replace(/\*([^*\n]+)\*/g, '<strong>$1</strong>')
      .replace(/(📞\s*)(Teléfono:)(\s)/g, '$1<strong>$2</strong>$3');
  }

  // ---------- Configuración de integración n8n (fuera del código compartido) ----------
  function getIntegrationConfig() {
    try {
      const raw = localStorage.getItem(CONFIG_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return {
        n8nWebhookUrl: parsed.n8nWebhookUrl || ''
      };
    } catch (_) {
      return { n8nWebhookUrl: '' };
    }
  }

  function saveIntegrationConfig(cfg) {
    const clean = {
      n8nWebhookUrl: String(cfg?.n8nWebhookUrl ?? '').trim()
    };
    localStorage.setItem(CONFIG_KEY, JSON.stringify(clean));
    return clean;
  }

  // ---------- Envío del aviso a n8n -> Telegram ----------
  async function notifyN8nWebhook(lead) {
    const cfg = getIntegrationConfig();
    const payload = {
      event: 'lead.created',
      source: 'campuslands-ai-academy-landing',
      id: lead.id,
      nombre: lead.name,
      correo: lead.email,
      programa: lead.program,
      telefono: lead.phone || null,
      telefonoTexto: lead.phone ? lead.phone : 'No proporcionado',
      estado: lead.status,
      fecha: lead.createdAt,
      fechaLegible: formatDateTime(lead.createdAt),
      telegramPreview: lead.telegramMessage
    };

    if (!cfg.n8nWebhookUrl) {
      return {
        sentToRemote: false,
        mode: 'local-preview',
        message: 'Registro guardado y mensaje de Telegram generado. Configura tu URL de Webhook de n8n en el panel para disparar el flujo remoto.',
        payload
      };
    }

    try {
      const res = await fetch(cfg.n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return {
        sentToRemote: res.ok,
        status: res.status,
        mode: 'n8n-webhook',
        message: res.ok
          ? 'Webhook de n8n notificado correctamente → Aviso enviado a Telegram.'
          : `El Webhook de n8n respondió con estado HTTP ${res.status}.`,
        payload
      };
    } catch (err) {
      return {
        sentToRemote: false,
        mode: 'n8n-error',
        message: `El registro se guardó, pero no se pudo contactar el webhook (${err.message}). Se conserva el aviso en el historial.`,
        payload
      };
    }
  }

  // ---------- Crear un nuevo registro desde la landing ----------
  async function createLead(rawInput) {
    const check = validateLeadInput(rawInput);
    if (!check.valid) {
      return {
        ok: false,
        errors: check.errors
      };
    }

    const createdAt = nowISO();
    const id = generateId();
    const { name, email, program, phone } = check.sanitized;

    const newLead = {
      id,
      name,
      email,
      program,
      phone,
      status: 'Nuevo',
      createdAt,
      updatedAt: createdAt,
      telegramNotified: true,
      telegramMessage: '',
      notes: [],
      history: [
        {
          id: `H-${Date.now()}`,
          action: 'Registro creado con estado Nuevo',
          detail: `Nombre: ${name} · Correo: ${email} · Programa: ${program}${phone ? ` · Tel: ${phone}` : ' · Tel: No proporcionado'}`,
          author: 'Visitante · Formulario Landing',
          at: createdAt
        }
      ]
    };

    newLead.telegramMessage = buildTelegramText(newLead);

    const notifyResult = await notifyN8nWebhook(newLead);
    newLead.history.push({
      id: `H-${Date.now() + 1}`,
      action: notifyResult.sentToRemote
        ? 'Notificación enviada a Telegram vía n8n'
        : 'Aviso para Telegram preparado (n8n)',
      detail: notifyResult.message,
      author: 'Automatización n8n · Telegram Bot',
      at: nowISO()
    });

    const list = getLeads();
    list.unshift(newLead);
    saveLeads(list);

    return {
      ok: true,
      lead: newLead,
      notification: notifyResult
    };
  }

  // ---------- Actualizar estado y/o añadir nota desde el Panel Admin ----------
  function updateLeadFromAdmin({ id, newStatus, noteText, admin }) {
    const list = getLeads();
    const idx = list.findIndex((item) => item.id === id);
    if (idx === -1) {
      return { ok: false, error: 'No se encontró el registro solicitado.' };
    }

    const lead = list[idx];
    const actorName = admin?.name
      ? `${admin.name} (${admin.email})`
      : 'Administrador · AI Academy';
    const timestamp = nowISO();
    const cleanNote = String(noteText ?? '').trim();
    const prevStatus = lead.status;
    const statusChanged = newStatus && VALID_STATES.includes(newStatus) && newStatus !== prevStatus;

    if (!statusChanged && !cleanNote) {
      return {
        ok: false,
        error: 'Selecciona un nuevo estado o escribe una nota antes de guardar.'
      };
    }

    if (statusChanged) {
      lead.status = newStatus;
    }

    if (cleanNote) {
      lead.notes.unshift({
        id: `N-${Date.now()}`,
        text: cleanNote,
        author: actorName,
        at: timestamp,
        statusAtMoment: lead.status
      });
    }

    // Construir entrada clara en el historial: qué cambió, quién lo hizo y cuándo
    let actionTitle = '';
    let actionDetail = '';

    if (statusChanged && cleanNote) {
      actionTitle = `Estado cambiado: ${prevStatus} → ${newStatus} + Nota añadida`;
      actionDetail = `Nota: «${cleanNote}»`;
    } else if (statusChanged) {
      actionTitle = `Estado cambiado: ${prevStatus} → ${newStatus}`;
      actionDetail = `Actualización de estado administrativo a «${newStatus}».`;
    } else {
      actionTitle = `Nota de seguimiento añadida (Estado: ${lead.status})`;
      actionDetail = `Nota: «${cleanNote}»`;
    }

    lead.history.unshift({
      id: `H-${Date.now()}`,
      action: actionTitle,
      detail: actionDetail,
      author: actorName,
      at: timestamp
    });

    lead.updatedAt = timestamp;
    list[idx] = lead;
    saveLeads(list);

    return {
      ok: true,
      lead
    };
  }

  // ---------- Sesión de Administrador ----------
  function getAdminSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function loginAdmin(email, accessCode) {
    const cleanEmail = String(email ?? '').trim().toLowerCase();
    const cleanCode = String(accessCode ?? '').trim();
    const found = DEMO_ADMINS.find(
      (a) => a.email.toLowerCase() === cleanEmail && a.accessCode === cleanCode
    );
    if (!found) {
      return {
        ok: false,
        error: 'Credenciales inválidas. Usa una de las cuentas de administrador de prueba (código: AI-2026).'
      };
    }
    const session = {
      id: found.id,
      name: found.name,
      role: found.role,
      email: found.email,
      loggedInAt: nowISO()
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { ok: true, session };
  }

  function logoutAdmin() {
    localStorage.removeItem(SESSION_KEY);
  }

  function onSync(callback) {
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY) callback();
    });
    if (bc) {
      bc.addEventListener('message', (e) => {
        if (e.data?.type === 'leads-updated') callback();
      });
    }
  }

  global.AIAcademyStore = {
    VALID_STATES,
    VALID_PROGRAMS,
    DEMO_ADMINS,
    formatDateTime,
    formatTelegramHtml,
    validateLeadInput,
    getLeads,
    createLead,
    updateLeadFromAdmin,
    getIntegrationConfig,
    saveIntegrationConfig,
    getAdminSession,
    loginAdmin,
    logoutAdmin,
    onSync
  };
})(window);
