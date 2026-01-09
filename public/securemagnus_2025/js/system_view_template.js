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
const editors = ['phishing_content', 'phishing_page_content', 'landing_page_content', 'sms_phishing_content'];
const disableSaveEdit = window.disableSaveEdit || false;

// ✅ Conditions for step 2 options
const conditions = {
  email: [
    { id: 'open', title: 'Open Email (Level 1)', value: 'simple', difficulty_level: 1, desc: 'Simple phishing email template to monitor email open by users.' },
    { id: 'download', title: 'Download File Based (Level 2)', value: 'attachment', difficulty_level: 2, desc: 'Phishing email template with file attached in the message to monitor download by users.' },
    { id: 'url', title: 'URL Click Based (Level 3)', value: 'click_url', difficulty_level: 3, desc: 'Email template with a dedicated URL for testing users visiting the phishing page.' }
  ],
  nfc: [
    { id: 'download', title: 'Download File Based (Level 2)', value: 'attachment', difficulty_level: 2, desc: 'Phishing nfc template with file attached in the message to monitor download by users.' },
    { id: 'url', title: 'URL Click Based (Level 3)', value: 'click_url', difficulty_level: 3, desc: 'NFC template with a dedicated URL for testing users visiting the phishing page.' }
  ],
  qr: [
    { id: 'download', title: 'Download File Based (Level 2)', value: 'attachment', difficulty_level: 2, desc: 'Phishing qr template with file attached in the message to monitor download by users.' },
    { id: 'url', title: 'URL Click Based (Level 3)', value: 'click_url', difficulty_level: 3, desc: 'QR template with a dedicated URL for testing users visiting the phishing page.' }
  ],

  sms: [
    { id: 'short', title: 'Short Message (Level 1)', difficulty_level: 1, desc: 'Send a simple SMS message.' },
    { id: 'download', title: 'Download File Based (Level 2)', value: 'attachment', difficulty_level: 2, desc: 'Phishing SMS template with file attached in the message to monitor download by users.' },
    { id: 'url', title: 'URL Click Based (Level 3)', value: 'click_url', difficulty_level: 3, desc: 'SMS template with a dedicated URL for testing users visiting the phishing page.' }
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

// Safe CKEditor init: only if element exists
(function safeInitCKEditors() {
  if (typeof CKEDITOR === 'undefined') return;
  editors.forEach(id => {
    try {
      const el = document.getElementById(id);
      if (!el) return;
      if (!CKEDITOR.instances[id]) {
        const instance = CKEDITOR.replace(id, { height: 400, width: '100%', resize_enabled: true });
        // ensure the editor receives the server-provided textarea content
        instance.on && instance.on('instanceReady', function () {
          try {
            // prefer textarea value (unescaped HTML injected by EJS using <%- ... %>)
            const initial = el.value || el.textContent || '';
            if (initial) instance.setData(initial);
          } catch (e) {
            console.warn('CKEditor setData failed for', id, e);
          }
        });
        instance.on && instance.on('mode', function () {
          if (this.mode === 'source') {
            try { this.resize(this.container.$.offsetWidth, 700); } catch (e) { }
          }
        });
      }
    } catch (e) {
      console.warn('CKEditor init failed for', id, e);
    }
  });
})();

let currentStep = 0;
(() => {
  // Select DOM elements
  const steps = Array.from(document.querySelectorAll('.step'));
  const progressWrap = document.getElementById('progress');
  const checkboxContainer = document.getElementById('checkbox-options');
  const previewEl = document.getElementById('preview');
  const prevBtn = document.getElementById('prev');
  const nextBtn = document.getElementById('next');
  const emailContent = document.getElementById('email-content');

  let activeFlow = Array.from({ length: steps.length }, (_, i) => i);
  let history = [0];
  const formData = {};
  let selectedPhishType = null;

  const stepTitles = [
    'Template Details',
    'Tracking Details',
    'File Attachment Setting (Optional)',
    'Phishing Content',
    'URL Phish Page Setting (Optional)',
    'Create Phishing Webpage (Optional)',
    'Landing Page (Optional)'
  ];

  function renderProgressBar() {
    if (!progressWrap) return;
    progressWrap.innerHTML = '';
    const currentIndexInFlow = activeFlow.indexOf(currentStep);
    activeFlow.forEach((stepIndex, i) => {
      const isActive = i === currentIndexInFlow;
      const isCompleted = i < currentIndexInFlow;
      const circle = document.createElement('div');
      circle.className = 'flex flex-col items-center text-center mx-2';
      circle.innerHTML = `
        <div class="w-8 h-8 flex items-center justify-center rounded-full border-2
          ${isActive ? 'bg-teal-400 text-white border-teal-400' : isCompleted ? 'bg-teal-500 text-white border-teal-500' : 'bg-white text-gray-600 border-gray-300'}">
          ${i + 1}
        </div>
        <div class="text-xs mt-1">${stepTitles[stepIndex] || ''}</div>
      `;
      progressWrap.appendChild(circle);
      if (i < activeFlow.length - 1) {
        const isLineActive = i < currentIndexInFlow;
        const line = document.createElement('div');
        line.className = `flex-1 h-1 ${isLineActive ? 'bg-teal-400' : 'bg-gray-200'}`;
        progressWrap.appendChild(line);
      }
    });
  }

  function showStep(index) {
    steps.forEach((el, i) => el.classList.toggle('hidden', i !== index));
    currentStep = index;
    if (prevBtn) prevBtn.disabled = history.length <= 1;

    const currentPos = activeFlow.indexOf(currentStep);
    const isLastStep = currentPos === activeFlow.length - 1;

    if (nextBtn) {
      // ✅ Update button text
      nextBtn.textContent = isLastStep ? 'Finish' : 'Next';

      // ✅ Disable Finish button if disableSaveEdit is true
      if (isLastStep && disableSaveEdit) {
        nextBtn.disabled = true;
        nextBtn.classList.add('opacity-50', 'cursor-not-allowed', 'bg-gray-400');
        nextBtn.title = 'This template cannot be edited';
        console.warn('[Template] Finish button disabled - disableSaveEdit is true');
      } else {
        nextBtn.disabled = false;
        nextBtn.classList.remove('opacity-50', 'cursor-not-allowed', 'bg-gray-400');
        nextBtn.title = '';
      }
    }

    if (index === steps.length - 1 && previewEl) {
      previewEl.textContent = JSON.stringify(formData, null, 2);
    }
    renderProgressBar();

    const placeholderButtons = document.getElementById('placeholder-buttons');
    const allowedScreens = [phishing_content_screen - 1, phishing_webpage_screen - 1, phishing_landing_page_screen - 1];
    if (placeholderButtons) {
      placeholderButtons.style.display = allowedScreens.includes(index) ? '' : 'none';
    }
  }

  function saveDataForStep(idx) {
    const stepEl = steps[idx];
    if (!stepEl) return;
    const inputs = Array.from(stepEl.querySelectorAll('input, textarea, select'));
    const key = `step${idx + 1}`;
    formData[key] = formData[key] || {};
    inputs.forEach(inp => {
      const name = inp.name || `_anon_${idx}`;
      if (inp.type === 'radio') {
        if (inp.checked) formData[key][name] = inp.value;
      } else if (inp.type === 'checkbox') {
        formData[key][name] = formData[key][name] || [];
        if (inp.checked) formData[key][name].push(inp.value);
      } else {
        formData[key][name] = inp.value;
      }
    });
  }

  function computeMatchingRule(phishType, selectedOptions) {
    let opts = selectedOptions;
    if (!Array.isArray(opts)) opts = opts ? [opts] : [];
    opts = opts.map(String);
    const candidates = customRules.filter(r =>
      r.phishType === phishType &&
      r.options.length === opts.length &&
      r.options.every(o => opts.includes(String(o)))
    );
    if (!candidates.length) return null;
    candidates.sort((a, b) => b.options.length - a.options.length);
    return candidates[0];
  }

  function buildActiveFlow(matchedRule) {
    if (!matchedRule) return Array.from({ length: steps.length }, (_, i) => i);
    const goToZeroBased = matchedRule.goTo.map(n => n - 1);
    const uniq = [0, 1];
    goToZeroBased.forEach(x => { if (!uniq.includes(x)) uniq.push(x); });
    return uniq;
  }

  function parseSelectedLevels(raw) {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.map(String);
    const s = String(raw).trim();
    try {
      if (s.startsWith('[') || s.startsWith('{')) {
        const parsed = JSON.parse(s);
        return Array.isArray(parsed) ? parsed.map(String) : [];
      }
    } catch (e) {
      // fallthrough
    }
    return s.split(',').map(x => x.trim()).filter(Boolean).map(String);
  }

  function renderOptions(type) {
    if (!checkboxContainer) return;
    checkboxContainer.innerHTML = '';

    const form = document.getElementById('templateCreationForm');
    let raw = (form && form.dataset && form.dataset.difficulty) || '';
    if (!raw) {
      const hid = document.querySelector('input[name="hidDifficultyLevel"]');
      raw = hid ? hid.value : '';
    }
    const selectedLevels = parseSelectedLevels(raw);

    const list = (conditions[type] || []);
    list.forEach((option, index) => {
      const id = `option-${type}-${index}`;
      const optVal = option.difficulty_level !== undefined && option.difficulty_level !== null ? String(option.difficulty_level) : String(option.id || '');
      const isSelected = selectedLevels.includes(optVal);

      const wrapper = document.createElement('label');
      wrapper.className = 'custom-option flex items-start gap-4';
      wrapper.setAttribute('for', id);

      const input = document.createElement('input');
      input.type = 'checkbox';
      input.id = id;
      input.name = 'options';
      input.value = optVal;
      input.className = 'hidden-checkbox';
      input.disabled = true;
      if (isSelected) input.checked = true;

      const spanCircle = document.createElement('span');
      spanCircle.className = 'custom-circle';

      const content = document.createElement('div');
      content.className = 'text-content';
      const title = document.createElement('div');
      title.className = 'text-2xl font-medium mb-2';
      title.textContent = option.title || '';
      const desc = document.createElement('p');
      desc.className = 'text-sm';
      desc.textContent = option.desc || '';

      content.appendChild(title);
      content.appendChild(desc);

      wrapper.appendChild(input);
      wrapper.appendChild(spanCircle);
      wrapper.appendChild(content);

      checkboxContainer.appendChild(wrapper);
    });
  }

  function handleNext() {
    saveDataForStep(currentStep);
    if (currentStep === 0) {
      const sel = formData.step1 && formData.step1.phishType;
      if (!sel) {
        alert('Please choose a phishType to continue.');
        return;
      }
      selectedPhishType = sel;

      if ((selectedPhishType === 'nfc' || selectedPhishType === 'qr') && emailContent) {
        emailContent.style.display = 'none';
      }

      renderOptions(selectedPhishType);
      history.push(1);
      showStep(1);
      return;
    }

    if (currentStep === 1) {
      const selectedOptions = (formData.step2 && formData.step2.options) ? formData.step2.options : [];
      if (selectedOptions.length === 0) {
        alert('Please select at least one option.');
        return;
      }
      const matched = computeMatchingRule(selectedPhishType, selectedOptions);
      activeFlow = buildActiveFlow(matched);
      const idxInFlow = activeFlow.indexOf(1);
      const nextInFlow = activeFlow[idxInFlow + 1] || steps.length - 1;
      history.push(nextInFlow);
      showStep(nextInFlow);
      return;
    }

    const idx = activeFlow.indexOf(currentStep);
    if (idx < activeFlow.length - 1) {
      const nextStepIndex = activeFlow[idx + 1];
      history.push(nextStepIndex);
      showStep(nextStepIndex);
      return;
    }

    // ✅ Check if disableSaveEdit is true before submitting
    if (disableSaveEdit) {
      alert('This template cannot be edited. Editing is disabled.');
      console.warn('[Template] Form submission blocked - disableSaveEdit is true');
      return;
    }

    const formEl = document.getElementById('templateCreationForm');
    if (formEl) formEl.submit();
  }

  function handlePrev() {
    if (history.length <= 1) return;
    history.pop();
    const prev = history[history.length - 1];
    currentStep = prev;
    showStep(currentStep);
  }

  function init() {
    renderProgressBar();
    showStep(0);
    if (nextBtn) nextBtn.addEventListener('click', handleNext);
    if (prevBtn) prevBtn.addEventListener('click', handlePrev);
  }

  init();
})();

function insertPlaceholder(placeholder) {
  const stepToEditor = {
    [phishing_content_screen - 1]: editors[0],
    [phishing_webpage_screen - 1]: editors[1],
    [phishing_landing_page_screen - 1]: editors[2]
  };
  const editorId = stepToEditor[currentStep];
  let editor = null;
  if (editorId && typeof CKEDITOR !== 'undefined' && CKEDITOR.instances[editorId]) {
    editor = CKEDITOR.instances[editorId];
  }
  if (editor) {
    try { editor.insertText('<%=' + placeholder + '%>'); } catch (e) { }
  } else {
    const txt = document.getElementById('phishing_content');
    if (txt) txt.value = (txt.value || '') + '<%=' + placeholder + '%>';

    const landingPageContent = document.getElementById('landing_page_content');
    if (landingPageContent) landingPageContent.value = (landingPageContent.value || '') + '<%=' + placeholder + '%>';
  }
}

// show/hide custom-url input for phish_option radios (guarded)
const radios = Array.from(document.querySelectorAll('input[name="phish_option"]') || []);
const customInput = document.getElementById('custom-url-input');
radios.forEach(radio => {
  radio.addEventListener('change', () => {
    if (!customInput) return;
    if (radio.value === 'custom-url' || radio.value === 'custom_url') {
      customInput.classList.remove('hidden');
    } else {
      customInput.classList.add('hidden');
    }
  });
});

// re-init editors block (ClassicEditor for landing custom)
let editorInstance = null;
const editorContainer = document.getElementById('editor-container');
if (editorContainer) editorContainer.style.display = 'none';

document.querySelectorAll('input[name="landing_option"]').forEach(radio => {
  radio.addEventListener('change', function () {
    if (!editorContainer) return;
    if (this.value === 'custom') {
      editorContainer.style.display = 'block';
      // alert('Show custom landing page editor');
      if (!editorInstance && typeof ClassicEditor !== 'undefined') {
        // alert('Initialize ClassicEditor for custom landing page content');
        ClassicEditor.create(document.querySelector('#editor'), { placeholder: 'Enter custom page HTML here...' })
          .then(editor => { editorInstance = editor; })
          .catch(error => console.error('ClassicEditor init error', error));
      }
    } else {
      editorContainer.style.display = 'none';
    }
  });
});

// --- new: on-load check for pre-checked "custom" radio and init editor ---
(function initLandingEditorIfPrechecked() {
  try {
    const preCheckedCustom = document.querySelector('input[name="landing_option"][value="custom"]:checked');
    if (!preCheckedCustom || !editorContainer) return;
    // show container
    editorContainer.style.display = 'block';

    // copy textarea content into editor element (ClassicEditor will pick this up)
    const editorEl = document.querySelector('#editor');
    const landingContentEl = document.getElementById('landing_page_content');
    if (landingContentEl && editorEl && !editorEl.value) {
      editorEl.value = landingContentEl.value || landingContentEl.textContent || '';
    }

    // disable other landing_option radios so user cannot change selection
    const radios = Array.from(document.querySelectorAll('input[name="landing_option"]') || []);
    radios.forEach(r => {
      if (r !== preCheckedCustom) {
        r.disabled = true;
        // also visually indicate disabled state on label if present
        const lab = r.closest('label') || (r.id ? document.querySelector(`label[for="${r.id}"]`) : null);
        if (lab) {
          lab.classList.add('opacity-50', 'pointer-events-none');
        }
      }
    });

    // initialize ClassicEditor if not already done
    if (!editorInstance && typeof ClassicEditor !== 'undefined') {
      ClassicEditor.create(editorEl || document.querySelector('#editor'), { placeholder: 'Enter custom page HTML here...' })
        .then(editor => {
          editorInstance = editor;
          // set initial data if present
          try {
            const initial = (landingContentEl && (landingContentEl.value || landingContentEl.textContent)) || '';
            if (initial) editorInstance.setData(initial);
          } catch (e) { /* ignore */ }
        })
        .catch(err => console.error('ClassicEditor init error (prechecked):', err));
    } else if (editorInstance) {
      try {
        const initial = (landingContentEl && (landingContentEl.value || landingContentEl.textContent)) || '';
        if (initial) editorInstance.setData(initial);
      } catch (e) { /* ignore */ }
    }
  } catch (e) {
    console.warn('initLandingEditorIfPrechecked error', e);
  }
})();

// Ensure editors array also initialized safely (for any that remain)
editors.forEach(id => {
  try {
    if (typeof CKEDITOR !== 'undefined' && document.getElementById(id) && !CKEDITOR.instances[id]) {
      CKEDITOR.replace(id, { toolbar: 'Full' });
    }
  } catch (e) { /* ignore errors */
  }
});


