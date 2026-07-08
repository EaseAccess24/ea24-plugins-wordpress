# Credits & Third-Party Licenses

EaseAccess24 Accessibility is licensed under the GPL-2.0-or-later. The bundled
assets below are redistributed with the plugin; each is (or must be confirmed to
be) GPL-compatible.

## Fonts

Both fonts are licensed under the **SIL Open Font License, Version 1.1** (OFL-1.1),
which is GPL-compatible.

- **Inter** — © The Inter Project Authors. SIL OFL 1.1.
  Bundled: `src/fonts/inter-400.woff2`, `inter-500.woff2`, `inter-600.woff2`,
  `inter-700.woff2`, `inter-800.woff2` (compiled into `build/fonts/`).
  Upstream: https://github.com/rsms/inter
- **JetBrains Mono** — © 2020 The JetBrains Mono Project Authors. SIL OFL 1.1.
  Bundled: `src/fonts/jetbrains-mono-400.woff2`, `jetbrains-mono-500.woff2`
  (compiled into `build/fonts/`).
  Upstream: https://github.com/JetBrains/JetBrainsMono

## Brand assets (first-party)

- **EaseAccess24 logo / icon** (`src/assets/EA24_Icon_Logo.png`,
  `EA24_Full_Logo.png`, and the eye/wordmark SVGs) are the original work of
  EaseAccess24, distributed as part of this GPL-licensed plugin. All rights to
  the EaseAccess24 name and marks are reserved by EaseAccess24.

## Country / language flags

- **Flag SVGs** in `src/assets/flags/*.svg` (compiled into
  `build/images/flags/`), used purely as decorative icons in the language
  selector.

> **TODO — flag license unverified.** The source and license of these flag SVGs
> could **not** be confirmed from the repository:
> - No flag-icon npm package (e.g. `flag-icons`, `flagpack`, `circle-flags`) is a
>   dependency — the files were added directly to the tree.
> - All provenance metadata (comments, `<title>`, `<metadata>`, editor
>   signatures) has been stripped from the SVGs.
> - The markup resembles the MIT-licensed `flag-icons` (lipis) set, but this is
>   **not** verifiable, and the files mix two viewBox conventions
>   (`0 0 512 512` and `0 0 640 480`), which suggests they may have been
>   assembled from more than one source.
>
> **Action required before release:** confirm the actual origin and license of
> the flag SVGs and record it here (most public flag sets are MIT or public
> domain, both GPL-compatible — but this must be verified, not assumed). If the
> license cannot be established, replace the flags with a set whose license is
> known.
