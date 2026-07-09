# WordPress.org assets

This directory contains plugin-directory assets for WordPress.org. The deploy
workflow uploads the contents of this directory to the plugin's "Assets" SVN
folder — they are **not** part of the plugin ZIP.

## Current files

### Icons
- `icon-128x128.png` — 128×128 px plugin icon
- `icon-256x256.png` — 256×256 px plugin icon (retina)

### Banners
- `banner-772x250.png` — 772×250 px directory header banner (required)
- `banner-1544x500.png` — 1544×500 px directory header banner (retina)

### Screenshots
Screenshots are numbered to match the `== Screenshots ==` section in `readme.txt`.

- `screenshot-1.png` — Connect your site (onboarding / paste Widget Key step)
- `screenshot-2.png` — Connection tab: connected & healthy state with Health Check results
- `screenshot-3.png` — Compatibility tab: cache & optimization plugin detection
- `screenshot-4.png` — Activity log
- `screenshot-5.png` — Support tab: plugin information, support report, data & privacy
- `screenshot-6.png` — Help & FAQ

## Naming rules

Filenames must be exact. Screenshots use a hyphen: `screenshot-1.png`, not
`screenshot_1.png`. Wrong names will not appear on the listing.

## Reference

https://developer.wordpress.org/plugins/wordpress-org/plugin-assets/