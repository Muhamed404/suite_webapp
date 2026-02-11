function toArabicNum(num) {
  return num.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
}

function setProgress(circleId, textId, ...args) {
  let percent, textValue;
  if (args.length === 1) {
    percent = args[0];
    textValue = percent;
  } else if (args.length === 2) {
    const consumed = args[0];
    const purchased = args[1];
    percent = purchased > 0 ? (consumed / purchased) * 100 : 0;
    textValue = consumed;
  } else {
    return; 
  }

  const circle = document.getElementById(circleId);
  const text = document.getElementById(textId);

  if (!circle || !text) return; // Prevent null errors

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  circle.style.strokeDasharray = circumference;
  circle.style.strokeDashoffset = offset;
  text.textContent = textValue.toString();
}





document.addEventListener("DOMContentLoaded", function () {
  // ✅ Run only after DOM is ready
  // setProgress("progressCircle1", "progressText1", 75);
  // setProgress("progressCircle2", "progressText2", 40);

  function lightenColor(hex, percent) {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);

    r = Math.min(255, Math.floor(r + (255 - r) * percent / 100));
    g = Math.min(255, Math.floor(g + (255 - g) * percent / 100));
    b = Math.min(255, Math.floor(b + (255 - b) * percent / 100));

    return `rgb(${r}, ${g}, ${b})`;
  }

  function renderChart(el, percent, color) {
    const lightColor = lightenColor(color, 60);
    el.innerHTML = `
      <div class="relative w-32 h-32">
        <svg class="w-full h-full rotate-[-90deg]" viewBox="0 0 110 110">
          <circle cx="55" cy="55" r="50" stroke="${lightColor}" stroke-width="10" fill="none" />
          <circle class="chartCircle" cx="55" cy="55" r="50" stroke="${color}" stroke-width="10" fill="none" stroke-linecap="round" />
        </svg>
        <div class="absolute inset-0 flex items-center justify-center text-lg font-semibold" style="color:#051226">
          <span class="chartText">0</span>
        </div>
      </div>
    `;
  }

  function animateProgress(circle, textEl, percent, duration = 1000) {
    if (!circle || !textEl) return;

    const radius = circle.r.baseVal.value;
    const circumference = 2 * Math.PI * radius;
    circle.style.strokeDasharray = circumference;
    circle.style.strokeDashoffset = circumference;

    let start = null;
    function step(timestamp) {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const current = Math.floor(progress * percent);

      circle.style.strokeDashoffset = circumference - (current / 100) * circumference;
      textEl.textContent = current;

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }
    requestAnimationFrame(step);
  }

  // For .leadchart elements
  document.querySelectorAll('.leadchart').forEach((el) => {
    const percent = parseInt(el.getAttribute('value'), 10) || 0;
    const color = el.getAttribute('color') || '#57ABE6';

    renderChart(el, percent, color);

    const circle = el.querySelector('.chartCircle');
    const textEl = el.querySelector('.chartText');
    animateProgress(circle, textEl, percent);
  });
});
