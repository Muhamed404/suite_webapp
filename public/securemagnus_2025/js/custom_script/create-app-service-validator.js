    $(function() {
      $("form[action='/app_service/create']").validate({
        rules: {
          application: {
            required: true
          },
          service_name: {
            required: true,
            minlength: 2
          },
          per_service_cost: {
            required: true,
            digits: true,
            min: 1
          },
          service_type: {
            required: true
          },
          service_detail: {
            required: true,
            minlength: 2
          }
        },
        messages: {
          application: "Please select a product.",
          service_name: {
            required: "Please enter a service name.",
            minlength: "Service name must be at least 2 characters."
          },
          per_service_cost: {
            required: "Please enter the service cost.",
            digits: "Please enter a valid number.",
            min: "Service cost must be at least 1."
          },
          service_type: "Please select a service type.",
          service_detail: {
            required: "Please enter a description.",
            minlength: "Description must be at least 2 characters."
          }
        },
        errorElement: 'div',
        errorClass: 'text-red-600 text-sm mt-1',
        highlight: function(element) {
          $(element).addClass('border-red-400');
        },
        unhighlight: function(element) {
          $(element).removeClass('border-red-400');
        }
      });
    });