const TOKEN_KEY = "mp_cms_github_token";
const STATE_KEY = "mp_cms_oauth_state";

export class GitHubAuth {
  constructor(config) { this.config = config; }
  token() { return sessionStorage.getItem(TOKEN_KEY); }
  login() {
    if (!this.config.clientId || this.config.clientId.startsWith("UZUPELNIJ_")) {
      throw new Error("Ustaw GitHub Client ID w admin-app/config.js.");
    }
    const state = crypto.randomUUID();
    sessionStorage.setItem(STATE_KEY, state);
    const query = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: `${location.origin}/admin/`,
      scope: this.config.scope,
      state
    });
    location.assign(`https://github.com/login/oauth/authorize?${query}`);
  }
  async completeCallback(endpoint) {
    const query = new URLSearchParams(location.search);
    const code = query.get("code");
    if (!code) return false;
    const expected = sessionStorage.getItem(STATE_KEY);
    if (!expected || query.get("state") !== expected) throw new Error("Nieprawidłowy stan OAuth. Rozpocznij logowanie ponownie.");
    sessionStorage.removeItem(STATE_KEY);
    history.replaceState({}, document.title, "/admin/");
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, redirect_uri: `${location.origin}/admin/` })
    });
    const payload = await response.json();
    if (!response.ok || !payload.access_token) throw new Error(payload.error || "Logowanie GitHub nie powiodło się.");
    sessionStorage.setItem(TOKEN_KEY, payload.access_token);
    return true;
  }
  logout() { sessionStorage.removeItem(TOKEN_KEY); location.assign("/admin/"); }
}
