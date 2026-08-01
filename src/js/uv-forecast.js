/*
 * <uv-forecast> — hourly UV index readout backed by the Open-Meteo API.
 *
 * Attributes:
 *   location  which city to show. Accepted: the keys of LOCATIONS below.
 *             Default "san diego". Unknown values fall back to the default.
 *   hours     how many upcoming hours to list, 1-24. Default 8.
 *
 * No API key is required, so nothing secret is shipped to the browser.
 */

const LOCATIONS = {
  'san diego': { lat: 32.7157, lon: -117.1611, label: 'San Diego, CA' },
  'quito':     { lat: -0.1807, lon: -78.4678, label: 'Quito, Ecuador' },
  'reykjavik': { lat: 64.1466, lon: -21.9426, label: 'Reykjavík, Iceland' }
};

const DEFAULT_LOCATION = 'san diego';
const DEFAULT_HOURS = 8;
const TIMEOUT_MS = 8000;
const CACHE_TTL_MS = 10 * 60 * 1000;   // 10 minutes

class UvForecast extends HTMLElement {
  static get observedAttributes() {
    return ['location', 'hours'];
  }

  constructor() {
    super();
    this.controller = null;   // holds the AbortController for the live request
  }

  connectedCallback() {
    this.load();
  }

  disconnectedCallback() {
    // Cancel any in-flight request so a removed element does not keep working.
    this.abort();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) {
      return;
    }
    if (this.isConnected) {
      this.load();
    }
  }

  get locationKey() {
    const raw = (this.getAttribute('location') || DEFAULT_LOCATION).toLowerCase();
    return LOCATIONS[raw] ? raw : DEFAULT_LOCATION;
  }

  get hours() {
    const raw = Number(this.getAttribute('hours'));
    if (!Number.isFinite(raw)) {
      return DEFAULT_HOURS;
    }
    return Math.min(Math.max(Math.round(raw), 1), 24);
  }

  /* Reflect state to the DOM so CSS can respond to it. */
  setState(value) {
    this.setAttribute('state', value);
  }

  abort() {
    if (this.controller) {
      this.controller.abort();
      this.controller = null;
    }
  }

  buildUrl(place) {
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', place.lat);
    url.searchParams.set('longitude', place.lon);
    url.searchParams.set('hourly', 'uv_index');
    url.searchParams.set('timezone', 'auto');
    url.searchParams.set('forecast_days', '2');
    return url.toString();
  }

  /* Cache in sessionStorage so development reloads do not hammer a free API. */
  readCache(key) {
    try {
      const raw = sessionStorage.getItem(key);
      if (!raw) {
        return null;
      }
      const entry = JSON.parse(raw);
      if (Date.now() - entry.savedAt > CACHE_TTL_MS) {
        return null;
      }
      return entry.data;
    } catch (error) {
      return null;
    }
  }

  writeCache(key, data) {
    try {
      sessionStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), data }));
    } catch (error) {
      /* Storage unavailable or full. Caching is an optimisation, not a requirement. */
    }
  }

  async load() {
    const place = LOCATIONS[this.locationKey];
    const cacheKey = 'uv:' + this.locationKey;

    this.abort();

    const cached = this.readCache(cacheKey);
    if (cached) {
      this.renderSuccess(cached, place);
      return;
    }

    this.renderLoading(place);

    this.controller = new AbortController();
    const timer = setTimeout(() => this.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(this.buildUrl(place), {
        signal: this.controller.signal
      });

      if (!response.ok) {
        throw new Error('Server responded with ' + response.status);
      }

      const data = await response.json();

      if (!data.hourly || !Array.isArray(data.hourly.uv_index)) {
        throw new Error('Unexpected response shape');
      }

      this.writeCache(cacheKey, data.hourly);
      this.renderSuccess(data.hourly, place);
    } catch (error) {
      if (error.name === 'AbortError') {
        this.renderError(place, 'The request timed out.');
      } else {
        this.renderError(place, 'Could not reach the UV service.');
      }
    } finally {
      clearTimeout(timer);
      this.controller = null;
    }
  }

  /* ---------- rendering ---------- */

  /* Build markup with DOM methods and textContent only.
     Remote values are never concatenated into an HTML string. */
  clear() {
    this.replaceChildren();
  }

  renderLoading(place) {
    this.setState('loading');
    this.clear();

    const p = document.createElement('p');
    p.className = 'uv-status';
    p.textContent = 'Loading UV index for ' + place.label + '…';
    this.append(p);
  }

  renderError(place, message) {
    this.setState('error');
    this.clear();

    const p = document.createElement('p');
    p.className = 'uv-status';
    p.textContent = message + ' UV data for ' + place.label + ' is unavailable right now.';

    const retry = document.createElement('button');
    retry.type = 'button';
    retry.textContent = 'Try again';
    retry.addEventListener('click', () => this.load());

    this.append(p, retry);
  }

  renderSuccess(hourly, place) {
    const now = Date.now();

    // Pair each timestamp with its reading, then keep upcoming hours only.
    const upcoming = hourly.time
      .map((time, index) => ({ time, uv: hourly.uv_index[index] }))
      .filter((entry) => new Date(entry.time).getTime() >= now - 3600000)
      .slice(0, this.hours);

    if (upcoming.length === 0) {
      this.setState('empty');
      this.clear();
      const p = document.createElement('p');
      p.className = 'uv-status';
      p.textContent = 'No upcoming readings are available for ' + place.label + '.';
      this.append(p);
      return;
    }

    this.setState('ready');
    this.clear();

    const caption = document.createElement('p');
    caption.className = 'uv-caption';
    caption.textContent = place.label + ' · next ' + upcoming.length + ' hours';

    const list = document.createElement('ul');
    list.className = 'uv-list';

    const template = document.getElementById('uv-row');

    for (const entry of upcoming) {
      const row = template.content.cloneNode(true);
      const hour = new Date(entry.time);

      row.querySelector('.uv-hour').textContent =
        hour.toLocaleTimeString([], { hour: 'numeric' });

      row.querySelector('.uv-value').textContent = entry.uv.toFixed(1);

      const meter = row.querySelector('.uv-meter');
      meter.value = entry.uv;
      meter.textContent = entry.uv.toFixed(1);

      row.querySelector('.uv-label').textContent = describe(entry.uv);

      list.append(row);
    }

    const credit = document.createElement('p');
    credit.className = 'uv-credit';
    const link = document.createElement('a');
    link.href = 'https://open-meteo.com/';
    link.textContent = 'Open-Meteo';
    credit.append('Data from ', link);

    this.append(caption, list, credit);
  }
}

/* WHO UV index bands. */
function describe(uv) {
  if (uv < 3) return 'Low';
  if (uv < 6) return 'Moderate';
  if (uv < 8) return 'High';
  if (uv < 11) return 'Very high';
  return 'Extreme';
}

customElements.define('uv-forecast', UvForecast);