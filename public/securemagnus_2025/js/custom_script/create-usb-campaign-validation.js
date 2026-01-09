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
      name: "Campaign name is required.",
      // description: "Description is required (min 5 characters).",
      startDate: "Start date and time are required.",
      endDate: "End date and time are required.",
      noOfUSB: "Number of USBs is required and must be a positive number.",
      envVariable: "Environment variable is required.",
      filename: "File name is required."
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