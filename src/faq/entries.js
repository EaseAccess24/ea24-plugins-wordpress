/**
 * FAQ / How-To entries.
 *
 * The entry list (stable ids + optional external "Learn more" links) lives here;
 * the question/answer copy lives in i18n under `faq.items.<id>.{q,a}` so it can
 * be translated. Ids must stay stable — they are the join key to the copy.
 *
 * TODO: replace the placeholder doc URLs with the real platform docs links once
 * they are available.
 */
const DOCS_BASE = 'https://app.easeaccess24.com/docs';

const FAQ_ENTRIES = [
	{ id: 'findKey', learnMoreUrl: `${ DOCS_BASE }/widget-key` },
	{ id: 'notShowing', learnMoreUrl: `${ DOCS_BASE }/troubleshooting` },
	{ id: 'cachePlugin', learnMoreUrl: `${ DOCS_BASE }/caching` },
	{ id: 'stagingLocalhost', learnMoreUrl: `${ DOCS_BASE }/environments` },
	{ id: 'dataPrivacy', learnMoreUrl: null },
	{ id: 'removeData', learnMoreUrl: null },
];

export default FAQ_ENTRIES;
