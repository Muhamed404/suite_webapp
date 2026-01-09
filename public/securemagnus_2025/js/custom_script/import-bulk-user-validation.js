$(document).ready(function () {
    // Custom validator for .csv file extension
    $.validator.addMethod("csvFile", function (value, element) {
        if (element.files.length === 0) return false;
        const file = element.files[0];
        return file.name.toLowerCase().endsWith('.csv');
    }, "Please upload a valid .csv file.");

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
                alert("CSV header must be: " + expectedHeader);
                $("#csvFile").val('');
            }
        };
        reader.readAsText(file);
    });

    // Attach validation to the form
    $("#uploadBulkUser").validate({
        rules: {
            csvFile: { required: true, csvFile: true }
        },
        messages: {
            csvFile: "CSV file is required and must be in .csv format.<br>Ensure the header is: <b>email,first_name,last_name,contact,department</b><br>Each field should be separated by a comma."
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
            alert('Please select a valid product to proceed.');
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
                $('#alertLicenseAvailability').val('Available Users License: ' + response.filteredLicense.availableLicenses);
                $('#nextBtn').prop('disabled', false); // enable the button
                $('#nextBtn').removeClass('opacity-50 cursor-not-allowed'); // remove visual feedback
            },
            error: function () {
                // alert('Failed to fetch license availability');
                $('#alertLicenseAvailability').val('Available Users License: ' + 0);

                $('#nextBtn').prop('disabled', true); // disables the button
                $('#nextBtn').addClass('opacity-50 cursor-not-allowed'); // optional: visual feedback
            }
        });
    });
});