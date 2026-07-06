# End-to-end tests (Playwright)

These specs drive the real plugin in a browser against the wp-env site and assert
only what the plugin controls.

## Running

```bash
npm run build            # the React admin bundle must exist
npx wp-env start         # dev site on http://localhost:8888
npm run test:e2e:install # one-time: install the chromium browser
npm run test:e2e
```

Override the target site with `WP_BASE_URL` (defaults to `http://localhost:8888`).

## What is covered

- **connection.spec.js** — paste a raw key or a full `<script>` snippet, save, and
  confirm one async SDK `<script>` with the correct URL is injected into `<head>`.
- **health-check.spec.js** — run the Health Check and confirm the honest result.
- **lifecycle.spec.js** — deactivating the plugin stops SDK injection.
- **i18n.spec.js** — switching language re-renders strings instantly (EN → SV).

## Testing limitation (read this)

The EaseAccess24 widget only renders on a domain **authorized in the platform**.
`localhost` is not authorized, so **the genuine "OK / your widget is live" state
cannot be verified here.** e2e therefore tests injection, key extraction, the
admin UI, diagnostics honesty, and lifecycle — never a real healthy widget.

`health-check.spec.js` intercepts the external SDK request and returns an inert
200 no-op. This makes the localhost result **deterministic**
(`LOCALHOST_DETECTED`) instead of network-dependent (`SDK_UNREACHABLE` /
`DOMAIN_NOT_ALLOWED`). The stub neutralizes the external SDK; it does **not** fake
a healthy path — the test explicitly asserts the "widget is live" card never
appears. A real healthy result must be confirmed later on a real authorized
domain.
