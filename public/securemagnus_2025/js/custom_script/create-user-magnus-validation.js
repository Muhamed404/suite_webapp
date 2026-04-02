$(document).ready(function () {

    $.validator.addMethod("strongPassword", function (value, element) {
        return this.optional(element) ||
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(value);
    }, window.userValidationMessages.password);

    $.validator.addMethod("strictEmail", function (value, element) {
        // basic RFC compliant pattern w/ required TLD (.domain)
        return this.optional(element) ||
            /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(value);
    }, window.userValidationMessages.email);


    $('#securemagnusUserForm').validate({
        rules: {
            role: {
                required: true
            },
            contact: {
                required: true,
                digits: true,
                minlength: 10,
                maxlength: 15
            },
            first_name: {
                required: true,
                minlength: 2
            },
            last_name: {
                required: true,
                minlength: 2
            },
            email: { required: true, strictEmail: true },

            password: { required: true, strongPassword: true }

        },
        messages: window.userValidationMessages,
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
});
