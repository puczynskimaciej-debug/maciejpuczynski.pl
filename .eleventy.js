const markdownIt = require("markdown-it");

module.exports = function (eleventyConfig) {
  const markdown = markdownIt({ html: false, linkify: true, typographer: true });

  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "logo.png": "assets/images/brand/mp-logo.png" });
  eleventyConfig.addPassthroughCopy({ "admin-app": "admin" });
  eleventyConfig.addPassthroughCopy({ "src/_redirects": "_redirects" });
  eleventyConfig.addFilter("renderMarkdown", (value) => markdown.render(value || ""));
  eleventyConfig.addFilter("sortByOrder", (items) =>
    [...(items || [])].sort((a, b) => Number(a.data.order || 999) - Number(b.data.order || 999))
  );
  eleventyConfig.addFilter("featured", (items) =>
    [...(items || [])]
      .filter((item) => item.data.featured && item.data.published !== false)
      .sort((a, b) => Number(a.data.order || 999) - Number(b.data.order || 999))
  );
  eleventyConfig.addFilter("limit", (items, amount) => (items || []).slice(0, amount));
  eleventyConfig.addFilter("json", (value) => JSON.stringify(value));
  eleventyConfig.addShortcode("year", () => String(new Date().getFullYear()));
  eleventyConfig.addCollection("projects", (collectionApi) =>
    collectionApi.getFilteredByGlob("src/content/projects/*.md")
      .filter((item) => item.data.published !== false)
      .sort((a, b) => Number(a.data.order || 999) - Number(b.data.order || 999))
  );

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data"
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk"
  };
};
