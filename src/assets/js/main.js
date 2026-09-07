document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('details.faq-item').forEach((item) => {
    item.addEventListener('toggle', () => {
      if (!item.open) return;

      document.querySelectorAll('details.faq-item[open]').forEach((other) => {
        if (other !== item) other.removeAttribute('open');
      });
    });
  });

  document.querySelectorAll('details[data-focus-on-open]').forEach((details) => {
    details.addEventListener('toggle', () => {
      if (!details.open) return;

      const selector = details.dataset.focusOnOpen;
      const target = selector ? details.querySelector(selector) || document.querySelector(selector) : null;

      if (target) {
        requestAnimationFrame(() => target.focus());
      }
    });
  });
});
