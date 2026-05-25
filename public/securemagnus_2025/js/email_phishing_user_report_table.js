const pagination = document.getElementById("interactionPagination");
const searchInput = document.getElementById("interactionSearchInput");
const tableBody = document.getElementById("interactionTableBody");
const paginationData = window.userDetailsPagination || {};
const queryData = window.userDetailsQuery || {};
const campaignId = window.campaignDetailsId || 0;

function buildUrl(params) {
  const url = new URL(window.location.href);
  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, value);
    }
  });
  return url.toString();
}

function buildJsonUrl(params) {
  const url = new URL(window.location.href);
  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, value);
    }
  });
  url.searchParams.set("format", "json");
  return url.toString();
}

function yesNo(value) {
  return value ? "Yes" : "No";
}

function renderRows(invitees) {
  if (!tableBody) {
    return;
  }

  if (!Array.isArray(invitees) || invitees.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="10" class="px-6 py-12 text-center text-gray-500">
          <div class="text-lg font-medium mb-2">No data found</div>
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = invitees.map(invitee => {
    const scheduleTime = invitee?.CampaignSchedule?.start_datetime || "";
    const profile = invitee?.User?.UserProfile || {};
    const report = invitee?.Report || {};
    const inviteeId = invitee?.id || 0;

    return `
      <tr class="border-t hover:bg-blue-50 transition-colors">
        <td class="px-6 py-6 whitespace-nowrap editable">${scheduleTime}</td>
        <td class="px-6 py-6 whitespace-nowrap editable">${profile.first_name || ""}</td>
        <td class="px-6 py-6 whitespace-nowrap editable">${profile.last_name || ""}</td>
        <td class="px-6 py-6 whitespace-nowrap editable">${profile.email || ""}</td>
        <td class="px-6 py-6 whitespace-nowrap editable text-red-500">${yesNo(report.is_phish_msg_opened)}</td>
        <td class="px-6 py-6 whitespace-nowrap editable">${yesNo(report.is_phish_msg_link_opened)}</td>
        <td class="px-6 py-6 whitespace-nowrap editable">${yesNo(report.is_phish_msg_data_entered_in_form)}</td>
        <td class="px-6 py-6 whitespace-nowrap editable">${yesNo(report.is_phish_msg_data_entered_submited_in_form)}</td>
        <td class="px-6 py-6 whitespace-nowrap editable">${yesNo(report.is_phish_msg_file_downloaded)}</td>
        <td class="px-6 py-4 text-start flex items-center gap-2">
          <div class="flex gap-2">
            <a class="p-2 rounded-full hover:bg-blue-50" title="View Details"
              href="/phm/campaign/email/user/report/${inviteeId}/${campaignId}">
              <svg xmlns="http://www.w3.org/2000/svg"
                class="w-5 h-5 text-blue-600 hover:text-blue-800" fill="none"
                viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z">
                </path>
              </svg>
            </a>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function updatePaginationData(nextPagination) {
  const nextPage = nextPagination.currentPage || nextPagination.page || paginationData.currentPage || 1;
  const nextPageSize = nextPagination.pageSize || paginationData.pageSize || 10;
  const nextTotalPages = nextPagination.totalPages || paginationData.totalPages || 1;
  const nextTotalCount = nextPagination.totalCount || nextPagination.total || paginationData.totalCount || 0;

  paginationData.currentPage = Number(nextPage) || 1;
  paginationData.pageSize = Number(nextPageSize) || 10;
  paginationData.totalPages = Number(nextTotalPages) || 1;
  paginationData.totalCount = Number(nextTotalCount) || 0;
}

updatePaginationData(paginationData);
queryData.page = paginationData.currentPage || queryData.page || 1;
queryData.pageSize = paginationData.pageSize || queryData.pageSize || 10;

async function fetchAndRender(params) {
  const requestedPage = Number(params.page || 1);
  const requestedPageSize = Number(params.pageSize || queryData.pageSize || 10);
  const url = buildJsonUrl(params);
  const response = await fetch(url, {
    headers: {
      "Accept": "application/json"
    }
  });
  if (!response.ok) {
    return;
  }
  const data = await response.json();
  const invitees = data?.usersDetail?.Phishing_Invities || [];
  queryData.page = requestedPage;
  queryData.pageSize = requestedPageSize;
  queryData.search = params.search || "";
  updatePaginationData(data?.pagination || {});
  const apiPage = Number(data?.pagination?.currentPage || data?.pagination?.page);
  if (!Number.isFinite(apiPage) || apiPage < 1) {
    paginationData.currentPage = requestedPage;
  }
  if (!data?.pagination?.pageSize) {
    paginationData.pageSize = requestedPageSize;
  }
  const nextUrl = buildUrl({
    page: queryData.page,
    pageSize: queryData.pageSize,
    search: queryData.search
  });
  window.history.pushState({}, "", nextUrl);
  renderRows(invitees);
  renderPagination();
}

function renderPagination() {
  if (!pagination) {
    return;
  }

  const currentPageNum = Number(paginationData.currentPage || queryData.page || 1);
  const totalPages = Number(paginationData.totalPages || 1);
  const pageSize = Number(paginationData.pageSize || queryData.pageSize || 10);
  const totalCount = Number(paginationData.totalCount || 0);

  if (totalPages < 1) {
    pagination.innerHTML = "";
    return;
  }

  const startResult = totalCount === 0 ? 0 : ((currentPageNum - 1) * pageSize) + 1;
  const endResult = totalCount === 0 ? 0 : Math.min(currentPageNum * pageSize, totalCount);

  let paginationHTML = `
    <div class="flex items-center justify-between w-full">
      <div class="${document.dir === "rtl" ? "ml-4 mr-2" : "mr-4"}">
        <p class="text-sm text-gray-700">
          Showing ${startResult}
          to ${endResult}
          of ${totalCount} results
        </p>
      </div>
      <div class="flex space-x-2">
  `;

  if (currentPageNum > 1) {
    paginationHTML += `
      <button type="button" data-page="${currentPageNum - 1}"
         class="px-3 py-1 rounded-full border text-gray-600 hover:bg-teal-50 hover:text-[var(--teal)] hover:border hover:border-[var(--teal)] duration-300">
        ‹
      </button>
    `;
  }

  let startPage = Math.max(1, currentPageNum - 1);
  let endPage = Math.min(totalPages, currentPageNum + 1);

  if (endPage - startPage < 2) {
    if (startPage === 1) {
      endPage = Math.min(totalPages, 3);
    } else if (endPage === totalPages) {
      startPage = Math.max(1, totalPages - 2);
    }
  }

  for (let i = startPage; i <= endPage; i += 1) {
    const isActive = i === currentPageNum;
    paginationHTML += `
      <button type="button" data-page="${i}"
         class="px-3 py-1 rounded-full ${isActive ? "bg-teal-50 text-[var(--teal)] border border-[var(--teal)]" : "border text-gray-600 hover:bg-teal-50 hover:text-[var(--teal)] hover:border hover:border-[var(--teal)] duration-300"}">
        ${i}
      </button>
    `;
  }

  if (currentPageNum < totalPages) {
    paginationHTML += `
      <button type="button" data-page="${currentPageNum + 1}"
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

  pagination.querySelectorAll("button[data-page]").forEach(button => {
    button.addEventListener("click", () => {
      const nextPage = Number(button.dataset.page || 1);
      const pageSizeValue = paginationData.pageSize || queryData.pageSize || 10;
      const searchValue = searchInput ? searchInput.value.trim() : "";
      fetchAndRender({
        page: nextPage,
        pageSize: pageSizeValue,
        search: searchValue
      });
    });
  });
}

function debounce(fn, wait) {
  let timeoutId;
  return (...args) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
    }, wait);
  };
}

if (searchInput) {
  const applySearch = debounce(() => {
    const searchValue = searchInput.value.trim();
    const pageSize = paginationData.pageSize || queryData.pageSize || 10;
    fetchAndRender({
      search: searchValue,
      page: 1,
      pageSize
    });
  }, 300);

  searchInput.addEventListener("input", applySearch);
}

renderPagination();
