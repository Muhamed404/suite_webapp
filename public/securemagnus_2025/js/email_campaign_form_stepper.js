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
    this.initValidation();
    this.initTemplateSelector();
    this.initTagSelectors();
    this.initModalHandlers();
    this.attachEventListeners();
    this.updateUI();

    // alert('EmailCampaignStepper initialized successfully');
  }

  // ===== JQUERY VALIDATION SETUP =====
  initValidation() {
    if (!this.form || typeof $.fn.validate === 'undefined') {
      console.warn('jQuery Validation not available');
      return;
    }

    $(this.form).validate({
      ignore: '.hidden :hidden:not(.groupSelect)',
      rules: {
        name: {
          required: true,
          minlength: 2
        },
        templateId: {
          required: true
        },
        startTime: {
          required: true
        },
        endTime: {
          required: true
        }
      },
      messages: {
        name: window.i18n?.validation?.campaign_name_required || "Campaign name is required (minimum 2 characters).",
        templateId: window.i18n?.validation?.template_required || "Please select a template.",
        startTime: window.i18n?.validation?.start_time_required || "Start date and time are required.",
        endTime: window.i18n?.validation?.end_time_required || "End date and time are required."
      },
      errorClass: "text-red-500 text-sm mt-1 block",
      errorElement: "span",
      highlight: function (element) {
        $(element).addClass("border-red-500");
      },
      unhighlight: function (element) {
        $(element).removeClass("border-red-500");
      },
      errorPlacement: function (error, element) {
        error.insertAfter(element);
      }
    });

    // Validate on blur for better UX
    $('#name').on('blur', function () {
      $(this).valid();
    });

    $('#templateSelect').on('change', function () {
      const hiddenTemplateId = $('input[name="templateId"]');
      if (hiddenTemplateId.length) {
        hiddenTemplateId.valid();
      }
    });
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
    const labelText = container.querySelector('label')?.textContent?.trim() || '';
    console.log('Tag selector label text:', labelText);
    
    let inferredField = 'field'; // default
    if (labelText.toLowerCase().includes('department') || labelText.includes('قسم') || labelText.includes('القسم')) {
      inferredField = 'department';
    } else if (labelText.toLowerCase().includes('group') || labelText.includes('مجموعة') || labelText.includes('المجموعة')) {
      inferredField = 'group';
    }
    
    console.log('Inferred field type:', inferredField);

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

  async handleNext() {
    // Validate form before advancing
    if (this.form && !(await this.validateForm())) {
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
  async validateForm() {
    if (!this.form) return true;

    // Step 1: Validate campaign name
    if (this.currentStep === 0) {
      const nameInput = document.getElementById('name');
      const validator = $(this.form).validate();

      if (nameInput && !nameInput.value.trim()) {
        validator.showErrors({
          "name": "Campaign name is required (minimum 2 characters)."
        });
        $(nameInput).addClass('border-red-500');
        nameInput.focus();
        nameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return false;
      } else {
        validator.resetForm();
        $(nameInput).removeClass('border-red-500');
      }
    }

    // Step 2: Validate department or group selection
    if (this.currentStep === 1) {
      // Check for selected departments and groups from hidden inputs
      const departmentIds = document.querySelectorAll('input[name="departmentIds[]"]');
      const groupIds = document.querySelectorAll('input[name="groupIds[]"]');

      console.log('Validation - Department IDs found:', departmentIds.length);
      console.log('Validation - Group IDs found:', groupIds.length);
      
      // Debug: Log actual hidden inputs
      departmentIds.forEach((input, index) => {
        console.log(`Department ${index + 1}: ID=${input.value}, Name=${input.nextElementSibling?.value || 'N/A'}`);
      });
      groupIds.forEach((input, index) => {
        console.log(`Group ${index + 1}: ID=${input.value}, Name=${input.nextElementSibling?.value || 'N/A'}`);
      });

      const hasDepartments = departmentIds.length > 0;
      const hasGroups = groupIds.length > 0;

      // Get all tag-selector containers and find department/group selects
      const tagSelectors = Array.from(document.querySelectorAll('.tag-selector'));
      let departmentSelect = null;
      let groupSelect = null;

      tagSelectors.forEach(selector => {
        const label = selector.querySelector('label');
        if (label) {
          const labelText = label.textContent.trim();
          // Check for department (English and Arabic)
          if (labelText.toLowerCase().includes('department') || labelText.includes('قسم') || labelText.includes('القسم')) {
            departmentSelect = selector.querySelector('.groupSelect');
            console.log('Found department selector with label:', labelText);
          } 
          // Check for group (English and Arabic)
          else if (labelText.toLowerCase().includes('group') || labelText.includes('مجموعة') || labelText.includes('المجموعة')) {
            groupSelect = selector.querySelector('.groupSelect');
            console.log('Found group selector with label:', labelText);
          }
        }
      });

      // Check if there are any options available (excluding placeholder)
      const hasDepartmentOptions = departmentSelect && departmentSelect.options.length > 1;
      const hasGroupOptions = groupSelect && groupSelect.options.length > 1;

      console.log('Department options available:', hasDepartmentOptions);
      console.log('Group options available:', hasGroupOptions);

      if (!hasDepartmentOptions && !hasGroupOptions) {
        this.showValidationError(window.i18n?.validation_messages?.no_departments_groups || window.i18n?.sms?.validation_messages?.no_departments_groups || 'No departments or groups available. Please add users to departments or groups before creating a campaign.');
        return false;
      }

      if (!hasDepartments && !hasGroups) {
        this.showValidationError(window.i18n?.validation_messages?.select_department_group || window.i18n?.sms?.validation_messages?.select_department_group || 'Please select at least one department or group to target.');
        return false;
      }

      // Validate member count for selected departments and groups
      return this.validateMemberCount(departmentIds, groupIds);
    }

    // HTML5 validation check
    const currentStepElement = this.steps[this.currentStep];
    if (currentStepElement) {
      const requiredFields = currentStepElement.querySelectorAll('[required]');
      for (const field of requiredFields) {
        if (!field.value || (field.type === 'checkbox' && !field.checked) || (field.type === 'radio' && !document.querySelector(`input[name="${field.name}"]:checked`))) {
          console.warn('Required field not filled:', field.name || field.id);
          const validator = $(this.form).validate();
          validator.showErrors({
            [field.name]: `${field.name || field.id} is required.`
          });
          $(field).addClass('border-red-500');
          field.focus();
          field.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return false;
        }
      }
    }

    console.log('All validations passed for step:', this.currentStep);
    return true;
  }

  async validateMemberCount(departmentIds, groupIds) {
    console.log('=== MEMBER VALIDATION STARTED ===');
    console.log('Department IDs to check:', Array.from(departmentIds).map(input => input.value));
    console.log('Group IDs to check:', Array.from(groupIds).map(input => input.value));
    
    try {
      let hasMembers = false;
      const emptySelections = [];
      
      // Check departments
      for (const input of departmentIds) {
        const departmentId = input.value;
        // Get department name from the adjacent input or from the original option text
        const departmentNameInput = input.nextElementSibling;
        let departmentName = departmentId;
        
        if (departmentNameInput && departmentNameInput.name && departmentNameInput.name.includes('departmentNames')) {
          departmentName = departmentNameInput.value;
        } else {
          // Try to get name from the select option in the department selector
          const departmentSelectors = document.querySelectorAll('.tag-selector');
          for (const selector of departmentSelectors) {
            const label = selector.querySelector('label');
            if (label) {
              const labelText = label.textContent.trim();
              if (labelText.toLowerCase().includes('department') || labelText.includes('قسم') || labelText.includes('القسم')) {
                const select = selector.querySelector('.groupSelect');
                if (select) {
                  const option = [...select.options].find(opt => opt.value === departmentId);
                  if (option) {
                    departmentName = option.textContent.trim();
                    break;
                  }
                }
              }
            }
          }
        }
        
        try {
          console.log(`Checking department ${departmentId} (${departmentName})`);
          const response = await fetch(`/department/getUsersByDepartment/${departmentId}`, {
            method: 'GET',
            credentials: 'same-origin',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          const data = await response.json();
          console.log(`Department ${departmentId} response:`, data);
          
          if (data.success && data.assignedUsers && data.assignedUsers.length > 0) {
            console.log(`Department ${departmentId} has ${data.assignedUsers.length} members`);
            hasMembers = true;
          } else {
            console.log(`Department ${departmentId} has no members`);
            emptySelections.push(`Department: ${departmentName}`);
          }
        } catch (error) {
          console.error(`Error checking department ${departmentId}:`, error);
          emptySelections.push(`Department: ${departmentName} (validation failed)`);
        }
      }
      
      // Check groups
      for (const input of groupIds) {
        const groupId = input.value;
        // Get group name from the adjacent input or from the original option text
        const groupNameInput = input.nextElementSibling;
        let groupName = groupId;
        
        if (groupNameInput && groupNameInput.name && groupNameInput.name.includes('groupNames')) {
          groupName = groupNameInput.value;
        } else {
          // Try to get name from the select option in the group selector
          const groupSelectors = document.querySelectorAll('.tag-selector');
          for (const selector of groupSelectors) {
            const label = selector.querySelector('label');
            if (label) {
              const labelText = label.textContent.trim();
              if (labelText.toLowerCase().includes('group') || labelText.includes('مجموعة') || labelText.includes('المجموعة')) {
                const select = selector.querySelector('.groupSelect');
                if (select) {
                  const option = [...select.options].find(opt => opt.value === groupId);
                  if (option) {
                    groupName = option.textContent.trim();
                    break;
                  }
                }
              }
            }
          }
        }
        
        try {
          console.log(`Checking group ${groupId} (${groupName})`);
          const response = await fetch(`/group/getUsersByGroup/${groupId}`, {
            method: 'GET',
            credentials: 'same-origin',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          const data = await response.json();
          console.log(`Group ${groupId} response:`, data);
          
          if (data.success && data.assignedUsers && data.assignedUsers.length > 0) {
            console.log(`Group ${groupId} has ${data.assignedUsers.length} members`);
            hasMembers = true;
          } else {
            console.log(`Group ${groupId} has no members`);
            emptySelections.push(`Group: ${groupName}`);
          }
        } catch (error) {
          console.error(`Error checking group ${groupId}:`, error);
          emptySelections.push(`Group: ${groupName} (validation failed)`);
        }
      }
      
      console.log('Member validation summary:');
      console.log('- hasMembers:', hasMembers);
      console.log('- emptySelections:', emptySelections);
      
      // If no members found in any selected department or group
      if (!hasMembers && emptySelections.length > 0) {
        const message = window.i18n?.validation_messages?.no_members_in_selection || window.i18n?.sms?.validation_messages?.no_members_in_selection || 
          `The selected departments/groups have no members. Please select departments or groups with members, or add members to the selected ones: ${emptySelections.join(', ')}`;
        console.log('Showing error for empty selections:', message);
        this.showValidationError(message);
        return false;
      }
      
      // If there are some empty selections but at least one has members, show warning but allow continuation
      if (emptySelections.length > 0 && hasMembers) {
        const warningMessage = window.i18n?.validation_messages?.some_empty_selections || window.i18n?.sms?.validation_messages?.some_empty_selections || 
          `Warning: Some selections have no members: ${emptySelections.join(', ')}. The campaign will only target departments/groups with members.`;
        console.warn(warningMessage);
      }
      
      console.log('Step 2 member validation passed!');
      return true;
      
    } catch (error) {
      console.error('Error during member validation:', error);
      this.showValidationError(window.i18n?.validation_messages?.validation_failed || window.i18n?.sms?.validation_messages?.validation_failed || 'Validation failed. Please try again.');
      return false;
    }
  }

  showValidationError(message) {
    // Create or get error message container
    let errorContainer = document.getElementById('step-validation-error');

    if (!errorContainer) {
      errorContainer = document.createElement('div');
      errorContainer.id = 'step-validation-error';
      errorContainer.className = 'bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4';
      errorContainer.setAttribute('role', 'alert');

      // Insert at the beginning of current step
      const currentStepElement = this.steps[this.currentStep];
      if (currentStepElement) {
        currentStepElement.insertBefore(errorContainer, currentStepElement.firstChild);
      }
    }

    errorContainer.innerHTML = `
      <div class="flex items-start">
        <span class="flex-shrink-0 mr-2">⚠️</span>
        <div class="flex-1">
          <strong class="font-medium">${window.i18n?.validation_messages?.validation_error || window.i18n?.sms?.validation_messages?.validation_error || 'Validation Error:'}</strong>
          <span class="block mt-1">${message}</span>
        </div>
        <button type="button" class="ml-4 text-red-700 hover:text-red-900" onclick="this.parentElement.parentElement.remove()">
          ✕
        </button>
      </div>
    `;

    errorContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
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