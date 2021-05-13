//https://github.com/martinroob/ngx-i18nsupport/issues/144#issuecomment-801019865
const xliffmerge = require('@ngx-i18nsupport/ngx-i18nsupport/src/xliffmerge/xliff-merge');
xliffmerge.XliffMerge.main([process.argv[0], ...process.argv.slice(2)]);
