    // Desktop sidebar toggle (icon only / full width)
    document.addEventListener('DOMContentLoaded', () => {
      const sidebarToggle = document.getElementById('sidebarToggle');
      const sidebar = document.getElementById('sidebar');

      sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
      });

      window.addEventListener('resize', () => {
        // On mobile, always remove collapsed class to use mobile sidebar style
        if (window.innerWidth < 1024) {
          sidebar.classList.remove('collapsed');
        }
      });
    });




        // Mobile sidebar opening/closing
    const hamburger = document.getElementById('hamburger');
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    const closeBtn = document.getElementById('closeSidebar');

    function openSidebar() {
      sidebar.classList.remove('-translate-x-full');
      backdrop.classList.remove('hidden');
      closeBtn.classList.remove('hidden');
      hamburger.classList.add('hidden');
    }

    function closeSidebar() {
      sidebar.classList.add('-translate-x-full');
      backdrop.classList.add('hidden');
      closeBtn.classList.add('hidden');
      hamburger.classList.remove('hidden');
    }

    hamburger.addEventListener('click', openSidebar);
    backdrop.addEventListener('click', closeSidebar);
    closeBtn.addEventListener('click', closeSidebar);

    // Toggle submenu function (optional, from your code)
    function toggleMenu(menuId, btn) {
      const menu = document.getElementById(menuId);
      if (!menu) return;
      const isOpen = !menu.classList.contains('hidden');
      if (isOpen) {
        menu.classList.add('hidden');
        btn.classList.remove('open');
      } else {
        menu.classList.remove('hidden');
        btn.classList.add('open');
      }
    }