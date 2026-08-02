/*
 * Dark Academia aesthetic switch, plus a reading-comfort switch.
 *
 * Both work the way the theme picker does: state is set as an attribute on
 * the root element and CSS does all the visual work. Neither is required
 * for the page to function — with JavaScript off the controls are never
 * revealed and the site renders in its default presentation.
 */

const root = document.documentElement;
const controls = document.getElementById('aesthetic-controls');
const aestheticInput = document.getElementById('aesthetic-input');
const readingInput = document.getElementById('reading-input');

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

/* Set or remove a state attribute on the root element. */
function apply(attribute, value) {
  if (value) root.setAttribute(attribute, value);
  else root.removeAttribute(attribute);
}

if (controls && aestheticInput && readingInput) {
  const savedAesthetic = read(AESTHETIC_KEY) === 'academia' ? 'academia' : null;
  const savedReading = read(READING_KEY) === 'plain' ? 'plain' : null;

  apply('data-aesthetic', savedAesthetic);
  apply('data-reading', savedReading);

  aestheticInput.checked = savedAesthetic !== null;
  readingInput.checked = savedReading !== null;

  controls.hidden = false;

  aestheticInput.addEventListener('change', () => {
    const next = aestheticInput.checked ? 'academia' : null;
    apply('data-aesthetic', next);
    write(AESTHETIC_KEY, next);
  });

  readingInput.addEventListener('change', () => {
    const next = readingInput.checked ? 'plain' : null;
    apply('data-reading', next);
    write(READING_KEY, next);
  });
}