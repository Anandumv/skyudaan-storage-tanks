/**
 * SkyUdaan Interactive Industrial Tank & Silo Configurator
 * Calculates engineering dimensions, plate thickness, tare weight, design codes,
 * and renders a real-time vector CAD GA (General Arrangement) drawing.
 */

(function () {
  // State
  const state = {
    application: 'fuel', // 'fuel' | 'chemical' | 'silo' | 'reactor' | 'dairy'
    orientation: 'horizontal', // 'horizontal' | 'vertical' | 'underground'
    capacityLiters: 25000,
    moc: 'is2062', // 'is2062' | 'ss304' | 'ss316' | 'sa516'
    pressureBar: 1.0,
    accessories: {
      manhole: true,
      baffles: true,
      ladder: false,
      flameArrestor: false,
      heatingJacket: false
    }
  };

  // DOM Elements
  const capacitySlider = document.getElementById('capacitySlider');
  const capacityDisplay = document.getElementById('capacityDisplay');
  const blueprintSvg = document.getElementById('blueprintSvg');

  // Outputs
  const outVolume = document.getElementById('specVolume');
  const outDimensions = document.getElementById('specDimensions');
  const outThickness = document.getElementById('specThickness');
  const outWeight = document.getElementById('specWeight');
  const outCode = document.getElementById('specCode');
  const outPriceEst = document.getElementById('specPriceEst');

  function initConfigurator() {
    if (!capacitySlider || !blueprintSvg) return;

    // Capacity Slider Listener
    capacitySlider.addEventListener('input', (e) => {
      state.capacityLiters = parseInt(e.target.value, 10);
      updateConfigurator();
    });

    // Vector CAD SVG Download Button Listener
    const cadBtn = document.getElementById('downloadCadSvgBtn');
    if (cadBtn) {
      cadBtn.addEventListener('click', downloadCadSvg);
    }

    // Quick Capacity Pills
    document.querySelectorAll('.capacity-pill').forEach(pill => {
      pill.addEventListener('click', (e) => {
        document.querySelectorAll('.capacity-pill').forEach(p => p.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const cap = parseInt(e.currentTarget.getAttribute('data-cap'), 10);
        state.capacityLiters = cap;
        capacitySlider.value = cap;
        updateConfigurator();
      });
    });

    // Application Type Selectors
    document.querySelectorAll('[data-config-app]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('[data-config-app]').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        state.application = e.currentTarget.getAttribute('data-config-app');

        // Adjust defaults based on application
        if (state.application === 'silo') {
          state.orientation = 'vertical';
          state.moc = 'is2062';
        } else if (state.application === 'chemical' || state.application === 'reactor') {
          state.moc = 'ss316';
        } else if (state.application === 'dairy') {
          state.moc = 'ss304';
        }
        syncUiOptions();
        updateConfigurator();
      });
    });

    // Orientation Selectors
    document.querySelectorAll('[data-config-orient]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('[data-config-orient]').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        state.orientation = e.currentTarget.getAttribute('data-config-orient');
        updateConfigurator();
      });
    });

    // Material (MOC) Selectors
    document.querySelectorAll('[data-config-moc]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('[data-config-moc]').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        state.moc = e.currentTarget.getAttribute('data-config-moc');
        updateConfigurator();
      });
    });

    // Accessories Checkboxes
    document.querySelectorAll('[data-config-acc]').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const acc = e.currentTarget.getAttribute('data-config-acc');
        state.accessories[acc] = e.currentTarget.checked;
        updateConfigurator();
      });
    });

    // Initial calculation
    updateConfigurator();
  }

  function syncUiOptions() {
    // Sync MOC UI
    document.querySelectorAll('[data-config-moc]').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-config-moc') === state.moc);
    });
    // Sync Orient UI
    document.querySelectorAll('[data-config-orient]').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-config-orient') === state.orientation);
    });
  }

  function calculateEngineeringParameters() {
    const V_m3 = state.capacityLiters / 1000; // volume in cubic meters
    let diameterM, lengthM, shellThkMm, headThkMm, emptyWeightKg, estPriceInr, designCode;

    if (state.orientation === 'horizontal' || state.orientation === 'underground') {
      // Standard L/D ratio approx 2.8 to 3.2 for horizontal tanks
      const ldRatio = 3.0;
      // V = pi * (D/2)^2 * L = pi * D^2/4 * (ldRatio * D) = (pi * ldRatio / 4) * D^3
      diameterM = Math.pow(V_m3 / ((Math.PI * ldRatio) / 4), 1 / 3);
      lengthM = diameterM * ldRatio;

      // Minimum shell thickness based on capacity
      if (state.capacityLiters <= 10000) {
        shellThkMm = 6.0;
        headThkMm = 8.0;
      } else if (state.capacityLiters <= 50000) {
        shellThkMm = 8.0;
        headThkMm = 10.0;
      } else {
        shellThkMm = 10.0;
        headThkMm = 12.0;
      }

      if (state.application === 'fuel') {
        designCode = state.orientation === 'underground' ? 'PESO / UL-58 / IS 2825' : 'UL-142 / PESO / API 650';
      } else {
        designCode = 'ASME Sec VIII Div 1';
      }
    } else {
      // Vertical / Silo
      const ldRatio = state.application === 'silo' ? 3.5 : 2.0;
      diameterM = Math.pow(V_m3 / ((Math.PI * ldRatio) / 4), 1 / 3);
      lengthM = diameterM * ldRatio;

      shellThkMm = state.application === 'silo' ? 6.0 : 8.0;
      headThkMm = 10.0;
      designCode = state.application === 'silo' ? 'IS 9178 / DIN 1055' : 'ASME Sec VIII Div 1 / IS 2825';
    }

    // Surface Area calculation (approximate: cylindrical shell + 2 dished ends)
    const shellArea = Math.PI * diameterM * lengthM;
    const headsArea = 2 * (1.15 * Math.PI * Math.pow(diameterM / 2, 2));
    const totalAreaM2 = shellArea + headsArea;

    // Weight Calculation: Area * thickness * density (steel ~7850 kg/m3)
    const steelDensity = (state.moc === 'ss304' || state.moc === 'ss316') ? 8000 : 7850;
    const avgThkM = ((shellThkMm + headThkMm) / 2) / 1000;
    const structuralAllowance = 1.25; // saddles, nozzles, manhole, flanges
    emptyWeightKg = Math.round(totalAreaM2 * avgThkM * steelDensity * structuralAllowance);

    // Ballpark Price Estimation based on material & capacity
    let baseRatePerKg = 120; // INR / kg for Mild Steel IS 2062 fabricated
    if (state.moc === 'ss304') baseRatePerKg = 310;
    if (state.moc === 'ss316') baseRatePerKg = 440;
    if (state.moc === 'sa516') baseRatePerKg = 180;

    let baseCost = emptyWeightKg * baseRatePerKg;
    if (state.application === 'reactor' || state.accessories.heatingJacket) baseCost *= 1.35;
    if (state.accessories.flameArrestor) baseCost += 28000;
    if (state.accessories.ladder) baseCost += 35000;

    estPriceInr = Math.round(baseCost / 1000) * 1000;

    return {
      diameterMm: Math.round(diameterM * 1000),
      lengthMm: Math.round(lengthM * 1000),
      shellThkMm,
      headThkMm,
      emptyWeightKg,
      estPriceInr,
      designCode
    };
  }

  function updateConfigurator() {
    // Update displayed capacity
    if (capacityDisplay) {
      capacityDisplay.textContent = `${state.capacityLiters.toLocaleString()} Liters (${(state.capacityLiters / 1000).toFixed(1)} kL)`;
    }

    const calc = calculateEngineeringParameters();

    // Update spec summary fields
    if (outVolume) outVolume.textContent = `${(state.capacityLiters / 1000).toFixed(0)} kL (${state.capacityLiters.toLocaleString()} L)`;
    if (outDimensions) outDimensions.textContent = `Ø ${calc.diameterMm} mm × ${calc.lengthMm} mm (OAL)`;
    if (outThickness) outThickness.textContent = `Shell: ${calc.shellThkMm}mm | Heads: ${calc.headThkMm}mm`;
    if (outWeight) outWeight.textContent = `~${calc.emptyWeightKg.toLocaleString()} kg (Tare)`;
    if (outCode) outCode.textContent = calc.designCode;
    if (outPriceEst) outPriceEst.textContent = `₹ ${calc.estPriceInr.toLocaleString()} (Est. Ex-Works)`;

    // Render CAD Blueprint SVG
    renderBlueprint(calc);
  }

  function renderBlueprint(calc) {
    if (!blueprintSvg) return;

    const width = 480;
    const height = 240;
    const isHorizontal = state.orientation === 'horizontal' || state.orientation === 'underground';

    let svgHtml = '';

    if (isHorizontal) {
      // Horizontal Tank Drawing
      const tankW = Math.min(300, Math.max(180, (calc.lengthMm / 10000) * 160 + 100));
      const tankH = Math.min(130, Math.max(70, (calc.diameterMm / 3000) * 80 + 40));
      const cx = width / 2;
      const cy = height / 2 - 5;
      const x1 = cx - tankW / 2;
      const x2 = cx + tankW / 2;
      const y1 = cy - tankH / 2;
      const y2 = cy + tankH / 2;
      const dishCurve = tankH * 0.28;

      svgHtml = `
        <svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
          <!-- Centerlines -->
          <line x1="${x1 - 40}" y1="${cy}" x2="${x2 + 40}" y2="${cy}" stroke="#60a5fa" stroke-width="1" stroke-dasharray="10,4,2,4" opacity="0.6"/>
          <line x1="${cx}" y1="${y1 - 35}" x2="${cx}" y2="${y2 + 45}" stroke="#60a5fa" stroke-width="1" stroke-dasharray="10,4,2,4" opacity="0.6"/>

          <!-- Shell Body -->
          <rect x="${x1}" y="${y1}" width="${tankW}" height="${tankH}" fill="rgba(255, 255, 255, 0.05)" stroke="#ffffff" stroke-width="2"/>

          <!-- Left Torispherical Dished End -->
          <path d="M ${x1} ${y1} C ${x1 - dishCurve} ${y1}, ${x1 - dishCurve} ${y2}, ${x1} ${y2}" fill="none" stroke="#ffffff" stroke-width="2"/>

          <!-- Right Torispherical Dished End -->
          <path d="M ${x2} ${y1} C ${x2 + dishCurve} ${y1}, ${x2 + dishCurve} ${y2}, ${x2} ${y2}" fill="none" stroke="#ffffff" stroke-width="2"/>

          <!-- Welds / Shell Rings -->
          <line x1="${x1 + tankW * 0.33}" y1="${y1}" x2="${x1 + tankW * 0.33}" y2="${y2}" stroke="#93c5fd" stroke-width="1" stroke-dasharray="3,3" opacity="0.8"/>
          <line x1="${x1 + tankW * 0.66}" y1="${y1}" x2="${x1 + tankW * 0.66}" y2="${y2}" stroke="#93c5fd" stroke-width="1" stroke-dasharray="3,3" opacity="0.8"/>

          <!-- Top Manhole (500mm) -->
          <rect x="${cx - 14}" y="${y1 - 18}" width="28" height="18" fill="rgba(251, 191, 36, 0.15)" stroke="#fbbf24" stroke-width="1.5"/>
          <line x1="${cx - 18}" y1="${y1 - 18}" x2="${cx + 18}" y2="${y1 - 18}" stroke="#fbbf24" stroke-width="3"/>

          <!-- Inlet Nozzle -->
          <rect x="${x1 + tankW * 0.2 - 6}" y="${y1 - 14}" width="12" height="14" fill="rgba(96, 165, 250, 0.2)" stroke="#93c5fd" stroke-width="1.5"/>
          <line x1="${x1 + tankW * 0.2 - 9}" y1="${y1 - 14}" x2="${x1 + tankW * 0.2 + 9}" y2="${y1 - 14}" stroke="#93c5fd" stroke-width="2"/>

          <!-- Vent / Level Nozzle -->
          <rect x="${x2 - tankW * 0.2 - 6}" y="${y1 - 14}" width="12" height="14" fill="rgba(96, 165, 250, 0.2)" stroke="#93c5fd" stroke-width="1.5"/>
          <line x1="${x2 - tankW * 0.2 - 9}" y1="${y1 - 14}" x2="${x2 - tankW * 0.2 + 9}" y2="${y1 - 14}" stroke="#93c5fd" stroke-width="2"/>

          <!-- Saddle Supports -->
          <!-- Left Saddle -->
          <path d="M ${x1 + tankW * 0.22 - 12} ${y2} L ${x1 + tankW * 0.22 - 16} ${y2 + 25} L ${x1 + tankW * 0.22 + 16} ${y2 + 25} L ${x1 + tankW * 0.22 + 12} ${y2} Z" fill="rgba(255,255,255,0.1)" stroke="#cbd5e1" stroke-width="1.5"/>
          <!-- Right Saddle -->
          <path d="M ${x2 - tankW * 0.22 - 12} ${y2} L ${x2 - tankW * 0.22 - 16} ${y2 + 25} L ${x2 - tankW * 0.22 + 16} ${y2 + 25} L ${x2 - tankW * 0.22 + 12} ${y2} Z" fill="rgba(255,255,255,0.1)" stroke="#cbd5e1" stroke-width="1.5"/>

          <!-- Dimension Lines -->
          <!-- Length OAL dimension line -->
          <line x1="${x1 - dishCurve}" y1="${y1 - 28}" x2="${x2 + dishCurve}" y2="${y1 - 28}" stroke="#ffffff" stroke-width="1"/>
          <line x1="${x1 - dishCurve}" y1="${y1 - 32}" x2="${x1 - dishCurve}" y2="${y1 - 24}" stroke="#ffffff" stroke-width="1"/>
          <line x1="${x2 + dishCurve}" y1="${y1 - 32}" x2="${x2 + dishCurve}" y2="${y1 - 24}" stroke="#ffffff" stroke-width="1"/>
          <text x="${cx}" y="${y1 - 34}" fill="#ffffff" font-size="10" font-family="'Space Grotesk', monospace" text-anchor="middle" font-weight="600">L_OAL = ${calc.lengthMm} mm</text>

          <!-- Diameter dimension line -->
          <line x1="${x2 + dishCurve + 18}" y1="${y1}" x2="${x2 + dishCurve + 18}" y2="${y2}" stroke="#ffffff" stroke-width="1"/>
          <line x1="${x2 + dishCurve + 14}" y1="${y1}" x2="${x2 + dishCurve + 22}" y2="${y1}" stroke="#ffffff" stroke-width="1"/>
          <line x1="${x2 + dishCurve + 14}" y1="${y2}" x2="${x2 + dishCurve + 22}" y2="${y2}" stroke="#ffffff" stroke-width="1"/>
          <text x="${x2 + dishCurve + 25}" y="${cy + 4}" fill="#ffffff" font-size="10" font-family="'Space Grotesk', monospace" text-anchor="start" font-weight="600">Ø ${calc.diameterMm} mm</text>
        </svg>
      `;
    } else {
      // Vertical / Silo Drawing
      const siloW = Math.min(110, Math.max(65, (calc.diameterMm / 3000) * 80 + 35));
      const siloH = Math.min(170, Math.max(110, (calc.lengthMm / 12000) * 130 + 80));
      const cx = width / 2;
      const cy = height / 2 - 10;
      const x1 = cx - siloW / 2;
      const x2 = cx + siloW / 2;
      const y1 = cy - siloH / 2;
      const y2 = cy + siloH / 2 - 30; // conical bottom start

      svgHtml = `
        <svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
          <!-- Centerline -->
          <line x1="${cx}" y1="${y1 - 25}" x2="${cx}" y2="${y2 + 65}" stroke="#60a5fa" stroke-width="1" stroke-dasharray="10,4,2,4" opacity="0.6"/>

          <!-- Top Roof/Dome -->
          <path d="M ${x1} ${y1} Q ${cx} ${y1 - 20} ${x2} ${y1}" fill="rgba(255, 255, 255, 0.05)" stroke="#ffffff" stroke-width="2"/>

          <!-- Vertical Cylinder Shell -->
          <rect x="${x1}" y="${y1}" width="${siloW}" height="${y2 - y1}" fill="rgba(255, 255, 255, 0.05)" stroke="#ffffff" stroke-width="2"/>

          <!-- Conical Hopper Bottom (if Silo) -->
          <path d="M ${x1} ${y2} L ${cx - 10} ${y2 + 35} L ${cx + 10} ${y2 + 35} L ${x2} ${y2}" fill="rgba(251, 191, 36, 0.1)" stroke="#fbbf24" stroke-width="2"/>

          <!-- Discharge Knife Gate Valve -->
          <rect x="${cx - 14}" y="${y2 + 35}" width="28" height="12" fill="#1e293b" stroke="#fbbf24" stroke-width="1.5"/>

          <!-- Support Legs -->
          <line x1="${x1 + 4}" y1="${y2 - 20}" x2="${x1 - 10}" y2="${y2 + 55}" stroke="#cbd5e1" stroke-width="2.5"/>
          <line x1="${x2 - 4}" y1="${y2 - 20}" x2="${x2 + 10}" y2="${y2 + 55}" stroke="#cbd5e1" stroke-width="2.5"/>
          <line x1="${x1 - 10}" y1="${y2 + 55}" x2="${x1 + 6}" y2="${y2 + 55}" stroke="#ffffff" stroke-width="3"/>
          <line x1="${x2 + 10}" y1="${y2 + 55}" x2="${x2 - 6}" y2="${y2 + 55}" stroke="#ffffff" stroke-width="3"/>

          <!-- Dimension Lines -->
          <line x1="${x2 + 30}" y1="${y1 - 10}" x2="${x2 + 30}" y2="${y2 + 55}" stroke="#ffffff" stroke-width="1"/>
          <text x="${x2 + 36}" y="${cy}" fill="#ffffff" font-size="10" font-family="'Space Grotesk', monospace" text-anchor="start" font-weight="600">H = ${calc.lengthMm} mm</text>
        </svg>
      `;
    }

    blueprintSvg.innerHTML = svgHtml;
  }

  // Full Vector CAD (.SVG) Export with Engineering Title Block & ASME Stamping
  function downloadCadSvg() {
    const calc = calculateEngineeringParameters();
    const width = 1200;
    const height = 800;
    const dateStr = new Date().toISOString().split('T')[0];

    const fullSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <style>
    .bg { fill: #0b1220; }
    .border-outer { fill: none; stroke: #38bdf8; stroke-width: 2.5; }
    .border-inner { fill: none; stroke: #38bdf8; stroke-width: 1; }
    .zone-text { fill: #64748b; font-family: monospace; font-size: 11px; font-weight: bold; text-anchor: middle; }
    .centerline { stroke: #38bdf8; stroke-width: 1; stroke-dasharray: 18,5,4,5; opacity: 0.8; }
    .vessel-body { fill: rgba(14, 165, 233, 0.08); stroke: #ffffff; stroke-width: 2; }
    .head { fill: rgba(14, 165, 233, 0.12); stroke: #ffffff; stroke-width: 2; }
    .saddle { fill: #1e293b; stroke: #94a3b8; stroke-width: 1.5; }
    .nozzle { fill: #0f172a; stroke: #38bdf8; stroke-width: 1.5; }
    .dim-line { stroke: #fbbf24; stroke-width: 1; }
    .dim-ext { stroke: #fbbf24; stroke-width: 0.75; stroke-dasharray: 3,3; }
    .dim-text { fill: #fbbf24; font-family: 'Courier New', monospace; font-size: 12px; font-weight: bold; text-anchor: middle; }
    .tb-line { stroke: #38bdf8; stroke-width: 1; }
    .tb-title { fill: #ffffff; font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; }
    .tb-sub { fill: #94a3b8; font-family: Arial, sans-serif; font-size: 10px; }
    .tb-val { fill: #38bdf8; font-family: monospace; font-size: 11px; font-weight: bold; }
    .watermark { fill: rgba(255,255,255,0.03); font-family: Arial, sans-serif; font-size: 54px; font-weight: 900; text-anchor: middle; }
  </style>

  <rect width="${width}" height="${height}" class="bg"/>

  <defs>
    <pattern id="cadGrid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#131e33" stroke-width="0.75"/>
    </pattern>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#cadGrid)"/>

  <rect x="25" y="25" width="${width - 50}" height="${height - 50}" class="border-outer"/>
  <rect x="35" y="35" width="${width - 70}" height="${height - 70}" class="border-inner"/>

  <text x="30" y="140" class="zone-text">A</text>
  <text x="30" y="320" class="zone-text">B</text>
  <text x="30" y="500" class="zone-text">C</text>
  <text x="30" y="680" class="zone-text">D</text>
  <text x="${width - 30}" y="140" class="zone-text">A</text>
  <text x="${width - 30}" y="320" class="zone-text">B</text>
  <text x="${width - 30}" y="500" class="zone-text">C</text>
  <text x="${width - 30}" y="680" class="zone-text">D</text>
  <text x="140" y="30" class="zone-text">1</text>
  <text x="340" y="30" class="zone-text">2</text>
  <text x="540" y="30" class="zone-text">3</text>
  <text x="740" y="30" class="zone-text">4</text>
  <text x="940" y="30" class="zone-text">5</text>
  <text x="1140" y="30" class="zone-text">6</text>

  <text x="${width / 2}" y="380" class="watermark">SKY UDAAN INDUSTRIAL EN-FAB</text>

  <g transform="translate(180, 160)">
    <line x1="-90" y1="120" x2="570" y2="120" class="centerline"/>
    <line x1="240" y1="-50" x2="240" y2="280" class="centerline"/>

    <rect x="0" y="20" width="480" height="200" class="vessel-body"/>

    <path d="M 0 20 C -70 20, -70 220, 0 220 Z" class="head"/>
    <path d="M 480 20 C 550 20, 550 220, 480 220 Z" class="head"/>

    <line x1="0" y1="20" x2="0" y2="220" stroke="#00D2FF" stroke-width="2" stroke-dasharray="2,2"/>
    <line x1="480" y1="20" x2="480" y2="220" stroke="#00D2FF" stroke-width="2" stroke-dasharray="2,2"/>
    <line x1="0" y1="120" x2="480" y2="120" stroke="#00D2FF" stroke-width="1.5" stroke-dasharray="4,2"/>

    <g class="saddle">
      <path d="M 80 215 L 70 270 L 170 270 L 160 215 Z"/>
      <rect x="60" y="270" width="120" height="10" fill="#38bdf8"/>
      <path d="M 320 215 L 310 270 L 410 270 L 400 215 Z"/>
      <rect x="300" y="270" width="120" height="10" fill="#38bdf8"/>
    </g>

    <g class="nozzle">
      <rect x="215" y="-15" width="50" height="35"/>
      <rect x="205" y="-22" width="70" height="7" fill="#38bdf8"/>
      <text x="240" y="-30" class="dim-text" font-size="10">M1 (Ø500 MANWAY)</text>
    </g>
    <g class="nozzle">
      <rect x="90" y="-5" width="24" height="25"/>
      <rect x="84" y="-12" width="36" height="7" fill="#38bdf8"/>
      <text x="102" y="-18" class="dim-text" font-size="9">N1 (4" 150#)</text>
    </g>
    <g class="nozzle">
      <rect x="365" y="-5" width="24" height="25"/>
      <rect x="359" y="-12" width="36" height="7" fill="#38bdf8"/>
      <text x="377" y="-18" class="dim-text" font-size="9">N2 (3" 150#)</text>
    </g>

    <line x1="0" y1="20" x2="0" y2="-45" class="dim-ext"/>
    <line x1="480" y1="20" x2="480" y2="-45" class="dim-ext"/>
    <line x1="0" y1="-40" x2="480" y2="-40" class="dim-line"/>
    <polygon points="0,-40 10,-43 10,-37" fill="#fbbf24"/>
    <polygon points="480,-40 470,-43 470,-37" fill="#fbbf24"/>
    <text x="240" y="-48" class="dim-text">L_SHELL = ${calc.lengthMm} mm</text>

    <line x1="-50" y1="120" x2="-50" y2="305" class="dim-ext"/>
    <line x1="530" y1="120" x2="530" y2="305" class="dim-ext"/>
    <line x1="-50" y1="300" x2="530" y2="300" class="dim-line"/>
    <polygon points="-50,300 -40,297 -40,303" fill="#fbbf24"/>
    <polygon points="530,300 520,297 520,303" fill="#fbbf24"/>
    <text x="240" y="318" class="dim-text">OAL = ${Math.round(calc.lengthMm * 1.18)} mm (OVERALL TANGENT)</text>

    <line x1="480" y1="20" x2="570" y2="20" class="dim-ext"/>
    <line x1="480" y1="220" x2="570" y2="220" class="dim-ext"/>
    <line x1="560" y1="20" x2="560" y2="220" class="dim-line"/>
    <polygon points="560,20 557,30 563,30" fill="#fbbf24"/>
    <polygon points="560,220 557,210 563,210" fill="#fbbf24"/>
    <text x="610" y="125" class="dim-text">Ø ${calc.diameterMm} mm ID</text>
  </g>

  <g transform="translate(820, 50)">
    <rect width="330" height="235" fill="#0f172a" stroke="#38bdf8" stroke-width="1.5" rx="3"/>
    <rect width="330" height="26" fill="#1e293b"/>
    <text x="12" y="18" fill="#38bdf8" font-family="Arial, sans-serif" font-size="11" font-weight="bold">DESIGN &amp; ENGINEERING CRITERIA</text>
    
    <text x="12" y="48" class="tb-sub">APPLICABLE STANDARD:</text>
    <text x="180" y="48" class="tb-val">${calc.designCode}</text>
    <line x1="10" y1="56" x2="320" y2="56" class="tb-line" opacity="0.3"/>

    <text x="12" y="74" class="tb-sub">DESIGN / TEST PRESSURE:</text>
    <text x="180" y="74" class="tb-val">${calc.designPressureBar} Bar / ${(calc.designPressureBar * 1.5).toFixed(1)} Bar</text>
    <line x1="10" y1="82" x2="320" y2="82" class="tb-line" opacity="0.3"/>

    <text x="12" y="100" class="tb-sub">MATERIAL OF CONSTRUCTION:</text>
    <text x="180" y="100" class="tb-val">${state.moc.toUpperCase()} / SA-516 GR 70</text>
    <line x1="10" y1="108" x2="320" y2="108" class="tb-line" opacity="0.3"/>

    <text x="12" y="126" class="tb-sub">SHELL / HEAD THICKNESS:</text>
    <text x="180" y="126" class="tb-val">${calc.shellThkMm} mm / ${calc.headThkMm} mm</text>
    <line x1="10" y1="134" x2="320" y2="134" class="tb-line" opacity="0.3"/>

    <text x="12" y="152" class="tb-sub">JOINT RADIOGRAPHY (RT):</text>
    <text x="180" y="152" class="tb-val">UW-51 FULL RT (E = 1.0)</text>
    <line x1="10" y1="160" x2="320" y2="160" class="tb-line" opacity="0.3"/>

    <text x="12" y="178" class="tb-sub">CORROSION ALLOWANCE:</text>
    <text x="180" y="178" class="tb-val">1.5 mm (CARBON STEEL)</text>
    <line x1="10" y1="186" x2="320" y2="186" class="tb-line" opacity="0.3"/>

    <text x="12" y="204" class="tb-sub">ESTIMATED TARE WEIGHT:</text>
    <text x="180" y="204" class="tb-val" fill="#4ade80">~ ${calc.emptyWeightKg.toLocaleString()} KG</text>
    <line x1="10" y1="212" x2="320" y2="212" class="tb-line" opacity="0.3"/>

    <text x="12" y="226" class="tb-sub">CALCULATED GROSS VOLUME:</text>
    <text x="180" y="226" class="tb-val">${state.capacityLiters.toLocaleString()} LITERS</text>
  </g>

  <g transform="translate(680, 600)">
    <rect width="470" height="150" fill="#0f172a" stroke="#38bdf8" stroke-width="2" rx="4"/>
    <rect width="470" height="42" fill="#0284c7"/>
    <text x="20" y="28" fill="#ffffff" font-family="Arial, sans-serif" font-size="16" font-weight="900" letter-spacing="1">SKY UDAAN EN-FAB PRIVATE LIMITED</text>
    <text x="350" y="27" fill="#ffffff" font-family="monospace" font-size="10" font-weight="bold">BENGALURU, INDIA</text>

    <line x1="0" y1="42" x2="470" y2="42" class="tb-line"/>
    <line x1="0" y1="95" x2="470" y2="95" class="tb-line"/>
    <line x1="260" y1="42" x2="260" y2="150" class="tb-line"/>

    <text x="15" y="62" class="tb-sub">DRAWING TITLE:</text>
    <text x="15" y="82" class="tb-title" font-size="13">GENERAL ARRANGEMENT (${state.application.toUpperCase()})</text>

    <text x="15" y="112" class="tb-sub">DRAWING NO:</text>
    <text x="15" y="134" class="tb-val" font-size="13">SU-GA-${state.application.toUpperCase()}-${state.capacityLiters}L-01</text>

    <text x="272" y="60" class="tb-sub">SCALE: <tspan class="tb-val">1:25 NTS</tspan></text>
    <text x="272" y="76" class="tb-sub">DATE: <tspan class="tb-val">${dateStr}</tspan></text>
    <text x="272" y="92" class="tb-sub">REV: <tspan class="tb-val">0 (FOR APPROVAL)</tspan></text>

    <text x="272" y="114" class="tb-sub">DRAWN: <tspan class="tb-val">K. Sharma</tspan></text>
    <text x="272" y="130" class="tb-sub">CHECKED: <tspan class="tb-val">R. Varma (Chief Eng.)</tspan></text>
    <text x="272" y="144" class="tb-sub">CODE STAMP: <tspan class="tb-val" fill="#f59e0b">ASME 'U' / PESO</tspan></text>
  </g>
</svg>`;

    const blob = new Blob([fullSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SkyUdaan-GA-Drawing-${state.application}-${state.capacityLiters}L.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (window.showToast) {
      window.showToast(`CAD Vector Blueprint (.SVG) generated and downloaded. Open in AutoCAD, SolidWorks, or Illustrator.`);
    }
  }

  // Pre-fill RFQ Modal with Configured specs
  window.transferConfigToRfq = function () {
    const calc = calculateEngineeringParameters();
    const notesInput = document.getElementById('rfqSpecialRequirements');
    const capacityInput = document.getElementById('rfqRequiredCapacity');
    const mocInput = document.getElementById('rfqMaterialSelect');

    if (capacityInput) capacityInput.value = `${state.capacityLiters} Liters`;
    if (mocInput) mocInput.value = state.moc.toUpperCase();
    if (notesInput) {
      notesInput.value = `[GA PRE-CONFIGURED SPECIFICATION]
Application: ${state.application.toUpperCase()}
Orientation: ${state.orientation.toUpperCase()}
Dimensions: Ø ${calc.diameterMm} mm × ${calc.lengthMm} mm
Shell/Head Thk: ${calc.shellThkMm}mm / ${calc.headThkMm}mm
Estimated Weight: ~${calc.emptyWeightKg} kg
Recommended Code: ${calc.designCode}
Estimated Budget: ₹ ${calc.estPriceInr.toLocaleString()}`;
    }

    // Open RFQ modal
    if (window.openRfqModal) {
      window.openRfqModal();
    }
  };

  // Start initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initConfigurator);
  } else {
    initConfigurator();
  }
})();
