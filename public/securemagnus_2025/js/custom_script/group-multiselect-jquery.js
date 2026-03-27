$(document).ready(function () {
  const selectedUsersApi = "/group/getUsersByGroup"; // expects groupId appended
  const unselectedUsersApi = "/group/getUnassignedUser"; // try groupId appended, otherwise returns all unassigned
  const enrollUsersApi = `/group/enrollToGroup`;
  let currentGroupId = null;

  // Open modal and fetch data
  $(document).on('click', '.open-modal', function (e) {
    e.preventDefault();
    currentGroupId = $(this).data('group-id');
    if (!currentGroupId) {
      console.error('No group id found on clicked element');
      return;
    }
    fetchUsers(currentGroupId);
  });

  function fetchUsers(groupId) {


    Promise.all([
      $.ajax({ url: selectedUsersApi + '/' + groupId, method: 'GET', dataType: 'json' }),
      $.ajax({ url: unselectedUsersApi + '/' + groupId, method: 'GET', dataType: 'json' })
    ])
      .then(([selectedResp, unselectedResp]) => {
        const selectedUsers = (selectedResp && selectedResp.assignedUsers) || [];
        const unselectedUsers = (unselectedResp && unselectedResp.unassignedUsers) || [];
        updateModalTables(selectedUsers, unselectedUsers);
        showModal();
      })
      .catch((err) => {
        console.error('[Group Modal] Error fetching users for group', groupId, err);
      });
  }

  function updateModalTables(enrolled, unenrolled) {
    const $enrolledBody = $('#enrolledTable tbody');
    const $unenrolledBody = $('#unenrolledTable tbody');
    $enrolledBody.empty();
    $unenrolledBody.empty();

    if (enrolled.length === 0) {
      $enrolledBody.append('<tr><td colspan="3" class="px-4 py-2 text-center text-sm text-gray-500">No enrolled users</td></tr>');
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
      $unenrolledBody.append('<tr><td colspan="3" class="px-4 py-2 text-center text-sm text-gray-500">No unenrolled users</td></tr>');
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

  // save selected enrolled users for currentGroupId
  window.saveSelectedUsers = function (ids) {
    if (!currentGroupId) {
      console.error('[Group Modal] saveSelectedUsers: missing group id');
      return $.Deferred().reject('missing group id').promise();
    }

    // if ids passed, use them; otherwise collect from enrolled table
    const selectedIds = Array.isArray(ids) && ids.length
      ? ids
      : $('#enrolledTable tbody input.enrolledCheckbox').map(function () {
          return $(this).data('id');
        }).get();

    console.info('[Group Modal] Saving selected users count=', selectedIds.length, 'group=', currentGroupId);

    return $.ajax({
      url: enrollUsersApi + `/${encodeURIComponent(currentGroupId) + '/false'}`,
      method: 'POST',
      contentType: 'application/json',
      dataType: 'json',
      data: JSON.stringify({ selectedUsers: selectedIds })
    }).done(function (resp) {
      console.info('[Group Modal] saveSelectedUsers: success', resp);
    }).fail(function (err) {
      console.error('[Group Modal] saveSelectedUsers: error', err);
    });
  };

  // remove selected enrolled users for currentGroupId
  window.removeSelectedUsers = function (ids) {
    if (!currentGroupId) {
      console.error('[Group Modal] removeSelectedUsers: missing group id');
      return $.Deferred().reject('missing group id').promise();
    }

    // if ids passed, use them; otherwise collect checked enrolled checkboxes
    const selectedIds = Array.isArray(ids) && ids.length
      ? ids
      : $('#enrolledTable tbody input.enrolledCheckbox:checked').map(function () {
          return $(this).data('id');
        }).get();

    console.info('[Group Modal] Removing selected users count=' + selectedIds.length + ' group=' + currentGroupId);

    return $.ajax({
      url: enrollUsersApi + `/${encodeURIComponent(currentGroupId)}/true`,
      method: 'POST',
      contentType: 'application/json',
      dataType: 'json',
      data: JSON.stringify({ selectedUsers: selectedIds })
    }).done(function (resp) {
      console.info('[Group Modal] removeSelectedUsers: success', resp);
    }).fail(function (err) {
      console.error('[Group Modal] removeSelectedUsers: error', err);
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
        try { window.location.reload(); } catch (e) { console.error('[Group Modal] reload failed', e); }
      }, 150);
    } catch (e) {
      console.error('[Group Modal] closeModal error', e);
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


