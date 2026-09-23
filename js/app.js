/**
 * SkyUdaan Application Logic
 * Product catalog filtering, multi-step RFQ modal wizard, WhatsApp integration, and UI interactions.
 */

// Comprehensive Product Catalog Data
const PRODUCTS_DATA = [
  // 1. FUEL & HYDROCARBON
  {
    id: 'prod-ug-diesel',
    category: 'fuel',
    title: 'Underground Fuel Storage Tank (UL-58 / PESO)',
    badge: 'PESO Approved',
    badgeClass: 'badge-blue',
    desc: 'Heavy-duty double-wall or single-wall containment vessel engineered for underground petroleum and diesel service with anti-corrosive coal tar epoxy exterior.',
    capacity: '2,000 L to 70,000 L',
    moc: 'IS 2062 Gr. B / Carbon Steel',
    standards: 'PESO, UL-58, IS 2825',
    pressure: 'Hydro Tested at 0.5 - 1.5 Bar',
    price: 'From ₹ 1,25,000'
  },
  {
    id: 'prod-ag-diesel',
    category: 'fuel',
    title: 'Aboveground MS Diesel Tank (UL-142 Compliant)',
    badge: 'UL-142 Standard',
    badgeClass: 'badge-orange',
    desc: 'Cylindrical horizontal tank with saddle supports, internal anti-surge baffles, calibrated dip-rod, emergency vent, and dual-layer polyurethane paint.',
    capacity: '5,000 L to 100,000 L',
    moc: 'Mild Steel / SA 516 Gr. 70',
    standards: 'UL-142, API 650 Appendix J',
    pressure: 'Atmospheric / 0.5 Bar',
    price: 'From ₹ 1,36,000'
  },
  {
    id: 'prod-diesel-bowser',
    category: 'fuel',
    title: 'Mobile Diesel Bowser & Dispenser Tank',
    badge: 'Mobile Skid',
    badgeClass: 'badge-blue',
    desc: 'Chassis-mounted or skid-mounted fuel tanker complete with 12V/24V high-flow fuel dispensing pump, nozzle, auto-cut, and grounding reel.',
    capacity: '1,000 L to 12,000 L',
    moc: 'IS 2062 Grade B Steel',
    standards: 'Motor Vehicles Act & PESO',
    pressure: 'Atmospheric',
    price: 'From ₹ 1,45,000'
  },

  // 2. CHEMICAL & PROCESS VESSELS
  {
    id: 'prod-ss-chemical',
    category: 'chemical',
    title: 'Stainless Steel Chemical Storage Tank',
    badge: 'Acid Resistant',
    badgeClass: 'badge-blue',
    desc: 'Corrosion-proof horizontal or vertical bulk storage tank for acids, alkalis, solvents, and industrial reagents with electropolished interior.',
    capacity: '1,000 L to 60,000 L',
    moc: 'SS 316L / SS 304 / Hastelloy',
    standards: 'ASME Sec VIII / ASTM A240',
    pressure: 'Full Vacuum to 3.0 Bar',
    price: 'From ₹ 1,15,000'
  },
  {
    id: 'prod-jacketed-reactor',
    category: 'chemical',
    title: 'SS Jacketed Reaction Vessel with Agitator',
    badge: 'Pharma / API Grade',
    badgeClass: 'badge-orange',
    desc: 'Precision process reactor with dimple or limpet coil jacket for steam heating/chilling, mechanical seal, anchor/propeller agitator, and cGMP finish.',
    capacity: '500 L to 15,000 L',
    moc: 'SS 316L Contact / SS 304 Jacket',
    standards: 'ASME Sec VIII Div 1, cGMP',
    pressure: 'Internal 3 Bar / Jacket 6 Bar',
    price: 'From ₹ 2,80,000'
  },
  {
    id: 'prod-liquid-mixer',
    category: 'chemical',
    title: 'Industrial Liquid Mixing Tank & Stirrer',
    badge: 'High Shear Agitation',
    badgeClass: 'badge-blue',
    desc: 'Equipped with top-mounted helical geared drive, variable frequency speed control, internal baffles, and conical bottom drain for complete evacuation.',
    capacity: '1,000 L to 30,000 L',
    moc: 'SS 304 / SS 316 / MS Rubber Lined',
    standards: 'IS 2825 / ISO Standards',
    pressure: 'Atmospheric',
    price: 'From ₹ 1,75,000'
  },

  // 3. BULK STORAGE SILOS
  {
    id: 'prod-cement-silo',
    category: 'silos',
    title: 'Heavy Cement Storage Silo (Bolted / Welded)',
    badge: 'RMC & Infrastructure',
    badgeClass: 'badge-blue',
    desc: 'Engineered for Ready-Mix Concrete batching plants and construction sites. Features pneumatic filling pipe, fluidizing aeration pads, and pressure relief valve.',
    capacity: '50 Tons to 250 Tons',
    moc: 'Structural Carbon Steel IS 2062',
    standards: 'DIN 1055, IS 9178',
    pressure: 'Atmospheric with Dust Collector',
    price: 'From ₹ 3,75,000'
  },
  {
    id: 'prod-flyash-silo',
    category: 'silos',
    title: 'Fly Ash & Lime Storage Silo with Aeration',
    badge: 'Power & AAC Plants',
    badgeClass: 'badge-orange',
    desc: 'Specialized 60-degree hopper cone to prevent material bridging. Includes top bag filter dust collector, level indicator radar, and screw conveyor discharge.',
    capacity: '60 Tons to 200 Tons',
    moc: 'Heavy Plate Mild Steel (6mm - 12mm)',
    standards: 'IS 9178 / BS 4076',
    pressure: 'Continuous Pneumatic Handling',
    price: 'From ₹ 4,20,000'
  },

  // 4. PRESSURE VESSELS
  {
    id: 'prod-air-receiver',
    category: 'pressure',
    title: 'Industrial Air Receiver & Gas Pressure Vessel',
    badge: '100% Radiography',
    badgeClass: 'badge-blue',
    desc: 'Certified compressed air receiver and surge vessel fabricated with automated submerged arc welding, post-weld heat treatment (PWHT), and dual relief valves.',
    capacity: '1,000 L to 30,000 L',
    moc: 'SA 516 Gr. 70 Boiler Quality',
    standards: 'ASME Sec VIII Div 1, IBR Certified',
    pressure: 'Design Pressure: 10 to 30 Bar',
    price: 'From ₹ 1,85,000'
  },
  {
    id: 'prod-cryogenic-vessel',
    category: 'pressure',
    title: 'Liquid Oxygen & Cryogenic Storage Vessel',
    badge: 'Super-Insulated',
    badgeClass: 'badge-orange',
    desc: 'Vacuum perlite insulated double-walled cryogenic vessel for bulk liquid nitrogen, oxygen, and argon containment at sub-zero temperatures.',
    capacity: '5 kL to 50 kL',
    moc: 'Inner: SS 304 / Outer: Carbon Steel',
    standards: 'PESO Static Cryogenic Vessel Code',
    pressure: 'Operating Pressure: 16 to 24 Bar',
    price: 'From ₹ 6,50,000'
  },

  // 5. TURNKEY AAC PLANTS
  {
    id: 'prod-aac-plant',
    category: 'aac',
    title: 'Turnkey AAC Block Manufacturing Plant',
    badge: 'Turnkey Capital EPC',
    badgeClass: 'badge-orange',
    desc: 'Full-scale automated green building material production line including raw material batching, aluminum powder mixing, high-precision tilting cutting line, and curing autoclaves.',
    capacity: '100 to 600 m³/day output',
    moc: 'Industrial Heavy Alloy & Hydraulics',
    standards: 'Turnkey EPC / ISO 9001',
    pressure: 'Steam Curing at 12 Bar',
    price: 'From ₹ 1.25 Crore to ₹ 1.45 Crore'
  },
  {
    id: 'prod-aac-autoclave',
    category: 'aac',
    title: 'Large Industrial AAC Curing Autoclave',
    badge: 'High-Pressure Steam',
    badgeClass: 'badge-blue',
    desc: 'Horizontal pressure vessel with safety quick-opening door, internal rail system for block trolleys, and automated PLC steam distribution.',
    capacity: 'Ø 2.5m × 31m Length',
    moc: 'High Tensile Boiler Plate SA 516',
    standards: 'ASME Sec VIII & IBR',
    pressure: 'Working: 12 Bar | Test: 18 Bar',
    price: 'From ₹ 15,00,000'
  }
];

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  initProductCatalog();
  initRfqWizard();
  initQuickSpecModal();
  initDossierModal();
  initNavigation();
});

