$(document).ready(function () {
  $("#smsSettingsForm").validate({
    rules: {
      provider_name: { required: true, minlength: 2 },
      api_key: { required: true, minlength: 8 },
      sender_id: { required: true, minlength: 2 },
      status: { required: true }
    },
    messages: {
      provider_name: {
        required: window.smsValidationMessages.provider_required,
        minlength: window.smsValidationMessages.provider_minlength
      },
      api_key: {
        required: window.smsValidationMessages.api_key_required,
        minlength: window.smsValidationMessages.api_key_minlength
      },
      sender_id: {
        required: window.smsValidationMessages.sender_id_required,
        minlength: window.smsValidationMessages.sender_id_minlength
      },
      status: {
        required: window.smsValidationMessages.status_required
      }
    },
    errorClass: "text-red-500 text-sm mt-1",
    highlight: function (element) {
      $(element).addClass("border-red-500");
    },
    unhighlight: function (element) {
      $(element).removeClass("border-red-500");
    }
  });
});