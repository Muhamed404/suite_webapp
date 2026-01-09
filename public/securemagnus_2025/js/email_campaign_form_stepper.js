class EmailCampaignStepper {
  constructor(options = {}) {
    this.stepsContainer = document.getElementById(options.stepsContainerId || 'steps');
    this.formId = options.formId || 'emailCampaignForm';
    this.nextBtnId = options.nextBtnId || 'nextBtn';
    this.backBtnId = options.backBtnId || 'backBtn';
    this.currentStep = 0;
    this.isSubmitting = false;

    this.init();
  }

  init() {
    // Get all DOM elements
    this.steps = this.stepsContainer
      ? Array.from(this.stepsContainer.querySelectorAll(':scope > .step'))
      : Array.from(document.querySelectorAll('.step'));

    this.circles = document.querySelectorAll('.step-circle');
    this.labels = document.querySelectorAll('.step-label');
    this.nextBtn = document.getElementById(this.nextBtnId);
    this.backBtn = document.getElementById(this.backBtnId);
    this.form = document.getElementById(this.formId);

    // Validate required elements
    if (!this.steps.length) {
      console.error('No steps found in DOM');
      return;
    }
    if (!this.nextBtn || !this.backBtn) {
      console.error('Next or Back button not found');
      return;
    }

    // Initialize all sub-modules
    this.initTemplateSelector();
    this.initTagSelectors();
    this.initModalHandlers();
    this.attachEventListeners();
    this.updateUI();

    // alert('EmailCampaignStepper initialized successfully');
  }

  // ===== MODAL HANDLERS =====
  initModalHandlers() {
    // Helper functions
    const hideOverlay = (overlayId) => {
      const overlay = document.getElementById(overlayId);
      if (overlay) overlay.classList.add('hidden');
    };

    const showOverlay = (overlayId) => {
      const overlay = document.getElementById(overlayId);
      if (overlay) overlay.classList.remove('hidden');
    };

    // Open modal on trigger
    document.querySelectorAll('[data-modal-target]').forEach(trigger => {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        const target = trigger.getAttribute('data-modal-target');
        const overlayId = `${target}-overlay`;
        showOverlay(overlayId);
      });
    });

    // Close modal on close button
    document.querySelectorAll('[id$="-closeModalBtn"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const id = btn.id.replace('-closeModalBtn', '-overlay');
        hideOverlay(id);
      });
    });

    // Close modal on overlay click
    document.querySelectorAll('[id$="-overlay"]').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.add('hidden');
        }
      });
    });

    // Close all modals on ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('[id$="-overlay"]').forEach(overlay => {
          overlay.classList.add('hidden');
        });
      }
    });
  }

  // ===== TEMPLATE SELECTOR =====
  initTemplateSelector() {
    const radios = document.querySelectorAll('input[name="templateOption"]');
    const container = document.getElementById('templateSelection');
    const selectEl = document.getElementById('templateSelect');

    if (!radios.length || !container || !selectEl) {
      console.warn('Template selector elements not found');
      return;
    }

    const populateTemplateOptions = (items) => {
      selectEl.innerHTML = '';
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.disabled = true;
      placeholder.selected = true;
      placeholder.textContent = window.i18n?.labels?.selectTemplate || 'Select Template';
      selectEl.appendChild(placeholder);

      if (!items || !items.length) {
        this.syncHiddenTemplate(null);
        return;
      }

      items.forEach(item => {
        const opt = document.createElement('option');
        opt.value = item?.id ?? item?._id ?? item?.value ?? item?.name ?? item ?? '';
        opt.textContent = item?.name ?? item?.templateName ?? item?.value ?? item ?? opt.value;
        selectEl.appendChild(opt);
      });

      selectEl.selectedIndex = 0;
      this.syncHiddenTemplate(null);
    };

    const handleTemplateChange = () => {
      const checked = document.querySelector('input[name="templateOption"]:checked');
      if (!checked) return;

      if (checked.value === 'systemTemplates') {
        populateTemplateOptions(window._systemTemplates || []);
      } else if (checked.value === 'myTemplates') {
        populateTemplateOptions(window._userTemplates || []);
      } else {
        populateTemplateOptions(window._userTemplates || []);
      }
    };

    selectEl.addEventListener('change', () => {
      const opt = selectEl.options[selectEl.selectedIndex];
      if (!opt || !opt.value) {
        this.syncHiddenTemplate(null);
        return;
      }
      this.syncHiddenTemplate({ 
        id: opt.value, 
        name: opt.textContent || opt.label || opt.value 
      });
    });

    radios.forEach(r => r.addEventListener('change', handleTemplateChange));
    handleTemplateChange();
  }

  syncHiddenTemplate(selected) {
    const container = document.getElementById('templateSelection');
    if (!container) return;

    let hiddenWrap = container.querySelector('.template-hidden-inputs');
    if (!hiddenWrap) {
      hiddenWrap = document.createElement('div');
      hiddenWrap.className = 'template-hidden-inputs';
      hiddenWrap.style.display = 'none';
      container.appendChild(hiddenWrap);
    }

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

    // alert('Template synced:', selected);
  }

  // ===== TAG SELECTORS =====
  initTagSelectors() {
    document.querySelectorAll('.tag-selector').forEach((container) => {
      this.initSingleTagSelector(container);
    });

    // Department radio toggle
    document.querySelectorAll('[data-department-block]').forEach(section => {
      this.initDepartmentToggle(section);
    });
  }

  initSingleTagSelector(container) {
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

  initDepartmentToggle(section) {
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

  // ===== STEPPER LOGIC =====
  attachEventListeners() {
    this.nextBtn.addEventListener('click', () => this.handleNext());
    this.backBtn.addEventListener('click', () => this.handleBack());
  }

  handleNext() {
    // Validate form before advancing
    if (this.form && !this.validateForm()) {
      console.warn('Form validation failed on step:', this.currentStep);
      return;
    }

    if (this.currentStep < this.steps.length - 1) {
      this.goToStep(this.currentStep + 1);
    } else {
      this.submitForm();
    }
  }

  handleBack() {
    if (this.currentStep > 0) {
      this.goToStep(this.currentStep - 1);
    }
  }

  goToStep(newStep) {
    if (newStep < 0 || newStep >= this.steps.length) {
      console.error(`Invalid step: ${newStep}`);
      return;
    }

    // Animate out old step
    this.steps[this.currentStep].classList.add('fade-exit-active');

    setTimeout(() => {
      this.steps[this.currentStep].classList.add('hidden');
      this.steps[this.currentStep].classList.remove('fade-exit-active');

      // Animate in new step
      this.currentStep = newStep;
      this.steps[this.currentStep].classList.remove('hidden');
      this.steps[this.currentStep].classList.add('fade-enter');

      setTimeout(() => {
        this.steps[this.currentStep].classList.add('fade-enter-active');
        this.steps[this.currentStep].classList.remove('fade-enter');
      }, 20);

      this.updateUI();
    }, 300);
  }

  updateUI() {
    this.updateCircles();
    this.updateLabels();
    this.updateButtons();
  }

  updateCircles() {
    this.circles.forEach((circle, index) => {
      const isCompleted = index <= this.currentStep;
      circle.classList.toggle('bg-teal-500', isCompleted);
      circle.classList.toggle('text-white', isCompleted);
      circle.classList.toggle('bg-white', !isCompleted);
      circle.classList.toggle('border-2', !isCompleted);
      circle.classList.toggle('border-teal-300', !isCompleted);
      circle.classList.toggle('text-teal-400', !isCompleted);
    });
  }

  updateLabels() {
    this.labels.forEach((label, index) => {
      const isCurrent = index === this.currentStep;
      label.classList.toggle('text-teal-700', isCurrent);
      label.classList.toggle('text-gray-400', !isCurrent);
    });
  }

  updateButtons() {
    const isFirstStep = this.currentStep === 0;
    const isLastStep = this.currentStep === this.steps.length - 1;

    this.backBtn.disabled = isFirstStep;
    this.backBtn.classList.toggle('opacity-50', isFirstStep);
    this.backBtn.classList.toggle('cursor-not-allowed', isFirstStep);

    this.nextBtn.textContent = isLastStep
      ? (window.i18n?.labels?.finish || 'Finish')
      : (window.i18n?.labels?.next || 'Next');
    this.nextBtn.disabled = this.isSubmitting;
    this.nextBtn.classList.toggle('opacity-50', this.isSubmitting);
  }

  // ===== FORM VALIDATION & SUBMISSION =====
  validateForm() {
    if (!this.form) return true;

    // Step 1: Validate campaign name
    if (this.currentStep === 0) {
      const nameInput = document.getElementById('name');
      const nameError = document.getElementById('nameError');
      
      if (nameInput && !nameInput.value.trim()) {
        if (nameError) {
          nameError.classList.remove('hidden');
        }
        nameInput.focus();
        nameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return false;
      } else if (nameError) {
        nameError.classList.add('hidden');
      }
    }

    // Step 2: Validate department or group selection
    if (this.currentStep === 1) {
      // Check for selected departments and groups from hidden inputs
      const departmentIds = document.querySelectorAll('input[name="departmentIds[]"]');
      const groupIds = document.querySelectorAll('input[name="groupIds[]"]');
      
      console.log('Validation - Department IDs found:', departmentIds.length);
      console.log('Validation - Group IDs found:', groupIds.length);
      
      const hasDepartments = departmentIds.length > 0;
      const hasGroups = groupIds.length > 0;
      
      // Get all tag-selector containers and find department/group selects
      const tagSelectors = Array.from(document.querySelectorAll('.tag-selector'));
      let departmentSelect = null;
      let groupSelect = null;
      
      tagSelectors.forEach(selector => {
        const label = selector.querySelector('label');
        if (label) {
          const labelText = label.textContent.toLowerCase();
          if (labelText.includes('department')) {
            departmentSelect = selector.querySelector('.groupSelect');
          } else if (labelText.includes('group')) {
            groupSelect = selector.querySelector('.groupSelect');
          }
        }
      });
      
      // Check if there are any options available (excluding placeholder)
      const hasDepartmentOptions = departmentSelect && departmentSelect.options.length > 1;
      const hasGroupOptions = groupSelect && groupSelect.options.length > 1;
      
      console.log('Department options available:', hasDepartmentOptions);
      console.log('Group options available:', hasGroupOptions);
      
      if (!hasDepartmentOptions && !hasGroupOptions) {
        alert('No departments or groups available. Please add users to departments or groups before creating a campaign.');
        return false;
      }
      
      if (!hasDepartments && !hasGroups) {
        alert('Please select at least one department or group to target.');
        return false;
      }
      
      console.log('Step 2 validation passed!');
    }

    // HTML5 validation check
    const currentStepElement = this.steps[this.currentStep];
    if (currentStepElement) {
      const requiredFields = currentStepElement.querySelectorAll('[required]');
      for (const field of requiredFields) {
        if (!field.value || (field.type === 'checkbox' && !field.checked) || (field.type === 'radio' && !document.querySelector(`input[name="${field.name}"]:checked`))) {
          console.warn('Required field not filled:', field.name || field.id);
          field.focus();
          field.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return false;
        }
      }
    }

    console.log('All validations passed for step:', this.currentStep);
    return true;
  }

  submitForm() {
    if (!this.form || this.isSubmitting) return;

    // Show confirmation alert
    const confirmSubmit = confirm(
      window.i18n?.messages?.confirmSubmit || 
      'Are you sure you want to submit this campaign? This action cannot be undone.'
    );

    if (!confirmSubmit) {
      console.log('Form submission cancelled by user');
      return;
    }

    this.isSubmitting = true;
    this.updateButtons();

    console.log('Submitting form:', {
      action: this.form.action,
      method: this.form.method
    });

    // Debug: Log all form fields
    const allInputs = this.form.querySelectorAll('input, select, textarea');
    console.log('Form fields count:', allInputs.length);
    allInputs.forEach(input => {
      if (input.type !== 'hidden') {
        console.log(`Field: ${input.name} = ${input.value}`);
      }
    });

    // Traditional form submission - no fetch()
    // alert('Form is being submitted to: ' + this.form.action);
    this.form.submit();
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.emailCampaignStepper = new EmailCampaignStepper({
    stepsContainerId: 'steps',
    formId: 'emailCampaignForm',
    nextBtnId: 'nextBtn',
    backBtnId: 'backBtn'
  });
});