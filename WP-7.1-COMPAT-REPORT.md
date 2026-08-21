# WordPress 7.1 Compatibility Report — EaseAccess24 Accessibility

**Plugin:** EaseAccess24 Accessibility (`easeaccess24-accessibility`)
**Version audited:** 1.0.0 → **1.0.1** (proposed patch bump, applied on this branch)
**Branch:** `chore/wp-7.1-compat`
**Date:** 2026-08-21
**Verdict:** **Compatible with WordPress 7.1.** No code change was required for
compatibility. The only changes on this branch are version/metadata.

WordPress 7.1 was released 19 August 2026. WordPress.org asked authors to verify
compatibility and refresh `Tested up to`. Live values before this branch:
`version 1.0.0`, `tested 7.0.4`, `requires 6.3`, `requires_php 7.4`
(api.wordpress.org, last updated 2026-08-10).

---

## 1. Seven-item verdict table

None of the seven announced 7.1 changes apply. Every verdict below is backed by a
search over `includes/`, `src/`, `tests/`, `e2e/` and the root PHP/JS/JSON files.

| # | WordPress 7.1 change | Verdict | Evidence |
|---|---|---|---|
| 1 | Post editor always iframed | **DOES NOT APPLY** | No `enqueue_block_editor_assets`, `block_editor_settings_all`, `registerPlugin`, `wp.plugins`/`wp.editor`/`wp.blockEditor`, or any `@wordpress/{block-editor,editor,plugins,edit-post,blocks}` import. The plugin's only admin hooks are `admin_menu` + `admin_enqueue_scripts` (`includes/class-admin.php:36-37`), and assets are gated to its own screen by hook-suffix comparison (`includes/class-admin.php:82`). It never touches the editor canvas. |
| 2 | Client-side media processing | **DOES NOT APPLY** | Zero media/upload/attachment hooks. No `wp_handle_upload`, `upload_mimes`, `wp_generate_attachment_metadata`, `image_*`, `big_image_size_threshold`, `wp_read_image_metadata`. The plugin uploads, resizes and stores nothing. |
| 3 | `@wordpress/components` changes (40px controls, `Navigation`→`Navigator`, Emotion) | **DOES NOT APPLY** | Not a dependency: `package.json:43-47` declares only `@wordpress/element`, `@wordpress/i18n`, `i18next`. Zero imports of it in `src/`. The built bundle's declared dependencies are `react-jsx-runtime` and `wp-element` only (`build/index.asset.php`). All controls are native elements styled with prefixed Tailwind (`src/components/Button.jsx:55`, `src/components/TextField.jsx:53`). Measured control heights are the design's own (32/34/44/48/52px) and owe nothing to the package's 40px default. |
| 4 | Persistent toolbar in Post/Site Editors | **DOES NOT APPLY** | No `admin_bar_menu`, `wp_before_admin_bar_render`, `show_admin_bar`, or `WP_Admin_Bar` usage anywhere. The plugin adds no toolbar node. |
| 5 | Public SVG Icon API | **DOES NOT APPLY** (opt-in, additive) | Icons are inline JSX SVGs (`src/components/Icons.jsx`); the 33 locale flags are emitted as hashed `asset/resource` files by webpack (`webpack.config.js`). Nothing registers an icon collection, so the new API changes no behaviour. Available as a future option, not a compatibility item. |
| 6 | jQuery UI 1.13.3 → 1.14.2 | **DOES NOT APPLY** | A case-insensitive `jquery` search across `includes/`, `src/`, `tests/`, `e2e/` and root PHP/JS/JSON returns **no matches**. No `jquery-ui-*` handle, no `jquery` script dependency, no jQuery at all. The admin app is React on `wp-element`. |
| 7 | Abilities API expansion | **DOES NOT APPLY** | No `wp_register_ability` or abilities usage. The plugin's REST surface is one `register_rest_route` namespace (`includes/class-rest-controller.php`), untouched by 7.1. |

### Deprecated / removed API sweep

The plugin is 1,974 lines of PHP across 14 files. Every WordPress function it
calls is current, non-deprecated core API; nothing removed in 7.0 or 7.1 is
called. Two specifics worth recording:

- `html_entity_decode()` passes explicit `ENT_QUOTES` (`includes/class-connection.php:116`),
  so the PHP 8.1 change to that function's default flags does not apply.
