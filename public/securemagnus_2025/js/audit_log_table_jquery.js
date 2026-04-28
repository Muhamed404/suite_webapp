// ===============================
// Get server data (passed from EJS)
// ===============================
const serverData = Array.isArray(window['auditData']?.report) ? window['auditData'].report : [];
const data = serverData.map(report => ({
  id:          report.id,
  user:        report.UserProfile?.email || '—',
  action:      report.action || '—',
  module:      report.target_type || '—',
  description: report.description || '—',
  ip_address:  report.ip_address || '—',
  url_path:    report.url_route || '—',
  created_at:  report.created_at,
}));

// ===============================
// State
// ===============================
let currentTab    = 'All';
let currentPage   = 1;
let rowsPerPage   = Number(window['auditData']?.pagination?.pageSize) || 10;
let currentSort   = { key: '', asc: true };

// ===============================
// DOM
// ===============================
const tableBody  = document.getElementById('tableBody');
const statusTabs = document.getElementById('statusTabs');
const pagination = document.getElementById('pagination');
const searchInput = document.getElementById('searchInput');
const rowsSelect  = document.getElementById('rowsPerPage');

// ===============================
// Helpers
// ===============================
function formatAuditDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const day   = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleString('en-US', { month: 'short' });
  const year  = d.getFullYear();
  const time  = d.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return { date: `${day} ${month} ${year}`, time };
}

function actionPill(action) {
  const a = (action || '').toUpperCase();
  const map = {
    CREATE: 'bg-emerald-100 text-emerald-700',
    UPDATE: 'bg-blue-100 text-blue-700',
    DELETE: 'bg-red-100 text-red-700',
    LOGIN:  'bg-purple-100 text-purple-700',
    LOGOUT: 'bg-gray-100 text-gray-600',
    VIEW:   'bg-amber-100 text-amber-700',
  };
  const cls = map[a] || 'bg-gray-100 text-gray-600';
  return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}">${action}</span>`;
}

function modulePill(module) {
  if (!module || module === '—') return '<span class="text-gray-400">—</span>';
  return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-600">${module}</span>`;
}

function userAvatar(email) {
  const initials = email && email.includes('@')
    ? email.split('@')[0].slice(0, 2).toUpperCase()
    : '??';
  const colors = ['bg-teal-500','bg-blue-500','bg-purple-500','bg-rose-500','bg-amber-500'];
  const color  = colors[initials.charCodeAt(0) % colors.length];
  return `
    <div class="flex items-center gap-2.5 min-w-0">
      <div class="shrink-0 w-7 h-7 rounded-full ${color} flex items-center justify-center text-white text-xs font-semibold">${initials}</div>
      <span class="text-gray-700 text-sm truncate max-w-[160px]" title="${email}">${email}</span>
    </div>`;
}

function truncate(str, len) {
  if (!str || str === '—') return '<span class="text-gray-400">—</span>';
  return str.length > len
    ? `<span title="${str}" class="cursor-default">${str.slice(0, len)}…</span>`
    : str;
}

function renderDescription(str) {
  if (!str || str === '—') return '<span class="text-gray-400">—</span>';
  if (str.length <= 70) {
    return `<span class="text-sm text-gray-600 break-words">${str}</span>`;
  }

  return `
    <details class="group text-sm text-gray-600">
      <summary class="cursor-pointer list-none break-words text-gray-600 group-open:hidden">
        ${str.slice(0, 70)}…
        <span class="text-teal-600 text-xs ml-1">View</span>
      </summary>
      <div class="hidden group-open:block mt-1 break-words text-gray-700">
        <div>${str}</div>
        <button type="button"
          onclick="this.closest('details').open=false"
          class="mt-1 text-teal-600 text-xs hover:underline">
          Hide
        </button>
      </div>
    </details>`;
}

