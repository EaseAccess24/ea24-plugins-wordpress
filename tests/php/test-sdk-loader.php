<?php
/**
 * Tests for the SDK loader: single async tag with the correct URL.
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
	 * The URL helper builds the canonical SDK URL and is empty without a key.
	 */
	public function test_url_for_builds_encoded_url() {
		$this->assertSame( '', SdkLoader::url_for( '' ) );
		$this->assertSame(
			'https://widget.easeaccess24.com/sdk.js?key=ABC123',
			SdkLoader::url_for( 'ABC123' )
		);
	}

	/**
	 * Capture the loader's output for the current stored connection.
	 *
	 * Uses a fresh instance so each scenario has its own once-guard state.
	 *
	 * @return string
	 */
	private function render() {
		$loader = new SdkLoader();

		ob_start();
		$loader->print_sdk_script();

		return (string) ob_get_clean();
	}

	/**
	 * With a key saved, exactly one async SDK tag with the correct URL prints.
	 */
	public function test_injects_single_async_script_with_correct_url() {
		Connection::save_widget_key( 'ABC123' );

		$output = $this->render();

		$this->assertSame( 1, substr_count( $output, 'id="easeaccess24-sdk"' ), 'Exactly one SDK tag expected.' );
		$this->assertStringContainsString( 'src="https://widget.easeaccess24.com/sdk.js?key=ABC123"', $output );
		$this->assertStringContainsString( ' async', $output );
	}

	/**
	 * No key stored means no SDK tag is printed.
	 */
	public function test_no_script_when_key_absent() {
		$output = $this->render();

		$this->assertStringNotContainsString( 'easeaccess24-sdk', $output );
	}

	/**
	 * The once-guard prevents a second print within the same request.
	 */
	public function test_prints_at_most_once_per_instance() {
		Connection::save_widget_key( 'ABC123' );

		$loader = new SdkLoader();

		ob_start();
		$loader->print_sdk_script();
		$loader->print_sdk_script();
		$output = (string) ob_get_clean();

		$this->assertSame( 1, substr_count( $output, 'id="easeaccess24-sdk"' ) );
	}

	/**
	 * The loader is actually wired to wp_head so a real request emits the tag.
	 */
	public function test_wp_head_action_emits_tag() {
		Connection::save_widget_key( 'HEADKEY' );

		ob_start();
		do_action( 'wp_head' );
		$output = (string) ob_get_clean();

		$this->assertStringContainsString( 'sdk.js?key=HEADKEY', $output );
	}
}