- `is_plugin_active()` is guarded by `function_exists()` before use
  (`includes/class-compatibility.php:73`).

### Item confirmed at runtime rather than statically

- **Core-provided React.** The bundle externalises React to `wp-element` /
  `react-jsx-runtime` (`includes/class-admin.php:88-89`), so it inherits whatever
  React core ships. React 19 was punted beyond 7.1, so 7.1 stays on React 18.
  **Verified:** the admin app mounts and renders on 7.1 with **0 console errors**
  across all five tabs, both connection states, and the language dropdown.

---

## 2. Environment

`.wp-env.json` was **not modified** — `"core": null` and `"phpVersion": "7.4"` are
unchanged, and `git diff .wp-env.json` is empty. Every version target was driven
by environment variables instead, so no run left a trace in committed config:

```bash
WP_ENV_CORE=https://wordpress.org/wordpress-7.1.zip npx wp-env start --update
WP_ENV_CORE=https://wordpress.org/wordpress-6.9.zip npx wp-env start --update
WP_ENV_PHP_VERSION=8.4                              # added for the 8.4 pass
```

| Pass | WordPress | PHP | Source |
|---|---|---|---|
| Primary | **7.1** (dev + tests sites) | **7.4.33** | `wp core version`, `PHP_VERSION` |
| Modern PHP | **7.1** | **8.4.24** | `wp core version`, `PHP_VERSION` |
| Low-end smoke | **6.9** | **7.4.33** | `wp core version`, `PHP_VERSION` |

**Gotcha worth keeping:** round-tripping 7.1 → 6.9 → 7.1 on a shared wp-env
database leaves WordPress demanding a schema upgrade, and every wp-admin request
302s to `upgrade.php` until it is done. Fix: `wp core update-db` on **both** the
`cli` and `tests-cli` containers. Downgrading needs no such step. This cost one
false "the admin app won't render" scare mid-audit.

---

## 3. Test suite results

Built clean before every pass (`rm -rf build && npm run build`) — webpack does not
clean `build/`, so a stale bundle would otherwise ship silently.

| Suite | WP 7.1 / PHP 7.4 | WP 7.1 / PHP 8.4 | WP 6.9 / PHP 7.4 |
|---|---|---|---|
| phpcs (WordPress + PHPCompatibilityWP) | **PASS** (25 files) | **PASS** (25 files) | **PASS** (25 files) |
| `lint:js` (ESLint) | **PASS** | not re-run (host-side, PHP-independent) | **PASS** |
| `lint:css` (Stylelint) | **PASS** | not re-run (host-side, PHP-independent) | **PASS** |
| Jest | **PASS** 28/28 | not re-run (host-side, PHP-independent) | **PASS** 28/28 |
| PHPUnit (WP integration) | **PASS** 51 tests / 149 assertions | **PASS** 51 / 149 | **PASS** 51 / 149 |
| Playwright e2e | **PASS** 5/5 | **PASS** 5/5 | **PASS** 5/5 |

All suites were re-run after the version bump: **still green** (`phpcs`, `phpunit`,
`lint:js`, `lint:css`, `jest`, `playwright` all exit 0). Logs in
`artifacts/wp-7.1/logs/`, `artifacts/wp-7.1-php84/logs/`, `artifacts/wp-6.9/logs/`.

### PHP 8.4 pass — report-only, and clean

Run only after 7.1/PHP 7.4 was fully green, and scoped to reporting: any finding
would have been pre-existing rather than 7.1-related, and would not have been
fixed on this branch. **Nothing was found.** phpcs, PHPUnit and Playwright all
pass on PHP 8.4.24, the SDK tag renders identically, and `debug.log` records
**zero deprecations or notices** after real front-end page loads.

---

## 4. SDK script tag verification

The tag is produced entirely through core APIs — `wp_enqueue_script()` with
`'strategy' => 'async'` and a `wp_script_attributes` filter guarded on
`$attributes['id']` (`includes/class-sdk-loader.php:76-77`, `:132-146`).

**Note on the brief:** there is no `script_loader_tag` filter in this codebase.
That approach — discarding core's tag and rebuilding it with `sprintf()` — was the
specific cause of WordPress.org review rejection round 2, and was replaced. The
"five attributes" are `async` (from the loading strategy) plus the four `data-*`
optimizer hints.

Rendered on **WordPress 7.1**:

