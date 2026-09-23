/**
 * SkyUdaan Ultimate Photorealistic 3D Engineering Experience (Awwwards-Grade)
 * Physically Based Rendering (PBR) Engine Features:
 * - Three.js MeshPhysicalMaterial with Clearcoat, Anisotropy, & sRGB Tone Mapping
 * - Procedural HDR Studio Environment (PMREMGenerator) with High-Contrast Softboxes & Linear Strip Lights
 * - Interactive 3D CAD Engineering Dimension Leaders (Length, Diameter, Saddle C/C)
 * - 4 Orthographic & Isometric Camera Presets ([3D ISO], [FRONT GA], [TOP PLAN], [SIDE PROFILE])
 * - 3 Studio Lighting Modes ([Studio Daylight], [Sunset Workshop], [CAD Blueprint])
 * - Silky Cinematic Idle Turntable Auto-Spin (Pauses on user interaction)
 * - Procedural Micro-Scratch Anisotropic Normal Maps for Brushed Mill Rolling Grain
 * - Concentric Spin Normal Maps for Hydraulic Cold-Spun Torispherical Dished Heads
 * - Realistic Submerged Arc Weld (SAW) Scalloped Bead Ripples with Heat-Affected Zone (HAZ) Temper Tint
 * - High-Resolution Engineering Decal Markings: ASME "U" Stamp, PESO Certification, Metric Capacity, NFPA Diamond
 * - Detailed ANSI B16.5 Flanges with Serrated Raised Faces, Spiral-Wound Gaskets, & Chamfered Hex Studs
 * - Reinforcement Repads with ASME UG-40 Inspection Weep Holes & Dual Rigging Lugs
 * - 3 Real-Time Switchable Models (Horizontal Vessel, Jacketed Reactor, Bulk Silo)
 * - Interactive Exploded View with Pneumatic Spring Disassembly
 * - Dynamic Liquid Sloshing Simulation with Interactive Fill Levels (0%, 50%, 100%)
 * - Web Audio API Synthesizer for Mechanical Haptic Feedback
 */

