document.addEventListener('DOMContentLoaded', function () {
  const startTime = document.getElementById('startTime');
  const endTime = document.getElementById('endTime');

  // Set min and default for startTime
  if (startTime) {
    const now = new Date();
    const pad = n => n.toString().padStart(2, '0');
    const localISO = now.getFullYear() + '-' +
      pad(now.getMonth() + 1) + '-' +
      pad(now.getDate()) + 'T' +
      pad(now.getHours()) + ':' +
      pad(now.getMinutes());
    startTime.min = localISO;
    startTime.value = localISO;
  }

  // Set min for endTime based on startTime, default to 3 days ahead
  if (endTime && startTime) {
    // Calculate 3 days ahead from startTime
    const startDate = new Date(startTime.value);
    const threeDaysLater = new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000);
    const pad = n => n.toString().padStart(2, '0');
    const endISO = threeDaysLater.getFullYear() + '-' +
      pad(threeDaysLater.getMonth() + 1) + '-' +
      pad(threeDaysLater.getDate()) + 'T' +
      pad(threeDaysLater.getHours()) + ':' +
      pad(threeDaysLater.getMinutes());

    endTime.min = startTime.value;
    endTime.value = endISO;

    startTime.addEventListener('change', function () {
      endTime.min = startTime.value;
      // Recalculate 3 days ahead from new startTime
      const newStartDate = new Date(startTime.value);
      const newThreeDaysLater = new Date(newStartDate.getTime() + 3 * 24 * 60 * 60 * 1000);
      const newEndISO = newThreeDaysLater.getFullYear() + '-' +
        pad(newThreeDaysLater.getMonth() + 1) + '-' +
        pad(newThreeDaysLater.getDate()) + 'T' +
        pad(newThreeDaysLater.getHours()) + ':' +
        pad(newThreeDaysLater.getMinutes());
      endTime.value = newEndISO;
    });
  }

  // Open native picker for startTime
  const openStartBtn = document.querySelector('.open-start');
  if (openStartBtn) {
    openStartBtn.addEventListener('click', function () {
      if (startTime && startTime.showPicker) startTime.showPicker();
      else startTime.focus();
    });
  }

  // Open native picker for endTime
  const openEndBtn = document.querySelector('.open-end');
  if (openEndBtn) {
    openEndBtn.addEventListener('click', function () {
      if (endTime && endTime.showPicker) endTime.showPicker();
      else endTime.focus();
    });
  }
});
