document.addEventListener('DOMContentLoaded', () => {
  // ===== Helper functions for modals =====
  function hideOverlay(overlayId) {
    const overlay = document.getElementById(overlayId);
    if (overlay) overlay.classList.add('hidden');
  }

  function showOverlay(overlayId) {
    const overlay = document.getElementById(overlayId);
    if (overlay) overlay.classList.remove('hidden');
  }

  // ===== Open Modal =====
  document.querySelectorAll('[data-modal-target]').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const target = trigger.getAttribute('data-modal-target'); // e.g., "mail" or "nfc"
      const overlayId = `${target}-overlay`;
      showOverlay(overlayId);
    });
  });

  // ===== Close Modal =====
  document.querySelectorAll('[id$="-closeModalBtn"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const id = btn.id.replace('-closeModalBtn', '-overlay');
      hideOverlay(id);
    });
  });

  // ===== Close on overlay click =====
  document.querySelectorAll('[id$="-modalOverlay"]').forEach(innerOverlay => {
    innerOverlay.addEventListener('click', (e) => {
      if (e.target === innerOverlay) {
        const id = innerOverlay.id.replace('-modalOverlay', '-overlay');
        hideOverlay(id);
      }
    });
  });

  // ===== Close on ESC key =====
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('[id$="-overlay"]').forEach(overlay => {
        if (!overlay.classList.contains('hidden')) {
          overlay.classList.add('hidden');
        }
      });
    }
  });

  // ===== Stepper Logic for All Modals =====
  document.querySelectorAll('[data-steps]').forEach(stepsContainer => {
    // Prefer direct child steps to avoid counting nested/internal elements as separate steps.
    // Fallback to any descendant selector if direct children are not used.
    let steps = Array.from(stepsContainer.querySelectorAll(':scope > [data-step], :scope > .step'));
    if (!steps.length) steps = Array.from(stepsContainer.querySelectorAll('[data-step], .step'));
    const stepper = stepsContainer.closest('.relative').querySelector('[data-steppers]');
    const stepCircles = stepper ? stepper.querySelectorAll('.step-circle') : [];
    const stepLabels = stepper ? stepper.querySelectorAll('.step-label') : [];
    const nextBtn = stepsContainer.closest('.relative').querySelector('[data-next]');
    const backBtn = stepsContainer.closest('.relative').querySelector('[data-back]');
    let currentStep = 0;

    // Update steps & breadcrumbs
    function updateUI(index) {
      // Show current step
      steps.forEach((step, i) => step.classList.toggle('hidden', i !== index));

      // Update stepper circles & labels if present
      if (stepCircles.length) {
        stepCircles.forEach((circle, i) => {
          if (i === index) {
            circle.classList.remove('bg-white', 'border-2', 'border-teal-300', 'text-teal-400');
            circle.classList.add('bg-teal-500', 'text-white');
          } else {
            circle.classList.add('bg-white', 'border-2', 'border-teal-300', 'text-teal-400');
            circle.classList.remove('bg-teal-500', 'text-white');
          }
        });
      }

      if (stepLabels.length) {
        stepLabels.forEach((label, i) => {
          label.classList.toggle('text-teal-700', i === index);
          label.classList.toggle('text-gray-400', i !== index);
        });
      }

      // Update button states
      if (backBtn) backBtn.disabled = index === 0;
      if (nextBtn) nextBtn.textContent = index === steps.length - 1 ? 'Finish' : 'Next';
    }

    // Next button
    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentStep < steps.length - 1) {
          currentStep++;
          updateUI(currentStep);
        } else {
          console.log('Form Completed for this modal!');
        }
      });
    }

    // Back button
    if (backBtn) {
      backBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentStep > 0) {
          currentStep--;
          updateUI(currentStep);
        }
      });
    }

    // Initialize
    updateUI(currentStep);
  });

  // hide/show "System Template" and "Select Template" labels based on templateOption radio
  function initTemplateOptionToggle() {
    const radios = document.querySelectorAll('input[name="templateOption"]');
    const container = document.getElementById('templateSelection');
    const selectEl = document.getElementById('templateSelect');
    // <-- ensure we bail out if required elements are missing
    if (!radios.length || !container || !selectEl) return;

    const sysLabel = container.querySelector('.system-template-label');
    const selLabel = container.querySelector('.select-template-label');

    // populate the select with given items (array of objects or strings)
    function populateTemplateOptions(items) {
      // clear existing (keep placeholder)
      selectEl.innerHTML = '';
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.disabled = true;
      placeholder.selected = true;
      placeholder.textContent = 'Select Template';
      selectEl.appendChild(placeholder);

      if (!items || !items.length) {
        // clear any synced hidden inputs when no options
        syncHidden(null);
        return;
      }

      items.forEach(item => {
        const opt = document.createElement('option');
        opt.value = item?.id ?? item?._id ?? item?.value ?? item?.name ?? item ?? '';
        opt.textContent = item?.name ?? item?.templateName ?? item?.value ?? item ?? opt.value;
        selectEl.appendChild(opt);
      });

      // clear old selection / hidden inputs
      selectEl.selectedIndex = 0;
      syncHidden(null);
    }

    // ensure hidden inputs exist and sync them with selection
    function syncHidden(selected) {
      // target container for hidden inputs; place inside templateSelection or form
      let hiddenWrap = container.querySelector('.template-hidden-inputs');
      if (!hiddenWrap) {
        hiddenWrap = document.createElement('div');
        hiddenWrap.className = 'template-hidden-inputs';
        hiddenWrap.style.display = 'none';
        container.appendChild(hiddenWrap);
      }
      // remove previous
      hiddenWrap.innerHTML = '';

      if (!selected) return;

      const idInput = document.createElement('input');
      idInput.type = 'hidden';
      idInput.name = 'templateId';
      idInput.value = selected.id || selected.value || '';
      hiddenWrap.appendChild(idInput);

      const nameInput = document.createElement('input');
      nameInput.type = 'hidden';
      nameInput.name = 'templateName';
      nameInput.value = selected.name || selected.text || '';
      hiddenWrap.appendChild(nameInput);
    }

    function update() {
      const checked = document.querySelector('input[name="templateOption"]:checked');
      console.log('[initTemplateOptionToggle] checked radio:', checked);
      // debug alert for quick visibility
      if (checked) {
        const userCount = (window._userTemplates || []).length;
        const sysCount = (window._systemTemplates || []).length;
        // small, non-blocking alert for debugging (remove when done)
        // alert(`Selected: ${checked.value}\nuser templates: ${userCount}\nsystem templates: ${sysCount}`);
      }

      if (!checked) return;

      if (checked.value === 'systemTemplates') {
        // if (sysLabel) sysLabel.style.display = '';
        // if (selLabel) selLabel.style.display = 'none';
        populateTemplateOptions(window._systemTemplates || []);
      } else if (checked.value === 'myTemplates') {
        // if (sysLabel) sysLabel.style.display = 'none';
        // if (selLabel) selLabel.style.display = 'none';
        populateTemplateOptions(window._userTemplates || []);
      } else {
        // if (sysLabel) sysLabel.style.display = 'none';
        // if (selLabel) selLabel.style.display = '';
        populateTemplateOptions(window._userTemplates || []);
      }
    }

    // when user picks an option, sync hidden inputs with id & name
    selectEl.addEventListener('change', function () {
      const opt = this.options[this.selectedIndex];
      if (!opt || !opt.value) {
        syncHidden(null);
        return;
      }
      syncHidden({ id: opt.value, name: opt.textContent || opt.label || opt.value });
    });

    radios.forEach(r => r.addEventListener('change', update));
    update(); // initial state
  }

  initTemplateOptionToggle();
});





