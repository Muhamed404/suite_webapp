// Language translations and switching
let currentLang = 'en';

const translations = {
  en: {
    langText: 'العربية'
  },
  ar: {
    langText: 'English'
  }
};

// Language toggle functionality
document.addEventListener('DOMContentLoaded', function() {
  const langToggle = document.getElementById('langToggle');
  const langText = document.getElementById('langText');
  
  langToggle.addEventListener('click', function() {
    currentLang = currentLang === 'en' ? 'ar' : 'en';
    
    // Update HTML direction
    document.documentElement.setAttribute('dir', currentLang === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', currentLang);
    
    // Update language button text
    langText.textContent = translations[currentLang].langText;
    
    // Update all translatable elements
    const translatableElements = document.querySelectorAll('[data-en][data-ar]');
    translatableElements.forEach(element => {
      const translation = element.getAttribute(`data-${currentLang}`);
      if (translation) {
        if (element.tagName === 'IMG') {
          element.src = translation;
        } else if (element.tagName === 'A' && (translation.startsWith('http') || translation.includes('/'))) {
          element.href = translation;
        } else {
          element.textContent = translation;
        }
      }
    });
  });

  // Category filtering functionality
  const categoryLinks = document.querySelectorAll('.sidebar-links a[data-category]');
  const videoCards = document.querySelectorAll('.video-card');

  categoryLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Update active state
      categoryLinks.forEach(l => l.classList.remove('active'));
      this.classList.add('active');
      
      const category = this.getAttribute('data-category');
      
      // Filter videos with animation
      videoCards.forEach(card => {
        if (category === 'all' || card.getAttribute('data-category') === category) {
          card.style.display = 'block';
          card.style.animation = 'fadeIn 0.3s ease';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href !== '#') {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    });
  });
});

// Add fadeIn animation
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;
document.head.appendChild(style);
