$(document).ready(function () {
  // Override jQuery Validate default messages with localized ones
  $.extend($.validator.messages, {
    min: window.i18n.validation_messages.min_value_validation.replace('{0}', '{0}')
  });

  // NFC Campaign Form Validation
  $("#nfcCampaignForm").validate({
    rules: {
      name: { required: true, minlength: 2 },
      noOfTags: { required: true, digits: true, min: 1 },
  
    },
    messages: {
      name: window.i18n.validation_messages.campaign_name_required,
 
      noOfTags: window.i18n.validation_messages.tag_quantity_required
  
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
  $('#noOfTags').on('blur', function () { $(this).valid(); });

  // Add custom validation for department/group selection on Next button
  if (window.nextBtn) {
    window.nextBtn.addEventListener('click', function(e) {
      // Get current step
      const steps = document.querySelectorAll('.step');
      let currentStep = 0;
      steps.forEach((step, index) => {
        if (!step.classList.contains('hidden')) {
          currentStep = index;
        }
      });

      // Check which step has department/group selection
      const currentStepElement = Array.from(steps).find(step => !step.classList.contains('hidden'));
      if (currentStepElement && currentStepElement.querySelector('.tag-selector')) {
        if (!validateDepartmentGroupSelection()) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }
    }, true); // Use capture phase to intercept before other handlers
  }
});

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

