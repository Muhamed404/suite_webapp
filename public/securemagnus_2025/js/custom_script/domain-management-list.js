$(function () {
  var $script   = $('script[data-domain-list]');
  var i18nDomain = {
    active:   $script.attr('data-i18n-active'),
    inactive: $script.attr('data-i18n-inactive')
  };

  // ── Edit modal ──────────────────────────────────────────────────────────────
  $(document).on('click', '.edit-domain-btn', function () {
    var id       = $(this).data('id');
    var name     = $(this).data('domain-name');
    var isActive = $(this).attr('data-is-active') === 'true';

    $('#edit_domain_id').val(id);
    $('#edit_domain_name').val(name);
    $('#edit_is_active').val(isActive ? '1' : '0');

    var toggle = document.getElementById('editStatusToggle');
    var thumb  = document.getElementById('editStatusThumb');
    var label  = document.getElementById('editStatusLabel');
    if (isActive) {
      toggle.classList.remove('bg-gray-300'); toggle.classList.add('bg-teal-500');
      thumb.classList.remove('translate-x-1'); thumb.classList.add('translate-x-6');
      label.textContent = i18nDomain.active;
      label.className = 'text-sm font-medium text-teal-600';
    } else {
      toggle.classList.remove('bg-teal-500'); toggle.classList.add('bg-gray-300');
      thumb.classList.remove('translate-x-6'); thumb.classList.add('translate-x-1');
      label.textContent = i18nDomain.inactive;
      label.className = 'text-sm font-medium text-gray-400';
    }

    $('#editDomainModal').removeClass('hidden');
  });

  document.getElementById('editDomainModal').addEventListener('click', function (e) {
    if (e.target === this) closeEditModal();
  });

  // ── Add modal ───────────────────────────────────────────────────────────────
  document.getElementById('addDomainModal').addEventListener('click', function (e) {
    if (e.target === this) closeAddModal();
  });

  // ── Delete modal ────────────────────────────────────────────────────────────
  $(document).on('click', '.delete-domain-btn', function (e) {
    e.stopPropagation();
    var url  = $(this).data('delete-url');
    var name = $(this).data('domain-name');
    $('#deleteDomainName').text(name || '');
    $('#confirmDomainDelete').attr('href', url);
    $('#deleteDomainModal').removeClass('hidden');
  });

  $('#cancelDomainDelete').on('click', function () {
    $('#deleteDomainModal').addClass('hidden');
  });

  $(document).on('click', '#deleteDomainModal', function (e) {
    if ($(e.target).is('#deleteDomainModal')) {
      $('#deleteDomainModal').addClass('hidden');
    }
  });
});

// ── Global functions called from onclick attributes ──────────────────────────
function closeEditModal() {
  document.getElementById('editDomainModal').classList.add('hidden');
}

function toggleEditStatus() {
  var $script  = $('script[data-domain-list]');
  var i18nDomain = {
    active:   $script.attr('data-i18n-active'),
    inactive: $script.attr('data-i18n-inactive')
  };
  var input  = document.getElementById('edit_is_active');
  var toggle = document.getElementById('editStatusToggle');
  var thumb  = document.getElementById('editStatusThumb');
  var label  = document.getElementById('editStatusLabel');
  var active = input.value === '1';

  if (active) {
    input.value = '0';
    toggle.classList.replace('bg-teal-500', 'bg-gray-300');
    thumb.classList.replace('translate-x-6', 'translate-x-1');
    label.textContent = i18nDomain.inactive;
    label.className = 'text-sm font-medium text-gray-400';
  } else {
    input.value = '1';
    toggle.classList.replace('bg-gray-300', 'bg-teal-500');
    thumb.classList.replace('translate-x-1', 'translate-x-6');
    label.textContent = i18nDomain.active;
    label.className = 'text-sm font-medium text-teal-600';
  }
}

function openAddModal() {
  document.getElementById('addDomainModal').classList.remove('hidden');
}

function closeAddModal() {
  document.getElementById('addDomainModal').classList.add('hidden');
}

function toggleModalStatus() {
  var $script  = $('script[data-domain-list]');
  var i18nDomain = {
    active:   $script.attr('data-i18n-active'),
    inactive: $script.attr('data-i18n-inactive')
  };
  var input  = document.getElementById('modal_is_active');
  var toggle = document.getElementById('modalStatusToggle');
  var thumb  = document.getElementById('modalStatusThumb');
  var label  = document.getElementById('modalStatusLabel');
  var active = input.value === '1';

  if (active) {
    input.value = '0';
    toggle.classList.replace('bg-teal-500', 'bg-gray-300');
    thumb.classList.replace('translate-x-6', 'translate-x-1');
    label.textContent = i18nDomain.inactive;
    label.className = 'text-sm font-medium text-gray-400';
  } else {
    input.value = '1';
    toggle.classList.replace('bg-gray-300', 'bg-teal-500');
    thumb.classList.replace('translate-x-1', 'translate-x-6');
    label.textContent = i18nDomain.active;
    label.className = 'text-sm font-medium text-teal-600';
  }
}
