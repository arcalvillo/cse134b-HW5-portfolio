export default function (eleventyConfig) {
  // Eleventy only processes templates. Everything below is copied through as-is.
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/media");
  eleventyConfig.addPassthroughCopy("src/resume.pdf");

  // Used by sitemap.njk to stamp <lastmod> in the format the spec wants.
  eleventyConfig.addFilter("isoDate", (value) => new Date(value).toISOString());

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data"
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk"
  };
}
