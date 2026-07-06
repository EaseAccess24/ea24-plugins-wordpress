=== EaseAccess24 Accessibility ===
Contributors: easeaccess24
Tags: accessibility, a11y, wcag, widget, ada
Requires at least: 6.0
Tested up to: 7.0
Requires PHP: 7.4
Stable tag: 0.1.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Connect your WordPress site to the EaseAccess24 accessibility platform: paste your Widget Key, inject the widget, and run an on-demand health check.

== Description ==

EaseAccess24 Accessibility is the official WordPress plugin for the EaseAccess24
accessibility platform. It is a thin integration layer: you paste the Widget Key
you get from your EaseAccess24 dashboard, and the plugin loads the EaseAccess24
widget on your site.

The plugin does not validate keys, domains, or subscriptions itself — that
happens in the widget and on the EaseAccess24 platform when the widget loads.

**What the plugin does**

* Captures your Widget Key (or extracts it from a pasted script snippet).
* Injects a single external widget script into the page `<head>`, loaded
  asynchronously.
* Runs an on-demand, client-side health check that observes the page and
  explains any problem in plain language.

**Privacy**

Diagnostic logs stay on your site. The plugin sends no telemetry and makes no
automatic remote calls to EaseAccess24. A Support Report is generated and shared
only when you explicitly choose to, and you see a preview of exactly what it
contains first.

See the **External services** section below for a full disclosure of what loads
from EaseAccess24 and when.

== External services ==

This plugin relies on the EaseAccess24 accessibility platform, a third-party
service that requires an EaseAccess24 account, an active subscription, and a
domain authorized in your EaseAccess24 dashboard. The plugin interacts with it in
exactly two ways:

1. **Loading the widget (front end).** On every page view, the plugin outputs one
   `<script>` tag that loads the widget SDK from
   `https://widget.easeaccess24.com/sdk.js?key=YOUR_WIDGET_KEY`. The visitor's
   browser fetches that script, and the widget then communicates with the
   EaseAccess24 platform to render and operate. The Widget Key is a public
   identifier, not a secret.

2. **Health-check reachability test (admin only, on demand).** When you click
   "Run Health Check" in wp-admin, the plugin's browser-side probe makes a single
   best-effort request to the same SDK URL to check that it is reachable. This
   runs only when you trigger it — never on a normal page view.

The plugin makes no other remote calls and transmits no data on its own.

* EaseAccess24 website and terms: https://easeaccess24.com/
* Privacy information: https://easeaccess24.com/privacy/

== Installation ==

1. Install and activate the plugin.
2. Open the **EaseAccess24** menu in wp-admin.
3. Paste your Widget Key (from your EaseAccess24 dashboard) and save.
4. Run the on-demand Health Check to confirm the widget loads on your live domain.

== Frequently Asked Questions ==

= Do I need an EaseAccess24 account? =

Yes. The widget requires a Widget Key from an EaseAccess24 account with an active
subscription and an authorized domain. Visit https://easeaccess24.com/ to get
started.

= The Health Check says the widget did not load on my local or staging site. Is that a bug? =

No. The widget only renders on a domain authorized in EaseAccess24, so it will
not appear on localhost or an unauthorized staging site. The Health Check reports
this as an informational result. Test on your live, authorized domain.

= Does the plugin send any of my data to EaseAccess24? =

Not automatically. Logs stay on your site. A Support Report is shared only when
you explicitly generate and send one, after previewing its contents. See the
External services section for the two front-end/admin interactions with the
platform.

== Screenshots ==

1. Connect screen — paste your Widget Key or a full script snippet.
2. Connected dashboard with the on-demand Health Check.
3. Health Check results: plain-language diagnostics and a transparency checklist.
4. Activity log and user-initiated Support Report with preview.

== Changelog ==

= 0.1.0 =
* Initial release.
* Widget Key input with extraction from a pasted script snippet.
* Single async SDK `<script>` injection into `<head>`.
* On-demand, client-side Health Check with plain-language diagnostics, reason
  codes, and a transparency checklist.
* Duplicate-widget and cache/optimizer interference detection.
* Local event log and user-initiated Support Report with preview.
* In-plugin How-To / FAQ.
* Internationalization (English and Swedish at launch).
* Lifecycle handling: staging/localhost detection, and opt-in data removal on
  uninstall.
