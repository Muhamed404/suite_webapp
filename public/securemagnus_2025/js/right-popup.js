  const modle = document.getElementById("modal");
  const rightModalOverlay = document.getElementById("rightModalOverlay");
  const rightModal = document.getElementById("rightModal");

  const opnbtn = document.getElementById("openModal");
  const clsbtn = document.getElementById("closeModal");
  const closeRightModal = document.getElementById("closeRightModal");

  const modalOptions = document.querySelectorAll(".modal-option");

  // Open first modal
  opnbtn?.addEventListener("click", (e) => {
    e.preventDefault();
    modle.classList.remove("hidden");
  });

  // Close first modal
  clsbtn?.addEventListener("click", () => {
    modle.classList.add("hidden");
  });

  // Open right popup when option clicked
  modalOptions.forEach((option) => {
    option.addEventListener("click", (e) => {
      e.preventDefault();
      modle.classList.add("hidden"); // Close first

      // Show and slide in right modal
      rightModalOverlay.classList.remove("hidden");
      setTimeout(() => {
        rightModal.classList.remove("translate-x-full");
      }, 10);
    });
  });

  // Close right modal
  closeRightModal?.addEventListener("click", () => {
    rightModal.classList.add("translate-x-full");
    setTimeout(() => {
      rightModalOverlay.classList.add("hidden");
    }, 300);
  });

  // Close right modal by clicking outside (optional)
  rightModalOverlay?.addEventListener("click", (e) => {
    if (e.target === rightModalOverlay) {
      rightModal.classList.add("translate-x-full");
      setTimeout(() => {
        rightModalOverlay.classList.add("hidden");
      }, 300);
    }
  });