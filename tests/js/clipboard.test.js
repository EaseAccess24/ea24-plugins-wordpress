/**
 * Tests for the clipboard helper: success, failure, and unavailable API.
 */
import { copyToClipboard } from '../../src/utils/clipboard';

describe( 'copyToClipboard', () => {
	const originalClipboard = window.navigator.clipboard;

	afterEach( () => {
		Object.defineProperty( window.navigator, 'clipboard', {
			value: originalClipboard,
			configurable: true,
		} );
	} );

	function setClipboard( value ) {
		Object.defineProperty( window.navigator, 'clipboard', {
			value,
			configurable: true,
		} );
	}

	it( 'returns true and writes the text on success', async () => {
		const writeText = jest.fn().mockResolvedValue( undefined );
		setClipboard( { writeText } );

		const ok = await copyToClipboard( 'hello' );

		expect( ok ).toBe( true );
		expect( writeText ).toHaveBeenCalledWith( 'hello' );
	} );

	it( 'returns false when the write rejects', async () => {
		setClipboard( {
			writeText: jest.fn().mockRejectedValue( new Error( 'denied' ) ),
		} );

		expect( await copyToClipboard( 'x' ) ).toBe( false );
	} );

	it( 'returns false when the Clipboard API is unavailable', async () => {
		setClipboard( undefined );

		expect( await copyToClipboard( 'x' ) ).toBe( false );
	} );
} );
