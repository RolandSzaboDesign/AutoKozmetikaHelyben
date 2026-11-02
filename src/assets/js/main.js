document.addEventListener('DOMContentLoaded', () => {
  const mobileContact = document.querySelector('.mobile-contact');
  const hero = document.querySelector('.service-page__hero, .service-hub__hero, .hero');
  const contact = document.getElementById('kapcsolat');
  if (mobileContact && hero && contact) {
    const mobile = window.matchMedia('(max-width: 899px)');
    let scheduled = false;
    const updateMobileContact = () => {
      scheduled = false;
      const editing = document.activeElement?.matches('input, textarea, select');
      const keyboardOpen = window.visualViewport && window.innerHeight - window.visualViewport.height > 150;
      mobileContact.hidden = !(
        mobile.matches &&
        hero.getBoundingClientRect().bottom <= 0 &&
        contact.getBoundingClientRect().top > window.innerHeight &&
        !editing &&
        !keyboardOpen
      );
    };
    const schedule = () => {
      if (!scheduled) {
        scheduled = true;
        requestAnimationFrame(updateMobileContact);
      }
    };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    document.addEventListener('focusin', schedule);
    document.addEventListener('focusout', schedule);
    window.visualViewport?.addEventListener('resize', schedule);
    if ('ResizeObserver' in window) {
      const observer = new ResizeObserver(schedule);
      observer.observe(hero);
      observer.observe(document.querySelector('main'));
    }
    updateMobileContact();
  }

  document.querySelectorAll('details.faq-item').forEach((item) => {
    item.addEventListener('toggle', () => {
      if (!item.open) return;

      document.querySelectorAll('details.faq-item[open]').forEach((other) => {
        if (other !== item) other.removeAttribute('open');
      });
    });
  });
});
