module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/favicon.ico");
  eleventyConfig.addWatchTarget("src/assets/css");
  eleventyConfig.addWatchTarget("src/assets/js");
  eleventyConfig.addFilter("json", (value) => JSON.stringify(value));
  eleventyConfig.setQuietMode(true);

  return {
    dir: {
      input: "src",
      output: "public",
      includes: "_includes"
    }
  };
};
