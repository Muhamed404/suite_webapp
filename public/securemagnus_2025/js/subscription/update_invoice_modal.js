document.addEventListener('DOMContentLoaded', function () {
  const modal = document.getElementById('updateInvoiceModal');
  const closeXBtn = document.getElementById('closeUpdateInvoiceModal');
  const closeBtn = document.getElementById('closeUpdateInvoiceModalBtn');
  const doneBtn = document.getElementById('doneUpdateInvoiceButton');
  const table = document.getElementById('filter-table');

  // Event delegation for dynamically rendered buttons
  if (table) {
    table.addEventListener('click', function (e) {
      const btn = e.target.closest('button[id^="openUpdateInvoiceModal-"]');
      if (btn) {
        const subId = btn.getAttribute('data-subscription');
        const orderId = btn.getAttribute('data-order');
        const orgId = btn.getAttribute('data-org');
        if(document.getElementById('subscription')) document.getElementById('subscription').value = subId;
        if(document.getElementById('order')) document.getElementById('order').value = orderId;
        if(document.getElementById('org')) document.getElementById('org').value = orgId;
        modal.classList.remove('hidden');
        modal.classList.add('flex');
      }
    });
  }

  // Close modal on close or done button
  [closeXBtn, closeBtn, doneBtn].forEach(btn => {
    if (btn) {
      btn.addEventListener('click', function () {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      });
    }
  });

  // Optional: close modal when clicking outside the modal content
  if (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      }
    });
  }
});