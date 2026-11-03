const { faqSchema, serviceSchema, locationSchema } = require('./src/_lib/structured-data.cjs');
const { forint } = require('./src/_lib/format.cjs');

module.exports = function (eleventyConfig) {
  eleventyConfig.addGlobalData('isLocalPreview', process.env.ELEVENTY_RUN_MODE === 'serve');
  eleventyConfig.addPassthroughCopy('src/assets');
  eleventyConfig.addPassthroughCopy('src/favicon.ico');
  eleventyConfig.addWatchTarget('src/assets/css');
  eleventyConfig.addWatchTarget('src/assets/js');
  eleventyConfig.addFilter('json', (value) => JSON.stringify(value));
  eleventyConfig.addFilter('forint', forint);
  eleventyConfig.addFilter('faqSchema', faqSchema);
  eleventyConfig.addFilter('serviceSchema', serviceSchema);
  eleventyConfig.addFilter('locationSchema', locationSchema);
  eleventyConfig.addFilter('serviceById', (services, id) =>
    Object.values(services).find((service) => service.id === id),
  );
  eleventyConfig.setQuietMode(true);

  return {
    dir: {
      input: 'src',
      output: 'public',
      includes: '_includes',
    },
  };
};
