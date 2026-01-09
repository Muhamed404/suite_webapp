$(document).ready(function () {

    $.validator.addMethod("strongPassword", function (value, element) {
        return this.optional(element) ||
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(value);
    }, "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.");

    $.validator.addMethod("strictEmail", function (value, element) {
        // basic RFC compliant pattern w/ required TLD (.domain)
        return this.optional(element) ||
            /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(value);
    }, "Please enter a valid email address with full domain (e.g., user@example.com)");


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
        messages: {
            role: {
                required: "Please select a user role."
            },
            contact: {
                required: "Please enter a contact number.",
                digits: "Contact number must be digits only.",
                minlength: "Contact number must be at least 10 digits.",
                maxlength: "Contact number must not exceed 15 digits."
            },
            first_name: {
                required: "Please enter first name.",
                minlength: "First name must be at least 2 characters."
            },
            last_name: {
                required: "Please enter last name.",
                minlength: "Last name must be at least 2 characters."
            },
            email: "Please enter a valid email address with full domain (e.g., user@example.com).",

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
});
