/**
 * Admin app entry point. Mounts the React tree onto the container printed by
 * includes/class-admin.php. React itself is provided by WordPress (wp-element),
 * so no second copy is bundled.
 */
import { createRoot } from '@wordpress/element';
import App from './App';
import './admin.css';

const container = document.getElementById( 'easeaccess24-admin-root' );

if ( container ) {
	createRoot( container ).render( <App /> );
}
