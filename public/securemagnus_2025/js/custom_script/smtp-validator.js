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
          maxlength: 255,
          // Validate hostname format (domain or IP)
          pattern: /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$|^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
        },
        port: {
          required: true,
          number: true,
          min: 1,
          max: 65535,
          commonPort: true
        },
        smtp_account: {
          required: true,
          minlength: 3,
          maxlength: 255
        },
        smtp_password: {
          required: true,
          minlength: 6,
          maxlength: 255
        }
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
          maxlength: window.i18n?.validation_messages?.host_maxlength || "Host name cannot exceed 255 characters",
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
          maxlength: window.i18n?.validation_messages?.service_account_maxlength || "Service account cannot exceed 255 characters"
        },
        smtp_password: {
          required: window.i18n?.validation_messages?.password_required || "Password is required",
          minlength: window.i18n?.validation_messages?.password_minlength || "Password must be at least 6 characters",
          maxlength: window.i18n?.validation_messages?.password_maxlength || "Password cannot exceed 255 characters"
        }
      },
      errorElement: 'span',
      errorPlacement: function(error, element) {
        error.addClass('text-red-500 text-sm mt-1 block');
        error.insertAfter(element);
      },
      highlight: function(element) {
        $(element).removeClass('focus:ring-teal-400').addClass('border-red-500 focus:ring-red-400');
      },
      unhighlight: function(element) {
        $(element).removeClass('border-red-500 focus:ring-red-400').addClass('focus:ring-teal-400');
      },
      submitHandler: function(form) {
        // Form is valid, submit it
        form.submit();
      }
    });

    // Function to check if all required fields are filled
    function checkFormValidity() {
      var host = $('#host').val().trim();
      var port = $('#port').val().trim();
      var smtp_account = $('#smtp_account').val().trim();
      var smtp_password = $('#smtp_password').val().trim();

      return host && port && smtp_account && smtp_password;
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
    $('#smtpSettingsForm input').on('blur', function() {
      $(this).valid();
    });

    // Clear validation error on focus
    $('#smtpSettingsForm input').on('focus', function() {
      $(this).removeClass('border-red-500 focus:ring-red-400');
      $(this).next('span.text-red-500').remove();
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

      var orgId = config.orgId;
      $.ajax({
        url: '/settings/smtp/test-connection?organization=' + orgId,
        type: 'GET',
        dataType: 'json',
        success: function (response) {
          // Check different response structures
          if (response.message && response.message.message && response.message.message.Code == 200) {
            showCustomToast('success', window.i18n?.validation_messages?.smtp_test_connection_successful || "SMTP TEST: CONNECTION SUCCESSFUL.");
          } else if (response.message && response.message.alertType === 'success') {
            showCustomToast('success', window.i18n?.validation_messages?.smtp_test_connection_successful || "SMTP TEST: CONNECTION SUCCESSFUL.");
          } else {
            showCustomToast('error', window.i18n?.validation_messages?.smtp_test_connection_failed || "SMTP TEST: CONNECTION FAILED.");
          }
        },
        error: function (jqXHR, textStatus, errorThrown) {
          showCustomToast('error', window.i18n?.validation_messages?.smtp_test_connection_issue || "SMTP TEST: ISSUE IN CONNECTION FAILURE.");
        },
        complete: function() {
          // Re-enable test button
          $testBtn.prop('disabled', false).text(originalText);
        }
      });
    });
  });
}
