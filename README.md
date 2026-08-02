# CSE 134B — HW5

Portfolio site for Arrissa Calvillo, built with Eleventy and deployed on Netlify.

**Deployed site:** https://calvillocodes.netlify.app
**Repository:** https://github.com/arcalvillo/cse134b-HW5-portfolio

---

## Local setup

```bash
npm install     # install dependencies
npm run dev     # local dev server at localhost:8080, rebuilds on save
npm run build   # production build into _site/
```

Requires Node 20 or newer. `npm start` is an alias for `npm run dev`.

The build outputs to `_site/`, which is ignored by git — Netlify runs the build
itself on every push rather than receiving uploaded output.

---

## Part 1 — Progressive enhancement (Option A: theme picker)

I chose Option A because the site already needed a colour system built from
scratch, and a theme picker made that system do double duty: the same tokens
that give the site its light and dark presentation are what the picker
switches between.

### The no-JavaScript baseline

`:root` sets `color-scheme: light dark`, and every colour token is defined with
`light-dark()`:

```css
:root {
  color-scheme: light dark;
  --bg:   light-dark(#fdfdfc, #16181d);
  --text: light-dark(#1b1b1b, #e9e9e7);
  /* ... */
}
```

`color-scheme` tells the browser the page supports both modes. That does two
things: it makes the browser follow the operating system preference without any
script, and it makes native form controls, scrollbars, and the default canvas
render in the matching mode instead of staying light. `light-dark()` then
returns its first value when the resolved scheme is light and its second when
it is dark.

With JavaScript disabled the site is fully usable and correctly themed. Nothing
about the baseline depends on a script running.

### The enhancement

`js/theme.js` adds a user override on top of that baseline. Selecting an option
sets `data-theme` on the root element, and two CSS rules pick up that state:

```css
html[data-theme="light"] { color-scheme: light; }
html[data-theme="dark"]  { color-scheme: dark;  }
```

Because every colour is a `light-dark()` pair, changing which scheme resolves
repaints the whole site from one attribute. The JavaScript never writes inline
styles onto individual elements — it sets one piece of state that the CSS
already understands.

### The control

A `<fieldset>` with a `<legend>` containing three radios: Light, Dark, and
System. Radios were the right choice because the three states are mutually
exclusive, and the platform then supplies keyboard operation (arrow keys),
the announced selected state, and group labelling from the `<legend>` — no
ARIA attributes needed. Each radio has a `<label for>` matching its `id`.

### Persistence

The chosen theme is stored in `localStorage` under the key `theme`, so it
survives reloads and carries across pages. Selecting "System" removes the key
rather than storing a third value, since the absence of an override is exactly
what "follow the system" means.

Every storage call is wrapped in `try/catch`. `localStorage` can throw — Safari
private browsing throws on write, and some configurations throw on read when
cookies are blocked. A failed read falls back to "system", and a failed write
means the theme applies for the current page but is not remembered. Neither
case breaks the page.

### Flash of incorrect theme

`js/theme.js` is loaded as a module, so it is deferred and runs after the HTML
has been parsed. A visitor who had chosen dark would therefore see one frame of
the light default before the script caught up.

`js/theme-init.js` solves this. It is loaded in `<head>` *without* `defer`, so
the browser runs it before continuing to parse and paint:

```html
<script src="/js/theme-init.js"></script>
```

Render-blocking scripts are normally something to avoid. It is justified here
because the file is four lines and one synchronous `localStorage` read, so the
delay is negligible, and the alternative is a visible flash on every single page
load. The two files are separate on purpose: only the tiny one needs to block,
while the full interactive logic can wait until after parsing.

### With JavaScript unavailable

The picker ships in the HTML with the `hidden` attribute. `js/theme.js` sets
`picker.hidden = false` only at the end, after the saved preference has been
read and applied. If the script is blocked, fails to load, or throws, the
control is never revealed — so a visitor never sees a theme picker that does
nothing.

### Code quality

All JavaScript lives in external files under `js/`, loaded with `type="module"`
(or plain `<script>` for the init file). There are no inline event handler
attributes, no libraries, and no polyfills.

---

## Part 2 — Web component

### `<uv-forecast>`

San Diego gets a lot of sun and very little shade, so knowing when UV peaks is
genuinely useful information rather than a decorative widget. This element
fetches hourly UV index readings for a chosen city and renders them as a list.

### Attributes

| Attribute | Default | Accepted values | Effect |
|---|---|---|---|
| `location` | `san diego` | `san diego`, `quito`, `reykjavik` | Which city to fetch. Unknown values fall back to the default rather than erroring. Changing it triggers a new request. |
| `hours` | `8` | `1`–`24` | How many upcoming hours to list. Values outside the range are clamped; non-numeric values fall back to the default. |

