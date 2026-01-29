$(document).ready(function () {
  $("#usbCampaignForm").validate({
    rules: {
      name: { required: true, minlength: 2 },
      // description: { required: true, minlength: 5 },
      startDate: { required: true, date: true },
      endDate: { required: true, date: true },
      noOfUSB: { required: true, digits: true, min: 1 },
      envVariable: { required: true, minlength: 2 },
      filename: { required: true, minlength: 2 }
    },
    messages: {
      name: window.i18n?.validation_messages?.usb_campaign_name_required || "Campaign name is required.",
      // description: "Description is required (min 5 characters).",
      startDate: window.i18n?.validation_messages?.start_time_required || "Start date and time are required.",
      endDate: window.i18n?.validation_messages?.end_time_required || "End date and time are required.",
      noOfUSB: window.i18n?.validation_messages?.usb_no_of_usb_required || "Number of USBs is required and must be a positive number.",
      envVariable: window.i18n?.validation_messages?.usb_env_variable_required || "Environment variable is required.",
      filename: window.i18n?.validation_messages?.usb_filename_required || "File name is required."
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