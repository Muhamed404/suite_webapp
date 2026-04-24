$(document).ready(function () {
  // QR Campaign Form Validation
  $("#qrCampaignForm").validate({
    rules: {
      // Step 1: Campaign Name & Template
      name: { required: true, minlength: 2 },
      templateOption: { required: true },
      // templateSelect: { required: true }, // Checked in custom validation

      // Step 2: QR Image Setup
      noOfQRTags: { required: true, digits: true, min: 1 },
      qrImage: { 
        required: true,
        extension: "jpg|jpeg|png|gif"
      },

      // Step 3: Date & Time
      startTime: { required: true },
      endTime: { required: true }
    },
    messages: {
      name: window.i18n.validation.campaign_name_required,
      templateOption: window.i18n.validation.template_type_required,
      templateSelect: window.i18n.validation.template_required,
      noOfQRTags: window.i18n.validation.qr_quantity_required,
      qrImage: window.i18n.validation.qr_image_required,
      startTime: window.i18n.validation.start_time_required,
      endTime: window.i18n.validation.end_time_required
    },
    errorClass: "text-red-500 text-sm mt-1",
    highlight: function (element) {
      $(element).addClass("border-red-500");
    },
    unhighlight: function (element) {
      $(element).removeClass("border-red-500");
    }
  });

  // Validate on change/blur for better UX
  $('#name').on('blur', function () { $(this).valid(); });
  $('input[name="templateOption"]').on('change', function () { $(this).valid(); });
  $('#templateSelect').on('change', function () {
    clearTemplateError();
    $(this).removeClass('border-red-500');
  });
  $('#noOfQRTags').on('blur', function () { $(this).valid(); });
  $('#qrImage').on('change', function () { $(this).valid(); });
  $('#startTime, #endTime').on('change', function () { $(this).valid(); });

  // Initialize template option toggle
  initTemplateOptionToggle();

  const nextBtn = document.getElementById('nextBtn');
  if (nextBtn) {
    nextBtn.addEventListener('click', function (e) {
      const steps = document.querySelectorAll('#steps > .step');
      let currentStep = 0;

      steps.forEach((step, index) => {
        if (!step.classList.contains('hidden')) {
          currentStep = index;
        }
      });

      if (currentStep === 0) {
        const validator = $("#qrCampaignForm").validate();
        const nameInput = document.getElementById('name');
        const templateSelect = document.getElementById('templateSelect');
        const trimmedName = nameInput?.value?.trim() || '';
        const selectedTemplateId = templateSelect?.value?.trim() || '';
        let isValid = true;

        if (trimmedName.length < 2) {
          validator.showErrors({
            name: window.i18n.validation.campaign_name_required
          });
          $(nameInput).addClass('border-red-500');
          nameInput?.focus();
          isValid = false;
        }

        if (!selectedTemplateId && templateSelect) {
          showTemplateError(window.i18n.validation.template_required);
          templateSelect.classList.add('border-red-500');
          if (isValid) {
            templateSelect.focus();
          }
          isValid = false;
        } else {
          clearTemplateError();
          templateSelect?.classList.remove('border-red-500');
        }

        if (!isValid) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          return false;
        }

        return;
      }

      if (currentStep === 1) {
        const validator = $("#qrCampaignForm").validate();
        const tagInput = document.getElementById('noOfQRTags');
        const tagValue = tagInput?.value?.trim() || '';
        const tagCount = Number(tagValue);

        if (!tagValue || !Number.isInteger(tagCount) || tagCount < 1) {
          validator.showErrors({
            noOfQRTags: window.i18n.validation.qr_quantity_required
          });
          $(tagInput).addClass('border-red-500');
          tagInput?.focus();
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          return false;
        }

        $(tagInput).removeClass('border-red-500');
      }
    }, true);
  }
});

function showTemplateError(message) {
  clearTemplateError();

  const templateSelect = document.getElementById('templateSelect');
  if (!templateSelect) return;

  const error = document.createElement('span');
  error.id = 'templateSelectError';
  error.className = 'text-red-500 text-sm mt-1 block';
  error.textContent = message;
  templateSelect.insertAdjacentElement('afterend', error);
}

function clearTemplateError() {
  document.getElementById('templateSelectError')?.remove();
}

