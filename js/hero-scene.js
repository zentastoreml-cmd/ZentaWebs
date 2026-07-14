(function () {
  "use strict";

  /**
   * Isometric wave-grid hero background: a topographic grid of horizontal
   * lines, distorted by an ambient sine wave and mouse-proximity repulsion.
   * Ported from a React/Canvas component — no dependencies, no build step.
   */

  var container = document.getElementById("heroCanvas");
  var heroSection = document.getElementById("inicio");
  var canvas = document.getElementById("heroGridCanvas");
  if (!container || !heroSection || !canvas) return;

  var ctx = canvas.getContext("2d");
  if (!ctx) return;

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isSmallScreen = window.innerWidth < 640;

  var COLOR_A = "167, 139, 250"; // violet-400, matches .hero h1 .grad
  var COLOR_B = "244, 114, 182"; // pink-400, matches .hero h1 .grad
  var DENSITY = isSmallScreen ? 34 : 46; // grid gap in px — smaller cells read better on narrow screens
  var SPEED = 1;

  var width = 0;
  var height = 0;
  var frameId = null;
  var isVisible = true;
  var time = 0;
  var mixT = 0;

  var mouse = { x: -1000, y: -1000, targetX: -1000, targetY: -1000 };

  function resize() {
    width = container.clientWidth;
    height = container.clientHeight;
    if (!width || !height) return;
    var ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function handlePointerMove(e) {
    var rect = canvas.getBoundingClientRect();
    mouse.targetX = e.clientX - rect.left;
    mouse.targetY = e.clientY - rect.top;
  }

  function handleDocumentMouseOut(e) {
    if (!e.relatedTarget && !e.toElement) {
      mouse.targetX = -1000;
      mouse.targetY = -1000;
    }
  }

  function smoothMix(a, b, t) {
    return a + (b - a) * t;
  }

  function draw(t) {
    if (!width || !height) {
      frameId = requestAnimationFrame(draw);
      return;
    }

    ctx.clearRect(0, 0, width, height);

    mouse.x = smoothMix(mouse.x, mouse.targetX, 0.1);
    mouse.y = smoothMix(mouse.y, mouse.targetY, 0.1);

    if (!prefersReducedMotion) {
      time += 0.01 * SPEED;
      mixT = Math.sin(t * 0.00015) * 0.5 + 0.5;
    }

    // Recomputed every frame (not cached) so resizing to a larger viewport
    // doesn't leave the grid short — a real bug in the original snippet.
    var rows = Math.ceil(height / DENSITY) + 5;
    var cols = Math.ceil(width / DENSITY) + 5;

    ctx.beginPath();

    for (var y = 0; y <= rows; y++) {
      var isFirst = true;
      for (var x = 0; x <= cols; x++) {
        var baseX = x * DENSITY - DENSITY * 2;
        var baseY = y * DENSITY - DENSITY * 2;

        var wave = Math.sin(x * 0.2 + time) * Math.cos(y * 0.2 + time) * 15;

        var dx = baseX - mouse.x;
        var dy = baseY - mouse.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var maxDist = 300;
        var force = Math.max(0, (maxDist - dist) / maxDist);
        var interactionY = -(force * force) * 80;

        var finalX = baseX;
        var finalY = baseY + wave + interactionY;

        if (isFirst) {
          ctx.moveTo(finalX, finalY);
          isFirst = false;
        } else {
          ctx.lineTo(finalX, finalY);
        }
      }
    }

    var color = mixT > 0 ? mixColor(COLOR_A, COLOR_B, mixT) : COLOR_A;
    var gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "rgba(" + color + ", 0)");
    gradient.addColorStop(0.5, "rgba(" + color + ", 0.55)");
    gradient.addColorStop(1, "rgba(" + color + ", 0)");

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 1.1;
    ctx.shadowBlur = 8;
    ctx.shadowColor = "rgba(" + color + ", 0.6)";
    ctx.stroke();
    ctx.shadowBlur = 0;

    if (!prefersReducedMotion && isVisible) {
      frameId = requestAnimationFrame(draw);
    }
  }

  function mixColor(a, b, t) {
    var pa = a.split(",").map(Number);
    var pb = b.split(",").map(Number);
    var r = Math.round(smoothMix(pa[0], pb[0], t));
    var g = Math.round(smoothMix(pa[1], pb[1], t));
    var bch = Math.round(smoothMix(pa[2], pb[2], t));
    return r + ", " + g + ", " + bch;
  }

  resize();
  draw(0);

  window.addEventListener("resize", resize, { passive: true });
  // Listened on window, not the container — .hero-canvas has pointer-events:
  // none (so it never blocks clicks on buttons/text above it), which means
  // it never receives its own pointer events either.
  window.addEventListener("pointermove", handlePointerMove, { passive: true });
  document.addEventListener("mouseout", handleDocumentMouseOut, { passive: true });

  if (prefersReducedMotion) {
    // Single static frame, but keep it responsive to resize.
    window.addEventListener("resize", function () { draw(0); }, { passive: true });
  }

  // Pause the render loop when the hero scrolls out of view or the tab is hidden.
  if ("IntersectionObserver" in window) {
    var obs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          isVisible = entry.isIntersecting;
          if (isVisible && !prefersReducedMotion && frameId === null) {
            frameId = requestAnimationFrame(draw);
          }
        });
      },
      { threshold: 0 }
    );
    obs.observe(heroSection);
  }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      isVisible = false;
    } else if (!prefersReducedMotion && frameId === null) {
      isVisible = true;
      frameId = requestAnimationFrame(draw);
    }
  });
})();
