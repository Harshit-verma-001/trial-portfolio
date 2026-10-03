/* ==========================================================================
   Deep Space Portfolio — Core Logic
   Includes interactive starfield, reticle cursor, 3D planets, 
   constellation map viewer, 3D skill tag cloud, and telemetry preloader.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------------------------------------------------------
     1. Telemetry Launch Preloader & Launch State Machine
     --------------------------------------------------------- */
  const preloader = document.getElementById('preloader');
  const preBarFill = document.getElementById('pre-bar-fill');
  const preCount = document.getElementById('pre-count');
  const preStatus = document.getElementById('pre-status');

  const statusMessages = [
    "Systems diagnostic check...",
    "Calibrating optical reticle & tracking...",
    "Igniting launch thrusters...",
    "Telemetry link locked. Launching into orbit!"
  ];

  let preloaderProgress = 0;
  let launchState = 'prelaunch'; // 'prelaunch' | 'launching' | 'orbit'
  let launchTime = 0; // 0 to 1 during launch transition

  const preloaderInterval = setInterval(() => {
    preloaderProgress += Math.floor(Math.random() * 8) + 4;
    if (preloaderProgress > 100) preloaderProgress = 100;

    preBarFill.style.width = `${preloaderProgress}%`;
    preCount.textContent = preloaderProgress < 10 ? `0${preloaderProgress}` : `${preloaderProgress}`;

    const msgIdx = Math.min(Math.floor((preloaderProgress / 100) * statusMessages.length), statusMessages.length - 1);
    preStatus.textContent = statusMessages[msgIdx];

    if (preloaderProgress === 100) {
      clearInterval(preloaderInterval);
      setTimeout(() => {
        launchState = 'launching';
      }, 200);
    }
  }, 60);

  /* ---------------------------------------------------------
     2. Interactive Rocket Launch & Space Warp Canvas
     --------------------------------------------------------- */
  const canvas = document.getElementById('sky-canvas');
  const ctx = canvas.getContext('2d');

  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  const mouse = { x: width / 2, y: height / 2, targetX: width / 2, targetY: height / 2 };

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    initStars();
  });

  window.addEventListener('mousemove', (e) => {
    mouse.targetX = e.clientX;
    mouse.targetY = e.clientY;
  });

  // 3D Starfield Array
  const stars = [];
  const numStars = Math.floor((width * height) / 2200);

  function initStars() {
    stars.length = 0;
    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: (Math.random() - 0.5) * width * 2,
        y: (Math.random() - 0.5) * height * 2,
        z: Math.random() * 1000 + 1,
        prevZ: 0,
        size: Math.random() * 1.5 + 0.5,
        color: ['#7fe6ff', '#ffffff', '#c4b5fd', '#8fcaff', '#ffd700'][Math.floor(Math.random() * 5)]
      });
      stars[i].prevZ = stars[i].z;
    }
  }
  initStars();

  // Exhaust Smoke & Flame Particles
  const particles = [];
  function createPlumeParticle(x, y, intensity = 1) {
    particles.push({
      x: x + (Math.random() - 0.5) * 20 * intensity,
      y: y + Math.random() * 10,
      vx: (Math.random() - 0.5) * 3 * intensity,
      vy: Math.random() * 6 * intensity + 2,
      size: Math.random() * 14 * intensity + 6,
      alpha: 1,
      life: 0,
      maxLife: Math.random() * 35 + 20,
      color: Math.random() > 0.4 ? 'rgba(255, 120, 40,' : Math.random() > 0.5 ? 'rgba(255, 200, 60,' : 'rgba(120, 200, 255,'
    });
  }

  let rocketY = height - 120;
  let padY = height - 40;

  // Shooting Meteors
  const meteors = [];
  function spawnMeteor() {
    if (Math.random() < 0.015 && meteors.length < 3) {
      meteors.push({
        x: Math.random() * width * 1.2 - width * 0.1,
        y: Math.random() * height * 0.4,
        length: Math.random() * 80 + 40,
        speed: Math.random() * 12 + 8,
        angle: Math.PI / 4 + (Math.random() - 0.5) * 0.2,
        life: 0,
        maxLife: Math.random() * 40 + 20,
        color: ['#7fe6ff', '#ffffff', '#c4b5fd'][Math.floor(Math.random() * 3)]
      });
    }
  }

  function renderScene() {
    ctx.fillStyle = '#05060b';
    ctx.fillRect(0, 0, width, height);

    // Mouse lerp
    mouse.x += (mouse.targetX - mouse.x) * 0.05;
    mouse.y += (mouse.targetY - mouse.y) * 0.05;

    const cx = width / 2;
    const cy = height / 2;

    // 0. Render Cosmic Nebula Dust Glows
    const neb1 = ctx.createRadialGradient(cx * 0.5 + (mouse.x - cx) * 0.04, cy * 0.6 + (mouse.y - cy) * 0.04, 50, cx * 0.5, cy * 0.6, width * 0.45);
    neb1.addColorStop(0, 'rgba(59, 134, 255, 0.12)');
    neb1.addColorStop(0.5, 'rgba(120, 80, 220, 0.06)');
    neb1.addColorStop(1, 'rgba(5, 6, 11, 0)');
    ctx.fillStyle = neb1;
    ctx.fillRect(0, 0, width, height);

    const neb2 = ctx.createRadialGradient(cx * 1.5 + (mouse.x - cx) * 0.02, cy * 1.3 + (mouse.y - cy) * 0.02, 30, cx * 1.5, cy * 1.3, width * 0.4);
    neb2.addColorStop(0, 'rgba(127, 230, 255, 0.10)');
    neb2.addColorStop(0.6, 'rgba(196, 181, 253, 0.04)');
    neb2.addColorStop(1, 'rgba(5, 6, 11, 0)');
    ctx.fillStyle = neb2;
    ctx.fillRect(0, 0, width, height);

    // Determine Warp Speed multiplier based on launchState
    let warpSpeed = 2;
    if (launchState === 'launching') {
      launchTime += 0.012;
      if (launchTime > 1) {
        launchTime = 1;
        launchState = 'orbit';
        preloader.classList.add('fade-out');
        document.body.classList.remove('loading');
        document.body.classList.add('cursor-on');
        initScrollReveal();
      }
      // Ease speed up then down
      const t = launchTime;
      const speedEase = Math.sin(t * Math.PI);
      warpSpeed = 2 + speedEase * 42;
      rocketY = (height - 120) - (t * (height + 300));
      padY = (height - 40) + (t * 400);
    } else if (launchState === 'orbit') {
      warpSpeed = 2.5;
    }

    // 1. Draw 3D Radial Starfield & Warp Streaks
    const starCoords = [];
    stars.forEach(star => {
      star.prevZ = star.z;
      star.z -= warpSpeed;

      if (star.z <= 1) {
        star.z = 1000;
        star.prevZ = star.z;
        star.x = (Math.random() - 0.5) * width * 2;
        star.y = (Math.random() - 0.5) * height * 2;
      }

      const k = 400 / star.z;
      const px = star.x * k + cx + (mouse.x - cx) * 0.03;
      const py = star.y * k + cy + (mouse.y - cy) * 0.03;

      const pk = 400 / star.prevZ;
      const prevPx = star.x * pk + cx + (mouse.x - cx) * 0.03;
      const prevPy = star.y * pk + cy + (mouse.y - cy) * 0.03;

      if (px >= 0 && px <= width && py >= 0 && py <= height) {
        const size = Math.max(0.5, (1 - star.z / 1000) * star.size * 2.2);
        const alpha = Math.min(1, (1 - star.z / 1000) * 1.2);

        if (warpSpeed <= 5 && star.z > 300 && star.z < 700) {
          starCoords.push({ x: px, y: py, alpha });
        }

        ctx.beginPath();
        if (warpSpeed > 5) {
          // Draw warp streak line
          ctx.moveTo(prevPx, prevPy);
          ctx.lineTo(px, py);
          ctx.strokeStyle = star.color;
          ctx.lineWidth = size * (warpSpeed / 12);
          ctx.globalAlpha = alpha;
          ctx.stroke();
        } else {
          // Draw star point
          ctx.arc(px, py, size, 0, Math.PI * 2);
          ctx.fillStyle = star.color;
          ctx.globalAlpha = alpha;
          ctx.fill();
        }
      }
    });
    ctx.globalAlpha = 1;

    // Faint Constellation Web Connections in Orbit
    if (warpSpeed <= 5 && starCoords.length > 0) {
      ctx.strokeStyle = 'rgba(127, 230, 255, 0.07)';
      ctx.lineWidth = 0.8;
      for (let i = 0; i < starCoords.length; i++) {
        for (let j = i + 1; j < starCoords.length; j++) {
          const dx = starCoords[i].x - starCoords[j].x;
          const dy = starCoords[i].y - starCoords[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 90) {
            ctx.beginPath();
            ctx.moveTo(starCoords[i].x, starCoords[i].y);
            ctx.lineTo(starCoords[j].x, starCoords[j].y);
            ctx.globalAlpha = (1 - dist / 90) * 0.15;
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
    }

    // Spawn & Render Shooting Meteors
    spawnMeteor();
    for (let m = meteors.length - 1; m >= 0; m--) {
      const met = meteors[m];
      met.x += Math.cos(met.angle) * met.speed;
      met.y += Math.sin(met.angle) * met.speed;
      met.life++;

      const endX = met.x - Math.cos(met.angle) * met.length;
      const endY = met.y - Math.sin(met.angle) * met.length;

      const grad = ctx.createLinearGradient(met.x, met.y, endX, endY);
      grad.addColorStop(0, met.color);
      grad.addColorStop(1, 'rgba(5, 6, 11, 0)');

      ctx.beginPath();
      ctx.moveTo(met.x, met.y);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      if (met.life >= met.maxLife || met.x > width + 100 || met.y > height + 100) {
        meteors.splice(m, 1);
      }
    }

    // 2. Render Launchpad & Rocket during prelaunch & launching
    if (launchState !== 'orbit' || rocketY > -100) {
      // Draw Launch Pad
      if (padY < height + 100) {
        ctx.fillStyle = '#161b2e';
        ctx.fillRect(cx - 100, padY, 200, 15);
        ctx.fillStyle = '#0f1423';
        ctx.fillRect(cx - 80, padY + 15, 160, 40);
        // Tower grid lines
        ctx.strokeStyle = 'rgba(127, 230, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(cx - 95, padY - 60, 20, 60);
        ctx.strokeRect(cx + 75, padY - 60, 20, 60);
      }

      // Emit plume smoke/flame
      const particleIntensity = launchState === 'launching' ? 2.5 : 1;
      for (let p = 0; p < 3; p++) {
        createPlumeParticle(cx, rocketY + 45, particleIntensity);
      }

      // Draw Rocket
      ctx.save();
      ctx.translate(cx, rocketY);

      // Rocket Body
      ctx.fillStyle = '#f0f4fc';
      ctx.beginPath();
      ctx.moveTo(0, -35);
      ctx.quadraticCurveTo(14, -10, 12, 35);
      ctx.lineTo(-12, 35);
      ctx.quadraticCurveTo(-14, -10, 0, -35);
      ctx.fill();

      // Rocket Nose Cone
      ctx.fillStyle = '#3b86ff';
      ctx.beginPath();
      ctx.moveTo(0, -35);
      ctx.quadraticCurveTo(10, -20, 10, -10);
      ctx.lineTo(-10, -10);
      ctx.quadraticCurveTo(-10, -20, 0, -35);
      ctx.fill();

      // Rocket Window Porthole
      ctx.fillStyle = '#7fe6ff';
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#05060b';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Fins
      ctx.fillStyle = '#1e3f8f';
      ctx.beginPath();
      ctx.moveTo(-12, 20);
      ctx.lineTo(-24, 38);
      ctx.lineTo(-12, 35);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(12, 20);
      ctx.lineTo(24, 38);
      ctx.lineTo(12, 35);
      ctx.fill();

      // Thruster Flame Glow
      const flameLen = launchState === 'launching' ? Math.random() * 40 + 35 : Math.random() * 15 + 15;
      const grad = ctx.createLinearGradient(0, 35, 0, 35 + flameLen);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.3, '#7fe6ff');
      grad.addColorStop(0.7, '#ff9900');
      grad.addColorStop(1, 'rgba(255, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(-8, 35);
      ctx.lineTo(0, 35 + flameLen);
      ctx.lineTo(8, 35);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    // 3. Render Smoke Plume Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life++;
      p.alpha = 1 - p.life / p.maxLife;

      if (p.life >= p.maxLife) {
        particles.splice(i, 1);
        continue;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (1 + p.life / p.maxLife), 0, Math.PI * 2);
      ctx.fillStyle = `${p.color}${p.alpha * 0.7})`;
      ctx.fill();
    }

    requestAnimationFrame(renderScene);
  }
  renderScene();

  /* ---------------------------------------------------------
     3. Precision Reticle Custom Cursor
     --------------------------------------------------------- */
  const dot = document.getElementById('cursor-dot');
  const reticle = document.getElementById('reticle');

  let curX = 0, curY = 0;
  let targetX = 0, targetY = 0;
  let retW = 28, retH = 28;
  let targetW = 28, targetH = 28;
  let lockedElem = null;

  window.addEventListener('pointermove', (e) => {
    targetX = e.clientX;
    targetY = e.clientY;
    dot.style.transform = `translate(${targetX}px, ${targetY}px)`;

    if (!lockedElem) {
      targetW = 28;
      targetH = 28;
    }
  });

  document.addEventListener('pointerover', (e) => {
    const hit = e.target.closest('a, button, .planet-card, .dsn-row, .skills-filter, .modal-close, .modal-btn');
    if (hit) {
      lockedElem = hit;
      reticle.classList.add('locked');
    }
  });

  document.addEventListener('pointerout', (e) => {
    if (lockedElem && !e.relatedTarget?.closest?.('a, button, .planet-card, .dsn-row, .skills-filter, .modal-close, .modal-btn')) {
      lockedElem = null;
      reticle.classList.remove('locked');
    }
  });

  function updateReticle() {
    if (lockedElem) {
      const rect = lockedElem.getBoundingClientRect();
      targetX = rect.left + rect.width / 2;
      targetY = rect.top + rect.height / 2;
      targetW = rect.width + 12;
      targetH = rect.height + 12;
    }

    curX += (targetX - curX) * 0.25;
    curY += (targetY - curY) * 0.25;
    retW += (targetW - retW) * 0.2;
    retH += (targetH - retH) * 0.2;

    reticle.style.width = `${retW}px`;
    reticle.style.height = `${retH}px`;
    reticle.style.transform = `translate(${curX - retW / 2}px, ${curY - retH / 2}px)`;

    requestAnimationFrame(updateReticle);
  }
  updateReticle();

  /* ---------------------------------------------------------
     4. Hero Name Typing Effect
     --------------------------------------------------------- */
  const heroNameEl = document.getElementById('hero-name');
  if (heroNameEl) {
    const text = heroNameEl.dataset.text || "Alex Vance";
    heroNameEl.innerHTML = '';
    text.split('').forEach((char, i) => {
      const span = document.createElement('span');
      span.className = char === ' ' ? 'sp' : 'ch';
      span.textContent = char === ' ' ? ' ' : char;
      span.style.transitionDelay = (i * 0.045).toFixed(3) + 's';
      heroNameEl.appendChild(span);
    });
  }

  /* ---------------------------------------------------------
     5. Procedural 2D Canvas Planet Renderers
     --------------------------------------------------------- */
  const planetCanvases = document.querySelectorAll('.planet-canvas');

  const planetStyles = {
    'p-cup': { baseColor: '#8a6b52', bandColor: '#eab308', ring: true, speed: 0.01 },
    'p-wordle': { baseColor: '#5c6b3f', bandColor: '#9ec468', ring: false, speed: 0.015 },
    'p-drum': { baseColor: '#5a2b30', bandColor: '#ff8c78', ring: false, speed: 0.008 },
    'p-weather': { baseColor: '#1b6fa8', bandColor: '#7fe6ff', ring: true, speed: 0.012 },
    'p-todo': { baseColor: '#5b539c', bandColor: '#c4b5fd', ring: true, speed: 0.009 },
    'p-qr': { baseColor: '#2a1a32', bandColor: '#3b86ff', ring: false, speed: 0.014 }
  };

  planetCanvases.forEach(pCanvas => {
    const worldKey = pCanvas.parentElement.dataset.world;
    const pCtx = pCanvas.getContext('2d');
    const pWidth = pCanvas.width;
    const pHeight = pCanvas.height;
    const radius = pWidth / 2 - 8;
    const config = planetStyles[worldKey] || planetStyles['p-cup'];

    let angle = Math.random() * Math.PI * 2;

    function renderPlanet() {
      pCtx.clearRect(0, 0, pWidth, pHeight);
      angle += config.speed;

      pCtx.save();
      pCtx.translate(pWidth / 2, pHeight / 2);

      // Planet Sphere Fill
      const grad = pCtx.createRadialGradient(-radius * 0.3, -radius * 0.3, radius * 0.1, 0, 0, radius);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.3, config.bandColor);
      grad.addColorStop(0.8, config.baseColor);
      grad.addColorStop(1, '#05060b');

      pCtx.beginPath();
      pCtx.arc(0, 0, radius, 0, Math.PI * 2);
      pCtx.fillStyle = grad;
      pCtx.fill();

      // Atmospheric Ring if enabled
      if (config.ring) {
        pCtx.save();
        pCtx.scale(1, 0.35);
        pCtx.rotate(Math.PI / 6);
        pCtx.beginPath();
        pCtx.arc(0, 0, radius * 1.4, 0, Math.PI * 2);
        pCtx.strokeStyle = config.bandColor;
        pCtx.lineWidth = 4;
        pCtx.globalAlpha = 0.6;
        pCtx.stroke();
        pCtx.restore();
      }

      pCtx.restore();
      requestAnimationFrame(renderPlanet);
    }
    renderPlanet();
  });

  /* ---------------------------------------------------------
     6. Constellation Map Carousel Viewer
     --------------------------------------------------------- */
  const constCanvas = document.getElementById('const-canvas');
  const constCtx = constCanvas ? constCanvas.getContext('2d') : null;
  const constRole = document.getElementById('const-role');
  const constCompany = document.getElementById('const-company');
  const constDate = document.getElementById('const-date');
  const constDesc = document.getElementById('const-desc');
  const constTags = document.getElementById('const-tags');
  const constName = document.getElementById('const-name');
  const constSub = document.getElementById('const-sub');
  const constDotsContainer = document.getElementById('const-dots');

  const experiences = [
    {
      constellation: "Orion Cluster",
      role: "Lead AI Systems Architect",
      company: "Aether AI Labs",
      date: "Jan 2025 — Present",
      desc: "Architected multi-modal autonomous agent framework processing over 5M API requests/day. Integrated WebGL telemetry interfaces for realtime agent inspection.",
      tags: ["Python", "PyTorch", "LLM Agents", "WebGL"]
    },
    {
      constellation: "Cassiopeia Nexus",
      role: "Senior Full-Stack Engineer",
      company: "Stellar Cloud Infrastructure",
      date: "Mar 2024 — Dec 2024",
      desc: "Engineered distributed edge caching service cutting global page load latency by 42%. Built live canvas dashboard for cluster diagnostics.",
      tags: ["TypeScript", "React", "Rust", "AWS"]
    },
    {
      constellation: "Cygnus Gateway",
      role: "Computer Vision Researcher",
      company: "Stanford Vision & Learning Lab",
      date: "Jun 2023 — Feb 2024",
      desc: "Designed zero-shot object tracking pipeline utilizing MediaPipe & RealSense RGB-D sensors for robotic hand manipulation.",
      tags: ["OpenCV", "MediaPipe", "C++", "ROS2"]
    },
    {
      constellation: "Pegasus Array",
      role: "Software Engineering Intern",
      company: "Cosmic Analytics Inc.",
      date: "May 2022 — Aug 2022",
      desc: "Created high-throughput data processing pipeline in Python & PostgreSQL, accelerating batch report generation by 3x.",
      tags: ["Python", "PostgreSQL", "Docker", "FastAPI"]
    }
  ];

  let activeExpIndex = 0;

  function initConstellationDots() {
    if (!constDotsContainer) return;
    constDotsContainer.innerHTML = '';
    experiences.forEach((_, idx) => {
      const dot = document.createElement('div');
      dot.className = `const-dot ${idx === activeExpIndex ? 'active' : ''}`;
      dot.addEventListener('click', () => setExperience(idx));
      constDotsContainer.appendChild(dot);
    });
  }
  initConstellationDots();

  function setExperience(idx) {
    activeExpIndex = idx;
    const exp = experiences[idx];

    constRole.textContent = exp.role;
    constCompany.textContent = exp.company;
    constDate.textContent = exp.date;
    constDesc.textContent = exp.desc;
    constName.textContent = exp.constellation;
    constSub.textContent = `${idx + 1} of ${experiences.length}`;

    constTags.innerHTML = '';
    exp.tags.forEach(t => {
      const tagSpan = document.createElement('span');
      tagSpan.textContent = t;
      constTags.appendChild(tagSpan);
    });

    document.querySelectorAll('.const-dot').forEach((d, i) => {
      d.classList.toggle('active', i === idx);
    });

    renderConstellationCanvas();
  }

  document.getElementById('const-prev')?.addEventListener('click', () => {
    setExperience((activeExpIndex - 1 + experiences.length) % experiences.length);
  });

  document.getElementById('const-next')?.addEventListener('click', () => {
    setExperience((activeExpIndex + 1) % experiences.length);
  });

  function renderConstellationCanvas() {
    if (!constCanvas || !constCtx) return;

    const cW = constCanvas.width = constCanvas.parentElement.clientWidth;
    const cH = constCanvas.height = constCanvas.parentElement.clientHeight;

    constCtx.clearRect(0, 0, cW, cH);

    // Generate constellation nodes based on activeExpIndex
    const seed = activeExpIndex * 10;
    const nodes = [
      { x: cW * 0.2, y: cH * 0.3 },
      { x: cW * 0.4, y: cH * 0.2 },
      { x: cW * 0.65, y: cH * 0.35 },
      { x: cW * 0.8, y: cH * 0.25 },
      { x: cW * 0.5, y: cH * 0.55 },
      { x: cW * 0.35, y: cH * 0.7 }
    ];

    // Draw lines
    constCtx.beginPath();
    constCtx.moveTo(nodes[0].x, nodes[0].y);
    for (let i = 1; i < nodes.length; i++) {
      constCtx.lineTo(nodes[i].x, nodes[i].y);
    }
    constCtx.strokeStyle = 'rgba(127, 230, 255, 0.4)';
    constCtx.lineWidth = 1.5;
    constCtx.setLineDash([4, 6]);
    constCtx.stroke();
    constCtx.setLineDash([]);

    // Draw Glowing Star Nodes
    nodes.forEach((n, i) => {
      constCtx.beginPath();
      constCtx.arc(n.x, n.y, i === 0 ? 7 : 4, 0, Math.PI * 2);
      constCtx.fillStyle = '#7fe6ff';
      constCtx.shadowColor = '#7fe6ff';
      constCtx.shadowBlur = 12;
      constCtx.fill();
      constCtx.shadowBlur = 0;
    });
  }

  renderConstellationCanvas();
  window.addEventListener('resize', renderConstellationCanvas);

  /* ---------------------------------------------------------
     7. 3D Interactive Skill Cloud Sphere with Inertial Drag
     --------------------------------------------------------- */
  const cloudStage = document.getElementById('cloud-stage');
  const cloudSphere = document.getElementById('cloud-sphere');
  const cloudTags = Array.from(document.querySelectorAll('.cloud-tag'));

  let radius = 180;
  let velX = 0.002;
  let velY = 0.002;
  let isDragging = false;
  let lastMouseX = 0, lastMouseY = 0;

  // Distribute tags on sphere surface
  const tagObjects = cloudTags.map((tag, i) => {
    const phi = Math.acos(-1 + (2 * i + 1) / cloudTags.length);
    const theta = Math.sqrt(cloudTags.length * Math.PI) * phi;
    return {
      el: tag,
      x: radius * Math.cos(theta) * Math.sin(phi),
      y: radius * Math.sin(theta) * Math.sin(phi),
      z: radius * Math.cos(phi)
    };
  });

  function updateTagPositions() {
    // Inertial velocity decay when not dragging
    if (!isDragging) {
      velX *= 0.96;
      velY *= 0.96;
      if (Math.abs(velX) < 0.001) velX = 0.002;
      if (Math.abs(velY) < 0.001) velY = 0.002;
    }

    const cosX = Math.cos(velX);
    const sinX = Math.sin(velX);
    const cosY = Math.cos(velY);
    const sinY = Math.sin(velY);

    tagObjects.forEach(obj => {
      // Rotation around Y
      const rx1 = obj.x * cosY - obj.z * sinY;
      const rz1 = obj.z * cosY + obj.x * sinY;

      // Rotation around X
      const ry2 = obj.y * cosX - rz1 * sinX;
      const rz2 = rz1 * cosX + obj.y * sinX;

      obj.x = rx1;
      obj.y = ry2;
      obj.z = rz2;

      // Perspective projection
      const scale = (rz2 + radius * 2) / (radius * 3);
      const alpha = (rz2 + radius) / (radius * 2);

      obj.el.style.transform = `translate(-50%, -50%) translate3d(${rx1}px, ${ry2}px, 0px) scale(${Math.max(0.6, scale)})`;
      obj.el.style.opacity = Math.max(0.25, alpha);
      obj.el.style.zIndex = Math.floor(rz2 + radius);
    });

    requestAnimationFrame(updateTagPositions);
  }
  updateTagPositions();

  // Pointer & Touch Drag rotation logic
  if (cloudStage) {
    const startDrag = (e) => {
      isDragging = true;
      const pt = e.touches ? e.touches[0] : e;
      lastMouseX = pt.clientX;
      lastMouseY = pt.clientY;
      cloudStage.style.cursor = 'grabbing';
    };

    const moveDrag = (e) => {
      if (!isDragging) return;
      const pt = e.touches ? e.touches[0] : e;
      const dx = pt.clientX - lastMouseX;
      const dy = pt.clientY - lastMouseY;

      velY = -dx * 0.005;
      velX = -dy * 0.005;

      lastMouseX = pt.clientX;
      lastMouseY = pt.clientY;
    };

    const stopDrag = () => {
      isDragging = false;
      if (cloudStage) cloudStage.style.cursor = 'grab';
    };

    cloudStage.addEventListener('pointerdown', startDrag);
    window.addEventListener('pointermove', moveDrag);
    window.addEventListener('pointerup', stopDrag);
    window.addEventListener('pointercancel', stopDrag);

    cloudStage.addEventListener('touchstart', startDrag, { passive: true });
    window.addEventListener('touchmove', moveDrag, { passive: true });
    window.addEventListener('touchend', stopDrag);
  }

  // Category Filtering
  const filterBtns = document.querySelectorAll('.skills-filter');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const cat = btn.dataset.filter;
      cloudTags.forEach(t => {
        if (cat === 'all' || t.dataset.cat === cat) {
          t.classList.remove('dimmed');
        } else {
          t.classList.add('dimmed');
        }
      });
    });
  });

  /* ---------------------------------------------------------
     8. Scroll Reveal IntersectionObserver Engine
     --------------------------------------------------------- */
  function initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, { threshold: 0.12 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  }
  initScrollReveal();

});

