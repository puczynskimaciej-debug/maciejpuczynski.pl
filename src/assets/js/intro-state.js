try {
  document.documentElement.classList.add(sessionStorage.getItem("mp_intro_seen") ? "intro-seen" : "intro-active");
} catch {}
