import { cmsConfig } from "./config.js";
import { GitHubAuth } from "./modules/auth.js";
import { GitHubApi } from "./modules/github-api.js";
import { ContentRepository, slugify } from "./modules/repository.js";
import { validateProject, assertValid } from "./modules/validation.js";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const auth = new GitHubAuth(cmsConfig.github);
const state = { api: null, repository: null, home: null, homeSha: null, site: null, siteSha: null, projects: [], media: [], editing: null, uploadTarget: null };

initialize();
async function initialize() {
  try {
    if (location.search.includes("code=")) { show("loading"); await auth.completeCallback(cmsConfig.oauthEndpoint); }
    if (!auth.token()) return show("auth");
    show("loading");
    state.api = new GitHubApi({ token: auth.token(), ...cmsConfig.github });
    const [repository, user] = await Promise.all([state.api.repository(), githubUser()]);
    if (!repository.permissions?.push) throw new Error("To konto nie ma prawa zapisu do repozytorium.");
    state.repository = new ContentRepository(state.api, cmsConfig.paths, cmsConfig.maxUploadBytes);
    $("#user").textContent = user.name || user.login;
    $("#repo").textContent = `${cmsConfig.github.owner}/${cmsConfig.github.repo} · ${cmsConfig.github.branch}`;
    await load();
    show("app");
  } catch (error) { show("auth", error.message); }
}
async function githubUser() {
  const response = await fetch("https://api.github.com/user", { headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${auth.token()}` } });
  if (!response.ok) throw new Error("Nie udało się odczytać konta GitHub.");
  return response.json();
}
async function load() {
  const [home, site, projects, media] = await Promise.all([state.repository.home(), state.repository.site(), state.repository.projects(), state.repository.media()]);
  Object.assign(state, { home: home.data, homeSha: home.sha, site: site.data, siteSha: site.sha, projects, media });
  render();
}
function show(name, error = "") {
  $("#auth-view").hidden = name !== "auth"; $("#loading-view").hidden = name !== "loading"; $("#app-view").hidden = name !== "app";
  $("#auth-error").hidden = !error; $("#auth-error").textContent = error;
}
function notify(message, error = false) {
  const box = $("#notice"); box.textContent = message; box.className = `message${error ? " error" : ""}`; box.hidden = false;
  clearTimeout(notify.timer); notify.timer = setTimeout(() => { box.hidden = true; }, 5000);
}
function render() {
  $("#project-count").textContent = state.projects.length;
  $("#featured-count").textContent = state.projects.filter((item) => item.featured).length;
  $("#media-count").textContent = state.media.length;
  fillForm($("#home-form"), state.home); fillForm($("#site-form"), state.site); renderSeo(); renderProjects(); renderMedia();
}
function fillForm(form, data) {
  $$("[name]", form).forEach((field) => {
    const value = field.name.split(".").reduce((object, key) => object?.[key], data);
    if (field.type === "checkbox") field.checked = Boolean(value); else if (value !== undefined) field.value = value;
  });
}
function setPath(object, path, value) {
  const keys = path.split("."); const last = keys.pop(); const target = keys.reduce((current, key) => current[key] ||= {}, object); target[last] = value;
}
function updateFromForm(form, data) {
  $$("[name]", form).forEach((field) => setPath(data, field.name, field.type === "checkbox" ? field.checked : field.value.trim()));
}
function renderSeo() {
  $("#seo-fields").innerHTML = ["home", "projects", "contact"].map((key) => {
    const labels = { home: "Strona główna", projects: "Moje projekty", contact: "Kontakt" };
    return `<section class="seo-block"><h3>${labels[key]}</h3><div class="form-grid"><label>Meta title<input name="seo.${key}.title" value="${escapeHtml(state.site.seo[key].title || "")}" required></label><label>Canonical URL<input name="seo.${key}.canonical" value="${escapeHtml(state.site.seo[key].canonical || "")}"></label><label class="wide">Meta description<textarea name="seo.${key}.description" required>${escapeHtml(state.site.seo[key].description || "")}</textarea></label><label class="wide">Obraz Open Graph<div class="inline-input"><input name="seo.${key}.ogImage" value="${escapeHtml(state.site.seo[key].ogImage || "")}"><button type="button" data-upload-for="seo.${key}.ogImage">Wgraj</button></div></label></div></section>`;
  }).join("");
}
function renderProjects() {
  $("#projects-list").innerHTML = state.projects.length ? state.projects.map((project) => `<div class="table-row"><div><h3>${escapeHtml(project.title)}</h3><p>${escapeHtml(project.category)} · kolejność ${project.order}${project.featured ? " · wyróżniony" : ""}${project.inProgress ? " · w trakcie" : ""}</p></div><div class="row-actions"><button data-edit="${escapeHtml(project.originalSlug)}">Edytuj</button><button class="danger" data-delete="${escapeHtml(project.originalSlug)}">Usuń</button></div></div>`).join("") : "<p>Nie ma jeszcze projektów.</p>";
}
function renderMedia() {
  $("#media-grid").innerHTML = state.media.length ? state.media.map((file) => `<article class="media-card"><img src="${file.download_url}" alt=""><div><p title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</p><button data-delete-media="${escapeHtml(file.path)}">Usuń</button></div></article>`).join("") : '<div class="card"><p>Biblioteka jest pusta. Wgraj pierwszy obraz.</p></div>';
}
function openProject(project = null) {
  state.editing = project; const form = $("#project-form"); form.reset();
  $("#project-title").textContent = project ? "Edytuj projekt" : "Nowy projekt";
  if (project) {
    for (const name of ["title","category","summary","body","order","image","imageAlt","liveUrl","repositoryUrl"]) form.elements[name].value = project[name] ?? "";
    form.elements.technologies.value = (project.technologies || []).join(", ");
    for (const name of ["inProgress","featured","published"]) form.elements[name].checked = Boolean(project[name]);
  } else { form.elements.order.value = state.projects.length + 1; form.elements.published.checked = true; }
  $("#project-dialog").showModal();
}
async function upload(file) {
  if (!file) return;
  try {
    const result = await state.repository.upload(file);
    if (state.uploadTarget) state.uploadTarget.value = result.path;
    state.media = await state.repository.media(); renderMedia(); $("#media-count").textContent = state.media.length;
    notify("Obraz zapisany w repozytorium.");
  } catch (error) { notify(error.message, true); }
  finally { state.uploadTarget = null; $("#file-input").value = ""; }
}
async function saveBusy(button, task) {
  const label = button?.textContent; if (button) { button.disabled = true; button.textContent = "Zapisywanie…"; }
  try { await task(); } catch (error) { notify(error.message, true); }
  finally { if (button) { button.disabled = false; button.textContent = label; } }
}
$("#login").addEventListener("click", () => { try { auth.login(); } catch (error) { show("auth", error.message); } });
$("#logout").addEventListener("click", () => auth.logout());
$("#menu").addEventListener("click", () => $(".sidebar").classList.toggle("open"));
$$("[data-view]").forEach((button) => button.addEventListener("click", () => {
  $$("[data-view]").forEach((item) => item.classList.toggle("active", item === button));
  $$("[data-panel]").forEach((panel) => panel.classList.toggle("active", panel.dataset.panel === button.dataset.view));
  $(".sidebar").classList.remove("open");
}));
$("#home-form").addEventListener("submit", (event) => {
  event.preventDefault(); saveBusy(event.submitter, async () => {
    updateFromForm(event.target, state.home); const result = await state.repository.saveHome(state.home, state.homeSha);
    state.homeSha = result.content.sha; notify("Strona główna zapisana. Netlify rozpocznie publikację.");
  });
});
$("#site-form").addEventListener("submit", (event) => {
  event.preventDefault(); saveBusy(event.submitter, async () => {
    updateFromForm(event.target, state.site); const result = await state.repository.saveSite(state.site, state.siteSha);
    state.siteSha = result.content.sha; notify("Kontakt i SEO zapisane.");
  });
});
$("#project-form").addEventListener("submit", (event) => {
  event.preventDefault(); saveBusy(event.submitter, async () => {
    const form = event.target; const project = {
      title: form.title.value.trim(), slug: state.editing?.originalSlug || slugify(form.title.value),
      category: form.category.value.trim(), summary: form.summary.value.trim(), body: form.body.value.trim(),
      technologies: form.technologies.value.split(",").map((item) => item.trim()).filter(Boolean),
      order: Number(form.order.value), image: form.image.value.trim(), imageAlt: form.imageAlt.value.trim(),
      liveUrl: form.liveUrl.value.trim(), repositoryUrl: form.repositoryUrl.value.trim(),
      inProgress: form.inProgress.checked, featured: form.featured.checked, published: form.published.checked
    };
    assertValid(validateProject(project)); await state.repository.saveProject(project, state.editing);
    state.projects = await state.repository.projects(); render(); $("#project-dialog").close(); notify("Projekt zapisany.");
  });
});
$("#file-input").addEventListener("change", (event) => upload(event.target.files[0]));
document.addEventListener("click", async (event) => {
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (action === "new-project") openProject();
  if (action === "upload") { state.uploadTarget = null; $("#file-input").click(); }
  if (action === "history") {
    $("#history-list").innerHTML = "<p>Ładowanie…</p>";
    try { const history = await state.api.commits(); $("#history-list").innerHTML = history.map((commit) => `<div class="table-row"><div><h3>${escapeHtml(commit.commit.message)}</h3><p>${escapeHtml(commit.commit.author.name)} · ${new Date(commit.commit.author.date).toLocaleString("pl-PL")}</p></div><a href="${commit.html_url}" target="_blank" rel="noopener">Zobacz ↗</a></div>`).join(""); } catch (error) { notify(error.message, true); }
  }
  const uploadFor = event.target.closest("[data-upload-for]")?.dataset.uploadFor;
  if (uploadFor) {
    state.uploadTarget = uploadFor === "project.image" ? $("#project-form").image : document.querySelector(`[name="${CSS.escape(uploadFor)}"]`);
    $("#file-input").click();
  }
  const edit = event.target.closest("[data-edit]")?.dataset.edit;
  if (edit) openProject(state.projects.find((project) => project.originalSlug === edit));
  const remove = event.target.closest("[data-delete]")?.dataset.delete;
  if (remove && confirm("Usunąć ten projekt z repozytorium?")) {
    try { await state.repository.deleteProject(state.projects.find((project) => project.originalSlug === remove)); state.projects = await state.repository.projects(); render(); notify("Projekt usunięty."); } catch (error) { notify(error.message, true); }
  }
  const removeMedia = event.target.closest("[data-delete-media]")?.dataset.deleteMedia;
  if (removeMedia && confirm("Usunąć ten obraz z repozytorium?")) {
    try { await state.repository.deleteMedia(state.media.find((file) => file.path === removeMedia)); state.media = await state.repository.media(); render(); notify("Obraz usunięty."); } catch (error) { notify(error.message, true); }
  }
  if (event.target.closest("[data-close]")) event.target.closest("dialog").close();
});
function escapeHtml(value) { return String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[character])); }
