
// let currentStep = 0;
$(document).ready(function () {

  // Custom validator: at least one service must be selected
  $.validator.addMethod('requireOneService', function(value, element) {
    return $('input[name="services[]"]:checked').length > 0;
  }, 'Please select at least one service.');

  // Disable past dates for licenseStartDate input
  var $licenseStartDate = $("#licenseStartDate, [name='licenseStartDate']");
  if ($licenseStartDate.length) {
    var today = new Date();
    var yyyy = today.getFullYear();
    var mm = String(today.getMonth() + 1).padStart(2, '0');
    var dd = String(today.getDate()).padStart(2, '0');
    var minDate = yyyy + '-' + mm + '-' + dd;
    $licenseStartDate.attr('min', minDate);
  }

  // Custom validator for current or future date
  $.validator.addMethod('notPastDate', function(value, element) {
    if (!value) return false;
    var inputDate = new Date(value);
    var today = new Date();
    today.setHours(0,0,0,0);
    return inputDate >= today;
  }, 'Date must be today or in the future.');

  // jQuery Validate for createSubscription form
  $('#createSubscription').validate({
    ignore: [],
    errorClass: 'input-error',
    errorElement: 'div',
    highlight: function(element) {
      $(element).addClass('border-red-500');
    },
    unhighlight: function(element) {
      $(element).removeClass('border-red-500');
    },
    errorPlacement: function(error, element) {
      error.addClass('text-red-500 text-xs mt-1');
      if (element.parent('.input-group').length) {
        error.insertAfter(element.parent());
      } else {
        error.insertAfter(element);
      }
    },
    rules: {
      'services[]': {
        requireOneService: true
      },
      selectedApplication: {
        required: true
      },
      totaluserlicense: {
        required: true,
        digits: true,
        min: 1
      },
      licenseStartDate: {
        required: true,
        date: true,
        notPastDate: true
      },
      selectedPackage: {
        required: true,
        min: 1
      },
      billAddress: {
        required: true
      },
      billCountry: {
        required: true
      },
      billState: {
        required: true
      },
      billCity: {
        required: true
      },
      billPostalCode: {
        required: true,
        digits: true
      },
      pymtDesc: {
        required: true
      },
      serviceCost: {
        required: true,
        number: true,
        min: 0
      },
      packageCost: {
        required: true,
        number: true,
        min: 0
      },
      totalUsers: {
        required: true,
        digits: true,
        min: 1
      },
      discount: {
        required: true,
        number: true,
        min: 0,
        max: 100
      }
    },
    messages: {
      'services[]': {
        requireOneService: 'Please select at least one service.'
      },
      selectedApplication: {
        required: 'Please select a product.'
      },
      totaluserlicense: {
        required: 'Please enter total user licenses.',
        digits: 'Only digits allowed.',
        min: 'Must be at least 1.'
      },
      licenseStartDate: {
        required: 'Please select a license start date.',
        date: 'Enter a valid date.',
        notPastDate: 'Date must be today or in the future.'
      },
      selectedPackage: {
        required: 'Please select a package.',
        min: 'Please select a valid package.'
      },
      billAddress: {
        required: 'Billing address is required.'
      },
      billCountry: {
        required: 'Country is required.'
      },
      billState: {
        required: 'State is required.'
      },
      billCity: {
        required: 'City is required.'
      },
      billPostalCode: {
        required: 'Postal code is required.',
        digits: 'Only digits allowed.'
      },
      pymtDesc: {
        required: 'Payment description is required.'
      },
      serviceCost: {
        required: 'Service cost is required.',
        number: 'Enter a valid number.',
        min: 'Cannot be negative.'
      },
      packageCost: {
        required: 'Package cost is required.',
        number: 'Enter a valid number.',
        min: 'Cannot be negative.'
      },
      totalUsers: {
        required: 'Total users is required.',
        digits: 'Only digits allowed.',
        min: 'Must be at least 1.'
      },
      discount: {
        required: 'Discount is required.',
        number: 'Enter a valid number.',
        min: 'Cannot be negative.',
        max: 'Cannot exceed 100%.'
      }
    }
  });

  $('#selectedApplication').on('change', function () {
    const appId = $(this).val();
    $('#selectedPackage').empty();
    $("#selectedPackage").append(
      `<option value="0" selected> Select Package  </option>`
    );

    if (appId) {
      $.ajax({
        url: `/package/applications/${appId}`,
        type: 'GET',
        success: function (data) {
          // console.log('data::::', data);
          const packages = data.packages;
          if (Array.isArray(packages) && packages.length > 0) {
            packages.forEach(pkg => {
              $('#selectedPackage').append(
                `<option value="${pkg.id}">${pkg.name}</option>`
              );
            });
          }
        },
        error: function (xhr, status, error) {
          console.error('Error fetching packages:', error);
        }
      });

    }
  });
  $('#nextBtn').on('click', function (e) {

    // alert('Next button clicked');
    if (currentStep === 0) {
      // alert('Loading services for application...');
      const selectedAppId = $('#selectedApplication').val();
      loadServices(selectedAppId)
    } else if (currentStep === 1) {
      // alert('Loading package and service costs...');
      retrievePackageCost();
      retrieveServiceCost();
    } else if (currentStep === 2) {
      // alert('Calculating payable amount...');
      calculatePayableAmount();
    }
  });

  $('#selectedPackage').on('change', function () {

    const selectedVal = $(this).val();
    // alert(selectedVal)
    if (selectedVal === "0" || !selectedVal) {
      $('#durationDays').val(0);
      $('#divDurationDays').show(); // hide div
    } else {
      $('#durationDays').val(0);
      $('#divDurationDays').hide(); // show div


    }


  });
  $('#discount').on('change', function () {
    calculatePayableAmount();
  });
  $('#packageCost').on('change', function () {
    calculatePayableAmount();
  });
  $('#serviceCost').on('change', function () {
    calculatePayableAmount();
  });

  // Trigger change on page load (optional)
  $('#selectedPackage').trigger('change');
});


