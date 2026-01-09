$(document).ready(function () {
  // QR Campaign Form Validation
  $("#qrCampaignForm").validate({
    rules: {
      // Step 1: Campaign Name & Template
      name: { required: true, minlength: 2 },
      templateOption: { required: true },
      templateSelect: { required: true },

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
      name: "Campaign name is required (min 2 characters).",
      templateOption: "Please select a template type.",
      templateSelect: "Please select a template.",
      noOfQRTags: "Please enter a valid QR code quantity (minimum 1).",
      qrImage: "Please upload a valid image file (jpg, jpeg, png, gif).",
      startTime: "Start date and time are required.",
      endTime: "End date and time are required."
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
  $('#templateSelect').on('change', function () { $(this).valid(); });
  $('#noOfQRTags').on('blur', function () { $(this).valid(); });
  $('#qrImage').on('change', function () { $(this).valid(); });
  $('#startTime, #endTime').on('change', function () { $(this).valid(); });

  // Initialize template option toggle
  initTemplateOptionToggle();
});

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
    placeholder.textContent = 'Select Template';
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