(function () {
  let scene, camera, renderer, pmremGenerator;
  let activeModelGroup, currentModelType = 'horizontal';
  let horizontalGroup, reactorGroup, siloGroup;
  let shadowMesh, fluidMesh, fluidMaterial;
  let dimensionsGroup;
  let showDimensions = true;
  let isExploded = false;
  let explodeProgress = 0;
  let targetExplodeProgress = 0;
  let fillLevel = 0.5;
  let targetFillLevel = 0.5;
  let fluidClock = 0;
  let audioEnabled = false;
  let audioCtx = null;

  let keyLight, rimLight, bounceLight, glintLight;
  let currentLightingMode = 'daylight'; // 'daylight' | 'sunset' | 'blueprint'

  let targetProgress = 0;
  let currentProgress = 0;
  let isDragging = false;
  let previousMousePosition = { x: 0, y: 0 };
  let manualRotation = { x: 0, y: 0 };
  let currentFinish = 'stainless';

  let activeOrthoPreset = null;
  let lastUserInteractionTime = Date.now();

  const orthoPresetNodes = {
    iso: { camPos: { x: 22, y: 8.5, z: 22 }, target: { x: 0, y: 0, z: 0 }, tankRot: { x: 0.02, y: -0.28, z: 0 } },
    front: { camPos: { x: 0, y: 0.5, z: 27 }, target: { x: 0, y: 0.5, z: 0 }, tankRot: { x: 0, y: 0, z: 0 } },
    top: { camPos: { x: 0, y: 28, z: 0.01 }, target: { x: 0, y: 0, z: 0 }, tankRot: { x: 0, y: 0, z: 0 } },
    end: { camPos: { x: -27, y: 0.5, z: 0 }, target: { x: 0, y: 0.5, z: 0 }, tankRot: { x: 0, y: 0, z: 0 } }
  };

  const explodeParts = [];

  const scrollContainer = document.getElementById('heroScrollContainer');
  const stickyViewport = document.getElementById('heroStickyViewport');
  const canvas = document.getElementById('vessel3DCanvas');

  if (!canvas || !scrollContainer) return;

  const cameraNodes = [
    {
      progress: 0.0,
      camPos: { x: 21, y: 7.5, z: 23 },
      target: { x: -4.5, y: -0.2, z: 0 },
      tankRot: { x: 0.02, y: -0.25, z: 0 },
      activeHotspot: null
    },
    {
      progress: 0.25,
      camPos: { x: -16, y: 2.2, z: 10 },
      target: { x: -8.8, y: 0.2, z: 0 },
      tankRot: { x: 0.05, y: 0.22, z: 0 },
      activeHotspot: 'pin-head'
    },
    {
      progress: 0.50,
      camPos: { x: -2.5, y: 3.8, z: 8.5 },
      target: { x: -3.8, y: 1.2, z: 0 },
      tankRot: { x: 0.12, y: 0.72, z: 0.02 },
      activeHotspot: 'pin-weld'
    },
    {
      progress: 0.75,
      camPos: { x: 6.0, y: 11.5, z: 10.5 },
      target: { x: 2.5, y: 4.8, z: 0 },
      tankRot: { x: -0.28, y: 0.08, z: 0 },
      activeHotspot: 'pin-manway'
    },
    {
      progress: 1.0,
      camPos: { x: 13, y: -2.8, z: 15 },
      target: { x: 4.8, y: -3.6, z: 0 },
      tankRot: { x: 0.18, y: -0.45, z: 0 },
      activeHotspot: 'pin-saddle'
    }
  ];

  const hotspotAnchors = {
    'pin-head': new THREE.Vector3(-9.5, 0.5, 1.2),
    'pin-weld': new THREE.Vector3(-4.0, 2.8, 2.9),
    'pin-manway': new THREE.Vector3(0, 5.8, 0),
    'pin-saddle': new THREE.Vector3(5.2, -4.8, 3.2)
  };

  let materials = {};

  /* ==========================================================================
     Web Audio API Sound Synthesizer
     ========================================================================== */
  function playMechanicalSound(type) {
    if (!audioEnabled) return;
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();

      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      if (type === 'pneumatic') {
        const bufferSize = audioCtx.sampleRate * 0.14;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1400, now);
        filter.Q.setValueAtTime(2.2, now);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);
        noise.start(now);
      } else if (type === 'sonar') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1760, now + 0.08);
        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.23);
      } else {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(type === 'click' ? 1900 : 2600, now);
        osc.frequency.exponentialRampToValueAtTime(type === 'click' ? 450 : 800, now + 0.04);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
      }
    } catch (e) {}
  }

  function init() {
    if (typeof THREE === 'undefined') {
      setTimeout(init, 100);
      return;
    }

    const width = stickyViewport.clientWidth || window.innerWidth;
    const height = stickyViewport.clientHeight || window.innerHeight;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf6f8fa);

    camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 1000);
    camera.position.set(cameraNodes[0].camPos.x, cameraNodes[0].camPos.y, cameraNodes[0].camPos.z);
    camera.lookAt(cameraNodes[0].target.x, cameraNodes[0].target.y, cameraNodes[0].target.z);

    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    if (THREE.sRGBEncoding) {
      renderer.outputEncoding = THREE.sRGBEncoding;
    }
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    generateStudioEnvironment();
    setupStudioLighting();

    buildVesselMaterials();
    buildHorizontalVessel();
    buildChemicalReactor();
    buildCementSilo();

    activeModelGroup = horizontalGroup;
    scene.add(horizontalGroup);

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    setupInteractiveDrag();
    setupHotspotInteractions();
    setupFinishSwitcher();
    setupChapterScrubButtons();
    setupAdvancedControls();
    setupOrthoViews();
    setupLightingModeSwitcher();

    onScroll();
    renderLoop();
  }

  /* ==========================================================================
     High-Dynamic-Range Studio Environment Map Generator
     ========================================================================== */
  function generateStudioEnvironment() {
    pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    const envWidth = 1024;
    const envHeight = 512;
    const envCanvas = document.createElement('canvas');
    envCanvas.width = envWidth;
    envCanvas.height = envHeight;
    const ctx = envCanvas.getContext('2d');

    const bgGrad = ctx.createLinearGradient(0, 0, 0, envHeight);
    bgGrad.addColorStop(0, '#f2f5f8');
    bgGrad.addColorStop(0.4, '#e1e7ee');
    bgGrad.addColorStop(1, '#b8c3d2');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, envWidth, envHeight);

    // Primary High-Key Softbox
    const softbox1 = ctx.createRadialGradient(700, 140, 10, 700, 140, 260);
    softbox1.addColorStop(0, '#ffffff');
    softbox1.addColorStop(0.3, 'rgba(255, 255, 255, 0.98)');
    softbox1.addColorStop(0.7, 'rgba(235, 245, 255, 0.5)');
    softbox1.addColorStop(1, 'rgba(210, 225, 245, 0)');
    ctx.fillStyle = softbox1;
    ctx.fillRect(400, 0, 600, 340);

    // Dual Longitudinal Overhead Strip Lights
    const stripGrad1 = ctx.createLinearGradient(0, 50, 0, 110);
    stripGrad1.addColorStop(0, 'rgba(255, 255, 255, 0)');
    stripGrad1.addColorStop(0.5, '#ffffff');
    stripGrad1.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = stripGrad1;
    ctx.fillRect(0, 50, envWidth, 60);

    const stripGrad2 = ctx.createLinearGradient(0, 130, 0, 170);
    stripGrad2.addColorStop(0, 'rgba(240, 245, 255, 0)');
    stripGrad2.addColorStop(0.5, 'rgba(255, 255, 255, 0.7)');
    stripGrad2.addColorStop(1, 'rgba(240, 245, 255, 0)');
    ctx.fillStyle = stripGrad2;
    ctx.fillRect(0, 130, envWidth, 40);

    // Cold Rim Light
    const rimGrad = ctx.createRadialGradient(160, 220, 10, 160, 220, 200);
    rimGrad.addColorStop(0, '#ffffff');
    rimGrad.addColorStop(0.4, 'rgba(220, 235, 255, 0.8)');
    rimGrad.addColorStop(1, 'rgba(180, 205, 240, 0)');
    ctx.fillStyle = rimGrad;
    ctx.fillRect(0, 80, 360, 300);

    // Warm Architectural Floor Bounce
    const floorGrad = ctx.createLinearGradient(0, 360, 0, envHeight);
    floorGrad.addColorStop(0, 'rgba(240, 245, 252, 0)');
    floorGrad.addColorStop(1, 'rgba(195, 205, 220, 0.85)');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, 360, envWidth, 152);

    const envTexture = new THREE.CanvasTexture(envCanvas);
    envTexture.mapping = THREE.EquirectangularReflectionMapping;
    const renderTarget = pmremGenerator.fromEquirectangular(envTexture);
    scene.environment = renderTarget.texture;
  }

  function setupStudioLighting() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambient);

    keyLight = new THREE.DirectionalLight(0xfffdfa, 1.45);
    keyLight.position.set(18, 28, 22);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 85;
    keyLight.shadow.bias = -0.0003;
    scene.add(keyLight);

    rimLight = new THREE.DirectionalLight(0x0047ff, 0.5);
    rimLight.position.set(-22, 12, -18);
    scene.add(rimLight);

    bounceLight = new THREE.DirectionalLight(0xe8edf5, 0.65);
    bounceLight.position.set(0, -15, 8);
    scene.add(bounceLight);

    glintLight = new THREE.PointLight(0xffffff, 0.6, 25);
    glintLight.position.set(0, 8, 8);
    scene.add(glintLight);

    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 512;
    shadowCanvas.height = 512;
    const sCtx = shadowCanvas.getContext('2d');

    const sGrad1 = sCtx.createRadialGradient(256, 256, 20, 256, 256, 220);
    sGrad1.addColorStop(0, 'rgba(15, 23, 42, 0.42)');
    sGrad1.addColorStop(0.35, 'rgba(15, 23, 42, 0.18)');
    sGrad1.addColorStop(0.75, 'rgba(15, 23, 42, 0.04)');
    sGrad1.addColorStop(1, 'rgba(15, 23, 42, 0)');
    sCtx.fillStyle = sGrad1;
    sCtx.fillRect(0, 0, 512, 512);

    sCtx.fillStyle = 'rgba(15, 23, 42, 0.65)';
    sCtx.filter = 'blur(6px)';
    sCtx.fillRect(110, 230, 40, 52);
    sCtx.fillRect(362, 230, 40, 52);
    sCtx.filter = 'none';

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowGeom = new THREE.PlaneGeometry(38, 20);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false
    });
    shadowMesh = new THREE.Mesh(shadowGeom, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -5.85;
    scene.add(shadowMesh);

    const grid = new THREE.GridHelper(44, 22, 0x0047ff, 0xe5e7eb);
    grid.position.y = -5.88;
    grid.material.opacity = 0.45;
    grid.material.transparent = true;
    scene.add(grid);
  }

  function createBrushedSteelNormalMap() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(size, size);
    const data = imgData.data;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        const noise = Math.sin(y * 1.8) * 0.12 + (Math.random() - 0.5) * 0.15;
        data[idx] = 128;
        data[idx + 1] = Math.floor((noise * 0.5 + 0.5) * 255);
        data[idx + 2] = 255;
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(8, 4);
    return texture;
  }

  function createConcentricSpinNormalMap() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(size, size);
    const data = imgData.data;
    const cx = size / 2, cy = size / 2;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        const dx = x - cx, dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const spinRing = Math.sin(dist * 0.8) * 0.18;
        data[idx] = Math.floor(((spinRing * (dy / (dist || 1))) * 0.5 + 0.5) * 255);
        data[idx + 1] = Math.floor(((-spinRing * (dx / (dist || 1))) * 0.5 + 0.5) * 255);
        data[idx + 2] = 255;
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
    return new THREE.CanvasTexture(canvas);
  }

  function createWeldBeadTexture() {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#7a8898';
    ctx.fillRect(0, 0, size, size);

    for (let x = 0; x < size; x += 12) {
      const grad = ctx.createLinearGradient(x, 0, x + 12, 0);
      grad.addColorStop(0, 'rgba(100, 115, 130, 0.8)');
      grad.addColorStop(0.5, 'rgba(160, 180, 205, 0.95)');
      grad.addColorStop(1, 'rgba(80, 95, 110, 0.8)');
      ctx.fillStyle = grad;
      ctx.fillRect(x, 0, 12, size);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x + 6, size / 2, size * 0.45, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
    }

    const topTint = ctx.createLinearGradient(0, 0, 0, 24);
    topTint.addColorStop(0, 'rgba(30, 70, 140, 0.6)');
    topTint.addColorStop(0.5, 'rgba(120, 40, 100, 0.4)');
    topTint.addColorStop(1, 'rgba(180, 120, 40, 0.2)');
    ctx.fillStyle = topTint;
    ctx.fillRect(0, 0, size, 24);

    const btmTint = ctx.createLinearGradient(0, size - 24, 0, size);
    btmTint.addColorStop(0, 'rgba(180, 120, 40, 0.2)');
    btmTint.addColorStop(0.5, 'rgba(120, 40, 100, 0.4)');
    btmTint.addColorStop(1, 'rgba(30, 70, 140, 0.6)');
    ctx.fillStyle = btmTint;
    ctx.fillRect(0, size - 24, size, 24);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.repeat.set(16, 1);
    return tex;
  }

  function createShellDecalTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 1024, 512);

    ctx.strokeStyle = 'rgba(15, 23, 42, 0.65)';
    ctx.lineWidth = 4;
    ctx.strokeRect(60, 60, 904, 392);

    ctx.strokeStyle = '#0047ff';
    ctx.lineWidth = 6;
    ctx.beginPath();
    const hx = 160, hy = 256, hr = 70;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const px = hx + Math.cos(a) * hr;
      const py = hy + Math.sin(a) * hr;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.font = 'bold 72px sans-serif';
    ctx.fillStyle = '#0047ff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('U', hx, hy);

    ctx.fillStyle = '#111827';
    ctx.textAlign = 'left';
    ctx.font = 'bold 36px monospace';
    ctx.fillText('SKYUDAAN EN-FAB PVT LTD', 280, 130);

    ctx.font = 'bold 24px monospace';
    ctx.fillStyle = '#4b5563';
    ctx.fillText('MANUFACTURING FACILITY: BENGALURU, INDIA', 280, 175);
    ctx.fillText('DESIGN CODE: ASME SEC VIII DIV 1 (2023 ED.)', 280, 215);
    ctx.fillText('PESO APPROVAL: SMPV(U) RULES - 2016', 280, 255);
    ctx.fillText('VESSEL TAG: TK-301 // SERIAL NO: SU-2024-8891', 280, 295);

    ctx.fillStyle = '#0047ff';
    ctx.fillText('CAPACITY: 30,000 L', 280, 350);
    ctx.fillText('DESIGN PR: 12.5 BAR', 580, 350);
    ctx.fillText('TEST PR: 18.75 BAR', 280, 390);
    ctx.fillText('TARE WT: 6,420 KG', 580, 390);

    const nx = 880, ny = 256, nr = 50;
    ctx.save();
    ctx.translate(nx, ny);
    ctx.rotate(Math.PI / 4);

    ctx.fillStyle = '#ef4444'; ctx.fillRect(-nr/2, -nr/2, nr/2, nr/2);
    ctx.fillStyle = '#3b82f6'; ctx.fillRect(-nr/2, 0, nr/2, nr/2);
    ctx.fillStyle = '#eab308'; ctx.fillRect(0, -nr/2, nr/2, nr/2);
    ctx.fillStyle = '#f3f4f6'; ctx.fillRect(0, 0, nr/2, nr/2);
    ctx.restore();

    return new THREE.CanvasTexture(canvas);
  }

  function createFeaStressTexture() {
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = 512;
    const ctx = c.getContext('2d');

    // Base hoop membrane stress gradient (0 to 110 MPa, deep indigo to cyan)
    const baseGrad = ctx.createLinearGradient(0, 0, 1024, 0);
    baseGrad.addColorStop(0, '#001a70');
    baseGrad.addColorStop(0.12, '#0055bb');
    baseGrad.addColorStop(0.28, '#00b499');
    baseGrad.addColorStop(0.5, '#0066aa');
    baseGrad.addColorStop(0.72, '#00b499');
    baseGrad.addColorStop(0.88, '#0055bb');
    baseGrad.addColorStop(1, '#001a70');
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, 1024, 512);

    // Subtle horizontal stress distribution bands
    for (let y = 0; y < 512; y += 48) {
      ctx.fillStyle = 'rgba(0, 255, 200, 0.06)';
      ctx.fillRect(0, y, 1024, 20);
    }

    function drawStressHotspot(x, y, r) {
      const grad = ctx.createRadialGradient(x, y, 4, x, y, r);
      grad.addColorStop(0, '#ff1100'); // Peak: 208.4 MPa
      grad.addColorStop(0.22, '#ff6600'); // 175 MPa
      grad.addColorStop(0.45, '#ffee00'); // 140 MPa
      grad.addColorStop(0.72, '#00ee44'); // 105 MPa
      grad.addColorStop(1, 'rgba(0, 100, 200, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // High peak von Mises stress at Saddle Horn corners (Zick analysis)
    drawStressHotspot(280, 140, 110);
    drawStressHotspot(280, 370, 110);
    drawStressHotspot(744, 140, 110);
    drawStressHotspot(744, 370, 110);

    // Stress concentration rings around Process Nozzle cutouts
    drawStressHotspot(512, 256, 80);
    drawStressHotspot(360, 256, 60);
    drawStressHotspot(660, 256, 60);

    // Iso-stress contour lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 1024; x += 32) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 512); ctx.stroke();
    }
    for (let y = 0; y < 512; y += 32) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1024, y); ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }

  function buildVesselMaterials() {
    const brushedNormal = createBrushedSteelNormalMap();
    const spinNormal = createConcentricSpinNormalMap();
    const weldTex = createWeldBeadTexture();
    const feaTex = createFeaStressTexture();

    materials.stainlessShell = new THREE.MeshPhysicalMaterial({
      color: 0xc8d0da,
      metalness: 0.95,
      roughness: 0.24,
      normalMap: brushedNormal,
      normalScale: new THREE.Vector2(0.35, 0.35),
      clearcoat: 0.38,
      clearcoatRoughness: 0.12,
      reflectivity: 0.95,
      envMapIntensity: 1.45
    });

    materials.stainlessHead = new THREE.MeshPhysicalMaterial({
      color: 0xc8d0da,
      metalness: 0.95,
      roughness: 0.22,
      normalMap: spinNormal,
      normalScale: new THREE.Vector2(0.4, 0.4),
      clearcoat: 0.42,
      clearcoatRoughness: 0.1,
      reflectivity: 0.95,
      envMapIntensity: 1.45
    });

    materials.blueShell = new THREE.MeshPhysicalMaterial({
      color: 0x145dbb,
      metalness: 0.15,
      roughness: 0.2,
      clearcoat: 0.85,
      clearcoatRoughness: 0.08,
      reflectivity: 0.85,
      envMapIntensity: 1.25
    });

    materials.primerShell = new THREE.MeshStandardMaterial({
      color: 0xb5432a,
      metalness: 0.25,
      roughness: 0.52,
      envMapIntensity: 0.95
    });

    materials.flangeHardware = new THREE.MeshPhysicalMaterial({
      color: 0xecf2f8,
      metalness: 0.98,
      roughness: 0.14,
      clearcoat: 0.6,
      clearcoatRoughness: 0.08,
      reflectivity: 1.0,
      envMapIntensity: 1.6
    });

    materials.weldBead = new THREE.MeshStandardMaterial({
      map: weldTex,
      metalness: 0.92,
      roughness: 0.36,
      envMapIntensity: 1.2
    });

    materials.structuralSteel = new THREE.MeshStandardMaterial({
      color: 0x1e2633,
      metalness: 0.7,
      roughness: 0.46,
      envMapIntensity: 0.85
    });

    materials.gasketMaterial = new THREE.MeshStandardMaterial({
      color: 0xeab308,
      metalness: 0.4,
      roughness: 0.5
    });

    materials.xrayMaterial = new THREE.MeshStandardMaterial({
      color: 0x0047ff,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
      metalness: 0.5,
      roughness: 0.5
    });

    materials.feaStress = new THREE.MeshPhysicalMaterial({
      map: feaTex,
      roughness: 0.35,
      metalness: 0.15,
      clearcoat: 0.45,
      clearcoatRoughness: 0.1,
      reflectivity: 0.7,
      envMapIntensity: 0.95
    });

    materials.internalSteel = new THREE.MeshStandardMaterial({
      color: 0x5a6878,
      metalness: 0.8,
      roughness: 0.4,
      side: THREE.DoubleSide
    });

    fluidMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x0066ff,
      metalness: 0.1,
      roughness: 0.08,
      transmission: 0.75,
      transparent: true,
      opacity: 0.68,
      ior: 1.33
    });
  }

  /* ==========================================================================
     Interactive 3D CAD Engineering Dimension Leaders (Length, Dia, C/C)
     ========================================================================== */
  function createDimensionSprite(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(10, 15, 30, 0.85)';
    ctx.roundRect(16, 16, 480, 96, 16);
    ctx.fill();

    ctx.strokeStyle = '#0047ff';
    ctx.lineWidth = 3;
    ctx.roundRect(16, 16, 480, 96, 16);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 38px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 64);

    const tex = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(4.2, 1.05, 1);
    return sprite;
  }

  function buildDimensionsCallouts() {
    dimensionsGroup = new THREE.Group();
    const lineMat = new THREE.LineBasicMaterial({ color: 0x0047ff, linewidth: 2, transparent: true, opacity: 0.8 });

    // 1. Overall Length Leader (8,400 mm)
    const lenPoints = [
      new THREE.Vector3(-8.2, 5.8, 0),
      new THREE.Vector3(8.2, 5.8, 0)
    ];
    const lenGeom = new THREE.BufferGeometry().setFromPoints(lenPoints);
    const lenLine = new THREE.Line(lenGeom, lineMat);
    dimensionsGroup.add(lenLine);

    // End witness tick lines
    const tick1Points = [new THREE.Vector3(-8.2, 5.2, 0), new THREE.Vector3(-8.2, 6.4, 0)];
    dimensionsGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(tick1Points), lineMat));
    const tick2Points = [new THREE.Vector3(8.2, 5.2, 0), new THREE.Vector3(8.2, 6.4, 0)];
    dimensionsGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(tick2Points), lineMat));

    const lenLabel = createDimensionSprite('L: 8,400 mm OAL');
    lenLabel.position.set(0, 6.6, 0);
    dimensionsGroup.add(lenLabel);

    // 2. Diameter Leader (Ø 2,800 mm)
    const diaPoints = [
      new THREE.Vector3(-10.4, -4.2, 0),
      new THREE.Vector3(-10.4, 4.2, 0)
    ];
    const diaLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(diaPoints), lineMat);
    dimensionsGroup.add(diaLine);

    const diaTick1 = [new THREE.Vector3(-9.8, -4.2, 0), new THREE.Vector3(-11.0, -4.2, 0)];
    dimensionsGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(diaTick1), lineMat));
    const diaTick2 = [new THREE.Vector3(-9.8, 4.2, 0), new THREE.Vector3(-11.0, 4.2, 0)];
    dimensionsGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(diaTick2), lineMat));

    const diaLabel = createDimensionSprite('Ø 2,800 mm ID');
    diaLabel.position.set(-10.4, 0, 0);
    dimensionsGroup.add(diaLabel);

    // 3. Saddle C/C Spacing (5,400 mm)
    const saddlePoints = [
      new THREE.Vector3(-5.4, -6.6, 0),
      new THREE.Vector3(5.4, -6.6, 0)
    ];
    const saddleLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(saddlePoints), lineMat);
    dimensionsGroup.add(saddleLine);

    const saddleLabel = createDimensionSprite('5,400 mm C/C SADDLES');
    saddleLabel.position.set(0, -7.2, 0);
    dimensionsGroup.add(saddleLabel);

    horizontalGroup.add(dimensionsGroup);
  }

  /* ==========================================================================
     MODEL 1: Horizontal ASME Vessel (30kL)
     ========================================================================== */
  function buildHorizontalVessel() {
    horizontalGroup = new THREE.Group();
    const shellLength = 16.4;
    const shellRadius = 4.2;
    const headDepth = 2.4;

    const shellGeom = new THREE.CylinderGeometry(shellRadius, shellRadius, shellLength, 64, 4, true);
    shellGeom.rotateZ(Math.PI / 2);
    const shellMesh = new THREE.Mesh(shellGeom, materials.stainlessShell);
    shellMesh.castShadow = true;
    shellMesh.receiveShadow = true;
    horizontalGroup.add(shellMesh);

    const decalTex = createShellDecalTexture();
    const decalGeom = new THREE.CylinderGeometry(shellRadius + 0.02, shellRadius + 0.02, 6.4, 32, 1, true, -Math.PI / 3, (2 * Math.PI) / 3);
    decalGeom.rotateZ(Math.PI / 2);
    decalGeom.rotateX(Math.PI / 2);
    const decalMat = new THREE.MeshBasicMaterial({
      map: decalTex,
      transparent: true,
      depthWrite: false
    });
    const decalMesh = new THREE.Mesh(decalGeom, decalMat);
    decalMesh.position.set(0, 0, shellRadius * 0.4);
    horizontalGroup.add(decalMesh);

    const headGeom = new THREE.SphereGeometry(shellRadius, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2);
    const leftHead = new THREE.Mesh(headGeom, materials.stainlessHead);
    leftHead.position.set(-shellLength / 2, 0, 0);
    leftHead.rotation.z = Math.PI / 2;
    leftHead.scale.set(1, headDepth / shellRadius, 1);
    leftHead.castShadow = true;
    horizontalGroup.add(leftHead);

    const rightHead = new THREE.Mesh(headGeom, materials.stainlessHead);
    rightHead.position.set(shellLength / 2, 0, 0);
    rightHead.rotation.z = -Math.PI / 2;
    rightHead.scale.set(1, headDepth / shellRadius, 1);
    rightHead.castShadow = true;
    horizontalGroup.add(rightHead);

    explodeParts.push({ mesh: leftHead, origin: leftHead.position.clone(), explodeOffset: new THREE.Vector3(-6, 0, 0) });
    explodeParts.push({ mesh: rightHead, origin: rightHead.position.clone(), explodeOffset: new THREE.Vector3(6, 0, 0) });

    function createWeldRing(xPos) {
      const weldRingGeom = new THREE.TorusGeometry(shellRadius + 0.045, 0.09, 16, 64);
      weldRingGeom.rotateY(Math.PI / 2);
      const ring = new THREE.Mesh(weldRingGeom, materials.weldBead);
      ring.position.x = xPos;
      horizontalGroup.add(ring);
    }
    createWeldRing(-shellLength / 2);
    createWeldRing(shellLength / 2);
    createWeldRing(-shellLength / 6);
    createWeldRing(shellLength / 6);

    const longWeldGeom = new THREE.BoxGeometry(shellLength, 0.07, 0.14);
    const longWeld = new THREE.Mesh(longWeldGeom, materials.weldBead);
    longWeld.position.set(0, shellRadius + 0.02, 0);
    horizontalGroup.add(longWeld);

    function createStiffenerRing(xPos) {
      const ringGeom = new THREE.CylinderGeometry(shellRadius + 0.22, shellRadius + 0.22, 0.18, 64, 1, true);
      ringGeom.rotateZ(Math.PI / 2);
      const ring = new THREE.Mesh(ringGeom, materials.stainlessShell);
      ring.position.x = xPos;
      horizontalGroup.add(ring);
    }
    createStiffenerRing(-shellLength / 3);
    createStiffenerRing(shellLength / 3);

    // Manway Group
    const manwayGroup = new THREE.Group();
    const repadGeom = new THREE.CylinderGeometry(2.2, 2.2, 0.14, 32);
    const repad = new THREE.Mesh(repadGeom, materials.stainlessShell);
    repad.position.set(0, shellRadius + 0.07, 0);
    manwayGroup.add(repad);

    const weepGeom = new THREE.CylinderGeometry(0.06, 0.06, 0.18, 12);
    const weep = new THREE.Mesh(weepGeom, materials.structuralSteel);
    weep.position.set(1.6, shellRadius + 0.1, 0);
    manwayGroup.add(weep);

    const neckGeom = new THREE.CylinderGeometry(1.3, 1.3, 1.6, 32);
    const manwayNeck = new THREE.Mesh(neckGeom, materials.stainlessShell);
    manwayNeck.position.set(0, shellRadius + 0.8, 0);
    manwayGroup.add(manwayNeck);

    const flangeGeom = new THREE.CylinderGeometry(1.8, 1.8, 0.38, 32);
    const manwayFlange = new THREE.Mesh(flangeGeom, materials.flangeHardware);
    manwayFlange.position.set(0, shellRadius + 1.68, 0);
    manwayGroup.add(manwayFlange);

    const gasketGeom = new THREE.CylinderGeometry(1.65, 1.65, 0.06, 32);
    const gasket = new THREE.Mesh(gasketGeom, materials.gasketMaterial);
    gasket.position.set(0, shellRadius + 1.9, 0);
    manwayGroup.add(gasket);

    const blindGeom = new THREE.CylinderGeometry(1.8, 1.8, 0.35, 32);
    const blindCover = new THREE.Mesh(blindGeom, materials.flangeHardware);
    blindCover.position.set(0, shellRadius + 2.1, 0);
    manwayGroup.add(blindCover);

    const boltCircleR = 1.55;
    const studGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.42, 6);
    for (let i = 0; i < 24; i++) {
      const ang = (i / 24) * Math.PI * 2;
      const stud = new THREE.Mesh(studGeom, materials.flangeHardware);
      stud.position.set(Math.cos(ang) * boltCircleR, shellRadius + 2.32, Math.sin(ang) * boltCircleR);
      manwayGroup.add(stud);
    }

    const davitPostGeom = new THREE.CylinderGeometry(0.12, 0.12, 2.1, 16);
    const davitPost = new THREE.Mesh(davitPostGeom, materials.flangeHardware);
    davitPost.position.set(1.95, shellRadius + 1.8, 0);
    manwayGroup.add(davitPost);

    const davitArmGeom = new THREE.BoxGeometry(2.1, 0.15, 0.18);
    const davitArm = new THREE.Mesh(davitArmGeom, materials.flangeHardware);
    davitArm.position.set(0.98, shellRadius + 2.85, 0);
    manwayGroup.add(davitArm);

    horizontalGroup.add(manwayGroup);
    explodeParts.push({ mesh: manwayGroup, origin: manwayGroup.position.clone(), explodeOffset: new THREE.Vector3(0, 4.5, 0) });

    function buildProcessNozzle(xPos, zPos, rotZ, length, diameter, flangeDia) {
      const nGroup = new THREE.Group();
      const repadG = new THREE.CylinderGeometry(diameter * 1.6, diameter * 1.6, 0.12, 24);
      const repadM = new THREE.Mesh(repadG, materials.stainlessShell);
      repadM.position.y = 0.06;
      nGroup.add(repadM);

      const nGeom = new THREE.CylinderGeometry(diameter, diameter, length, 24);
      const nMesh = new THREE.Mesh(nGeom, materials.stainlessShell);
      nMesh.position.y = length / 2;
      nGroup.add(nMesh);

      const fGeom = new THREE.CylinderGeometry(flangeDia, flangeDia, 0.28, 24);
      const flange = new THREE.Mesh(fGeom, materials.flangeHardware);
      flange.position.y = length + 0.14;
      nGroup.add(flange);

      const boltR = flangeDia * 0.76;
      const bGeom = new THREE.CylinderGeometry(0.05, 0.05, 0.2, 6);
      for (let b = 0; b < 8; b++) {
        const ang = (b / 8) * Math.PI * 2;
        const bMesh = new THREE.Mesh(bGeom, materials.flangeHardware);
        bMesh.position.set(Math.cos(ang) * boltR, length + 0.3, Math.sin(ang) * boltR);
        nGroup.add(bMesh);
      }
      nGroup.rotation.z = rotZ;
      nGroup.position.set(xPos, shellRadius, zPos);
      return nGroup;
    }

    const n1 = buildProcessNozzle(-5.2, 0, 0, 1.4, 0.52, 0.95);
    const n2 = buildProcessNozzle(4.8, 0, 0, 1.5, 0.42, 0.82);
    horizontalGroup.add(n1);
    horizontalGroup.add(n2);
    explodeParts.push({ mesh: n1, origin: n1.position.clone(), explodeOffset: new THREE.Vector3(-1.5, 2.5, 0) });
    explodeParts.push({ mesh: n2, origin: n2.position.clone(), explodeOffset: new THREE.Vector3(1.5, 2.5, 0) });

    function createLiftingLug(xPos) {
      const lugShape = new THREE.Shape();
      lugShape.moveTo(-0.45, 0);
      lugShape.lineTo(-0.45, 1.2);
      lugShape.arc(0.45, 0, 0.45, Math.PI, 0, true);
      lugShape.lineTo(0.45, 0);
      lugShape.closePath();
      const holePath = new THREE.Path();
      holePath.absarc(0, 1.2, 0.22, 0, Math.PI * 2, true);
      lugShape.holes.push(holePath);

      const extrudeSettings = { depth: 0.18, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.02, bevelThickness: 0.02 };
      const lug = new THREE.Mesh(new THREE.ExtrudeGeometry(lugShape, extrudeSettings).center(), materials.flangeHardware);
      lug.position.set(xPos, shellRadius + 0.75, 0);
      lug.castShadow = true;
      return lug;
    }
    horizontalGroup.add(createLiftingLug(-4.2));
    horizontalGroup.add(createLiftingLug(4.2));

    function buildZickSaddle(xPos) {
      const sGroup = new THREE.Group();
      const wearPlateGeom = new THREE.CylinderGeometry(shellRadius + 0.14, shellRadius + 0.14, 1.8, 36, 1, true, -Math.PI / 3, (2 * Math.PI) / 3);
      wearPlateGeom.rotateZ(Math.PI / 2);
      wearPlateGeom.rotateX(Math.PI);
      sGroup.add(new THREE.Mesh(wearPlateGeom, materials.structuralSteel));

      const webGeom = new THREE.BoxGeometry(1.4, 2.7, 8.8);
      sGroup.add(new THREE.Mesh(webGeom, materials.structuralSteel));

      const gussetGeom = new THREE.BoxGeometry(0.18, 2.4, 1.2);
      for (let g = -3.4; g <= 3.4; g += 2.2) {
        const g1 = new THREE.Mesh(gussetGeom, materials.structuralSteel);
        g1.position.set(0.65, -4.3, g);
        sGroup.add(g1);
        const g2 = new THREE.Mesh(gussetGeom, materials.structuralSteel);
        g2.position.set(-0.65, -4.3, g);
        sGroup.add(g2);
      }

      const basePlateGeom = new THREE.BoxGeometry(2.0, 0.36, 9.6);
      const basePlate = new THREE.Mesh(basePlateGeom, materials.structuralSteel);
      basePlate.position.set(0, -5.68, 0);
      sGroup.add(basePlate);

      const anchorGeom = new THREE.CylinderGeometry(0.09, 0.09, 0.5, 6);
      for (let ax = -0.7; ax <= 0.7; ax += 1.4) {
        for (let az = -4.2; az <= 4.2; az += 8.4) {
          const anchor = new THREE.Mesh(anchorGeom, materials.flangeHardware);
          anchor.position.set(ax, -5.4, az);
          sGroup.add(anchor);
        }
      }
      sGroup.position.x = xPos;
      return sGroup;
    }

    const saddle1 = buildZickSaddle(-5.4);
    const saddle2 = buildZickSaddle(5.4);
    horizontalGroup.add(saddle1);
    horizontalGroup.add(saddle2);
    explodeParts.push({ mesh: saddle1, origin: saddle1.position.clone(), explodeOffset: new THREE.Vector3(-1.2, -2.5, 0) });
    explodeParts.push({ mesh: saddle2, origin: saddle2.position.clone(), explodeOffset: new THREE.Vector3(1.2, -2.5, 0) });

    const fluidGeom = new THREE.CylinderGeometry(shellRadius - 0.25, shellRadius - 0.25, shellLength - 0.4, 32);
    fluidGeom.rotateZ(Math.PI / 2);
    fluidMesh = new THREE.Mesh(fluidGeom, fluidMaterial);
    fluidMesh.position.set(0, -1.2, 0);
    horizontalGroup.add(fluidMesh);

    // Build 3D CAD Dimensions
    buildDimensionsCallouts();
  }

  /* ==========================================================================
     MODEL 2: Chemical Reactor (15kL)
     ========================================================================== */
  function buildChemicalReactor() {
    reactorGroup = new THREE.Group();
    const rHeight = 11.0;
    const rRadius = 3.6;

    const shell = new THREE.Mesh(new THREE.CylinderGeometry(rRadius, rRadius, rHeight, 48), materials.stainlessShell);
    reactorGroup.add(shell);

    const headGeom = new THREE.SphereGeometry(rRadius, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2);
    const topHead = new THREE.Mesh(headGeom, materials.stainlessHead);
    topHead.position.set(0, rHeight / 2, 0);
    topHead.scale.set(1, 0.45, 1);
    reactorGroup.add(topHead);

    const btmHead = new THREE.Mesh(headGeom, materials.stainlessHead);
    btmHead.position.set(0, -rHeight / 2, 0);
    btmHead.rotation.x = Math.PI;
    btmHead.scale.set(1, 0.45, 1);
    reactorGroup.add(btmHead);

    const jacket = new THREE.Mesh(new THREE.CylinderGeometry(rRadius + 0.24, rRadius + 0.24, rHeight * 0.65, 48, 1, true), materials.blueShell);
    jacket.position.y = -0.5;
    reactorGroup.add(jacket);

    const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 1.8, 24), materials.structuralSteel);
    motor.position.set(0, rHeight / 2 + 2.5, 0);
    reactorGroup.add(motor);

    const gearbox = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 1.6), materials.structuralSteel);
    gearbox.position.set(0, rHeight / 2 + 1.2, 0);
    reactorGroup.add(gearbox);

    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, rHeight * 1.2, 16), materials.flangeHardware);
    shaft.position.y = 0.5;
    reactorGroup.add(shaft);

    for (let i = 0; i < 4; i++) {
      const ang = (i / 4) * Math.PI * 2;
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 5.0, 16), materials.structuralSteel);
      leg.position.set(Math.cos(ang) * (rRadius + 0.6), -rHeight / 2 - 1.2, Math.sin(ang) * (rRadius + 0.6));
      reactorGroup.add(leg);
    }
  }

  /* ==========================================================================
     MODEL 3: Bulk Storage Silo (100 Tons)
     ========================================================================== */
  function buildCementSilo() {
    siloGroup = new THREE.Group();
    const siloRadius = 3.8;
    const cylinderHeight = 12.0;
    const coneHeight = 4.2;

    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(siloRadius, siloRadius, cylinderHeight, 48), materials.stainlessShell);
    cyl.position.y = 1.0;
    siloGroup.add(cyl);

    const coneGeom = new THREE.ConeGeometry(siloRadius, coneHeight, 48);
    coneGeom.rotateX(Math.PI);
    const cone = new THREE.Mesh(coneGeom, materials.blueShell);
    cone.position.y = -5.0 - coneHeight / 2;
    siloGroup.add(cone);

    const roof = new THREE.Mesh(new THREE.ConeGeometry(siloRadius + 0.1, 1.4, 48), materials.stainlessHead);
    roof.position.y = 7.0 + 0.7;
    siloGroup.add(roof);

    const filter = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 1.8, 24), materials.flangeHardware);
    filter.position.set(1.4, 8.8, 0);
    siloGroup.add(filter);

    for (let i = 0; i < 4; i++) {
      const ang = (i / 4) * Math.PI * 2;
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.5, 6.2, 0.5), materials.structuralSteel);
      leg.position.set(Math.cos(ang) * (siloRadius + 0.4), -6.0, Math.sin(ang) * (siloRadius + 0.4));
      siloGroup.add(leg);
    }
  }

  /* ==========================================================================
     Scroll Scrubber & Turntable Engine
     ========================================================================== */
  function onScroll() {
    lastUserInteractionTime = Date.now();
    activeOrthoPreset = null; // Release ortho preset on scroll
    document.querySelectorAll('.ortho-btn').forEach(b => b.classList.remove('active'));

    if (!scrollContainer) return;
    const rect = scrollContainer.getBoundingClientRect();
    const totalScrollable = scrollContainer.offsetHeight - window.innerHeight;
    if (totalScrollable <= 0) return;
    const scrolled = -rect.top;
    targetProgress = Math.max(0, Math.min(1, scrolled / totalScrollable));
  }

  function interpolateCamera() {
    currentProgress += (targetProgress - currentProgress) * 0.08;

    explodeProgress += (targetExplodeProgress - explodeProgress) * 0.09;
    if (currentModelType === 'horizontal') {
      explodeParts.forEach(part => {
        part.mesh.position.lerpVectors(part.origin, part.origin.clone().add(part.explodeOffset), explodeProgress);
      });
    }

    fillLevel += (targetFillLevel - fillLevel) * 0.08;
    if (fluidMesh) {
      fluidClock += 0.035;
      const wave = Math.sin(fluidClock) * 0.08;
      fluidMesh.scale.set(fillLevel * (1 + wave * 0.05), fillLevel, fillLevel * (1 - wave * 0.05));
      fluidMesh.visible = fillLevel > 0.05;
    }

    // Idle Turntable: Slowly rotate if user is idle for > 2 seconds
    const timeSinceInteraction = Date.now() - lastUserInteractionTime;
    if (timeSinceInteraction > 2000 && !isDragging && !activeOrthoPreset) {
      manualRotation.x += 0.0016;
    } else if (!isDragging && activeOrthoPreset) {
      manualRotation.x += (0 - manualRotation.x) * 0.06;
      manualRotation.y += (0 - manualRotation.y) * 0.06;
    }

    let targetCamPos, targetLookAt, targetRot;

    if (activeOrthoPreset && orthoPresetNodes[activeOrthoPreset]) {
      const preset = orthoPresetNodes[activeOrthoPreset];
      targetCamPos = preset.camPos;
      targetLookAt = preset.target;
      targetRot = preset.tankRot;
    } else {
      let nodeA = cameraNodes[0];
      let nodeB = cameraNodes[cameraNodes.length - 1];
      let segmentProgress = 0;

      for (let i = 0; i < cameraNodes.length - 1; i++) {
        if (currentProgress >= cameraNodes[i].progress && currentProgress <= cameraNodes[i + 1].progress) {
          nodeA = cameraNodes[i];
          nodeB = cameraNodes[i + 1];
          const range = nodeB.progress - nodeA.progress;
          segmentProgress = (currentProgress - nodeA.progress) / range;
          break;
        }
      }

      const ease = segmentProgress < 0.5
        ? 4 * segmentProgress * segmentProgress * segmentProgress
        : 1 - Math.pow(-2 * segmentProgress + 2, 3) / 2;

      targetCamPos = {
        x: nodeA.camPos.x + (nodeB.camPos.x - nodeA.camPos.x) * ease,
        y: nodeA.camPos.y + (nodeB.camPos.y - nodeA.camPos.y) * ease,
        z: nodeA.camPos.z + (nodeB.camPos.z - nodeA.camPos.z) * ease
      };

      targetLookAt = {
        x: nodeA.target.x + (nodeB.target.x - nodeA.target.x) * ease,
        y: nodeA.target.y + (nodeB.target.y - nodeA.target.y) * ease,
        z: nodeA.target.z + (nodeB.target.z - nodeA.target.z) * ease
      };

      targetRot = {
        x: nodeA.tankRot.x + (nodeB.tankRot.x - nodeA.tankRot.x) * ease,
        y: nodeA.tankRot.y + (nodeB.tankRot.y - nodeA.tankRot.y) * ease,
        z: nodeA.tankRot.z + (nodeB.tankRot.z - nodeA.tankRot.z) * ease
      };
    }

    const isMobile = window.innerWidth <= 768;
    const effectiveLookAtX = isMobile ? (activeOrthoPreset ? targetLookAt.x : 0) : targetLookAt.x;
    const effectiveLookAtY = isMobile ? (activeOrthoPreset ? targetLookAt.y : targetLookAt.y - 2.2) : targetLookAt.y;
    const effectiveCamX = isMobile ? (activeOrthoPreset ? targetCamPos.x : targetCamPos.x * 0.85) : targetCamPos.x;
    const effectiveCamY = isMobile ? (activeOrthoPreset ? targetCamPos.y : targetCamPos.y + 0.6) : targetCamPos.y;
    const effectiveCamZ = isMobile ? (activeOrthoPreset ? targetCamPos.z : targetCamPos.z * 1.1) : targetCamPos.z;

    camera.position.lerp(new THREE.Vector3(effectiveCamX, effectiveCamY, effectiveCamZ), 0.08);
    camera.lookAt(effectiveLookAtX, effectiveLookAtY, targetLookAt.z);

    if (activeModelGroup) {
      activeModelGroup.rotation.set(
        targetRot.x + manualRotation.y,
        targetRot.y + manualRotation.x,
        targetRot.z
      );
    }

    updateHotspotScreenCoordinates();
    updateStoryChapters(currentProgress);
  }

  function updateHotspotScreenCoordinates() {
    if (!stickyViewport || !camera || !activeModelGroup) return;
    const width = stickyViewport.clientWidth;
    const height = stickyViewport.clientHeight;

    for (const [id, localPos] of Object.entries(hotspotAnchors)) {
      const el = document.getElementById(id);
      if (!el) continue;

      if (currentModelType !== 'horizontal' || isExploded) {
        el.style.opacity = '0';
        continue;
      }

      const worldPos = localPos.clone();
      worldPos.applyEuler(activeModelGroup.rotation);
      worldPos.add(activeModelGroup.position);
      const screenPos = worldPos.project(camera);

      if (screenPos.z > 1) {
        el.style.opacity = '0';
        continue;
      }

      el.style.opacity = '1';
      const px = (screenPos.x * 0.5 + 0.5) * width;
      const py = (-(screenPos.y * 0.5) + 0.5) * height;
      el.style.left = `${px}px`;
      el.style.top = `${py}px`;
    }
  }

  function updateStoryChapters(p) {
    const chapters = ['chapter-1', 'chapter-2', 'chapter-3', 'chapter-4', 'chapter-5'];
    let activeIdx = 0;

    if (p < 0.18) activeIdx = 0;
    else if (p < 0.38) activeIdx = 1;
    else if (p < 0.62) activeIdx = 2;
    else if (p < 0.85) activeIdx = 3;
    else activeIdx = 4;

    chapters.forEach((id, idx) => {
      const el = document.getElementById(id);
      if (el) {
        if (idx === activeIdx) el.classList.add('active');
        else el.classList.remove('active');
      }
    });

    const counter = document.getElementById('chapterCounterPill');
    if (counter) counter.textContent = `0${activeIdx + 1} / 05`;

    const progBar = document.getElementById('heroScrollProgressBar');
    if (progBar) progBar.style.width = `${p * 100}%`;

    const scrubBtns = document.querySelectorAll('.chapter-scrub-step');
    scrubBtns.forEach((btn, idx) => {
      if (idx === activeIdx) btn.classList.add('active');
      else btn.classList.remove('active');
    });

    const activeHotspotId = cameraNodes[activeIdx].activeHotspot;
    document.querySelectorAll('.hotspot-marker').forEach(pin => {
      if (pin.id === activeHotspotId) pin.classList.add('pulse-active');
      else pin.classList.remove('pulse-active');
    });
  }

  function setupInteractiveDrag() {
    canvas.addEventListener('mousedown', (e) => {
      lastUserInteractionTime = Date.now();
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
      canvas.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      lastUserInteractionTime = Date.now();
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;
      manualRotation.x += deltaX * 0.005;
      manualRotation.y += deltaY * 0.005;
      manualRotation.y = Math.max(-0.6, Math.min(0.6, manualRotation.y));
      previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
      canvas.style.cursor = 'grab';
    });

    let touchStartDist = 0;
    let initialCamLength = 22;

    canvas.addEventListener('touchstart', (e) => {
      lastUserInteractionTime = Date.now();
      if (e.touches.length === 1) {
        isDragging = true;
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        isDragging = false;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        touchStartDist = Math.hypot(dx, dy);
        initialCamLength = camera.position.length();
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && isDragging) {
        lastUserInteractionTime = Date.now();
        const deltaX = e.touches[0].clientX - previousMousePosition.x;
        const deltaY = e.touches[0].clientY - previousMousePosition.y;
        manualRotation.x += deltaX * 0.006;
        manualRotation.y += deltaY * 0.006;
        manualRotation.y = Math.max(-0.6, Math.min(0.6, manualRotation.y));
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2 && touchStartDist > 0) {
        lastUserInteractionTime = Date.now();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const factor = touchStartDist / Math.max(dist, 1);
        const targetLen = Math.max(12, Math.min(42, initialCamLength * factor));
        camera.position.setLength(targetLen);
      }
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
      if (e.touches.length === 0) {
        isDragging = false;
        touchStartDist = 0;
      }
    });
  }

  function setupHotspotInteractions() {
    const pins = [
      { id: 'pin-head', targetProgress: 0.25 },
      { id: 'pin-weld', targetProgress: 0.50 },
      { id: 'pin-manway', targetProgress: 0.75 },
      { id: 'pin-saddle', targetProgress: 1.00 }
    ];

    pins.forEach(pin => {
      const el = document.getElementById(pin.id);
      if (el) {
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          playMechanicalSound('click');
          scrollToProgress(pin.targetProgress);
        });
      }
    });
  }

  function setupChapterScrubButtons() {
    const scrubBtns = document.querySelectorAll('.chapter-scrub-step');
    scrubBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        playMechanicalSound('click');
        const prog = parseFloat(btn.getAttribute('data-progress'));
        if (!isNaN(prog)) scrollToProgress(prog);
      });
    });
  }

  function scrollToProgress(p) {
    if (!scrollContainer) return;
    const totalScrollable = scrollContainer.offsetHeight - window.innerHeight;
    const targetScrollY = scrollContainer.offsetTop + p * totalScrollable;
    window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
  }

  function setupFinishSwitcher() {
    const finishBtns = document.querySelectorAll('.finish-btn');
    finishBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        playMechanicalSound('click');
        const finish = btn.getAttribute('data-finish');
        applyFinish(finish);
        finishBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  }

  function applyFinish(finish) {
    currentFinish = finish;
    if (!activeModelGroup) return;

    let shellMat, headMat;
    if (finish === 'stainless') {
      shellMat = materials.stainlessShell;
      headMat = materials.stainlessHead;
    } else if (finish === 'blue') {
      shellMat = materials.blueShell;
      headMat = materials.blueShell;
    } else if (finish === 'primer') {
      shellMat = materials.primerShell;
      headMat = materials.primerShell;
    } else if (finish === 'xray') {
      shellMat = materials.xrayMaterial;
      headMat = materials.xrayMaterial;
    } else if (finish === 'fea') {
      shellMat = materials.feaStress;
      headMat = materials.feaStress;
    }

    activeModelGroup.traverse(child => {
      if (child.isMesh && child !== fluidMesh && !child.material.map) {
        if (child.geometry && child.geometry.type === 'CylinderGeometry') child.material = shellMat;
        else if (child.geometry && child.geometry.type === 'SphereGeometry') child.material = headMat;
      }
    });
  }

  // Guided Cinematic Engineering Tour State
  let isTourActive = false;
  let tourCurrentIndex = 0;
  let tourTimer = null;

  const tourStops = [
    {
      camPos: { x: -16, y: 2.2, z: 10 },
      target: { x: -8.8, y: 0.2, z: 0 },
      tankRot: { x: 0.05, y: 0.22, z: 0 },
      step: 'POINT 01 / 05',
      title: 'Torispherical 2:1 Ellipsoidal Dished Head',
      desc: 'Hydraulically cold-spun from 12.0mm SA 516 Gr. 70 normalized boiler plate. Crown radius equals outer diameter for balanced membrane stress under cyclic pressure.'
    },
    {
      camPos: { x: -2.5, y: 3.8, z: 8.5 },
      target: { x: -4.0, y: 1.2, z: 0 },
      tankRot: { x: 0.12, y: 0.72, z: 0.02 },
      step: 'POINT 02 / 05',
      title: 'Submerged Arc Welds (SAW) & HAZ Temper',
      desc: 'Automated tandem SAW wire longitudinal seam. 100% full radiographic examination per ASME UW-51 (Joint efficiency E=1.0). Heat-affected zone temper oxide preserved.'
    },
    {
      camPos: { x: 3.5, y: 11.5, z: 9.5 },
      target: { x: 0, y: 4.8, z: 0 },
      tankRot: { x: -0.28, y: 0.08, z: 0 },
      step: 'POINT 03 / 05',
      title: 'ANSI B16.5 150# RF Nozzles & Davit Manway',
      desc: 'Serrated raised-face flanges with 3.2mm 316L/graphite spiral wound gaskets, ASTM A193 B7 stud bolts, and dual-lug davit arm for safe zero-lift internal vessel entry.'
    },
    {
      camPos: { x: 1.5, y: 2.5, z: 12.5 },
      target: { x: 0, y: 0.5, z: 2.8 },
      tankRot: { x: 0.02, y: 0.05, z: 0 },
      step: 'POINT 04 / 05',
      title: 'ASME Code "U" Stamp & PESO Stencil Plate',
      desc: 'Official serial stenciling, design pressure 12.5 Bar, hydro test pressure 18.75 Bar, tare weight 6,420 kg, and NFPA 704 hazard classification.'
    },
    {
      camPos: { x: 13, y: -2.8, z: 15 },
      target: { x: 5.2, y: -3.6, z: 0 },
      tankRot: { x: 0.18, y: -0.45, z: 0 },
      step: 'POINT 05 / 05',
      title: 'Zick Analysis Dual Saddle Supports',
      desc: '120° wrap-around wear pads prevent shell crushing. Slotted foundation anchor holes accommodate thermal expansion/contraction during ambient weather cycles.'
    }
  ];

  function startCinematicTour() {
    isTourActive = true;
    tourCurrentIndex = 0;
    const tourBtn = document.getElementById('tourToggleBtn');
    const tourHud = document.getElementById('tourSubtitleHud');
    if (tourBtn) tourBtn.classList.add('active');
    if (tourHud) tourHud.classList.add('active');

    executeTourStop(0);
  }

  function executeTourStop(idx) {
    if (!isTourActive) return;
    const stop = tourStops[idx];
    const badge = document.getElementById('tourStepBadge');
    const title = document.getElementById('tourTitle');
    const desc = document.getElementById('tourDesc');
    const fill = document.getElementById('tourProgressFill');

    if (badge) badge.textContent = stop.step;
    if (title) title.textContent = stop.title;
    if (desc) desc.textContent = stop.desc;
    if (fill) fill.style.width = `${((idx + 1) / tourStops.length) * 100}%`;

    // Animate camera to stop node
    activeOrthoPreset = null;
    manualRotation = { x: stop.tankRot.x, y: stop.tankRot.y };
    camera.position.set(stop.camPos.x, stop.camPos.y, stop.camPos.z);
    camera.lookAt(stop.target.x, stop.target.y, stop.target.z);
    playMechanicalSound('click');

    tourTimer = setTimeout(() => {
      if (!isTourActive) return;
      tourCurrentIndex = (tourCurrentIndex + 1) % tourStops.length;
      executeTourStop(tourCurrentIndex);
    }, 4500);
  }

  function stopCinematicTour() {
    isTourActive = false;
    clearTimeout(tourTimer);
    const tourBtn = document.getElementById('tourToggleBtn');
    const tourHud = document.getElementById('tourSubtitleHud');
    if (tourBtn) tourBtn.classList.remove('active');
    if (tourHud) tourHud.classList.remove('active');
  }

  function setupAdvancedControls() {
    const modelBtns = document.querySelectorAll('.model-switch-btn');
    modelBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const model = btn.getAttribute('data-model');
        switchModel(model);
        modelBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        playMechanicalSound('pneumatic');
      });
    });

    const explodeBtn = document.getElementById('explodeToggleBtn');
    if (explodeBtn) {
      explodeBtn.addEventListener('click', () => {
        isExploded = !isExploded;
        targetExplodeProgress = isExploded ? 1.0 : 0.0;
        explodeBtn.classList.toggle('active', isExploded);
        explodeBtn.querySelector('span').textContent = isExploded ? 'ASSEMBLE' : 'EXPLODE';
        playMechanicalSound('pneumatic');
      });
    }

    // FEA Stress Analysis Toggle Button
    const feaBtn = document.getElementById('feaStressToggleBtn');
    const feaHud = document.getElementById('feaStressHud');
    let isFeaActive = false;
    let savedFinish = 'stainless';

    if (feaBtn) {
      feaBtn.addEventListener('click', () => {
        isFeaActive = !isFeaActive;
        feaBtn.classList.toggle('active', isFeaActive);
        if (feaHud) feaHud.classList.toggle('active', isFeaActive);

        if (isFeaActive) {
          savedFinish = currentFinish;
          applyFinish('fea');
          playMechanicalSound('sonar');
        } else {
          applyFinish(savedFinish);
          playMechanicalSound('click');
        }
      });
    }

    // Guided Cinematic Tour Button
    const tourBtn = document.getElementById('tourToggleBtn');
    const tourExitBtn = document.getElementById('tourExitBtn');

    if (tourBtn) {
      tourBtn.addEventListener('click', () => {
        if (isTourActive) stopCinematicTour();
        else startCinematicTour();
      });
    }

    if (tourExitBtn) {
      tourExitBtn.addEventListener('click', stopCinematicTour);
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isTourActive) stopCinematicTour();
    });

    const fillBtns = document.querySelectorAll('.fill-level-btn');
    fillBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const lvl = parseFloat(btn.getAttribute('data-fill'));
        targetFillLevel = lvl;
        fillBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        playMechanicalSound('click');
      });
    });

    const audioBtn = document.getElementById('audioToggleBtn');
    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        audioEnabled = !audioEnabled;
        audioBtn.classList.toggle('active', audioEnabled);
        audioBtn.querySelector('span').textContent = audioEnabled ? 'AUDIO: ON' : 'AUDIO: OFF';
        if (audioEnabled) playMechanicalSound('click');
      });
    }

    // Toggle 3D Dimensions Button
    const dimBtn = document.getElementById('toggleDimensionsBtn');
    if (dimBtn) {
      dimBtn.addEventListener('click', () => {
        showDimensions = !showDimensions;
        if (dimensionsGroup) dimensionsGroup.visible = showDimensions;
        dimBtn.classList.toggle('active', showDimensions);
        dimBtn.querySelector('span').textContent = showDimensions ? 'CAD RULER: ON' : 'CAD RULER: OFF';
        playMechanicalSound('click');
      });
    }
  }

  /* ==========================================================================
     Orthographic & Isometric Camera Presets
     ========================================================================== */
  function setupOrthoViews() {
    const orthoBtns = document.querySelectorAll('.ortho-btn');
    orthoBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.getAttribute('data-view');
        activeOrthoPreset = view;
        orthoBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        playMechanicalSound('click');
      });
    });
  }

  /* ==========================================================================
     Studio Lighting Mode Switcher (Daylight, Sunset, Blueprint)
     ========================================================================== */
  function setupLightingModeSwitcher() {
    const lightBtns = document.querySelectorAll('.light-btn');
    lightBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-light');
        setLightingMode(mode);
        lightBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        playMechanicalSound('click');
      });
    });
  }

  function setLightingMode(mode) {
    currentLightingMode = mode;
    if (mode === 'daylight') {
      scene.background.set(0xf6f8fa);
      if (keyLight) { keyLight.color.set(0xfffdfa); keyLight.intensity = 1.45; }
      if (rimLight) { rimLight.color.set(0x0047ff); rimLight.intensity = 0.5; }
    } else if (mode === 'sunset') {
      scene.background.set(0x181a20);
      if (keyLight) { keyLight.color.set(0xffaa44); keyLight.intensity = 1.8; }
      if (rimLight) { rimLight.color.set(0x38bdf8); rimLight.intensity = 0.8; }
    } else if (mode === 'blueprint') {
      scene.background.set(0x0a1128);
      if (keyLight) { keyLight.color.set(0x00ffff); keyLight.intensity = 1.2; }
      if (rimLight) { rimLight.color.set(0x0047ff); rimLight.intensity = 1.0; }
    }
  }

  function switchModel(type) {
    if (type === currentModelType) return;
    currentModelType = type;

    isExploded = false;
    targetExplodeProgress = 0;
    const explodeBtn = document.getElementById('explodeToggleBtn');
    if (explodeBtn) {
      explodeBtn.classList.remove('active');
      explodeBtn.querySelector('span').textContent = 'EXPLODE';
    }

    if (activeModelGroup) scene.remove(activeModelGroup);

    if (type === 'horizontal') activeModelGroup = horizontalGroup;
    else if (type === 'reactor') activeModelGroup = reactorGroup;
    else if (type === 'silo') activeModelGroup = siloGroup;

    scene.add(activeModelGroup);
    applyFinish(currentFinish);

    const modelTag = document.getElementById('hudModelNameTag');
    if (modelTag) {
      if (type === 'horizontal') modelTag.textContent = '30,000L DIESEL TANK (ASME VIII)';
      else if (type === 'reactor') modelTag.textContent = '15,000L JACKETED CHEMICAL REACTOR';
      else if (type === 'silo') modelTag.textContent = '100-TON BULK STORAGE CEMENT SILO';
    }
  }

  function onResize() {
    if (!camera || !renderer || !stickyViewport) return;
    const width = stickyViewport.clientWidth;
    const height = stickyViewport.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  function renderLoop() {
    requestAnimationFrame(renderLoop);
    interpolateCamera();
    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
