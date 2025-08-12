const yearLabel = document.getElementById('year');
if (yearLabel) {
  yearLabel.textContent = String(new Date().getFullYear());
}

const toggle = document.querySelector('.nav-toggle');
const navList = document.querySelector('.nav-list');
if (toggle && navList) {
  toggle.addEventListener('click', () => {
    const open = navList.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  navList.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    navList.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  });
}

// Active link indicator for header
(() => {
  const nav = document.querySelector('.primary-nav');
  const indicator = document.getElementById('nav-indicator');
  if (!nav || !indicator) return;
  const links = Array.from(nav.querySelectorAll('.nav-list a'));
  function setIndicator(el) {
    const rect = el.getBoundingClientRect();
    const parentRect = el.parentElement.parentElement.getBoundingClientRect();
    const left = rect.left - parentRect.left;
    indicator.style.width = rect.width + 'px';
    indicator.style.transform = `translateX(${left}px)`;
    links.forEach(a => a.classList.toggle('active', a === el));
  }
  links.forEach(a => a.addEventListener('mouseenter', () => setIndicator(a)));
  window.addEventListener('resize', () => {
    const active = links.find(a => a.classList.contains('active')) || links[0];
    setIndicator(active);
  });
  // initial
  setTimeout(() => setIndicator(links[0]), 50);
})();

// 3D hero background using Three.js
(() => {
  const bgCanvas = document.getElementById('bg-canvas');
  if (bgCanvas && window.THREE) {
    const { Scene, PerspectiveCamera, WebGLRenderer, PointsMaterial, BufferGeometry, Float32BufferAttribute, Points, Color, AdditiveBlending, Clock } = THREE;
    const scene = new Scene();
    scene.background = null;
    const camera = new PerspectiveCamera(60, 1, 0.1, 1000);
    camera.position.z = 2.2;
    const renderer = new WebGLRenderer({ canvas: bgCanvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    function resize() {
      const w = bgCanvas.clientWidth || window.innerWidth;
      const h = bgCanvas.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    }
    resize();
    window.addEventListener('resize', resize);

    // Starfield
    const starGeometry = new BufferGeometry();
    const starCount = 1200;
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 2] = Math.random() * -40; // push into depth
    }
    starGeometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    const stars = new Points(
      starGeometry,
      new PointsMaterial({ size: 0.02, color: new Color('#9bb0d1'), transparent: true, opacity: 0.8, blending: AdditiveBlending })
    );
    scene.add(stars);

    const clock = new Clock();
    function animate() {
      const t = clock.getElapsedTime();
      stars.rotation.y = t * 0.02;
      stars.position.z = Math.sin(t * 0.2) * 2.0 - 2.0;
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }
    animate();
  }
})();

