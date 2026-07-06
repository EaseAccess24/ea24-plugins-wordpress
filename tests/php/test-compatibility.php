<?php
/**
 * Tests for cache/optimizer detection. Detection reads local plugin state only
 * (the active_plugins option), never a remote source.
 *
 * @package EaseAccess24\Accessibility
 */

namespace EaseAccess24\Accessibility;

use WP_UnitTestCase;

/**
 * @covers \EaseAccess24\Accessibility\Compatibility
 */
class Test_Compatibility extends WP_UnitTestCase {

	/**
	 * Start each test with no active plugins recorded.
	 */
	public function set_up() {
		parent::set_up();
		update_option( 'active_plugins', array() );
	}

	/**
	 * Clean up the active_plugins override.
	 */
	public function tear_down() {
		update_option( 'active_plugins', array() );
		parent::tear_down();
	}

	/**
	 * With none of the known plugins active, detect() returns an empty list.
	 */
	public function test_detect_returns_empty_when_none_active() {
		update_option( 'active_plugins', array( 'some-other/plugin.php' ) );

		$this->assertSame( array(), Compatibility::detect() );
	}

	/**
	 * Active known plugins are detected and reported with slug + name.
	 */
	public function test_detect_reports_active_known_plugins() {
		update_option(
			'active_plugins',
			array(
				'wp-rocket/wp-rocket.php',
				'autoptimize/autoptimize.php',
				'some-other/plugin.php',
			)
		);

		$detected = Compatibility::detect();
		$slugs    = wp_list_pluck( $detected, 'slug' );

		$this->assertContains( 'wp-rocket', $slugs );
		$this->assertContains( 'autoptimize', $slugs );
		$this->assertNotContains( 'litespeed', $slugs );

		// Each entry carries a display name.
		foreach ( $detected as $plugin ) {
			$this->assertArrayHasKey( 'name', $plugin );
			$this->assertNotEmpty( $plugin['name'] );
		}
	}

	/**
	 * All six compatibility targets are covered by the known-plugins map.
	 */
	public function test_known_plugins_cover_all_targets() {
		$slugs = array_keys( Compatibility::known_plugins() );

		foreach ( array( 'wp-rocket', 'litespeed', 'autoptimize', 'perfmatters', 'asset-cleanup', 'cloudflare' ) as $slug ) {
			$this->assertContains( $slug, $slugs );
		}
	}
}
