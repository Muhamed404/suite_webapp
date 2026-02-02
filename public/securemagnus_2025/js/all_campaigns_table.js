// ===============================
// Get server data (passed from EJS)
// ===============================
const serverData = window.allCampaignsData || {};
const originalCampaigns = serverData.campaigns || [];
const typeOptions = serverData.typeOptions || [];
const translations = serverData.translations || {};

// Transform server data for table display
const data = originalCampaigns.map(campaign => ({
  id: campaign.id,
  campaignIdentifier: campaign.campaignIdentifier,
  name: campaign.name,
  templateName: campaign.templateName,
  startDate: campaign.startDate,
  endDate: campaign.endDate,
  status: campaign.status,
  totalTargets: campaign.totalTargets,
  typeKey: campaign.typeKey,
  typeLabel: campaign.typeLabel,
  detailPath: campaign.detailPath
}));

// ===============================
// State variables
// ===============================
let currentTab = "All";          // Current tab filter (All, active, scheduled, completed, draft)
let currentPage = 1;             // Current page for pagination
let rowsPerPage = 10;            // Rows per page (user can change)
let currentSort = { key: "", asc: true }; // Current sorting state
let currentTypeFilter = "all";   // Current type filter

// ===============================
// DOM elements
// ===============================
const tableBody   = document.getElementById("tableBody");
const statusTabs  = document.getElementById("statusTabs");
const pagination  = document.getElementById("pagination");
const searchInput = document.getElementById("searchInput");
const filterType  = document.getElementById("filterType");
const rowsSelect  = document.getElementById("rowsPerPage");

// ===============================
// Get display name for status
// ===============================
function getStatusDisplayName(status) {
  const key = `filter${status.charAt(0).toUpperCase() + status.slice(1)}`;
  return translations[key] || status;
}

