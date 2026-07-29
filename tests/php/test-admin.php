<?php
/**
 * Tests for the admin screen's bootstrap data.
 *
 * @package EaseAccess24\Accessibility
 */

namespace EaseAccess24\Accessibility;

use WP_UnitTestCase;

/**
 * @covers \EaseAccess24\Accessibility\Admin
 */
class Test_Admin extends WP_UnitTestCase {

	/**
	 * The Support screen's compatibility facts must come from the plugin header,
	 * not from a copy kept somewhere else.
	 *
	 * This is guarded because the copy DID drift: the React screen hardcoded
	 * "6.0 and above" and kept showing it after the header's floor was raised to
	 * 6.3, so the plugin advertised support it no longer claimed. Comparing
	 * against a freshly parsed header keeps the two locked together.
	 */
	public function test_plugin_info_matches_the_plugin_header() {
		$expected = get_file_data(
			EASEACCESS24_FILE,
			array(
				'requiresWp'  => 'Requires at least',
				'requiresPhp' => 'Requires PHP',
				'testedUpTo'  => 'Tested up to',
			)
		);

		$info = Admin::plugin_info();

		$this->assertSame( $expected['requiresWp'], $info['requiresWp'] );
		$this->assertSame( $expected['requiresPhp'], $info['requiresPhp'] );
		$this->assertSame( $expected['testedUpTo'], $info['testedUpTo'] );

		// A parse failure would hand the UI empty strings, which renders as "—"
		// and looks like a broken screen rather than a stale number.
		$this->assertNotSame( '', $info['requiresWp'] );
		$this->assertNotSame( '', $info['requiresPhp'] );
		$this->assertNotSame( '', $info['testedUpTo'] );
	}
}
