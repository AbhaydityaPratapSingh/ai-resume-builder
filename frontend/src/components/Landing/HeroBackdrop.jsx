import { useEffect, useRef, useState } from "react";
import {
  AmbientLight,
  CanvasTexture,
  DirectionalLight,
  DoubleSide,
  Fog,
  IcosahedronGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  SRGBColorSpace,
  Scene,
  TorusGeometry,
  WebGLRenderer,
} from "three";

function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A tiny resume drawn on a canvas, used as the texture for every sheet.
function makeSheetTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 332;
  const g = c.getContext("2d");
  g.fillStyle = "#ffffff";
  g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = "#0f172a";
  g.fillRect(24, 26, 120, 12);
  g.fillStyle = "#cbd5e1";
  g.fillRect(24, 46, 170, 6);
  let y = 76;
  for (let s = 0; s < 3; s++) {
    g.fillStyle = "#6366f1";
    g.fillRect(24, y, 60, 6);
    g.fillStyle = "#e2e8f0";
    g.fillRect(24, y + 14, 208, 2);
    for (let l = 0; l < 3; l++) g.fillRect(24, y + 26 + l * 14, [208, 180, 130][l], 6);
    y += 80;
  }
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

// Lazy-loaded WebGL layer behind the hero: resume sheets and a few wireframe
// shapes drifting in depth, with a slight camera parallax on mouse move.
// Only rendered while visible and while the tab is in the foreground.
export default function HeroBackdrop() {
  const wrapRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const wrap = wrapRef.current;
    const renderer = new WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    wrap.appendChild(renderer.domElement);

    const scene = new Scene();
    scene.fog = new Fog(0xffffff, 7, 17);
    const camera = new PerspectiveCamera(45, 1, 0.1, 50);
    camera.position.set(0, 0, 9);

    scene.add(new AmbientLight(0xffffff, 1.6));
    const sun = new DirectionalLight(0xffffff, 1.4);
    sun.position.set(3, 5, 6);
    scene.add(sun);

    const rand = mulberry32(11);
    const texture = makeSheetTexture();
    const sheetGeo = new PlaneGeometry(1, 1.3);
    const sheetMat = new MeshStandardMaterial({ map: texture, side: DoubleSide, roughness: 0.9 });
    const icoGeo = new IcosahedronGeometry(0.45, 0);
    const torusGeo = new TorusGeometry(0.35, 0.1, 12, 32);
    const wireMat = new MeshBasicMaterial({ color: 0x6366f1, wireframe: true, transparent: true, opacity: 0.45 });
    const solidMat = new MeshStandardMaterial({ color: 0xc7d2fe, roughness: 0.4 });

    const items = [];
    const add = (mesh, spin) => {
      mesh.position.set(-8 + rand() * 16, -3.6 + rand() * 7.2, -6 + rand() * 5);
      mesh.rotation.set(rand() * Math.PI, rand() * Math.PI, rand() * 0.6);
      scene.add(mesh);
      items.push({
        mesh,
        baseY: mesh.position.y,
        phase: rand() * Math.PI * 2,
        bob: 0.15 + rand() * 0.25,
        spinX: (rand() - 0.5) * spin,
        spinY: (rand() - 0.5) * spin,
      });
    };
    for (let i = 0; i < 12; i++) add(new Mesh(sheetGeo, sheetMat), 0.25);
    for (let i = 0; i < 4; i++) add(new Mesh(icoGeo, wireMat), 0.6);
    for (let i = 0; i < 3; i++) add(new Mesh(torusGeo, solidMat), 0.5);

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = wrap;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();

    const pointer = { x: 0, y: 0 };
    const onPointerMove = (e) => {
      if (e.pointerType !== "mouse") return;
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onPointerMove);

    let frame = 0;
    let visible = true;
    const start = performance.now();
    const tick = (now) => {
      const t = (now - start) / 1000;
      for (const it of items) {
        it.mesh.position.y = it.baseY + Math.sin(t * 0.6 + it.phase) * it.bob;
        it.mesh.rotation.x += it.spinX * 0.01;
        it.mesh.rotation.y += it.spinY * 0.01;
      }
      camera.position.x += (pointer.x * 0.8 - camera.position.x) * 0.04;
      camera.position.y += (-pointer.y * 0.5 - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
      frame = requestAnimationFrame(tick);
    };
    const run = () => {
      if (!frame && visible && !document.hidden) frame = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) run();
      else stop();
    });
    io.observe(wrap);
    const onVisibility = () => (document.hidden ? stop() : run());
    document.addEventListener("visibilitychange", onVisibility);

    renderer.render(scene, camera);
    setReady(true);
    run();

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("visibilitychange", onVisibility);
      for (const obj of [sheetGeo, icoGeo, torusGeo, sheetMat, wireMat, solidMat, texture]) {
        obj.dispose();
      }
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      data-ready={ready}
      className="hero-backdrop pointer-events-none absolute inset-0 -z-10"
      aria-hidden="true"
    />
  );
}