Both attributes are declared in `observedAttributes`, so changing either one in
DevTools visibly reconfigures the rendered output at runtime.

### Endpoint

```
https://api.open-meteo.com/v1/forecast
```

Open-Meteo requires no API key, so no secret is shipped to the browser and none
is committed to the repository. The request carries only coordinates, the field
name `uv_index`, a timezone, and a day count.

### Usage

```html
<template id="uv-row">
  <li class="uv-row">
    <span class="uv-hour"></span>
    <meter class="uv-meter" min="0" max="12" low="3" high="8" optimum="1"></meter>
    <span class="uv-value"></span>
    <span class="uv-label"></span>
  </li>
</template>

<uv-forecast location="quito" hours="12">
  <p>UV forecast requires JavaScript. Check the current UV index at
     <a href="https://www.weather.gov/">weather.gov</a>.</p>
</uv-forecast>

<script type="module" src="/js/uv-forecast.js"></script>
```

Two things another developer needs to know when dropping this into their page:
the element expects a `<template id="uv-row">` to be present, and the content
written between the tags is fallback content shown when JavaScript is
unavailable or the script fails to load.

### The four states

| State | What the user sees |
|---|---|
| Idle / empty | A message that no upcoming readings are available |
| Loading | "Loading UV index for {city}…" |
| Success | A list of hours, each with a `<meter>` bar, numeric value, and WHO band label |
| Error | A plain-language message and a working "Try again" button |

Each state is reflected onto a `state` attribute on the element, so CSS can
respond to it — for example, `uv-forecast[state="error"] .uv-status` colours the
message red without the JavaScript needing to know anything about styling.

### Lifecycle and cancellation

`connectedCallback` starts the request when the element enters the page.
`disconnectedCallback` calls `abort()` on the `AbortController`, so an element
removed mid-request does not leave work running. The same abort runs before any
new request, so rapid attribute changes cannot leave two responses racing to
render.

A `setTimeout` aborts the request after 8 seconds, so a hanging network shows
the error state instead of leaving the widget loading forever. `AbortError` is
distinguished from other failures so the timeout gets its own message.

### Injection risk

Markup is produced by cloning the `<template>` and filling it in with
`textContent` and property assignment. Remote values are never concatenated
into an HTML string.

The reason matters: anything assigned to `innerHTML` is parsed as markup, not
treated as text. If a value coming back from a third-party server were placed
into an `innerHTML` string, a compromised or malicious response could include
tags — an `<img>` with an `onerror` handler, for example — and the browser would
execute them as part of my page, with access to everything on it. `textContent`
assigns the value as literal text, so a response containing markup renders as
visible characters and can never execute. Since the response comes from a
server I do not control, that distinction is the whole defence.

### Caching and rate limits

Successful responses are cached in `sessionStorage` for 10 minutes, keyed by
location. Reloading during development therefore does not send a fresh request
to a free public service every time. Cache reads and writes are wrapped in
`try/catch`, since caching is an optimisation and its failure should never
affect rendering.

### Attribution

The rendered output links back to Open-Meteo as the data source.

---

## Part 3 — Static site generation

### Which SSG

Eleventy. It works directly with the HTML I already had, so converting the
existing pages meant moving markup into templates rather than rewriting it, and
it ships no JavaScript to the browser of its own — the only client-side code on
the deployed site is what I wrote for Parts 1 and 2.

### Templates and includes

| File | Role |
|---|---|
| `src/_includes/base.njk` | The document shell — doctype, `<head>`, skip link, header, `<main>`, footer, script tags |
| `src/_includes/head.njk` | Title, meta description, favicon, stylesheet, theme-init script |
| `src/_includes/site-header.njk` | Site name, navigation, theme picker |
| `src/_includes/site-footer.njk` | Copyright line and links |

`<footer>` appears in exactly one source file. Every page sets
`layout: layouts/base.njk` in its front matter, and per-page `<title>` and
`<meta name="description">` come from front matter rather than repeated
boilerplate.

### Global data

| File | Contents |
|---|---|
| `src/_data/site.json` | Site title, tagline, author, description, deployed URL, email, location, navigation items, social links |
| `src/_data/build.js` | Current year, computed at build time so the footer copyright never goes stale |
| `src/_data/courses.json` | Source of truth for the coursework collection |

Templates consume these values; none of them are duplicated per page.

### Data-driven collection

`src/courses/course.njk` is a single template that paginates over
`courses.json` with `size: 1`, generating one page per course:

- `/coursework/cse134b/`
- `/coursework/cse150b/`
- `/coursework/cse151b/`