```html
<script async data-cfasync="false" data-no-defer="1" data-no-minify="1"
        data-no-optimize="1" data-wp-strategy="async" id="easeaccess24-sdk-js"
        src="https://widget.easeaccess24.com/sdk.js?key=EA24-WP71-AUDIT-KEY">
```

| Assertion | WP 7.1 | WP 6.9 |
|---|---|---|
| `id="easeaccess24-sdk-js"` present | PASS | PASS |
| `async` present | PASS | PASS |
| `data-cfasync="false"` | PASS | PASS |
| `data-no-optimize="1"` | PASS | PASS |
| `data-no-defer="1"` | PASS | PASS |
| `data-no-minify="1"` | PASS | PASS |
| Tag inside `<head>` | PASS (line 1204 < `</head>` 1215) | PASS (line 1167 < `</head>` 1178) |
| No `?ver=` appended to the `?key=` URL | PASS | PASS |
| Exactly one SDK tag on the page | PASS (count 1) | PASS (count 1) |
| Hints do **not** leak onto other scripts (`id` guard) | PASS | PASS |

**Attribute order differs between versions** — 7.1 renders them alphabetically
sorted, 6.9 in insertion order (`src, id, async, data-wp-strategy, data-cfasync, …`).
The attribute *set* is identical. This is exactly why the tests assert
attribute-by-attribute and never against a whole tag string; that convention held
up here.

Core also adds its own `data-wp-strategy="async"`, recorded but not asserted.

### Optimizer hints against a real cache plugin

Until now the four `data-*` hints had only ever been verified as *present* — the
wp-env environment runs no cache or optimizer plugin, so nothing had exercised
what they are for. On `smarthub.mk` (WordPress 6.6.2, plugin v1.0.0 from the
directory) **WP Rocket was active and the widget still rendered**, with the
Health Check passing. This is the first time the hints have been observed against
a real optimizer rather than asserted in isolation.

Stated precisely, because it is easy to over-read: what was observed is that the
SDK tag survived a live WP Rocket install intact enough for the widget to load.
It does **not** isolate which attribute did the work, and `data-cfasync` is a
Cloudflare directive that WP Rocket never consumes at all. The remaining
compatibility targets in `.claude/context/04-constraints.md` — LiteSpeed Cache,
Autoptimize, Perfmatters, Asset CleanUp, Cloudflare — are still unverified
against a live install, as is WP Rocket **on 7.1** specifically. The
`Compatibility` tab's *detection* of these plugins is separately unit-tested
(`tests/php/test-compatibility.php`); it is the exclusion hints' real-world
*effect* that had never been exercised before.

**Not verified:** that the tag is absent from wp-admin. An anonymous fetch of
`/wp-admin/` returns 302 to the login screen, so it proves nothing. The `id` guard
is unit-tested (`tests/php/test-sdk-loader.php:124`) and the leak check above
passes, but a logged-in admin-screen source check was not performed.

---

## 5. Admin screens on 7.x chrome

Screens captured at 1440×900 on WordPress 7.1, in English, in both connection
states, with each tab confirmed `aria-selected="true"` before capture. Files in
`artifacts/wp-7.1/screens/` (gitignored).

Connection, Compatibility, Activity, Support, Help, the language dropdown (all 33
locales listed), and the health-check result. **0 console errors** in every pass.
No spacing collisions with core admin CSS; the scoped reset at `src/admin.css:80-122`
holds, fonts resolve to bundled Inter throughout, and the Support screen correctly
reads `Tested up to: WordPress 7.1` and `Version 1.0.1` straight from the plugin
header.

### Two pre-existing `preflight: false` defects — reported, NOT fixed

Both are UA-stylesheet / wp-admin CSS interactions, **not** 7.1 regressions, and
per decision they are documented here rather than changed on this branch.

**(a) Browser bevel on every primary (gradient) button.**
`VARIANTS.primary` (`src/components/Button.jsx:21-22`) sets no border utility at
all. With Tailwind's preflight disabled, nothing zeroes the border, so the user-agent
rule `button { border: 2px outset }` renders — a hard near-black 2px ring around
the gradient. The `secondary` variant is unaffected because it carries an explicit
`ea24-border-solid` (`:24`).

Observed on `Connect & Verify` (onboarding CTA), `Run Health Check` (dashboard,
pre-result state) and `Generate report` (Support tab). Screenshot:
`artifacts/wp-7.1/screens/wp71-DEFECT-preflight-bevel.png`.

