/*
 * Runs BEFORE first paint, on purpose, to prevent a flash of the wrong theme.
 * This is the one script on the site that is intentionally render-blocking.
 * It is kept to a few lines so the cost is negligible. See README.
 */
try {
  const saved = localStorage.getItem('theme');
  if (saved === 'light' || saved === 'dark') {
    document.documentElement.dataset.theme = saved;
  }
} catch (error) {
  /* localStorage can throw (for example, Safari private browsing).
     If it does, the site simply follows the OS preference. */
}
