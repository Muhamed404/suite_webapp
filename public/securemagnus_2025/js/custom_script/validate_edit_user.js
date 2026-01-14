// File: validate_edit_user.js
// Description: jQuery validation for edit user form with conditional password validation

$(document).ready(function() {
    // Check if jQuery Validate plugin is available
    if (typeof $.fn.validate === 'undefined') {
        console.warn('jQuery Validate plugin not found. Loading fallback validation.');
        initFallbackValidation();
        return;
    }

    // Add custom validation method: password required only if confirmPassword is filled
    $.validator.addMethod('requiredIfConfirmFilled', function(value, element) {
        var confirmPassword = $('#confirmPassword').val();
        // If confirm password has value, new password is required
        if (confirmPassword && confirmPassword.trim() !== '') {
            return value && value.trim() !== '';
        }
        return true; // Not required if confirm is empty
    }, 'New password is required when confirm password is provided');

    // Add custom validation method: confirmPassword required only if newPassword is filled
    $.validator.addMethod('requiredIfNewFilled', function(value, element) {
        var newPassword = $('#newPassword').val();
        // If new password has value, confirm password is required
        if (newPassword && newPassword.trim() !== '') {
            return value && value.trim() !== '';
        }
        return true; // Not required if new password is empty
    }, 'Confirm password is required when new password is provided');

    // Add custom validation method: passwords must match if both are filled
    $.validator.addMethod('passwordMatch', function(value, element) {
        var newPassword = $('#newPassword').val();
        var confirmPassword = $('#confirmPassword').val();

        // Only validate if both fields have values
        if ((newPassword && newPassword.trim() !== '') || (confirmPassword && confirmPassword.trim() !== '')) {
            return newPassword === confirmPassword;
        }
        return true; // Valid if both are empty
    }, 'Passwords must match');

    // Add custom validation method: password complexity (only when password is provided)
    $.validator.addMethod('strongPassword', function(value, element) {
        // If password is provided, check complexity
        if (value && value.trim() !== '') {
            // At least 8 characters, one uppercase, one lowercase, one number, one special character
            return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(value);
        }
        return true; // Valid if empty
    }, 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character (@$!%*?&).');

    // Initialize jQuery Validation Plugin
    var validator = $('form').validate({
        // Validate on blur/change for better UX
        onfocusout: function(element) {
            $(element).valid();
        },
        onkeyup: function(element) {
            // Re-validate both password fields when either changes
            if ($(element).attr('id') === 'newPassword' || $(element).attr('id') === 'confirmPassword') {
                $('#newPassword').valid();
                $('#confirmPassword').valid();
            } else {
                $(element).valid();
            }
        },

        // Custom error placement for better UI
        errorElement: 'span',
        errorClass: 'error-message',
        errorPlacement: function(error, element) {
            error.addClass('text-red-500 text-sm mt-1 block');
            error.insertAfter(element);
        },

        // Highlight invalid fields
        highlight: function(element) {
            $(element).addClass('border-red-500 focus:ring-red-200 focus:border-red-500');
            $(element).removeClass('border-gray-300 focus:border-teal-400 focus:ring-teal-200');
        },

        // Remove highlight when valid
        unhighlight: function(element) {
            $(element).removeClass('border-red-500 focus:ring-red-200 focus:border-red-500');
            $(element).addClass('focus:border-teal-400 focus:ring-teal-200');
        },

        // Validation rules for all fields
        rules: {
            newPassword: {
                requiredIfConfirmFilled: true,
                strongPassword: true,
                passwordMatch: true
            },
            confirmPassword: {
                requiredIfNewFilled: true,
                passwordMatch: true
            },
            status: {
                required: true
            }
        },

        // Custom error messages
        messages: {
            newPassword: {
                requiredIfConfirmFilled: 'New password is required when confirm password is provided',
                strongPassword: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character (@$!%*?&).',
                passwordMatch: 'Passwords must match'
            },
            confirmPassword: {
                requiredIfNewFilled: 'Confirm password is required when new password is provided',
                passwordMatch: 'Passwords must match'
            },
            status: {
                required: 'Status is required'
            }
        }
    });

    // Re-validate both password fields when either changes
    $('#newPassword, #confirmPassword').on('keyup change', function() {
        $('#newPassword').valid();
        $('#confirmPassword').valid();
    });

    // Initial validation state check
    setTimeout(function() {
        $(':input:visible').each(function() {
            if ($(this).val()) {
                $(this).valid();
            }
        });
    }, 100);
});

// Fallback validation if jQuery Validate plugin is not available
function initFallbackValidation() {
    var $form = $('form');

    function validatePasswordFields() {
        var newPassword = $('#newPassword').val().trim();
        var confirmPassword = $('#confirmPassword').val().trim();
        var isValid = true;

        // Clear previous errors
        markFieldAsValid($('#newPassword'));
        markFieldAsValid($('#confirmPassword'));

        // If either field has a value, both must have values and must match
        if (newPassword || confirmPassword) {
            // Check if new password is empty
            if (!newPassword) {
                markFieldAsInvalid($('#newPassword'), 'New password is required when confirm password is provided');
                isValid = false;
            } else {
                // Validate password complexity
                var strongPasswordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
                if (!strongPasswordPattern.test(newPassword)) {
                    markFieldAsInvalid($('#newPassword'), 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character (@$!%*?&).');
                    isValid = false;
                }
            }

            // Check if confirm password is empty
            if (!confirmPassword) {
                markFieldAsInvalid($('#confirmPassword'), 'Confirm password is required when new password is provided');
                isValid = false;
            }

            // Check if passwords match (only if both have values)
            if (newPassword && confirmPassword && newPassword !== confirmPassword) {
                markFieldAsInvalid($('#confirmPassword'), 'Passwords must match');
                isValid = false;
            }
        }

        return isValid;
    }

    $form.on('submit', function(e) {
        var isValid = validatePasswordFields();

        if (!isValid) {
            e.preventDefault();
            // Focus on first error
            var $firstError = $form.find('.border-red-500').first();
            if ($firstError.length) {
                $firstError.focus();
            }
        }
    });

    // Real-time validation on input/change
    $('#newPassword, #confirmPassword').on('input change blur', function() {
        validatePasswordFields();
    });

    function markFieldAsInvalid($field, message) {
        $field.addClass('border-red-500 focus:ring-red-200 focus:border-red-500');
        $field.removeClass('border-gray-300 focus:border-teal-400 focus:ring-teal-200');

        if ($field.next('.error-message').length === 0) {
            $field.after('<span class="error-message text-red-500 text-sm mt-1 block">' + message + '</span>');
        } else {
            $field.next('.error-message').text(message);
        }
    }

    function markFieldAsValid($field) {
        $field.removeClass('border-red-500 focus:ring-red-200 focus:border-red-500');
        $field.addClass('focus:border-teal-400 focus:ring-teal-200');
        $field.next('.error-message').remove();
    }
}