Adding a fourth course means adding an object to the JSON file. No new template,
no new HTML file. The coursework index page reads the same data, so the listing
and the pages can never drift out of sync.

### Build-time navigation state

`site-header.njk` compares `page.url` against each navigation item as it loops,
and sets `aria-current="page"` on the match. This is computed once when the site
is built, not in the browser, so the current page is marked correctly even with
JavaScript disabled.

### Generated pages

`src/404.njk` builds to `/404.html`, which Netlify serves automatically for
unmatched paths. `src/sitemap.njk` builds to `/sitemap.xml`, iterating over
`collections.all` and constructing each `<loc>` from the site URL in
`site.json`.

### Build and deploy

`netlify.toml` declares the build command (`npm run build`), the publish
directory (`_site`), and the Node version, so the configuration is committed to
the repository rather than typed into a dashboard. Netlify runs the build on
every push to `main` — a push causes a deployment, and the deployed site is
produced from source rather than uploaded.

`package.json` provides working `dev`, `start`, and `build` scripts, so
`npm install && npm run build` on a clean checkout produces a working site.

`.gitignore` excludes `_site/`, `node_modules/`, and `.env` files. Only source
is committed.

---

## Reflection

### What the conversion removed

Before the conversion I had ten HTML files, and every one of them started with
the same forty lines: the same header, the same nav list, the same footer. If I
wanted to change one link in the nav, I changed it ten times and hoped I did not
miss one. When I removed the Experiments page as part of this assignment, it
took two edits — delete the file, delete one line from a data file — where
before it would have meant opening every page and deleting the same list item
from each. The three course pages were the clearest case. They were nearly
identical HTML with different text, and now they come from one template and one
JSON file, so adding a fourth course means adding an object to that file instead
of copying a page and editing it. The chrome cannot drift out of sync anymore
because there is only one copy of it.

### What it cost

The honest cost was that a website stopped being something I could just open.
Before this I wrote an HTML file and double-clicked it. Now the files are `.njk`
and a browser has no idea what to do with them, so I need a build step in
between and a dev server running in a terminal to see anything at all. Getting
there meant installing Node, learning what npm is, and finding out the hard way
that the server stops when the terminal closes. There is also a new way for
everything to break that did not exist before: the build itself can fail. A typo
in a template does not produce one broken page, it stops the whole site from
building. And I now depend on Eleventy, which is one more thing that has to keep
working for my site to deploy.


### What I would not use an SSG for

A static site is generated once at build time and every visitor gets the same
files until the next deploy. That is fine for a portfolio, where the content
only changes when I change it. It would not work for anything where the page has
to differ per visitor or per request — a site with user accounts, a dashboard
showing someone's own data, a feed that updates without a rebuild. My own UV
component is the clearest example on this site. The UV index changes every hour,
so baking it into the HTML at build time would mean serving stale numbers until
I happened to push again. That is exactly why it is fetched in the browser
instead: the parts of a page that are the same for everyone can be generated
ahead of time, and the parts that are not have to be fetched live.

## Extra credit — Pagefind site search

A `/search/` page with full-text search across the site, using the Pagefind
JavaScript API with a custom interface rather than the bundled UI.

### Build integration

Pagefind runs after Eleventy in the build script:

```json
"build": "eleventy && pagefind --site _site"
```

It reads the generated HTML in `_site/` — not the templates — so the index is
rebuilt from the real output on every deployment. Nothing about the index is
committed to the repository.

### Scoping

`<main>` carries `data-pagefind-body` and the shared header and footer carry
`data-pagefind-ignore`. Without this, the navigation would appear on every page
and every query matching a nav item would return the whole site. Because the
header and footer are single shared includes, this took three attributes.

### The interface

`src/js/search.js` calls `pagefind.search(query)` and renders results by
cloning a `<template>` and filling it with `textContent`, the same approach used
in the UV component. The form uses a labeled `input type="search"`, results are
announced through an `aria-live="polite"` status line, and a `<noscript>` block
explains that search requires JavaScript and links to the sitemap as a
browsable fallback.

### What gets built and why it needs no server

Pagefind reads the finished HTML and writes a static index into
`_site/pagefind/` — an index of the words on each page, plus content fragments,
plus a small WebAssembly search engine. On my site that covers 12 pages and 548
indexed words, so the index is only a few hundred kilobytes.

There is no search server because the searching happens in the visitor's
browser. When a query runs, the browser fetches only the index chunks that
could contain matches, rather than the whole index, and the WebAssembly engine
resolves the query locally. All the expensive work — reading every page and
building the word index — happened once at build time. Netlify only ever hands
out static files, exactly as it does for the rest of the site.