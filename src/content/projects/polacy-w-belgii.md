---
layout: layouts/project.njk
permalink: "/projekty/polacy-w-belgii/index.html"
title: "Polacy w Belgii"
slug: "polacy-w-belgii"
summary: "Serwis informacyjny z własnym, plikowym CMS-em i publikacją opartą o GitHub oraz Netlify."
category: "Serwis i CMS"
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
Projekt wykorzystuje Eleventy, treści Markdown i JSON, GitHub Contents API oraz statyczny panel administracyjny.

Każdy zapis w CMS-ie tworzy commit, a Netlify automatycznie przebudowuje i publikuje stronę. Jedyna funkcja serwerowa służy do bezpiecznej wymiany kodu GitHub OAuth na token.
