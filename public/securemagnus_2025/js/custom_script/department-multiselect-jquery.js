$(document).ready(function () {
  const selectedUsersApi = "/department/getUsersByDepartment"; // expects deptId appended
  const unselectedUsersApi = "/department/getUsersByUnAssignedDepartment"; // try deptId appended, otherwise returns all unassigned
  const enrollUsersApi = `/department/enrollToDepartment`;
  let currentDepartmentId = null;
  let currentOrganizationId = null;
  // Open modal and fetch data
  $(document).on('click', '.open-modal', function (e) {
    e.preventDefault();
    currentDepartmentId = $(this).data('department-id');
    currentOrganizationId = $(this).data('organization-id');
    // alert('org id in dept modal js ' + currentOrganizationId);
    if (!currentDepartmentId) {
      console.error('No department id found on clicked element');
      return;
    }
    fetchUsers(currentDepartmentId);
  });

  function fetchUsers(departmentId) {


    Promise.all([
      $.ajax({ url: selectedUsersApi + '/' + currentOrganizationId + '/' + departmentId, method: 'GET', dataType: 'json' }),
      $.ajax({ url: unselectedUsersApi + '/' + currentOrganizationId, method: 'GET', dataType: 'json' })
    ])
      .then(([selectedResp, unselectedResp]) => {
        const selectedUsers = (selectedResp && selectedResp.assignedUsers) || [];
        const unselectedUsers = (unselectedResp && unselectedResp.unassignedUsers) || [];
        updateModalTables(selectedUsers, unselectedUsers);
        showModal();
      })
      .catch((err) => {
        console.error('[Dept Modal] Error fetching users for department', departmentId, err);
      });
  }

  function updateModalTables(enrolled, unenrolled) {
    const $enrolledBody = $('#enrolledTable tbody');
    const $unenrolledBody = $('#unenrolledTable tbody');
    $enrolledBody.empty();
    $unenrolledBody.empty();

    if (enrolled.length === 0) {
      $enrolledBody.append(`<tr><td colspan="3" class="px-4 py-2 text-center text-sm text-gray-500">${window.departmentTranslations?.noEnrolledUsers || 'No enrolled users'}</td></tr>`);
    } else {
      enrolled.forEach(user => {
        const row = `<tr onclick="toggleRowCheckbox(this)" class="hover:bg-teal-50 cursor-pointer">
          <td class="px-4 py-2 border text-center"><input type="checkbox" class="enrolledCheckbox" data-id="${user.id}"></td>
          <td class="px-4 py-2 border">${escapeHtml(user.first_name || '')}</td>
          <td class="px-4 py-2 border">${escapeHtml(user.last_name || '')}</td>
        </tr>`;
        $enrolledBody.append(row);
      });
    }

    if (unenrolled.length === 0) {
      $unenrolledBody.append(`<tr><td colspan="3" class="px-4 py-2 text-center text-sm text-gray-500">${window.departmentTranslations?.noUnenrolledUsers || 'No unenrolled users'}</td></tr>`);
    } else {
      unenrolled.forEach(user => {
        const row = `<tr onclick="toggleRowCheckbox(this)" class="hover:bg-teal-50 cursor-pointer">
          <td class="px-4 py-2 border text-center"><input type="checkbox" class="unenrolledCheckbox" data-id="${user.id}"></td>
          <td class="px-4 py-2 border">${escapeHtml(user.first_name || '')}</td>
          <td class="px-4 py-2 border">${escapeHtml(user.last_name || '')}</td>
        </tr>`;
        $unenrolledBody.append(row);
      });
    }
  }

  function showModal() {
    const $modal = $('#popup');
    $modal.removeClass('hidden').addClass('flex');
    $('body').addClass('overflow-hidden');
  }

  // save selected enrolled users for currentDepartmentId
  window.saveSelectedUsers = function (ids) {
    if (!currentDepartmentId) {
      console.error('[Dept Modal] saveSelectedUsers: missing department id');
      return $.Deferred().reject('missing department id').promise();
    }

    // if ids passed, use them; otherwise collect from enrolled table
    const selectedIds = Array.isArray(ids) && ids.length
      ? ids
      : $('#enrolledTable tbody input.enrolledCheckbox').map(function () {
        return $(this).data('id');
      }).get();

    console.info('[Dept Modal] Saving selected users count=', selectedIds.length, 'dept=', currentDepartmentId);

    return $.ajax({
      url: enrollUsersApi + '/' + currentOrganizationId + `/${encodeURIComponent(currentDepartmentId) + '/false'}`,
      method: 'POST',
      contentType: 'application/json',
      dataType: 'json',
      data: JSON.stringify({ selectedUsers: selectedIds })
    }).done(function (resp) {
      console.info('[Dept Modal] saveSelectedUsers: success', resp);
    }).fail(function (err) {
      console.error('[Dept Modal] saveSelectedUsers: error', err);
    });
  };

  // remove selected enrolled users for currentDepartmentId
  window.removeSelectedUsers = function (ids) {
    if (!currentDepartmentId) {
      console.error('[Dept Modal] removeSelectedUsers: missing department id');
      return $.Deferred().reject('missing department id').promise();
    }

    // if ids passed, use them; otherwise collect checked enrolled checkboxes
    const selectedIds = Array.isArray(ids) && ids.length
      ? ids
      : $('#enrolledTable tbody input.enrolledCheckbox:checked').map(function () {
        return $(this).data('id');
      }).get();

    console.info('[Dept Modal] Removing selected users count=' + selectedIds.length + ' dept=' + currentDepartmentId);

    return $.ajax({
      url: enrollUsersApi + '/' + currentOrganizationId + `/${encodeURIComponent(currentDepartmentId)}/true`,
      method: 'POST',
      contentType: 'application/json',
      dataType: 'json',
      data: JSON.stringify({ selectedUsers: selectedIds })
    }).done(function (resp) {
      console.info('[Dept Modal] removeSelectedUsers: success', resp);
    }).fail(function (err) {
      console.error('[Dept Modal] removeSelectedUsers: error', err);
    });
  };

  // keep closeModal global if EJS uses it
  window.closeModal = function () {
    try {
      const $modal = $('#popup');
      $modal.addClass('hidden').removeClass('flex');
      $('body').removeClass('overflow-hidden');

      // clear table rows if present
      const $enrolledTbody = $('#enrolledTable tbody');
      const $unenrolledTbody = $('#unenrolledTable tbody');
      if ($enrolledTbody.length) $enrolledTbody.empty();
      if ($unenrolledTbody.length) $unenrolledTbody.empty();

      // reset search inputs
      $('#enrolledSearch').val('');
      $('#unenrolledSearch').val('');

      // small delay then reload parent page to reflect changes
      setTimeout(() => {
        try { window.location.reload(); } catch (e) { console.error('[Dept Modal] reload failed', e); }
      }, 150);
    } catch (e) {
      console.error('[Dept Modal] closeModal error', e);
    }
  };

  function escapeHtml(text) {
    return String(text).replace(/[&<>"'`=\/]/g, function (s) {
      return ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;',
        "'": '&#39;', '/': '&#x2F;', '`': '&#x60;', '=': '&#x3D;'
      })[s];
    });
  }
});


