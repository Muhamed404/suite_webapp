(function () {
  var tooltip = document.getElementById('error-tooltip');
  var tooltipText = document.getElementById('error-tooltip-text');
  var GAP = 12;

  if (!tooltip || !tooltipText) return;

  function position(e) {
    var x = e.clientX + GAP;
    var y = e.clientY + GAP;
    if (x + 320 > window.innerWidth)  x = e.clientX - 320 - GAP;
    if (y + tooltip.offsetHeight > window.innerHeight) y = e.clientY - tooltip.offsetHeight - GAP;
    tooltip.style.left = x + 'px';
    tooltip.style.top  = y + 'px';
  }

  document.querySelectorAll('.error-tooltip-trigger').forEach(function (el) {
    el.addEventListener('mouseenter', function (e) {
      tooltipText.textContent = el.dataset.msg;
      tooltip.style.display = 'block';
      position(e);
    });
    el.addEventListener('mousemove', position);
    el.addEventListener('mouseleave', function () {
      tooltip.style.display = 'none';
    });
  });
})();
