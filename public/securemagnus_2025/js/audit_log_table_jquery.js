// ===============================
// Get server data (passed from EJS)
// ===============================
const serverData = Array.isArray(window.auditData?.report.report) ? window.auditData.report.report : [];
const data = serverData.map(report => ({
  id: report.id,
  user: report.UserProfile.email,
  action: report.action,
  module: report.target_type,
  description: report.description,
  ip_address: report.ip_address,
  url_path: report.url_route,
  created_at: formatAuditDate(report.created_at),
}));

// ===============================
// State variables
// ===============================
let currentTab = "All";          // Current tab filter (All, Active, Scheduled, Completed, Draft)
let currentPage = 1;             // Current page for pagination
let rowsPerPage = 10;            // Rows per page (user can change)
let currentSort = { key: "", asc: true }; // Current sorting state

// ===============================
// DOM elements
// ===============================
const tableBody = document.getElementById("tableBody");
const statusTabs = document.getElementById("statusTabs");
const pagination = document.getElementById("pagination");
const searchInput = document.getElementById("searchInput");
const filterType = document.getElementById("filterType");
const rowsSelect = document.getElementById("rowsPerPage");

// ===============================
// Render status tabs (with counts) - Updated for campaign statuses
// ===============================
function renderTabs() {
  // Count how many items are in each status
  const counts = { All: data.length };
  ["active", "inprogress", "completed"].forEach(st => {
    counts[st] = data.filter(d => d.status === st).length;
  });

  // Generate buttons dynamically
  statusTabs.innerHTML = Object.entries(counts)
    .map(([status, count]) => {
      const isActive = currentTab === status;
      const displayName = status.charAt(0).toUpperCase() + status.slice(1);

      // If active
      if (isActive) {
        return `
          <button class="flex items-center gap-1 px-4 py-2 text-white transition-all duration-300 bg-gray-900 rounded-full filter-btn"
                  onclick="setTab('${status}')">
            ${displayName}
            <span class="number bg-gray-700 text-white text-xs px-2 py-0.5 rounded-full transition-all duration-300">
              ${count}
            </span>
          </button>`;
      }

      // If not active
      return `
        <button class="flex items-center gap-1 px-4 py-2 text-gray-600 transition-all duration-300 rounded-full filter-btn hover:text-black"
                onclick="setTab('${status}')">
          ${displayName}
          <span class="number text-green-500 bg-green-500/15 text-xs px-2 py-0.5 rounded-full transition-all duration-300">
            ${count}
          </span>
        </button>`;
    }).join("");
}

// ===============================
// Apply filters (tabs, search, dropdown) - Updated for campaigns
// ===============================
function getFilteredData() {
  let filtered = data;

  // 1. Tab filter (active, scheduled, completed, draft, All)
  if (currentTab !== "All") {
    filtered = filtered.filter(d => d.status === currentTab);
  }

  // 2. Search filter (searches in campaign name, template, status)
  const query = searchInput.value.toLowerCase();
  if (query) {
    filtered = filtered.filter(d =>
      d.action.toLowerCase().includes(query) ||
      d.module.toLowerCase().includes(query) ||
      d.user.toLowerCase().includes(query) ||
      d.ip_address.toLowerCase().includes(query)
    );
  }

  // 3. Dropdown filter (if you have a filter dropdown)
  if (filterType && filterType.value) {
    filtered = filtered.filter(d => d.difficulty === parseInt(filterType.value));
  }

  return filtered;
}

// ===============================
// Render table rows - Updated for campaigns
// ===============================
function renderTable() {
  const filtered = getFilteredData();

  // Pagination: calculate visible rows
  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  let pageData = filtered.slice(start, end);

  // Sort only the visible rows (not full dataset)
  if (currentSort.key) {
    pageData = pageData.sort((a, b) => {
      let valA = a[currentSort.key].toString().toLowerCase();
      let valB = b[currentSort.key].toString().toLowerCase();
      if (valA < valB) return currentSort.asc ? -1 : 1;
      if (valA > valB) return currentSort.asc ? 1 : -1;
      return 0;
    });
  }

  // Render campaign rows into table body
  tableBody.innerHTML = pageData.map(report => {
    let statusClass = "";
    // if (report.status === "active") statusClass = "px-4 py-1 text-sm text-blue-700 bg-blue-100 rounded-full";
    // if (report.status === "inprogress") statusClass = "px-4 py-1 text-sm text-yellow-700 bg-yellow-100 rounded-full";
    // if (report.status === "completed") statusClass = "px-4 py-1 text-sm text-green-700 bg-green-100 rounded-full";


    return `
    <tr class="transition-colors border-t hover:bg-blue-50">
      <td class="px-6 py-6 whitespace-nowrap">
        <div class="text-sm font-medium text-gray-900">${report.created_at}</div>
      </td>
      <td class="px-6 py-6 whitespace-nowrap">${report.user}</td>

      <td class="px-6 py-6 whitespace-nowrap">${report.action}</td>
      <td class="px-6 py-6 whitespace-nowrap">
        <div class="text-sm text-gray-900">${report.module}</div>
      </td>
      <td class="px-6 py-6 whitespace-nowrap">
        <div class="text-sm text-gray-900">${report.description}</div>
      </td>
      <td class="px-6 py-6 whitespace-nowrap">
        <div class="text-sm text-gray-900">${report.ip_address}</div>
      </td>

      <td class="px-6 py-6 whitespace-nowrap">
        <div class="text-sm text-gray-900">${report.url_path}</div>
      </td>
    </tr>`;
  }).join("");

  // Update pagination
  renderPagination(filtered.length);
}


