export function validateProject(project) {
  const errors = [];
  if (!project.title?.trim()) errors.push("Tytuł jest wymagany.");
  if (!project.summary?.trim()) errors.push("Krótki opis jest wymagany.");
  if (!project.category?.trim()) errors.push("Kategoria jest wymagana.");
  if (!project.image?.trim()) errors.push("Obraz projektu jest wymagany.");
  if (!project.imageAlt?.trim()) errors.push("Tekst alternatywny obrazu jest wymagany.");
  if (!Number.isFinite(Number(project.order)) || Number(project.order) < 1) errors.push("Kolejność musi być liczbą większą od zera.");
  for (const [label, value] of [["Link strony", project.liveUrl], ["Link repozytorium", project.repositoryUrl]]) {
    if (value && !isHttpUrl(value)) errors.push(`${label} musi zaczynać się od http:// lub https://.`);
  }
  return errors;
}
export function assertValid(errors) { if (errors.length) throw new Error(errors.join(" ")); }
function isHttpUrl(value) { try { return ["http:", "https:"].includes(new URL(value).protocol); } catch { return false; } }
