// Prefer only top-level step panes inside the main #steps container to avoid counting nested/internal .step elements.
const stepsContainer = document.getElementById('steps');
const steps = stepsContainer
  ? Array.from(stepsContainer.querySelectorAll(':scope > .step'))
  : Array.from(document.querySelectorAll('.step'));
const circles = document.querySelectorAll(".step-circle");
const labels = document.querySelectorAll(".step-label");
const nextBtn = document.getElementById("nextBtn");
const backBtn = document.getElementById("backBtn");

let currentStep = 0;

// ===== TAG SELECTORS ===== (Added from email_campaign_form_stepper.js)
function initTagSelectors() {
  document.querySelectorAll('.tag-selector').forEach((container) => {
    initSingleTagSelector(container);
  });

  // Department radio toggle
  document.querySelectorAll('[data-department-block]').forEach(section => {
    initDepartmentToggle(section);
  });
}

function initSingleTagSelector(container) {
  const select = container.querySelector('.groupSelect');
  const selectedTags = container.querySelector('.selectedTags');
  let selectedValues = [];

  if (!select || !selectedTags) return;

  const fieldFromData = container.dataset?.field?.trim() || null;
  const fieldFromSelectName = select?.name?.replace(/\[\]$/, '').trim() || null;
  const labelText = container.querySelector('label')?.textContent?.toLowerCase() || '';
  const inferredField = labelText.includes('department') ? 'department' : 
                       (labelText.includes('group') ? 'group' : 'field');

  const logicalField = fieldFromData || fieldFromSelectName || inferredField;
  let hiddenContainer = container.querySelector('.hidden-inputs');

  if (!hiddenContainer) {
    hiddenContainer = document.createElement('div');
    hiddenContainer.className = 'hidden-inputs';
    hiddenContainer.style.display = 'none';
    container.appendChild(hiddenContainer);
  }

  const hiddenInputName = `${logicalField}Ids[]`;

  // Helper functions with proper scope
  const renderTags = () => {
    selectedTags.innerHTML = '';
    selectedValues.forEach(item => {
      const tag = document.createElement('div');
      tag.className = 'flex items-center gap-2 bg-teal-50 text-gray-700 px-3 py-1 rounded-lg';
      tag.innerHTML = `
        <span>${item.name}</span>
        <button type="button" class="text-gray-500 hover:text-red-500" data-value="${item.id}">✕</button>
      `;
      selectedTags.appendChild(tag);
    });

    selectedTags.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        removeTag(btn.dataset.value);
      });
    });

    hiddenContainer.innerHTML = '';
    selectedValues.forEach(item => {
      const inp = document.createElement('input');
      inp.type = 'hidden';
      inp.name = hiddenInputName;
      inp.value = item.id;
      hiddenContainer.appendChild(inp);

      const nameInp = document.createElement('input');
      nameInp.type = 'hidden';
      nameInp.name = `${logicalField}Names[]`;
      nameInp.value = item.name;
      hiddenContainer.appendChild(nameInp);
    });
  };

  const hideOption = (value) => {
    const option = [...select.options].find(opt => opt.value === value);
    if (option) option.style.display = 'none';
  };

  const showOption = (value) => {
    const option = [...select.options].find(opt => opt.value === value);
    if (option) option.style.display = 'block';
  };

  const removeTag = (value) => {
    selectedValues = selectedValues.filter(v => v.id !== value);
    showOption(value);
    renderTags();
  };

  // Event listener
  select.addEventListener('change', function () {
    const selectedOption = this.options[this.selectedIndex];
    const id = selectedOption?.value ?? '';
    const name = (selectedOption?.textContent || selectedOption?.label || id).trim();

    if (!id || selectedValues.some(s => s.id === id)) {
      this.selectedIndex = 0;
      return;
    }

    selectedValues.push({ id, name });
    renderTags();
    hideOption(id);
    this.selectedIndex = 0;
  });
}

