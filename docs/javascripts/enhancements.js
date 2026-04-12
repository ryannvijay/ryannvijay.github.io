// =====================
// IMAGE LIGHTBOX
// =====================
(function () {
  // Build the lightbox DOM once
  const overlay = document.createElement("div");
  overlay.className = "rv-lightbox";

  const closeBtn = document.createElement("button");
  closeBtn.className = "rv-lightbox__close";
  closeBtn.setAttribute("aria-label", "Close image");
  closeBtn.innerHTML = "&times;";

  const img = document.createElement("img");
  img.setAttribute("alt", "");

  overlay.appendChild(closeBtn);
  overlay.appendChild(img);
  document.body.appendChild(overlay);

  function open(src, alt) {
    img.src = src;
    img.alt = alt || "";
    overlay.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }

  function close() {
    overlay.classList.remove("is-open");
    document.body.style.overflow = "";
    // Clear src after transition so the old image doesn't flash on next open
    setTimeout(() => { if (!overlay.classList.contains("is-open")) img.src = ""; }, 250);
  }

  // Close on backdrop click (not on the image itself)
  overlay.addEventListener("click", (e) => {
    if (e.target !== img) close();
  });

  closeBtn.addEventListener("click", close);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("is-open")) close();
  });

  // Wire up images on every page navigation (MkDocs instant loading)
  document$.subscribe(() => {
    document.querySelectorAll(".md-typeset img").forEach((el) => {
      // Avoid double-binding
      if (el.dataset.lightboxBound) return;
      el.dataset.lightboxBound = "1";
      el.addEventListener("click", () => open(el.src, el.alt));
    });
  });
})();

// Reading progress bar fallback for browsers without CSS scroll-driven animations
// Page transition reinforcement for instant loading
document$.subscribe(() => {
  // Progress bar — only add JS version if CSS animation-timeline isn't supported
  if (!CSS.supports("animation-timeline", "scroll()")) {
    let bar = document.querySelector(".rv-progress-bar");
    if (!bar) {
      bar = document.createElement("div");
      bar.className = "rv-progress-bar";
      document.body.prepend(bar);
    }

    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? scrollTop / docHeight : 0;
      bar.style.transform = `scaleX(${progress})`;
    };

    window.addEventListener("scroll", updateProgress, { passive: true });
    updateProgress();
  }

  // Page transition — re-trigger fade animation on navigation
  const content = document.querySelector(".md-content");
  if (content) {
    content.style.animation = "none";
    content.offsetHeight; // force reflow
    content.style.animation = "";
  }
});
