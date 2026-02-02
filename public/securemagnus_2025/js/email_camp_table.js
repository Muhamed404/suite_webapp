// ===============================
// Get server data (passed from EJS)
// ===============================
const serverData = window.campaignsData || {};
const originalCampaigns = serverData.campaigns || [];
// console.log("Original Campaigns:", originalCampaigns);
// console.log("Server Data:", serverData);
// Transform server data for table display
const data = originalCampaigns.map(campaign => ({
  id: campaign.id,
  name: campaign.name,
  campaign_identifier: campaign.campaign_identifier,
  template_name: campaign.template_name,
  start_date: campaign.start_datetime ? campaign.start_datetime.split(' ')[0] : '',
  end_date: campaign.end_datetime ? campaign.end_datetime.split(' ')[0] : '',
  start_time: campaign.start_datetime ? campaign.start_datetime.split(' ')[1] + ' ' + campaign.start_datetime.split(' ')[2] : '',
  end_time: campaign.end_datetime ? campaign.end_datetime.split(' ')[1] + ' ' + campaign.end_datetime.split(' ')[2] : '',
  status: campaign.status,
  totalInvitees: campaign.totalInvitees,
  sentCount: campaign.sentCount || 0,
  unsentCount: (campaign.totalInvitees || 0) - (campaign.sentCount || 0),
  difficulty: campaign.difficulty,
  creation_date: new Date(campaign.creation_date).toLocaleDateString()
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
const tableBody   = document.getElementById("tableBody");
const statusTabs  = document.getElementById("statusTabs");
const pagination  = document.getElementById("pagination");
const searchInput = document.getElementById("searchInput");
const filterType  = document.getElementById("filterType");
const rowsSelect  = document.getElementById("rowsPerPage");

// ===============================
// Render status tabs (with counts) - Updated for campaign statuses
// ===============================
function renderTabs() {
  // Count how many items are in each status
  const counts = { All: data.length };
  ["draft", "scheduled", "inprogress", "completed"].forEach(st => {
    counts[st] = data.filter(d => d.status === st).length;
  });

  // Translation map
  const statusTranslations = {
    All: window.translations.filterAll,
    draft: window.translations.filterDraft,
    scheduled: window.translations.filterScheduled,
    inprogress: window.translations.InProgress,
    completed: window.translations.filterCompleted
  };

  // Generate buttons dynamically
  statusTabs.innerHTML = Object.entries(counts)
    .map(([status, count]) => {
      const isActive = currentTab === status;
      const displayName = statusTranslations[status] || status;

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
      d.name.toLowerCase().includes(query) ||
      d.template_name.toLowerCase().includes(query) ||
      d.status.toLowerCase().includes(query) ||
      d.campaign_identifier.toLowerCase().includes(query)
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
    if (campaign.status === "inprogress") statusClass = "px-4 py-1 text-sm text-blue-700 bg-blue-100 rounded-full";
    if (campaign.status === "completed") statusClass = "px-4 py-1 text-sm text-green-700 bg-green-100 rounded-full";

    // Action icons (view details, edit)
    const actionIcon = `
      <div class="flex gap-2">
        <button class="p-2 rounded-full hover:bg-blue-50" title="View Details" onclick="viewCampaign(${campaign.id})">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-blue-600 hover:text-blue-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>

      </div>
    `;

    return `
    <tr class="transition-colors border-t hover:bg-blue-50">
      <td class="px-6 py-6 whitespace-nowrap">
        <div class="text-sm font-medium text-gray-900">${campaign.name}</div>
        <div class="text-xs text-gray-500">#${campaign.campaign_identifier}</div>
      </td>
      <td class="px-6 py-6 whitespace-nowrap">${campaign.template_name}</td>
      <td class="px-6 py-6 whitespace-nowrap">
        <div class="text-sm text-gray-900">${campaign.start_date}</div>
        <div class="text-xs text-gray-500">${campaign.start_time}</div>
      </td>
      <td class="px-6 py-6 whitespace-nowrap">
        <div class="text-sm text-gray-900">${campaign.end_date}</div>
        <div class="text-xs text-gray-500">${campaign.end_time}</div>
      </td>
      <td class="px-6 py-6 whitespace-nowrap">
        <span class="${statusClass}">${campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}</span>
      </td>
      <td class="px-6 py-6 whitespace-nowrap">${campaign.totalInvitees}</td>
      <td class="px-6 py-6 whitespace-nowrap">${campaign.sentCount}</td>

      <td class="px-6 py-6 whitespace-nowrap">${campaign.unsentCount}</td>

      <td class="px-6 py-6 whitespace-nowrap">${actionIcon}</td>
    </tr>`;
  }).join("");

  // Update pagination
  renderPagination(filtered.length);
}

// ===============================
// Action functions
// ===============================
function viewCampaign(campaignId) {
  window.location.href = `/phm/campaign/email/details/${campaignId}`;
}

// function editCampaign(campaignId) {
//   window.location.href = `/phm/campaign/email/edit/${campaignId}`;
// }

// ===============================
// Render pagination buttons - Simplified with new styling
// ===============================
function renderPagination(total) {
  const serverPagination = window.campaignsData.pagination || {};
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
          ${window.translations.showingResults
            .replace('{start}', ((currentPageNum - 1) * pageSize) + 1)
            .replace('{end}', Math.min(currentPageNum * pageSize, totalCount))
            .replace('{total}', totalCount)}
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
          <div class="text-lg font-medium mb-2">No campaigns found</div>
          <p>Create your first email campaign to get started.</p>
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
