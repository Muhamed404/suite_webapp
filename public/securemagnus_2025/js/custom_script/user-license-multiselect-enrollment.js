$(document).ready(function () {
  const enrolledUserAPI = "/user/retrieved-enrolled-phm-users"; // expects deptId appended
  const unenrollerUserAPI = "/user/retrieved-unenrolled-phm-users"; // try deptId appended, otherwise returns all unassigned
  const saveUserAllocationLicense = `/user/update-license-status`;

  // Open modal and fetch data
  $(document).on('click', '.open-modal', function (e) {
    e.preventDefault();
    // Get the selected product ID from the dropdown
    const selectedProductId = $('#userActionSelect').val();
    // Only fetch if a product is selected
    if (selectedProductId) {
      fetchUsers(selectedProductId);
    } else {
      // Optionally, show a message or clear tables
      updateModalTables([], []);
      showModal();
    }
  });

  function fetchUsers(productId) {
    // Example: append productId as a query param if your API supports it
    const enrolledUrl = productId ? `${enrolledUserAPI}?productId=${productId}` : enrolledUserAPI;
    const unenrolledUrl = productId ? `${unenrollerUserAPI}?productId=${productId}` : unenrollerUserAPI;

    Promise.all([
      $.ajax({ url: enrolledUrl, method: 'GET', dataType: 'json' }),
      $.ajax({ url: unenrolledUrl, method: 'GET', dataType: 'json' })
    ])
      .then(([enrollerUserAPIResponse, enrollerUserSelectedResponse]) => {
        const enrollUsers = (enrollerUserAPIResponse && enrollerUserAPIResponse.enrolledUsers) || [];
        const unenrolledUsers = (enrollerUserSelectedResponse && enrollerUserSelectedResponse.unenrolledUsers) || [];
        updateModalTables(enrollUsers, unenrolledUsers);
        showModal();
      })
      .catch((err) => {
        console.error('[Dept Modal] Error fetching users for product', productId, err);
      });
  }

  function updateModalTables(enrolled, unenrolled) {
    const $enrolledBody = $('#enrolledTable tbody');
    const $unenrolledBody = $('#unenrolledTable tbody');
    $enrolledBody.empty();
    $unenrolledBody.empty();

    // Helper to get user fields safely
    function getUserField(user, field) {
      // Try nested UserProfile, then flat
      return user.UserProfile && user.UserProfile[field] !== undefined
        ? user.UserProfile[field]
        : user[field] || '';
    }

    // Enrolled users
    if (!Array.isArray(enrolled) || enrolled.length === 0) {
      $enrolledBody.append('<tr><td colspan="3" class="px-4 py-2 text-center text-sm text-gray-500">No enrolled users</td></tr>');
    } else {
      enrolled.forEach(user => {
        if (!user) return; // Defensive: skip if user is undefined/null
        const userId = getUserField(user, 'id');
        const firstName = escapeHtml(getUserField(user, 'first_name'));
        const lastName = escapeHtml(getUserField(user, 'last_name'));
        const row = `<tr class="hover:bg-teal-50 cursor-pointer">
          <td class="px-4 py-2 border text-center"><input type="checkbox" class="enrolledCheckbox" data-id="${userId}"></td>
          <td class="px-4 py-2 border">${firstName}</td>
          <td class="px-4 py-2 border">${lastName}</td>
        </tr>`;
        $enrolledBody.append(row);
      });
    }

    // Unenrolled users
    if (!Array.isArray(unenrolled) || unenrolled.length === 0) {
      $unenrolledBody.append('<tr><td colspan="3" class="px-4 py-2 text-center text-sm text-gray-500">No unenrolled users</td></tr>');
    } else {
      unenrolled.forEach(user => {
        if (!user) return; // Defensive: skip if user is undefined/null
        const userId = getUserField(user, 'id');
        const firstName = escapeHtml(getUserField(user, 'first_name'));
        const lastName = escapeHtml(getUserField(user, 'last_name'));
        const row = `<tr class="hover:bg-teal-50 cursor-pointer">
          <td class="px-4 py-2 border text-center"><input type="checkbox" class="unenrolledCheckbox" data-id="${userId}"></td>
          <td class="px-4 py-2 border">${firstName}</td>
          <td class="px-4 py-2 border">${lastName}</td>
        </tr>`;
        $unenrolledBody.append(row);
      });
    }
  }

  // Toggle checkbox when row is clicked
  $(document).on('click', '#enrolledTable tbody tr, #unenrolledTable tbody tr', function (e) {
    // Prevent double toggle if clicking directly on checkbox
    if (e.target.type !== 'checkbox') {
      const $checkbox = $(this).find('input[type="checkbox"]');
      $checkbox.prop('checked', !$checkbox.prop('checked'));
    }
  });

  function showModal() {
    const $modal = $('#popup');
    $modal.removeClass('hidden').addClass('flex');
    $('body').addClass('overflow-hidden');
    // Optional: focus first input for accessibility
    setTimeout(() => {
      $modal.find('input, button, select, textarea').first().focus();
    }, 100);
  }

  // save selected enrolled users for currentDepartmentId
  window.enrollUserLicense = function (ids) {
    return showEnrollConfirmModal().then(() => {
      // if ids passed, use them; otherwise collect from enrolled table
      const selectedIds = Array.isArray(ids) && ids.length
        ? ids
        : $('#enrolledTable tbody input.enrolledCheckbox').map(function () {
          return $(this).data('id');
        }).get();

      const productId = $('#userActionSelect').val();
      return $.ajax({
        url: saveUserAllocationLicense + `/false`,
        method: 'POST',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify({ selectedUsers: selectedIds, productId })
      }).done(function (resp) {
        console.info('[User License Allocation Modal] enrollUserLicense: success', resp);
        if (!resp.success && resp.redirect) {
          showCustomToast('error', resp.message || 'User enrollment failed.');
          setTimeout(() => {
            window.location.href = resp.redirect;
          }, 2000); // Show message for 2 seconds before redirect
        } else {
          showCustomToast('success', resp.message || 'User enrolled successfully.');
        }
      }).fail(function (err) {
        console.error('[User License Allocation Modal] enrollUserLicense: error', err);
      });
    }).catch((err) => {
      return $.Deferred().reject(err).promise();
    });
  };

  // remove selected enrolled users for currentDepartmentId
  window.unEnrollUserLicense = function (ids) {
    showUnenrollConfirmModal().then(() => {
      // User confirmed, proceed with unenrollment

      if (!ids) {
        console.error('[User License Allocation Modal] unEnrollUserLicense: missing department id');
        return $.Deferred().reject('missing department id').promise();
      }

      // if ids passed, use them; otherwise collect checked enrolled checkboxes
      const selectedIds = Array.isArray(ids) && ids.length
        ? ids
        : $('#enrolledTable tbody input.enrolledCheckbox:checked').map(function () {
          return $(this).data('id');
        }).get();
      const productId = $('#userActionSelect').val();

      return $.ajax({
        url: saveUserAllocationLicense + `/true`,
        method: 'POST',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify({ selectedUsers: selectedIds, productId })
      }).done(function (resp) {
        console.info('[User License Allocation Modal] unEnrollUserLicense: success', resp);
        if (!resp.success && resp.redirect) {
          showCustomToast('error', resp.message || 'User unenrollment failed.');
          setTimeout(() => {
            window.location.href = resp.redirect;
          }, 2000); // Show message for 2 seconds before redirect
        } else {
          showCustomToast('success', resp.message || 'User unenrolled successfully.');
        }
      }).fail(function (err) {
        console.error('[User License Allocation Modal] unEnrollUserLicense: error', err);
        if (!resp.success && resp.redirect) {
          window.location.href = resp.redirect;
        }
      });
    }).catch((err) => {
      return $.Deferred().reject(err).promise();
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

  $('#userActionSelect').on('change', function () {
    const selectedProductId = $(this).val();
    if (selectedProductId) {
      // Optionally, pass selectedProductId to fetchUsers if your API supports filtering by product
      fetchUsers(selectedProductId);
    } else {
      // Optionally, clear tables if no product is selected
      updateModalTables([], []);
    }
  });

  function showUnenrollConfirmModal() {
    return new Promise((resolve, reject) => {
      const $modal = $('#unenrollConfirmModal');
      $modal.removeClass('hidden').addClass('flex');

      $('#unenrollConfirmYes').off('click').on('click', function () {
        $modal.addClass('hidden').removeClass('flex');
        resolve(true);
      });
      $('#unenrollConfirmNo').off('click').on('click', function () {
        $modal.addClass('hidden').removeClass('flex');
        reject('User cancelled unenrollment');
      });
    });
  }

  function showEnrollConfirmModal() {
    return new Promise((resolve, reject) => {
      const $modal = $('#enrollConfirmModal');
      $modal.removeClass('hidden').addClass('flex');

      $('#enrollConfirmYes').off('click').on('click', function () {
        $modal.addClass('hidden').removeClass('flex');
        resolve(true);
      });
      $('#enrollConfirmNo').off('click').on('click', function () {
        $modal.addClass('hidden').removeClass('flex');
        reject('User cancelled enrollment');
      });
    });
  }
});


