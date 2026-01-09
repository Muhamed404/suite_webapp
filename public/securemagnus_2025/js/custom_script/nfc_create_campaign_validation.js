$(document).ready(function () {
  // NFC Campaign Form Validation
  $("#nfcCampaignForm").validate({
    rules: {
      name: { required: true, minlength: 2 },
      noOfTags: { required: true, digits: true, min: 1 },
  
    },
    messages: {
      name: "Campaign name is required (min 2 characters).",
 
      noOfTags: "Please enter a valid tag quantity (minimum 1).",
  
    },
    errorClass: "text-red-500 text-sm mt-1",
    highlight: function (element) {
      $(element).addClass("border-red-500");
    },
    unhighlight: function (element) {
      $(element).removeClass("border-red-500");
    }
  });

  // Validate on change/blur for better UX
  $('#name').on('blur', function () { $(this).valid(); });
  $('#noOfTags').on('blur', function () { $(this).valid(); });

});

