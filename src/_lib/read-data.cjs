const fs = require('node:fs');
const path = require('node:path');

// Read on each data-function call so watch builds do not reuse cached JSON imports.
module.exports = (filename) => JSON.parse(
  fs.readFileSync(path.join(__dirname, '../_data', filename), 'utf8'),
);
