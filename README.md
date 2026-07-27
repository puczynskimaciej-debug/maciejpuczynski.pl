# maciejpuczynski.pl

Portfolio zbudowane w Eleventy z własnym, statycznym CMS-em opartym o GitHub Contents API.

## Lokalnie

```bash
npm install
npm run dev
```

Build i podstawowy audyt:

```bash
npm test
```

Test responsywności wymaga uruchomionej strony na porcie 8088:

```bash
npm run dev -- --port=8088
npm run test:responsive
```

## CMS

Panel jest publikowany pod `/admin/`. Konfiguracja repozytorium, brancha i ścieżek znajduje się wyłącznie w `admin-app/config.js`.

Treści:

- strona główna: `src/_data/home.json`,
- kontakt, profile i SEO: `src/_data/site.json`,
- projekty: `src/content/projects/*.md`,
- media: `src/assets/images/uploads/`.

Token OAuth jest przechowywany tylko w `sessionStorage`. Funkcja `netlify/functions/oauth.js` służy wyłącznie do wymiany kodu OAuth na token.

## Konfiguracja produkcji

1. Ustaw `owner`, `repo` i docelowy branch w `admin-app/config.js`.
2. Utwórz osobną GitHub OAuth App:
   - Homepage: `https://maciejpuczynski.pl`
   - Callback: `https://maciejpuczynski.pl/admin/`
3. Ustaw publiczny Client ID w `admin-app/config.js`.
4. W Netlify dodaj wyłącznie jako zmienne środowiskowe:
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`
5. Nie dodawaj tokenów ani sekretów do repozytorium.

Build Netlify jest skonfigurowany w `netlify.toml`.
