// File: validate_create_package.js
// Description: jQuery validation for all input fields in create_package.ejs

$(document).ready(function() {
    // Check if jQuery Validate plugin is available
    if (typeof $.fn.validate === 'undefined') {
        console.warn('jQuery Validate plugin not found. Loading fallback validation.');
        initFallbackValidation();
        return;
    }

    // Initialize jQuery Validation Plugin
    var validator = $('#packageCreationForm').validate({
        // Don't validate on submit since stepper handles that
        onsubmit: false,

        // Validate on blur/change for better UX
        onfocusout: function(element) {
            $(element).valid();
        },
        onkeyup: function(element) {
            $(element).valid();
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
            // Step 1: Product Selection
            application: {
                required: true
            },
            package_type: {
                required: true
            },

            // Step 2: Package Details
            name: {
                required: true,
                minlength: 3,
                maxlength: 100
            },
            description: {
                required: true,
                minlength: 1,
                maxlength: 500
            },
            per_license_cost: {
                required: true,
                number: true,
                min: 1,
                max: 999999999
            },
            duration_days: {
                required: true,
                digits: true,
                min: 1,
                max: 3650
            },
            license_range_from: {
                required: true,
                digits: true,
                min: 1,
                max: 999999
            },
            license_range_to: {
                required: true,
                digits: true,
                min: 1,
                max: 999999
            }
        },

        // Custom error messages
        messages: {
            // Step 1 Messages
            application: {
                required: 'Please select a product/application'
            },
            package_type: {
                required: 'Please select a package type (On Premise or Cloud)'
            },

            // Step 2 Messages
            name: {
                required: 'Package name is required',
                minlength: 'Package name must be at least 3 characters long',
                maxlength: 'Package name cannot exceed 100 characters'
            },
            description: {
                required: 'Package description is required',
                minlength: 'Description must be at least 1 character long',
                maxlength: 'Description cannot exceed 500 characters'
            },
            per_license_cost: {
                required: 'License cost is required',
                number: 'Please enter a valid number',
                min: 'License cost must be at least 1',
                max: 'License cost is too large'
            },
            duration_days: {
                required: 'License duration is required',
                digits: 'Please enter a valid number of days',
                min: 'Duration must be at least 1 day',
                max: 'Duration cannot exceed 3650 days (10 years)'
            },
            license_range_from: {
                required: 'User range (From) is required',
                digits: 'Please enter a valid number',
                min: 'Minimum user range must be at least 1',
                max: 'Value is too large'
            },
            license_range_to: {
                required: 'User range (To) is required',
                digits: 'Please enter a valid number',
                min: 'Maximum user range must be at least 1',
                max: 'Value is too large'
            }
        }
    });

    // Custom validation method: license_range_to must be >= license_range_from
    $.validator.addMethod('greaterThanFrom', function(value) {
        var fromValue = parseInt($('#license_range_from').val());
        var toValue = parseInt(value);

        // If either field is empty, skip this validation
        if (!fromValue || !toValue) return true;

        return toValue >= fromValue;
    }, 'User range "To" must be greater than or equal to "From"');

    // Apply custom validation rule
    $('#license_range_to').rules('add', {
        greaterThanFrom: true
    });

    // Re-validate license_range_to when license_range_from changes
    $('#license_range_from').on('change keyup', function() {
        $('#license_range_to').valid();
    });

    // Expose validator globally for stepper to use
    window.validateFormAndToggleSubmit = function() {
        return validator.checkForm();
    };

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
    var $form = $('#packageCreationForm');

    function validateField($field) {
        var value = $field.val().trim();
        var fieldName = $field.attr('name');
        var fieldType = $field.attr('type');
        var min = parseFloat($field.attr('min'));
        var isValid = true;
        var errorMessage = '';

        // Skip disabled or hidden fields
        if ($field.is(':disabled') || !$field.is(':visible')) return true;

        // Required field validation
        if ($field.prop('required') && !value) {
            isValid = false;
            errorMessage = 'This field is required';
        }
        // Number and range validation
        else if (fieldType === 'number' && value) {
            var numValue = parseFloat(value);
            if (isNaN(numValue)) {
                isValid = false;
                errorMessage = 'Please enter a valid number';
            } else if (!isNaN(min) && numValue < min) {
                isValid = false;
                errorMessage = 'Value must be at least ' + min;
            }
        }
        // Text length validation
        else if (fieldName === 'name' && value) {
            if (value.length < 3) {
                isValid = false;
                errorMessage = 'Package name must be at least 3 characters';
            } else if (value.length > 100) {
                isValid = false;
                errorMessage = 'Package name cannot exceed 100 characters';
            }
        }
        else if (fieldName === 'description' && value) {
            if (value.length < 10) {
                isValid = false;
                errorMessage = 'Description must be at least 10 characters';
            } else if (value.length > 500) {
                isValid = false;
                errorMessage = 'Description cannot exceed 500 characters';
            }
        }
        // Range validation: license_range_to >= license_range_from
        else if (fieldName === 'license_range_to' && value) {
            var fromValue = parseInt($('#license_range_from').val());
            var toValue = parseInt(value);
            if (fromValue && toValue && toValue < fromValue) {
                isValid = false;
                errorMessage = 'User range "To" must be greater than or equal to "From"';
            }
        }

        if (!isValid) {
            markFieldAsInvalid($field, errorMessage);
        } else {
            markFieldAsValid($field);
        }

        return isValid;
    }

    $form.on('submit', function(e) {
        var isValid = true;
        $form.find('input, select, textarea').each(function() {
            if (!validateField($(this))) {
                isValid = false;
            }
        });

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
    $('input, select, textarea').on('input change blur', function() {
        validateField($(this));
    });

    // Re-validate license_range_to when license_range_from changes
    $('#license_range_from').on('input change', function() {
        validateField($('#license_range_to'));
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

    // Expose validator for stepper
    window.validateFormAndToggleSubmit = function() {
        var isValid = true;
        $form.find('input:visible, select:visible, textarea:visible').each(function() {
            if (!validateField($(this))) {
                isValid = false;
            }
        });
        return isValid;
    };
}
