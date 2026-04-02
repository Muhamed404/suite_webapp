$(document).ready(function () {
  // Strong password validation: min 8 chars, upper, lower, number, special
  $.validator.addMethod("strongPassword", function (value, element) {
    return this.optional(element) ||
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(value);
  }, "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.");

  $("#wizard-validation-form").validate({
    rules: {
      address: { required: true, minlength: 5 },
      postalCode: { required: true, digits: true, minlength: 4, maxlength: 10 },
      contact: { required: true, digits: true, minlength: 7, maxlength: 15 },
      email: { required: true, email: true },
      firstName: { required: true, minlength: 2 },
      lastName: { required: true, minlength: 2 },
      password: { strongPassword: true }
    },
    messages: {
      address: "Address is required.",
      postalCode: "Postal code is required and must be digits.",
      contact: "Contact number is required and must be digits.",
      email: "Valid email is required.",
      firstName: "First name is required.",
      lastName: "Last name is required."
    },
    errorClass: "text-red-500 text-sm mt-1",
    highlight: function (element) {
      $(element).addClass("border-red-500");
    },
    unhighlight: function (element) {
      $(element).removeClass("border-red-500");
    }
  });

  $('#email').on('blur', function () {
    const email = $(this).val();
    if (email) {
      $.ajax({
        url: '/phm/commons/check-duplicate-user?email=' + email,
        method: 'GET',
        success: function (response) {
          // console.log(JSON.stringify(response))
          if (response.isDuplicate === 'true') {

            $.Notification.autoHideNotify('warning', 'top right', 'Email is not available.', '');
            $('#email').val(''); // Reset the input field
          }
        },
        error: function () {
          $.Notification.autoHideNotify('error', 'top right', 'Error occured, try again.', '');
        }
      });
    }
  });

});
