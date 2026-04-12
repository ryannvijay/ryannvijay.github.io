// =====================
// IMAGE LIGHTBOX
// =====================
document$.subscribe(() => {
  // Build the overlay DOM once; persist across MkDocs instant navigations
  let overlay = document.getElementById("rv-lightbox");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "rv-lightbox";
    overlay.className = "rv-lightbox";

    const closeBtn = document.createElement("button");
    closeBtn.className = "rv-lightbox__close";
    closeBtn.setAttribute("aria-label", "Close image");
    closeBtn.innerHTML = "&times;";

    const lbImg = document.createElement("img");
    lbImg.setAttribute("alt", "");

    overlay.appendChild(closeBtn);
    overlay.appendChild(lbImg);
    document.body.appendChild(overlay);

    function closeLightbox() {
      overlay.classList.remove("is-open");
      document.body.style.overflow = "";
      setTimeout(() => { if (!overlay.classList.contains("is-open")) lbImg.src = ""; }, 250);
    }

    overlay.addEventListener("click", (e) => { if (e.target !== lbImg) closeLightbox(); });
    closeBtn.addEventListener("click", closeLightbox);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && overlay.classList.contains("is-open")) closeLightbox();
    });
  }

  const lbImg = overlay.querySelector("img");

  function openLightbox(src, alt) {
    lbImg.src = src;
    lbImg.alt = alt || "";
    overlay.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }

  // Wire up images on every page navigation
  document.querySelectorAll(".md-typeset img").forEach((el) => {
    if (el.dataset.lightboxBound) return;
    el.dataset.lightboxBound = "1";
    el.addEventListener("click", () => openLightbox(el.src, el.alt));
  });
});

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
