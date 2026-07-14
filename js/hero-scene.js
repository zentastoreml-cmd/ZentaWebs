import * as THREE from "three";
import { EffectComposer } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/UnrealBloomPass.js";

/**
 * Generative WebGL hero background: a noise-displaced glowing orb — solid
 * fresnel-rim shading + bloom, lit by a point light that follows the cursor.
 * Vanilla port — no React/build step, loaded as a native ES module.
 */
(function () {
  "use strict";

  var mount = document.getElementById("heroCanvas");
  var heroSection = document.getElementById("inicio");
  if (!mount || !heroSection) return;

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isSmallScreen = window.innerWidth < 640;

  var scene, camera, renderer, composer, mesh, material;
  var frameId = null;
  var isVisible = true;
  var pointerNDC = { x: 0.3, y: 0.2 };

  function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
      75,
      mount.clientWidth / mount.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 3.6;

    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch (e) {
      return; // No WebGL support — the CSS gradient blobs stay as the background.
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isSmallScreen ? 1.5 : 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    // Subdivision level 5 (not the raw vertex count) — anything above ~7 here
    // grows exponentially (20 * 4^n faces) and will hang the tab.
    var geometry = new THREE.IcosahedronGeometry(1.15, 5);

    material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        pointLightPos: { value: new THREE.Vector3(0, 0, 5) },
        colorA: { value: new THREE.Color("#A78BFA") }, // violet-400
        colorB: { value: new THREE.Color("#F472B6") }, // pink-400
        mixT: { value: 0 },
      },
      vertexShader: [
        "uniform float time;",
        "varying vec3 vNormal;",
        "varying vec3 vPosition;",
        "",
        "vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }",
        "vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }",
        "vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }",
        "vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }",
        "float snoise(vec3 v) {",
        "    const vec2 C = vec2(1.0/6.0, 1.0/3.0);",
        "    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);",
        "    vec3 i = floor(v + dot(v, C.yyy));",
        "    vec3 x0 = v - i + dot(i, C.xxx);",
        "    vec3 g = step(x0.yzx, x0.xyz);",
        "    vec3 l = 1.0 - g;",
        "    vec3 i1 = min(g.xyz, l.zxy);",
        "    vec3 i2 = max(g.xyz, l.zxy);",
        "    vec3 x1 = x0 - i1 + C.xxx;",
        "    vec3 x2 = x0 - i2 + C.yyy;",
        "    vec3 x3 = x0 - D.yyy;",
        "    i = mod289(i);",
        "    vec4 p = permute(permute(permute(",
        "                i.z + vec4(0.0, i1.z, i2.z, 1.0))",
        "            + i.y + vec4(0.0, i1.y, i2.y, 1.0))",
        "            + i.x + vec4(0.0, i1.x, i2.x, 1.0));",
        "    float n_ = 0.142857142857;",
        "    vec3 ns = n_ * D.wyz - D.xzx;",
        "    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);",
        "    vec4 x_ = floor(j * ns.z);",
        "    vec4 y_ = floor(j - 7.0 * x_);",
        "    vec4 x = x_ * ns.x + ns.yyyy;",
        "    vec4 y = y_ * ns.x + ns.yyyy;",
        "    vec4 h = 1.0 - abs(x) - abs(y);",
        "    vec4 b0 = vec4(x.xy, y.xy);",
        "    vec4 b1 = vec4(x.zw, y.zw);",
        "    vec4 s0 = floor(b0) * 2.0 + 1.0;",
        "    vec4 s1 = floor(b1) * 2.0 + 1.0;",
        "    vec4 sh = -step(h, vec4(0.0));",
        "    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;",
        "    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;",
        "    vec3 p0 = vec3(a0.xy, h.x);",
        "    vec3 p1 = vec3(a0.zw, h.y);",
        "    vec3 p2 = vec3(a1.xy, h.z);",
        "    vec3 p3 = vec3(a1.zw, h.w);",
        "    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));",
        "    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;",
        "    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);",
        "    m = m * m;",
        "    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));",
        "}",
        "",
        "void main() {",
        "    vNormal = normal;",
        "    float displacement = snoise(position * 1.8 + time * 0.4) * 0.14;",
        "    vec3 newPosition = position + normal * displacement;",
        "    vPosition = newPosition;",
        "    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);",
        "}",
      ].join("\n"),
      fragmentShader: [
        "uniform vec3 colorA;",
        "uniform vec3 colorB;",
        "uniform float mixT;",
        "uniform vec3 pointLightPos;",
        "varying vec3 vNormal;",
        "varying vec3 vPosition;",
        "",
        "void main() {",
        "    vec3 color = mix(colorA, colorB, mixT);",
        "    vec3 normal = normalize(vNormal);",
        "    vec3 viewDir = normalize(cameraPosition - vPosition);",
        "",
        "    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.4);",
        "",
        "    vec3 lightDir = normalize(pointLightPos - vPosition);",
        "    float diffuse = max(dot(normal, lightDir), 0.0);",
        "",
        "    vec3 core = color * 0.05;",
        "    vec3 rim = color * fresnel * 1.4;",
        "    vec3 highlight = color * diffuse * 0.4;",
        "",
        "    gl_FragColor = vec4(core + rim + highlight, 1.0);",
        "}",
      ].join("\n"),
    });

    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    var bloomPass = new UnrealBloomPass(
      new THREE.Vector2(mount.clientWidth, mount.clientHeight),
      isSmallScreen ? 0.4 : 0.55, // strength
      0.45, // radius
      0.22 // threshold
    );
    composer.addPass(bloomPass);
  }

  function render(t) {
    if (!prefersReducedMotion) {
      material.uniforms.time.value = t * 0.00025;
      material.uniforms.mixT.value = Math.sin(t * 0.00012) * 0.5 + 0.5;
      mesh.rotation.y += 0.0007;
      mesh.rotation.x += 0.00035;
      var breathe = 1 + Math.sin(t * 0.0005) * 0.035;
      mesh.scale.setScalar(breathe);
    }
    composer.render();
    if (!prefersReducedMotion && isVisible) {
      frameId = requestAnimationFrame(render);
    }
  }

  function updateLightFromPointer() {
    var vec = new THREE.Vector3(pointerNDC.x, pointerNDC.y, 0.5).unproject(camera);
    var dir = vec.sub(camera.position).normalize();
    var dist = -camera.position.z / dir.z;
    var pos = camera.position.clone().add(dir.multiplyScalar(dist));
    material.uniforms.pointLightPos.value = pos;
  }

  function handlePointerMove(e) {
    pointerNDC.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointerNDC.y = -(e.clientY / window.innerHeight) * 2 + 1;
    updateLightFromPointer();
    if (prefersReducedMotion) composer.render();
  }

  function handleResize() {
    if (!mount.clientWidth || !mount.clientHeight) return;
    camera.aspect = mount.clientWidth / mount.clientHeight;
    camera.updateProjectionMatrix();
    composer.setSize(mount.clientWidth, mount.clientHeight);
    composer.render();
  }

  init();
  if (!renderer) return; // WebGL unavailable — nothing more to do.

  // Force a fresh size sync in case layout wasn't settled at init time
  // (e.g. fonts/webfont swap still reflowing) — cheap, avoids a 0×0 canvas.
  handleResize();
  updateLightFromPointer();
  render(0);
  window.addEventListener("resize", handleResize, { passive: true });
  window.addEventListener("pointermove", handlePointerMove, { passive: true });

  // Pause the render loop when the hero scrolls out of view or the tab is hidden.
  if ("IntersectionObserver" in window) {
    var obs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          isVisible = entry.isIntersecting;
          if (isVisible && !prefersReducedMotion && frameId === null) {
            frameId = requestAnimationFrame(render);
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
      frameId = requestAnimationFrame(render);
    }
  });
})();