// ===============================
// Render pagination buttons - Simplified with new styling
// ===============================
function renderPagination(total) {
  const serverPagination = window.auditData.pagination || {};
  const currentPageNum = serverPagination.currentPage || 1;
  const totalPages = serverPagination.totalPages || 1;
  const pageSize = serverPagination.pageSize || 10;
  const totalCount = serverPagination.totalCount || 0;

  if (totalPages <= 1) {
    pagination.innerHTML = "";
    return;
  }

  let paginationHTML = `
    <div class="flex items-center justify-between w-full">
      <div>
        <p class="text-sm text-gray-700">
          Showing ${((currentPageNum - 1) * pageSize) + 1}
          to ${Math.min(currentPageNum * pageSize, totalCount)}
          of ${totalCount} results
        </p>
      </div>
      <div class="flex space-x-2">
  `;

  // Generate page buttons using your styling
  for (let i = 1; i <= totalPages; i++) {
    const isActive = i === currentPageNum;
    paginationHTML += `
      <a href="?page=${i}&pageSize=${pageSize}" 
         class="px-3 py-1 rounded-full ${isActive ? 'bg-teal-50 text-[var(--teal)] border border-[var(--teal)]' : 'border text-gray-600 hover:bg-teal-50 hover:text-[var(--teal)] hover:border hover:border-[var(--teal)] duration-300'}">
        ${i}
      </a>
    `;
  }

  paginationHTML += `
      </div>
    </div>
  `;

  pagination.innerHTML = paginationHTML;
}

// ===============================
// Handlers (change tab, change page)
// ===============================
function setTab(tab) {
  currentTab = tab;
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
// Search input
if (searchInput) {
  searchInput.addEventListener("input", renderTable);
}

// Dropdown filter
if (filterType) {
  filterType.addEventListener("change", renderTable);
}

// Rows per page selector
if (rowsSelect) {
  rowsSelect.addEventListener("change", e => {
    rowsPerPage = parseInt(e.target.value);
    currentPage = 1;
    renderTable();
  });
}

// Sorting (click table headers with data-sort attribute)
document.querySelectorAll("th[data-sort]").forEach(th => {
  th.addEventListener("click", () => {
    const key = th.dataset.sort;

    // If clicking same column → toggle ASC/DESC
    // If new column → default to ASC
    currentSort.asc = currentSort.key === key ? !currentSort.asc : true;
    currentSort.key = key;

    renderTable();
  });
});

// ===============================
// Initialize table + tabs (only if data exists)
// ===============================
if (data.length > 0) {
  renderTabs();
  renderTable();
} else {
  // Handle empty state
  if (tableBody) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="px-6 py-12 text-center text-gray-500">
          <div class="text-lg font-medium mb-2">No Audit Logs found</div>
          <p>Create your first audit log to get started.</p>
        </td>
      </tr>
    `;
  }
  if (statusTabs) {
    statusTabs.innerHTML = `
      <button class="flex items-center gap-1 px-4 py-2 text-white bg-gray-900 rounded-full">
        All <span class="bg-gray-700 text-white text-xs px-2 py-0.5 rounded-full">0</span>
      </button>
    `;
  }
}

// ===============================
// Format audit date function
// ===============================
function formatAuditDate(dateStr) {
  const date = new Date(dateStr);
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'short' }); // "Dec"
  const year = date.getFullYear();
  const time = date.toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }); // "1:00 PM"
  return `${day}-${month}-${year} ${time}`;
}
