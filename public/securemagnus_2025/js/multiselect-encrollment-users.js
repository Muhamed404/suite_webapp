function openModal() {
      document.getElementById("popup").classList.remove("hidden");
    }
    function closeModal() {
      // hide modal
      const popup = document.getElementById("popup");
      if (popup) popup.classList.add("hidden");

      // clear table rows
      const enrolledTbody = document.querySelector("#enrolledTable tbody");
      const unenrolledTbody = document.querySelector("#unenrolledTable tbody");
      if (enrolledTbody) enrolledTbody.innerHTML = '';
      if (unenrolledTbody) unenrolledTbody.innerHTML = '';

      // reset search inputs
      const enrolledSearch = document.getElementById("enrolledSearch");
      const unenrolledSearch = document.getElementById("unenrolledSearch");
      if (enrolledSearch) enrolledSearch.value = '';
      if (unenrolledSearch) unenrolledSearch.value = '';

      // restore page scrolling
      document.body.classList.remove("overflow-hidden");

      // refresh parent page after short delay so UI updates are visible
      setTimeout(() => {
        window.location.reload();
      }, 150);
    }

    // Toggle all checkboxes in a table
    function toggleAll(master, cls) {
      let checkboxes = document.querySelectorAll("." + cls);
      checkboxes.forEach(cb => cb.checked = master.checked);
    }

    // Toggle checkbox when row is clicked
    function toggleRowCheckbox(row) {
      let checkbox = row.querySelector("input[type='checkbox']");
      if (event.target.tagName !== "INPUT") { // avoid double toggle if clicking on checkbox directly
        checkbox.checked = !checkbox.checked;
      }
    }

    // Move Enrolled → Unenrolled
    function moveToUnenrolled() {
      let enrolledTable = document.querySelector("#enrolledTable tbody");
      let unenrolledTable = document.querySelector("#unenrolledTable tbody");
      let rows = [...enrolledTable.querySelectorAll("tr")];

      // collect ids first
      const movedIds = [];
      rows.forEach(row => {
        let cb = row.querySelector(".enrolledCheckbox");
        if (cb && cb.checked) {
          movedIds.push(cb.dataset.id || cb.getAttribute('data-id'));
          // then move row
          cb.checked = false;
          cb.classList.remove("enrolledCheckbox");
          cb.classList.add("unenrolledCheckbox");
          unenrolledTable.appendChild(row);
        }
      });

      // after moving, attempt to save using collected ids
      if (movedIds.length && window.removeSelectedUsers) {
        window.removeSelectedUsers(movedIds)
          .then(() => {
            console.log('Removing selected users after moveToUnenrolled');
          })
          .catch((e) => {
            console.error('Error saving users after moveToUnenrolled', e);
          });
      }
    }

    // Move Unenrolled → Enrolled
    function moveToEnrolled() {
      let enrolledTable = document.querySelector("#enrolledTable tbody");
      let unenrolledTable = document.querySelector("#unenrolledTable tbody");
      let rows = [...unenrolledTable.querySelectorAll("tr")];

      const movedIds = [];
      rows.forEach(row => {
        let cb = row.querySelector(".unenrolledCheckbox");
        if (cb && cb.checked) {
          movedIds.push(cb.dataset.id || cb.getAttribute('data-id'));
          cb.checked = false;
          cb.classList.remove("unenrolledCheckbox");
          cb.classList.add("enrolledCheckbox");
          enrolledTable.appendChild(row);
        }
      });

      if (movedIds.length && window.saveSelectedUsers) {
        window.saveSelectedUsers(movedIds)
          .then(() => {
            console.log('Saved selected users after moveToEnrolled');
          })
          .catch((e) => {
            console.error('Error saving users after moveToEnrolled', e);
          });
      }
    }

    // Search filter for tables
    function filterTable(searchId, tableId) {
      let input = document.getElementById(searchId).value.toLowerCase();
      let rows = document.getElementById(tableId).getElementsByTagName("tbody")[0].getElementsByTagName("tr");

      for (let i = 0; i < rows.length; i++) {
        let text = rows[i].innerText.toLowerCase();
        rows[i].style.display = text.includes(input) ? "" : "none";
      }
    }