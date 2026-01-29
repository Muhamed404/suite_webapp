// Verify window.i18n exists before using it

const file_attachment_screen = 3;
const phishing_content_screen = 4;
const url_phishing_screen = 5;
const phishing_webpage_screen = 6;
const phishing_landing_page_screen = 7;
const sms_phishing_screen = 8;
const difficulty_level_open_email = '1';
const difficulty_level_download_file = '2';
const difficulty_level_url_click = '3';
const difficulty_level_sms_short_message = '1';
// const difficulty_level_sms_attach_url = '2';
const radios = document.querySelectorAll('input[name="phish_option"]');
const customInput = document.getElementById('custom-url-input');
const editors = ['phishing_content', 'phishing_page_content', 'landing_page_content', 'sms_phishing_content'];
// ✅ Conditions for step 2 options
const conditions = {
  email: [
    { id: 'open', title: 'Open Email (Level 1)', value: 'simple', difficulty_level: 1, desc: window.i18n ? window.i18n.__('system_template.create.simplePhishingDescription') : 'Simple phishing email template to monitor email open by users.' },
    { id: 'download', title: window.i18n ? window.i18n.__('system_template.create.downloadFileBasedTitle') : 'Download File Based (Level 2)', value: 'attachment', difficulty_level: 2, desc: window.i18n ? window.i18n.__('system_template.create.downloadFileBasedDescription') : 'Phishing email template with file attached in the message to monitor download by users.' },
    { id: 'url', title: window.i18n ? window.i18n.__('system_template.create.urlClickBasedTitle') : 'URL Click Based (Level 3)', value: 'click_url', difficulty_level: 3, desc: window.i18n ? window.i18n.__('system_template.create.urlClickBasedDescription') : 'Email template with a dedicated URL for testing users visiting the phishing page.' }
  ],
  nfc: [
    { id: 'download', title: window.i18n ? window.i18n.__('system_template.create.downloadFileBasedTitle') : 'Download File Based (Level 2)', value: 'attachment', difficulty_level: 2, desc: window.i18n ? window.i18n.__('system_template.create.downloadFileBasedDescription') : 'Phishing nfc template with file attached in the message to monitor download by users.' },
    { id: 'url', title: window.i18n ? window.i18n.__('system_template.create.urlClickBasedTitle') : 'URL Click Based (Level 3)', value: 'click_url', difficulty_level: 3, desc: window.i18n ? window.i18n.__('system_template.create.urlClickBasedDescription') : 'NFC template with a dedicated URL for testing users visiting the phishing page.' }
  ],
  qr: [
    { id: 'download', title: window.i18n ? window.i18n.__('system_template.create.downloadFileBasedTitle') : 'Download File Based (Level 2)', value: 'attachment', difficulty_level: 2, desc: window.i18n ? window.i18n.__('system_template.create.downloadFileBasedDescription') : 'Phishing qr template with file attached in the message to monitor download by users.' },
    { id: 'url', title: window.i18n ? window.i18n.__('system_template.create.urlClickBasedTitle') : 'URL Click Based (Level 3)', value: 'click_url', difficulty_level: 3, desc: window.i18n ? window.i18n.__('system_template.create.urlClickBasedDescription') : 'QR template with a dedicated URL for testing users visiting the phishing page.' }
  ],

  sms: [
    { id: 'short', title: 'Short Message (Level 1)', difficulty_level: 1, desc: 'Send a simple SMS message.' },
    { id: 'download', title: window.i18n ? window.i18n.__('system_template.create.downloadFileBasedTitle') : 'Download File Based (Level 2)', value: 'attachment', difficulty_level: 2, desc: window.i18n ? window.i18n.__('system_template.create.downloadFileBasedDescription') : 'Phishing SMS template with file attached in the message to monitor download by users.' },
    { id: 'url', title: window.i18n ? window.i18n.__('system_template.create.urlClickBasedTitle') : 'URL Click Based (Level 3)', value: 'click_url', difficulty_level: 3, desc: window.i18n ? window.i18n.__('system_template.create.urlClickBasedDescription') : 'SMS template with a dedicated URL for testing users visiting the phishing page.' }
  ],
  whatsapp: [
    { id: 'short', title: 'Short Message', difficulty_level: 1, desc: 'Send a simple SMS message.' },
    { id: 'attach', title: 'Attach URL', difficulty_level: 2, desc: 'Include a clickable link in SMS.' },
    { id: 'template', title: 'Download Template', difficulty_level: 3, desc: 'Use a ready-made SMS template.' }
  ],
};


