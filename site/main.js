// addrop. landing page behaviour: waitlist forms + app preview carousel.

// Where waitlist sign-ups are sent: the Cloudflare Pages Function in
// functions/api/waitlist.js, which saves them to the D1 database.
const WAITLIST_ENDPOINT = '/api/waitlist';

document.addEventListener('DOMContentLoaded', () => {
  initWaitlist();
  initRail();
  initReviewColumns();
});

function initWaitlist() {
  const forms = [...document.querySelectorAll('[data-waitlist]')];
  const inputs = forms.map((f) => f.querySelector('input[type=email]'));

  // Both forms share one email value, as in the design.
  inputs.forEach((input) => {
    input.addEventListener('input', () => {
      inputs.forEach((other) => { if (other !== input) other.value = input.value; });
    });
  });

  forms.forEach((form) => {
    const input = form.querySelector('input[type=email]');
    const honeypot = form.querySelector('input[name=company]');
    const button = form.querySelector('button');
    const error = form.parentElement.querySelector('.waitlist-error');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = input.value.trim();
      if (!email || !input.checkValidity()) {
        showError(error, 'Please enter a valid email address.');
        input.focus();
        return;
      }
      hideError(error);

      if (WAITLIST_ENDPOINT) {
        button.disabled = true;
        try {
          const res = await fetch(WAITLIST_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({ email, source: form.dataset.waitlist, company: honeypot?.value || '' }),
          });
          if (!res.ok) throw new Error('HTTP ' + res.status);
        } catch (err) {
          console.error('Waitlist sign-up failed', err);
          showError(error, "Something went wrong. Please try again.");
          button.disabled = false;
          return;
        }
      }

      markJoined(email);
    });
  });

  function markJoined(email) {
    forms.forEach((form) => {
      form.hidden = true;
      hideError(form.parentElement.querySelector('.waitlist-error'));
    });
    document.querySelectorAll('.waitlist-done').forEach((done) => {
      done.querySelector('[data-email]').textContent = email;
      done.hidden = false;
    });
  }
}

function showError(el, msg) {
  el.textContent = msg;
  el.hidden = false;
}

function hideError(el) {
  el.hidden = true;
  el.textContent = '';
}

// Reviews: vertically scrolling columns, ported from the 21st.dev
// "testimonials-columns-1" component (motion/react) to plain CSS animations.
// Columns: 1 below 768px, 2 below 1024px, 3 above (md/lg in the original).
// Durations 15s / 19s / 17s per column, as in the original demo.
function initReviewColumns() {
  const grid = document.querySelector('[data-review-columns]');
  if (!grid) return;
  const section = grid.closest('section');
  const cards = [...grid.querySelectorAll('.review')];
  const DURATIONS = [15, 19, 17];
  const ORIGINAL_HALF = 3 * 250; // ~px a column travels per loop in the original (3 cards)
  const MAX_HEIGHT = 740;

  const container = document.createElement('div');
  container.className = 'review-columns';
  grid.replaceWith(container);

  const columnCount = () => (innerWidth >= 1024 ? 3 : innerWidth >= 768 ? 2 : 1);
  let built = 0;

  function build() {
    const n = columnCount();
    if (n === built) return;
    built = n;
    container.replaceChildren();

    for (let c = 0; c < n; c++) {
      // Spread every review across the visible columns so none are dropped on small screens.
      const own = cards.filter((_, i) => i % n === c);
      const column = document.createElement('div');
      column.className = 'review-column';
      const track = document.createElement('div');
      track.className = 'review-column__track';
      column.append(track);
      container.append(column);

      // One "half" of the track must be taller than the visible window, otherwise a
      // gap shows at the end of each loop. Repeat the column's cards until it is,
      // then double it so translateY(-50%) lands exactly on the start again.
      const addSet = (hidden) => own.forEach((card) => {
        const copy = card.cloneNode(true);
        if (hidden) copy.setAttribute('aria-hidden', 'true');
        track.append(copy);
      });
      addSet(false);
      for (let i = 0; i < 10 && track.scrollHeight < MAX_HEIGHT + 16; i++) addSet(true);
      const half = track.scrollHeight;
      [...track.children].forEach((card) => {
        const copy = card.cloneNode(true);
        copy.setAttribute('aria-hidden', 'true');
        track.append(copy);
      });

      // Keep the original speed even though our halves hold a different number of cards.
      track.dataset.base = DURATIONS[c % DURATIONS.length];
      setDuration(track, half);
      resizeObserver?.observe(track);
    }
  }

  function setDuration(track, half) {
    const duration = Number(track.dataset.base) * (half / ORIGINAL_HALF);
    track.style.setProperty('--duration', duration.toFixed(2) + 's');
  }
  // Card heights change as web fonts load and on resize; keep the speed in step.
  const resizeObserver = 'ResizeObserver' in window
    ? new ResizeObserver((entries) => entries.forEach((e) => setDuration(e.target, e.target.scrollHeight / 2)))
    : null;

  let raf = 0;
  addEventListener('resize', () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(build);
  });
  // Card heights change once the web fonts load; rebuild with real measurements.
  document.fonts?.ready.then(() => { built = 0; build(); });
  build();

  // Section heading fades up once when it scrolls into view.
  const head = section.querySelector('.section-head');
  if (head && 'IntersectionObserver' in window) {
    head.classList.add('reveal');
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        head.classList.add('is-visible');
        io.disconnect();
      }
    });
    io.observe(head);
  }
}

function initRail() {
  const rail = document.querySelector('[data-rail]');
  if (!rail) return;
  const STEP = 250 + 28; // card width + gap
  document.querySelectorAll('[data-rail-dir]').forEach((btn) => {
    btn.addEventListener('click', () => {
      rail.scrollBy({ left: Number(btn.dataset.railDir) * STEP, behavior: 'smooth' });
    });
  });
}
