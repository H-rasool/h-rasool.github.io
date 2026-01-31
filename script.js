// Dark Mode Toggle
const themeToggle = document.getElementById('themeToggle');
const themeIcon = themeToggle.querySelector('.theme-icon');
const html = document.documentElement;

// Check for saved theme preference or default to light mode
const currentTheme = localStorage.getItem('theme') || 'light';
html.setAttribute('data-theme', currentTheme);
updateThemeIcon(currentTheme);

themeToggle.addEventListener('click', () => {
  const currentTheme = html.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeIcon(newTheme);
  
  // Add click animation
  themeToggle.style.transform = 'scale(0.9) rotate(180deg)';
  setTimeout(() => {
    themeToggle.style.transform = '';
  }, 200);
});

function updateThemeIcon(theme) {
  themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// Particle System
function createParticles() {
  const particlesContainer = document.getElementById('particles');
  const particleCount = 50;
  
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDelay = Math.random() * 20 + 's';
    particle.style.animationDuration = (15 + Math.random() * 10) + 's';
    particle.style.width = particle.style.height = (2 + Math.random() * 3) + 'px';
    particlesContainer.appendChild(particle);
  }
}

// Scroll Animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

// Observe all sections
document.querySelectorAll('section').forEach(section => {
  section.classList.add('fade-in-section');
  observer.observe(section);
});

// Skill Tag Click Interactions
document.querySelectorAll('.skill-tag').forEach(tag => {
  tag.addEventListener('click', function(e) {
    e.stopPropagation();
    this.classList.add('clicked');
    
    // Create ripple effect
    const ripple = document.createElement('span');
    ripple.style.position = 'absolute';
    ripple.style.borderRadius = '50%';
    ripple.style.background = 'rgba(102, 126, 234, 0.3)';
    ripple.style.transform = 'translate(-50%, -50%)';
    ripple.style.width = ripple.style.height = '0px';
    ripple.style.left = e.offsetX + 'px';
    ripple.style.top = e.offsetY + 'px';
    ripple.style.pointerEvents = 'none';
    this.style.position = 'relative';
    this.appendChild(ripple);
    
    setTimeout(() => {
      ripple.style.transition = 'all 0.6s ease';
      ripple.style.width = ripple.style.height = '200px';
      ripple.style.opacity = '0';
    }, 10);
    
    setTimeout(() => {
      ripple.remove();
      this.classList.remove('clicked');
    }, 600);
  });
});

// Avatar Click Animation
const avatar = document.getElementById('avatar');
if (avatar) {
  avatar.addEventListener('click', function() {
    this.style.animation = 'none';
    setTimeout(() => {
      this.style.animation = 'bounce 0.6s ease';
    }, 10);
  });
}

// Expandable Experience Cards
document.querySelectorAll('[data-card="expandable"]').forEach(card => {
  const expandBtn = card.querySelector('.expand-btn');
  if (expandBtn) {
    expandBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      card.classList.toggle('expanded');
      
      if (card.classList.contains('expanded')) {
        this.textContent = 'Collapse Details ';
      } else {
        this.textContent = 'View Details ';
      }
    });
  }
});

// Clickable Project Cards with Ripple Effect
document.querySelectorAll('[data-card="clickable"]').forEach(card => {
  card.addEventListener('click', function(e) {
    const ripple = this.querySelector('.card-ripple');
    if (ripple) {
      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      ripple.classList.remove('animate');
      void ripple.offsetWidth; // Trigger reflow
      ripple.classList.add('animate');
    }
    
    // Add click animation
    this.style.transform = 'scale(0.98)';
    setTimeout(() => {
      this.style.transform = '';
    }, 200);
  });
});

// Animated Counter for Stats
function animateCounter(element, target, duration = 2000) {
  const start = 0;
  const increment = target / (duration / 16);
  let current = start;
  
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      element.textContent = target;
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(current);
    }
  }, 16);
}

// Observe footer stats
const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const statNumbers = entry.target.querySelectorAll('.stat-number');
      statNumbers.forEach(stat => {
        const target = parseInt(stat.getAttribute('data-target'));
        animateCounter(stat, target);
      });
      statsObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

const footerStats = document.querySelector('.footer-stats');
if (footerStats) {
  statsObserver.observe(footerStats);
}

// Smooth Scroll for Navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// Parallax Effect on Scroll
let lastScroll = 0;
window.addEventListener('scroll', () => {
  const currentScroll = window.pageYOffset;
  const header = document.querySelector('.header');
  
  if (header) {
    const scrolled = currentScroll / window.innerHeight;
    header.style.transform = `translateY(${scrolled * 50}px)`;
    header.style.opacity = 1 - scrolled * 0.5;
  }
  
  lastScroll = currentScroll;
});

// Keyboard Navigation
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    // Close any expanded cards
    document.querySelectorAll('.experience-card.expanded').forEach(card => {
      card.classList.remove('expanded');
      const btn = card.querySelector('.expand-btn');
      if (btn) btn.textContent = 'View Details ';
    });
  }
});

// Mouse Move Parallax for Cards
document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('mousemove', function(e) {
    const rect = this.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const moveX = (x - centerX) / 20;
    const moveY = (y - centerY) / 20;
    
    this.style.transform = `perspective(1000px) rotateY(${moveX}deg) rotateX(${-moveY}deg) translateZ(10px)`;
  });
  
  card.addEventListener('mouseleave', function() {
    this.style.transform = '';
  });
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  createParticles();
  
  // Add stagger animation to skill categories
  document.querySelectorAll('.skill-category').forEach((category, index) => {
    setTimeout(() => {
      category.style.opacity = '0';
      category.style.transform = 'translateY(20px)';
      category.style.transition = 'all 0.6s ease';
      
      setTimeout(() => {
        category.style.opacity = '1';
        category.style.transform = 'translateY(0)';
      }, 100);
    }, index * 100);
  });
  
  // Add hover sound effect simulation (visual feedback)
  document.querySelectorAll('.skill-tag, .project-card, .experience-card').forEach(element => {
    element.addEventListener('mouseenter', function() {
      this.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
    });
  });
  
  // Console easter egg for technical people
  console.log('%c👨‍💻 Portfolio by Hasnat Rasool', 'font-size: 20px; font-weight: bold; color: #667eea;');
  console.log('%cBuilt with modern web technologies and lots of ❤️', 'font-size: 12px; color: #64748b;');
});

// Performance: Debounce scroll events
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Optimized scroll handler
const optimizedScroll = debounce(() => {
  // Scroll-based animations here
}, 10);

window.addEventListener('scroll', optimizedScroll);

// Add loading animation
window.addEventListener('load', () => {
  document.body.style.opacity = '0';
  setTimeout(() => {
    document.body.style.transition = 'opacity 0.5s ease';
    document.body.style.opacity = '1';
  }, 100);
});