// ✅ Navigation rules for skipping steps
const customRules = [
  // email
  { phishType: 'email', options: [difficulty_level_open_email], goTo: [phishing_content_screen] },
  {
    phishType: 'email', options: [difficulty_level_open_email, difficulty_level_download_file],
    goTo: [file_attachment_screen, phishing_content_screen]
  }, // file attachment, phishing content, 
  {
    phishType: 'email', options: [difficulty_level_open_email, difficulty_level_download_file, difficulty_level_url_click],
    goTo: [file_attachment_screen, phishing_content_screen, url_phishing_screen, phishing_webpage_screen, phishing_landing_page_screen]
  }, // all steps
  {
    phishType: 'email', options: [difficulty_level_open_email, difficulty_level_url_click],
    goTo: [phishing_content_screen, url_phishing_screen, phishing_webpage_screen, phishing_landing_page_screen]
  }, // open email, url click, file attachment, phishing content, url phish, webpage, landing
  {
    phishType: 'email', options: [difficulty_level_download_file],
    goTo: [file_attachment_screen, phishing_content_screen]
  }, // file attachment, phishing content
  {
    phishType: 'email', options: [difficulty_level_url_click],
    goTo: [phishing_content_screen, url_phishing_screen, phishing_webpage_screen, phishing_landing_page_screen]
  }, // phishing content, url phish, webpage, landing
  {
    phishType: 'email', options: [difficulty_level_download_file, difficulty_level_url_click],
    goTo: [file_attachment_screen, phishing_content_screen, url_phishing_screen, phishing_webpage_screen, phishing_landing_page_screen]
  }, // file attachment, phishing content, url phish, webpage, landing


  // nfc
  {
    phishType: 'nfc', options: [difficulty_level_download_file, difficulty_level_url_click],
    goTo: [file_attachment_screen, url_phishing_screen, phishing_webpage_screen, phishing_landing_page_screen]
  },
  {
    phishType: 'nfc', options: [difficulty_level_url_click],
    goTo: [url_phishing_screen, phishing_webpage_screen, phishing_landing_page_screen]
  },
  { phishType: 'nfc', options: [difficulty_level_download_file], goTo: [file_attachment_screen] },

  // qr
  {
    phishType: 'qr', options: [difficulty_level_download_file, difficulty_level_url_click],
    goTo: [file_attachment_screen, url_phishing_screen, phishing_webpage_screen, phishing_landing_page_screen]
  },
  {
    phishType: 'qr', options: [difficulty_level_url_click],
    goTo: [url_phishing_screen, phishing_webpage_screen, phishing_landing_page_screen]
  },
  { phishType: 'qr', options: [difficulty_level_download_file], goTo: [file_attachment_screen] },
  //sms
  { phishType: 'sms', options: [difficulty_level_sms_short_message], goTo: [sms_phishing_screen] },
  { phishType: 'sms', options: [difficulty_level_sms_short_message, difficulty_level_download_file], goTo: [file_attachment_screen, sms_phishing_screen] },
  {
    phishType: 'sms', options: [difficulty_level_sms_short_message, difficulty_level_url_click],
    goTo: [sms_phishing_screen, url_phishing_screen, phishing_webpage_screen, phishing_landing_page_screen]
  },
  { phishType: 'sms', options: [difficulty_level_download_file], goTo: [file_attachment_screen, sms_phishing_screen] },
  {
    phishType: 'sms', options: [difficulty_level_download_file, difficulty_level_url_click],
    goTo: [file_attachment_screen, sms_phishing_screen, url_phishing_screen, phishing_webpage_screen, phishing_landing_page_screen]
  },
  {
    phishType: 'sms', options: [difficulty_level_url_click],
    goTo: [sms_phishing_screen, url_phishing_screen, phishing_webpage_screen, phishing_landing_page_screen]
  },
  // { phishType: 'sms', options: ['Download Template'], goTo: [file_attachment_screen, 6, 7] },
  //whatsapp
  { phishType: 'whatsapp', options: [difficulty_level_sms_short_message], goTo: [sms_phishing_screen] },
  {
    phishType: 'whatsapp', options: [difficulty_level_url_click],
    goTo: [sms_phishing_screen, url_phishing_screen, phishing_webpage_screen, phishing_landing_page_screen]
  },
];


CKEDITOR.replace('phishing_content', {
  height: 400,
  width: '100%',
  resize_enabled: true,
});