// Validate department or group selection
function validateDepartmentGroupSelection() {
  // Check for selected departments and groups from hidden inputs
  const departmentIds = document.querySelectorAll('input[name="departmentIds[]"]');
  const groupIds = document.querySelectorAll('input[name="groupIds[]"]');

  const hasDepartments = departmentIds.length > 0;
  const hasGroups = groupIds.length > 0;

  // Get all tag-selector containers and find department/group selects
  const tagSelectors = Array.from(document.querySelectorAll('.tag-selector'));
  let departmentSelect = null;
  let groupSelect = null;

  tagSelectors.forEach(selector => {
    const label = selector.querySelector('label');
    if (label) {
      const labelText = label.textContent.toLowerCase();
      if (labelText.includes('department')) {
        departmentSelect = selector.querySelector('.groupSelect');
      } else if (labelText.includes('group')) {
        groupSelect = selector.querySelector('.groupSelect');
      }
    }
  });

  // Check if there are any options available (excluding placeholder)
  const hasDepartmentOptions = departmentSelect && departmentSelect.options.length > 1;
  const hasGroupOptions = groupSelect && groupSelect.options.length > 1;

  if (!hasDepartmentOptions && !hasGroupOptions) {
    showValidationError('No departments or groups available. Please add users to departments or groups before creating a campaign.');
    return false;
  }

  if (!hasDepartments && !hasGroups) {
    showValidationError('Please select at least one department or group to target.');
    return false;
  }

  // Clear any existing validation errors
  removeValidationError();
  return true;
}

// Show validation error message
function showValidationError(message) {
  // Remove any existing error first
  removeValidationError();

  // Get current step element
  const steps = document.querySelectorAll('.step');
  let currentStepElement = null;
  steps.forEach((step) => {
    if (!step.classList.contains('hidden')) {
      currentStepElement = step;
    }
  });

  if (!currentStepElement) return;

  // Create error container
  const errorContainer = document.createElement('div');
  errorContainer.id = 'step-validation-error';
  errorContainer.className = 'bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4';
  errorContainer.setAttribute('role', 'alert');

  errorContainer.innerHTML = `
    <div class="flex items-start">
      <span class="flex-shrink-0 mr-2">⚠️</span>
      <div class="flex-1">
        <strong class="font-medium">Validation Error:</strong>
        <span class="block mt-1">${message}</span>
      </div>
      <button type="button" class="ml-4 text-red-700 hover:text-red-900" onclick="this.parentElement.parentElement.remove()">
        ✕
      </button>
    </div>
  `;

  // Insert at the beginning of current step
  currentStepElement.insertBefore(errorContainer, currentStepElement.firstChild);
  errorContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Remove validation error message
function removeValidationError() {
  const errorContainer = document.getElementById('step-validation-error');
  if (errorContainer) {
    errorContainer.remove();
  }
}

// Template selection logic (moved from jqueryNFCCreateCampaign.js)
function initTemplateOptionToggle() {
  const radios = document.querySelectorAll('input[name="templateOption"]');
  const selectEl = document.getElementById('templateSelect');
  if (!radios.length || !selectEl) return;

  function populateTemplateOptions(items) {
    selectEl.innerHTML = '';
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.disabled = true;
    placeholder.selected = true;
    placeholder.textContent = window.i18n.labels.select_template || 'Select Template';
    selectEl.appendChild(placeholder);

    if (!items || !items.length) return;

    items.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item?.id ?? item?._id ?? item?.value ?? item?.name ?? item ?? '';
      opt.textContent = item?.name ?? item?.templateName ?? item?.value ?? item ?? opt.value;
      selectEl.appendChild(opt);
    });

    selectEl.selectedIndex = 0;
    
    // Trigger validation after populating
    $(selectEl).valid();
  }

  function update() {
    const checked = document.querySelector('input[name="templateOption"]:checked');
    if (!checked) return;
    if (checked.value === 'systemTemplates') {
      populateTemplateOptions(window._systemTemplates || []);
    } else if (checked.value === 'myTemplates') {
      populateTemplateOptions(window._userTemplates || []);
    } else {
      populateTemplateOptions([]);
    }
  }

  radios.forEach(r => r.addEventListener('change', update));
  update();
}

