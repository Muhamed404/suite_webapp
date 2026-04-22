$(document).ready(function () {
  // SMS Campaign Form Validation
  $("#smsCampaignForm").validate({
    rules: {
      // Step 1: Campaign Name & Template
      name: { required: true, minlength: 2 },
      templateOption: { required: true },
      templateSelect: { required: true },

      // Step 3: Date & Time
      // startTime: { required: true },
      endTime: { required: true }
    },
    messages: {
      name: window.i18n?.validation_messages?.campaign_name_required || "Campaign name is required (min 2 characters).",
      templateOption: window.i18n?.validation_messages?.template_type_required || "Please select a template type.",
      templateSelect: window.i18n?.validation_messages?.template_required || "Please select a template.",
      // startTime: window.i18n?.validation_messages?.start_time_required || "Start date and time are required.",
      endTime: window.i18n?.validation_messages?.end_time_required || "End date and time are required."
    },
    errorClass: "text-red-500 text-sm mt-1",
    highlight: function (element) {
      $(element).addClass("border-red-500");
    },
    unhighlight: function (element) {
      $(element).removeClass("border-red-500");
    },
    // Prevent validation on form initialization
    onkeyup: false,
    onfocusout: false,
    onclick: false
  });

  // Validate on change/blur for better UX
  $('#name').on('blur', function () { $(this).valid(); });
  $('input[name="templateOption"]').on('change', function () { $(this).valid(); });
  $('#templateSelect').on('change', function () {
    $(this).valid();
    const templateId = this.value;
    if (templateId) {
      loadTemplatePreview(templateId);
    } else {
      clearTemplatePreview();
    }
  });
  // $('#startTime, #endTime').on('change', function () { $(this).valid(); });
  $('#endTime').on('change', function () { $(this).valid(); });

  // Initialize template option toggle
  initTemplateOptionToggle();

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

      // Step 2: Validate department or group selection
      if (currentStep === 1) {
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
    const fieldType = selector.dataset?.field?.trim();
    if (fieldType === 'department') {
      departmentSelect = selector.querySelector('.groupSelect');
    } else if (fieldType === 'group') {
      groupSelect = selector.querySelector('.groupSelect');
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
    placeholder.textContent = window.i18n?.labels?.selectTemplate || 'Select Template';
    selectEl.appendChild(placeholder);

    if (!items || !items.length) return;

    items.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item?.id ?? item?._id ?? item?.value ?? item?.name ?? item ?? '';
      opt.textContent = item?.name ?? item?.templateName ?? item?.value ?? item ?? opt.value;
      selectEl.appendChild(opt);
    });

    selectEl.selectedIndex = 0;
    clearTemplatePreview();
    
    // Don't trigger validation immediately after populating
    // $(selectEl).valid();
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

let currentTemplateData = null;
let currentPreviewTab = 'email';

function clearTemplatePreview() {
  const previewEmpty = document.getElementById('preview-empty');
  const previewContent = document.getElementById('preview-content');
  const previewLoading = document.getElementById('preview-loading');
  const previewError = document.getElementById('preview-error');

  if (previewEmpty) previewEmpty.classList.remove('hidden');
  if (previewContent) previewContent.classList.add('hidden');
  if (previewLoading) previewLoading.classList.add('hidden');
  if (previewError) previewError.classList.add('hidden');

  document.querySelectorAll('.preview-nav-btn').forEach((btn) => {
    btn.disabled = true;
    btn.classList.add('hidden');
  });

  const container = document.getElementById('templateSelection');
  if (container) {
    const trackingInfo = container.querySelector('.tracking-info');
    if (trackingInfo) trackingInfo.remove();
  }

  currentTemplateData = null;
  currentPreviewTab = 'email';
}

async function loadTemplatePreview(templateId) {
  const previewEmpty = document.getElementById('preview-empty');
  const previewContent = document.getElementById('preview-content');
  const previewLoading = document.getElementById('preview-loading');
  const previewError = document.getElementById('preview-error');

  if (!previewEmpty || !previewContent || !previewLoading) return;

  previewEmpty.classList.add('hidden');
  previewContent.classList.add('hidden');
  if (previewError) previewError.classList.add('hidden');
  previewLoading.classList.remove('hidden');

  try {
    const response = await fetch(`/phm/template/api/view/${templateId}`);
    if (!response.ok) throw new Error(`Failed with status ${response.status}`);

    const data = await response.json();
    currentTemplateData = data.message || data.data || data;

    previewLoading.classList.add('hidden');
    previewContent.classList.remove('hidden');

    const firstTab = setupPreviewNavigation();
    updateTrackingInfo();
    showPreviewTab(firstTab || 'email');
  } catch (error) {
    previewLoading.classList.add('hidden');
    if (previewError) {
      previewError.classList.remove('hidden');
      const errorText = previewError.querySelector('p');
      if (errorText) errorText.textContent = 'Failed to load template preview. Please try again.';
    }
  }
}

function updateTrackingInfo() {
  const container = document.getElementById('templateSelection');
  if (!container || !currentTemplateData) return;

  const existingInfo = container.querySelector('.tracking-info');
  if (existingInfo) existingInfo.remove();

  const hasEmailContent = !!(
    currentTemplateData?.phishing_content ||
    currentTemplateData?.sms_content ||
    currentTemplateData?.whatsapp_content ||
    currentTemplateData?.message ||
    currentTemplateData?.email_content ||
    currentTemplateData?.email_body ||
    currentTemplateData?.content ||
    currentTemplateData?.html_content
  );

  const hasLandingPage = !!(
    currentTemplateData?.landing_page_content ||
    currentTemplateData?.landing_page ||
    currentTemplateData?.landing_page_html
  );

  const hasRedirectPage = !!(
    currentTemplateData?.phishing_page_content ||
    currentTemplateData?.redirect_page ||
    currentTemplateData?.redirection_page ||
    currentTemplateData?.redirect_page_html
  );

  const hasAttachment = !!(
    currentTemplateData?.file_attachment_path ||
    currentTemplateData?.attachment ||
    currentTemplateData?.attachment_url ||
    currentTemplateData?.file ||
    currentTemplateData?.file_url ||
    currentTemplateData?.file_attachment
  );

  const trackingItems = [
    {
      text: 'Track email/message opened',
      available: hasEmailContent
    },
    {
      text: 'Track phishing simulation link clicked',
      available: hasLandingPage || hasRedirectPage
    },
    {
      text: 'Track phishing simulation file downloaded (from email/message or landing page)',
      available: hasAttachment
    },
    {
      text: 'Track data submitted through the phishing simulation form',
      available: hasLandingPage
    },
    {
      text: 'Track user interaction with the phishing simulation form',
      available: hasLandingPage
    }
  ];

  const trackingDiv = document.createElement('div');
  trackingDiv.className = 'tracking-info mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg';
  trackingDiv.innerHTML = `
    <h4 class="text-sm font-semibold text-blue-800 mb-2">This template will allow you to track the following items:</h4>
    <ul class="text-sm text-black space-y-1">
      ${trackingItems.map((item) => `
        <li class="flex items-center">
          <span class="mr-2 flex-shrink-0">${item.available ? '<i class="fas fa-check text-green-500"></i>' : '<i class="fas fa-times text-red-500"></i>'}</span>
          ${item.text}
        </li>
      `).join('')}
    </ul>
  `;

  container.appendChild(trackingDiv);
}

function setupPreviewNavigation() {
  if (!currentTemplateData) return null;

  const buttons = document.querySelectorAll('.preview-nav-btn');
  let firstVisibleTab = null;

  buttons.forEach((btn) => {
    const tab = btn.getAttribute('data-preview-tab');
    const hasContent = hasPreviewContent(tab);

    btn.disabled = !hasContent;
    btn.classList.toggle('hidden', !hasContent);

    if (hasContent && firstVisibleTab === null) {
      firstVisibleTab = tab;
    }

    if (hasContent) {
      btn.onclick = (e) => {
        e.preventDefault();
        showPreviewTab(tab);
      };
    }
  });

  return firstVisibleTab;
}

function hasPreviewContent(tab) {
  switch (tab) {
    case 'email':
      return !!(
        currentTemplateData?.phishing_content ||
        currentTemplateData?.sms_content ||
        currentTemplateData?.whatsapp_content ||
        currentTemplateData?.message ||
        currentTemplateData?.email_content ||
        currentTemplateData?.email_body ||
        currentTemplateData?.content ||
        currentTemplateData?.html_content
      );
    case 'landing':
      return !!(
        currentTemplateData?.landing_page_content ||
        currentTemplateData?.landing_page ||
        currentTemplateData?.landing_page_html
      );
    case 'redirect':
      return !!(
        currentTemplateData?.phishing_page_content ||
        currentTemplateData?.redirect_page ||
        currentTemplateData?.redirection_page ||
        currentTemplateData?.redirect_page_html
      );
    case 'attachment':
      return !!(
        currentTemplateData?.file_attachment_path ||
        currentTemplateData?.attachment ||
        currentTemplateData?.attachment_url ||
        currentTemplateData?.file ||
        currentTemplateData?.file_url ||
        currentTemplateData?.file_attachment
      );
    default:
      return false;
  }
}

function showPreviewTab(tab) {
  if (!currentTemplateData) return;
  currentPreviewTab = tab;

  const previewTitle = document.getElementById('preview-title');
  const previewIframe = document.getElementById('preview-iframe');
  const previewAttachmentInfo = document.getElementById('preview-attachment-info');
  const previewNoContent = document.getElementById('preview-no-content');

  document.querySelectorAll('.preview-nav-btn').forEach((btn) => {
    const isActive = btn.getAttribute('data-preview-tab') === tab;
    btn.classList.toggle('bg-teal-500', isActive);
    btn.classList.toggle('text-white', isActive);
    btn.classList.toggle('border-teal-500', isActive);
    btn.classList.toggle('border-gray-300', !isActive);
    btn.classList.toggle('text-gray-700', !isActive);
  });

  if (previewIframe) previewIframe.classList.add('hidden');
  if (previewAttachmentInfo) previewAttachmentInfo.classList.add('hidden');
  if (previewNoContent) previewNoContent.classList.add('hidden');

  if (tab === 'attachment') {
    const attachmentUrl = currentTemplateData?.file_attachment_path ||
      currentTemplateData?.file_attachment ||
      currentTemplateData?.attachment_url ||
      currentTemplateData?.attachment ||
      currentTemplateData?.file_url ||
      currentTemplateData?.file;

    if (attachmentUrl && previewAttachmentInfo) {
      previewAttachmentInfo.classList.remove('hidden');
      const attachmentName = document.getElementById('attachment-name');
      if (attachmentName) {
        attachmentName.textContent = currentTemplateData?.attachment_filename || currentTemplateData?.file_name || 'File Attachment';
      }
      const downloadBtn = document.getElementById('btn-download-attachment-inline');
      if (downloadBtn) {
        downloadBtn.onclick = (e) => {
          e.preventDefault();
          window.open(attachmentUrl, '_blank', 'noopener');
        };
      }
    } else if (previewNoContent) {
      previewNoContent.classList.remove('hidden');
    }

    if (previewTitle) previewTitle.textContent = 'Attachment';
    return;
  }

  let content = '';
  let title = 'Template Content';

  if (tab === 'email') {
    title = 'Template Content';
    content = currentTemplateData?.phishing_content ||
      currentTemplateData?.sms_content ||
      currentTemplateData?.whatsapp_content ||
      currentTemplateData?.message ||
      currentTemplateData?.email_content ||
      currentTemplateData?.email_body ||
      currentTemplateData?.content ||
      currentTemplateData?.html_content || '';
  } else if (tab === 'landing') {
    title = 'Landing Page';
    content = currentTemplateData?.landing_page_content ||
      currentTemplateData?.landing_page ||
      currentTemplateData?.landing_page_html || '';
  } else if (tab === 'redirect') {
    title = 'Redirect Page';
    content = currentTemplateData?.phishing_page_content ||
      currentTemplateData?.redirect_page ||
      currentTemplateData?.redirection_page ||
      currentTemplateData?.redirect_page_html || '';
  }

  if (previewTitle) previewTitle.textContent = title;

  if (content && previewIframe) {
    const normalized = /<[^>]+>/.test(content)
      ? content
      : `<pre style="white-space: pre-wrap; font-family: inherit; margin: 0; padding: 16px;">${String(content)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')}</pre>`;
    previewIframe.srcdoc = normalized;
    previewIframe.classList.remove('hidden');
  } else if (previewNoContent) {
    previewNoContent.classList.remove('hidden');
  }
}

