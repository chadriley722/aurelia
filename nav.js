document.addEventListener('DOMContentLoaded', () => {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    const header = document.getElementById('main-header');
    
    // Toggle mobile menu
    const toggleMenu = (isExpanded) => {
        mobileMenuButton.setAttribute('aria-expanded', isExpanded);
        mobileMenu.classList.toggle('hidden', !isExpanded);
        
        // Change hamburger to X when menu is open
        const menuIcon = mobileMenuButton.querySelector('svg');
        if (menuIcon) {
            menuIcon.innerHTML = isExpanded 
                ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />' 
                : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" />';
        }
    };

    // Handle menu button click
    mobileMenuButton.addEventListener('click', () => {
        const isExpanded = mobileMenuButton.getAttribute('aria-expanded') === 'true';
        toggleMenu(!isExpanded);
    });
    
    // Close mobile menu when clicking on a link
    document.querySelectorAll('#mobile-menu a').forEach(link => {
        link.addEventListener('click', () => {
            toggleMenu(false);
        });
    });
    
    // Add scroll effect to header
    let lastScroll = 0;
    const scrollThreshold = 100;
    
    const handleScroll = () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll <= 0) {
            header.classList.remove('bg-black/80', 'backdrop-blur-sm');
            return;
        }
        
        if (currentScroll > lastScroll && currentScroll > scrollThreshold) {
            // Scroll down
            header.classList.add('-translate-y-full');
        } else {
            // Scroll up
            header.classList.remove('-translate-y-full');
            header.classList.add('bg-black/80', 'backdrop-blur-sm');
        }
        
        lastScroll = currentScroll;
    };
    
    window.addEventListener('scroll', handleScroll);
    
    // Cleanup event listener if needed
    return () => {
        window.removeEventListener('scroll', handleScroll);
    };
});