function loadServices(appId) {
  // alert('Loading services for application ID: ' + appId);
  if (!appId) return;

  $.ajax({
    url: `/app_service/get-application-services/${appId}`,
    type: 'GET',
    success: function (data) {
      // alert('Services loaded successfully.');
      const appService = data.services;
      // console.log('appService:', appService);
      // console.table(Array.isArray(appService) ? appService : []);

      const annualContainer = $('#servicesAnnualContainer');
      const fixedContainer = $('#servicesFixedContainer');

      // Clear previous checkboxes
      annualContainer.empty();
      fixedContainer.empty();

      if (Array.isArray(appService) && appService.length > 0) {
        // alert(`Found ${appService.length} services for application ID: ${appId}`);
        appService.forEach(srv => {
          const checkboxHtml = `
            
              <label class="flex items-center gap-3 mb-3 cursor-pointer select-none">
                <input type="checkbox" class="mm-checkbox" 
                id="service-${srv.id}" name="services[]" value="${srv.id}">
               <span>
                ${srv.service_name}
                </span>
              </label>
             
          `;
          if (srv.service_type === 'Annual') {
            annualContainer.append(checkboxHtml);
          } else if (srv.service_type === 'Fixed') {
            fixedContainer.append(checkboxHtml);
          } else {
            console.warn(`Unknown service type: ${srv.service_type}`);
          }
        });
      } else {
        console.log('No services found for application:', appId);
      }
    },
    error: function (xhr, status, error) {
      console.error(`Error fetching services for appId ${appId}:`, error);
    }
  });
}



function calculatePayableAmount() {

  // Get references to the input fields and the span to display payable amount
  var packageCost = parseFloat($('#packageCost').val()) || 0;
  var serviceCost = parseFloat($('#serviceCost').val()) || 0;
  var totalUsers = parseInt($('#totalUsers').val()) || 0;
  var discountedValue = $('#discount').val() || 0;

  var totalAmount = packageCost + (serviceCost * totalUsers);


  var discountAmount = (totalAmount * discountedValue) / 100;
  var payableAmount = totalAmount - discountAmount;
  $('#ttlPayableAmt').val(payableAmount.toFixed(2))
  // var payableAmountSpan = document.getElementById("ttlPayableAmt");
  // payableAmountSpan.value = payableAmount.toFixed(2);

}

function retrieveServiceCost() {

  const selectedServiceIds = $('input[name="services[]"]:checked')
    .map(function () {
      return $(this).val();
    })
    .get();
  //  alert('Selected services:' + selectedServiceIds);
  if (selectedServiceIds.length === 0) {
    // alert('Please select at least one service.');
    return false; // Prevent step change
  }


  // Send selected IDs to backend API
  $.ajax({
    url: '/app_service/calculate-service-cost',  // Adjust to your actual route
    type: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({ serviceIds: selectedServiceIds }),
    success: function (response) {
      // alert('Cost from backend:' + response.cost);
      // alert('Total Price:' + response.cost);
      $('#totalUsers').val($('#totaluserlicense').val());
      $('#serviceCost').val(response.cost.toFixed(2));
    },
    error: function (xhr, status, error) {
      console.error('Error fetching total price:', error);
    }
  });

}


function retrievePackageCost() {

  const packageId = $('#selectedPackage').val() || 0;
  if (packageId > 0) {
    $.ajax({
      url: '/package/retrieve-package-cost/' + packageId,  // Adjust to your actual route
      type: 'GET',
      success: function (response) {
        // alert('Cost from backend:' + response.cost);

        $('#packageCost').val(response.cost.toFixed(2));
      },
      error: function (xhr, status, error) {
        console.error('Error fetching total price:', error);
      }
    });
  } else {
    $('#packageCost').val(0);
  }


}