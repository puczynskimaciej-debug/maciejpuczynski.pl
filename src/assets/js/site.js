const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const header = document.querySelector("[data-site-header]");
const navToggle = document.querySelector(".nav-toggle");
const mainNav = document.querySelector(".main-nav");

const updateHeader = () => header?.classList.toggle("is-scrolled", scrollY > 18);
updateHeader();
addEventListener("scroll", updateHeader, { passive: true });

navToggle?.addEventListener("click", () => {
  const open = navToggle.getAttribute("aria-expanded") !== "true";
  navToggle.setAttribute("aria-expanded", String(open));
  mainNav?.classList.toggle("is-open", open);
  document.body.classList.toggle("nav-open", open);
});
mainNav?.addEventListener("click", (event) => {
  if (!event.target.closest("a")) return;
  navToggle?.setAttribute("aria-expanded", "false");
  mainNav.classList.remove("is-open");
  document.body.classList.remove("nav-open");
});
addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  navToggle?.setAttribute("aria-expanded", "false");
  mainNav?.classList.remove("is-open");
  document.body.classList.remove("nav-open");
});

const splash = document.querySelector("[data-splash]");
if (splash) {
  const seen = sessionStorage.getItem("mp_intro_seen");
  const hideSplash = () => {
    splash.classList.add("is-hidden");
    splash.setAttribute("aria-hidden", "true");
    sessionStorage.setItem("mp_intro_seen", "true");
    setTimeout(() => splash.remove(), 500);
  };
  if (seen || reducedMotion) hideSplash();
  else {
    splash.setAttribute("aria-hidden", "false");
    splash.querySelector("[data-splash-skip]")?.addEventListener("click", hideSplash);
    setTimeout(hideSplash, 2300);
  }
}

const reveals = document.querySelectorAll(".reveal");
if (reducedMotion || !("IntersectionObserver" in window)) {
  reveals.forEach((item) => item.classList.add("is-visible"));
} else {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: .12, rootMargin: "0px 0px -40px" });
  reveals.forEach((item) => observer.observe(item));
}

if (!reducedMotion && matchMedia("(hover: hover) and (pointer: fine)").matches) {
  document.querySelectorAll("[data-tilt]").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const box = card.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width - .5;
      const y = (event.clientY - box.top) / box.height - .5;
      card.style.transform = `perspective(900px) rotateX(${y * -3}deg) rotateY(${x * 4}deg) translateY(-4px)`;
    });
    card.addEventListener("pointerleave", () => { card.style.transform = ""; });
  });
  document.querySelectorAll("[data-pointer-glow]").forEach((element) => {
    element.addEventListener("pointermove", (event) => {
      const box = element.getBoundingClientRect();
      element.style.setProperty("--pointer-x", `${event.clientX - box.left}px`);
      element.style.setProperty("--pointer-y", `${event.clientY - box.top}px`);
    });
  });
}

document.querySelectorAll("[data-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-filter]").forEach((item) => item.classList.toggle("is-active", item === button));
    const filter = button.dataset.filter;
    document.querySelectorAll("[data-project-category]").forEach((project) => {
      project.hidden = filter !== "all" && project.dataset.projectCategory !== filter;
    });
  });
});

const query = new URLSearchParams(location.search);
if (query.get("success") === "true") {
  const message = document.querySelector("[data-form-success]");
  if (message) {
    message.hidden = false;
    message.focus();
    history.replaceState({}, "", location.pathname);
  }
}
