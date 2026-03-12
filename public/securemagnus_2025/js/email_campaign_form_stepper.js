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
        name: window.i18n?.validation_messages?.campaign_name_required || "Campaign name is required (minimum 2 characters).",
        templateId: window.i18n?.validation_messages?.template_required || "Please select a template.",
        startTime: window.i18n?.validation_messages?.start_time_required || "Start date and time are required.",
        endTime: window.i18n?.validation_messages?.end_time_required || "End date and time are required."
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
        this.clearTemplatePreview();
        return;
      }
      this.syncHiddenTemplate({ 
        id: opt.value, 
        name: opt.textContent || opt.label || opt.value 
      });
      // Load template preview
      this.loadTemplatePreview(opt.value);
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
          "name": window.i18n?.validation_messages?.campaign_name_required || "Campaign name is required (minimum 2 characters)."
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

  // ===== TEMPLATE PREVIEW FUNCTIONALITY =====
  clearTemplatePreview() {
    const previewEmpty = document.getElementById('preview-empty');
    const previewContent = document.getElementById('preview-content');
    const previewLoading = document.getElementById('preview-loading');

    if (previewEmpty) previewEmpty.classList.remove('hidden');
    if (previewContent) previewContent.classList.add('hidden');
    if (previewLoading) previewLoading.classList.add('hidden');

    // Reset all preview buttons
    const buttons = document.querySelectorAll('.preview-nav-btn');
    buttons.forEach(btn => {
      btn.disabled = true;
      btn.classList.add('hidden');
    });

    // Clear tracking information
    const container = document.getElementById('templateSelection');
    if (container) {
      const existingInfo = container.querySelector('.tracking-info');
      if (existingInfo) {
        existingInfo.remove();
      }
    }

    this.currentTemplateData = null;
    this.currentPreviewTab = 'email';
  }

  updateTrackingInfo() {
    const container = document.getElementById('templateSelection');
    if (!container || !this.currentTemplateData) return;

    // Remove existing tracking info
    const existingInfo = container.querySelector('.tracking-info');
    if (existingInfo) {
      existingInfo.remove();
    }

    const trackingDiv = document.createElement('div');
    trackingDiv.className = 'tracking-info mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg';

    // Determine available tracking features based on template data
    const hasEmailContent = !!(this.currentTemplateData.phishing_content ||
                              this.currentTemplateData.email_content || 
                              this.currentTemplateData.email_body || 
                              this.currentTemplateData.content || 
                              this.currentTemplateData.html_content);

    const hasLandingPage = !!(this.currentTemplateData.landing_page_content || 
                             this.currentTemplateData.landing_page || 
                             this.currentTemplateData.landing_page_html);

    const hasRedirectPage = !!(this.currentTemplateData.phishing_page_content || 
                              this.currentTemplateData.redirect_page || 
                              this.currentTemplateData.redirection_page || 
                              this.currentTemplateData.redirect_page_html);

    const hasAttachment = !!(this.currentTemplateData.file_attachment_path || 
                            this.currentTemplateData.attachment || 
                            this.currentTemplateData.attachment_url || 
                            this.currentTemplateData.file || 
                            this.currentTemplateData.file_url || 
                            this.currentTemplateData.file_attachment) &&
                          !!(this.currentTemplateData.inv && this.currentTemplateData.cid);

   
    const path = window.location.pathname || '';
    let linkText;
    if (path.includes('/nfc/')) {
      linkText = window.i18n?.generic_label?.nfcScanned || 'NFC Scanned';
    } else if (path.includes('/qr/')) {
      linkText = window.i18n?.generic_label?.qrScanned || 'QR Scanned';
    } else {
      linkText = window.i18n?.generic_label?.linkClicked || 'Track phishing simulation link clicked';
    }

    const trackingItems = [
      {
        text: window.i18n?.generic_label?.emailOpened || 'Track email opened',
        available: hasEmailContent,
        icon: hasEmailContent ? '<i class="fas fa-check text-green-500"></i>' : '<i class="fas fa-times text-red-500"></i>',
        color: hasEmailContent ? 'green' : 'blue'
      },
      {
        text: linkText,
        available: hasLandingPage || hasRedirectPage,
        icon: (hasLandingPage || hasRedirectPage) ? '<i class="fas fa-check text-green-500"></i>' : '<i class="fas fa-times text-red-500"></i>',
        color: (hasLandingPage || hasRedirectPage) ? 'green' : 'blue'
      },
      {
        text: window.i18n?.generic_label?.attachmentOpened || 'Track phishing simulation file downloaded (from email or landing page)',
        available: hasAttachment,
        icon: hasAttachment ? '<i class="fas fa-check text-green-500"></i>' : '<i class="fas fa-times text-red-500"></i>',
        color: hasAttachment ? 'green' : 'blue'
      },
      {
        text: window.i18n?.generic_label?.formSubmitted || 'Track data submitted through the phishing simulation form',
        available: hasLandingPage,
        icon: hasLandingPage ? '<i class="fas fa-check text-green-500"></i>' : '<i class="fas fa-times text-red-500"></i>',
        color: hasLandingPage ? 'green' : 'blue'
      },
      {
        text: window.i18n?.generic_label?.formInteraction || 'Track user interaction with the phishing simulation form',
        available: hasLandingPage,
        icon: hasLandingPage ? '<i class="fas fa-check text-green-500"></i>' : '<i class="fas fa-times text-red-500"></i>',
        color: hasLandingPage ? 'green' : 'blue'
      }
    ];

    trackingDiv.innerHTML = `
      <h4 class="text-sm font-semibold text-blue-800 mb-2">${window.i18n?.template?.tracking_header || 'This template will allow you to track the following items:'}</h4>
      <ul class="text-sm text-black space-y-1">
        ${trackingItems.map(item => `
          <li class="flex items-center">
            <span class="mr-2 flex-shrink-0">${item.icon}</span>
            ${item.text}
          </li>
        `).join('')}
      </ul>
    `;

    container.appendChild(trackingDiv);
  }

  async loadTemplatePreview(templateId) {
    if (!templateId) {
      console.log('No templateId provided, clearing preview');
      this.clearTemplatePreview();
      return;
    }

    console.log('Loading template preview for ID:', templateId);
    const previewEmpty = document.getElementById('preview-empty');
    const previewContent = document.getElementById('preview-content');
    const previewLoading = document.getElementById('preview-loading');
    const previewError = document.getElementById('preview-error');

    console.log('Preview elements:', {
      empty: !!previewEmpty,
      content: !!previewContent,
      loading: !!previewLoading,
      error: !!previewError
    });

    // Show loading state
    if (previewEmpty) previewEmpty.classList.add('hidden');
    if (previewContent) previewContent.classList.add('hidden');
    if (previewError) previewError.classList.add('hidden');
    if (previewLoading) previewLoading.classList.remove('hidden');

    try {
      const url = `/phm/template/api/view/${templateId}`;
      console.log('Fetching template from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`Failed to fetch template details: ${response.status}`);
      }

      const data = await response.json();
      console.log('Raw API response:', data);
      
      this.currentTemplateData = data.message || data.data || data;
      // currentPreviewTab will be set once we know which tabs have content

      console.log('Template Preview Loaded:', this.currentTemplateData);

      // Hide loading, show content
      if (previewLoading) previewLoading.classList.add('hidden');
      if (previewContent) previewContent.classList.remove('hidden');

      // Setup navigation buttons and determine which tab to show first
      const firstTab = this.setupPreviewNavigation();
      
      // Update tracking information based on template
      this.updateTrackingInfo();
      
      // Show initial tab (fall back to email for backwards compatibility)
      if (firstTab) {
        this.showPreviewTab(firstTab);
      } else {
        this.showPreviewTab('email');
      }

    } catch (error) {
      console.error('Error loading template preview:', error);
      console.error('Error stack:', error.stack);
      
      if (previewLoading) previewLoading.classList.add('hidden');
      if (previewError) {
        previewError.classList.remove('hidden');
        const errorText = previewError.querySelector('p');
        if (errorText) {
          errorText.textContent = 'Failed to load template preview. Please try again.';
        }
      }
    }
  }

  setupPreviewNavigation() {
    if (!this.currentTemplateData) {
      console.warn('setupPreviewNavigation: No template data available');
      return null;
    }

    console.log('Setting up preview navigation with data:', this.currentTemplateData);
    const buttons = document.querySelectorAll('.preview-nav-btn');
    console.log('Found preview navigation buttons:', buttons.length);
    let firstVisibleTab = null;
    
    buttons.forEach(btn => {
      const tab = btn.getAttribute('data-preview-tab');
      let hasContent = false;

      switch(tab) {
        case 'email':
          hasContent = !!(this.currentTemplateData.phishing_content ||
                         this.currentTemplateData.email_content || 
                         this.currentTemplateData.email_body || 
                         this.currentTemplateData.content || 
                         this.currentTemplateData.html_content);
          console.log(`Email content available: ${hasContent}`, {
            phishing_content: !!this.currentTemplateData.phishing_content,
            email_content: !!this.currentTemplateData.email_content
          });
          break;
        case 'landing':
          hasContent = !!(this.currentTemplateData.landing_page_content || 
                         this.currentTemplateData.landing_page || 
                         this.currentTemplateData.landing_page_html);
          console.log(`Landing page content available: ${hasContent}`);
          break;
        case 'redirect':
          hasContent = !!(this.currentTemplateData.phishing_page_content || 
                         this.currentTemplateData.redirect_page || 
                         this.currentTemplateData.redirection_page || 
                         this.currentTemplateData.redirect_page_html);
          console.log(`Redirect page content available: ${hasContent}`);
          break;
        case 'attachment':
          hasContent = !!(this.currentTemplateData.file_attachment_path || 
                         this.currentTemplateData.attachment || 
                         this.currentTemplateData.attachment_url || 
                         this.currentTemplateData.file || 
                         this.currentTemplateData.file_url || 
                         this.currentTemplateData.file_attachment) &&
                       !!(this.currentTemplateData.inv && this.currentTemplateData.cid);
          console.log(`Attachment available: ${hasContent}`);
          break;
      }

      // show button only if content exists
      const shouldShow = hasContent;
      btn.disabled = !hasContent;
      btn.classList.toggle('hidden', !shouldShow);

      if (hasContent && firstVisibleTab === null) {
        firstVisibleTab = tab;
      }

      if (hasContent) {
        // Remove any existing listeners by cloning
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.onclick = (e) => {
          e.preventDefault();
          console.log(`Button clicked for tab: ${tab}`);
          this.showPreviewTab(tab);
        };
        console.log(`Added click handler for ${tab} tab`);
      }
    });

    return firstVisibleTab;
  }

  showPreviewTab(tab) {
    if (!this.currentTemplateData) {
      console.warn('No template data available');
      return;
    }

    this.currentPreviewTab = tab;
    console.log('Switching to preview tab:', tab);
    
    // Update active button
    const buttons = document.querySelectorAll('.preview-nav-btn');
    buttons.forEach(btn => {
      if (btn.getAttribute('data-preview-tab') === tab) {
        btn.classList.remove('border-gray-300', 'text-gray-700', 'hover:border-teal-400', 'hover:text-teal-600');
        btn.classList.add('bg-teal-500', 'text-white', 'border-teal-500');
      } else {
        btn.classList.remove('bg-teal-500', 'text-white', 'border-teal-500');
        btn.classList.add('border-gray-300', 'text-gray-700', 'hover:border-teal-400', 'hover:text-teal-600');
      }
    });

    // Update preview title and content
    const previewTitle = document.getElementById('preview-title');
    const previewIframe = document.getElementById('preview-iframe');
    const previewAttachmentInfo = document.getElementById('preview-attachment-info');
    const previewNoContent = document.getElementById('preview-no-content');

    console.log('Preview elements found:', {
      title: !!previewTitle,
      iframe: !!previewIframe,
      attachmentInfo: !!previewAttachmentInfo,
      noContent: !!previewNoContent
    });

    // Hide all content areas first
    if (previewIframe) previewIframe.classList.add('hidden');
    if (previewAttachmentInfo) previewAttachmentInfo.classList.add('hidden');
    if (previewNoContent) previewNoContent.classList.add('hidden');

    let content = '';
    let title = '';

    switch(tab) {
      case 'email':
        title = 'Email Content';
        content = this.getEmailContent();
        console.log('Email content length:', content?.length || 0);
        if (content && !content.includes('No email content')) {
          if (previewIframe) {
            previewIframe.classList.remove('hidden');
            previewIframe.srcdoc = content;
            console.log('Email content loaded into iframe');
          }
        } else {
          if (previewNoContent) previewNoContent.classList.remove('hidden');
          console.log('No email content available');
        }
        break;

      case 'landing':
        title = 'Landing Page';
        content = this.getLandingPageContent();
        console.log('Landing page content length:', content?.length || 0);
        if (content && !content.includes('No landing page')) {
          if (previewIframe) {
            previewIframe.classList.remove('hidden');
            previewIframe.srcdoc = content;
            console.log('Landing page loaded into iframe');
          }
        } else {
          if (previewNoContent) previewNoContent.classList.remove('hidden');
          console.log('No landing page content available');
        }
        break;

      case 'redirect':
        title = 'Redirection Page';
        content = this.getRedirectPageContent();
        console.log('Redirect page content length:', content?.length || 0);
        if (content && !content.includes('No redirection page')) {
          if (previewIframe) {
            previewIframe.classList.remove('hidden');
            previewIframe.srcdoc = content;
            console.log('Redirect page loaded into iframe');
          }
        } else {
          if (previewNoContent) previewNoContent.classList.remove('hidden');
          console.log('No redirect page content available');
        }
        break;

      case 'attachment':
        title = 'Attachment';
        const attachmentUrl = this.getAttachmentUrl();
        console.log('Attachment URL:', attachmentUrl);
        if (attachmentUrl) {
          if (previewAttachmentInfo) {
            previewAttachmentInfo.classList.remove('hidden');
            const attachmentName = document.getElementById('attachment-name');
            if (attachmentName) {
              const displayName = this.currentTemplateData?.attachment_filename || 
                                 this.currentTemplateData?.file_name || 
                                 attachmentUrl.split('/').pop() || 
                                 'File Attachment';
              attachmentName.textContent = displayName;
              console.log('Attachment name set to:', displayName);
            }
            const downloadBtn = document.getElementById('btn-download-attachment-inline');
            console.log('Download button element found:', !!downloadBtn);
            if (downloadBtn) {
              // Remove any existing click handlers
              const newBtn = downloadBtn.cloneNode(true);
              downloadBtn.parentNode.replaceChild(newBtn, downloadBtn);
              
              newBtn.onclick = (e) => {
                e.preventDefault();
                console.log('Download button clicked!');
                this.downloadAttachment();
              };
              console.log('Download button click handler attached');
            }
            console.log('Attachment info displayed');
          }
        } else {
          if (previewNoContent) previewNoContent.classList.remove('hidden');
          console.log('No attachment available');
        }
        break;
    }

    if (previewTitle) {
      previewTitle.textContent = title;
      console.log('Preview title set to:', title);
    }
  }

  getEmailContent() {
    const content = this.currentTemplateData?.phishing_content || 
                   this.currentTemplateData?.email_content || 
                   this.currentTemplateData?.email_body || 
                   this.currentTemplateData?.content || 
                   this.currentTemplateData?.html_content;
    
    console.log('getEmailContent - phishing_content:', this.currentTemplateData?.phishing_content?.substring(0, 100));
    return content || '<p class="text-gray-500 p-4">No email content available.</p>';
  }

  getLandingPageContent() {
    const content = this.currentTemplateData?.landing_page_content || 
                   this.currentTemplateData?.landing_page || 
                   this.currentTemplateData?.landing_page_html;
    
    console.log('getLandingPageContent - landing_page_content:', this.currentTemplateData?.landing_page_content?.substring(0, 100));
    return content || '<p class="text-gray-500 p-4">No landing page available.</p>';
  }

  getRedirectPageContent() {
    const content = this.currentTemplateData?.phishing_page_content || 
                   this.currentTemplateData?.redirect_page || 
                   this.currentTemplateData?.redirection_page || 
                   this.currentTemplateData?.redirect_page_html;
    
    console.log('getRedirectPageContent - phishing_page_content:', this.currentTemplateData?.phishing_page_content?.substring(0, 100));
    return content || '<p class="text-gray-500 p-4">No redirection page available.</p>';
  }

  getAttachmentUrl() {
    const url = this.currentTemplateData?.file_attachment_path || 
                this.currentTemplateData?.file_attachment || 
                this.currentTemplateData?.attachment_url || 
                this.currentTemplateData?.attachment || 
                this.currentTemplateData?.file_url || 
                this.currentTemplateData?.file;
    
    console.log('getAttachmentUrl - checking fields:', {
      file_attachment_path: this.currentTemplateData?.file_attachment_path,
      file_attachment: this.currentTemplateData?.file_attachment,
      attachment_url: this.currentTemplateData?.attachment_url,
      attachment: this.currentTemplateData?.attachment,
      file_url: this.currentTemplateData?.file_url,
      file: this.currentTemplateData?.file,
      resolved: url
    });
    
    return url;
  }

  downloadAttachment() {
    const attachmentUrl = this.getAttachmentUrl();
    
    console.log('Download attachment clicked');
    console.log('Attachment URL:', attachmentUrl);
    console.log('Attachment filename:', this.currentTemplateData?.attachment_filename);
    
    if (attachmentUrl) {
      // Extract inv and cid from template data first
      let inv = this.currentTemplateData?.inv;
      let cid = this.currentTemplateData?.cid;
      
      // If not found in template data, try to extract from email content
      if (!inv || !cid) {
        const emailContent = this.getEmailContent();
        const extracted = this.extractInvCidFromContent(emailContent);
        inv = inv || extracted.inv;
        cid = cid || extracted.cid;
      }
      
      // Fallback to undefined if still not found
      inv = inv || 'undefined';
      cid = cid || 'undefined';
      
      // Use the backend TVBS URL for download with dynamic inv and cid
      const backendUrl = `${window.backendTVBSUrl}/em/dfurl?inv=${inv}&cid=${cid}`;
      
      console.log('Backend URL for download:', backendUrl);
      console.log('Using inv:', inv, 'cid:', cid);
      
      // Create a link and trigger download
      const link = document.createElement('a');
      link.href = backendUrl;
      link.download = this.currentTemplateData?.attachment_filename || 'attachment';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('Download triggered');
    } else {
      console.warn('No attachment URL found');
      alert('No attachment available for download.');
    }
  }

  extractInvCidFromContent(content) {
    if (!content) return { inv: null, cid: null };
    
    // Look for URLs containing /em/dfurl?inv=...&cid=...
    const urlRegex = /\/em\/dfurl\?inv=([^&]+)&cid=([^&\s"']+)/g;
    const match = urlRegex.exec(content);
    
    if (match) {
      return {
        inv: match[1],
        cid: match[2]
      };
    }
    
    // Alternative: look for inv and cid separately in the content
    const invMatch = content.match(/inv=([^&]+)/);
    const cidMatch = content.match(/cid=([^&]+)/);
    
    return {
      inv: invMatch ? invMatch[1] : null,
      cid: cidMatch ? cidMatch[1] : null
    };
  }

  updatePreviewButtons() {
    // This method is no longer needed but keeping for backward compatibility
    this.setupPreviewNavigation();
  }

  showPreviewModal(title, htmlContent) {
    // Modal functionality replaced by inline preview
  }

  closePreviewModal() {
    // Modal functionality replaced by inline preview
  }

  submitForm() {
    if (!this.form || this.isSubmitting) return;

    const message = window.i18n?.messages?.confirmSubmit ||
      'Are you sure you want to submit this campaign? This action cannot be undone.';

    showCustomConfirm(message, () => {
      this.isSubmitting = true;
      this.updateButtons();

      // Convert datetime-local values (naive local strings) to UTC ISO 8601.
      ['startTime', 'endTime'].forEach((fieldId) => {
        const input = this.form.querySelector('#' + fieldId);
        if (input && input.value) {
          const localValue = input.value; // e.g. "2026-03-12T14:50" (user's local time)
          const d = new Date(localValue);
          if (!isNaN(d)) {
            input.removeAttribute('name');

            // UTC ISO value — what the backend stores and schedules against
            const utcHidden = document.createElement('input');
            utcHidden.type  = 'hidden';
            utcHidden.name  = fieldId;
            utcHidden.value = d.toISOString();
            this.form.appendChild(utcHidden);

            // Original local value + browser offset — for troubleshooting/logging only
            const localHidden = document.createElement('input');
            localHidden.type  = 'hidden';
            localHidden.name  = fieldId + 'Local';
            localHidden.value = localValue + ' (UTC' + (d.getTimezoneOffset() <= 0 ? '+' : '-') +
              String(Math.abs(Math.floor(-d.getTimezoneOffset() / 60))).padStart(2, '0') + ':' +
              String(Math.abs(d.getTimezoneOffset() % 60)).padStart(2, '0') + ')';
            this.form.appendChild(localHidden);
          }
        }
      });

      this.form.submit();
    });
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