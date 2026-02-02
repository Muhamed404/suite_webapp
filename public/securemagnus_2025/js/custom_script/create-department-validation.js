$(document).ready(function () {
  $("form[action='/department/']").validate({
    rules: {
      name: { required: true, minlength: 2 },
      description: { required: true, minlength: 5 }
    },
    messages: {
      name: departmentValidationMessages.name,
      description: departmentValidationMessages.description
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