function initDepartmentToggle(section) {
  const radios = section.querySelectorAll('input[type="radio"]');
  const selectBlock = section.querySelector('.tag-selector');
  const groupSelect = section.querySelector('.groupSelect');
  const tagsContainer = section.querySelector('.selectedTags');

  if (!radios.length || !selectBlock) return;

  const toggleSelectBlock = () => {
    const selected = section.querySelector('input[type="radio"]:checked')?.value;
    selectBlock.closest('div').style.display = selected === 'custom' ? 'block' : 'none';
  };

  toggleSelectBlock();
  radios.forEach(radio => radio.addEventListener('change', toggleSelectBlock));

  let selectedTags = [];

  const renderTags = () => {
    tagsContainer.innerHTML = '';
    selectedTags.forEach(tag => {
      const tagEl = document.createElement('div');
      tagEl.className = 'inline-flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full text-sm';
      tagEl.innerHTML = `<span>${tag}</span><button type="button" class="ml-2 text-gray-600 font-medium">×</button>`;
      tagEl.querySelector('button').addEventListener('click', () => {
        selectedTags = selectedTags.filter(t => t !== tag);
        renderTags();
      });
      tagsContainer.appendChild(tagEl);
    });
  };

  if (groupSelect) {
    groupSelect.addEventListener('change', () => {
      const value = groupSelect.value.trim();
      if (value && !selectedTags.includes(value)) {
        selectedTags.push(value);
        renderTags();
      }
      groupSelect.selectedIndex = 0;
    });
  }
}

// Initialize tag selectors on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  initTagSelectors();
});

function updateStep(newStep) {
  // Animate old step out
  steps[currentStep].classList.add("fade-exit-active");
  setTimeout(() => {
    steps[currentStep].classList.add("hidden");
    steps[currentStep].classList.remove("fade-exit-active");

    // Show new step with animation
    currentStep = newStep;
    steps[currentStep].classList.remove("hidden");
    steps[currentStep].classList.add("fade-enter");
    setTimeout(() => {
      steps[currentStep].classList.add("fade-enter-active");
      steps[currentStep].classList.remove("fade-enter");
    }, 20);

    // Update stepper visuals
    circles.forEach((circle, index) => {
      if (index <= currentStep) {
        circle.classList.add("bg-teal-500", "text-white");
        circle.classList.remove("bg-white", "border-2", "border-teal-300", "text-teal-400");
      } else {
        circle.classList.remove("bg-teal-500", "text-white");
        circle.classList.add("bg-white", "border-2", "border-teal-300", "text-teal-400");
      }
    });

    labels.forEach((label, index) => {
      label.classList.toggle("text-teal-700", index === currentStep);
      label.classList.toggle("text-gray-400", index !== currentStep);
    });

    // Disable/enable buttons
    backBtn.disabled = currentStep === 0;
    backBtn.classList.toggle("cursor-not-allowed", currentStep === 0);
    backBtn.classList.toggle("bg-gray-300", currentStep === 0);
    backBtn.classList.toggle("bg-teal-500", currentStep !== 0);
    backBtn.classList.toggle("text-white", currentStep !== 0);
    nextBtn.textContent = currentStep === steps.length - 1 ? "Finish" : "Next";

    // Trigger validation check when step changes
    if (window.jQuery && typeof window.validateFormAndToggleSubmit === 'function') {
      window.validateFormAndToggleSubmit();
    }
  }, 300);
}

nextBtn.addEventListener("click", (e) => {
  e.preventDefault(); // Prevent default form submission
  
  // Always validate the main form's visible fields in the current step
  const mainForm = document.querySelector("form[id], form[name]");
  if (mainForm && window.jQuery && typeof jQuery === "function" && typeof jQuery(mainForm).valid === "function") {
    const $visibleFields = $(steps[currentStep]).find(':input:visible');
    let isValid = true;
    $visibleFields.each(function () {
      if (!$(this).valid()) {
        isValid = false;
      }
    });
    if (!isValid) {
      // Focus first invalid field and do not advance
      const $firstErr = $visibleFields.filter('.error, :invalid').first();
      if ($firstErr && $firstErr.length) $firstErr.focus();
      return;
    }
  }

  if (currentStep < steps.length - 1) {
    updateStep(currentStep + 1);
  } else {
    // On last step, validate entire form before submit
    if (mainForm && window.jQuery && typeof jQuery === "function" && typeof jQuery(mainForm).valid === "function") {
      if ($(mainForm).valid()) {
        mainForm.submit();
      } else {
        // Focus first invalid field
        const $firstErr = $(mainForm).find(':input.error, :input:invalid').first();
        if ($firstErr && $firstErr.length) $firstErr.focus();
      }
    } else {
      mainForm.submit();
    }
  }
});

backBtn.addEventListener("click", () => {
  // alert('back button clicked' + currentStep)
  if (currentStep > 0) {
    updateStep(currentStep - 1);
  }
});
