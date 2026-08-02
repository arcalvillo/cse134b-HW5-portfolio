/* Site search using the Pagefind JavaScript API.
 * Pagefind builds a static index at deploy time. Querying it happens entirely
 * in the browser, chunks of the index are fetched as needed, so no search
 * server is involved.
 */

const form = document.getElementById('search-form');
const input = document.getElementById('search-input');
const status = document.getElementById('search-status');
const list = document.getElementById('search-results');
const template = document.getElementById('search-result');

let pagefind = null;

/* Load the index bundle on first use rather than on page load */
async function getPagefind() {
  if (!pagefind) {
    pagefind = await import('/pagefind/pagefind.js');
    await pagefind.init();
  }
  return pagefind;
}

function setStatus(message) {
  status.textContent = message;
}

function clearResults() {
  list.replaceChildren();
}

async function runSearch(query) {
  if (!query) {
    clearResults();
    setStatus('Type something to search for.');
    return;
  }

  setStatus('Searching…');
  clearResults();

  let search;
  try {
    const api = await getPagefind();
    search = await api.search(query);
  } catch (error) {
    setStatus('Search is unavailable right now. Try reloading the page.');
    return;
  }

  if (search.results.length === 0) {
    setStatus('No results for "' + query + '".');
    return;
  }

  /* Results are lazy each one is fetched only when its data is requested */
  const found = await Promise.all(
    search.results.slice(0, 10).map((result) => result.data())
  );

  setStatus(
    found.length + (found.length === 1 ? ' result' : ' results') +
    ' for "' + query + '".'
  );

  for (const item of found) {
    const row = template.content.cloneNode(true);

    const link = row.querySelector('.result-title');
    link.href = item.url;
    link.textContent = item.meta.title || item.url;

    /* Pagefind returns an excerpt containing <mark> tags around matches.
       Strip them and use textContent so nothing from the index is parsed
       as markup */
    row.querySelector('.result-excerpt').textContent =
      item.excerpt.replace(/<[^>]*>/g, '');

    list.append(row);
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  runSearch(input.value.trim());
});

/* Support linking straight to a query*/
const initial = new URLSearchParams(window.location.search).get('q');
if (initial) {
  input.value = initial;
  runSearch(initial);
}