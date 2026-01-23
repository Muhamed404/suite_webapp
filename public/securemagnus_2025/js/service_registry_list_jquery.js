// ===============================
// Delete confirmation and request
// ===============================
let deleteServiceInfo = { serviceId: null, registryId: null };
window.confirmDeleteService = function(serviceId, registryId) {
  deleteServiceInfo = { serviceId, registryId };
  // Update modal text for delete
  const modal = document.getElementById('deleteConfirmModal');
  if (modal) {
    modal.querySelector('h2').textContent = 'Confirm Service Deletion';
    modal.querySelector('p').innerHTML = `Are you sure you want to delete service: <span class="font-bold text-red-600">${serviceId}</span>? This action cannot be undone.`;
    modal.classList.remove('hidden');
  }
}

document.addEventListener('DOMContentLoaded', function() {
  const modal = document.getElementById('deleteConfirmModal');
  const cancelBtn = document.getElementById('cancelLicenseConfirm');
  const confirmBtn = document.getElementById('confirmLicenseBtn');
  if (cancelBtn) {
    cancelBtn.onclick = function() {
      if (modal) modal.classList.add('hidden');
    };
  }
  if (confirmBtn) {
    confirmBtn.onclick = function() {
      if (modal) modal.classList.add('hidden');
      if (deleteServiceInfo.serviceId && deleteServiceInfo.registryId) {
        // Create a form and submit POST to the delete route
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = `/service-registry/delete/r/${deleteServiceInfo.registryId}/s/${deleteServiceInfo.serviceId}`;
        document.body.appendChild(form);
        form.submit();
      }
    };
  }
});
// ===============================
// Get server data (passed from EJS)
// ===============================
const serverData = window.registryData || {};
const originalServices = serverData.serviceRegistry || [];
// Transform server data for table display
const data = originalServices.map(service => ({
  regId : service.id,
  service_id: service.service_id,
  service_name: service.service_name,
  service_type: service.service_type,
  registered_at: new Date(service.registered_at)
    .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    .replace(/ /g, '-'),
  status: service.status,
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
// Render status tabs (with counts) -
// ===============================
function renderTabs() {
  // Count how many items are in each status
  const counts = { All: data.length };
  ["Active", "Suspended"].forEach(st => {
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
      d.regId.toString().toLowerCase().includes(query) ||
      d.service_id.toLowerCase().includes(query) ||
      d.service_name.toLowerCase().includes(query) ||
      d.service_type.toLowerCase().includes(query)
      // d.campaign_identifier.toLowerCase().includes(query)
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
  tableBody.innerHTML = pageData.map(user => {
    let statusClass = "";
    if (user.status === "active") statusClass = "px-4 py-1 text-sm text-blue-700 bg-blue-100 rounded-full";
    if (user.status === "suspended") statusClass = "px-4 py-1 text-sm text-yellow-700 bg-yellow-100 rounded-full";

    return `
    <tr class="transition-colors border-t hover:bg-blue-50">
      <td class="px-6 py-6 whitespace-nowrap">
        <div class="text-sm font-medium text-gray-900">${user.service_id}</div>
      </td>
      <td class="px-6 py-6 whitespace-nowrap">${user.service_name}</td>
      <td class="px-6 py-6 whitespace-nowrap">${user.service_type}</td>
      <td class="px-6 py-6 whitespace-nowrap">
        <div class="text-sm text-gray-900">${user.registered_at}</div>
      </td>
      <td class="px-6 py-6 whitespace-nowrap">
        <button type="button"
          class="
            inline-flex items-center px-3 py-1 text-sm border rounded-full transition
            ${user.status === 'Suspended' 
              ? 'text-red-500 border-red-500 bg-red-50 hover:bg-red-100' 
              : 'text-green-500 border-green-500 bg-green-50 hover:bg-green-100'}
          "
          aria-haspopup="true" aria-expanded="false">
          ${user.status.charAt(0).toUpperCase() + user.status.slice(1)}
        </button>
      </td>
      <td class="px-6 py-6 whitespace-nowrap">
        <div class="relative inline-block text-left">
          <button type="button" onclick="closeAllActionMenus(); this.nextElementSibling.classList.toggle('hidden')"
            class="p-2 rounded hover:bg-gray-100 transition" aria-haspopup="true" aria-expanded="false">
            <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" stroke-width="2"
              viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="19" cy="12" r="1.5" />
              <circle cx="5" cy="12" r="1.5" />
            </svg>
          </button>
          <ul class="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded shadow-lg z-10 hidden">
            <li>
              <a href="/service-registry/update/${user.service_id}/r/${user.regId}"
                class="flex items-center px-4 py-2 text-sm text-green-600 hover:bg-gray-100 rounded transition">
                <i class="ion-android-create mr-2"></i>
                Edit
              </a>
            </li>
            <li>
              <button type="button" onclick="confirmDeleteService('${user.service_id}', '${user.regId}')"
                class="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 rounded transition w-full text-left">
                <i class="ion-android-trash mr-2"></i>
                Delete
              </button>
            </li>
          </ul>
        </div>
      </td>
    </tr>`;
  }).join("");

  // Update pagination
  renderPagination(filtered.length);
}

// ===============================
// Action functions
// ===============================
function viewCampaign(campaignId) {
  window.location.href = `/phm/campaign/nfc/details/${campaignId}`;
}

function closeAllActionMenus() {
  document.querySelectorAll('ul.absolute.right-0.mt-2.w-40').forEach(ul => ul.classList.add('hidden'));
}

// ===============================
// Render pagination buttons - Simplified with new styling
// ===============================
function renderPagination(total) {
  const serverPagination = window.registryData.pagination || {};
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

// Close action menus when clicking outside
document.addEventListener('click', function(event) {
  if (!event.target.closest('.relative.inline-block.text-left')) {
    closeAllActionMenus();
  }
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
          <div class="text-lg font-medium mb-2">No data found</div>
          <p>Create your first service registry entry to get started.</p>
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
