document.addEventListener('DOMContentLoaded', function () {
  const modal = document.getElementById('subscriptionServicesModal');
  const closeBtn = document.getElementById('closeServicesModal');
  const closeDoneBtn = document.getElementById('closeDoneModal');
  const openBtns = document.querySelectorAll('.openServicesModalBtn');

  openBtns.forEach(btn => {
    btn.addEventListener('click', function () {
      const subId = btn.getAttribute('data-subscription');

      // Show modal
      if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
      }

      // Clear previous content
      document.getElementById('annualServiceContainer').innerHTML = '';
      document.getElementById('fixedServiceContainer').innerHTML = '';


      $.ajax({
        url: `/app_service/show-services/${subId}`, // Replace with your actual route
        method: 'GET',
        dataType: 'json',
        success: function (response) {
          const appService = response.services;
          console.log('AJAX Response:' + JSON.stringify(appService));
          const annualContainer = $('#annualServiceContainer');
          const fixedContainer = $('#fixedServiceContainer');

          // Section headers
          let annualHtml = `<div class="flex items-center gap-2.5 mb-8">
                              <img src="/securemagnus_2025/images/calendar-schedule-checkmark.svg" alt="">
                              <h3 class="font-medium text-xl">Annual Service</h3>
                            </div>`;
          let fixedHtml = `<div class="flex items-center gap-2.5 mb-8">
                              <img src="/securemagnus_2025/images/browser-web-checkmark.svg" alt="">
                              <h3 class="font-medium text-xl">Fixed Service</h3>
                            </div>`;

          let hasAnnual = false, hasFixed = false;

          if (Array.isArray(appService) && appService.length > 0) {
            appService.forEach(srv => {
              let checkboxHtml = `
                <label class="flex items-center mb-2 cursor-pointer">
                  <input type="checkbox" checked class="round-checkbox mr-2"
                    id="service-${srv.ApplicationServices.id}" /> 
                  ${srv.ApplicationServices.service_name}
                </label>
              `;
              if (srv.ApplicationServices.service_type === 'Annual') {
                annualHtml += checkboxHtml;
                hasAnnual = true;
              } else if (srv.ApplicationServices.service_type === 'Fixed') {
                fixedHtml += checkboxHtml;
                hasFixed = true;
              }
            });
          }

          if (!hasAnnual) {
            annualHtml += `<div class="text-gray-400">No annual services found.</div>`;
          }
          if (!hasFixed) {
            fixedHtml += `<div class="text-gray-400">No fixed services found.</div>`;
          }

          annualContainer.html(annualHtml);
          fixedContainer.html(fixedHtml);
        },
        error: function (xhr, status, error) {
          console.error('Error fetching data:', error);
          $('#panel-modal-view-services .modal-body').html('<p class="text-danger">Failed to load services.</p>');
        }
      });

    });
  });

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', function () {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    });
  }
  if (closeDoneBtn && modal) {
    closeDoneBtn.addEventListener('click', function () {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    });
  }

  if (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      }
    });
  }
});