CKEDITOR.instances.phishing_content.on('mode', function () {
  // alert('Mode changed to: ' + this.mode);
  if (this.mode === 'source') {
    this.resize(this.container.$.offsetWidth, 700); // Keep width/height same
  }
});



CKEDITOR.replace('phishing_page_content', {
  height: 400,
  width: '100%',
  resize_enabled: true,
});

CKEDITOR.instances.phishing_page_content.on('mode', function () {
  // alert('Mode changed to: ' + this.mode);
  if (this.mode === 'source') {
    this.resize(this.container.$.offsetWidth, 700); // Keep width/height same
  }
});


CKEDITOR.replace('landing_page_content', {
  height: 400,
  width: '100%',
  resize_enabled: true,
});

CKEDITOR.instances.landing_page_content.on('mode', function () {
  // alert('Mode changed to: ' + this.mode);
  if (this.mode === 'source') {
    this.resize(this.container.$.offsetWidth, 700); // Keep width/height same
  }
});

let currentStep = 0;
(() => {
  // ✅ Select DOM elements
  const steps = Array.from(document.querySelectorAll('.step'));
  const progressWrap = document.getElementById('progress');
  const checkboxContainer = document.getElementById('checkbox-options');
  const previewEl = document.getElementById('preview');
  const prevBtn = document.getElementById('prev');
  const nextBtn = document.getElementById('next');
  const emailContent = document.getElementById('email-content'); // ✅ Added reference
  // ✅ Variables

  let activeFlow = Array.from({ length: steps.length }, (_, i) => i); // Default: all steps
  let history = [0]; // Track visited steps
  const formData = {};
  let selectedPhishType = null;



  const stepTitles = window.i18n && window.i18n.stepTitles ? window.i18n.stepTitles : [];

  function renderProgressBar() {
    // alert('Rendering progress bar for step ' + (currentStep));
    progressWrap.innerHTML = '';
    // alert( 'Active Flow: ' + JSON.stringify(activeFlow));
    const currentIndexInFlow = activeFlow.indexOf(currentStep);
    activeFlow.forEach((stepIndex, i) => {
      const isActive = i === currentIndexInFlow;
      const isCompleted = i < currentIndexInFlow;
      const circle = document.createElement('div');
      circle.className = 'flex flex-col items-start text-center flex-shrink-0';
      circle.style.width = '125px';
      circle.innerHTML = `
        <div class="w-8 h-8 flex items-center justify-center rounded-full border-2 mx-auto
          ${isActive
          ? 'bg-teal-400 text-white border-teal-400'
          : isCompleted
            ? 'bg-teal-500 text-white border-teal-500'
            : 'bg-white text-gray-600 border-gray-300'}">
          ${i + 1}
        </div>
        <div class="text-xs mt-1 px-1 leading-tight w-full font-semibold" style="min-height: 32px; word-wrap: break-word;">${stepTitles[stepIndex]}</div>
      `;
      progressWrap.appendChild(circle);
      // alert(progressWrap.innerHTML);
      if (i < activeFlow.length - 1) {
        const isLineActive = i < currentIndexInFlow;
        const line = document.createElement('div');
        line.className = `h-1 flex-shrink-0 ${isLineActive ? 'bg-teal-400' : 'bg-gray-200'}`;
        line.style.width = '60px';
        line.style.marginTop = '16px';
        progressWrap.appendChild(line);
      }

      // alert(progressWrap.innerHTML);

    });
  }

  function showStep(index) {
    // alert('Showing step ' + (index + 1));
    steps.forEach((el, i) => el.classList.toggle('hidden', i !== index));
    currentStep = index;
    prevBtn.disabled = history.length <= 1;
    const currentPos = activeFlow.indexOf(currentStep);
    // alert('Current Position in Active Flow: ' + currentPos);
    nextBtn.textContent = currentPos === activeFlow.length - 1 ? window.i18n.finish : window.i18n.next;
    if (index === steps.length - 1) {
      previewEl.textContent = JSON.stringify(formData, null, 2);
    }
    renderProgressBar();

    // Show/hide placeholder buttons based on current step
    const placeholderButtons = document.getElementById('placeholder-buttons');
    const allowedScreens = [phishing_content_screen - 1, phishing_webpage_screen - 1, phishing_landing_page_screen - 1, sms_phishing_screen - 1]; // include landing page step if needed

    // Check if user selected custom landing page
    let showPlaceholders = allowedScreens.includes(index);
    if (index === phishing_landing_page_screen - 1) {
      const customLandingRadio = document.querySelector('input[name="landing_option"][value="custom"]');
      if (!customLandingRadio || !customLandingRadio.checked) {
        showPlaceholders = false;
      }
    }

    if (placeholderButtons) {
      placeholderButtons.style.display = showPlaceholders ? '' : 'none';
    }
    updatePhishingPlaceholderVisibility();
  }


  function updatePhishingPlaceholderVisibility() {
    // Email placeholders
    const tagPhishingUrl = document.getElementById('tag_phishing_url');
    const tagPhishingFile = document.getElementById('tag_phishing_file');
    // SMS placeholders
    const tagSmsPhishingUrl = document.getElementById('tag_sms_phishing_url');
    const tagSmsPhishingFile = document.getElementById('tag_sms_phishing_file');
    
    // Get the selected tracking options from step 2 (stored in formData.step2.options)
    const selectedOptions = (formData.step2 && formData.step2.options) ? formData.step2.options : [];
    
    // Level constants: Level 1 = '1', Level 2 = '2' (Download File), Level 3 = '3' (URL Click)
    const hasLevel2 = selectedOptions.includes(difficulty_level_download_file);
    const hasLevel3 = selectedOptions.includes(difficulty_level_url_click);
    const hasLevel2Or3 = hasLevel2 || hasLevel3;
    
    // Handle EMAIL template placeholders
    if (selectedPhishType === 'email') {
      const hasOnlyEmailLevel1 = selectedOptions.length === 1 && selectedOptions.includes(difficulty_level_open_email);
      
      if (hasOnlyEmailLevel1 && !hasLevel2Or3) {
        // Only Level 1 selected - hide both placeholders
        if (tagPhishingUrl) tagPhishingUrl.style.display = 'none';
        if (tagPhishingFile) tagPhishingFile.style.display = 'none';
      } else {
        // Show based on which levels are selected
        if (tagPhishingUrl) {
          tagPhishingUrl.style.display = hasLevel3 ? 'inline-block' : 'none';
        }
        if (tagPhishingFile) {
          tagPhishingFile.style.display = hasLevel2 ? 'inline-block' : 'none';
        }
      }
    }
    
    // Handle SMS template placeholders
    if (selectedPhishType === 'sms') {
      const hasOnlySmsLevel1 = selectedOptions.length === 1 && selectedOptions.includes(difficulty_level_sms_short_message);
      
      if (hasOnlySmsLevel1 && !hasLevel2Or3) {
        // Only Level 1 selected - hide both placeholders
        if (tagSmsPhishingUrl) tagSmsPhishingUrl.style.display = 'none';
        if (tagSmsPhishingFile) tagSmsPhishingFile.style.display = 'none';
      } else {
        // Show based on which levels are selected
        if (tagSmsPhishingUrl) {
          tagSmsPhishingUrl.style.display = hasLevel3 ? 'inline-block' : 'none';
        }
        if (tagSmsPhishingFile) {
          tagSmsPhishingFile.style.display = hasLevel2 ? 'inline-block' : 'none';
        }
      }
    }
  }

  function saveDataForStep(idx) {
    // alert('Saving data for step ' + (idx + 1));
    const stepEl = steps[idx];
    const inputs = Array.from(stepEl.querySelectorAll('input'));
    const key = `step${idx + 1}`;
    formData[key] = {};
    inputs.forEach(inp => {
      const name = inp.name || ('_anon_' + idx);
      if (inp.type === 'radio') {
        if (inp.checked) formData[key][name] = inp.value;
      } else if (inp.type === 'checkbox') {
        if (!formData[key][name]) formData[key][name] = [];
        if (inp.checked) formData[key][name].push(inp.value);
      } else {
        formData[key][name] = inp.value;
      }
    });

    // Debug: Display all collected data for this step AND entire form
    // alert('Save Data for Step ' + (idx + 1) + ':\n\n' +
    //       'Step Key: ' + key + '\n\n' +
    //       'Inputs Found: ' + inputs.length + '\n\n' +
    //       'Current Step Data:\n' + JSON.stringify(formData[key], null, 2) + '\n\n' +
    //       '========================================\n' +
    //       'ENTIRE FORM DATA (All Steps):\n' +
    //       '========================================\n' +
    //       JSON.stringify(formData, null, 2));
  }

  function computeMatchingRule(phishType, selectedOptions) {
    // alert('compute matching rule alert');
    // alert('Computing matching rule for phishType: ' + phishType + '\nselectedOptions: ' + JSON.stringify(selectedOptions));
    // Debug: Show types and values
    // alert('computeMatchingRule called!\nphishType: ' + phishType + '\nselectedOptions: ' + JSON.stringify(selectedOptions) + '\nType: ' + typeof selectedOptions);

    // Always treat selectedOptions as array
    let opts = selectedOptions;
    // alert('Initial opts: ' + JSON.stringify(opts) + '\nType: ' + typeof opts);
    if (!Array.isArray(opts)) {
      opts = opts ? [opts] : [];
      // alert('selectedOptions was not array, converted to: ' + JSON.stringify(opts));
    }

    // For numeric rules, convert to numbers
    if (['email', 'nfc', 'qr', 'sms'].includes(phishType)) {
      opts = opts.map(String); // customRules uses strings like '1', '2', '3'
      // alert('Converted opts for numeric rules: ' + JSON.stringify(opts));
    }

    // For string rules, keep as is

    // Debug: Show all candidate rules
    // alert('customRules: ' + JSON.stringify(customRules));

    const candidates = customRules.filter(r =>
      r.phishType === phishType &&
      r.options.length === opts.length &&
      r.options.every(o => opts.includes(o))
    );

    // alert('Candidates found: ' + candidates.length + '\n' + JSON.stringify(candidates));

    if (!candidates.length) return null;
    candidates.sort((a, b) => b.options.length - a.options.length);
    // alert('Matched rule: ' + JSON.stringify(candidates[0]));
    return candidates[0];
  }

  function buildActiveFlow(matchedRule) {
    // alert('build active flow alert');
    // alert('Building active flow based on matched rule: ' + JSON.stringify(matchedRule));
    if (!matchedRule) return Array.from({ length: steps.length }, (_, i) => i);
    const goToZeroBased = matchedRule.goTo.map(n => n - 1);
    const uniq = [0, 1];
    goToZeroBased.forEach(x => { if (!uniq.includes(x)) uniq.push(x); });
    return uniq;
  }

  function renderOptions(type) {
    // alert('render options alert');
    // alert('Rendering options for type: ' + type);
    checkboxContainer.innerHTML = '';

    conditions[type].forEach((option, index) => {
      const id = `option-${index}`;
      const wrapper = document.createElement('label');
      wrapper.className = 'custom-option';

      wrapper.innerHTML = `
        <input type="checkbox" id="${id}" name="options"   
         value="${option.difficulty_level !== undefined ? option.difficulty_level : option.id}" class="hidden-checkbox"  />
        <span class="custom-circle"></span>
        <div class="text-content">
          <span class="text-2xl font-medium mb-2">${option.title}</span>
          <p class="text-sm">${option.desc}</p>
        </div>
      `;
      checkboxContainer.appendChild(wrapper);
    });
  }


  function handleNext() {
    // alert('handle next alert');
    // alert('Handling Next for current step ' + (currentStep));
    // renderProgressBar();
    // alert('Handling Next for next step ' + (currentStep + 1));
    
    // Validate current step before proceeding
    if (typeof window.validateCurrentStep === 'function') {
      const isValid = window.validateCurrentStep(currentStep, selectedPhishType);
      if (!isValid) {
        return; // Stop if validation fails
      }
    }
    
    saveDataForStep(currentStep);
    const sel = formData.step1.phishType;
    if (currentStep === 0) {
      // alert('currentStep Processing selections for step 0...');
      if (!sel) {
        // Validation already handled by validateCurrentStep
        return;
      }
      selectedPhishType = sel;

      // ✅ NEW FEATURE: Hide email if NFC selected
      if (selectedPhishType === 'nfc' && emailContent) {
        emailContent.style.display = 'none';
        document.getElementById('tag_phishing_url').style.display = 'inline-block';
      }

      if (selectedPhishType === 'qr' && emailContent) {
        emailContent.style.display = 'none';
        document.getElementById('tag_phishing_url').style.display = 'inline-block';
      }


      renderOptions(selectedPhishType);
      history.push(1);
      showStep(1);
      return;
    }
    if (currentStep === 1) {// when you select phishing type options, then it will come here
      // alert('currentStep Processing selections for step 1...');
      const selectedOptions = (formData.step2.options) ? formData.step2.options : [];
      if (selectedOptions.length === 0) {
        // Validation already handled by validateCurrentStep
        return;
      }
      const matched = computeMatchingRule(selectedPhishType, selectedOptions);
      activeFlow = buildActiveFlow(matched);
      // alert('Active Flow Steps: ' + JSON.stringify(activeFlow));
      const idxInFlow = activeFlow.indexOf(1);
      const nextInFlow = activeFlow[idxInFlow + 1] || steps.length - 1;
      // alert('Next Step in Flow: ' + nextInFlow);
      history.push(nextInFlow);
      // alert('Navigating to step ' + (nextInFlow + 1));
      renderProgressBar();
      if (selectedPhishType === 'sms' && selectedOptions.includes(difficulty_level_download_file)) {
        // Show the button
        document.getElementById("tag_sms_phishing_file").style.display = "inline-block";

      }
      showStep(nextInFlow);
      return;
    }

    // showStep(nextInFlow);

    if (sel === 'nfc' || sel === 'qr' || sel === 'email' || sel === 'sms' || sel === 'whatsapp') {
      // Remove landing page step if phish_option is 'simple'
      // const phishOption = (formData.step3 && formData.step3.phish_option) ? formData.step3.phish_option : null;
      // alert(phishOption)
      const phishOption = document.querySelector(
        'input[name="phish_option"]:checked'
      )?.value;
      // alert('.... '+phishOption)
      const landingStepIdx = activeFlow.indexOf(phishing_landing_page_screen - 1);
      if (phishOption === 'simple') {
        // Remove landing page step if present
        if (landingStepIdx !== -1) {
          // alert('Removing landing page step as simple option selected');
          activeFlow.splice(landingStepIdx, 1);
        }
      }
    }
    const idx = activeFlow.indexOf(currentStep);
    // alert('Current Step: ' + currentStep + '\nIndex in Flow: ' + idx + '\nActive Flow: ' + JSON.stringify(activeFlow));
    if (idx < activeFlow.length - 1) {
      const nextStepIndex = activeFlow[idx + 1];
      history.push(nextStepIndex);
      showStep(nextStepIndex);
      return;
    }
    document.getElementById('templateCreationForm').submit();

  }

  function handlePrev() {
    // alert('Handling Prev for step ' + (currentStep + 1));
    if (history.length <= 1) return;
    history.pop();
    const prev = history[history.length - 1];
    currentStep = prev;
    showStep(currentStep);
  }

  function init() {
    renderProgressBar();
    showStep(0);
    nextBtn.addEventListener('click', handleNext);
    prevBtn.addEventListener('click', handlePrev);
  }

  init();
})();

