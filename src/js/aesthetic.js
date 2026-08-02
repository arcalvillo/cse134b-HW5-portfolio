/*
 * Dark Academia aesthetic toggle, plus a reading-comfort control.
 *
 * Both work the same way the theme picker does: state is set as an
 * attribute on the root element and CSS does all the visual work.
 * Neither is required for the page to function — with JavaScript off,
 * the controls are never revealed and the site renders in its default
 * presentation.
 */

const root = document.documentElement;
const controls = document.getElementById('aesthetic-controls');
const aestheticButton = document.getElementById('aesthetic-toggle');
const readingButton = document.getElementById('reading-toggle');

const AESTHETIC_KEY = 'aesthetic';
const READING_KEY = 'reading';

function read(key) {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    return null;
  }
}

function write(key, value) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch (error) {
    /* Storage unavailable. The setting still applies for this page. */
  }
}

/* Apply a state attribute and keep the button's pressed state in sync. */
function apply(attribute, value, button) {
  if (value) root.setAttribute(attribute, value);
  else root.removeAttribute(attribute);

  button.setAttribute('aria-pressed', value ? 'true' : 'false');
}

if (controls && aestheticButton && readingButton) {
  const savedAesthetic = read(AESTHETIC_KEY) === 'academia' ? 'academia' : null;
  const savedReading = read(READING_KEY) === 'plain' ? 'plain' : null;

  apply('data-aesthetic', savedAesthetic, aestheticButton);
  apply('data-reading', savedReading, readingButton);

  controls.hidden = false;

  aestheticButton.addEventListener('click', () => {
    const next = root.getAttribute('data-aesthetic') === 'academia' ? null : 'academia';
    apply('data-aesthetic', next, aestheticButton);
    write(AESTHETIC_KEY, next);
  });

  readingButton.addEventListener('click', () => {
    const next = root.getAttribute('data-reading') === 'plain' ? null : 'plain';
    apply('data-reading', next, readingButton);
    write(READING_KEY, next);
  });
}