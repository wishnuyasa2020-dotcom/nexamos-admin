/**
 * templates.js
 * Nexa OS — Command Centre
 * Halaman Template Monitor: statistik template cross-tenant (read-only)
 *
 * Bergantung pada: apiCall() dari inline script di index.html
 * Endpoint backend:
 *   GET /api/admin/templates/stats        → { total, approved, pending, rejected, local_only, tenants[] }
 *   GET /api/admin/templates/:tenantId    → { data: WaTemplate[] }
 */

const TemplateModule = (() => {
  let _initialized = false;

  // ── Fetch helpers (pakai apiCall global dari index.html) ──────────────────
  async function _fetchStats() {
    return apiCall('templates/stats');
  }

  async function _fetchByTenant(tenantId) {
    return apiCall('templates/' + encodeURIComponent(tenantId));
  }

  // ── Render Stats Cards ────────────────────────────────────────────────────
  function _renderStatCards(stats) {
    const container = document.getElementById('tpl-stat-cards');
    if (!container) return;

    const statusDefs = [
      { key: 'total',      label: 'Total Template', color: 'var(--blue)',   icon: '📋' },
      { key: 'approved',   label: 'Approved',        color: 'var(--green)',  icon: '✅' },
      { key: 'pending',    label: 'Pending',          color: 'var(--amber)', icon: '⏳' },
      { key: 'rejected',   label: 'Rejected',         color: 'var(--red)',   icon: '❌' },
      { key: 'local_only', label: 'Lokal Only',       color: 'var(--cyan)',  icon: '📂' },
    ];

    container.innerHTML = statusDefs.map(def => `
      <div style="
        background: var(--bg-3); border: 1px solid var(--border);
        border-radius: var(--radius-sm); padding: 20px 24px;
        display: flex; align-items: center; gap: 16px;
      ">
        <div style="font-size: 28px;">${def.icon}</div>
        <div>
          <div style="font-size: 1.8rem; font-weight: 800; color: ${def.color}; line-height: 1;">
            ${stats[def.key] ?? 0}
          </div>
          <div style="font-size: .75rem; color: var(--text-3); margin-top: 4px;">${def.label}</div>
        </div>
      </div>
    `).join('');
  }

  // ── Render Tenant Filter ──────────────────────────────────────────────────
  function _renderTenantFilter(tenants) {
    const sel = document.getElementById('tpl-tenant-filter');
    if (!sel) return;
    sel.innerHTML = `<option value="">Semua Tenant</option>` +
      tenants.map(t => `<option value="${t.tenantId}">${t.brandName} (${t.tenantId})</option>`).join('');
    sel.addEventListener('change', () => {
      _currentTenant = sel.value;
      loadTemplateTable(_currentTenant);
    });
  }

  // ── Render Template Table ─────────────────────────────────────────────────
  function _renderTable(rows, containerId = 'tpl-table-body') {
    const tbody = document.getElementById(containerId);
    if (!tbody) return;

    if (!rows || rows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-3); padding: 32px;">Tidak ada template ditemukan.</td></tr>`;
      return;
    }

    const STATUS_COLORS = {
      APPROVED:   'var(--green)',
      PENDING:    'var(--amber)',
      REJECTED:   'var(--red)',
      LOCAL_ONLY: 'var(--cyan)',
    };

    tbody.innerHTML = rows.map(t => {
      const status    = t.meta_status || t.status_meta || 'LOCAL_ONLY';
      const statusCol = STATUS_COLORS[status] || 'var(--text-3)';
      const isActive  = (t.status_crm || '').toLowerCase() === 'active';
      const date      = t.last_updated ? new Date(t.last_updated).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

      return `
        <tr style="border-bottom: 1px solid var(--border); transition: background .15s;"
            onmouseover="this.style.background='var(--bg-4)'" onmouseout="this.style.background=''"
        >
          <td style="padding: 12px 16px; font-size: .82rem; color: var(--text-2); font-family: 'JetBrains Mono', monospace;">
            ${t._tenantId || '—'}
          </td>
          <td style="padding: 12px 16px;">
            <div style="font-size: .88rem; font-weight: 600;">${t.nama_template || '—'}</div>
            <div style="font-size: .72rem; color: var(--text-3); font-family: 'JetBrains Mono', monospace; margin-top: 2px;">${t.template_name_api || '—'}</div>
          </td>
          <td style="padding: 12px 16px;">
            <span style="display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px;
              border-radius: 20px; font-size: .7rem; font-weight: 700; text-transform: uppercase;
              background: ${statusCol}15; color: ${statusCol}; border: 1px solid ${statusCol}40;">
              ${status === 'LOCAL_ONLY' ? '📂 Lokal' : status}
            </span>
          </td>
          <td style="padding: 12px 16px;">
            <span style="display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px;
              border-radius: 20px; font-size: .7rem; font-weight: 700; text-transform: uppercase;
              background: ${isActive ? 'var(--green-dim)' : 'var(--bg-4)'}; color: ${isActive ? 'var(--green)' : 'var(--text-3)'};
              border: 1px solid ${isActive ? 'var(--green)' : 'var(--border-h)'};">
              ${isActive ? '● Aktif' : '○ Nonaktif'}
            </span>
          </td>
          <td style="padding: 12px 16px; font-size: .8rem; color: var(--text-2);">${t.kategori || '—'}</td>
          <td style="padding: 12px 16px; font-size: .8rem; color: var(--text-2);">${t.pipeline || '—'}</td>
          <td style="padding: 12px 16px; font-size: .75rem; color: var(--text-3);">${date}</td>
        </tr>
      `;
    }).join('');
  }

  // ── Load Stats ────────────────────────────────────────────────────────────
  async function loadStats() {
    const el = document.getElementById('tpl-stat-cards');
    if (el) el.innerHTML = `<div style="color:var(--text-3); font-size:.85rem;">⏳ Memuat statistik...</div>`;

    try {
      const data = await _fetchStats();
      _allTenants = data.tenants || [];
      _renderStatCards(data);
      _renderTenantFilter(_allTenants);
    } catch (err) {
      if (el) el.innerHTML = `<div style="color:var(--red); font-size:.85rem;">❌ ${err.message}</div>`;
    }
  }

  // ── Load Template Table ───────────────────────────────────────────────────
  async function loadTemplateTable(tenantId = '') {
    const tbody = document.getElementById('tpl-table-body');
    if (tbody) tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-3); padding:24px;">⏳ Memuat data...</td></tr>`;

    try {
      const endpoint = tenantId
        ? `${NEXA_CONFIG.API_URL}/templates/${tenantId}`
        : `${NEXA_CONFIG.API_URL}/templates/stats`;

      const res = await nexaFetch(endpoint);
      if (!res.ok) throw new Error('Gagal memuat data template');
      const data = await res.json();

      // Endpoint stats mengembalikan {total, tenants:[{templates:[]}]}
      // Endpoint per-tenant mengembalikan {data:[{...templates}]}
      let rows = [];
      if (tenantId && data.data) {
        rows = data.data.map(t => ({ ...t, _tenantId: tenantId }));
      } else if (data.tenants) {
        data.tenants.forEach(tenant => {
          (tenant.templates || []).forEach(t => rows.push({ ...t, _tenantId: tenant.tenantId }));
        });
      }

      _renderTable(rows);

    } catch (err) {
      if (tbody) tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--red); padding:24px;">❌ ${err.message}</td></tr>`;
    }
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  async function init() {
    if (_initialized) return;
    _initialized = true;
    await Promise.all([loadStats(), loadTemplateTable()]);
  }

  return { init, loadStats, loadTemplateTable };
})();

// Expose global
window.TemplateModule = TemplateModule;