**Verified version-independent.** A full computed-border census in matched UI
states returns byte-identical output on both versions:

| Button | WP 7.1 | WP 6.9 |
|---|---|---|
| `Connect & Verify` (gradient) | `2px outset`, h=52 | `2px outset`, h=52 |
| `Run Health Check` (gradient) | `2px outset`, h=44 | `2px outset`, h=44 |
| `Run check again` (secondary) | `1px solid`, h=44 | `1px solid`, h=44 |
| `Reveal` / `Copy` / `Update key` | `1px solid`, h=32 | `1px solid`, h=32 |
| Nav tabs | `0px outset` (inert — zero width) | `0px outset` (inert) |

**Visual only — no layout shift.** The scoped reset applies
`box-sizing: border-box` (`src/admin.css:80-84`), so the 2px border consumes
content area instead of growing the box. The 52px measured on `Connect & Verify`
is its intended `ea24-h-[52px]` (`src/screens/Onboarding.jsx:246`), not inflation.
An earlier note in this session claiming a 48→52px inflation was wrong.

Suggested fix when it is scoped: add `ea24-border-0` to `VARIANTS.primary`.

**(b) wp-admin link underline bleeding into gradient button pills.**
Anchors carrying `.ea24-gradbtn` inherit wp-admin's `a { text-decoration: underline }`,
so button-shaped links render underlined: `Get your Widget Key` (onboarding) and
`Open EaseAccess24 Dashboard` (health-check result). Cosmetic. Note that
`Where do I find this?` is a genuine text link and its underline is correct —
not a defect.

Suggested fix when it is scoped: `ea24-no-underline` on the `.ea24-gradbtn` anchors.

---

## 6. Health check, end to end

Run on WordPress 7.1 with the SDK stubbed reachable-but-inert (the honest
localhost scenario). Reported correctly:

| Check | Result |
|---|---|
| Widget Key saved | passed |
| Widget script added to your site | passed |
| Widget script is reachable | passed |
| Widget appears and is visible | **failed** |
| Exactly one widget on the page | not applicable |

Verdict: **“Local environment detected” (info)**, with the correct explanation
(“the widget only renders on domains authorized in EaseAccess24”) and remedy
(“test on your live, authorized domain”). The `last health check` timestamp
updated.

This is the intended behaviour and the important negative result: the script tag
was present *and* reachable, yet the plugin did **not** report success — it
honoured the presence≠success rule and routed to the localhost branch instead of
fabricating an OK. Screenshot: `wp71-health-check-result.png`.

---

## 7. Plugin Check triage

Plugin Check **2.1.0**, run with `--require=…/plugin-check/cli.php` so runtime
checks execute, against a **`.distignore`-clean copy of the shipped file set**
(98 files, 16 PHP, 1.6 MB) rather than the dev-mapped repo — scanning the repo in
place would have reported on `src/`, `tests/`, `e2e/` and `node_modules/`, none of
which ship.

### ERROR — fixed (1)

| Code | File | Message | Resolution |
|---|---|---|---|
| `outdated_tested_upto_header` | `readme.txt` | `Tested up to: 7.0 < 7.1` — plugin will not show in searches unless documented as tested against the current release | **FIXED.** `Tested up to` → `7.1` in both `readme.txt:5` and the plugin header. Re-run confirms the error is gone. |

### WARNING — pending your decision (1)

| Code | File | Message |
|---|---|---|
| `unexpected_markdown_file` | `CREDITS.md` | Unexpected markdown file in plugin root; only specific markdown files are expected in production plugins |

**Recommendation: KEEP, and exclude it from the shipped ZIP.** `CREDITS.md`
carries third-party attribution, which matters for GPLv2+ compliance, so deleting
it is wrong. But it has no runtime purpose in the shipped plugin, and it is
currently *not* in `.distignore`, which is why it reached the scan at all. Adding
`/CREDITS.md` to `.distignore` silences the warning and keeps attribution in the
public repository where it belongs. This is a one-line change to a file this
branch otherwise does not touch, so it is left for you.

Counter-argument for fixing instead: if you would rather attribution travel with
the installed plugin, keep shipping it and accept a permanent warning — Plugin
Check will flag it on every future release.

### Investigated and dismissed — not a defect

