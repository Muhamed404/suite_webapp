$(document).ready(function () {
    // Custom validator for .csv file extension
    $.validator.addMethod("csvFile", function (value, element) {
        if (element.files.length === 0) return false;
        const file = element.files[0];
        return file.name.toLowerCase().endsWith('.csv');
    }, function(value, element) {
        if (element.files.length === 0) {
            var required = $('#uploadBulkUser').data('csv-file-required') || 'CSV file is required and must be in .csv format.';
            var ensure = $('#uploadBulkUser').data('csv-header-ensure') || 'Ensure the header is: email,first_name,last_name,contact,department';
            var separated = $('#uploadBulkUser').data('csv-fields-separated') || 'Each field should be separated by a comma';
            return required + '<br>' + ensure + '<br>' + separated;
        } else {
            return $('#uploadBulkUser').data('csv-upload-valid') || 'Please upload a valid .csv file.';
        }
    });

    // Optional: Validate CSV header format
    $("#csvFile").on("change", function () {
        const file = this.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (e) {
            const text = e.target.result;
            const firstLine = text.split('\n')[0].trim();
            const expectedHeader = "email,first_name,last_name,contact,department";
            if (!firstLine.toLowerCase().startsWith(expectedHeader)) {
                var headerMsg = $('#uploadBulkUser').data('csv-header-must-be') || 'CSV header must be: ';
                alert(headerMsg + expectedHeader);
                $("#csvFile").val('');
            }
        };
        reader.readAsText(file);
    });

    // Attach validation to the form
    $("#uploadBulkUser").validate({
        rules: {
            csvFile: { csvFile: true }
        },
        errorClass: "text-red-500 text-sm mt-1",
        highlight: function (element) {
            $(element).addClass("border-red-500");
        },
        unhighlight: function (element) {
            $(element).removeClass("border-red-500");
        }
    });



    $('#application').on('change', function () {
        const selectedProduct = $(this).val();
        if (selectedProduct == 0) {
            var productMsg = $('#uploadBulkUser').data('select-valid-product') || 'Please select a valid product to proceed.';
            alert(productMsg);
            return
        };
        // Show loading indicator
        // $('#alertLicenseAvailability').val('Loading...');

        $.ajax({
            url: `/license/retrieve/information/${selectedProduct}`, // Change this to your actual endpoint
            method: 'GET',
            // data: { product: selectedProduct },
            success: function (response) {
                // Assuming response.availableLicenses contains the number
                var licenseText = $('#alertLicenseAvailability').data('license-text') || 'Available Users License';
                $('#alertLicenseAvailability').val(licenseText + ': ' + response.filteredLicense.availableLicenses);
                $('#nextBtn').prop('disabled', false); // enable the button
                $('#nextBtn').removeClass('opacity-50 cursor-not-allowed'); // remove visual feedback
            },
            error: function () {
                // alert('Failed to fetch license availability');
                var licenseText = $('#alertLicenseAvailability').data('license-text') || 'Available Users License';
                $('#alertLicenseAvailability').val(licenseText + ': ' + 0);

                $('#nextBtn').prop('disabled', true); // disables the button
                $('#nextBtn').addClass('opacity-50 cursor-not-allowed'); // optional: visual feedback
            }
        });
    });
});