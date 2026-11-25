/* =========================================================
   Campuslands AI Academy · Panel de Administración (Reto 4)
   - Login de administrador y cambio rápido entre administradores
     para demostrar continuidad del seguimiento.
   - Consulta de registros, cambio de estado (Nuevo, Contactado,
     En seguimiento, Cerrado), adición de notas e historial con
     qué cambió, quién lo hizo y cuándo.
   ========================================================= */

(() => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const store = window.AIAcademyStore;
  if (!store) return;

  const loginView = $('#admin-login-view');
  const dashView = $('#admin-dashboard-view');
  const loginForm = $('#admin-login-form');
  const loginError = $('#login-error');
  const emailInput = $('#admin-email');
  const codeInput = $('#admin-code');
  const adminSelect = $('#active-admin-select');
  const logoutBtn = $('#admin-logout-btn');

  const n8nForm = $('#n8n-config-form');
  const n8nUrlInput = $('#n8n-webhook-url');
  const n8nSaveMsg = $('#n8n-save-msg');

  const searchInput = $('#lead-search');
  const statusBtns = $$('[data-status-filter]');
  const leadsListEl = $('#leads-items');
  const detailPanel = $('#lead-detail-panel');

  let activeStatusFilter = 'ALL';
  let selectedLeadId = new URLSearchParams(window.location.search).get('id') || null;

  function statusBadgeClass(status) {
    switch (status) {
      case 'Nuevo': return 'status-pill status-nuevo';
      case 'Contactado': return 'status-pill status-contactado';
      case 'En seguimiento': return 'status-pill status-seguimiento';
      case 'Cerrado': return 'status-pill status-cerrado';
      default: return 'status-pill';
    }
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ---------- Autenticación ----------
  function populateAdminSwitcher(currentSession) {
    if (!adminSelect) return;
    adminSelect.innerHTML = store.DEMO_ADMINS.map((a) => `
      <option value="${escapeHtml(a.email)}" ${a.email === currentSession?.email ? 'selected' : ''}>
        ${escapeHtml(a.name)} (${escapeHtml(a.email)})
      </option>
    `).join('');
  }

  function checkSession() {
    const session = store.getAdminSession();
    if (!session) {
      loginView.hidden = false;
      dashView.hidden = true;
      return;
    }
    loginView.hidden = true;
    dashView.hidden = false;
    populateAdminSwitcher(session);
    const cfg = store.getIntegrationConfig();
    if (n8nUrlInput) n8nUrlInput.value = cfg.n8nWebhookUrl || '';
    renderAll();
  }

  const quickBtns = $$('[data-quick-email]');
  quickBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      emailInput.value = btn.dataset.quickEmail;
      codeInput.value = btn.dataset.quickCode;
      if (loginError) loginError.hidden = true;
      quickBtns.forEach((b) => {
        const isSel = b === btn;
        b.classList.toggle('is-selected', isSel);
        const tag = b.querySelector('.quick-admin-tag');
        if (tag) tag.textContent = isSel ? '✓ Autocompletado' : 'Usar cuenta';
      });
      const submitBtn = loginForm?.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.focus();
    });
  });

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      loginError.hidden = true;
      const res = store.loginAdmin(emailInput.value, codeInput.value);
      if (!res.ok) {
        loginError.textContent = res.error;
        loginError.hidden = false;
        return;
      }
      checkSession();
    });
  }

  if (adminSelect) {
    adminSelect.addEventListener('change', () => {
      store.loginAdmin(adminSelect.value, 'AI-2026');
      renderDetail();
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      store.logoutAdmin();
      checkSession();
    });
  }

  // ---------- Configuración Webhook n8n ----------
  if (n8nForm) {
    n8nForm.addEventListener('submit', (e) => {
      e.preventDefault();
      store.saveIntegrationConfig({ n8nWebhookUrl: n8nUrlInput.value });
      if (n8nSaveMsg) {
        n8nSaveMsg.hidden = false;
        setTimeout(() => { n8nSaveMsg.hidden = true; }, 2500);
      }
    });
  }

  // ---------- KPIs y Listado ----------
  function renderKPIs(allLeads) {
    const counts = { total: allLeads.length, 'Nuevo': 0, 'Contactado': 0, 'En seguimiento': 0, 'Cerrado': 0 };
    allLeads.forEach((l) => {
      if (counts[l.status] !== undefined) counts[l.status]++;
    });
    Object.entries(counts).forEach(([k, v]) => {
      const el = $(`[data-kpi="${k}"]`);
      if (el) el.textContent = v;
    });
  }

  function getFilteredLeads(allLeads) {
    const q = (searchInput?.value || '').trim().toLowerCase();
    return allLeads.filter((l) => {
      const matchStatus = activeStatusFilter === 'ALL' || l.status === activeStatusFilter;
      const matchQuery = !q || [l.id, l.name, l.email, l.program, l.phone].some(
        (val) => String(val || '').toLowerCase().includes(q)
      );
      return matchStatus && matchQuery;
    });
  }

  function renderList(allLeads) {
    const filtered = getFilteredLeads(allLeads);
    if (!selectedLeadId && filtered.length > 0) {
      selectedLeadId = filtered[0].id;
    } else if (selectedLeadId && !allLeads.some((l) => l.id === selectedLeadId)) {
      selectedLeadId = filtered[0]?.id || null;
    }

    if (filtered.length === 0) {
      leadsListEl.innerHTML = `<p style="color:var(--muted);font-size:.88rem;padding:12px;">No hay registros que coincidan con el filtro actual.</p>`;
      return;
    }

    leadsListEl.innerHTML = filtered.map((l) => `
      <button type="button" role="listitem" class="lead-item ${l.id === selectedLeadId ? 'is-selected' : ''}" data-lead-id="${escapeHtml(l.id)}">
        <div class="lead-item-top">
          <span class="lead-item-id">${escapeHtml(l.id)}</span>
          <span class="${statusBadgeClass(l.status)}">${escapeHtml(l.status)}</span>
        </div>
        <div class="lead-item-name">${escapeHtml(l.name)}</div>
        <div class="lead-item-meta">${escapeHtml(l.program)} · ${escapeHtml(l.email)}</div>
        <div class="lead-item-date">Registrado: ${escapeHtml(store.formatDateTime(l.createdAt))} · ${l.notes.length} nota(s)</div>
      </button>
    `).join('');

    $$('[data-lead-id]', leadsListEl).forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedLeadId = btn.dataset.leadId;
        renderAll();
        if (window.innerWidth <= 1080 && detailPanel) {
          detailPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  // ---------- Detalle del Registro, Cambio de Estado, Notas e Historial ----------
  function renderDetail(feedbackMsg = '') {
    const allLeads = store.getLeads();
    const lead = allLeads.find((l) => l.id === selectedLeadId);
    const admin = store.getAdminSession();

    if (!lead) {
      detailPanel.innerHTML = `<p style="color:var(--muted);">Selecciona un registro de la lista para consultar y actualizar su seguimiento.</p>`;
      return;
    }

    detailPanel.innerHTML = `
      <div class="detail-header">
        <div>
          <span style="font-size:.78rem;font-weight:700;color:var(--soft);letter-spacing:.1em;">FOLIO ${escapeHtml(lead.id)}</span>
          <h2>${escapeHtml(lead.name)}</h2>
          <p style="font-size:.84rem;color:var(--muted);">Registrado el ${escapeHtml(store.formatDateTime(lead.createdAt))} · Última actualización: ${escapeHtml(store.formatDateTime(lead.updatedAt))}</p>
        </div>
        <span class="${statusBadgeClass(lead.status)}" style="font-size:.85rem;padding:7px 16px;">Estado actual: ${escapeHtml(lead.status)}</span>
      </div>

      <dl class="detail-info-grid">
        <div><dt>Correo electrónico</dt><dd>${escapeHtml(lead.email)}</dd></div>
        <div><dt>Programa de interés</dt><dd>${escapeHtml(lead.program)}</dd></div>
        <div><dt>Teléfono / WhatsApp</dt><dd>${lead.phone ? escapeHtml(lead.phone) : '<span style="color:var(--muted)">No proporcionado</span>'}</dd></div>
        <div><dt>Notificación Telegram</dt><dd style="color:var(--soft);">✓ Aviso generado</dd></div>
      </dl>

      <form id="lead-update-form" class="action-box">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
          <h3>Actualizar seguimiento del interesado</h3>
          <span style="font-size:.78rem;color:var(--soft);">Actuando como: <strong>${escapeHtml(admin?.name || 'Admin')}</strong></span>
        </div>

        ${feedbackMsg ? `<div class="action-feedback" role="status">${escapeHtml(feedbackMsg)}</div>` : ''}
        <div class="form-alert form-alert-error" id="update-error" role="alert" hidden></div>

        <div class="action-form-row">
          <div class="form-field">
            <label for="update-status">Estado del registro</label>
            <select id="update-status" name="status">
              ${store.VALID_STATES.map((st) => `
                <option value="${escapeHtml(st)}" ${st === lead.status ? 'selected' : ''}>${escapeHtml(st)}</option>
              `).join('')}
            </select>
          </div>
          <div class="form-field">
            <label for="update-note">Añadir nota de seguimiento</label>
            <textarea id="update-note" rows="2" placeholder="Escribe qué se habló con la persona, acuerdos o próximo paso..."></textarea>
          </div>
        </div>

        <div class="action-submit-row">
          <button type="submit" class="btn btn-primary btn-sm">Guardar estado y nota en el historial</button>
        </div>
      </form>

      <div class="sub-grid">
        <section class="sub-panel" aria-label="Notas y mensaje de Telegram">
          <h3>Notas registradas <span>(${lead.notes.length})</span></h3>
          ${lead.notes.length === 0
            ? `<p style="font-size:.84rem;color:var(--muted);">Aún no hay notas manuales en este registro.</p>`
            : `<div class="timeline">
                ${lead.notes.map((n) => `
                  <article class="timeline-item">
                    <div class="timeline-detail" style="color:var(--white);font-weight:500;">«${escapeHtml(n.text)}»</div>
                    <div class="timeline-meta">
                      <span>Por: ${escapeHtml(n.author)}</span>
                      <time>${escapeHtml(store.formatDateTime(n.at))}</time>
                    </div>
                  </article>
                `).join('')}
              </div>`
          }

          <div class="telegram-preview-box" style="margin-top:8px;">
            <div class="tg-head">
              <span class="tg-dot"></span>
              <strong>Mensaje enviado a Telegram (n8n)</strong>
            </div>
            <pre class="tg-body">${store.formatTelegramHtml ? store.formatTelegramHtml(lead.telegramMessage) : escapeHtml(lead.telegramMessage)}</pre>
          </div>
        </section>

        <section class="sub-panel" aria-label="Historial de auditoría">
          <h3>Historial de cambios <span>(${lead.history.length} eventos)</span></h3>
          <p style="font-size:.76rem;color:var(--muted);margin-top:-6px;">Muestra qué cambió, quién lo hizo y cuándo.</p>
          <div class="timeline">
            ${lead.history.map((h) => `
              <article class="timeline-item">
                <div class="timeline-action">${escapeHtml(h.action)}</div>
                <div class="timeline-detail">${escapeHtml(h.detail)}</div>
                <div class="timeline-meta">
                  <span>👤 ${escapeHtml(h.author)}</span>
                  <time>🕒 ${escapeHtml(store.formatDateTime(h.at))}</time>
                </div>
              </article>
            `).join('')}
          </div>
        </section>
      </div>
    `;

    const updateForm = $('#lead-update-form', detailPanel);
    const statusSel = $('#update-status', detailPanel);
    const noteArea = $('#update-note', detailPanel);
    const updateErr = $('#update-error', detailPanel);

    if (updateForm) {
      updateForm.addEventListener('submit', (e) => {
        e.preventDefault();
        updateErr.hidden = true;
        const currentAdmin = store.getAdminSession();
        const res = store.updateLeadFromAdmin({
          id: lead.id,
          newStatus: statusSel.value,
          noteText: noteArea.value,
          admin: currentAdmin
        });
        if (!res.ok) {
          updateErr.textContent = res.error;
          updateErr.hidden = false;
          return;
        }
        renderAll('✓ Seguimiento guardado: se actualizaron el estado, la nota y el historial.');
      });
    }
  }

  function renderAll(feedbackMsg = '') {
    const allLeads = store.getLeads();
    renderKPIs(allLeads);
    renderList(allLeads);
    renderDetail(feedbackMsg);
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => renderAll());
  }

  statusBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      activeStatusFilter = btn.dataset.statusFilter;
      statusBtns.forEach((b) => b.classList.toggle('is-active', b === btn));
      renderAll();
    });
  });

  store.onSync(() => renderAll());
  checkSession();
})();