/* ==========================================================================
   Product Catalog Rendering & Filtering
   ========================================================================== */
function initProductCatalog() {
  const container = document.getElementById('productsGrid');
  const tabs = document.querySelectorAll('.category-tab');

  if (!container) return;

  function renderCategory(cat) {
    const filtered = (cat === 'all') 
      ? PRODUCTS_DATA 
      : PRODUCTS_DATA.filter(p => p.category === cat);

    container.innerHTML = filtered.map(prod => `
      <div class="product-card" data-category="${prod.category}">
        <div class="card-badge-row">
          <span class="badge-pill ${prod.badgeClass}">${prod.badge}</span>
          <span class="font-mono text-blue" style="font-size:0.85rem; font-weight:700;">${prod.price}</span>
        </div>
        <h3 class="product-title">${prod.title}</h3>
        <p class="product-desc">${prod.desc}</p>
        
        <table class="product-specs-table">
          <tr>
            <td>Working Capacity:</td>
            <td>${prod.capacity}</td>
          </tr>
          <tr>
            <td>Material of Const:</td>
            <td>${prod.moc}</td>
          </tr>
          <tr>
            <td>Design Code / Std:</td>
            <td>${prod.standards}</td>
          </tr>
          <tr>
            <td>Operating Pressure:</td>
            <td>${prod.pressure}</td>
          </tr>
        </table>

        <div class="card-actions">
          <button class="btn btn-secondary" onclick="viewProductSpecs('${prod.id}')" style="padding:0.6rem 1rem; font-size:0.82rem;">
            Tech Specs
          </button>
          <button class="btn btn-primary" onclick="requestProductQuote('${prod.title}')" style="padding:0.6rem 1rem; font-size:0.82rem;">
            Request RFQ
          </button>
        </div>
      </div>
    `).join('');
  }

  // Initial render
  renderCategory('all');

  // Tab click listeners
  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      tabs.forEach(t => t.classList.remove('active'));
      e.currentTarget.classList.add('active');
      const cat = e.currentTarget.getAttribute('data-category');
      renderCategory(cat);
    });
  });
}

