/**
 * SMTP Configuration Form Validator
 * Custom jQuery validation rules and form management for SMTP settings
 */

// Initialize SMTP form validation and management
function initSMTPFormValidator(config) {
  $(document).ready(function() {
    // Custom validation methods must be added before validator initialization
    // Custom validation method for hostname pattern
    $.validator.addMethod("pattern", function(value, element, pattern) {
      if (this.optional(element)) {
        return true;
      }
      if (typeof pattern === 'string') {
        pattern = new RegExp(pattern);
      }
      return pattern.test(value);
    }, window.i18n?.validation_messages?.enter_valid_format || "Please enter a valid format");

    // Custom validation method to warn about common SMTP ports
    $.validator.addMethod("commonPort", function(value, element) {
      var port = parseInt(value);
      var commonPorts = [25, 465, 587, 2525];
      // This is just a warning method, always return true for validation
      return true;
    }, window.i18n?.validation_messages?.ensure_correct_smtp_port || "Ensure this is the correct SMTP port");

    // Initialize form validation
    $('#smtpSettingsForm').validate({
      rules: {
        org: {
          required: true,
          minlength: 2,
          maxlength: 100
        },
        host: {
          required: true,
          minlength: 3,
          maxlength: 1000,
          // Validate hostname format (domain or IP)
          
        },
        port: {
          required: true,
          number: true,
          min: 1,
          max: 65535,
          commonPort: true
        },
        smtp_account: {
          required: function() { return $('#is_authenticated').is(':checked'); },
          minlength: 3,
          maxlength: 1000
        },
        sender_email: {
          required: true,
          email: true,
          maxlength: 250
        },
        smtp_password: {
          required: function() { return $('#is_authenticated').is(':checked'); },
          minlength: 6,
          maxlength: 1000
        },
      },
      messages: {
        org: {
          required: window.i18n?.validation_messages?.organization_name_required || "Organization name is required",
          minlength: window.i18n?.validation_messages?.organization_name_minlength || "Organization name must be at least 2 characters",
          maxlength: window.i18n?.validation_messages?.organization_name_maxlength || "Organization name cannot exceed 100 characters"
        },
        host: {
          required: window.i18n?.validation_messages?.smtp_host_required || "SMTP host name is required",
          minlength: window.i18n?.validation_messages?.host_minlength || "Host name must be at least 3 characters",
          maxlength: window.i18n?.validation_messages?.host_maxlength || "Host name cannot exceed 1000 characters",
          pattern: window.i18n?.validation_messages?.valid_hostname_ip || "Please enter a valid hostname or IP address"
        },
        port: {
          required: window.i18n?.validation_messages?.port_required || "Port number is required",
          number: window.i18n?.validation_messages?.valid_port_number || "Please enter a valid port number",
          min: window.i18n?.validation_messages?.port_min || "Port must be between 1 and 65535",
          max: window.i18n?.validation_messages?.port_max || "Port must be between 1 and 65535"
        },
        smtp_account: {
          required: window.i18n?.validation_messages?.service_account_required || "Service account is required",
          minlength: window.i18n?.validation_messages?.service_account_minlength || "Service account must be at least 3 characters",
          maxlength: window.i18n?.validation_messages?.service_account_maxlength || "Service account cannot exceed 1000 characters"
        },
        sender_email: {
          required: window.i18n?.validation_messages?.sender_email_required || "Sender email is required",
          email: window.i18n?.validation_messages?.valid_email || "Please enter a valid email address",
          maxlength: window.i18n?.validation_messages?.sender_email_maxlength || "Sender email cannot exceed 250 characters"
        },
        smtp_password: {
          required: window.i18n?.validation_messages?.password_required || "Password is required",
          minlength: window.i18n?.validation_messages?.password_minlength || "Password must be at least 6 characters",
          maxlength: window.i18n?.validation_messages?.password_maxlength || "Password cannot exceed 1000 characters"
        },
      },
      errorElement: 'span',
      errorPlacement: function(error, element) {
        // Don't place errors inline, we'll show them in the alert box
      },
      highlight: function(element) {
        $(element).removeClass('focus:ring-teal-400').addClass('border-red-500 focus:ring-red-400');
      },
      unhighlight: function(element) {
        $(element).removeClass('border-red-500 focus:ring-red-400').addClass('focus:ring-teal-400');
      }
    });

    // Override form submit to show validation errors
    $('#smtpSettingsForm').on('submit', function(e) {
      // Clear any existing validation error
      $('#step-validation-error').remove();
      
      // Check if form is valid
      if (!$(this).valid()) {
        e.preventDefault();
        // Collect all error messages
        var validator = $(this).validate();
        var errors = [];
        for (var field in validator.errorMap) {
          errors.push(validator.errorMap[field]);
        }
        if (errors.length > 0) {
          showValidationError(errors.join('<br>'));
        }
        return false;
      }
    });

    // Function to check if all required fields are filled
    function checkFormValidity() {
      var host = $('#host').val().trim();
      var port = $('#port').val().trim();
      var sender_email = $('#sender_email').val().trim();
      var isAuthenticated = $('#is_authenticated').is(':checked');

      if (!isAuthenticated) {
        return host && port && sender_email;
      }

      var smtp_account = $('#smtp_account').val().trim();
      var smtp_password = $('#smtp_password').val().trim();
      return host && port && smtp_account && sender_email && smtp_password;
    }

    // Function to enable save button
    function enableSaveButton() {
      $('#saveButton')
        .prop('disabled', false)
        .removeClass('bg-gray-400 cursor-not-allowed')
        .addClass('bg-teal-500 hover:bg-teal-600 cursor-pointer');
    }

    // Function to disable save button
    function disableSaveButton() {
      $('#saveButton')
        .prop('disabled', true)
        .removeClass('bg-teal-500 hover:bg-teal-600 cursor-pointer')
        .addClass('bg-gray-400 cursor-not-allowed');
    }

    // Always enable save button by default
    enableSaveButton();

    // Add real-time validation on blur
    $('#smtpSettingsForm input, #smtpSettingsForm textarea').on('blur', function() {
      $(this).valid();
      // Check if there are any invalid fields and show error
      var validator = $('#smtpSettingsForm').validate();
      var hasErrors = false;
      var errors = [];
      for (var field in validator.errorMap) {
        hasErrors = true;
        errors.push(validator.errorMap[field]);
      }
      if (hasErrors) {
        showValidationError(errors.join('<br>'));
      } else {
        $('#step-validation-error').remove();
      }
    });

    // Clear validation error on focus
    $('#smtpSettingsForm input, #smtpSettingsForm textarea').on('focus', function() {
      $(this).removeClass('border-red-500 focus:ring-red-400');
      $(this).next('span.text-red-500').remove();
      // Also remove the alert box error
      $('#step-validation-error').remove();
    });

    // Port number additional validation for common SMTP ports
    $('#port').on('change', function() {
      var port = parseInt($(this).val());
      var portInfo = {
        25: 'Standard SMTP (often blocked by ISPs)',
        465: 'SMTP over SSL (SMTPS)',
        587: 'SMTP with STARTTLS (recommended)',
        2525: 'Alternative SMTP port'
      };

      // Remove existing port info
      $('#port-info').remove();

      if (portInfo[port]) {
        $('<span id="port-info" class="text-blue-500 text-sm mt-1 block">' + portInfo[port] + '</span>')
          .insertAfter($(this));
      }
    });

    // Test Connection Handler
    $('#testConnection').on('click', function () {
      // Check if form is valid before testing
      if (!checkFormValidity()) {
        showCustomToast('error', window.i18n?.validation_messages?.fill_required_fields_before_testing || 'Please fill in all required fields before testing connection.');
        return;
      }

      // Validate form using jQuery validator
      if (!$('#smtpSettingsForm').valid()) {
        showCustomToast('error', window.i18n?.validation_messages?.fix_validation_errors_before_testing || 'Please fix all validation errors before testing connection.');
        return;
      }

      // Disable test button during test
      var $testBtn = $(this);
      var originalText = $testBtn.text();
      $testBtn.prop('disabled', true).text('Testing...');
      var testUrl = '/settings/smtp/test-connection/' + config.orgId;
        // ? '/phm/phishing-smtp/test/' + config.smtpId
        // : '/settings/smtp/test-connection?organization=' + config.orgId;

      $.ajax({
        url: testUrl,
        type: 'GET',
        dataType: 'json',
        success: function (response) {
          if (response.success) {
            showCustomToast('success', response.message || window.i18n?.validation_messages?.smtp_test_connection_successful || "SMTP TEST: CONNECTION SUCCESSFUL.");
          } else {
            showCustomToast('error', response.message || window.i18n?.validation_messages?.smtp_test_connection_failed || "SMTP TEST: CONNECTION FAILED.");
          }
        },
        error: function () {
          showCustomToast('error', window.i18n?.validation_messages?.smtp_test_connection_failed || "SMTP TEST: ISSUE IN CONNECTION FAILURE.");
        },
        complete: function() {
          // Re-enable test button
          $testBtn.prop('disabled', false).text(originalText);
        }
      });
    });
  });
}

// Show validation error in alert box format like email campaign page
function showValidationError(message) {
  // Create or get error message container
  let errorContainer = document.getElementById('step-validation-error');

  if (!errorContainer) {
    errorContainer = document.createElement('div');
    errorContainer.id = 'step-validation-error';
    errorContainer.className = 'bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4';
    errorContainer.setAttribute('role', 'alert');

    // Insert before the form
    const formElement = document.getElementById('smtpSettingsForm');
    if (formElement) {
      formElement.parentNode.insertBefore(errorContainer, formElement);
    }
  }

  errorContainer.innerHTML = `
    <div class="flex items-start">
      <span class="flex-shrink-0 mr-2">⚠️</span>
      <div class="flex-1">
        <strong class="font-medium">${window.i18n?.validation_messages?.validation_error || 'Validation Error:'}</strong>
        <span class="block mt-1">${message}</span>
      </div>
      <button type="button" class="ml-4 text-red-700 hover:text-red-900" onclick="this.parentElement.parentElement.remove()">
        ✕
      </button>
    </div>
  `;

  errorContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
