


function handleLanguageChange(lang) {
  if (!lang) return;

  fetch('/change-language', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    credentials: 'same-origin',
    body: `lang=${encodeURIComponent(lang)}`,
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Language switch failed');
      }
      window.location.reload();
    })
    .catch(error => {
      console.error('Error changing language:', error);
      if (typeof showCustomToast === 'function') {
        showCustomToast('error', 'Unable to change language right now.');
      } else {
        alert('Unable to change language right now.');
      }
    });
}

function toggleMenu(id, button) {
  const menu = document.getElementById(id);
  menu.classList.toggle('hidden');
  button.classList.toggle('open');
}


document.querySelectorAll('tbody tr').forEach(row => {
  const bar = row.querySelector('.bg-blue-500'); // Adjust selector per channel
  if(bar){
    bar.style.width = '0%';
    setTimeout(() => bar.style.width = '60%', 100); // 60% for example row
  }
});

document.querySelector('button').addEventListener('click', () => {
  document.querySelector('input[type="date"]').focus();
});



// SVG Icons for error and success toasts
const errorIcon = `
<svg class="w-8 h-8 text-white flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img">
  <circle cx="12" cy="12" r="10" fill="#fff2" />
  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3m0 4h.01M12 6.5A1.5 1.5 0 1 1 12 9.5A1.5 1.5 0 0 1 12 6.5z" />
</svg>`;

const successIcon = `
<svg class="w-8 h-8 text-white flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img">
  <circle cx="12" cy="12" r="10" fill="#fff2" />
  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4" />
</svg>`;

/**
 * Displays a custom toast notification.
 * @param {'error'|'success'} alertType - Type of toast to display.
 */
function showCustomToast(alertType, alertMessage = null) {
  const container = document.getElementById('toast-container');
  if (!container) {
    console.error('Toast container element not found');
    return;
  }

  const lang = document.documentElement.lang;
  let title = alertType === 'error' ? 'Error' : 'Success!';
  let message = alertMessage;

  if (lang === 'ar') {
    if (alertType === 'error') {
      title = 'خطأ';
    } else {
      title = 'نجاح!';
    }
    const translations = {
      'Package deleted successfully': 'تم حذف الباقة بنجاح',
      'User deleted successfully': 'تم حذف المستخدم بنجاح',
      'User created successfully': 'تم إنشاء المستخدم بنجاح',
      'Campaign launch has been initiated': 'تم بدء إطلاق الحملة',
      'Campaign Launch has been initiated': 'تم بدء إطلاق الحملة',
      'Success': 'نجاح',
      'Success!': 'نجاح!',
      '!Success': '!نجاح',
      '! Success': '! نجاح',
      'Success !': 'نجاح !',
      'Delete Successfully': 'تم الحذف بنجاح',
      'Successfully': 'بنجاح'
    };
    for (const [en, ar] of Object.entries(translations)) {
      message = message.replaceAll(en, ar);
    }
  }

  const toast = document.createElement('div');
  toast.className =
    'flex items-start p-6 rounded-2xl shadow-xl max-w-md w-full ' +
    (alertType === 'error' ? 'bg-red-500/90' : 'bg-green-500/90') +
    ' text-white gap-4 animate-fade-in';

  toast.innerHTML = `
    <span class="mt-1" aria-hidden="true">${alertType === 'error' ? errorIcon : successIcon}</span>
    <div>
      <div class="text-[18px] font-bold">
        ${title}
      </div>
      <div class="text-[12px] font-normal mt-1">
        ${message}
      </div>
    </div>
  `;

  // Append the toast
  container.appendChild(toast);

  // Auto-remove toast after 3 seconds with a fade out
  setTimeout(() => {
    toast.classList.add('opacity-0', 'transition-opacity');
    setTimeout(() => toast.remove(), 700);
  }, 3000);
}

