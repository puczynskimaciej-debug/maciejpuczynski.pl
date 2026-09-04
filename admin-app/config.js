export const cmsConfig = Object.freeze({
  projectName: "Maciej Puczyński",
  github: {
    owner: "puczynskimaciej-debug",
    repo: "maciejpuczynski.pl",
    branch: "main",
    clientId: "Ov23liYACzocwsSYy3zp",
    scope: "public_repo"
  },
  paths: {
    projects: "src/content/projects",
    home: "src/_data/home.json",
    site: "src/_data/site.json",
    media: "src/assets/images/uploads"
  },
  oauthEndpoint: "/.netlify/functions/oauth",
  maxUploadBytes: 5 * 1024 * 1024
});