function insertPlaceholder(placeholder) {
  // Map step index to editor id
  const stepToEditor = {
    [phishing_content_screen - 1]: editors[0],
    [phishing_webpage_screen - 1]: editors[1],
    [phishing_landing_page_screen - 1]: editors[2],
    [sms_phishing_screen - 1]: editors[3]


  };

  // Get the current editor id for the active step
  const editorId = stepToEditor[currentStep];
  let editor = null;

  if (editorId && CKEDITOR.instances[editorId]) {
    editor = CKEDITOR.instances[editorId];
  }

  if (editor) {
    editor.insertText('<%=' + placeholder + '%>');
  } else {
    // fallback: append to phishing_content textarea
    const existing = $('#phishing_content').val();
    $('#phishing_content').val(existing + '<%=' + placeholder + '%>');
  }
}



radios.forEach(radio => {
  radio.addEventListener('change', () => {
    if (radio.value === 'custom-url') {
      customInput.classList.remove('hidden');
    } else {
      customInput.classList.add('hidden');
    }
  });
});



editors.forEach(id => {
  CKEDITOR.replace(id, {
    // Use full toolbar
    toolbar: 'Full'
  });
});


let editorInstance;

// Hide the editor container on page load
document.getElementById('editor-container').style.display = 'none';

document.querySelectorAll('input[name="landing_option"]').forEach(radio => {
  radio.addEventListener('change', function () {
    // alert('Landing page option changed to: ' + this.value);
    const editorContainer = document.getElementById('editor-container');
    const placeholder_buttons_landing_page_content = document.getElementById('placeholder_buttons_landing_page_content');
    if (this.value === 'custom') {
      editorContainer.style.display = 'block';
      placeholder_buttons_landing_page_content.style.display = 'flex';

    } else {
      CKEDITOR.instances['landing_page_content'].setData('');

      editorContainer.style.display = 'none';

    }
  });
});