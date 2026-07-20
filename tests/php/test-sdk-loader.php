<?php
/**
 * Tests for the SDK loader: enqueued script, correct URL, correct rendered tag.
 *
 * @package EaseAccess24\Accessibility
 */

namespace EaseAccess24\Accessibility;

use EaseAccess24\Accessibility\Tests\TestCase;

/**
 * @covers \EaseAccess24\Accessibility\SdkLoader
 */
class Test_SdkLoader extends TestCase {

	/**
	 * Start every test with the SDK handle fully clean.
	 *
	 * The plugin's real Plugin instance (loaded once for the whole process via
	 * tests/php/bootstrap.php's muplugins_loaded hook) keeps its own SdkLoader
	 * permanently registered on wp_enqueue_scripts, so any other test file that
	 * saves a Widget Key and fires wp_enqueue_scripts (e.g. Test_HealthCheck)
	 * would otherwise leave this handle sitting in the shared $wp_scripts queue.
	 */
	public function set_up() {
		parent::set_up();
		wp_dequeue_script( SdkLoader::SCRIPT_ID );
		wp_deregister_script( SdkLoader::SCRIPT_ID );
	}

	/**
	 * The URL helper builds the canonical SDK URL and is empty without a key.
	 */
	public function test_url_for_builds_encoded_url() {
		$this->assertSame( '', SdkLoader::url_for( '' ) );
		$this->assertSame(
			'https://widget.easeaccess24.com/sdk.js?key=DEMO-WIDGET-KEY',
			SdkLoader::url_for( 'DEMO-WIDGET-KEY' )
		);
	}

	/**
	 * No key stored means the SDK script is never enqueued.
	 */
	public function test_script_not_enqueued_when_key_absent() {
		( new SdkLoader() )->register();
		do_action( 'wp_enqueue_scripts' );

		$this->assertFalse( wp_script_is( SdkLoader::SCRIPT_ID, 'enqueued' ) );
	}

	/**
	 * With a key saved, the SDK script is enqueued in the head (no footer
	 * group) with the correct src and no version query string.
	 */
	public function test_script_enqueued_when_key_present() {
		Connection::save_widget_key( 'DEMO-WIDGET-KEY' );

		( new SdkLoader() )->register();
		do_action( 'wp_enqueue_scripts' );

		$this->assertTrue( wp_script_is( SdkLoader::SCRIPT_ID, 'enqueued' ) );

		$script = wp_scripts()->registered[ SdkLoader::SCRIPT_ID ];
		$this->assertSame( 'https://widget.easeaccess24.com/sdk.js?key=DEMO-WIDGET-KEY', $script->src );
		$this->assertNull( $script->ver );
		$this->assertEmpty(
			isset( $script->extra['group'] ) ? $script->extra['group'] : null,
			'SDK script should be enqueued in the head (no footer group).'
		);
	}

	/**
	 * The script_loader_tag filter rebuilds the exact expected markup for our
	 * handle: the plain id (no WordPress "-js" suffix), async, and all four
	 * cache/optimizer data-* attributes.
	 */
	public function test_filter_rebuilds_expected_tag_markup() {
		Connection::save_widget_key( 'DEMO-WIDGET-KEY' );

		$loader    = new SdkLoader();
		$stock_tag = "<script src='https://widget.easeaccess24.com/sdk.js?key=DEMO-WIDGET-KEY' id='" . SdkLoader::SCRIPT_ID . "-js'></script>\n";

		$tag = $loader->filter_script_tag( $stock_tag, SdkLoader::SCRIPT_ID );

		$this->assertSame(
			'<script id="easeaccess24-sdk" async src="https://widget.easeaccess24.com/sdk.js?key=DEMO-WIDGET-KEY" data-cfasync="false" data-no-optimize="1" data-no-defer="1" data-no-minify="1"></script>' . "\n",
			$tag
		);
	}

	/**
	 * The filter leaves other handles' tags untouched.
	 */
	public function test_filter_ignores_other_handles() {
		$loader = new SdkLoader();

		// A fabricated script tag belonging to some OTHER plugin. These values
		// (the example.com URL, the "another-plugin" handle/id) exist only inside
		// this test and are never output on a real page — example.com is the
		// IANA-reserved domain used precisely for placeholders like this. The
		// test proves our script_loader_tag filter leaves tags that are not ours
		// completely untouched.
		$other_plugin_tag = "<script src='https://example.com/another-plugin.js' id='another-plugin-js'></script>\n";

		$this->assertSame( $other_plugin_tag, $loader->filter_script_tag( $other_plugin_tag, 'another-plugin' ) );
	}

	/**
	 * A real front-end request enqueues and prints exactly one async SDK tag
	 * with the correct id, src and attributes.
	 */
	public function test_wp_head_action_emits_expected_tag() {
		Connection::save_widget_key( 'DEMO-HEAD-KEY' );

		( new SdkLoader() )->register();
		do_action( 'wp_enqueue_scripts' );

		ob_start();
		do_action( 'wp_head' );
		$output = (string) ob_get_clean();

		$this->assertSame( 1, substr_count( $output, 'id="easeaccess24-sdk"' ), 'Exactly one SDK tag expected.' );
		$this->assertStringContainsString( 'src="https://widget.easeaccess24.com/sdk.js?key=DEMO-HEAD-KEY"', $output );
		$this->assertStringContainsString( ' async', $output );
		$this->assertStringContainsString( 'data-cfasync="false"', $output );
		$this->assertStringContainsString( 'data-no-optimize="1"', $output );
		$this->assertStringContainsString( 'data-no-defer="1"', $output );
		$this->assertStringContainsString( 'data-no-minify="1"', $output );
	}
}