// ===============================
// Render status tabs (with counts)
// ===============================
function renderTabs() {
  // Count how many items are in each status
  const counts = { All: data.length };
  ["active", "scheduled", "completed", "draft"].forEach(st => {
    counts[st] = data.filter(d => d.status === st).length;
  });

  // Generate buttons dynamically
  statusTabs.innerHTML = Object.entries(counts)
    .map(([status, count]) => {
      const isActive = currentTab === status;
      const displayName = getStatusDisplayName(status);

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
// Apply filters (tabs, search, type dropdown)
// ===============================
function getFilteredData() {
  let filtered = data;

  // 1. Tab filter (active, scheduled, completed, draft, All)
  if (currentTab !== "All") {
    filtered = filtered.filter(d => d.status === currentTab);
  }

  // 2. Search filter (searches in campaign name, template, type, identifier)
  const query = searchInput.value.toLowerCase();
  if (query) {
    filtered = filtered.filter(d =>
      d.name.toLowerCase().includes(query) ||
      d.templateName.toLowerCase().includes(query) ||
      d.typeLabel.toLowerCase().includes(query) ||
      d.campaignIdentifier.toLowerCase().includes(query) ||
      d.status.toLowerCase().includes(query)
    );
  }

  // 3. Type filter dropdown
  if (currentTypeFilter !== "all") {
    filtered = filtered.filter(d => d.typeKey === currentTypeFilter);
  }

  return filtered;
}

// ===============================
// Render table rows
// ===============================
function renderTable() {
  const filtered = getFilteredData();

  // Pagination: calculate visible rows
  const start = (currentPage - 1) * rowsPerPage;
  const end   = start + rowsPerPage;
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
  tableBody.innerHTML = pageData.map(campaign => {
    let statusClass = "";
    if (campaign.status === "active") statusClass = "px-4 py-1 text-sm text-blue-700 bg-blue-100 rounded-full";
    if (campaign.status === "scheduled") statusClass = "px-4 py-1 text-sm text-yellow-700 bg-yellow-100 rounded-full";
    if (campaign.status === "completed") statusClass = "px-4 py-1 text-sm text-green-700 bg-green-100 rounded-full";
    if (campaign.status === "draft") statusClass = "px-4 py-1 text-sm text-gray-700 bg-gray-100 rounded-full";

    // Action button (view details)
    const actionButton = `
      <a href="${campaign.detailPath}"
         class="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300">
        ${window.allCampaignsData.translations.viewDetails}
      </a>
    `;

    return `
    <tr class="transition-colors border-t hover:bg-blue-50">
      <td class="px-6 py-6 whitespace-nowrap">
        <div class="text-sm font-medium text-gray-900">${campaign.name}</div>
        <div class="text-xs text-gray-500">#${campaign.campaignIdentifier}</div>
      </td>
      <td class="px-6 py-6 whitespace-nowrap">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          ${campaign.typeLabel}
        </span>
      </td>
      <td class="px-6 py-6 whitespace-nowrap text-sm text-gray-900">${campaign.templateName}</td>
      <td class="px-6 py-6 whitespace-nowrap text-sm text-gray-900">${campaign.startDate || 'N/A'}</td>
      <td class="px-6 py-6 whitespace-nowrap text-sm text-gray-900">${campaign.endDate || 'N/A'}</td>
      <td class="px-6 py-6 whitespace-nowrap">
        <span class="${statusClass}">${campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}</span>
      </td>
      <td class="px-6 py-6 whitespace-nowrap text-sm text-gray-900">${campaign.totalTargets || 0}</td>
      <td class="px-6 py-6 whitespace-nowrap text-right">${actionButton}</td>
    </tr>`;
  }).join("");

  // Update pagination
  renderPagination(filtered.length);

  // Hide pagination controls if no data
  const paginationControls = document.querySelector('.flex.flex-col.gap-3.mt-4');
  if (paginationControls) {
    paginationControls.style.display = filtered.length === 0 ? 'none' : 'flex';
  }
}

// ===============================
// Render pagination buttons
// ===============================
function renderPagination(total) {
  const totalPages = Math.ceil(total / rowsPerPage);

  if (totalPages <= 1) {
    pagination.innerHTML = "";
    return;
  }

  let paginationHTML = `
    <div class="flex items-center justify-between w-full">
      <div>
        <p class="text-sm text-gray-700 mr-2 ${document.dir === 'rtl' ? 'ml-2' : ''}">
          ${translations.showingResults
            .replace('{start}', ((currentPage - 1) * rowsPerPage) + 1)
            .replace('{end}', Math.min(currentPage * rowsPerPage, total))
            .replace('{total}', total)}
        </p>
      </div>
      <div class="flex space-x-2">
  `;

  // Previous button
  if (currentPage > 1) {
    paginationHTML += `
      <button onclick="setPage(${currentPage - 1})"
         class="px-3 py-1 rounded-full border text-gray-600 hover:bg-teal-50 hover:text-[var(--teal)] hover:border hover:border-[var(--teal)] duration-300">
        ‹
      </button>
    `;
  }

  // Page numbers
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);

  for (let i = startPage; i <= endPage; i++) {
    const isActive = i === currentPage;
    paginationHTML += `
      <button onclick="setPage(${i})"
         class="px-3 py-1 rounded-full ${isActive ? 'bg-teal-50 text-[var(--teal)] border border-[var(--teal)]' : 'border text-gray-600 hover:bg-teal-50 hover:text-[var(--teal)] hover:border hover:border-[var(--teal)] duration-300'}">
        ${i}
      </button>
    `;
  }

  // Next button
  if (currentPage < totalPages) {
    paginationHTML += `
      <button onclick="setPage(${currentPage + 1})"
         class="px-3 py-1 rounded-full border text-gray-600 hover:bg-teal-50 hover:text-[var(--teal)] hover:border hover:border-[var(--teal)] duration-300">
        ›
      </button>
    `;
  }

  paginationHTML += `
      </div>
    </div>
  `;

  pagination.innerHTML = paginationHTML;
}

// ===============================
// Handlers (change tab, change page, change type filter)
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

function setTypeFilter(type) {
  currentTypeFilter = type;
  currentPage = 1;
  renderTable();
}

// ===============================
// Event listeners
// ===============================
if (searchInput) {
  searchInput.addEventListener("input", () => {
    currentPage = 1;
    renderTable();
  });
}

if (filterType) {
  filterType.addEventListener("change", (e) => {
    setTypeFilter(e.target.value);
  });
}

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
        <td colspan="8" class="px-6 py-12 text-center text-gray-500">
          <div class="text-lg font-medium mb-2">${translations.noCampaignsFound || 'No campaigns found'}</div>
          <p>${translations.createFirstCampaign || 'Create your first campaign to get started.'}</p>
        </td>
      </tr>
    `;
  }
  if (statusTabs) {
    statusTabs.innerHTML = `
      <button class="flex items-center gap-1 px-4 py-2 text-white bg-gray-900 rounded-full">
        ${translations.filterAll || 'All'} <span class="bg-gray-700 text-white text-xs px-2 py-0.5 rounded-full">0</span>
      </button>
    `;
  }
  // Hide pagination controls when no data
  const paginationControls = document.querySelector('.flex.flex-col.gap-3.mt-4');
  if (paginationControls) {
    paginationControls.style.display = 'none';
  }
}