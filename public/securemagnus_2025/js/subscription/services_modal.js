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
      $('#annualServicesList').html('');
      $('#fixedServicesList').html('');


      $.ajax({
        url: `/app_service/show-services/${subId}`, // Replace with your actual route
        method: 'GET',
        dataType: 'json',
        success: function (response) {
          const appService = response.services;
          console.log('AJAX Response:' + JSON.stringify(appService));
          const annualContainer = $('#annualServiceContainer');
          const fixedContainer = $('#fixedServiceContainer');

          let annualContent = '';
          let fixedContent = '';

          let hasAnnual = false, hasFixed = false;

          if (Array.isArray(appService) && appService.length > 0) {
            appService.forEach(srv => {
              let serviceHtml = `<div class="mb-2">${srv.ApplicationServices.service_name}</div>`;
              if (srv.ApplicationServices.service_type === 'Annual') {
                annualContent += serviceHtml;
                hasAnnual = true;
              } else if (srv.ApplicationServices.service_type === 'Fixed') {
                fixedContent += serviceHtml;
                hasFixed = true;
              }
            });
          }

          if (!hasAnnual) {
            annualContent = `<div class="text-gray-400">${window.i18n ? window.i18n.__('subscription.create.noAnnualServicesFound') : 'No annual services found.'}</div>`;
          }
          if (!hasFixed) {
            fixedContent = `<div class="text-gray-400">${window.i18n ? window.i18n.__('subscription.create.noFixedServicesFound') : 'No fixed services found.'}</div>`;
          }

          $('#annualServicesList').html(annualContent);
          $('#fixedServicesList').html(fixedContent);
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