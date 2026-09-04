import { parseMarkdown, stringifyMarkdown } from "./frontmatter.js";

export class ContentRepository {
  constructor(api, paths, maxUploadBytes) { this.api = api; this.paths = paths; this.maxUploadBytes = maxUploadBytes; }
  async getJson(path) { const file = await this.api.read(path); return { data: JSON.parse(file.text), sha: file.sha }; }
  saveJson(path, data, sha, label) { return this.api.writeText(path, `${JSON.stringify(data, null, 2)}\n`, `CMS: aktualizacja ${label}`, sha); }
  home() { return this.getJson(this.paths.home); }
  site() { return this.getJson(this.paths.site); }
  saveHome(data, sha) { return this.saveJson(this.paths.home, data, sha, "strony głównej"); }
  saveSite(data, sha) { return this.saveJson(this.paths.site, data, sha, "kontaktu i SEO"); }
  async projects() {
    const files = await this.api.list(this.paths.projects);
    const projects = await Promise.all(files.filter((file) => file.type === "file" && file.name.endsWith(".md")).map(async (entry) => {
      const file = await this.api.read(entry.path); const parsed = parseMarkdown(file.text);
      return { ...parsed.data, body: parsed.body, path: entry.path, sha: file.sha, originalSlug: entry.name.replace(/\.md$/, "") };
    }));
    return projects.sort((a, b) => Number(a.order || 999) - Number(b.order || 999));
  }
  async saveProject(project, original = null) {
    const slug = original?.originalSlug || slugify(project.slug || project.title);
    const path = `${this.paths.projects}/${slug}.md`;
    const data = {
      layout: "layouts/project.njk", permalink: `/projekty/${slug}/index.html`,
      title: project.title, slug, summary: project.summary, category: project.category,
      alternateUrl: `/en/projects/${slug}/`, titleEn: project.titleEn || original?.titleEn || "", summaryEn: project.summaryEn || original?.summaryEn || "", categoryEn: project.categoryEn || original?.categoryEn || "", bodyEn: project.bodyEn || original?.bodyEn || "",
      technologies: project.technologies, image: project.image, imageAlt: project.imageAlt,
      liveUrl: project.liveUrl || "", repositoryUrl: project.repositoryUrl || "",
      inProgress: Boolean(project.inProgress), featured: Boolean(project.featured),
      order: Number(project.order), published: Boolean(project.published)
    };
    return this.api.writeText(path, stringifyMarkdown(data, project.body), `CMS: ${original ? "edycja" : "dodanie"} projektu „${project.title}”`, original?.sha);
  }
  deleteProject(project) { return this.api.remove(project.path, project.sha, `CMS: usunięcie projektu „${project.title}”`); }
  async media() {
    try { return (await this.api.list(this.paths.media)).filter((file) => file.type === "file" && /\.(avif|gif|jpe?g|png|svg|webp)$/i.test(file.name)); }
    catch (error) { if (error.status === 404) return []; throw error; }
  }
  async upload(file) {
    if (file.size > this.maxUploadBytes) throw new Error(`Obraz może mieć maksymalnie ${Math.round(this.maxUploadBytes / 1024 / 1024)} MB.`);
    if (!file.type.startsWith("image/")) throw new Error("Wybrany plik nie jest obrazem.");
    const extension = file.name.match(/\.[A-Za-z0-9]+$/)?.[0].toLowerCase() || "";
    const name = `${Date.now()}-${slugify(file.name.replace(/\.[^.]+$/, ""))}${extension}`;
    const path = `${this.paths.media}/${name}`;
    await this.api.writeBinary(path, new Uint8Array(await file.arrayBuffer()), `CMS: dodanie obrazu ${name}`);
    return { path: `/${path.replace(/^src\//, "")}`, name };
  }
  deleteMedia(file) { return this.api.remove(file.path, file.sha, `CMS: usunięcie obrazu ${file.name}`); }
}
export function slugify(value) { return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 90); }