/* ==========================================================================
   Multi-Step RFQ Modal Wizard
   ========================================================================== */
let rfqCurrentStep = 1;

function initRfqWizard() {
  const modal = document.getElementById('rfqModal');
  const closeBtn = document.getElementById('closeRfqModal');
  const nextBtn = document.getElementById('rfqNextBtn');
  const prevBtn = document.getElementById('rfqPrevBtn');
  const submitBtn = document.getElementById('rfqSubmitBtn');
  const fastWaBtn = document.getElementById('rfqWhatsAppFastBtn');

  // Global Open Modal
  window.openRfqModal = function (prefilledTitle) {
    if (modal) {
      modal.classList.add('active');
      rfqCurrentStep = 1;
      showRfqStep(1);
      if (prefilledTitle) {
        const prodInput = document.getElementById('rfqProductName');
        if (prodInput) prodInput.value = prefilledTitle;
      }
    }
  };

  window.requestProductQuote = function (title) {
    window.openRfqModal(title);
  };

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (validateStep(rfqCurrentStep)) {
        rfqCurrentStep++;
        showRfqStep(rfqCurrentStep);
      }
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      rfqCurrentStep--;
      showRfqStep(rfqCurrentStep);
    });
  }

  if (submitBtn) {
    submitBtn.addEventListener('click', (e) => {
      e.preventDefault();
      handleRfqSubmission();
    });
  }

  if (fastWaBtn) {
    fastWaBtn.addEventListener('click', () => {
      dispatchWhatsAppInquiry();
    });
  }

  // File Dropzone Simulation
  const dropzone = document.getElementById('rfqDropzone');
  const fileInput = document.getElementById('rfqFileInput');
  const filePreview = document.getElementById('rfqFilePreview');

  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
      if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        filePreview.innerHTML = `
          <div style="margin-top:0.75rem; color:var(--blue-primary); font-family:var(--font-mono); font-size:0.85rem;">
            ✓ Attached: <strong>${file.name}</strong> (${(file.size / 1024).toFixed(1)} KB)
          </div>
        `;
      }
    });
  }
}

