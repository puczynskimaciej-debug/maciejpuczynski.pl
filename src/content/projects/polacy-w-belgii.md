---
layout: layouts/project.njk
permalink: "/projekty/polacy-w-belgii/index.html"
title: "Serwis z własnym prostym CMS-em"
slug: "polacy-w-belgii"
summary: "Przykładowa strona do samodzielnego publikowania artykułów, zdjęć i aktualizacji bez bazy danych oraz stałego serwera."
category: "Przykładowy CMS"
technologies: ["Eleventy", "GitHub API", "GitHub OAuth", "Netlify"]
image: "/assets/images/projects/polacy-w-belgii.svg"
imageAlt: "Neutralny mockup serwisu Polacy w Belgii"
liveUrl: "https://polacywbelgii.eu"
repositoryUrl: ""
inProgress: false
featured: true
order: 2
published: true
---
Przykładem takiego rozwiązania jest serwis Polacy w Belgii. Własny panel pozwala zarządzać artykułami, zdjęciami i treściami strony bez edytowania kodu.

Treści są przechowywane w plikach Markdown i JSON. Każdy zapis tworzy commit w GitHubie, a Netlify automatycznie publikuje aktualną wersję — bez bazy danych, VPS-a i stałego backendu.
