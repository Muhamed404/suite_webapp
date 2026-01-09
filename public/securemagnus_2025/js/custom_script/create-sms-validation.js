$(document).ready(function () {
  $("#smsSettingsForm").validate({
    rules: {
      provider_name: { required: true, minlength: 2 },
      api_key: { required: true, minlength: 8 },
      sender_id: { required: true, minlength: 2 },
      status: { required: true }
    },
    messages: {
      provider_name: "SMS provider name is required.",
      api_key: "API Key is required and must be a POST URL.",
      sender_id: "Sender Name is required.",
      status: "Status is required."
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