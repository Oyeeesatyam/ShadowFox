document.addEventListener("DOMContentLoaded", () => {
  
  // ==========================================
  // MOBILE MENU DRAWER
  // ==========================================
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const mobileDrawer = document.getElementById("mobileDrawer");
  const mobileLinks = document.querySelectorAll(".mobile-link");

  const toggleMobileMenu = () => {
    hamburgerBtn.classList.toggle("open");
    mobileDrawer.classList.toggle("open");
  };

  const closeMobileMenu = () => {
    hamburgerBtn.classList.remove("open");
    mobileDrawer.classList.remove("open");
  };

  hamburgerBtn.addEventListener("click", toggleMobileMenu);

  mobileLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      closeMobileMenu();
      
      const targetId = link.getAttribute("href");
      smoothScrollTo(targetId);
    });
  });

  // ==========================================
  // SMOOTH SCROLL WITH HEADER OFFSET
  // ==========================================
  const headerOffset = 80;
  
  const smoothScrollTo = (targetId) => {
    const targetElement = document.querySelector(targetId);
    if (!targetElement) return;
    
    const elementPosition = targetElement.getBoundingClientRect().top + window.scrollY;
    const offsetPosition = elementPosition - headerOffset;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth"
    });
  };

  // Add smooth scroll to logo and main nav links
  const smoothScrollLinks = document.querySelectorAll('.logo, .nav-link, .hero-buttons a[href^="#"], .scroll-cue');
  
  smoothScrollLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      const targetId = link.getAttribute("href");
      if (targetId && targetId.startsWith("#")) {
        e.preventDefault();
        smoothScrollTo(targetId);
      }
    });
  });

  // ==========================================
  // TYPEWRITER EFFECT
  // ==========================================
  const words = ["an AI Developer", "a Full Stack Developer", "a Networking Learner", "a Cybersecurity Enthusiast"];
  const typewriterText = document.getElementById("typewriterText");
  let wordIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let typeSpeed = 90;

  const type = () => {
    const currentWord = words[wordIndex % words.length];
    
    if (isDeleting) {
      // Deleting characters
      typewriterText.textContent = currentWord.substring(0, charIndex - 1);
      charIndex--;
      typeSpeed = 45; // faster deletion
    } else {
      // Typing characters
      typewriterText.textContent = currentWord.substring(0, charIndex + 1);
      charIndex++;
      typeSpeed = 90;
    }

    // Checking word boundaries
    if (!isDeleting && charIndex === currentWord.length) {
      isDeleting = true;
      typeSpeed = 1400; // Hold full word
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      wordIndex++;
      typeSpeed = 300; // brief pause before next word
    }

    setTimeout(type, typeSpeed);
  };

  // Start Typewriter
  if (typewriterText) {
    type();
  }

  // ==========================================
  // ACTIVE NAV LINK TRACKING (INTERSECTION OBSERVER)
  // ==========================================
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".nav-link");

  const observerOptions = {
    root: null,
    rootMargin: "-80px 0px -40% 0px", // adjust for header offset and view threshold
    threshold: [0.15, 0.35, 0.5]
  };

  const observerCallback = (entries) => {
    let mostVisibleSection = null;
    let maxRatio = 0;

    entries.forEach(entry => {
      if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
        maxRatio = entry.intersectionRatio;
        mostVisibleSection = entry.target.id;
      }
    });

    if (mostVisibleSection) {
      navLinks.forEach(link => {
        link.classList.remove("active");
        if (link.getAttribute("href") === `#${mostVisibleSection}`) {
          link.classList.add("active");
        }
      });
    }
  };

  const observer = new IntersectionObserver(observerCallback, observerOptions);
  
  sections.forEach(section => {
    observer.observe(section);
  });

  // Highlight first link initially
  if (navLinks.length > 0) {
    navLinks[0].classList.add("active");
  }

  // ==========================================
  // DYNAMIC COPYRIGHT YEAR
  // ==========================================
  const copyrightYearEl = document.getElementById("copyrightYear");
  if (copyrightYearEl) {
    copyrightYearEl.textContent = new Date().getFullYear();
  }
});