// Inject fade-in animation CSS dynamically
(function addFadeInStyle() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fade-in {
      from { opacity: 0; transform: translateY(-20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in {
      animation: fade-in 0.4s ease forwards;
    }
  `;
  document.head.appendChild(style);
})();













function toggleMenus() {
  const primaryMenu = document.getElementById('primaryMenu');
  const subMenu = document.getElementById('subMenu');
  const icon = document.getElementById('flip');

  if (!primaryMenu || !subMenu || !icon) {
    return;
  }

  const primaryText = primaryMenu.querySelectorAll('.menu-text');
  const subText = subMenu.querySelectorAll('.menu-text');

  const isPrimaryCollapsed = primaryMenu.classList.contains('w-16');
  const isSubCollapsed = subMenu.classList.contains('w-16');

  if (isPrimaryCollapsed) {
    primaryMenu.classList.remove('w-16');
    primaryMenu.classList.add('w-48');
    subMenu.classList.remove('w-48');
    subMenu.classList.add('w-16');

    primaryText.forEach(el => el.classList.remove('hidden'));
    subText.forEach(el => el.classList.add('hidden'));

    icon.classList.add('scale-x-[-1]');
  } else {
    primaryMenu.classList.remove('w-48');
    primaryMenu.classList.add('w-16');
    subMenu.classList.remove('w-16');
    subMenu.classList.add('w-48');

    primaryText.forEach(el => el.classList.add('hidden'));
    subText.forEach(el => el.classList.remove('hidden'));

    icon.classList.remove('scale-x-[-1]');
  }
}

// Run on page load
document.addEventListener('DOMContentLoaded', () => {
  const icon = document.getElementById('flip');
  if (icon) {
    icon.classList.add('rotated');
    icon.style.transform = 'rotate(180deg)';
  }
});





  function toggleMainMenu() {
    const menu = document.getElementById('primaryMenu');
    const menuTextElements = menu.querySelectorAll('.menu-text');
    const flipIcon = document.getElementById('flip');

    console.log('Toggling menu');

    menu.classList.toggle('w-16');
    menu.classList.toggle('w-60');

    menuTextElements.forEach(el => {
      el.classList.toggle('hidden');
    });

    if (flipIcon.classList.contains('rotated')) {
      flipIcon.style.transform = 'rotate(0deg)';
      flipIcon.classList.remove('rotated');
    } else {
      flipIcon.style.transform = 'rotate(180deg)';
      flipIcon.classList.add('rotated');
    }
  }

  function toggleMenu(menuId, btn) {
    const menu = document.getElementById(menuId);
    const isOpen = menu.classList.contains('flex');
    menu.classList.toggle('hidden');
    menu.classList.toggle('flex');
    btn.classList.toggle('open');
  }















    const buttons = document.querySelectorAll('.filter-btn');

    buttons.forEach(button => {
      button.addEventListener('click', () => {
        if (button.classList.contains('bg-gray-900')) return;

        buttons.forEach(btn => {
          btn.classList.remove('bg-gray-900', 'text-white');
          btn.classList.add('text-gray-600', 'hover:text-black');

          const span = btn.querySelector('.number');
          span.classList.remove('bg-gray-700', 'text-white');
          span.classList.add('bg-green-500/15', 'text-green-500');
        });

        button.classList.add('bg-gray-900', 'text-white');
        button.classList.remove('text-gray-600', 'hover:text-black');

        const span = button.querySelector('.number');
        span.classList.remove('bg-green-500/15', 'text-green-500');
        span.classList.add('bg-gray-700', 'text-white');
      });
    });


const btns = document.querySelectorAll('.filter-btn');

btns.forEach(button => {
  button.addEventListener('click', () => {
    if (button.classList.contains('bg-gray-900')) return;

    // Reset all buttons
    btns.forEach(btn => {
      btn.classList.remove('bg-gray-900', 'text-white');
      btn.classList.add('text-gray-600', 'hover:text-black');

      const icon = btn.querySelector('.icon');
      icon.classList.remove('text-white');
      icon.classList.add('text-gray-600'); // inactive icon color
    });

    // Activate clicked button
    button.classList.add('bg-gray-900', 'text-white');
    button.classList.remove('text-gray-600', 'hover:text-black');

    const icon = button.querySelector('.icon');
    icon.classList.remove('text-gray-600');
    icon.classList.add('text-white'); // active icon color (white)
  });
});

















// Full JS — paste this in place of your old scripts
document.addEventListener('DOMContentLoaded', () => {
  // ===== Modal close/open logic =====
  const outerOverlay = document.getElementById('rightModalOverlay'); // outer wrapper
  const innerOverlay = document.getElementById('modalOverlay'); // inner dark overlay (may cover the modal box)
  const closeBtn = document.getElementById('closeModalBtn');

  // helper: hide overlay (safe if element missing)
  function hideOverlay() {
    if (!outerOverlay) return;
    outerOverlay.classList.add('hidden');
  }

  // helper: show overlay (provided so you can call openModal() from console or a button later)
  function showOverlay() {
    if (!outerOverlay) return;
    outerOverlay.classList.remove('hidden');
  }

  // Close when clicking the X button
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      hideOverlay();
    });
  }

  // Close when clicking outside the modal box.
  // Listen on the inner overlay if present (that's the semi-transparent layer that catches clicks).
  const clickListenerTarget = innerOverlay || outerOverlay;
  if (clickListenerTarget) {
    clickListenerTarget.addEventListener('click', (e) => {
      // Only close if the user clicked on the overlay itself (not on the modal box or its children)
      if (e.target === clickListenerTarget) {
        hideOverlay();
      }
    });
  }

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && outerOverlay && !outerOverlay.classList.contains('hidden')) {
      hideOverlay();
    }
  });

  // ===== Department Dropdown Show/Hide =====
  const deptRadiosNode = document.getElementsByName('deptOption');
  const deptRadios = Array.from(deptRadiosNode || []);
  const deptDropdown = document.getElementById('deptDropdown');

  function updateDeptDropdown() {
    if (!deptDropdown) return;
    const isCustom = deptRadios.some(r => r.checked && r.value === 'custom');
    deptDropdown.classList.toggle('hidden', !isCustom);
  }

  if (deptRadios.length) {
    deptRadios.forEach(r => r.addEventListener('change', updateDeptDropdown));
    updateDeptDropdown(); // init
  }

  // ===== Group Tags Logic =====
  const groupSelect = document.getElementById('groupSelect');
  const groupTagsContainer = document.getElementById('groupTags');
  let selectedGroups = [];

  // small HTML-escape to avoid accidental markup injection
  function escapeHtml(str = '') {
    return String(str).replace(/[&<>"']/g, s => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[s]));
  }

  function renderTags() {
    if (!groupTagsContainer) return;
    groupTagsContainer.innerHTML = '';
    selectedGroups.forEach(group => {
      const tag = document.createElement('div');
      // Tailwind-like classes (safe fallback if Tailwind is present)
      tag.className = 'inline-flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full text-sm';
      const label = document.createElement('span');
      label.innerHTML = escapeHtml(group);
      const btn = document.createElement('button');
      btn.setAttribute('aria-label', 'Remove group');
      btn.type = 'button';
      btn.className = 'ml-2 text-gray-600 font-medium';
      btn.textContent = '×';
      btn.addEventListener('click', () => {
        selectedGroups = selectedGroups.filter(g => g !== group);
        renderTags();
      });

      tag.appendChild(label);
      tag.appendChild(btn);
      groupTagsContainer.appendChild(tag);
    });
  }

  if (groupSelect) {
    groupSelect.addEventListener('change', () => {
      const value = groupSelect.value && groupSelect.value.trim();
      if (value && !selectedGroups.includes(value)) {
        selectedGroups.push(value);
        renderTags();
      }
      // reset the select to placeholder
      groupSelect.selectedIndex = 0;
    });
  }

  // ===== Date Validation Logic =====
  const startInput = document.getElementById('startTime');
  const endInput = document.getElementById('endTime');

  if (startInput && endInput) {
    startInput.addEventListener('change', () => {
      if (startInput.value) {
        endInput.min = startInput.value;
        if (endInput.value && endInput.value < startInput.value) {
          endInput.value = '';
        }
      } else {
        endInput.min = '';
      }
    });

    endInput.addEventListener('change', () => {
      if (endInput.value && startInput.value && endInput.value < startInput.value) {
        // user-friendly notice
        alert('End Time cannot be before Start Time.');
        endInput.value = '';
      }
    });
  }

  // Expose helpers to window for debugging/testing if you want
  window.__campaignModal = {
    show: showOverlay,
    hide: hideOverlay,
    selectedGroups: () => selectedGroups.slice()
  };
});







document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('servicesModal');
  const openBtn = document.getElementById('openServicesModal');
  const closeBtn = document.getElementById('closeServicesModal');

  if (openBtn && modal && closeBtn) {
    openBtn.addEventListener('click', () => {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    });

    closeBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    });

    // Close on clicking overlay
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      }
    });
  }
});



  const modal = document.getElementById("invoiceModal");
  const openBtn = document.getElementById("openModalBtn");
  const closeBtn = document.getElementById("closeModalBtn");
  const closeBottomBtn = document.getElementById("closeBottomBtn");

  // Open Modal
  openBtn.addEventListener("click", () => {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  });

  // Close Modal (top button & bottom button)
  [closeBtn, closeBottomBtn].forEach(btn =>
    btn.addEventListener("click", () => {
      modal.classList.remove("flex");
      modal.classList.add("hidden");
    })
  );