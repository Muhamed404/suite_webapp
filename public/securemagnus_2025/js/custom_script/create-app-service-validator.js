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
        messages: window.validationMessages,
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