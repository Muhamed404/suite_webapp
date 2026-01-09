document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll("img.svg-color").forEach(img => { // Only target class="svg-color"
    fetch(img.src)
      .then(res => res.text())
      .then(svgText => {
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgText, "image/svg+xml");
        const svgEl = svgDoc.querySelector("svg");

        if (!svgEl) return;

        // Copy classes from <img> to <svg>
        if (img.className) {
          svgEl.setAttribute("class", img.className);
        }

        // Change stroke to currentColor so Tailwind color works
        svgEl.querySelectorAll("[stroke]").forEach(el => {
          el.setAttribute("stroke", "currentColor");
        });

        img.replaceWith(svgEl);
      })

  });
});