function showRfqStep(step) {
  // Hide all step sections
  document.querySelectorAll('.rfq-step-pane').forEach(p => p.style.display = 'none');
  
  // Show active step section
  const activePane = document.getElementById(`rfqStepPane${step}`);
  if (activePane) activePane.style.display = 'block';

  // Update step indicators
  document.querySelectorAll('.rfq-step-node').forEach(node => {
    const s = parseInt(node.getAttribute('data-step'), 10);
    node.classList.toggle('active', s <= step);
  });

  // Buttons visibility
  const prevBtn = document.getElementById('rfqPrevBtn');
  const nextBtn = document.getElementById('rfqNextBtn');
  const submitBtn = document.getElementById('rfqSubmitBtn');

  if (prevBtn) prevBtn.style.display = step > 1 ? 'inline-flex' : 'none';
  if (nextBtn) nextBtn.style.display = step < 3 ? 'inline-flex' : 'none';
  if (submitBtn) submitBtn.style.display = step === 3 ? 'inline-flex' : 'none';
}

function validateStep(step) {
  if (step === 1) {
    const medium = document.getElementById('rfqMediumSelect');
    if (medium && !medium.value) {
      alert('Please select the fluid or storage medium.');
      return false;
    }
  }
  return true;
}

function handleRfqSubmission() {
  const name = document.getElementById('rfqClientName')?.value || 'Client';
  const company = document.getElementById('rfqCompanyName')?.value || 'Enterprise Client';
  const email = document.getElementById('rfqClientEmail')?.value || 'N/A';
  const phone = document.getElementById('rfqClientPhone')?.value || 'N/A';
  const notes = document.getElementById('rfqSpecialRequirements')?.value || '';

  const modal = document.getElementById('rfqModal');
  if (modal) modal.classList.remove('active');

  showToast(`Engineering RFQ Submitted! Inquiry Reference #SKU-${Math.floor(100000 + Math.random() * 900000)}. Our Chief Fabricator will review and dispatch technical GA drawings within 4 hours.`);
}

