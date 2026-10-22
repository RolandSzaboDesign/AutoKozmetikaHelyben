module.exports = function (eleventyConfig) {
  eleventyConfig.addGlobalData("isLocalPreview", process.env.ELEVENTY_RUN_MODE === "serve");
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
