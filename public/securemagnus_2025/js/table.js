const tableData = [
  {
    productName: "PhishMagnus",
    packageName: "Minimal Basic Package PHM",
    typeIcon: "images/package_management/cloud-storage-checkmark.svg",
    type: "On Cloud",
    priceIcon: "images/Rial.svg",
    price: 4000,
    userRangeFrom: 1,
    userRangeTo: 300,
    duration: "360 Days",
    date: "2025-08-01"
  },
  {
    productName: "PhishMagnus",
    packageName: "Advanced Security Package",
    typeIcon: "images/package_management/suitcase-work-job-document.svg",
    type: "On Premise",
    priceIcon: "images/Rial.svg",
    price: 6000,
    userRangeFrom: 99,
    userRangeTo: 500,
    duration: "180 Days",
    date: "2025-07-15"
  },
  {
    productName: "ShieldGuard",
    packageName: "Premium Shield Package",
    typeIcon: "images/package_management/cloud-storage-checkmark.svg",
    type: "On Cloud",
    priceIcon: "images/Rial.svg",
    price: 8000,
    userRangeFrom: 10,
    userRangeTo: 1000,
    duration: "365 Days",
    date: "2025-09-05"
  }
  // ...rest of your data
];

let currentSort = { column: null, asc: true };
const tableBody = document.getElementById("tableBody");
const searchInput = document.getElementById("searchInput");
const typeFilter = document.getElementById("typeFilter");

// ✅ Render Table
function renderTable(data) {
  tableBody.innerHTML = data.map(row => `
    <tr class="border-t hover:bg-blue-50 transition-colors">
      <td class="px-6 py-6 whitespace-nowrap">${row.productName}</td>
      <td class="px-6 py-6 whitespace-nowrap">${row.packageName}</td>
      <td class="px-6 py-6 whitespace-nowrap">
        <div class="flex  gap-2"><span class="h-4 w-4"><img src="${row.typeIcon}"  alt=""></span>${row.type}</div>
      </td>
      <td class="px-6 py-6 whitespace-nowrap">
        <div class="flex gap-2"><span><img src="${row.priceIcon}" alt=""></span>${row.price}</div>
      </td>
      <td class="px-6 py-6 whitespace-nowrap">${row.userRangeFrom}</td>
      <td class="px-6 py-6 whitespace-nowrap">${row.userRangeTo}</td>
      <td class="px-6 py-6 whitespace-nowrap">${row.duration}</td>
      <td class="px-6 py-6 whitespace-nowrap">${formatDate(row.date)}</td>
    </tr>
  `).join("");
}

// ✅ Format date for display
function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

// ✅ Sorting (now supports date)
function sortTable(column) {
  if (currentSort.column === column) {
    currentSort.asc = !currentSort.asc;
  } else {
    currentSort.column = column;
    currentSort.asc = true;
  }

  const sortedData = [...filteredData()].sort((a, b) => {
    let valA = a[column];
    let valB = b[column];

    // handle date sorting
    if (column === "date") {
      valA = new Date(valA);
      valB = new Date(valB);
      return currentSort.asc ? valA - valB : valB - valA;
    }

    // numbers
    if (typeof valA === "number" && typeof valB === "number") {
      return currentSort.asc ? valA - valB : valB - valA;
    }

    // strings
    return currentSort.asc
      ? String(valA).localeCompare(String(valB))
      : String(valB).localeCompare(String(valA));
  });

  updateSortIcons();
  renderTable(sortedData);
}

// ✅ Filtering (search + type)
function filteredData() {
  const searchText = searchInput.value.toLowerCase();
  const typeValue = typeFilter.value;

  return tableData.filter(item => {
    const allValues = Object.entries(item)
      .filter(([key]) => !key.includes("Icon")) // skip icons
      .map(([_, v]) => String(v).toLowerCase())
      .join(" ");
    const matchesSearch = allValues.includes(searchText);
    const matchesType = typeValue === "" || item.type === typeValue;
    return matchesSearch && matchesType;
  });
}

// ✅ Update icons
function updateSortIcons() {
  document.querySelectorAll("thead th .sort-icon").forEach(icon => icon.textContent = "↕");
  if (currentSort.column) {
    const activeIcon = document.querySelector(`thead th[data-col="${currentSort.column}"] .sort-icon`);
    if (activeIcon) activeIcon.textContent = currentSort.asc ? "↑" : "↓";
  }
}

// ✅ Event Listeners
document.querySelectorAll("thead th").forEach(th => {
  th.addEventListener("click", () => sortTable(th.getAttribute("data-col")));
});
searchInput.addEventListener("input", () => renderTable(filteredData()));
typeFilter.addEventListener("change", () => renderTable(filteredData()));

// Initial render
renderTable(tableData);





