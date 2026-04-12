$(document).ready(function () {
    // Strong password validation: min 8 chars, upper, lower, number, special
    $.validator.addMethod("strongPassword", function (value, element) {
        return this.optional(element) ||
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(value);
    }, "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.");

    $.validator.addMethod("strictEmail", function (value, element) {
        // basic RFC compliant pattern w/ required TLD (.domain)
        return this.optional(element) ||
            /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(value);
    }, "Please enter a valid email address with full domain (e.g., user@example.com)");

    $("#addUserForm").validate({
        rules: {
            role: { required: true },
            first_name: { required: true, minlength: 2 },
            last_name: { required: true, minlength: 2 },
            email: { required: true, strictEmail: true },
            contact: { required: true, digits: true, minlength: 10, maxlength: 15 },
            password: { required: true, strongPassword: true }
        },
        messages: {
            role: "User role is required.",
            first_name: "First name is required (minimum 2 characters).",
            last_name: "Last name is required (minimum 2 characters).",
            email: "Please enter a valid email address with full domain (e.g., user@example.com).",
            contact: "Contact number must be 10-15 digits.",
            password: "Password must be at least 8 characters and include uppercase, lowercase, number, and special character."
        },
        errorClass: "text-red-500 text-sm mt-1",
        errorElement: "div",
        highlight: function (element) {
            $(element).addClass("border-red-500");
        },
        unhighlight: function (element) {
            $(element).removeClass("border-red-500");
        },
        errorPlacement: function(error, element) {
            error.insertAfter(element);
        }
    });



    $('#application').on('change', function () {
        const selectedProduct = $(this).val();
        if (selectedProduct == 0) {
            alert('Please select a valid product to proceed.');
            return
        };
        // Show loading indicator
        // $('#alertLicenseAvailability').val('Loading...');

        $.ajax({
            url: `/license/retrieve/information/${selectedProduct}`, // Change this to your actual endpoint
            method: 'GET',
            // data: { product: selectedProduct },
            success: function (response) {
                // Assuming response.availableLicenses contains the number
                var licenseText = $('#alertLicenseAvailability').data('license-text') || 'Available Users License';
                var available = response.filteredLicense.availableLicenses;
                var phishLicenses = response.filteredLicense.phishLicenses;
                var awareLicenses = response.filteredLicense.awareLicenses;
                
                if (selectedProduct == 4) { // All
                    $('#alertLicenseAvailability').val('Phish: ' + (phishLicenses || 0) + ', Aware: ' + (awareLicenses || 0));
                    if ((phishLicenses > 0) && (awareLicenses > 0)) {
                        $('#nextBtn').prop('disabled', false); // enable the button
                        $('#nextBtn').removeClass('opacity-50 cursor-not-allowed bg-[var(--teal)] hover:bg-teal-500');
                        $('#nextBtn').addClass('bg-green-500 hover:bg-green-600'); // turn green
                    } else {
                        $('#nextBtn').prop('disabled', true); // disable the button
                        $('#nextBtn').addClass('opacity-50 cursor-not-allowed');
                        $('#nextBtn').removeClass('bg-green-500 hover:bg-green-600 bg-[var(--teal)] hover:bg-teal-500');
                    }
                } else {
                    $('#alertLicenseAvailability').val(licenseText + ': ' + available);
                    if (available > 0) {
                        $('#nextBtn').prop('disabled', false); // enable the button
                        $('#nextBtn').removeClass('opacity-50 cursor-not-allowed bg-[var(--teal)] hover:bg-teal-500');
                        $('#nextBtn').addClass('bg-green-500 hover:bg-green-600'); // turn green
                    } else {
                        $('#nextBtn').prop('disabled', true); // disable the button
                        $('#nextBtn').addClass('opacity-50 cursor-not-allowed');
                        $('#nextBtn').removeClass('bg-green-500 hover:bg-green-600 bg-[var(--teal)] hover:bg-teal-500');
                    }
                }
            },
            error: function () {
                // alert('Failed to fetch license availability');
                var licenseText = $('#alertLicenseAvailability').data('license-text') || 'Available Users License';
                $('#alertLicenseAvailability').val(licenseText + ': ' + 0);

                $('#nextBtn').prop('disabled', true); // disables the button
                $('#nextBtn').addClass('opacity-50 cursor-not-allowed'); // optional: visual feedback
            }
        });
    });

    $('#email').on('blur', function () {
        const email = $(this).val();
        const $emailField = $(this);
        
        // Only check if email passes basic validation
        if (email && $emailField.valid()) {
            $.ajax({
                url: '/phm/commons/check-duplicate-user?email=' + email,
                method: 'GET',
                success: function (response) {
                    if (response.isDuplicate === 'true') {
                        showCustomToast('error', "Email is already taken. Please use a different email address.");
                        
                        // Mark field as invalid but don't clear it
                        $emailField.addClass('border-red-500');
                        
                        // Add error message if not already present
                        if (!$emailField.next('.email-duplicate-error').length) {
                            $emailField.after('<div class="email-duplicate-error text-red-500 text-sm mt-1">This email is already taken.</div>');
                        }
                    } else {
                        // Remove duplicate error if email is now available
                        $emailField.next('.email-duplicate-error').remove();
                    }
                },
                error: function () {
                    showCustomToast('error', "Error checking email availability. Please try again.");
                }
            });
        }
    });

    // Remove duplicate error when user starts typing again
    $('#email').on('input', function() {
        $(this).next('.email-duplicate-error').remove();
    });

    // Real-time validation to enable/disable submit button
    window.validateFormAndToggleSubmit = function() {
        const role = $('#role').val();
        const firstName = $('#first_name').val();
        const lastName = $('#last_name').val();
        const email = $('#email').val();
        const contact = $('#contact').val();
        const password = $('#password').val();

        // Check all required fields
        const isRoleValid = role && role !== '';
        const isFirstNameValid = firstName && firstName.trim().length >= 2;
        const isLastNameValid = lastName && lastName.trim().length >= 2;
        const isEmailValid = email && /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email);
        const isContactValid = contact && /^\d{10,15}$/.test(contact);
        const isPasswordValid = password && /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password);

        // Check if all validations pass
        const isFormValid = isRoleValid && isFirstNameValid && isLastNameValid && isEmailValid && isContactValid && isPasswordValid;

        // Enable/disable submit button
        const $nextBtn = $('#nextBtn');
        if (isFormValid) {
            $nextBtn.prop('disabled', false);
            $nextBtn.removeClass('opacity-50 cursor-not-allowed bg-gray-400');
            $nextBtn.addClass('bg-[var(--teal)] hover:bg-teal-500');
        } else {
            $nextBtn.prop('disabled', true);
            $nextBtn.addClass('opacity-50 cursor-not-allowed bg-gray-400');
            $nextBtn.removeClass('bg-[var(--teal)] hover:bg-teal-500');
        }
    };

    // Attach real-time validation to all form fields
    $('#role, #first_name, #last_name, #email, #contact, #password').on('input change blur', function() {
        window.validateFormAndToggleSubmit();
    });

    // Initial check on page load
    window.validateFormAndToggleSubmit();

    // Add click handler to show specific alerts for missing fields
    $('#nextBtn').on('click', function(e) {
        const role = $('#role').val();
        
        // Check role first - only show text error, no toast
        if (!role || role === '') {
            e.stopImmediatePropagation();
            $('#role').addClass('border-red-500');
            
            // Remove existing error if present
            $('#role').next('.role-error').remove();
            
            // Add error message below the role field
            var errorMsg = $('#addUserForm').data('select-role-error') || 'Please select a user role before proceeding.';
            $('#role').after('<div class="role-error text-red-500 text-sm mt-1">' + errorMsg + '</div>');
            $('#role').focus();
            return false;
        }
    });

    // Remove error message and red border when user selects a role
    $('#role').on('change', function() {
        $(this).removeClass('border-red-500');
        $(this).next('.role-error').remove();
    });
});