/*
 * Runs BEFORE first paint, on purpose, to prevent a flash of the wrong
 * presentation. This is the one script on the site that is intentionally
 * render-blocking. It is kept short so the cost is negligible. See README.
 */
try {
  const theme = localStorage.getItem('theme');
  if (theme === 'light' || theme === 'dark') {
    document.documentElement.dataset.theme = theme;
  }

  if (localStorage.getItem('aesthetic') === 'academia') {
    document.documentElement.dataset.aesthetic = 'academia';
  }

  if (localStorage.getItem('reading') === 'plain') {
    document.documentElement.dataset.reading = 'plain';
  }
} catch (error) {
  /* localStorage can throw (for example, Safari private browsing).
     If it does, the site renders in its default presentation. */
}