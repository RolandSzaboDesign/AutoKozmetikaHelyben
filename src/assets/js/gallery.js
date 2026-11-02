document.addEventListener('DOMContentLoaded', () => {
  const viewer = document.querySelector('.gallery-viewer');
  const galleryLinks = Array.from(document.querySelectorAll('[data-gallery-index]'));
  if (viewer && typeof viewer.showModal === 'function' && galleryLinks.length) {
    const image = viewer.querySelector('[data-gallery-image]');
    const caption = viewer.querySelector('#gallery-caption');
    const counter = viewer.querySelector('[data-gallery-counter]');
    const description = viewer.querySelector('#gallery-description');
    let current = 0;
    let opener;
    let previousOverflow;
    const showImage = (index) => {
      current = (index + galleryLinks.length) % galleryLinks.length;
      const link = galleryLinks[current];
      image.src = link.href;
      image.alt = link.querySelector('img').alt;
      const figure = link.closest('figure');
      caption.textContent = figure.querySelector('.gallery-title').textContent;
      description.textContent = figure.querySelector('.gallery-description')?.textContent || '';
      description.hidden = !description.textContent;
      counter.textContent = current + 1 + ' / ' + galleryLinks.length;
    };
    galleryLinks.forEach((link, index) =>
      link.addEventListener('click', (event) => {
        if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        opener = link;
        showImage(index);
        previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        viewer.showModal();
      }),
    );
    viewer.querySelector('[data-gallery-close]').addEventListener('click', () => viewer.close());
    viewer.querySelector('[data-gallery-prev]').addEventListener('click', () => showImage(current - 1));
    viewer.querySelector('[data-gallery-next]').addEventListener('click', () => showImage(current + 1));
    viewer.addEventListener('click', (event) => {
      if (event.target === viewer) viewer.close();
    });
    viewer.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        showImage(current - 1);
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        showImage(current + 1);
      }
    });
    viewer.addEventListener('close', () => {
      document.body.style.overflow = previousOverflow || '';
      opener?.focus({ preventScroll: true });
    });
  }
});