function initTagSelector(container) {
  // alert("initTagSelector called"+container);
  const select = container.querySelector(".groupSelect");
  const selectedTags = container.querySelector(".selectedTags");
  let selectedValues = [];

  // determine logical field name (prefer explicit data-field or select.name, else infer from label)
  const fieldFromData = (container.dataset && container.dataset.field) ? container.dataset.field.trim() : null;
  const fieldFromSelectName = select && select.name ? select.name.replace(/\[\]$/, '').trim() : null;
  const labelText = container.querySelector('label')?.textContent?.toLowerCase() || '';
  const inferredField = labelText.includes('department') ? 'department' : (labelText.includes('group') ? 'group' : 'field');

  const logicalField = fieldFromData || fieldFromSelectName || inferredField;

  // hidden inputs container to store values for form submission
  let hiddenContainer = container.querySelector('.hidden-inputs');
  if (!hiddenContainer) {
    hiddenContainer = document.createElement('div');
    hiddenContainer.className = 'hidden-inputs';
    hiddenContainer.style.display = 'none';
    container.appendChild(hiddenContainer);
  }

  // use distinct names per logicalField so department and group are segregated on submit
  const hiddenInputName = `${logicalField}Ids[]`; // e.g. departmentIds[], groupIds[]

  select.addEventListener("change", function () {
    const selectedOption = this.options[this.selectedIndex];
    const id = selectedOption?.value ?? "";
    const name = (selectedOption?.textContent || selectedOption?.label || id).trim();

    if (!id) {
      this.selectedIndex = 0;
      return;
    }

    // prevent duplicates by id
    if (!selectedValues.some(s => s.id === id)) {
      selectedValues.push({ id, name });
      renderTags();
      hideOption(id);
    }
    this.selectedIndex = 0; // reset dropdown to placeholder
  });

  function renderTags() {
    selectedTags.innerHTML = "";
    selectedValues.forEach(item => {
      const tag = document.createElement('div');
      tag.className = "flex items-center gap-2 bg-teal-50 text-gray-700 px-3 py-1 rounded-lg";
      tag.innerHTML = `
        <span>${item.name}</span>
        <button class="text-gray-500 hover:text-red-500" data-value="${item.id}">✕</button>
      `;
      selectedTags.appendChild(tag);
    });

    selectedTags.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", () => removeTag(btn.dataset.value));
    });

    // Sync hidden inputs for form submission: clear and recreate based on selectedValues
    hiddenContainer.innerHTML = '';
    selectedValues.forEach(item => {
      const inp = document.createElement('input');
      inp.type = 'hidden';
      inp.name = hiddenInputName;
      inp.value = item.id;
      inp.setAttribute('data-for-id', item.id);
      hiddenContainer.appendChild(inp);

      // also add optional name field per item if you want names posted alongside ids
      const nameInp = document.createElement('input');
      nameInp.type = 'hidden';
      nameInp.name = `${logicalField}Names[]`; // e.g. departmentNames[]
      nameInp.value = item.name;
      hiddenContainer.appendChild(nameInp);
    });
  }

  function hideOption(value) {
    const option = [...select.options].find(opt => opt.value === value);
    if (option) option.style.display = "none";
  }

  function showOption(value) {
    const option = [...select.options].find(opt => opt.value === value);
    if (option) option.style.display = "block";
  }

  function removeTag(value) {
    selectedValues = selectedValues.filter(v => v.id !== value);
    showOption(value);
    renderTags();
  }
}

