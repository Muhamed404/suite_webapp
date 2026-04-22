$(document).ready(function () {
  // Strong password validation: min 8 chars, upper, lower, number, special
  $.validator.addMethod("strongPassword", function (value, element) {
    return this.optional(element) ||
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(value);
  }, window.organizationValidationMessages.password);

  $("#createOrganization").validate({
    rules: {
      name: { required: true, minlength: 2 },
      address: { required: true, minlength: 5 },
      postalCode: { required: true, digits: true, minlength: 4, maxlength: 10 },
      contact: { required: true, digits: true, minlength: 7, maxlength: 15 },
      country: { required: true },
      state: { required: true },
      city: { required: true },
      firstName: { required: true, minlength: 2 },
      lastName: { required: true, minlength: 2 },
      email: { required: true, email: true },
      password: { required: true, strongPassword: true }
    },
    messages: window.organizationValidationMessages,
    errorClass: "text-red-500 text-sm mt-1",
    errorElement: "div",
    errorPlacement: function (error, element) {
      const errorId = element.attr("id") + "-error";
      if ($("#" + errorId).length) {
        $("#" + errorId).html(error.html());
      } else {
        error.attr("id", errorId);
        error.insertAfter(element);
      }
    },
    highlight: function (element) {
      $(element).addClass("border-red-500");
    },
    unhighlight: function (element) {
      $(element).removeClass("border-red-500");
    }
  });


  // Event listener for country dropdown change
  $("#country").change(async function () {
    const selectedCountryId = $(this).val();
    // Call the API to fetch states based on selected country
    try {
      const response = await $.ajax({
        url: `/phm/commons/states/${selectedCountryId}`,
        method: "GET",
      });

      const states = response.states;

      // Populate state dropdown with fetched states
      $("#state").empty(); // Clear existing options
      $("#city").empty(); // Clear existing options
      $("#state").append(
        `<option value="" selected disabled> Select State  </option>`
      );

      states.forEach((state) => {
        // console.log(state.name)
        $("#state").append(
          `<option value="${state.id}">${state.name}</option>`
        );
      });
    } catch (error) {
      console.error("Error fetching states:", error);
    }
  });

  // Event listener for city dropdown change
  $("#state").change(async function () {
    const selectedStateId = $(this).val();
    // Call the API to fetch states based on selected country
    try {
      const response = await $.ajax({
        url: `/phm/commons/cities/${selectedStateId}`,
        method: "GET",
      });

      const cities = response.cities;

      // Populate state dropdown with fetched states
      $("#city").empty(); // Clear existing options
      cities.forEach((city) => {
        // console.log(city.name);
        $("#city").append(`<option value="${city.id}">${city.name}</option>`);
      });
    } catch (error) {
      console.error("Error fetching cities:", error);
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

            showCustomToast('error', window.organizationValidationMessages.emailTaken);
            
            $('#email').val(''); // Reset the input field
          }
        },
        error: function () {
          showCustomToast('error', window.organizationValidationMessages.errorOccurred);
        }
      });
    }
  });

  $('#name').on('blur', function () {
    const name = $(this).val();
    if (email) {
      $.ajax({
        url: '/phm/commons/check-duplicate-organization?name=' + name,
        method: 'GET',
        success: function (response) {
          // console.log(JSON.stringify(response))
          if (response.isDuplicate === 'true') {

            showCustomToast('error', window.organizationValidationMessages.nameTaken);

            $('#name').val(''); // Reset the input field
          }
        },
        error: function () {
          showCustomToast('error', window.organizationValidationMessages.errorOccurred);
        }
      });
    }
  });

});


