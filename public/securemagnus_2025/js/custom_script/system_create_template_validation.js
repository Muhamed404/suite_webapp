$(document).ready(function () {
  // Setup validation for the template creation form
  $("#templateCreationForm").validate({
    ignore: [], // Don't ignore hidden fields as they might be in inactive steps
    rules: {
      // Step 1 - Basic Details
      name: { 
        required: true, 
        minlength: 3 
      },
      phishType: { 
        required: true 
      },
      
      // Step 2 - Options (will be validated dynamically in handleNext)
      
      // Step 3 - File Attachment Details
      file_extension: { 
        required: function() {
          const selectedOptions = $('input[name="options"]:checked').map(function() {
            return $(this).val();
          }).get();
          return selectedOptions.includes('2'); // Level 2 = file attachment
        }
      },
      file_name: { 
        required: function() {
          const selectedOptions = $('input[name="options"]:checked').map(function() {
            return $(this).val();
          }).get();
          return selectedOptions.includes('2');
        },
        minlength: 2
      },
      
      // Step 4 - Email/SMS Content Details
      subject: { 
        required: function() {
          const phishType = $('input[name="phishType"]:checked').val();
          return phishType === 'email';
        },
        minlength: 3
      },
      sender_email: { 
        required: function() {
          const phishType = $('input[name="phishType"]:checked').val();
          return phishType === 'email';
        },
        email: true
      },
      phishing_smtp: {
        required: function() {
          const phishType = $('input[name="phishType"]:checked').val();
          return phishType === 'email';
        }
      },
      sender_display_name: { 
        required: function() {
          const phishType = $('input[name="phishType"]:checked').val();
          return phishType === 'email';
        },
        minlength: 2
      },
      company_name: { 
        required: function() {
          const phishType = $('input[name="phishType"]:checked').val();
          return phishType === 'email';
        },
        minlength: 2
      },
      company_domain: { 
        required: function() {
          const phishType = $('input[name="phishType"]:checked').val();
          return phishType === 'email';
        },
        minlength: 3
      },
      
      // SMS Content
      sms_content: { 
        required: function() {
          const phishType = $('input[name="phishType"]:checked').val();
          return phishType === 'sms' || phishType === 'whatsapp';
        },
        maxlength: 160 
      },
      
      // Step 5 - URL Phishing Details
      phish_url: {
        required: function() {
          const selectedOptions = $('input[name="options"]:checked').map(function() {
            return $(this).val();
          }).get();
          return selectedOptions.includes('3'); // Level 3 = URL click
        },
        url: true
      },
      
      // Step 6 - Phishing Webpage
      webpage_url: {
        required: function() {
          const selectedOptions = $('input[name="options"]:checked').map(function() {
            return $(this).val();
          }).get();
          const phishOption = $('input[name="phish_option"]:checked').val();
          // Only required if URL click is selected AND custom-url option is chosen
          return selectedOptions.includes('3') && phishOption === 'custom-url';
        },
        url: true
      }
    },
    messages: {
      // Step 1 Messages
      name: {
        required: window.i18n?.validation_messages?.template_name_required || "Template name is required.",
        minlength: window.i18n?.validation_messages?.template_name_minlength || "Template name must be at least 3 characters."
      },
      phishType: window.i18n?.validation_messages?.phishing_type_required || "Please select a phishing type.",
      
      // Step 3 Messages
      file_extension: "Please select a file extension.",
      file_name: {
        required: window.i18n?.validation_messages?.file_name_required || "File name is required.",
        minlength: window.i18n?.validation_messages?.file_name_minlength || "File name must be at least 2 characters."
      },
      
      // Step 4 Messages
      subject: {
        required: window.i18n?.validation_messages?.email_subject_required || "Email subject is required.",
        minlength: window.i18n?.validation_messages?.subject_minlength || "Subject must be at least 3 characters."
      },
      sender_email: {
        required: window.i18n?.validation_messages?.sender_email_required || "Sender email is required.",
        email: window.i18n?.validation_messages?.valid_email_required || "Please enter a valid email address."
      },
      phishing_smtp: {
        required: window.i18n?.validation_messages?.selectPhishingSmtp || "Please select an email domain."
      },
      sender_display_name: {
        required: window.i18n?.validation_messages?.sender_name_required || "Sender name is required.",
        minlength: window.i18n?.validation_messages?.sender_name_minlength || "Sender name must be at least 2 characters."
      },
      company_name: {
        required: window.i18n?.validation_messages?.company_name_required || "Company name is required.",
        minlength: window.i18n?.validation_messages?.company_name_minlength || "Company name must be at least 2 characters."
      },
      company_domain: {
        required: window.i18n?.validation_messages?.company_domain_required || "Company domain is required.",
        minlength: window.i18n?.validation_messages?.company_domain_minlength || "Company domain must be at least 3 characters."
      },
      sms_content: {
        required: window.i18n?.validation_messages?.sms_content_required || "SMS message is required.",
        maxlength: window.i18n?.validation_messages?.sms_content_maxlength || "SMS message must not exceed 160 characters."
      },
      
      // Step 5 Messages
      phish_url: {
        required: window.i18n?.validation_messages?.urlRequired || "URL is required.",
        url: window.i18n?.validation_messages?.urlInvalid || "Please enter a valid URL."
      },
      
      // Step 6 Messages
      webpage_url: {
        required: window.i18n?.validation_messages?.urlRequired || "URL is required.",
        url: window.i18n?.validation_messages?.urlInvalid || "Please enter a valid URL."
      }
    },
    errorClass: "text-red-500 text-sm mt-1",
    errorElement: "div",
    errorPlacement: function(error, element) {
      // For radio buttons and checkboxes, place error after the parent container
      if (element.attr("type") === "radio" || element.attr("type") === "checkbox") {
        error.insertAfter(element.closest('div'));
      } else {
        error.insertAfter(element);
      }
    },
    highlight: function (element) {
      $(element).addClass("border-red-500");
    },
    unhighlight: function (element) {
      $(element).removeClass("border-red-500");
    },
    // Don't submit form automatically - let handleNext control flow
    submitHandler: function(form) {
      form.submit();
    }
  });
  
  // Custom validation for CKEditor instances
  function validateCKEditor(editorName, errorMessage) {
    const editorData = CKEDITOR.instances[editorName] ? CKEDITOR.instances[editorName].getData().trim() : '';
    const editorContainer = $('#' + editorName).closest('div');
    
    // Remove existing error
    editorContainer.find('.ckeditor-error').remove();
    
    if (!editorData || editorData === '') {
      // Add error message
      editorContainer.append('<div class="ckeditor-error text-red-500 text-sm mt-2">' + errorMessage + '</div>');
      return false;
    }
    return true;
  }
  
  // Export validation function for use in system_create_template.js
  window.validateCurrentStep = function(currentStep, selectedPhishType) {
    let isValid = true;
    
    // Step 0: Basic Details
    if (currentStep === 0) {
      // Validate name
      if (!$('#name').valid()) {
        isValid = false;
      }
      
      // Validate phishType
      if (!$('input[name="phishType"]:checked').val()) {
        // Add error message for phishType below the options
        const phishTypeContainer = $('input[name="phishType"]').closest('div').parent();
        phishTypeContainer.find('.validation-error').remove();
        const errorMessage = window.i18n?.validation_messages?.phishing_type_required || 'Please select a phishing type.';
        phishTypeContainer.append(`<div class="validation-error text-red-500 text-sm mt-2">${errorMessage}</div>`);
        isValid = false;
      } else {
        // Remove error if present
        $('input[name="phishType"]').closest('div').parent().find('.validation-error').remove();
      }
    }
    
    // Step 1: Options Selection
    if (currentStep === 1) {
      const selectedOptions = $('input[name="options"]:checked').length;
      const checkboxContainer = $('#checkbox-options');
      checkboxContainer.find('.validation-error').remove();
      
      if (selectedOptions === 0) {
        const errorMessage = window.i18n?.validation_messages?.select_at_least_one_option || 'Please select at least one option.';
        checkboxContainer.append(`<div class="validation-error text-red-500 text-sm mt-2">${errorMessage}</div>`);
        isValid = false;
      }
    }
    
    // Step 2 (file_attachment_screen): File Details
    if (currentStep === 2) {
      if (!$('#file_extension').valid()) {
        isValid = false;
      }
      if (!$('input[name="file_name"]').valid()) {
        isValid = false;
      }
    }
    
    // Step 3 (phishing_content_screen): Email/SMS Content
    if (currentStep === 3) {
      if (selectedPhishType === 'email') {
        // Validate email fields
        if (!$('input[name="subject"]').valid()) {
          isValid = false;
        }
        if (!$('#sender_email').valid()) {
          isValid = false;
        }
        if (!$('#phishing_smtp').valid()) {
          isValid = false;
        }
        if (!$('#sender_display_name').valid()) {
          isValid = false;
        }
        if (!$('#companyName').valid()) {
          isValid = false;
        }
        if (!$('#companyDomain').valid()) {
          isValid = false;
        }
        
        // Validate CKEditor content
        if (!validateCKEditor('phishing_content', window.i18n?.validation_messages?.email_content_required || 'Email content is required.')) {
          isValid = false;
        }
      }
    }
    
    // Step 4 (url_phishing_screen): URL Phishing
    if (currentStep === 4) {
      const phishOption = $('input[name="phish_option"]:checked').val();
      const phishOptionContainer = $('input[name="phish_option"]').closest('.flex.flex-col');
      phishOptionContainer.find('.validation-error').remove();
      
      if (!phishOption) {
        const errorMessage = window.i18n?.validation_messages?.validationSelectPhishingOption || 'Please select a phishing option.';
        phishOptionContainer.append(`<div class="validation-error text-red-500 text-sm mt-2">${errorMessage}</div>`);
        isValid = false;
      }
      
      // If custom-url is selected, validate the URL field
      if (phishOption === 'custom-url') {
        const phishUrlInput = $('input[name="phish_url"]');
        if (phishUrlInput.length && !phishUrlInput.valid()) {
          isValid = false;
        }
      }
    }
    
    // Step 5 (phishing_webpage_screen): Phishing Webpage
    if (currentStep === 5) {
      // Validate phishing page content
      if (!validateCKEditor('phishing_page_content', window.i18n?.validation_messages?.phishing_page_content_required || 'Phishing page content is required.')) {
        isValid = false;
      }
    }
    
    // Step 6 (phishing_landing_page_screen): Landing Page
    if (currentStep === 6) {
      const landingOption = $('input[name="landing_option"]:checked').val();
      const landingOptionContainer = $('input[name="landing_option"]').closest('div');
      landingOptionContainer.find('.validation-error').remove();
      
      if (!landingOption) {
        const errorMessage = window.i18n ? window.i18n.__('system_template.create.validationSelectLandingPage') : 'Please select a landing page option.';
        landingOptionContainer.append(`<div class="validation-error text-red-500 text-sm mt-2">${errorMessage}</div>`);
        isValid = false;
      }
      
      // If custom landing page is selected, validate content
      if (landingOption === 'custom') {
        if (!validateCKEditor('landing_page_content', 'Landing page content is required.')) {
          isValid = false;
        }
      }
    }
    
    // Step 7 (sms_phishing_screen): SMS Content
    if (currentStep === 7) {
      if (!$('#sms_content').valid()) {
        isValid = false;
      }
    }
    
    return isValid;
  };
});