// Header scroll state
(() => {
  const header = document.querySelector('.site-header');
  if (!header) return;
  function onScroll() {
    const y = window.scrollY || document.documentElement.scrollTop;
    header.classList.toggle('scrolled', y > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

// ticker cloning for continuous scroll
(() => {
  const track = document.getElementById('ticker-track');
  if (!track) return;
  const clone = track.cloneNode(true);
  track.parentElement.appendChild(clone);
})();

// mini sparkline generator
(() => {
  const svgs = Array.from(document.querySelectorAll('svg.sparkline'));
  if (svgs.length === 0) return;
  function makePath(points, w, h) {
    const max = Math.max(...points);
    const min = Math.min(...points);
    const span = Math.max(1, max - min);
    const step = w / (points.length - 1);
    return points.map((v, i) => {
      const x = i * step;
      const y = h - ((v - min) / span) * h;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }
  function randomSeries(n, base = 100, vol = 2) {
    const data = [base];
    for (let i = 1; i < n; i++) data.push(data[i - 1] + (Math.random() - 0.5) * vol);
    return data;
  }
  svgs.forEach(svg => {
    const path = svg.querySelector('path.spark');
    if (!path) return;
    const box = svg.viewBox.baseVal;
    const series = randomSeries(40, Math.random() * 50 + 50, 2.5);
    path.setAttribute('d', makePath(series, box.width, box.height));
    // animate by shifting series
    setInterval(() => {
      series.shift();
      series.push(series[series.length - 1] + (Math.random() - 0.5) * 2.5);
      path.setAttribute('d', makePath(series, box.width, box.height));
    }, 1400);
  });
})();
(() => {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas || !window.THREE) return;

  const { Scene, PerspectiveCamera, WebGLRenderer, Color, FogExp2, Vector2, MathUtils, Clock } = THREE;
  const { PlaneGeometry, ShaderMaterial, Mesh } = THREE;

  const scene = new Scene();
  scene.background = new Color(0x0b0f15);
  scene.fog = new FogExp2(0x0b0f15, 0.08);

  const camera = new PerspectiveCamera(55, 1, 0.1, 100);
  camera.position.set(0, 0.8, 3.2);

  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  function resize() {
    const rect = canvas.getBoundingClientRect();
    const w = rect.width || canvas.clientWidth || window.innerWidth;
    const h = rect.height || 480;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  resize();
  window.addEventListener('resize', resize);

  // Simple shader plane with gradient and noise warp
  const geometry = new PlaneGeometry(6, 4, 200, 200);
  const material = new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uMouse: { value: new Vector2(0.5, 0.5) },
      uColorA: { value: new Color(0x9945ff) },
      uColorB: { value: new Color(0x14f195) }
    },
    vertexShader: `
      uniform float uTime;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        float t = uTime * 0.25;
        vec3 p = position;
        p.z += (sin(p.x*1.8 + t) + cos(p.y*1.6 + t*1.2)) * 0.08;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;
      uniform vec3 uColorA; uniform vec3 uColorB; uniform float uTime;
      varying vec2 vUv;
      void main() {
        vec2 uv = vUv;
        float g = smoothstep(0.0, 1.0, uv.y);
        vec3 col = mix(uColorA, uColorB, g);
        float grid = smoothstep(0.48, 0.5, abs(fract(uv.x*20.0)-0.5)) * 0.2 + smoothstep(0.48, 0.5, abs(fract(uv.y*12.0)-0.5)) * 0.2;
        col += vec3(grid);
        gl_FragColor = vec4(col, 0.55);
      }
    `,
    transparent: true,
    wireframe: false,
  });
  const plane = new Mesh(geometry, material);
  plane.rotation.x = MathUtils.degToRad(-14);
  scene.add(plane);

  const clock = new Clock();
  function onPointerMove(e) {
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;
    material.uniforms.uMouse.value.set(x, y);
  }
  window.addEventListener('pointermove', onPointerMove);

  function tick() {
    material.uniforms.uTime.value = clock.getElapsedTime();
    plane.rotation.z = Math.sin(clock.elapsedTime * 0.15) * 0.05;
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  tick();
})();

// Reveal on scroll
(() => {
  const items = Array.from(document.querySelectorAll('[data-reveal]'));
  if (!('IntersectionObserver' in window) || items.length === 0) {
    items.forEach(el => el.classList.add('reveal-in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      if (isIntersecting) {
        target.classList.add('reveal-in');
        io.unobserve(target);
      }
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -10% 0px' });
  items.forEach(el => io.observe(el));
})();

// Subtle tilt on cards
(() => {
  const cards = Array.from(document.querySelectorAll('.card'));
  cards.forEach(card => {
    let raf = 0;
    function onMove(e) {
      const r = card.getBoundingClientRect();
      const cx = (e.clientX - r.left) / r.width - 0.5;
      const cy = (e.clientY - r.top) / r.height - 0.5;
      const rx = (-cy * 6).toFixed(2);
      const ry = (cx * 8).toFixed(2);
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-2px)`;
      });
    }
    function onLeave() {
      cancelAnimationFrame(raf);
      card.style.transform = '';
    }
    card.addEventListener('mousemove', onMove);
    card.addEventListener('mouseleave', onLeave);
  });
})();

// Smooth anchor scrolling (fallback for browsers without CSS smooth)
(() => {
  const supportsSmooth = 'scrollBehavior' in document.documentElement.style;
  if (supportsSmooth) return;
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href').slice(1);
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    const top = el.getBoundingClientRect().top + window.scrollY - 64;
    window.scrollTo({ top, behavior: 'auto' });
  });
})();

// Parallax on hero visual
(() => {
  const visual = document.querySelector('.hero-visual img');
  if (!visual) return;
  function onScroll() {
    const y = window.scrollY || document.documentElement.scrollTop;
    const offset = Math.min(24, y * 0.05);
    visual.style.transform = `translateY(${offset}px)`;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();


