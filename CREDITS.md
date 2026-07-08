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
  selector, are from **flag-icons** by Panayiotis Lipiridis.
  - Source: https://github.com/lipis/flag-icons
  - Version: **7.5.0** (npm `flag-icons@7.5.0`), pinned for reproducibility.
  - License: **MIT** (GPL-compatible).

Each file is sourced verbatim from flag-icons' `flags/1x1/` (viewBox
`0 0 512 512`) or `flags/4x3/` (viewBox `0 0 640 480`) directory. The filenames
follow this project's language codes, so a few are mapped to the corresponding
flag-icons name — e.g. `ar` → `arab`, `ca` → `es-ct` (the Catalonia *senyera*,
for Catalan), `cs` → `cz`, `da` → `dk`, `el` → `gr`, `et` → `ee`, `fa` → `ir`,
`ga` → `ie`, `sl` → `si`; all others use the flag-icons code directly.

### flag-icons license (MIT)

```
The MIT License (MIT)

Copyright (c) 2013 Panayiotis Lipiridis

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
