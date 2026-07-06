# Local development environment

This project uses **[`@wordpress/env`](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-env/)**
(wp-env) for local development. wp-env runs WordPress in Docker, so the only host
requirement is **Docker** and **Node.js** — no local PHP or Composer needed.

> The plugin is mapped into the container at
> `wp-content/plugins/easeaccess24-accessibility` (see `.wp-env.json`), so its
> slug matches the shipped plugin. Edits on your machine are live inside the
> container.

## Prerequisites

- Docker Desktop (or a Docker Engine) running.
- Node.js 18+ and npm.

## One-time setup

```bash
npm install          # install JS/build dependencies
npm run build        # compile the React admin app into build/
```

`npm run build` must run at least once before starting WordPress, otherwise the
admin page has no bundle to load.

## Start / stop WordPress

```bash
npm run env:start    # boots WordPress on Docker (first run downloads images)
npm run env:stop     # stops the containers
npm run env:clean    # wipes the environment (fresh database)
```

After `env:start`:

- Site:  <http://localhost:8888>
- Admin: <http://localhost:8888/wp-admin> — user `admin`, password `password`

## Activate the plugin

Via the wp-admin **Plugins** screen, or from the CLI:

```bash
npx wp-env run cli wp plugin activate easeaccess24-accessibility
```

Then open the **EaseAccess24** menu item in wp-admin — you should see the React
placeholder screen ("EaseAccess24 Accessibility").

## Live development

Run the watch build in a second terminal so JS/CSS changes recompile on save:

```bash
npm run start        # wp-scripts watch mode
```

Reload the wp-admin page to see changes. PHP changes take effect immediately (no
rebuild needed).

## Useful commands

```bash
npx wp-env run cli wp --info                 # WordPress/PHP versions in the container
npx wp-env run cli wp plugin list            # list installed plugins
npx wp-env logs                              # tail container logs
```

## Why wp-env (not docker-compose)?

wp-env is the official WordPress tooling, needs no hand-written compose file, and
requires no local PHP/Composer. If a future need arises that wp-env can't cover,
a `docker-compose.yml` can be added alongside this file as a documented fallback.