`_load_textdomain_just_in_time` notice for the `easeaccess24-accessibility`
domain appeared in Plugin Check's output. It is an artefact of Plugin Check's own
WP-CLI bootstrap, which loads the plugin file outside normal hook order — **not**
a plugin defect. Evidence: with `WP_DEBUG`/`WP_DEBUG_LOG` on, real front-end page
loads (front page ×2, RSS feed, a 404) write an **empty** `debug.log`, and the
string `easeaccess24-accessibility` appears in **zero** notices. The plugin calls
no `load_plugin_textdomain()` and touches translations only inside
`admin_menu`/`admin_enqueue_scripts` callbacks, all of which run after `init`.

---

## 8. PHP compatibility (static, 7.4 → 8.5)

WordPress 7.1 requires PHP 7.4 and supports through PHP 8.5, unchanged from 7.0 —
so the plugin's PHP 7.4 floor is still correct and 8.5 is the right ceiling.

Run against `easeaccess24-accessibility.php`, `uninstall.php` and `includes/`
(14 files), `testVersion 7.4-8.5`. No new CI matrix jobs were added.

| Run | Toolchain | Sniff coverage | Result |
|---|---|---|---|
| 1 — of record | `phpcompatibility/php-compatibility` **9.3.5** as pinned in `composer.lock` | ceiling **PHP 8.0** | **0 findings** |
| 2 — real 8.1–8.5 coverage | `phpcompatibility/php-compatibility` **10.0.0-alpha2** (via `phpcompatibility-wp` 3.0.0-alpha2) | **8.0–8.5** confirmed present in the sniff set | **0 findings** |

Run 1 alone would have been a false reassurance: 9.3.5 dates from 2019 and has no
sniffs above PHP 8.0, so `7.4-8.5` silently checked nothing in 8.1–8.5. Run 2 was
therefore installed into a throwaway Composer project under gitignored
`artifacts/phpcompat/` — **`composer.json` and `composer.lock` are unmodified**
(`git diff` confirms). There is no published `dev-develop` branch for
`phpcompatibility-wp`; `^3.0.0-alpha2` is the line carrying the modern sniffs.

**No deprecations or incompatibilities were found anywhere in the 7.4–8.5 range.**
This is corroborated by the runtime PHP 8.4.24 pass, which logged zero
deprecations.

---

## 9. Files changed on this branch

Metadata only. No plugin logic, no CSS, no tests were touched.

| File | Change | Why |
|---|---|---|
| `easeaccess24-accessibility.php` | `Version: 1.0.0 → 1.0.1`; `Tested up to: 7.0 → 7.1`; `EASEACCESS24_VERSION → '1.0.1'` | `deploy.yml` hard-fails unless the tag matches both the header `Version` and the readme `Stable tag`. The header `Tested up to` is **not** cosmetic: `Admin::plugin_info()` reads it via `get_file_data()` (`includes/class-admin.php:200-215`) and the Support screen renders it (`src/screens/Support.jsx:163-166`), so a readme-only edit would have left the UI advertising 7.0. `tests/php/test-admin.php` asserts the two agree — it exists because this value went stale silently once before. |
| `readme.txt` | `Tested up to: 7.0 → 7.1`; `Stable tag: 1.0.0 → 1.0.1`; new `= 1.0.1 =` changelog entry and Upgrade Notice | The WordPress.org requirement that prompted this audit, plus the version the directory installs. |
| `package.json` | `version: 1.0.0 → 1.0.1` | Kept in step with the plugin header. |
| `package-lock.json` | two root `version` fields `1.0.0 → 1.0.1` | Written by `npm version 1.0.1 --no-git-tag-version`; keeps the lock consistent with `package.json`. Diff is version-only. |
| `WP-7.1-COMPAT-REPORT.md` | new | This report. |

**`Requires at least: 6.3` was not moved**, as required.

### Pre-existing lockfile change set aside

The working tree carried an unrelated modification to `package-lock.json` when
this branch was cut: `@playwright/test` and `@wordpress/e2e-test-utils-playwright`
being recorded as direct devDependencies (they are declared as such in
`package.json:35-36`) with the corresponding `"peer": true` markers dropped. That
is a legitimate lockfile reconciliation, but unrelated to this release, so it was
**stashed** rather than reverted and is recoverable:

```bash
git stash list    # stash@{0}: wip: package-lock sync for playwright direct devDeps
```

It probably deserves its own commit.

---

## 10. Could not verify

