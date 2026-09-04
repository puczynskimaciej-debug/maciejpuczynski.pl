const ORDER = ["layout", "permalink", "alternateUrl", "title", "slug", "summary", "category", "titleEn", "summaryEn", "categoryEn", "bodyEn", "technologies", "image", "imageAlt", "liveUrl", "repositoryUrl", "inProgress", "featured", "order", "published"];

export function parseMarkdown(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { data: {}, body: source };
  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const field = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!field) continue;
    data[field[1]] = parseScalar(field[2]);
  }
  return { data, body: match[2].trim() };
}
export function stringifyMarkdown(data, body) {
  const keys = [...ORDER.filter((key) => data[key] !== undefined), ...Object.keys(data).filter((key) => !ORDER.includes(key) && data[key] !== undefined)];
  const yaml = keys.map((key) => `${key}: ${JSON.stringify(data[key])}`).join("\n");
  return `---\n${yaml}\n---\n${String(body || "").trim()}\n`;
}
function parseScalar(value) { if (!value) return ""; try { return JSON.parse(value); } catch { return value.replace(/^["']|["']$/g, ""); } }
