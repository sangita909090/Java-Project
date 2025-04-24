document.addEventListener('DOMContentLoaded', function() {
    // Toggle mobile menu
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.getElementById('nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            hamburger.classList.toggle('active');
        });
    }
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        if (navMenu && navMenu.classList.contains('active')) {
            if (!event.target.closest('nav') && !event.target.closest('.hamburger')) {
                navMenu.classList.remove('active');
                if (hamburger) hamburger.classList.remove('active');
            }
        }
    });
    
    // Hide signup button in hero if user is logged in
    const heroSignupBtn = document.getElementById('hero-signup-btn');
    if (heroSignupBtn) {
        auth.onAuthStateChanged(user => {
            if (user) {
                heroSignupBtn.style.display = 'none';
            } else {
                heroSignupBtn.style.display = 'inline-block';
            }
        });
    }
    
    // Add active class to current nav link
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('nav ul li a');
    
    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage) {
            link.classList.add('active');
        }
    });
});
