document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const campaignFields = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_placement'];

  campaignFields.forEach((name) => {
    const value = params.get(name);
    if (!value) return;

    document.querySelectorAll(`input[name="${name}"]`).forEach((input) => {
      input.value = value;
    });
  });

  document.querySelectorAll('input[name="landing_url"]').forEach((input) => {
    input.value = window.location.href;
  });

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
