$(document).ready(function () {
  // Validate main form (replace #serviceRegistryForm with your actual form id)
  $("#serviceRegistryForm").validate({
    rules: {
      service_type: { required: true },
      service_name: { required: true, minlength: 2 },
      service_id: { required: true, minlength: 2 },
      public_key: { required: true, minlength: 32 }
    },
    messages: {
      service_type: "Service type is required.",
      service_name: "Service name is required (min 2 characters).",
      service_id: "Service ID is required (min 2 characters).",
      public_key: "Public key is required (min 32 characters)."
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