function dispatchWhatsAppInquiry() {
  const medium = document.getElementById('rfqMediumSelect')?.value || 'Industrial Storage';
  const capacity = document.getElementById('rfqRequiredCapacity')?.value || 'Custom';
  const moc = document.getElementById('rfqMaterialSelect')?.value || 'IS 2062 / SS 304';
  const phone = '+917942638063';

  const text = encodeURIComponent(
    `Hello SkyUdaan Engineering Team,\n\nI would like a fast-track technical quotation for:\n- Application: ${medium}\n- Capacity: ${capacity}\n- MOC: ${moc}\n\nPlease share design catalog and GA drawing availability.`
  );

  window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${text}`, '_blank');
}

/* ==========================================================================
   Quick Spec Sheet Modal
   ========================================================================== */
function initQuickSpecModal() {
  const modal = document.getElementById('quickSpecModal');
  const closeBtn = document.getElementById('closeSpecModal');

  window.viewProductSpecs = function (id) {
    const prod = PRODUCTS_DATA.find(p => p.id === id);
    if (!prod || !modal) return;

    document.getElementById('specModalTitle').textContent = prod.title;
    document.getElementById('specModalContent').innerHTML = `
      <div style="display:flex; flex-direction:column; gap:1.25rem;">
        <div style="background:var(--blue-subtle); border:1px solid var(--blue-border); border-radius:var(--radius-xs); padding:1rem;">
          <h4 style="color:var(--blue-primary); margin-bottom:0.4rem; font-size:1rem;">Engineering Overview</h4>
          <p style="color:var(--text-secondary); font-size:0.9rem;">${prod.desc}</p>
        </div>

        <table class="product-specs-table" style="font-size:0.9rem;">
          <tr><td>Standard Capacity Range:</td><td>${prod.capacity}</td></tr>
          <tr><td>Material Specifications:</td><td>${prod.moc}</td></tr>
          <tr><td>Fabrication Codes:</td><td>${prod.standards}</td></tr>
          <tr><td>Design & Test Pressure:</td><td>${prod.pressure}</td></tr>
          <tr><td>Welding Standard:</td><td>Automatic Submerged Arc (100% Radiography)</td></tr>
          <tr><td>Surface Treatment:</td><td>Grit Blasted SA 2.5 + 350 Micron Epoxy</td></tr>
          <tr><td>Inspection Documents:</td><td>MTR, Hydrostatic Chart, NDT X-Ray, PESO/ASME Cert</td></tr>
        </table>

        <div style="margin-top:0.5rem; display:flex; gap:1rem;">
          <button class="btn btn-primary" onclick="requestProductQuote('${prod.title}')" style="flex:1;">Request Price & GA Drawing</button>
        </div>
      </div>
    `;

    modal.classList.add('active');
  };

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
  }
}

/* ==========================================================================
   Navigation & Notification Toast
   ========================================================================== */
function initNavigation() {
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const navLinks = document.querySelector('.nav-links');

  if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('active');
      mobileMenuBtn.classList.toggle('active', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        mobileMenuBtn.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }
}

function showToast(message) {
  const existing = document.getElementById('skyToast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'skyToast';
  toast.innerHTML = `
    <div style="display:flex; align-items:flex-start; gap:0.75rem;">
      <span style="color:var(--blue-primary); font-size:1.25rem;">🛡️</span>
      <div style="font-size:0.88rem; line-height:1.4; color:var(--text-primary);">${message}</div>
    </div>
  `;
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '85px',
    right: '25px',
    backgroundColor: '#ffffff',
    color: '#0f172a',
    padding: '1.15rem 1.5rem',
    borderRadius: '8px',
    border: '1px solid var(--blue-primary)',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.12)',
    zIndex: '9999',
    maxWidth: '420px',
    animation: 'fadeIn 0.25s ease-out'
  });

  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.4s ease';
    setTimeout(() => toast.remove(), 400);
  }, 6500);
}

/* ==========================================================================
   Laboratory NDT & ASME Mill Test Certificate Dossier Modal
   ========================================================================== */
function initDossierModal() {
  const modal = document.getElementById('dossierModal');
  const closeBtn = document.getElementById('closeDossierModal');

  window.openDossierModal = function () {
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  };

  window.closeDossierModal = function () {
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  };

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', window.closeDossierModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) window.closeDossierModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
      window.closeDossierModal();
    }
  });
}

/* ==========================================================================
   Full 3D / Chapter Card View Toggle
   ========================================================================== */
window.toggleChapterCards = function () {
  const overlay = document.querySelector('.hero-story-overlay');
  if (overlay) {
    overlay.classList.toggle('minimized');
    if (window.soundFX && window.soundFX.playClick) {
      window.soundFX.playClick();
    }
  }
};
