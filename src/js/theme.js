/*
 * Part 1, Option A: theme picker as a progressive enhancement.
 *
 * The baseline lives entirely in CSS: :root sets `color-scheme: light dark`
 * and all colors use light-dark(), so the site already follows the operating
 * system preference with no JavaScript at all.
 *
 * This module only adds a user override on top of that baseline. The control
 * ships in the HTML with the `hidden` attribute and is revealed here, so if
 * this script never runs the user sees no dead control.
 */

const root = document.documentElement;
const picker = document.getElementById('theme-picker');
const STORAGE_KEY = 'theme';

/** Read the saved preference, or null if unavailable. */
function readPreference() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    return null;
  }
}

/** Persist the preference. 'system' means "no override", so remove the key. */
function writePreference(value) {
  try {
    if (value === 'system') {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, value);
    }
  } catch (error) {
    /* Storage unavailable or full. The theme still applies for this page. */
  }
}

/**
 * Apply a theme by setting state on the root element.
 * CSS already understands [data-theme]; no inline styles are written.
 */
function applyTheme(value) {
  if (value === 'light' || value === 'dark') {
    root.dataset.theme = value;
  } else {
    delete root.dataset.theme;
  }
}

if (picker) {
  const saved = readPreference();
  const initial = saved === 'light' || saved === 'dark' ? saved : 'system';

  applyTheme(initial);

  const selected = picker.querySelector('input[value="' + initial + '"]');
  if (selected) {
    selected.checked = true;
  }

  // Only reveal the control once everything above has succeeded.
  picker.hidden = false;

  picker.addEventListener('change', (event) => {
    if (event.target.name !== 'theme') {
      return;
    }
    applyTheme(event.target.value);
    writePreference(event.target.value);
  });
}
