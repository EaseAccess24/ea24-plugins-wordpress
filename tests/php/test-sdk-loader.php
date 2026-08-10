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
	 *
	 * Clearing $wp_scripts->done matters just as much: WordPress refuses to print
	 * a handle twice in one request, and that list survives between tests in the
	 * same process. Without this, any test that renders wp_head after an earlier
	 * one would silently see no SDK tag at all.
	 */
	public function set_up() {
		parent::set_up();

		$scripts = wp_scripts();

		foreach ( array( SdkLoader::SCRIPT_HANDLE, 'another-plugin' ) as $handle ) {
			wp_dequeue_script( $handle );
			wp_deregister_script( $handle );
			$scripts->done = array_values( array_diff( $scripts->done, array( $handle ) ) );
		}
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

		$this->assertFalse( wp_script_is( SdkLoader::SCRIPT_HANDLE, 'enqueued' ) );
	}

	/**
	 * With a key saved, the SDK script is enqueued in the head (no footer
	 * group) with the correct src and no version query string.
	 */
	public function test_script_enqueued_when_key_present() {
		Connection::save_widget_key( 'DEMO-WIDGET-KEY' );

		( new SdkLoader() )->register();
		do_action( 'wp_enqueue_scripts' );

		$this->assertTrue( wp_script_is( SdkLoader::SCRIPT_HANDLE, 'enqueued' ) );

		$script = wp_scripts()->registered[ SdkLoader::SCRIPT_HANDLE ];
		$this->assertSame( 'https://widget.easeaccess24.com/sdk.js?key=DEMO-WIDGET-KEY', $script->src );
		$this->assertNull( $script->ver );
		$this->assertEmpty(
			isset( $script->extra['group'] ) ? $script->extra['group'] : null,
			'SDK script should be enqueued in the head (no footer group).'
		);
	}

	/**
	 * The script is registered with core's own 'async' loading strategy rather
	 * than a hand-written async attribute.
	 */
	public function test_script_registered_with_async_strategy() {
		Connection::save_widget_key( 'DEMO-WIDGET-KEY' );

		( new SdkLoader() )->register();
		do_action( 'wp_enqueue_scripts' );

		$this->assertSame(
			'async',
			wp_scripts()->get_data( SdkLoader::SCRIPT_HANDLE, 'strategy' )
		);
	}

	/**
	 * The wp_script_attributes filter adds the cache/optimizer hints to our own
	 * tag, keyed on the id WordPress renders for our handle.
	 */
	public function test_attributes_filter_adds_optimizer_hints() {
		$attributes = ( new SdkLoader() )->filter_script_attributes(
			array(
				'src' => 'https://widget.easeaccess24.com/sdk.js?key=DEMO-WIDGET-KEY',
				'id'  => SdkLoader::SCRIPT_ID,
			)
		);

		$this->assertSame( 'false', $attributes['data-cfasync'] );
		$this->assertSame( '1', $attributes['data-no-optimize'] );
		$this->assertSame( '1', $attributes['data-no-defer'] );
		$this->assertSame( '1', $attributes['data-no-minify'] );

		// Core's own attributes must survive untouched.
		$this->assertSame( SdkLoader::SCRIPT_ID, $attributes['id'] );
		$this->assertSame( 'https://widget.easeaccess24.com/sdk.js?key=DEMO-WIDGET-KEY', $attributes['src'] );
	}

	/**
	 * WordPress runs wp_script_attributes for EVERY script it renders and passes
	 * no handle, so the id guard is the only thing keeping our hints off other
	 * people's scripts. That guard is load-bearing; prove it two ways.
	 *
	 * The example.com URL and "another-plugin" id below are fabricated stand-ins
	 * for some other plugin's script. They exist only inside this test and are
	 * never output on a real page — example.com is the IANA-reserved domain kept
	 * for placeholders exactly like this.
	 */
	public function test_attributes_filter_ignores_other_scripts() {
		$loader = new SdkLoader();

		$foreign = array(
			'src' => 'https://example.com/another-plugin.js',
			'id'  => 'another-plugin-js',
		);

		$this->assertSame( $foreign, $loader->filter_script_attributes( $foreign ) );

		// A tag with no id at all must also pass through untouched.
		$id_less = array( 'src' => 'https://example.com/another-plugin.js' );

		$this->assertSame( $id_less, $loader->filter_script_attributes( $id_less ) );
	}

	/**
	 * A real front-end request enqueues and prints exactly one async SDK tag
	 * with the correct id, src and attributes.
	 *
	 * Assertions are deliberately per-attribute rather than one exact-match on
	 * the whole tag: WordPress owns the markup now, and core may legitimately add
	 * attributes of its own (data-wp-strategy, fetchpriority) or change their
	 * order without that being a regression on our side.
	 */
	public function test_wp_head_action_emits_expected_tag() {
		Connection::save_widget_key( 'DEMO-HEAD-KEY' );

		( new SdkLoader() )->register();
		do_action( 'wp_enqueue_scripts' );

		ob_start();
		do_action( 'wp_head' );
		$output = (string) ob_get_clean();

		$this->assertSame(
			1,
			substr_count( $output, 'id="' . SdkLoader::SCRIPT_ID . '"' ),
			'Exactly one SDK tag expected.'
		);
		$this->assertStringContainsString( 'src="https://widget.easeaccess24.com/sdk.js?key=DEMO-HEAD-KEY"', $output );
		$this->assertStringContainsString( ' async', $output );
		$this->assertStringContainsString( 'data-cfasync="false"', $output );
		$this->assertStringContainsString( 'data-no-optimize="1"', $output );
		$this->assertStringContainsString( 'data-no-defer="1"', $output );
		$this->assertStringContainsString( 'data-no-minify="1"', $output );
	}

	/**
	 * The optimizer hints land on OUR tag only. Rendered end-to-end through
	 * wp_head with a second, unrelated script also enqueued — the integration
	 * counterpart to test_attributes_filter_ignores_other_scripts().
	 */
	public function test_wp_head_leaves_other_scripts_unhinted() {
		Connection::save_widget_key( 'DEMO-HEAD-KEY' );

		( new SdkLoader() )->register();
		wp_enqueue_script( 'another-plugin', 'https://example.com/another-plugin.js', array(), '1.0.0', false );
		do_action( 'wp_enqueue_scripts' );

		ob_start();
		do_action( 'wp_head' );
		$output = (string) ob_get_clean();

		$this->assertStringContainsString( 'another-plugin.js', $output, 'The other script should still print.' );
		$this->assertSame(
			1,
			substr_count( $output, 'data-cfasync="false"' ),
			'Only the SDK tag may carry the optimizer hints.'
		);
	}
}
