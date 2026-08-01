/*
 * <uv-forecast> — hourly UV index readout.
 *
 * Stage 1: element registration and lifecycle only. No network yet.
 */

// Coordinates for the locations this element supports.
const LOCATIONS = {
  'san diego': { lat: 32.7157, lon: -117.1611, label: 'San Diego, CA' },
  'los angeles': { lat: 34.0522, lon: -118.2437, label: 'Los Angeles, CA' },
  'phoenix': { lat: 33.4484, lon: -112.0740, label: 'Phoenix, AZ' },
  'seattle': { lat: 47.6062, lon: -122.3321, label: 'Seattle, WA' }
};

const DEFAULT_LOCATION = 'san diego';

class UvForecast extends HTMLElement {
  /* Tells the browser which attributes to watch. Changing one of these
     calls attributeChangedCallback below. */
  static get observedAttributes() {
    return ['location', 'hours'];
  }

  /* Runs when the element is inserted into the page. */
  connectedCallback() {
    this.render();
  }

  /* Runs when the element is removed from the page. */
  disconnectedCallback() {
    // Stage 2 will cancel in-flight requests here.
  }

  /* Runs whenever an observed attribute is added, removed, or changed. */
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) {
      return;
    }
    this.render();
  }

  /* Read the location attribute, falling back to the default. */
  get locationKey() {
    const raw = (this.getAttribute('location') || DEFAULT_LOCATION).toLowerCase();
    return LOCATIONS[raw] ? raw : DEFAULT_LOCATION;
  }

  /* Read the hours attribute, clamped to something sensible. */
  get hours() {
    const raw = Number(this.getAttribute('hours'));
    if (!Number.isFinite(raw)) {
      return 8;
    }
    return Math.min(Math.max(Math.round(raw), 1), 24);
  }

  render() {
    const place = LOCATIONS[this.locationKey];
    this.textContent =
      'Placeholder: ' + this.hours + ' hours for ' + place.label;
  }
}

customElements.define('uv-forecast', UvForecast);