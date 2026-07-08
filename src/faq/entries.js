/**
 * FAQ / How-To entries.
 *
 * The entry list (stable ids) lives here; the question/answer copy lives in i18n
 * under `faq.items.<id>.{q,a}` so it can be translated. Ids must stay stable —
 * they are the join key to the copy.
 */
const FAQ_ENTRIES = [
	{ id: 'findKey' },
	{ id: 'notShowing' },
	{ id: 'cachePlugin' },
	{ id: 'stagingLocalhost' },
	{ id: 'dataPrivacy' },
	{ id: 'removeData' },
];

export default FAQ_ENTRIES;
