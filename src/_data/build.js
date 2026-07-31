// Computed at build time so the footer year is never stale and never hard-coded per page.
export default {
  year: new Date().getFullYear(),
  time: new Date().toISOString()
};