- **Tag-to-widget was never observed on 7.1 itself — it is a composition of two
  separate observations.** The two halves were each verified, but on different
  installs:
  - **Tag correctness on 7.1** — verified in wp-env (§4): all five attributes, in
    `<head>`, clean `?key=` URL, exactly one tag, no leakage. What this cannot
    show is the widget itself, because the SDK only renders on a domain
    authorized in EaseAccess24 and localhost is not one.
  - **Tag-to-widget on an authorized domain** — verified on `smarthub.mk`,
    **WordPress 6.6.2**, running plugin **v1.0.0 installed from the directory**.
    The tag rendered in `<head>` with `id="easeaccess24-sdk-js"`,
    `async="async"`, all four `data-*` hints and core's `data-wp-strategy="async"`,
    on a clean `?key=` URL with no `&ver=`; attributes appeared in insertion
    order, matching the sub-7.1 behaviour recorded in §4. The widget rendered and
    opened on the front end, and the plugin's own Health Check returned
    **"Your widget is live" (passed)** — the first genuine passing verdict
    obtained anywhere in this audit, as opposed to the honest localhost result
    in §6.

  **Why they were not observed together.** `smarthub.mk` is a third-party
  production site on WordPress 6.6.2 that we have no permission to update, back
  up, or modify, so the planned 7.1 smoke test could not be run there and no
  build was uploaded. It was observed as-is, running the published 1.0.0.

  **Why the composition is nonetheless reasonable — and where it stops.** 1.0.1
  is metadata-only, so its executable code is byte-identical to the live 1.0.0;
  the observed site was therefore running the same code this branch ships. And
  the SDK is an external, client-side script: once the tag in `<head>` is
  correct, whether the widget renders is decided by the SDK, the platform and
  domain authorization in the visitor's browser — not by the WordPress version
  that emitted the tag. Since §4 shows 7.1 emits a correct tag, and the real site
  shows a correct tag produces a live widget, 7.1 is expected to behave the same.
  **That remains an inference, not a measurement.** No single install has been
  observed emitting a 7.1 tag *and* rendering the widget, and this report does
  not claim one has.
- **The declared 6.3 floor is still asserted, not exercised — but the nearest
  real-site evidence is now 6.6.2, not 6.9.** The controlled test window remains
  7.1 / 7.0 / 6.9, and nothing in this audit *ran a suite* below 6.9. The
  `smarthub.mk` observation does move the floor evidence down: the plugin was
  seen working correctly on **WordPress 6.6.2**, which is inside the previously
  untested 6.3–6.8 gap. That leaves **6.3–6.5 and 6.7–6.8** unverified. It is
  one production site and a front-end observation only — no test suite ran there
  — so it is corroboration, not measurement. The floor stays credible on its
  original grounds (6.3 is when `'strategy' => 'async'` and `wp_script_attributes`
  landed).
- **SDK tag absence on wp-admin screens** — see §4. The `id` guard is unit-tested
  and no attribute leakage was observed on the front end, but a logged-in
  admin-page source check was not run.
- **Stale context documentation.** `.claude/context/` describes a
  `script_loader_tag` filter and a WordPress **6.0** floor. The repository
  actually uses `wp_script_attributes` and **6.3**. The docs are wrong, not the
  code: `script_loader_tag` was the round-2 rejection cause, and 6.3 is required
  by both core features the loader depends on. `.claude/context/01-tech-stack.md`
  and `04-constraints.md` need correcting — **a separate change, not done on this
  branch.**
- **PHP 8.5 at runtime.** Covered statically (§8) and at runtime only up to
  8.4.24. No 8.5 container was exercised.
- **Sniff coverage above PHP 8.0 in the committed toolchain.** The pinned
  `composer.lock` cannot see 8.1–8.5. Today that is masked by the code being
  clean, but the repository's own `composer lint:php` would not catch a future
  8.1+ incompatibility. Upgrading `phpcompatibility-wp` is a separate decision.

---

## 11. Release readiness

Ready to ship as **1.0.1**, pending your decision on the `CREDITS.md` warning.
Nothing has been committed, tagged, pushed, or deployed.

Remaining manual steps, per the established SVN release loop: verify
`git diff`, commit, tag `v1.0.1`, and either let `deploy.yml` fire on the tag or
run the SVN loop by hand (`npm run build` first — `build/` is gitignored, so a
fresh clone has none and a plugin shipped without it has no JS or CSS).
