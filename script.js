/* ---------- CONFIG ----------
   FormSubmit: replace with your real email address. The first submission
   triggers an activation email from FormSubmit; click it once to go live.
   (To use EmailJS instead, swap the fetch() call in sendForm().) */
const FORM_EMAIL = "your-email@example.com";

document.documentElement.classList.add("js");
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Dark mode ---------- */
const root = document.documentElement;
const themeBtn = $("#theme");
function setTheme(t) {
  root.dataset.theme = t;
  themeBtn.textContent = t === "dark" ? "☀️" : "🌙";
  themeBtn.setAttribute("aria-label", t === "dark" ? "Switch to light mode" : "Switch to dark mode");
  try { localStorage.setItem("theme", t); } catch (e) {}
}
let saved = null;
try { saved = localStorage.getItem("theme"); } catch (e) {}
setTheme(saved || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
themeBtn.addEventListener("click", () => setTheme(root.dataset.theme === "dark" ? "light" : "dark"));

/* ---------- Mobile menu ---------- */
const burger = $("#burger"), menu = $("#menu");
function toggleMenu(open) {
  menu.classList.toggle("open", open);
  burger.setAttribute("aria-expanded", open);
  burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
}
burger.addEventListener("click", () => toggleMenu(!menu.classList.contains("open")));
$$("a", menu).forEach(a => a.addEventListener("click", () => toggleMenu(false)));
document.addEventListener("keydown", e => { if (e.key === "Escape") toggleMenu(false); });

/* ---------- Active link + nav shadow + scroll-to-top ---------- */
const links = $$(".menu a");
const sections = links.map(a => $(a.getAttribute("href")));
const nav = $("#nav"), topBtn = $("#top");
function onScroll() {
  const y = window.scrollY;
  nav.classList.toggle("scrolled", y > 10);
  topBtn.classList.toggle("show", y > 500);
  let current = 0;
  sections.forEach((s, i) => { if (s.getBoundingClientRect().top <= window.innerHeight * 0.4) current = i; });
  if (y + window.innerHeight >= document.documentElement.scrollHeight - 4) current = sections.length - 1;
  links.forEach((a, i) => {
    a.classList.toggle("active", i === current);
    i === current ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current");
  });
}
addEventListener("scroll", onScroll, { passive: true });
onScroll();
topBtn.addEventListener("click", () => scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }));

/* ---------- Reveal on scroll ---------- */
const io = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
}, { threshold: 0.15 });
$$(".reveal, .cards").forEach(el => io.observe(el));

/* ---------- Typing animation ---------- */
const typed = $("#typed"), full = typed.textContent.trim();
if (!reduceMotion) {
  typed.textContent = "";
  typed.setAttribute("aria-label", full);
  let i = 0;
  setTimeout(function type() {
    typed.textContent = full.slice(0, ++i);
    if (i < full.length) setTimeout(type, 75);
  }, 700);
}

/* ---------- Contact form ---------- */
const form = $("#form"), statusEl = $("#status"), sendBtn = $("#send");
const rules = {
  name: v => v.trim().length >= 2 || "Enter your name (at least 2 characters).",
  email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || "Enter a valid email address, like name@example.com.",
  message: v => v.trim().length >= 10 || "Write a message of at least 10 characters."
};
function check(field) {
  const input = form.elements[field], r = rules[field](input.value);
  $("#err-" + field).textContent = r === true ? "" : r;
  input.classList.toggle("invalid", r !== true);
  input.setAttribute("aria-invalid", r !== true);
  return r === true;
}
Object.keys(rules).forEach(f => form.elements[f].addEventListener("blur", () => check(f)));
Object.keys(rules).forEach(f => form.elements[f].addEventListener("input", () => { if (form.elements[f].classList.contains("invalid")) check(f); }));

function show(type, msg) { statusEl.className = "status " + type; statusEl.textContent = msg; }

form.addEventListener("submit", async e => {
  e.preventDefault();
  statusEl.className = "status";
  const valid = Object.keys(rules).map(check).every(Boolean);
  if (!valid) {
    show("fail", "Please fix the highlighted fields and send again.");
    form.querySelector(".invalid")?.focus();
    return;
  }
  if (form.elements._honey.value) return; // bot trap
  if (FORM_EMAIL.includes("example.com")) {
    show("fail", "The form isn't connected yet. Set FORM_EMAIL in script.js to your email address.");
    return;
  }
  sendBtn.disabled = true; sendBtn.textContent = "Sending…";
  try {
    const res = await fetch("https://formsubmit.co/ajax/" + encodeURIComponent(FORM_EMAIL), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        name: form.elements.name.value.trim(),
        email: form.elements.email.value.trim(),
        message: form.elements.message.value.trim(),
        _subject: "New portfolio message from " + form.elements.name.value.trim()
      })
    });
    const data = await res.json();
    if (!res.ok || data.success === "false") throw new Error();
    show("ok", "Message sent. Thank you, I'll reply soon!");
    form.reset();
  } catch (err) {
    show("fail", "Message not sent. Check your connection and try again.");
  } finally {
    sendBtn.disabled = false; sendBtn.textContent = "Send";
  }
});

$("#year").textContent = new Date().getFullYear();
