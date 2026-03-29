var $script = $('script[src*="phishing-smtp-list.js"]');
var allowEditAndTest = $script.attr('data-allow-edit-and-test') === 'true';
var i18n = {
  btnTesting: $script.data('btn-testing'),
  btnTestConfig: $script.data('btn-test-config'),
  enabled: $script.data('enabled'),
  disabled: $script.data('disabled'),
  active: $script.data('active'),
  inactive: $script.data('inactive'),
  toastSuccess: $script.data('toast-success'),
  toastFailed: $script.data('toast-failed'),
  toastEndpointErr: $script.data('toast-endpoint-err')
};

$(document).on('click', '.test-smtp-btn', function () {
  var $btn = $(this);
  var smtpId = $btn.data('smtp-id');
  var originalText = $btn.text();

  $btn.prop('disabled', true).text(i18n.btnTesting);

  $.ajax({
    url: '/phm/phishing-smtp/test-connection/' + smtpId,
    type: 'GET',
    dataType: 'json',
    success: function (data) {
      if (data.success) {
        showCustomToast('success', data.message || i18n.toastSuccess);
      } else {
        showCustomToast('error', data.message || i18n.toastFailed);
      }
    },
    error: function () {
      showCustomToast('error', i18n.toastEndpointErr);
    },
    complete: function () {
      $btn.prop('disabled', false).text(originalText);
    }
  });
});

// Delete button → open confirmation modal
$(document).on('click', '.delete-smtp-btn', function (e) {
  e.stopPropagation();
  var url = $(this).data('delete-url');
  var email = $(this).data('sender-email');
  $('#deleteSmtpEmail').text(email || '');
  $('#confirmSmtpDelete').attr('href', url);
  $('#smtpDeleteModal').removeClass('hidden');
});

$('#cancelSmtpDelete').on('click', function () {
  $('#smtpDeleteModal').addClass('hidden');
});

$(document).on('click', '#smtpDeleteModal', function (e) {
  if ($(e.target).is('#smtpDeleteModal')) {
    $('#smtpDeleteModal').addClass('hidden');
  }
});

// Row click → open detail modal
$(document).on('click', '.smtp-row', function (e) {
  if ($(e.target).closest('a, button').length) return;

  var $row = $(this);
  var isActive = $row.data('active');

  $('#modal-sender-email').text($row.data('sender-email') || '—');
  $('#modal-organization').text($row.data('organization') || '—');
  $('#modal-host').text($row.data('host') || '—');
  $('#modal-port').text($row.data('port') || '—');
  $('#modal-account').text($row.data('account') || '—');
  $('#modal-tls').text($row.data('use-tls') == 'true' ? i18n.enabled : i18n.disabled);
  $('#modal-ssl').text($row.data('use-ssl') == 'true' ? i18n.enabled : i18n.disabled);
  $('#modal-details').text($row.data('details') || '—');

  var isDefault = $('#modal-organization').text().trim().toLowerCase() === 'default';
  if (isDefault) {
    if (!allowEditAndTest) {
      $('#modal-account-field, #modal-tls-field, #modal-ssl-field').hide();
    }
  } else {
    $('#modal-account-field, #modal-tls-field, #modal-ssl-field').show();
  }

  if (isActive == 'true' || isActive === true) {
    $('#modal-status').html('<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-700"><span class="w-1.5 h-1.5 rounded-full bg-teal-500 inline-block"></span>' + i18n.active + '</span>');
  } else {
    $('#modal-status').html('<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500"><span class="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block"></span>' + i18n.inactive + '</span>');
  }

  $('#smtpDetailModal').data('smtp-id', $row.data('id')).removeClass('hidden');
});

// Close detail modal
$(document).on('click', '#closeSmtpModal', function () {
  $('#smtpDetailModal').addClass('hidden');
});

$(document).on('click', '#smtpDetailModal', function (e) {
  if ($(e.target).is('#smtpDetailModal')) {
    $('#smtpDetailModal').addClass('hidden');
  }
});

// Modal → Test Configuration button
$(document).on('click', '#modalTestSmtpBtn', function () {
  var $btn = $(this);
  var $label = $('#modalTestSmtpBtnLabel');
  var smtpId = $('#smtpDetailModal').data('smtp-id');

  $btn.prop('disabled', true);
  $label.text(i18n.btnTesting);

  $.ajax({
    url: '/phm/phishing-smtp/test-connection/' + smtpId,
    type: 'GET',
    dataType: 'json',
    success: function (data) {
      if (data.success) {
        showCustomToast('success', data.message || i18n.toastSuccess);
      } else {
        showCustomToast('error', data.message || i18n.toastFailed);
      }
    },
    error: function () {
      showCustomToast('error', i18n.toastEndpointErr);
    },
    complete: function () {
      $btn.prop('disabled', false);
      $label.text(i18n.btnTestConfig);
    }
  });
});
