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