/* ---------------------------------------------------------
   9. Modal Dialog Controller
   --------------------------------------------------------- */
const projectData = {
  'p-cup': {
    title: 'AI World Cup Predictor',
    badge: 'MACHINE LEARNING · STREAMLIT',
    body: 'An intelligent sports forecasting web platform powered by XGBoost classifier models and 10,000 Monte Carlo tournament iterations. Features real-time odds calculations and live team stats visualization.',
    link: 'https://streamlit.io'
  },
  'p-wordle': {
    title: 'Spatial Wordle Engine',
    badge: 'WEBGL · SOUND SYNTHESIS',
    body: 'A 3D interactive remake of the NYT word-guessing game featuring dynamic particle tile flips, procedural spatial sound feedback, and customizable dictionary solvers.',
    link: '#'
  },
  'p-drum': {
    title: 'Audio Drum Kit Synthesizer',
    badge: 'WEB AUDIO API · TACTILE UX',
    body: 'A tactile browser-based acoustic drum synthesizer using Web Audio API nodes with customizable decay envelope controls and dynamic reactive lighting effects.',
    link: '#'
  },
  'p-weather': {
    title: 'Atmospheric Radar Telemetry',
    badge: 'LIVE API · CANVAS VISUALIZER',
    body: 'Global atmospheric telemetry dashboard fetching live meteorological satellite feeds, multi-layered storm maps, and 7-day temperature trends.',
    link: '#'
  },
  'p-todo': {
    title: 'Quantum Task Core',
    badge: 'OFFLINE FIRST · REACT',
    body: 'Ultra-minimalist task management workstation engineered with local IndexedDB storage, keyboard shortcuts, and priority matrix grouping.',
    link: '#'
  },
  'p-qr': {
    title: 'Matrix QR Code Generator',
    badge: 'VECTOR SVG · ENCRYPTION',
    body: 'High-density encrypted QR code generator supporting SVG/PNG vector exports, logo embedding, and custom gradient error-correction matrices.',
    link: '#'
  }
};

function openProjectModal(key) {
  const data = projectData[key];
  if (!data) return;

  const backdrop = document.getElementById('modal-backdrop');
  if (!backdrop) return;

  document.getElementById('modal-badge').textContent = data.badge;
  document.getElementById('modal-title').textContent = data.title;
  document.getElementById('modal-body').innerHTML = `<p>${data.body}</p>`;
  document.getElementById('modal-link').href = data.link;

  backdrop.classList.add('active');
}

function openReportModal(title, desc, format) {
  const backdrop = document.getElementById('modal-backdrop');
  if (!backdrop) return;

  document.getElementById('modal-badge').textContent = `DEEP SPACE TELEMETRY · ${format}`;
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = `<p>${desc}</p><br><p style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--accent-cyan);">Packet Integrity: 100% verified · Encryption SHA-256</p>`;
  document.getElementById('modal-link').href = '#';

  backdrop.classList.add('active');
}

function closeModal(e) {
  const backdrop = document.getElementById('modal-backdrop');
  if (backdrop) backdrop.classList.remove('active');
  lockedElem = null;
  reticle.classList.remove('locked');
}

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
  }
});
