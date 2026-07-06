/**
 * Language → flag-asset registry for the language dropdown.
 *
 * Each flag SVG is imported with the `?url` query so webpack emits it as a
 * separate hashed file under `build/images/flags/` (see webpack.config.js) rather
 * than inlining it into the JS bundle — several of the provided flags are detailed
 * coats-of-arms and would bloat the admin bundle if inlined. The import value is
 * the public URL of the emitted file.
 *
 * The language → flag-code mapping lives in `languages-manifest.json` (the `flag`
 * field), so this file only maps a flag CODE to its bundled asset URL. `flagFor()`
 * resolves a language code through the manifest to a URL, returning `null` when no
 * flag is available so the caller can render a neutral globe fallback.
 */
import manifest from '../../languages/languages-manifest.json';

import al from '../assets/flags/al.svg?url';
import ar from '../assets/flags/ar.svg?url';
import bg from '../assets/flags/bg.svg?url';
import ca from '../assets/flags/ca.svg?url';
import cs from '../assets/flags/cs.svg?url';
import da from '../assets/flags/da.svg?url';
import de from '../assets/flags/de.svg?url';
import el from '../assets/flags/el.svg?url';
import es from '../assets/flags/es.svg?url';
import et from '../assets/flags/et.svg?url';
import fa from '../assets/flags/fa.svg?url';
import fi from '../assets/flags/fi.svg?url';
import fr from '../assets/flags/fr.svg?url';
import ga from '../assets/flags/ga.svg?url';
import gb from '../assets/flags/gb.svg?url';
import hr from '../assets/flags/hr.svg?url';
import hu from '../assets/flags/hu.svg?url';
import is from '../assets/flags/is.svg?url';
import it from '../assets/flags/it.svg?url';
import lt from '../assets/flags/lt.svg?url';
import lv from '../assets/flags/lv.svg?url';
import mk from '../assets/flags/mk.svg?url';
import mt from '../assets/flags/mt.svg?url';
import nl from '../assets/flags/nl.svg?url';
import no from '../assets/flags/no.svg?url';
import pl from '../assets/flags/pl.svg?url';
import pt from '../assets/flags/pt.svg?url';
import ro from '../assets/flags/ro.svg?url';
import rs from '../assets/flags/rs.svg?url';
import se from '../assets/flags/se.svg?url';
import sk from '../assets/flags/sk.svg?url';
import sl from '../assets/flags/sl.svg?url';
import so from '../assets/flags/so.svg?url';

const FLAG_ASSETS = {
	al,
	ar,
	bg,
	ca,
	cs,
	da,
	de,
	el,
	es,
	et,
	fa,
	fi,
	fr,
	ga,
	gb,
	hr,
	hu,
	is,
	it,
	lt,
	lv,
	mk,
	mt,
	nl,
	no,
	pl,
	pt,
	ro,
	rs,
	se,
	sk,
	sl,
	so,
};

/**
 * Resolve a language code to its flag asset URL, or `null` if none is available.
 *
 * @param {string} code Language code (e.g. `en`, `sv`, `ar`).
 * @return {string|null} Public URL of the flag SVG, or `null` for a globe fallback.
 */
export function flagFor( code ) {
	const entry = manifest.find( ( lang ) => lang.code === code );
	const flagCode = entry && entry.flag;
	return ( flagCode && FLAG_ASSETS[ flagCode ] ) || null;
}

/**
 * English name for a language code (from the manifest `enName` field), falling
 * back to the code itself if missing.
 *
 * @param {string} code Language code.
 * @return {string} English name.
 */
export function enNameFor( code ) {
	const entry = manifest.find( ( lang ) => lang.code === code );
	return ( entry && entry.enName ) || code;
}