// ===============================
// Tabs — dynamic, based on unique action types
// ===============================
function renderTabs() {
  const allLabel = statusTabs?.dataset?.tabAll || 'All';
  const totalRecords = Number(window['auditData']?.pagination?.totalCount) || data.length;

  // Collect unique action types from data
  const actionTypes = [...new Set(data.map(d => d.action).filter(Boolean))].sort();
  const tabs = ['All', ...actionTypes];

  statusTabs.innerHTML = tabs.map(tab => {
    const count    = tab === 'All' ? totalRecords : data.filter(d => d.action === tab).length;
    const isActive = currentTab === tab;
    const label    = tab === 'All' ? allLabel : tab;

    if (isActive) {
      return `<button onclick="setTab('${tab}')"
        class="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-gray-900 rounded-full transition-all">
        ${label}
        <span class="bg-gray-700 text-white text-xs px-1.5 py-0.5 rounded-full">${count}</span>
      </button>`;
    }
    return `<button onclick="setTab('${tab}')"
      class="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 rounded-full transition-all">
      ${label}
      <span class="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">${count}</span>
    </button>`;
  }).join('');
}

// ===============================
// Filter
// ===============================
function getFilteredData() {
  let filtered = data;

  if (currentTab !== 'All') {
    filtered = filtered.filter(d => d.action === currentTab);
  }

  const query = (searchInput?.value || '').toLowerCase();
  if (query) {
    filtered = filtered.filter(d =>
      (d.action      || '').toLowerCase().includes(query) ||
      (d.module      || '').toLowerCase().includes(query) ||
      (d.user        || '').toLowerCase().includes(query) ||
      (d.ip_address  || '').toLowerCase().includes(query) ||
      (d.description || '').toLowerCase().includes(query)
    );
  }

  return filtered;
}

