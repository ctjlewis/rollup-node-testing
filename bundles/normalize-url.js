import url from 'url';

// TODO: Use the `URL` global when targeting Node.js 10
const URLParser = typeof URL === 'undefined' ? url.URL : URL;
