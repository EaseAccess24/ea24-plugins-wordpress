/**
 * Tests for the download helper: it builds a Blob, clicks a transient anchor with
 * the right filename, and revokes the object URL.
 */
import { downloadFile } from '../../src/utils/download';

describe( 'downloadFile', () => {
	let clickSpy;
	let createdAnchor;
	const originalCreateElement = document.createElement.bind( document );

	beforeEach( () => {
		window.URL.createObjectURL = jest.fn( () => 'blob:mock' );
		window.URL.revokeObjectURL = jest.fn();

		clickSpy = jest.fn();
		jest.spyOn( document, 'createElement' ).mockImplementation( ( tag ) => {
			const el = originalCreateElement( tag );
			if ( tag === 'a' ) {
				el.click = clickSpy;
				createdAnchor = el;
			}
			return el;
		} );
	} );

	afterEach( () => {
		jest.restoreAllMocks();
	} );

	it( 'triggers a download with the given filename and revokes the URL', () => {
		jest.useFakeTimers();

		const ok = downloadFile( 'report.txt', 'text/plain', 'contents' );

		expect( ok ).toBe( true );
		expect( window.URL.createObjectURL ).toHaveBeenCalledTimes( 1 );
		expect( createdAnchor.download ).toBe( 'report.txt' );
		expect( clickSpy ).toHaveBeenCalledTimes( 1 );

		jest.runOnlyPendingTimers();
		expect( window.URL.revokeObjectURL ).toHaveBeenCalledWith(
			'blob:mock'
		);

		jest.useRealTimers();
	} );
} );