// Initialize all selectors
document.querySelectorAll(".tag-selector").forEach(container => initTagSelector(container));





document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll('[data-department-block]').forEach(section => {
    const radios = section.querySelectorAll('input[type="radio"]');
    const selectBlock = section.querySelector('.tag-selector');
    const groupSelect = section.querySelector('.groupSelect');
    const tagsContainer = section.querySelector('.selectedTags');

    if (!radios.length || !selectBlock) return;

    // Toggle visibility based on selected radio
    function toggleSelectBlock() {
      const selected = section.querySelector('input[type="radio"]:checked')?.value;
      selectBlock.closest('div').style.display = selected === "custom" ? "block" : "none";
    }

    // Initial check
    toggleSelectBlock();

    // Listen for radio change
    radios.forEach(radio => {
      radio.addEventListener("change", toggleSelectBlock);
    });

    // Tag logic
    let selectedTags = [];

    function renderTags() {
      tagsContainer.innerHTML = "";
      selectedTags.forEach(tag => {
        const tagEl = document.createElement('div');
        tagEl.className = 'inline-flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full text-sm';
        tagEl.innerHTML = `
          <span>${tag}</span>
          <button type="button" class="ml-2 text-gray-600 font-medium">×</button>
        `;
        tagEl.querySelector('button').addEventListener('click', () => {
          selectedTags = selectedTags.filter(t => t !== tag);
          renderTags();
        });
        tagsContainer.appendChild(tagEl);
      });
    }

    if (groupSelect) {
      groupSelect.addEventListener('change', () => {
        const value = groupSelect.value.trim();
        if (value && !selectedTags.includes(value)) {
          selectedTags.push(value);
          renderTags();
        }
        groupSelect.selectedIndex = 0; // Reset dropdown
      });
    }
  });
});
