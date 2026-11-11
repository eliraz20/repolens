# RepoLens

**Your code, in perspective.** A responsive dashboard for exploring public GitHub profiles: projects, primary languages, stars, and recent public events.

Built with plain JavaScript, CSS, and HTML. No framework, build step, backend, account, or API key required.

## Features

- Live GitHub username lookup with paginated repository loading
- Clearly labeled fictional demo that works without API access
- Language distribution, original repository counts, and stars
- A 30-day chart of fetched public events
- Repository search, language filters, sorting, and a fork toggle
- Shareable profiles through `?user=USERNAME`
- JSON export, responsive layout, keyboard support, and reduced-motion support
- Request cancellation, friendly errors, and five-minute in-memory caching

## Run locally

Install [Node.js](https://nodejs.org/) 20 or newer, then run from this folder:

```sh
npm start
```

Open **http://127.0.0.1:4173**. No `npm install` is necessary. Use a web server rather than opening `index.html` directly, because browsers restrict ES modules on `file://` URLs.

```sh
npm test
```

The tests exercise pagination, partial API failures, request cancellation, filters, summaries, and UTC date boundaries. Tests mock the network and do not require GitHub access.

## How it works

`src/api.js` reads the public GitHub REST API. `src/model.js` calculates summaries and filters without touching the DOM. `src/app.js` handles rendering and interaction. `src/demo.js` supplies an explicitly fictional sample. `scripts/serve.mjs` is a dependency-free development server.

User-controlled strings are escaped before rendering. Links accept HTTPS URLs only. There are no access tokens in the browser or server secrets to configure. Profile data is cached in memory for five minutes and disappears on reload.

## Data boundaries

- Repository fetching is capped at the 1,000 most recently pushed public repositories. If reached, the UI marks summary totals as partial.
- Stars and primary-language shares exclude forks. The language chart counts repositories with a known primary language; it does not measure bytes or lines of code.
- Activity counts fetched **public events**, not commits or contributions. GitHub's events feed is limited to recent events and at most 300 entries, so the graph may be incomplete. It is not a contribution calendar.
- Anonymous GitHub requests are rate limited per IP. Rate-limit errors are shown without replacing the displayed profile with sample data.
- The sample profile, repository stats, and activity are fictional. Demo repository links open GitHub searches.
- Styling uses optional Google Fonts with system fallbacks. Live mode loads GitHub profile avatars and makes browser requests to `api.github.com`.

API references: [repositories](https://docs.github.com/en/rest/repos/repos#list-repositories-for-a-user), [public events](https://docs.github.com/en/rest/activity/events#list-public-events-for-a-user), and [rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api).

## Make it yours

Change the colors in `styles.css`, add your own default profile, or extend the app with repository comparisons and SVG report exports. The small modules are intended to be easy to understand and build on.

## License

MIT. See [LICENSE](LICENSE).