// ===============================
// Table rows
// ===============================
function renderTable() {
  const filtered = getFilteredData();
  const start    = (currentPage - 1) * rowsPerPage;
  let pageData   = filtered.slice(start, start + rowsPerPage);

  if (currentSort.key) {
    pageData = pageData.sort((a, b) => {
      const vA = (a[currentSort.key] || '').toString().toLowerCase();
      const vB = (b[currentSort.key] || '').toString().toLowerCase();
      if (vA < vB) return currentSort.asc ? -1 : 1;
      if (vA > vB) return currentSort.asc ? 1 : -1;
      return 0;
    });
  }

  if (pageData.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="px-6 py-16 text-center">
          <div class="flex flex-col items-center gap-3 text-gray-400">
            <svg class="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0121 9.414V19a2 2 0 01-2 2z"/>
            </svg>
            <p class="text-sm font-medium">${window.i18n?.Audit?.noLogs || 'No audit logs found'}</p>
          </div>
        </td>
      </tr>`;
    renderPagination(0);
    return;
  }

  tableBody.innerHTML = pageData.map(report => {
    const { date, time } = formatAuditDate(report.created_at);
    return `
    <tr class="hover:bg-gray-50 transition-colors duration-150">
      <td class="px-6 py-3.5 whitespace-nowrap">
        <div class="text-sm font-medium text-gray-800">${date}</div>
        <div class="text-xs text-gray-400">${time}</div>
      </td>
      <td class="px-6 py-3.5">${userAvatar(report.user)}</td>
      <td class="px-6 py-3.5 whitespace-nowrap">${actionPill(report.action)}</td>
      <td class="px-6 py-3.5 whitespace-nowrap">${modulePill(report.module)}</td>
      <td class="px-6 py-3.5 max-w-[220px]">
        ${renderDescription(report.description)}
      </td>
      <td class="px-6 py-3.5 whitespace-nowrap">
        <code class="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded">${report.ip_address}</code>
      </td>
      <td class="px-6 py-3.5 max-w-[180px]">
        <span class="text-xs text-gray-500 font-mono">${truncate(report.url_path, 40)}</span>
      </td>
    </tr>`;
  }).join('');

  renderPagination(filtered.length);
}

// ===============================
// Pagination
// ===============================
function renderPagination(total) {
  const hasLocalFilters = currentTab !== 'All' || !!(searchInput?.value || '').trim();

  if (hasLocalFilters) {
    const totalPages = Math.max(Math.ceil(total / rowsPerPage), 1);
    const from = total === 0 ? 0 : ((currentPage - 1) * rowsPerPage) + 1;
    const to = Math.min(currentPage * rowsPerPage, total);

    if (totalPages <= 1) {
      pagination.innerHTML = total > 0
        ? `<span class="text-xs text-gray-500">Showing ${from}–${to} of ${total}</span>`
        : '';
      return;
    }

    let pages = '';
    for (let i = 1; i <= totalPages; i++) {
      const active = i === currentPage;
      pages += `<button type="button" onclick="setPage(${i})"
        class="w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-colors
          ${active
            ? 'bg-teal-600 text-white'
            : 'text-gray-600 hover:bg-gray-100 border border-gray-200'}">
        ${i}
      </button>`;
    }

    pagination.innerHTML = `
      <span class="text-xs text-gray-500 mr-2">Showing ${from}–${to} of ${total}</span>
      ${currentPage > 1
        ? `<button type="button" onclick="setPage(${currentPage - 1})"
             class="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors text-xs">‹</button>`
        : ''}
      ${pages}
      ${currentPage < totalPages
        ? `<button type="button" onclick="setPage(${currentPage + 1})"
             class="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors text-xs">›</button>`
        : ''}`;

    return;
  }

  const serverPagination = window['auditData']?.pagination || {};
  const currentPageNum = serverPagination.currentPage || 1;
  const pageSize       = rowsPerPage || serverPagination.pageSize || 10;
  const totalCount     = serverPagination.totalCount  || total;
  const totalPages     = Math.max(Math.ceil(totalCount / pageSize), 1);

  if (totalPages <= 1) {
    pagination.innerHTML = totalCount > 0
      ? `<span class="text-xs text-gray-500">Showing ${totalCount} of ${totalCount}</span>`
      : '';
    return;
  }

  const from = ((currentPageNum - 1) * pageSize) + 1;
  const to   = Math.min(currentPageNum * pageSize, totalCount);

  let pages = '';
  for (let i = 1; i <= totalPages; i++) {
    const active = i === currentPageNum;
    pages += `<a href="?page=${i}&pageSize=${pageSize}"
      class="w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-colors
        ${active
          ? 'bg-teal-600 text-white'
          : 'text-gray-600 hover:bg-gray-100 border border-gray-200'}">
      ${i}
    </a>`;
  }

  pagination.innerHTML = `
    <span class="text-xs text-gray-500 mr-2">Showing ${from}–${to} of ${totalCount}</span>
    ${currentPageNum > 1
      ? `<a href="?page=${currentPageNum - 1}&pageSize=${pageSize}"
           class="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors text-xs">‹</a>`
      : ''}
    ${pages}
    ${currentPageNum < totalPages
      ? `<a href="?page=${currentPageNum + 1}&pageSize=${pageSize}"
           class="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors text-xs">›</a>`
      : ''}`;
}

// ===============================
// Handlers
// ===============================
function setTab(tab) {
  currentTab  = tab;
  currentPage = 1;
  renderTabs();
  renderTable();
}
function setPage(p) {
  currentPage = p;
  renderTable();
}

// ===============================
// Event listeners
// ===============================
if (searchInput) {
  searchInput.addEventListener('input', () => { currentPage = 1; renderTable(); });
}
if (rowsSelect) {
  rowsSelect.value = String(rowsPerPage);
  rowsSelect.addEventListener('change', e => {
    rowsPerPage = parseInt(e.target.value, 10);

    // In unfiltered view, data is server-paginated. Reload with selected page size.
    const hasLocalFilters = currentTab !== 'All' || !!(searchInput?.value || '').trim();
    if (!hasLocalFilters) {
      const url = new URL(window.location.href);
      url.searchParams.set('page', '1');
      url.searchParams.set('pageSize', String(rowsPerPage));
      window.location.href = url.toString();
      return;
    }

    currentPage = 1;
    renderTable();
  });
}
document.querySelectorAll('th[data-sort]').forEach(th => {
  th.style.cursor = 'pointer';
  th.addEventListener('click', () => {
    const key = th.dataset.sort;
    currentSort.asc = currentSort.key === key ? !currentSort.asc : true;
    currentSort.key = key;
    renderTable();
  });
});

// ===============================
// Init
// ===============================
renderTabs();
renderTable();
