/**
 * Main Application Logic for Teacher E-Portfolio Web App
 * Handles Navigation, PDF Previews, Video Embeds, Filters, Admin Controls, and Modals.
 */

// Application State
const AppState = {
  currentView: "welcome",
  searchQuery: "",
  activeFilterYear: "all",
  activeFilterCategory: "all",
  activeIpRound: 1,
  activeAchTab: "teacher", // 'teacher' | 'student'
  activePaYear: "2567",
  previewDocument: null
};

// Initialize Application on DOM Ready
document.addEventListener("DOMContentLoaded", () => {
  initIcons();
  setupEventListeners();
  setupAdminStatus();
  renderCurrentView();
  updateGlobalStats();
});

// Re-render icons with Lucide
function initIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Navigation Handler
function navigateTo(viewId) {
  AppState.currentView = viewId;
  AppState.searchQuery = "";
  AppState.activeFilterYear = "all";
  AppState.activeFilterCategory = "all";

  // Update Sidebar Nav Links UI
  document.querySelectorAll(".nav-link").forEach(link => {
    const target = link.getAttribute("data-view");
    if (target === viewId) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });

  // Update Mobile Floating Bottom Nav Bar UI
  document.querySelectorAll(".mobile-nav-btn").forEach(btn => {
    const target = btn.getAttribute("data-mobile-nav");
    const iconWrapper = btn.querySelector("div");
    if (target === viewId) {
      btn.classList.add("text-blue-600", "font-bold");
      btn.classList.remove("text-slate-500");
      if (iconWrapper) {
        iconWrapper.classList.add("bg-blue-50", "text-blue-600");
      }
    } else {
      btn.classList.remove("text-blue-600", "font-bold");
      btn.classList.add("text-slate-500");
      if (iconWrapper) {
        iconWrapper.classList.remove("bg-blue-50", "text-blue-600");
      }
    }
  });

  // Mobile menu close
  closeMobileMenu();

  // Scroll to top
  window.scrollTo({ top: 0, behavior: "smooth" });

  // Render View
  renderCurrentView();
}

// Global Event Listeners
function setupEventListeners() {
  // Navigation clicks
  document.querySelectorAll("[data-view]").forEach(elem => {
    elem.addEventListener("click", (e) => {
      e.preventDefault();
      const target = elem.getAttribute("data-view");
      if (target) navigateTo(target);
    });
  });

  // Mobile menu toggle
  const mobileToggleBtn = document.getElementById("mobile-menu-toggle");
  if (mobileToggleBtn) {
    mobileToggleBtn.addEventListener("click", toggleMobileMenu);
  }

  // Admin switch button
  const adminToggleBtn = document.getElementById("btn-admin-toggle");
  if (adminToggleBtn) {
    adminToggleBtn.addEventListener("click", handleAdminToggleClick);
  }

  // Global search input and Live Autocomplete setup
  setupSearchAutocomplete();

  // Listen to Storage Data Changes
  window.addEventListener("portfolioDataChanged", () => {
    updateGlobalStats();
    renderCurrentView();
  });

  window.addEventListener("adminStatusChanged", () => {
    setupAdminStatus();
    renderCurrentView();
  });

  window.addEventListener("viewerSimulationChanged", () => {
    setupAdminStatus();
    renderCurrentView();
  });

  // Listen to Cloud Real-time Events
  window.addEventListener("cloudStatusChanged", () => {
    updateCloudStatusBadge();
  });

  window.addEventListener("cloudSyncSuccess", () => {
    const badge = document.getElementById("cloud-sync-badge-container");
    if (badge) {
      badge.classList.add("scale-105");
      setTimeout(() => badge.classList.remove("scale-105"), 800);
    }
  });
}

// ==========================================
// Live Search Autocomplete & Suggestion Engine
// ==========================================
function setupSearchAutocomplete() {
  const searchInput = document.getElementById("global-search-input");
  const dropdown = document.getElementById("search-suggestions-dropdown");

  if (!searchInput || !dropdown) return;

  // On Focus: only show suggestions if user has already typed something
  searchInput.addEventListener("focus", () => {
    const val = searchInput.value.trim();
    if (val.length > 0) {
      renderSearchSuggestions(val);
    } else {
      hideSearchDropdown();
    }
  });

  // Real-time filtering on Input: show suggestions ONLY when typing
  searchInput.addEventListener("input", (e) => {
    const query = e.target.value.trim();
    AppState.searchQuery = query.toLowerCase();
    renderCurrentView(); // filter underlying view

    if (query.length > 0) {
      renderSearchSuggestions(query);
    } else {
      hideSearchDropdown();
    }
  });

  // Handle Enter key
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      triggerSearchButtonClick();
    } else if (e.key === "Escape") {
      hideSearchDropdown();
    }
  });

  // Click outside to close dropdown
  document.addEventListener("click", (e) => {
    const searchContainer = document.getElementById("search-box-container");
    if (searchContainer && !searchContainer.contains(e.target)) {
      hideSearchDropdown();
    }
  });
}

function hideSearchDropdown() {
  const dropdown = document.getElementById("search-suggestions-dropdown");
  if (dropdown) dropdown.classList.add("hidden");
}

function showSearchDropdown() {
  const dropdown = document.getElementById("search-suggestions-dropdown");
  if (dropdown) dropdown.classList.remove("hidden");
}

// Build Search Index and Render Suggestion Items
function renderSearchSuggestions(query = "") {
  const dropdown = document.getElementById("search-suggestions-dropdown");
  const resultsContainer = document.getElementById("search-results-list");
  const countContainer = document.getElementById("search-results-count");
  if (!dropdown || !resultsContainer) return;

  const cleanQuery = query.toLowerCase().trim();

  // If search query is empty, do NOT show dropdown
  if (!cleanQuery) {
    hideSearchDropdown();
    return;
  }

  const data = window.portfolioStorage.getData();
  const isAdmin = window.portfolioStorage.isAdmin();

  // Build unified searchable index
  const index = [];

  // 1. Lesson Plans
  data.lessonPlans?.forEach(item => {
    if (isAdmin || item.isVisible) {
      index.push({
        id: item.id,
        title: item.title,
        subtitle: `${item.code || ''} ${item.grade || ''} (${item.academicYear || ''})`,
        category: "แผนการสอน",
        icon: "book-open",
        badgeBg: "bg-sky-100 text-sky-800",
        view: "lesson-plans",
        docUrl: item.pdfUrl || item.driveUrl,
        coverUrl: item.coverUrl,
        searchTerms: `${item.title} ${item.code} ${item.grade} ${item.subject} แผนการสอน ${item.academicYear}`.toLowerCase()
      });
    }
  });

  // 2. PA Records
  data.paRecords?.forEach(item => {
    if (isAdmin || item.isVisible) {
      index.push({
        id: item.id,
        title: item.challengeTitle || item.roundTitle,
        subtitle: `วPA ปีงบประมาณ ${item.fiscalYear} • ${item.status || ''}`,
        category: "การประเมิน วPA",
        icon: "file-check",
        badgeBg: "bg-amber-100 text-amber-800",
        view: "pa",
        docUrl: item.pa1DocUrl || item.pa2DocUrl,
        coverUrl: item.coverUrl,
        searchTerms: `${item.roundTitle} ${item.challengeTitle} ${item.fiscalYear} วPA ข้อตกลง`.toLowerCase()
      });
    }
  });

  // 3. Intensive Preparation
  data.intensivePrep?.forEach(item => {
    if (isAdmin || item.isVisible) {
      index.push({
        id: item.id,
        title: item.title,
        subtitle: `การประเมินครั้งที่ ${item.round} (${item.category || ''})`,
        category: "ครูผู้ช่วย",
        icon: "graduation-cap",
        badgeBg: "bg-teal-100 text-teal-800",
        view: "intensive-prep",
        docUrl: item.pdfUrl,
        coverUrl: item.coverUrl,
        searchTerms: `${item.title} ${item.category} ${item.subCategory} ครูผู้ช่วย ครั้งที่ ${item.round}`.toLowerCase()
      });
    }
  });

  // 4. Official Docs
  data.officialDocs?.forEach(item => {
    if (isAdmin || item.isVisible) {
      index.push({
        id: item.id,
        title: item.title,
        subtitle: `${item.category} • ${item.docNumber || item.academicYear}`,
        category: "เอกสารราชการ",
        icon: "folder-kanban",
        badgeBg: "bg-indigo-100 text-indigo-800",
        view: "official-docs",
        docUrl: item.pdfUrl,
        coverUrl: item.coverUrl,
        searchTerms: `${item.title} ${item.docNumber} ${item.category} ${item.academicYear} คำสั่ง เกียรติบัตร`.toLowerCase()
      });
    }
  });

  // 5. Achievements
  data.achievements?.forEach(item => {
    if (isAdmin || item.isVisible) {
      index.push({
        id: item.id,
        title: item.title,
        subtitle: `${item.level} • ${item.organization || ''} (${item.academicYear})`,
        category: "ผลงานและรางวัล",
        icon: "trophy",
        badgeBg: "bg-emerald-100 text-emerald-800",
        view: "achievements",
        docUrl: item.certificateUrl,
        coverUrl: item.coverUrl,
        searchTerms: `${item.title} ${item.level} ${item.organization} รางวัล ${item.type}`.toLowerCase()
      });
    }
  });

  // 6. Gallery
  data.gallery?.forEach(item => {
    if (isAdmin || item.isVisible) {
      index.push({
        id: item.id,
        title: item.title,
        subtitle: `${item.category} • ${item.date}`,
        category: "ภาพกิจกรรม",
        icon: "images",
        badgeBg: "bg-rose-100 text-rose-800",
        view: "gallery",
        docUrl: null,
        coverUrl: item.coverImage,
        searchTerms: `${item.title} ${item.category} ${item.location} กิจกรรม`.toLowerCase()
      });
    }
  });

  // Filter items matching query
  const matches = index.filter(item => item.searchTerms.includes(cleanQuery));

  // Update count
  if (countContainer) {
    countContainer.textContent = `พบ ${matches.length} รายการที่ตรงกัน`;
  }

  // Render HTML
  if (matches.length === 0) {
    resultsContainer.innerHTML = `
      <div class="p-6 text-center text-slate-400">
        <i data-lucide="search-x" class="w-8 h-8 mx-auto mb-2 text-slate-300"></i>
        <p class="font-medium text-slate-600">ไม่พบเอกสารหรือข้อมูลที่ตรงกับ "${escapeHtml(query)}"</p>
        <p class="text-[11px] text-slate-400 mt-1">ลองพิมพ์คำค้นสั้นๆ เช่น 'แผน', 'วPA', 'คำสั่ง', 'รางวัล', 'กิจกรรม'</p>
      </div>
    `;
  } else {
    resultsContainer.innerHTML = matches.map(item => `
      <div onclick="selectSearchResult('${item.view}', '${item.id}', '${item.docUrl || ''}', '${escapeHtml(item.title)}')" 
        class="p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer flex items-center gap-3 transition-colors group">
        <div class="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-slate-100 border border-slate-200">
          <img src="${item.coverUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136'}" alt="cover" class="w-full h-full object-cover group-hover:scale-105 transition-transform">
        </div>
        <div class="flex-1 overflow-hidden">
          <div class="flex items-center gap-1.5 mb-0.5">
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${item.badgeBg}">
              <i data-lucide="${item.icon}" class="w-3 h-3"></i> ${item.category}
            </span>
            <span class="text-[11px] text-slate-400 truncate">${item.subtitle}</span>
          </div>
          <h4 class="font-bold text-slate-800 text-xs truncate group-hover:text-blue-600 transition-colors">
            ${highlightMatch(item.title, cleanQuery)}
          </h4>
        </div>
        <i data-lucide="chevron-right" class="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0"></i>
      </div>
    `).join("");
  }

  showSearchDropdown();
  initIcons();
}

function highlightMatch(text, query) {
  if (!query) return escapeHtml(text);
  const regex = new RegExp(`(${query.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")})`, "gi");
  return escapeHtml(text).replace(regex, '<mark class="bg-amber-200 text-slate-900 font-bold px-0.5 rounded">$1</mark>');
}

function escapeHtml(str) {
  return String(str || "").replace(/[&<>"']/g, function (m) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m];
  });
}

// Select item from search results
function selectSearchResult(viewId, itemId, docUrl, title) {
  hideSearchDropdown();
  navigateTo(viewId);

  // If item has PDF / Document URL, trigger preview modal automatically!
  if (docUrl && docUrl !== "null" && docUrl !== "undefined") {
    setTimeout(() => {
      openDocumentPreview(title, docUrl);
    }, 250);
  }
}

// Quick apply suggestion tag
function applySearchSuggestion(keyword) {
  const searchInput = document.getElementById("global-search-input");
  if (searchInput) {
    searchInput.value = keyword;
    AppState.searchQuery = keyword.toLowerCase();
    renderCurrentView();
    renderSearchSuggestions(keyword);
  }
}

function triggerSearchButtonClick() {
  const searchInput = document.getElementById("global-search-input");
  const query = searchInput ? searchInput.value.trim() : "";
  if (!query) {
    hideSearchDropdown();
    return;
  }

  // Filter current active view
  AppState.searchQuery = query.toLowerCase();
  renderCurrentView();
  
  // Also render suggestions with results
  renderSearchSuggestions(query);
}

function toggleMobileMenu() {
  const sidebar = document.getElementById("sidebar-container");
  if (sidebar) {
    sidebar.classList.toggle("-translate-x-full");
  }
}

function closeMobileMenu() {
  const sidebar = document.getElementById("sidebar-container");
  if (sidebar && window.innerWidth < 1024) {
    sidebar.classList.add("-translate-x-full");
  }
}

// Setup Admin UI State
function setupAdminStatus() {
  const isAdmin = window.portfolioStorage.isAdmin();
  const isSimulating = window.portfolioStorage.isSimulatingViewer();
  const badge = document.getElementById("user-role-badge");
  const adminBtn = document.getElementById("btn-admin-toggle");
  const adminTools = document.getElementById("admin-tools-container");
  const simTopBar = document.getElementById("simulation-top-bar");

  // Toggle Top Simulation Bar
  if (simTopBar) {
    if (isSimulating) {
      simTopBar.classList.remove("hidden");
    } else {
      simTopBar.classList.add("hidden");
    }
  }

  if (isAdmin) {
    if (adminTools) adminTools.classList.remove("hidden");
    if (badge) {
      badge.innerHTML = `<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm shadow-amber-500/20">
        <i data-lucide="shield-check" class="w-3.5 h-3.5"></i> ผู้ดูแลระบบ (Admin)
      </span>`;
    }
    if (adminBtn) {
      adminBtn.innerHTML = `<i data-lucide="log-out" class="w-4 h-4 mr-2 text-rose-600"></i> <span>ออกจากโหมด Admin</span>`;
      adminBtn.className = "w-full flex items-center justify-center px-4 py-2.5 text-xs font-bold rounded-xl text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 shadow-sm transition-all";
    }
  } else {
    if (adminTools) adminTools.classList.add("hidden");
    if (badge) {
      badge.innerHTML = ""; // Clear badge for public viewers
    }
    if (adminBtn) {
      adminBtn.innerHTML = `<i data-lucide="lock" class="w-4 h-4 mr-2 text-blue-600"></i> <span>เข้าสู่ระบบ Admin</span>`;
      adminBtn.className = "w-full flex items-center justify-center px-4 py-2.5 text-xs font-bold rounded-xl text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 shadow-sm transition-all";
    }
  }

  updateCloudStatusBadge();
  initIcons();
}

function updateCloudStatusBadge() {
  const container = document.getElementById("cloud-sync-badge-container");
  if (!container) return;
  const isConnected = window.portfolioStorage.isCloudConnected;
  const isAdmin = window.portfolioStorage.isAdmin();

  if (isConnected) {
    container.innerHTML = `
      <button onclick="openCloudConfigModal()" class="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-sm cursor-pointer hover:bg-emerald-500/30 transition-all" title="ระบบเชื่อมต่อฐานข้อมูลคลาวด์เรียลไทม์ (Live Auto-Sync)">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <i data-lucide="cloud" class="w-3.5 h-3.5 text-emerald-400"></i>
        <span class="hidden md:inline font-prompt">Cloud Real-Time</span>
      </button>
    `;
  } else if (isAdmin) {
    container.innerHTML = `
      <button onclick="openCloudConfigModal()" class="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold bg-white/10 text-amber-300 hover:bg-amber-500/20 border border-amber-400/30 shadow-sm cursor-pointer transition-all" title="คลิกเพื่อเชื่อมต่อ Firebase Cloud Real-Time">
        <i data-lucide="cloud-off" class="w-3.5 h-3.5 text-amber-400"></i>
        <span class="hidden md:inline font-prompt">เชื่อมต่อ Cloud</span>
      </button>
    `;
  } else {
    container.innerHTML = "";
  }
  initIcons();
}
window.updateCloudStatusBadge = updateCloudStatusBadge;

// Copy Shareable Link Helper
function copyShareLink() {
  const url = window.location.href;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(() => {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "คัดลอกลิงก์แฟ้มผลงานแล้ว!",
        text: "สามารถส่งให้ผู้ที่สนใจเข้าชมได้ทันที",
        showConfirmButton: false,
        timer: 2000
      });
    }).catch(() => {
      promptShareUrl(url);
    });
  } else {
    promptShareUrl(url);
  }
}

function promptShareUrl(url) {
  Swal.fire({
    title: "ลิงก์เข้าชมแฟ้มผลงาน",
    html: `<input type="text" value="${url}" readonly class="w-full p-2.5 text-xs border rounded-lg bg-slate-50 font-mono select-all">`,
    confirmButtonText: "ปิด",
    confirmButtonColor: "#2563eb"
  });
}

function openChangePinModal() {
  Swal.fire({
    title: `<span class="text-base font-bold font-prompt text-slate-800 flex items-center justify-center gap-2">
      <i data-lucide="key-round" class="w-5 h-5 text-amber-500"></i> เปลี่ยนรหัส PIN ผู้ดูแลระบบ
    </span>`,
    html: `
      <div class="space-y-4 text-left font-sarabun text-xs">
        <!-- Old PIN -->
        <div>
          <label class="block font-bold text-slate-700 mb-1.5 font-prompt">รหัส PIN เดิม (ค่าเริ่มต้น: 1234): *</label>
          <div class="relative flex items-center">
            <input id="old-pin-input" type="password" maxlength="10" class="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 text-slate-800 text-sm focus:ring-2 focus:ring-blue-500 font-mono tracking-wider" placeholder="ใส่รหัส PIN ปัจจุบัน">
            <button type="button" id="btn-toggle-old-pin" class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-blue-600 cursor-pointer" title="ดูรหัสผ่าน">
              <i data-lucide="eye" class="w-4 h-4"></i>
            </button>
          </div>
        </div>

        <!-- New PIN -->
        <div>
          <label class="block font-bold text-slate-700 mb-1.5 font-prompt">รหัส PIN ใหม่ (อย่างน้อย 4 หลัก): *</label>
          <div class="relative flex items-center">
            <input id="new-pin-input" type="password" maxlength="10" class="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 text-slate-800 text-sm focus:ring-2 focus:ring-blue-500 font-mono tracking-wider" placeholder="ใส่รหัส PIN ใหม่">
            <button type="button" id="btn-toggle-new-pin" class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-blue-600 cursor-pointer" title="ดูรหัสผ่าน">
              <i data-lucide="eye" class="w-4 h-4"></i>
            </button>
          </div>
        </div>

        <div class="p-2.5 bg-amber-50 rounded-xl border border-amber-200/80 text-[11px] text-amber-900 font-sarabun flex items-center gap-1.5">
          <i data-lucide="info" class="w-4 h-4 text-amber-600 shrink-0"></i>
          <span>กดที่ไอคอนรูปตา 👁️ เพื่อดูรหัสที่กำลังพิมพ์ได้ครับ</span>
        </div>
      </div>
    `,
    width: "480px",
    showCancelButton: true,
    confirmButtonText: "💾 บันทึก PIN ใหม่",
    cancelButtonText: "ยกเลิก",
    confirmButtonColor: "#2563eb",
    cancelButtonColor: "#64748b",
    didOpen: () => {
      initIcons();

      const oldInput = document.getElementById("old-pin-input");
      const newInput = document.getElementById("new-pin-input");
      const toggleOldBtn = document.getElementById("btn-toggle-old-pin");
      const toggleNewBtn = document.getElementById("btn-toggle-new-pin");

      let showOld = false;
      let showNew = false;

      if (toggleOldBtn && oldInput) {
        toggleOldBtn.addEventListener("click", () => {
          showOld = !showOld;
          oldInput.type = showOld ? "text" : "password";
          toggleOldBtn.innerHTML = `<i data-lucide="${showOld ? 'eye-off' : 'eye'}" class="w-4 h-4"></i>`;
          initIcons();
        });
      }

      if (toggleNewBtn && newInput) {
        toggleNewBtn.addEventListener("click", () => {
          showNew = !showNew;
          newInput.type = showNew ? "text" : "password";
          toggleNewBtn.innerHTML = `<i data-lucide="${showNew ? 'eye-off' : 'eye'}" class="w-4 h-4"></i>`;
          initIcons();
        });
      }
    },
    preConfirm: () => {
      const oldPin = document.getElementById("old-pin-input").value.trim();
      const newPin = document.getElementById("new-pin-input").value.trim();
      const res = window.portfolioStorage.changePin(oldPin, newPin);
      if (!res.success) {
        Swal.showValidationMessage(res.message);
        return false;
      }
      return res;
    }
  }).then((result) => {
    if (result.isConfirmed) {
      Swal.fire({
        icon: "success",
        title: "สำเร็จ",
        text: "เปลี่ยนรหัส PIN สำหรับเข้าสู่ระบบ Admin เรียบร้อยแล้ว",
        timer: 2000,
        showConfirmButton: false
      });
    }
  });
}

function handleAdminToggleClick() {
  if (window.portfolioStorage.isAdmin()) {
    Swal.fire({
      background: "#081735",
      customClass: {
        popup: "rounded-3xl p-6 shadow-2xl border-2 border-amber-500/40 text-white font-prompt max-w-sm",
        confirmButton: "px-6 py-2.5 rounded-xl font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-md text-sm",
        cancelButton: "px-5 py-2.5 rounded-xl font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 text-sm"
      },
      title: null,
      html: `
        <div class="space-y-3 text-center font-prompt pt-2">
          <div class="w-14 h-14 mx-auto rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shadow-sm">
            <i data-lucide="log-out" class="w-7 h-7"></i>
          </div>
          <h3 class="text-xl font-bold text-white pt-1">ออกจากโหมดผู้ดูแลระบบ?</h3>
          <p class="text-xs text-slate-300">ระบบจะสลับกลับสู่มุมมองคณะกรรมการ/ผู้เข้าชม (Viewer Mode)</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonColor: "#e11d48",
      cancelButtonColor: "#334155",
      confirmButtonText: "ยืนยันออกจาก Admin",
      cancelButtonText: "ยกเลิก",
      didOpen: () => initIcons()
    }).then((result) => {
      if (result.isConfirmed) {
        window.portfolioStorage.setAdmin(false);
        renderCurrentView();
        setupAdminStatus();
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: "กลับสู่โหมดผู้เข้าชม (Viewer) เรียบร้อย",
          showConfirmButton: false,
          timer: 1500
        });
      }
    });
  } else {
    openAdminPinModal();
  }
}

function openAdminPinModal() {
  Swal.fire({
    title: null,
    background: "#081735",
    html: `
      <div class="space-y-4 text-left font-prompt pt-1 text-white">
        
        <!-- Header with Glowing Gold Lock Icon -->
        <div class="text-center space-y-1.5 pb-1">
          <div class="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-navy-950 shadow-lg shadow-amber-500/25">
            <i data-lucide="lock" class="w-7 h-7 text-navy-950"></i>
          </div>
          <h3 class="text-xl font-bold text-white pt-1">เข้าสู่ระบบผู้ดูแลระบบ (Admin)</h3>
          <p class="text-xs text-blue-200">กรุณาระบุรหัส PIN เพื่อปลดล็อกการจัดการข้อมูลและแก้ไขแฟ้มผลงาน</p>
        </div>

        <!-- Clean Dark Modern PIN Input with Eye Toggle -->
        <div class="pt-2">
          <div class="relative flex items-center">
            <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <i data-lucide="key" class="w-4 h-4 text-amber-400"></i>
            </div>
            <input id="admin-pin-input" type="password" maxlength="10" placeholder="กรุณากรอกรหัส PIN" autofocus autocomplete="off"
              class="w-full pl-10 pr-10 py-3 text-sm rounded-xl border border-blue-900/80 bg-navy-900/90 text-white placeholder:text-slate-500 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/25 outline-none transition-all tracking-widest font-mono">
            <button type="button" id="btn-toggle-pin-visibility" class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-amber-300 transition-colors cursor-pointer" title="แสดง/ซ่อนรหัส">
              <i data-lucide="eye" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: "เข้าสู่ระบบ",
    cancelButtonText: "ยกเลิก",
    confirmButtonColor: "#f59e0b",
    cancelButtonColor: "#334155",
    buttonsStyling: true,
    customClass: {
      popup: "rounded-3xl p-6 shadow-2xl border-2 border-amber-500/40 max-w-sm",
      confirmButton: "px-6 py-2.5 rounded-xl font-bold text-navy-950 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-600 hover:to-amber-500 shadow-lg shadow-amber-500/20 text-sm",
      cancelButton: "px-5 py-2.5 rounded-xl font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 text-sm"
    },
    didOpen: () => {
      initIcons();
      const input = document.getElementById("admin-pin-input");
      const toggleBtn = document.getElementById("btn-toggle-pin-visibility");
      let isPassword = true;

      if (input) {
        input.focus();
        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            Swal.clickConfirm();
          }
        });
      }

      if (toggleBtn && input) {
        toggleBtn.addEventListener("click", () => {
          isPassword = !isPassword;
          input.type = isPassword ? "password" : "text";
          toggleBtn.innerHTML = isPassword ? `<i data-lucide="eye" class="w-4 h-4"></i>` : `<i data-lucide="eye-off" class="w-4 h-4 text-amber-400"></i>`;
          initIcons();
        });
      }
    },
    preConfirm: () => {
      const input = document.getElementById("admin-pin-input");
      const pin = input ? input.value.trim() : "";
      if (!pin) {
        Swal.showValidationMessage("กรุณาระบุรหัส PIN");
        return false;
      }
      if (!window.portfolioStorage.verifyPin(pin)) {
        Swal.showValidationMessage("รหัส PIN ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง");
        return false;
      }
      return true;
    }
  }).then((result) => {
    if (result.isConfirmed) {
      window.portfolioStorage.setAdmin(true);
      if (AppState.currentView === "welcome") {
        navigateTo("dashboard");
      }
      Swal.fire({
        icon: "success",
        title: "ยินดีต้อนรับคุณครู",
        text: "เข้าสู่โหมดผู้ดูแลระบบ (Admin Mode) สำเร็จแล้ว",
        timer: 1500,
        showConfirmButton: false
      });
    }
  });
}

// Update Topbar and Dashboard stats
function updateGlobalStats() {
  const data = window.portfolioStorage.getData();
  const p = data.profile || {};
  const s = data.settings || {};
  const currentYear = s.currentAcademicYear || "2568";
  const evalStatus = s.evaluationStatus || "พร้อมรับการประเมิน";
  
  // Set Profile info in Sidebar & Header
  document.querySelectorAll(".teacher-name").forEach(el => el.textContent = p.fullName || "ครูผู้สอน");
  document.querySelectorAll(".teacher-position").forEach(el => el.textContent = p.position || "ข้าราชการครู");
  document.querySelectorAll(".school-name").forEach(el => el.textContent = p.school || "โรงเรียนวัดบางปูน");
  document.querySelectorAll(".teacher-avatar").forEach(el => {
    if (el.tagName === "IMG") el.src = p.avatarUrl || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2";
  });

  // Dynamic Year Badge & Status Badge
  document.querySelectorAll(".current-year-text").forEach(el => el.textContent = `ปีการศึกษา ${currentYear}`);
  document.querySelectorAll(".eval-status-text").forEach(el => el.textContent = evalStatus);
  document.querySelectorAll(".app-title-text").forEach(el => el.textContent = s.appName || "KRUSOS E-PORTFOLIO");
}

// --- Main View Router ---
function renderCurrentView() {
  const welcomeScreen = document.getElementById("welcome-cover-screen");
  const mainWorkspace = document.getElementById("main-app-workspace");
  const container = document.getElementById("main-content-area");

  const data = window.portfolioStorage.getData();
  const isAdmin = window.portfolioStorage.isAdmin();

  if (AppState.currentView === "welcome") {
    // Show Full-Screen Standalone Cover Page (Hide workspace, header, and sidebar)
    if (welcomeScreen) {
      welcomeScreen.classList.remove("hidden");
      welcomeScreen.innerHTML = renderWelcomeView(data, isAdmin);
    }
    if (mainWorkspace) {
      mainWorkspace.classList.add("hidden");
    }
  } else {
    // Show Main Application Workspace
    if (welcomeScreen) {
      welcomeScreen.classList.add("hidden");
    }
    if (mainWorkspace) {
      mainWorkspace.classList.remove("hidden");
    }

    if (container) {
      let html = "";
      switch (AppState.currentView) {
        case "dashboard":
          html = renderDashboardView(data, isAdmin);
          break;
        case "profile":
          html = renderProfileView(data, isAdmin);
          break;
        case "intensive-prep":
          html = renderIntensivePrepView(data, isAdmin);
          break;
        case "pa":
          html = renderPaView(data, isAdmin);
          break;
        case "lesson-plans":
          html = renderLessonPlansView(data, isAdmin);
          break;
        case "official-docs":
          html = renderOfficialDocsView(data, isAdmin);
          break;
        case "achievements":
          html = renderAchievementsView(data, isAdmin);
          break;
        case "gallery":
          html = renderGalleryView(data, isAdmin);
          break;
        case "media-systems":
          html = renderMediaSystemsView(data, isAdmin);
          break;
        default:
          html = renderDashboardView(data, isAdmin);
      }
      container.innerHTML = html;

      if (AppState.currentView === "dashboard" || !AppState.currentView) {
        initHeroSliderAutoplay();
      } else {
        if (heroSlideTimer) clearInterval(heroSlideTimer);
      }

      if (AppState.currentView === "pa") {
        setTimeout(() => initAspectCarousels(), 150);
      } else {
        stopAspectCarousels();
      }
    }
  }

  initIcons();
}

// ==========================================
// 0. Standalone Grand Welcome Cover Page (หน้าแรกสุดก่อนเข้าระบบ - จบใน 1 หน้าจอ)
// ==========================================
function renderWelcomeView(data, isAdmin) {
  const p = data.profile || {};
  const s = data.settings || {};
  const currentYear = s.currentAcademicYear || "2568";
  const evalStatus = s.evaluationStatus || "พร้อมรับการประเมิน";

  return `
    <div class="h-screen max-h-screen w-full flex flex-col justify-between p-3 md:p-5 max-w-5xl mx-auto overflow-hidden page-view">
      
      <!-- Top Cover Header (Compact) -->
      <header class="flex items-center justify-between gap-3 py-1.5 border-b border-blue-900/40 shrink-0">
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-navy-950 font-bold shadow shrink-0">
            <i data-lucide="graduation-cap" class="w-4 h-4 md:w-5 md:h-5"></i>
          </div>
          <div class="min-w-0">
            <span class="text-xs font-bold text-amber-400 tracking-wider block uppercase truncate">KRUSOS E-PORTFOLIO</span>
            <span class="text-[10px] text-slate-300 block truncate">${p.school} สพป.สิงห์บุรี</span>
          </div>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-amber-300 text-[11px] font-semibold border border-white/15 shadow-sm">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span>ปีการศึกษา ${currentYear}</span>
          </div>
          ${isAdmin ? `
            <div class="flex items-center gap-1.5">
              <button onclick="navigateTo('dashboard')" class="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-navy-950 text-[11px] font-bold shadow-md transition-all cursor-pointer">
                <i data-lucide="layout-dashboard" class="w-3.5 h-3.5"></i>
                <span>เข้าสู่ระบบจัดการ (Admin)</span>
              </button>
              <button onclick="handleAdminToggleClick()" class="inline-flex items-center justify-center p-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800/50 text-rose-300 transition-all cursor-pointer" title="ออกจากระบบ Admin">
                <i data-lucide="log-out" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          ` : `
            <button onclick="handleAdminToggleClick()" class="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-blue-600/90 hover:bg-blue-600 text-white text-[11px] font-semibold transition-all cursor-pointer">
              <i data-lucide="lock" class="w-3 h-3 text-amber-300"></i>
              <span>โหมด Admin</span>
            </button>
          `}
        </div>
      </header>

      <!-- Center Hero Showcase (Single Screen Fit) -->
      <main class="flex-1 flex flex-col justify-center my-auto py-2 space-y-3 min-h-0">
        
        <!-- Hero Box -->
        <div class="relative rounded-2xl overflow-hidden shadow-2xl bg-education-gradient text-white border-2 border-amber-400/60 p-4 md:p-6 text-center welcome-glow shrink-0">
          <div class="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
          
          <div class="relative z-10 space-y-2.5 max-w-3xl mx-auto">
            
            <!-- Ministry Seal Tag -->
            <div class="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-950/80 border border-amber-400/30 text-amber-300 text-[10px] md:text-[11px] font-semibold shadow-sm">
              <i data-lucide="award" class="w-3.5 h-3.5 text-amber-400 shrink-0"></i>
              <span class="truncate">สำนักงานเขตพื้นที่การศึกษาประถมศึกษาสิงห์บุรี • สพฐ.</span>
            </div>

            <!-- Title & Subtitle -->
            <div>
              <h1 class="text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-white drop-shadow">
                KRUSOS <span class="text-amber-400">E-PORTFOLIO</span>
              </h1>
              <p class="text-blue-100 text-xs md:text-sm font-medium mt-0.5">
                แฟ้มสะสมงานอิเล็กทรอนิกส์และระบบประเมินผลออนไลน์
              </p>
            </div>

            <!-- Teacher Portrait with Golden Ring -->
            <div class="flex justify-center py-0.5">
              <div class="welcome-portrait-ring">
                <img src="${p.avatarUrl}" alt="${p.fullName}" class="w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-full object-cover border-2 border-navy-950 shadow-xl teacher-avatar">
              </div>
            </div>

            <!-- Teacher Details -->
            <div class="space-y-0.5">
              <h2 class="text-lg md:text-xl font-bold text-amber-300">${p.fullName}</h2>
              <p class="text-white text-xs md:text-sm font-medium">
                <span>${p.position}</span> • <span>${p.academicStanding}</span>
              </p>
              <p class="text-blue-200 text-[11px] md:text-xs">
                ${p.subjectGroup} • ${p.school}
              </p>

              <blockquote class="italic text-[11px] text-blue-100/90 pt-1.5 border-t border-blue-400/20 max-w-lg mx-auto line-clamp-1 leading-snug">
                “${p.motto}”
              </blockquote>
            </div>

            <!-- Status Indicator -->
            <div class="pt-0.5">
              <span class="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] md:text-[11px] font-semibold bg-white/10 backdrop-blur-sm border border-white/20 text-blue-100">
                <span class="w-2 h-2 rounded-full ${evalStatus.includes('พร้อม') ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}"></span>
                <span>สถานะ: ${evalStatus} (ปีการศึกษา ${currentYear})</span>
              </span>
            </div>

            <!-- Main Entrance CTA Action Button -->
            <div class="pt-2 flex justify-center">
              <button onclick="navigateTo('dashboard')" class="inline-flex items-center justify-center gap-2.5 px-10 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-600 hover:to-amber-600 text-navy-950 font-extrabold text-base md:text-lg shadow-xl shadow-amber-500/30 hover:scale-105 transition-all duration-200 cursor-pointer">
                <i data-lucide="book-open-check" class="w-5 h-5 md:w-6 md:h-6"></i>
                <span>คลิกเข้าสู่แฟ้มสะสมงาน</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      <!-- Bottom Cover Footer (Compact) -->
      <footer class="text-center text-xs text-slate-400 py-2 border-t border-blue-900/40 shrink-0">
        <p>© ${currentYear} KRUSOS E-PORTFOLIO | แฟ้มสะสมงานครูซอสสอนสังคม • โรงเรียนวัดบางปูน สพป.สิงห์บุรี</p>
      </footer>
    </div>
  `;
}

// ==========================================
// 1. Dashboard View (หน้าแรก)
// ==========================================
function renderDashboardView(data, isAdmin) {
  const p = data.profile || {};
  const settings = data.settings || {};
  const isSimulating = window.portfolioStorage.isSimulatingViewer();
  const effectiveIsAdmin = isAdmin && !isSimulating;

  const heroSlides = data.heroSlides || [];
  const lpCount = data.lessonPlans?.filter(i => effectiveIsAdmin || i.isVisible).length || 0;
  const docCount = data.officialDocs?.filter(i => effectiveIsAdmin || i.isVisible).length || 0;
  const achCount = data.achievements?.filter(i => effectiveIsAdmin || i.isVisible).length || 0;
  const actCount = data.gallery?.filter(i => effectiveIsAdmin || i.isVisible).length || 0;
  const sysCount = data.onlineSystems?.filter(i => effectiveIsAdmin || i.isVisible).length || 0;

  // Recent Updates filter
  const allUpdates = data.recentUpdates || [];
  const updates = allUpdates.filter(i => effectiveIsAdmin || i.isVisible);
  const layout = settings.dashboardUpdateLayout || "cards";
  const evalStatus = settings.evaluationStatus || "พร้อมรับการประเมิน";

  return `
    <div class="page-view space-y-6">
      
      <!-- Admin Command Bar (Only visible when logged in as Admin & not in simulation) -->
      ${effectiveIsAdmin ? `
        <div class="glass-card p-4 rounded-2xl border-2 border-amber-400/80 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-blue-500/10 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shrink-0">
              <i data-lucide="shield-check" class="w-5 h-5"></i>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="font-bold text-slate-800 text-sm md:text-base">แผงควบคุมระบบ (Admin Control Center)</h3>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">ครูซอส</span>
              </div>
              <p class="text-xs text-slate-500 mt-0.5">จัดการเนื้อหาหน้าแรก, อัปโหลดรูปภาพ, และกำหนดปีการศึกษาที่เริ่มประเมิน</p>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button onclick="toggleViewerSimulation(true)" class="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 font-semibold text-xs shadow transition-all cursor-pointer" title="ดูว่าเวลาคนอื่นเปิดดูเว็บจะเห็นอย่างไร">
              <i data-lucide="eye" class="w-3.5 h-3.5"></i>
              <span>ดูมุมมองคนดู</span>
            </button>
            <button onclick="openYearConfigModal()" class="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow transition-all cursor-pointer">
              <i data-lucide="calendar-cog" class="w-3.5 h-3.5"></i>
              <span>กำหนดปี/สถานะประเมิน</span>
            </button>
            <button onclick="openAddUpdateModal()" class="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow transition-all cursor-pointer">
              <i data-lucide="plus-circle" class="w-3.5 h-3.5"></i>
              <span>เพิ่มผลงานอัปเดต</span>
            </button>
          </div>
        </div>
      ` : ""}

      <!-- Hero Profile Banner -->
      <div class="relative rounded-3xl overflow-hidden shadow-xl bg-education-gradient text-white">
        <div class="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div class="relative z-10 p-6 md:p-8 flex flex-col lg:flex-row items-center gap-6 lg:gap-8">
          
          <!-- Avatar with Quick Photo Change for Admin -->
          <div class="relative group shrink-0">
            <img src="${p.avatarUrl}" alt="${p.fullName}" class="w-32 h-32 md:w-36 md:h-36 rounded-full object-cover border-4 border-amber-400 shadow-2xl teacher-avatar">
            ${effectiveIsAdmin ? `
              <button onclick="openQuickAvatarModal()" class="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-bold gap-1 cursor-pointer">
                <i data-lucide="camera" class="w-6 h-6 text-amber-300"></i>
                <span>เปลี่ยนรูป</span>
              </button>
            ` : ""}
            <div class="absolute bottom-1 right-1 bg-amber-500 text-white p-2 rounded-full shadow-lg pointer-events-none">
              <i data-lucide="award" class="w-5 h-5"></i>
            </div>
          </div>

          <div class="flex-1 text-center lg:text-left space-y-2">
            <div class="flex flex-wrap items-center justify-center lg:justify-start gap-2">
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-800/80 border border-blue-400/30 text-amber-300 text-xs font-semibold">
                <i data-lucide="school" class="w-3.5 h-3.5"></i> ${p.school}
              </span>
              
              <!-- Evaluation Status Tag -->
              <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                evalStatus.includes('พร้อม') ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40' :
                evalStatus.includes('ยังไม่') ? 'bg-amber-500/20 text-amber-200 border border-amber-400/40' :
                'bg-blue-500/20 text-blue-200 border border-blue-400/40'
              }">
                <span class="w-2 h-2 rounded-full ${evalStatus.includes('พร้อม') ? 'bg-emerald-400' : 'bg-amber-400'}"></span>
                ${evalStatus} (ปี ${settings.currentAcademicYear || '2568'})
              </span>
            </div>

            <h1 class="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center justify-center lg:justify-start gap-2">
              <span>${p.fullName}</span>
              ${effectiveIsAdmin ? `
                <button onclick="openProfileEditModal()" class="text-xs text-amber-300 hover:text-white p-1 rounded-lg hover:bg-white/10" title="แก้ไขชื่อ/ข้อมูล">
                  <i data-lucide="edit-3" class="w-4 h-4"></i>
                </button>
              ` : ""}
            </h1>

            <p class="text-blue-100 text-sm md:text-base font-medium flex items-center justify-center lg:justify-start gap-2">
              <span>${p.position}</span> • <span class="text-amber-300 font-semibold">${p.academicStanding}</span>
            </p>
            
            <blockquote class="italic text-xs md:text-sm text-blue-200/90 pt-1 font-sarabun border-l-0 lg:border-l-2 lg:border-amber-400 lg:pl-3">
              ${p.motto}
            </blockquote>
          </div>

          <div class="flex flex-col sm:flex-row lg:flex-col gap-2.5 w-full lg:w-auto">
            <button onclick="navigateTo('pa')" class="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-navy-950 font-bold text-sm shadow-lg shadow-amber-500/25 transition-all cursor-pointer">
              <i data-lucide="file-check" class="w-4 h-4"></i> ผลการประเมิน วPA
            </button>
            <button onclick="navigateTo('profile')" class="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-medium text-sm transition-all cursor-pointer">
              <i data-lucide="user" class="w-4 h-4"></i> ประวัติและภาระงาน
            </button>
            <button onclick="openCommitteeNoteModal()" class="flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-white/10 hover:bg-amber-400 hover:text-navy-950 text-amber-300 border border-amber-400/30 text-xs font-semibold transition-all cursor-pointer" title="สำหรับคณะกรรมการบันทึกข้อเสนอแนะ">
              <i data-lucide="clipboard-check" class="w-3.5 h-3.5"></i> สมุดบันทึกข้อเสนอแนะ
            </button>
          </div>
        </div>
      </div>

      <!-- ======================================================= -->
      <!-- Highlight Photo Slider Carousel (ภาพสไลด์หมุนเวียนหน้าแรก) -->
      <!-- ======================================================= -->
      ${renderDashboardHeroCarousel(heroSlides, effectiveIsAdmin)}

      <!-- Quick Stats Cards (5 Grid) -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div onclick="navigateTo('lesson-plans')" class="glass-card p-3.5 rounded-2xl shadow-sm border border-slate-200/80 hover:border-blue-400 hover:shadow-md transition-all flex items-center gap-3 cursor-pointer group">
          <div class="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <i data-lucide="book-open" class="w-5 h-5"></i>
          </div>
          <div>
            <div class="text-xl font-bold text-slate-800">${lpCount}</div>
            <div class="text-[11px] text-slate-500 font-medium">แผนการสอน</div>
          </div>
        </div>
        <div onclick="navigateTo('official-docs')" class="glass-card p-3.5 rounded-2xl shadow-sm border border-slate-200/80 hover:border-amber-400 hover:shadow-md transition-all flex items-center gap-3 cursor-pointer group">
          <div class="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <i data-lucide="file-text" class="w-5 h-5"></i>
          </div>
          <div>
            <div class="text-xl font-bold text-slate-800">${docCount}</div>
            <div class="text-[11px] text-slate-500 font-medium">เอกสารราชการ</div>
          </div>
        </div>
        <div onclick="navigateTo('achievements')" class="glass-card p-3.5 rounded-2xl shadow-sm border border-slate-200/80 hover:border-emerald-400 hover:shadow-md transition-all flex items-center gap-3 cursor-pointer group">
          <div class="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <i data-lucide="trophy" class="w-5 h-5"></i>
          </div>
          <div>
            <div class="text-xl font-bold text-slate-800">${achCount}</div>
            <div class="text-[11px] text-slate-500 font-medium">ผลงาน/รางวัล</div>
          </div>
        </div>
        <div onclick="navigateTo('gallery')" class="glass-card p-3.5 rounded-2xl shadow-sm border border-slate-200/80 hover:border-purple-400 hover:shadow-md transition-all flex items-center gap-3 cursor-pointer group">
          <div class="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <i data-lucide="image" class="w-5 h-5"></i>
          </div>
          <div>
            <div class="text-xl font-bold text-slate-800">${actCount}</div>
            <div class="text-[11px] text-slate-500 font-medium">ภาพกิจกรรม</div>
          </div>
        </div>
        <div onclick="navigateTo('media-systems')" class="glass-card p-3.5 rounded-2xl shadow-sm border border-slate-200/80 hover:border-cyan-400 hover:shadow-md transition-all flex items-center gap-3 cursor-pointer group col-span-2 sm:col-span-1">
          <div class="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <i data-lucide="globe" class="w-5 h-5"></i>
          </div>
          <div>
            <div class="text-xl font-bold text-slate-800">${sysCount}</div>
            <div class="text-[11px] text-slate-500 font-medium">สื่อ & ระบบออนไลน์</div>
          </div>
        </div>
      </div>

      <!-- ======================================================= -->
      <!-- Section: ผลงานและภารกิจอัปเดตล่าสุด (Recent Updates Feed) -->
      <!-- ======================================================= -->
      <div class="space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-600 flex items-center justify-center font-bold">
              <i data-lucide="sparkles" class="w-4 h-4"></i>
            </div>
            <div>
              <h2 class="text-lg font-bold text-slate-800">ผลงานและภารกิจอัปเดตล่าสุด (Recent Highlights & Duties)</h2>
              <p class="text-xs text-slate-500 font-sarabun">ข่าวสาร รางวัล และการปฏิบัติหน้าที่วิทยากร/กิจกรรมเด่น</p>
            </div>
          </div>

          <!-- Admin Layout Controls & Add Button -->
          <div class="flex items-center gap-2">
            ${effectiveIsAdmin ? `
              <!-- Layout Switcher -->
              <div class="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                <button onclick="changeUpdateLayout('cards')" class="px-2.5 py-1 rounded-lg font-medium transition-all ${layout === 'cards' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'}" title="รูปแบบการ์ด 3 มิติ">
                  <i data-lucide="layout-grid" class="w-3.5 h-3.5 inline mr-1"></i> การ์ด
                </button>
                <button onclick="changeUpdateLayout('timeline')" class="px-2.5 py-1 rounded-lg font-medium transition-all ${layout === 'timeline' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'}" title="รูปแบบไทม์ไลน์">
                  <i data-lucide="clock" class="w-3.5 h-3.5 inline mr-1"></i> ไทม์ไลน์
                </button>
                <button onclick="changeUpdateLayout('spotlight')" class="px-2.5 py-1 rounded-lg font-medium transition-all ${layout === 'spotlight' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'}" title="รูปแบบไฮไลต์เด่น">
                  <i data-lucide="star" class="w-3.5 h-3.5 inline mr-1"></i> ไฮไลต์
                </button>
              </div>

              <button onclick="openAddUpdateModal()" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-sm transition-all">
                <i data-lucide="plus-circle" class="w-3.5 h-3.5"></i>
                <span>เพิ่มอัปเดต</span>
              </button>
            ` : ""}
          </div>
        </div>

        <!-- Render Update Content based on Layout -->
        ${renderUpdatesContent(updates, layout, effectiveIsAdmin)}
      </div>

      <!-- Bio and Contact Card -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-200 space-y-4">
          <div class="flex items-center justify-between border-b pb-3">
            <h3 class="font-bold text-slate-800 flex items-center gap-2 text-base">
              <i data-lucide="sparkles" class="w-5 h-5 text-amber-500"></i> วิสัยทัศน์และการจัดการเรียนรู้
            </h3>
            ${effectiveIsAdmin ? `
              <button onclick="openProfileEditModal()" class="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                <i data-lucide="edit-3" class="w-3.5 h-3.5"></i> แก้ไข
              </button>
            ` : ""}
          </div>
          <p class="text-slate-600 text-sm leading-relaxed font-sarabun">
            ${p.bio}
          </p>
          <div class="bg-blue-50/70 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
            <i data-lucide="info" class="w-5 h-5 text-blue-600 shrink-0 mt-0.5"></i>
            <div class="text-xs text-blue-900 space-y-1 font-sarabun">
              <span class="font-bold block">คำแนะนำสำหรับการเข้าชม:</span>
              <span>ท่านสามารถคลิกที่หน้าปกเอกสารในแต่ละหมวดเพื่อเปิดอ่านไฟล์เอกสารฉบับเต็ม (PDF Preview) ได้ทันทีโดยไม่ต้องดาวน์โหลด หรือคลิกเปิดใน Google Drive ได้อย่างสะดวก</span>
            </div>
          </div>
        </div>

        <div class="glass-card p-6 rounded-2xl border border-slate-200 space-y-4">
          <div class="flex items-center justify-between border-b pb-3">
            <h3 class="font-bold text-slate-800 flex items-center gap-2 text-base">
              <i data-lucide="phone-call" class="w-5 h-5 text-blue-600"></i> ข้อมูลการติดต่อ
            </h3>
            ${effectiveIsAdmin ? `
              <button onclick="openProfileEditModal()" class="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                <i data-lucide="edit-3" class="w-3.5 h-3.5"></i> แก้ไข
              </button>
            ` : ""}
          </div>
          <div class="space-y-3 text-xs md:text-sm font-sarabun text-slate-600">
            <div class="flex items-center gap-2.5">
              <i data-lucide="phone" class="w-4 h-4 text-slate-400"></i>
              <span>โทรศัพท์: ${p.phone}</span>
            </div>
            <div class="flex items-center gap-2.5">
              <i data-lucide="mail" class="w-4 h-4 text-slate-400"></i>
              <span>อีเมล: ${p.email}</span>
            </div>
            <div class="flex items-center gap-2.5">
              <i data-lucide="message-circle" class="w-4 h-4 text-slate-400"></i>
              <span>Line ID: ${p.lineId}</span>
            </div>
            <div class="flex items-start gap-2.5 pt-1">
              <i data-lucide="map-pin" class="w-4 h-4 text-slate-400 shrink-0 mt-0.5"></i>
              <span>${p.schoolAddress}</span>
            </div>
          </div>
        </div>
  `;
}

function renderQuickCard(viewId, title, desc, iconName, gradientClass) {
  return `
    <div onclick="navigateTo('${viewId}')" class="glass-card p-5 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between">
      <div class="flex items-start justify-between">
        <div class="w-12 h-12 rounded-xl bg-gradient-to-br ${gradientClass} text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
          <i data-lucide="${iconName}" class="w-6 h-6"></i>
        </div>
        <i data-lucide="chevron-right" class="w-5 h-5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all"></i>
      </div>
      <div class="mt-4">
        <h3 class="font-bold text-slate-800 group-hover:text-blue-600 text-base transition-colors">${title}</h3>
        <p class="text-xs text-slate-500 mt-1 font-sarabun line-clamp-2">${desc}</p>
      </div>
    </div>
  `;
}

// ==========================================
// 2. Profile View (ประวัติส่วนตัว)
// ==========================================
function renderProfileView(data, isAdmin) {
  const p = data.profile || {};
  return `
    <div class="page-view space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <i data-lucide="user" class="w-7 h-7 text-blue-600"></i> ประวัติส่วนตัวและภาระงานสอน
          </h2>
          <p class="text-xs md:text-sm text-slate-500 mt-0.5">ข้อมูลประวัติการศึกษา การรับราชการ และงานที่ได้รับมอบหมาย (แอดมินสามารถเพิ่ม/แก้ไข/ลบได้ทุกส่วน)</p>
        </div>
        ${isAdmin ? `
          <button onclick="openProfileEditModal()" class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md transition-colors cursor-pointer">
            <i data-lucide="edit-3" class="w-4 h-4"></i> แก้ไขข้อมูลประวัติทั่วไป
          </button>
        ` : ""}
      </div>

      <!-- Basic Profile Info Card -->
      <div class="glass-card p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="flex flex-col items-center text-center p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div class="relative group">
              <img src="${p.avatarUrl}" alt="${p.fullName}" class="w-28 h-28 rounded-full object-cover border-4 border-amber-400 shadow-md">
              ${isAdmin ? `
                <button onclick="openQuickAvatarModal()" class="absolute bottom-0 right-0 p-2 bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-lg cursor-pointer" title="เปลี่ยนรูปโปรไฟล์ / ครอปรูป LINE">
                  <i data-lucide="camera" class="w-3.5 h-3.5"></i>
                </button>
              ` : ""}
            </div>
            <h3 class="font-bold text-slate-800 mt-3 text-base">${p.fullName}</h3>
            <span class="text-xs text-blue-600 font-semibold mt-0.5">${p.position}</span>
            <span class="text-xs text-slate-500 mt-1">${p.school}</span>
          </div>

          <div class="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 font-sarabun text-sm">
            <div class="p-3 bg-white rounded-xl border border-slate-100">
              <span class="text-xs text-slate-400 block font-prompt">กลุ่มสาระการเรียนรู้</span>
              <span class="font-semibold text-slate-800">${p.subjectGroup || '-'}</span>
            </div>
            <div class="p-3 bg-white rounded-xl border border-slate-100">
              <span class="text-xs text-slate-400 block font-prompt">เลขที่ตำแหน่ง</span>
              <span class="font-semibold text-slate-800">${p.positionNumber || '-'}</span>
            </div>
            <div class="p-3 bg-white rounded-xl border border-slate-100">
              <span class="text-xs text-slate-400 block font-prompt">วันบรรจุรับราชการ</span>
              <span class="font-semibold text-slate-800">${p.appointmentDate || '-'}</span>
            </div>
            <div class="p-3 bg-white rounded-xl border border-slate-100">
              <span class="text-xs text-slate-400 block font-prompt">อายุราชการ</span>
              <span class="font-semibold text-slate-800">${p.yearsOfService || '-'}</span>
            </div>
            <div class="sm:col-span-2 p-3 bg-white rounded-xl border border-slate-100">
              <span class="text-xs text-slate-400 block font-prompt">สังกัดหน่วยงาน</span>
              <span class="font-semibold text-slate-800">${p.affiliation || '-'}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Education and Career History -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Education -->
        <div class="glass-card p-6 rounded-2xl border border-slate-200 space-y-4">
          <div class="flex items-center justify-between border-b pb-3">
            <h3 class="font-bold text-slate-800 flex items-center gap-2 text-base">
              <i data-lucide="graduation-cap" class="w-5 h-5 text-indigo-600"></i> ประวัติการศึกษา
            </h3>
            ${isAdmin ? `
              <button onclick="openAddEducationModal()" class="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer">
                <i data-lucide="plus" class="w-3.5 h-3.5"></i> เพิ่มการศึกษา
              </button>
            ` : ""}
          </div>
          <div class="space-y-4">
            ${p.education && p.education.length > 0 ? p.education.map((edu, idx) => `
              <div class="relative pl-6 pb-2 border-l-2 border-indigo-200 last:border-l-0 group">
                <div class="absolute -left-2 top-0 w-4 h-4 rounded-full bg-indigo-600 border-2 border-white"></div>
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <div class="font-bold text-slate-800 text-sm">${edu.degree}</div>
                    <div class="text-xs text-indigo-700 font-medium font-sarabun">${edu.major}</div>
                    <div class="text-xs text-slate-500 font-sarabun mt-0.5">${edu.institution} (ปีสำเร็จการศึกษา ${edu.year})</div>
                    <div class="text-xs text-emerald-600 font-semibold mt-0.5">ผลการเรียนเฉลี่ย: ${edu.gpa}</div>
                  </div>
                  ${isAdmin ? `
                    <div class="flex items-center gap-1 shrink-0">
                      <button onclick="openEditEducationModal(${idx})" class="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer" title="แก้ไข">
                        <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                      </button>
                      <button onclick="confirmDeleteEducation(${idx})" class="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer" title="ลบ">
                        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                      </button>
                    </div>
                  ` : ""}
                </div>
              </div>
            `).join("") : `
              <p class="text-xs text-slate-400 text-center py-4">ยังไม่มีข้อมูลประวัติการศึกษา</p>
            `}
          </div>
        </div>

        <!-- Work Experience -->
        <div class="glass-card p-6 rounded-2xl border border-slate-200 space-y-4">
          <div class="flex items-center justify-between border-b pb-3">
            <h3 class="font-bold text-slate-800 flex items-center gap-2 text-base">
              <i data-lucide="briefcase" class="w-5 h-5 text-blue-600"></i> ประวัติการรับราชการ
            </h3>
            ${isAdmin ? `
              <button onclick="openAddWorkExpModal()" class="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer">
                <i data-lucide="plus" class="w-3.5 h-3.5"></i> เพิ่มประวัติ
              </button>
            ` : ""}
          </div>
          <div class="space-y-4">
            ${p.workExperience && p.workExperience.length > 0 ? p.workExperience.map((work, idx) => `
              <div class="relative pl-6 pb-2 border-l-2 border-blue-200 last:border-l-0 group">
                <div class="absolute -left-2 top-0 w-4 h-4 rounded-full bg-blue-600 border-2 border-white"></div>
                <div class="flex items-start justify-between gap-2">
                  <div class="flex-1">
                    <div class="flex items-center gap-2">
                      <span class="font-bold text-slate-800 text-sm">${work.position}</span>
                      <span class="text-[11px] font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md">${work.period}</span>
                    </div>
                    <div class="text-xs text-slate-600 font-medium font-sarabun mt-0.5">${work.workplace}</div>
                    <p class="text-xs text-slate-500 font-sarabun mt-1 leading-relaxed">${work.description}</p>
                  </div>
                  ${isAdmin ? `
                    <div class="flex items-center gap-1 shrink-0">
                      <button onclick="openEditWorkExpModal(${idx})" class="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer" title="แก้ไข">
                        <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                      </button>
                      <button onclick="confirmDeleteWorkExp(${idx})" class="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer" title="ลบ">
                        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                      </button>
                    </div>
                  ` : ""}
                </div>
              </div>
            `).join("") : `
              <p class="text-xs text-slate-400 text-center py-4">ยังไม่มีข้อมูลประวัติการรับราชการ</p>
            `}
          </div>
        </div>
      </div>

      <!-- Teaching Duties Table -->
      <div class="glass-card p-6 rounded-2xl border border-slate-200 space-y-4">
        <div class="flex items-center justify-between border-b pb-3">
          <h3 class="font-bold text-slate-800 flex items-center gap-2 text-base">
            <i data-lucide="calendar" class="w-5 h-5 text-emerald-600"></i> ภาระงานสอนตามตารางสอน
          </h3>
          ${isAdmin ? `
            <button onclick="openAddTeachingDutyModal()" class="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer">
              <i data-lucide="plus" class="w-3.5 h-3.5"></i> เพิ่มรายวิชาสอน
            </button>
          ` : ""}
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left font-sarabun text-sm">
            <thead class="bg-slate-50 text-slate-600 text-xs font-prompt uppercase">
              <tr>
                <th class="px-4 py-3 rounded-l-lg">รหัสวิชา</th>
                <th class="px-4 py-3">ชื่อรายวิชา</th>
                <th class="px-4 py-3">ระดับชั้น</th>
                <th class="px-4 py-3 text-center">จำนวนชั่วโมง/สัปดาห์</th>
                <th class="px-4 py-3 text-center">จำนวนนักเรียน</th>
                ${isAdmin ? `<th class="px-4 py-3 text-center rounded-r-lg">จัดการ</th>` : ""}
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${p.teachingDuties && p.teachingDuties.length > 0 ? p.teachingDuties.map((duty, idx) => `
                <tr class="hover:bg-slate-50/80 transition-colors">
                  <td class="px-4 py-3 font-semibold text-blue-700">${duty.subjectCode}</td>
                  <td class="px-4 py-3 font-medium text-slate-800">${duty.subjectName}</td>
                  <td class="px-4 py-3 text-slate-600">${duty.grade}</td>
                  <td class="px-4 py-3 text-center font-bold text-slate-700">${duty.hoursPerWeek} คาบ</td>
                  <td class="px-4 py-3 text-center text-slate-600">${duty.studentsCount} คน</td>
                  ${isAdmin ? `
                    <td class="px-4 py-3 text-center">
                      <div class="flex items-center justify-center gap-1">
                        <button onclick="openEditTeachingDutyModal(${idx})" class="p-1 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 cursor-pointer" title="แก้ไข">
                          <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                        </button>
                        <button onclick="confirmDeleteTeachingDuty(${idx})" class="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer" title="ลบ">
                          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                        </button>
                      </div>
                    </td>
                  ` : ""}
                </tr>
              `).join("") : `
                <tr>
                  <td colspan="${isAdmin ? 6 : 5}" class="text-center py-6 text-slate-400 text-xs">ยังไม่มีรายการภาระงานสอน</td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Special Duties & Assigned Roles (งานพิเศษและหน้าที่ที่ได้รับมอบหมาย - จำแนกตามกลุ่มงานแบบแถวเดี่ยว) -->
      <div class="glass-card p-6 md:p-7 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <!-- Section Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold">
                <i data-lucide="briefcase" class="w-4 h-4 text-amber-600"></i>
              </div>
              <h3 class="font-bold text-slate-800 text-base md:text-lg font-prompt">
                งานพิเศษและหน้าที่ที่ได้รับมอบหมาย (Special Duties & Roles)
              </h3>
              <span class="text-xs font-bold px-2.5 py-0.5 bg-amber-100/80 text-amber-900 rounded-lg font-prompt border border-amber-200/60">
                ${p.specialAssignments?.length || 0} หน้าที่
              </span>
            </div>
            <p class="text-xs text-slate-500 font-sarabun mt-1">จำแนกตามโครงสร้างกลุ่มงานบริหารสถานศึกษาและการปฏิบัติหน้าที่พิเศษ</p>
          </div>
          ${isAdmin ? `
            <button onclick="openAddSpecialDutyModal()" class="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold font-prompt flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0 self-start sm:self-auto">
              <i data-lucide="plus" class="w-4 h-4"></i> เพิ่มงานพิเศษ
            </button>
          ` : ""}
        </div>

        <!-- Grouped List View (เรียงแถวเดี่ยวแยกตามกลุ่มงาน) -->
        <div class="space-y-6 font-prompt">
          ${(() => {
            const groups = getGroupedSpecialAssignments(p.specialAssignments || []);
            if (groups.length === 0) {
              return `
                <div class="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <i data-lucide="briefcase" class="w-8 h-8 text-slate-300 mx-auto mb-2"></i>
                  <p class="text-xs text-slate-400 font-prompt">ยังไม่มีข้อมูลงานพิเศษและหน้าที่ที่ได้รับมอบหมาย</p>
                </div>
              `;
            }

            return groups.map(group => `
              <div class="space-y-2.5">
                <!-- Group Banner Header -->
                <div class="flex items-center justify-between p-3 rounded-xl ${group.headerBg} border ${group.headerBorder}">
                  <div class="flex items-center gap-2.5 min-w-0">
                    <div class="w-7 h-7 rounded-lg ${group.iconBg} flex items-center justify-center shrink-0 shadow-2xs">
                      <i data-lucide="${group.icon}" class="w-4 h-4"></i>
                    </div>
                    <h4 class="font-bold text-slate-800 text-sm md:text-base truncate">
                      ${group.name}
                    </h4>
                  </div>
                  <span class="text-[11px] font-bold px-2.5 py-0.5 rounded-md font-prompt ${group.countBadge} shrink-0">
                    ${group.items.length} ภารกิจ
                  </span>
                </div>

                <!-- Single Column List Rows under this Group -->
                <div class="space-y-2 pl-0 sm:pl-1">
                  ${group.items.map((item, itemIdx) => `
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 bg-white hover:bg-slate-50/90 rounded-xl border border-slate-200 hover:border-slate-300 shadow-2xs transition-all duration-150 group">
                      <div class="flex items-start gap-3 flex-1 min-w-0">
                        <div class="w-6 h-6 rounded-full bg-slate-100 group-hover:bg-amber-100 text-slate-600 group-hover:text-amber-900 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 transition-colors">
                          ${itemIdx + 1}
                        </div>
                        <div class="flex-1 min-w-0">
                          <h5 class="font-bold text-slate-800 text-xs md:text-sm leading-snug group-hover:text-amber-900 transition-colors">
                            ${item.title}
                          </h5>
                          ${item.note ? `<p class="text-[11px] text-slate-500 font-sarabun mt-0.5">${item.note}</p>` : ""}
                        </div>
                      </div>

                      <div class="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <span class="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2.5 py-1 rounded-lg">
                          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> ปฏิบัติหน้าที่ต่อเนื่อง
                        </span>
                        ${isAdmin ? `
                          <div class="flex items-center gap-1">
                            <button onclick="openEditSpecialDutyModal(${item.originalIndex})" class="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer" title="แก้ไข">
                              <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                            </button>
                            <button onclick="confirmDeleteSpecialDuty(${item.originalIndex})" class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer" title="ลบ">
                              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                            </button>
                          </div>
                        ` : ""}
                      </div>
                    </div>
                  `).join("")}
                </div>
              </div>
            `).join("");
          })()}
        </div>
      </div>
    </div>
  `;
}

// Helper: Group Special Assignments by Standard 6 School Department Groups
function getGroupedSpecialAssignments(assignments) {
  const groupsDef = [
    {
      id: "academic",
      name: "กลุ่มบริหารงานวิชาการ",
      icon: "book-open-check",
      headerBg: "bg-purple-50/80",
      headerBorder: "border-purple-200/80",
      iconBg: "bg-purple-600 text-white",
      countBadge: "bg-purple-100 text-purple-800",
      match: (t) => t.includes("วิชาการ") || t.includes("หลักสูตร") || t.includes("การสอน") || t.includes("วัดผล") || t.includes("ทะเบียน") || t.includes("วิจัย") || t.includes("ict") || t.includes("คอมพิวเตอร์") || t.includes("เทคโนโลยี") || t.includes("สื่อ"),
      items: []
    },
    {
      id: "budget",
      name: "กลุ่มบริหารงานงบประมาณ",
      icon: "wallet",
      headerBg: "bg-emerald-50/80",
      headerBorder: "border-emerald-200/80",
      iconBg: "bg-emerald-600 text-white",
      countBadge: "bg-emerald-100 text-emerald-800",
      match: (t) => t.includes("งบประมาณ") || t.includes("การเงิน") || t.includes("พัสดุ") || t.includes("สินทรัพย์") || t.includes("แผนงาน") || t.includes("จัดซื้อ") || t.includes("ระดมทุน"),
      items: []
    },
    {
      id: "personnel",
      name: "กลุ่มบริหารงานบุคคล",
      icon: "user-check",
      headerBg: "bg-blue-50/80",
      headerBorder: "border-blue-200/80",
      iconBg: "bg-blue-600 text-white",
      countBadge: "bg-blue-100 text-blue-800",
      match: (t) => t.includes("บุคคล") || t.includes("วินัย") || t.includes("สรรหา") || t.includes("บรรจุ") || t.includes("แต่งตั้ง") || t.includes("วิทยฐานะ") || t.includes("อบรม") || t.includes("เวรยาม"),
      items: []
    },
    {
      id: "general",
      name: "กลุ่มบริหารงานทั่วไป",
      icon: "building-2",
      headerBg: "bg-indigo-50/80",
      headerBorder: "border-indigo-200/80",
      iconBg: "bg-indigo-600 text-white",
      countBadge: "bg-indigo-100 text-indigo-800",
      match: (t) => t.includes("ทั่วไป") || t.includes("สารสนเทศ") || t.includes("dmc") || t.includes("emis") || t.includes("cct") || t.includes("ประชาสัมพันธ์") || t.includes("เพจ") || t.includes("เว็บ") || t.includes("อาคาร") || t.includes("สถานที่") || t.includes("ชุมชน"),
      items: []
    },
    {
      id: "student-dev",
      name: "กิจกรรมพัฒนาผู้เรียน",
      icon: "users",
      headerBg: "bg-teal-50/80",
      headerBorder: "border-teal-200/80",
      iconBg: "bg-teal-600 text-white",
      countBadge: "bg-teal-100 text-teal-800",
      match: (t) => t.includes("พัฒนาผู้เรียน") || t.includes("ลูกเสือ") || t.includes("เนตรนารี") || t.includes("ยุวกาชาด") || t.includes("ชุมนุม") || t.includes("แนะแนว") || t.includes("คุณธรรม") || t.includes("จิตอาสา") || t.includes("ที่ปรึกษา") || t.includes("ประจำชั้น"),
      items: []
    },
    {
      id: "other",
      name: "กิจกรรมอื่น ๆ",
      icon: "award",
      headerBg: "bg-amber-50/80",
      headerBorder: "border-amber-200/80",
      iconBg: "bg-amber-600 text-white",
      countBadge: "bg-amber-100 text-amber-800",
      match: () => true,
      items: []
    }
  ];

  (assignments || []).forEach((task, idx) => {
    let title = typeof task === "object" ? task.title : task;
    let explicitGroup = typeof task === "object" ? task.group : null;
    let note = typeof task === "object" ? task.note : "";
    const lowerTitle = (title || "").toLowerCase();

    let matchedGroup = null;
    if (explicitGroup) {
      matchedGroup = groupsDef.find(g => g.name === explicitGroup || g.id === explicitGroup);
    }
    if (!matchedGroup) {
      matchedGroup = groupsDef.find(g => g.match(lowerTitle));
    }
    if (!matchedGroup) {
      matchedGroup = groupsDef[groupsDef.length - 1];
    }

    matchedGroup.items.push({
      title,
      group: matchedGroup.name,
      note,
      originalIndex: idx
    });
  });

  return groupsDef.filter(g => g.items.length > 0);
}

// ==========================================
// 3. Intensive Preparation View (การประเมินครูผู้ช่วย 4 ครั้ง)
// ==========================================
function renderIntensivePrepView(data, isAdmin) {
  const allItems = data.intensivePrep || [];
  const currentRound = AppState.activeIpRound;
  
  // Filter by Round, Visibility, and Search
  let items = allItems.filter(item => Number(item.round) === Number(currentRound));
  if (!isAdmin) {
    items = items.filter(item => item.isVisible);
  }
  if (AppState.searchQuery) {
    items = items.filter(item => 
      item.title.toLowerCase().includes(AppState.searchQuery) ||
      item.description.toLowerCase().includes(AppState.searchQuery) ||
      item.subCategory?.toLowerCase().includes(AppState.searchQuery)
    );
  }

  return `
    <div class="page-view space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <i data-lucide="graduation-cap" class="w-7 h-7 text-teal-600"></i> การประเมินการเตรียมความพร้อมครูผู้ช่วย
          </h2>
          <p class="text-xs md:text-sm text-slate-500 mt-0.5">การประเมินอย่างเข้ม 4 ครั้ง ด้านการปฏิบัติตนและด้านการปฏิบัติงาน</p>
        </div>
        ${isAdmin ? `
          <button onclick="openAddItemModal('intensivePrep')" class="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-md transition-colors">
            <i data-lucide="plus-circle" class="w-4 h-4"></i> เพิ่มเอกสารประเมิน
          </button>
        ` : ""}
      </div>

      <!-- 4 Round Tabs -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        ${[1, 2, 3, 4].map(roundNum => `
          <button onclick="setIpRound(${roundNum})" class="p-3.5 rounded-xl border font-prompt text-sm font-semibold transition-all flex flex-col items-center gap-1 ${currentRound === roundNum ? 'bg-teal-600 text-white border-teal-600 shadow-md scale-102' : 'bg-white text-slate-700 border-slate-200 hover:bg-teal-50'}">
            <span>ครั้งที่ ${roundNum}</span>
            <span class="text-xs font-normal opacity-85">รอบการประเมินที่ ${roundNum}</span>
          </button>
        `).join("")}
      </div>

      <!-- Search & Status Header -->
      <div class="flex items-center justify-between bg-teal-50/60 p-4 rounded-xl border border-teal-100">
        <div class="flex items-center gap-2 text-teal-900 font-semibold text-sm">
          <i data-lucide="layers" class="w-4 h-4 text-teal-600"></i>
          <span>รายการเอกสารการประเมิน ครั้งที่ ${currentRound} (พบ ${items.length} รายการ)</span>
        </div>
        <div class="text-xs text-teal-700 bg-white px-3 py-1 rounded-full border border-teal-200 font-medium">
          เกณฑ์ ก.ค.ศ. ผ่านการประเมิน
        </div>
      </div>

      <!-- Digital Bookshelf / Grid View -->
      ${items.length === 0 ? `
        <div class="text-center py-12 glass-card rounded-2xl border border-dashed border-slate-300">
          <i data-lucide="file-question" class="w-12 h-12 text-slate-300 mx-auto mb-3"></i>
          <p class="text-slate-500 text-sm font-sarabun">ไม่พบเอกสารในการประเมินรอบนี้ หรือไม่มีข้อมูลตรงกับคำค้นหา</p>
        </div>
      ` : `
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          ${items.map(item => renderBookCard("intensivePrep", item, isAdmin)).join("")}
        </div>
      `}
    </div>
  `;
}

function setIpRound(round) {
  AppState.activeIpRound = round;
  renderCurrentView();
}

// ==========================================
// 4. วPA Performance Agreement View
// ==========================================
function extractYoutubeId(url) {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  // Check if already 11-char ID
  if (trimmed.length === 11 && !trimmed.includes("/") && !trimmed.includes(".") && !trimmed.includes("?")) {
    return trimmed;
  }
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = trimmed.match(regExp);
  return (match && match[2] && match[2].length === 11) ? match[2] : "";
}

function renderPaView(data, isAdmin) {
  const paRecords = data.paRecords || [];
  let currentPaYear = AppState.activePaYear;
  let currentPa = paRecords.find(p => String(p.fiscalYear) === String(currentPaYear));
  
  if (!currentPa && paRecords.length > 0) {
    currentPa = paRecords[0];
    AppState.activePaYear = currentPa.fiscalYear;
    currentPaYear = currentPa.fiscalYear;
  }

  // Check whether Admin has provided a valid YouTube video
  const ytVideoId = currentPa ? extractYoutubeId(currentPa.youtubeUrl || currentPa.youtubeVideoId || "") : "";
  const hasVideo = !!ytVideoId;

  return `
    <div class="page-view space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <i data-lucide="file-check" class="w-7 h-7 text-amber-600"></i> การประเมินผลการพัฒนางานตามข้อตกลง (วPA)
          </h2>
          <p class="text-xs md:text-sm text-slate-500 mt-0.5">แบบข้อตกลงในการพัฒนางาน (PA 1/ส), รายงานผล (PA 2/ส) และคลิปวิดีโอประเด็นท้าทาย</p>
        </div>
        <div class="flex items-center gap-2">
          ${isAdmin ? `
            <button onclick="openAddPaModal()" class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-semibold shadow-md transition-all cursor-pointer">
              <i data-lucide="plus-circle" class="w-4 h-4"></i> เพิ่มรอบ วPA / ปีงบประมาณใหม่
            </button>
          ` : ""}
        </div>
      </div>

      <!-- Year Selector Tabs & Quick Year Manager -->
      <div class="flex flex-wrap items-center justify-between gap-3 pb-1">
        <div class="flex items-center gap-2 overflow-x-auto">
          ${paRecords.map(rec => `
            <button onclick="setPaYear('${rec.fiscalYear}')" class="px-5 py-2.5 rounded-xl font-prompt text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${String(rec.fiscalYear) === String(currentPaYear) ? 'bg-amber-500 text-navy-950 font-bold shadow-md shadow-amber-500/20 scale-[1.02]' : 'bg-white text-slate-700 border border-slate-200 hover:bg-amber-50 hover:border-amber-300'}">
              <i data-lucide="calendar" class="w-4 h-4 text-amber-600"></i>
              <span>ปีงบประมาณ ${rec.fiscalYear}</span>
            </button>
          `).join("")}
        </div>

        ${isAdmin && currentPa && paRecords.length > 1 ? `
          <button onclick="handleDeletePaRecord('${currentPa.id}')" class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition-all cursor-pointer shadow-2xs" title="ลบรอบการประเมินปีนี้">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            <span>ลบรอบปี ${currentPa.fiscalYear}</span>
          </button>
        ` : ""}
      </div>

      ${!currentPa ? `
        <div class="text-center py-12 glass-card rounded-2xl border border-dashed border-slate-300">
          <i data-lucide="file-x" class="w-12 h-12 text-slate-300 mx-auto mb-3"></i>
          <p class="text-slate-500 text-sm font-sarabun">ยังไม่มีข้อมูลรอบการประเมิน วPA</p>
        </div>
      ` : `
        <!-- Main PA Overview Card -->
        <div class="glass-card p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div class="space-y-1.5">
              <div class="flex flex-wrap items-center gap-2">
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-amber-100/80 text-amber-900 font-prompt border border-amber-200/60">
                  <i data-lucide="award" class="w-3.5 h-3.5 text-amber-700"></i> ตำแหน่ง: ${currentPa.targetPosition || "ครู"}
                </span>
                ${(currentPa.totalScore && String(currentPa.totalScore).trim() !== "" && !currentPa.status?.includes("พร้อม")) ? `
                  <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 font-prompt border border-emerald-200">
                    <i data-lucide="check-circle-2" class="w-3.5 h-3.5 text-emerald-600"></i> ${currentPa.status} (${currentPa.totalScore} คะแนน)
                  </span>
                ` : `
                  <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 font-prompt">
                    <span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                    <span>พร้อมรับการประเมิน (รอผลประเมิน)</span>
                  </span>
                `}
              </div>
              <h3 class="text-xl md:text-2xl font-bold text-slate-800 font-prompt">${currentPa.roundTitle || "รอบการประเมิน วPA"}</h3>
            </div>

            ${isAdmin ? `
              <button onclick="openEditPaHeaderModal('${currentPa.id}')" class="px-3.5 py-2 rounded-xl bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-900 border border-slate-200 hover:border-amber-300 font-prompt font-bold text-xs flex items-center gap-2 transition-all shadow-2xs hover:shadow-xs cursor-pointer self-start md:self-center shrink-0">
                <i data-lucide="sliders-horizontal" class="w-4 h-4 text-amber-600"></i>
                <span>แก้ไขข้อมูลรอบ/คะแนน</span>
              </button>
            ` : ""}
          </div>

          <!-- 1. ส่วนที่ 1: ข้อตกลงในการพัฒนางานตามมาตรฐานตำแหน่ง (3 ด้าน 15 ตัวชี้วัด) -->
          <div class="space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 class="font-bold text-slate-800 text-base md:text-lg flex items-center gap-2">
                  <i data-lucide="check-circle" class="w-5 h-5 text-emerald-600"></i> ส่วนที่ 1: ข้อตกลงในการพัฒนางานตามมาตรฐานตำแหน่ง (3 ด้าน 15 ตัวชี้วัด)
                </h4>
                <p class="text-xs text-slate-500 font-sarabun mt-0.5">คลิกที่แต่ละด้านเพื่อเปิดดูร่องรอยหลักฐาน รูปภาพกิจกรรม และเอกสารแบบเต็มสำหรับคณะกรรมการ</p>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-5 font-sarabun text-xs">
              ${(currentPa.indicators || []).slice(0, 3).map((ind, idx) => {
                const itemCount = (ind.items && ind.items.length > 0) ? ind.items.length : (idx === 0 ? 8 : idx === 1 ? 4 : 3);
                
                // Collect all images from items and trainings (Indicator 3.1 & 3.2 certs included)
                let allImgs = [];
                if (ind.items && ind.items.length > 0) {
                  ind.items.forEach(it => {
                    if (it.images && Array.isArray(it.images)) {
                      allImgs.push(...it.images);
                    }
                    if (it.trainings && Array.isArray(it.trainings)) {
                      it.trainings.forEach(tr => {
                        if (tr.certificateUrl) {
                          allImgs.push({ url: tr.certificateUrl, caption: `${tr.no ? tr.no + '. ' : ''}${tr.title || 'เกียรติบัตร/หลักฐาน'}`.trim() });
                        } else if (tr.images && Array.isArray(tr.images)) {
                          allImgs.push(...tr.images);
                        }
                      });
                    }
                  });
                }
                if (allImgs.length === 0 && ind.images && Array.isArray(ind.images)) {
                  allImgs = [...ind.images];
                }
                const imgCount = allImgs.length;

                // Clean aspect title (strictly 1 line, without redundant 'ด้านที่ N' prefix since badge already shows it)
                let titleText = ind.standard;
                if (idx === 0) titleText = "ด้านการจัดการเรียนรู้";
                if (idx === 1) titleText = "ด้านการส่งเสริมและสนับสนุนการจัดการเรียนรู้";
                if (idx === 2) titleText = "ด้านการพัฒนาตนเองและวิชาชีพ";

                return `
                  <div class="p-5 bg-white rounded-2xl border border-slate-200/90 hover:border-amber-400 hover:shadow-lg transition-all flex flex-col justify-between space-y-4 group">
                    <div class="space-y-3">
                      <!-- Top Badges -->
                      <div class="flex items-center justify-between gap-2">
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-prompt font-bold text-xs ${idx === 0 ? 'bg-blue-100 text-blue-800' : idx === 1 ? 'bg-teal-100 text-teal-800' : 'bg-purple-100 text-purple-800'}">
                          <i data-lucide="bookmark" class="w-3.5 h-3.5"></i> ด้านที่ ${idx + 1}
                        </span>
                        ${ind.score ? `
                          <span class="font-bold text-blue-700 text-xs px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-lg">คะแนน: ${ind.score}</span>
                        ` : `
                          <span class="text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                            <i data-lucide="layers" class="w-3 h-3 text-slate-500"></i> ${itemCount} ตัวชี้วัด
                          </span>
                        `}
                      </div>

                      <!-- Aspect Title (Clean 1-line typography) -->
                      <h5 class="font-bold text-slate-800 text-xs sm:text-[13px] md:text-sm font-prompt leading-tight group-hover:text-amber-800 transition-colors truncate" title="${titleText}">
                        ${titleText}
                      </h5>

                      <!-- Quick Sub-Indicator Pills -->
                      ${(ind.items && ind.items.length > 0) ? `
                        <div class="space-y-1.5 pt-1">
                          <div class="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                            <span class="font-bold text-slate-600">ตัวชี้วัด ก.ค.ศ. (${itemCount} ตัวชี้วัด):</span>
                            <span class="text-[10px] text-slate-400">คลิกเพื่อตรวจ</span>
                          </div>
                          <div class="flex flex-wrap gap-1">
                            ${ind.items.map(it => `
                              <button type="button" onclick="openAspectDetailModal('${currentPa.id}', ${idx}, '${it.code}')" class="px-2 py-0.5 bg-slate-100 hover:bg-amber-100 hover:text-amber-900 border border-slate-200 hover:border-amber-300 rounded text-[10px] font-semibold text-slate-700 transition-colors cursor-pointer" title="${it.title}">
                                ${it.code}
                              </button>
                            `).join('')}
                          </div>
                        </div>
                      ` : ''}

                      <!-- Auto-Rotating Photo Slideshow Preview -->
                      ${imgCount > 0 ? `
                        <div class="space-y-1.5 pt-1">
                          <div class="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                            <span class="flex items-center gap-1 font-prompt font-semibold text-slate-700">
                              <i data-lucide="sparkles" class="w-3.5 h-3.5 text-amber-500"></i> ภาพกิจกรรม/หลักฐาน
                            </span>
                            <span class="px-2 py-0.5 bg-amber-100/90 text-amber-900 rounded-full font-bold text-[10px] flex items-center gap-1 shadow-2xs font-prompt">
                              <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                              <span id="aspect-counter-${currentPa.id}-${idx}">1 / ${imgCount}</span>
                            </span>
                          </div>

                          <div id="aspect-carousel-box-${currentPa.id}-${idx}" class="relative h-36 sm:h-40 w-full rounded-2xl overflow-hidden border border-slate-200/90 shadow-2xs bg-slate-950 group/slider cursor-pointer" onclick="openAspectDetailModal('${currentPa.id}', ${idx})" title="คลิกเพื่อเปิดดูรายละเอียดและภาพหลักฐานทั้งหมด">
                            <!-- Slides -->
                            ${allImgs.map((imgObj, imgIdx) => {
                              const url = typeof imgObj === 'string' ? imgObj : imgObj.url;
                              const caption = typeof imgObj === 'string' ? '' : (imgObj.caption || '');
                              const isActive = imgIdx === 0;
                              return `
                                <div class="aspect-slide-item absolute inset-0 transition-opacity duration-700 ease-in-out flex items-center justify-center ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}" data-slide-index="${imgIdx}">
                                  <img src="${url}" class="w-full h-full object-cover group-hover/slider:scale-105 transition-transform duration-500" alt="หลักฐานด้านที่ ${idx + 1}">
                                  <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent"></div>
                                  
                                  <!-- Bottom Caption & Badge -->
                                  <div class="absolute bottom-0 inset-x-0 p-2.5 text-white flex items-end justify-between gap-2 z-20">
                                    <div class="min-w-0 flex-1">
                                      <p class="text-[11px] font-sarabun text-slate-100 line-clamp-1 leading-snug drop-shadow-sm flex items-center gap-1">
                                        <i data-lucide="info" class="w-3 h-3 text-amber-400 shrink-0"></i>
                                        <span class="truncate">${caption || `ภาพกิจกรรมและร่องรอยหลักฐาน (${imgIdx + 1}/${imgCount})`}</span>
                                      </p>
                                    </div>
                                    <span class="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-xs text-[10px] text-amber-300 font-prompt font-bold shrink-0 border border-white/10">
                                      <i data-lucide="zoom-in" class="w-3 h-3"></i> ขยาย
                                    </span>
                                  </div>
                                </div>
                              `;
                            }).join('')}

                            <!-- Prev/Next Controls (hover) -->
                            ${imgCount > 1 ? `
                              <div class="absolute inset-y-0 inset-x-1.5 flex items-center justify-between pointer-events-none z-30 opacity-0 group-hover/slider:opacity-100 transition-opacity duration-200">
                                <button type="button" onclick="event.stopPropagation(); prevAspectSlide('${currentPa.id}', ${idx})" class="pointer-events-auto w-6 h-6 rounded-full bg-black/60 hover:bg-amber-600 text-white flex items-center justify-center backdrop-blur-xs transition-all cursor-pointer shadow-md" title="ภาพก่อนหน้า">
                                  <i data-lucide="chevron-left" class="w-3.5 h-3.5"></i>
                                </button>
                                <button type="button" onclick="event.stopPropagation(); nextAspectSlide('${currentPa.id}', ${idx})" class="pointer-events-auto w-6 h-6 rounded-full bg-black/60 hover:bg-amber-600 text-white flex items-center justify-center backdrop-blur-xs transition-all cursor-pointer shadow-md" title="ภาพถัดไป">
                                  <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
                                </button>
                              </div>

                              <!-- Progress Dots -->
                              <div class="absolute bottom-1 inset-x-0 flex items-center justify-center gap-1 z-30 pointer-events-none">
                                ${allImgs.slice(0, 8).map((_, dotIdx) => `
                                  <span class="aspect-dot-${currentPa.id}-${idx} h-1 rounded-full transition-all duration-300 ${dotIdx === 0 ? 'w-3.5 bg-amber-400' : 'w-1 bg-white/50'}"></span>
                                `).join('')}
                              </div>
                            ` : ''}
                          </div>
                        </div>
                      ` : `
                        <div class="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-1.5">
                          <i data-lucide="camera-off" class="w-5 h-5 text-slate-400"></i>
                          <span class="font-sarabun">ยังไม่มีรูปภาพกิจกรรม</span>
                        </div>
                      `}
                    </div>

                    <!-- Action Buttons -->
                    <div class="space-y-2 pt-2 border-t border-slate-100">
                      <button onclick="openAspectDetailModal('${currentPa.id}', ${idx})" class="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold font-prompt text-xs flex items-center justify-center gap-2 transition-all shadow-xs hover:shadow-md cursor-pointer">
                        <i data-lucide="eye" class="w-4 h-4"></i>
                        <span>เปิดดูข้อมูล & รูปภาพหลักฐาน</span>
                      </button>

                      <div class="flex items-center gap-2">
                        ${ind.docUrl ? `
                          <button onclick="openDocumentPreview('${ind.standard}', '${ind.docUrl}')" class="flex-1 py-1.5 px-2 rounded-lg bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-slate-600 border border-slate-200 font-medium text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer" title="เปิดดูไฟล์เอกสาร PDF แนบ">
                            <i data-lucide="file-text" class="w-3.5 h-3.5 text-blue-600"></i>
                            <span>เอกสาร PDF</span>
                          </button>
                        ` : ''}
                        ${isAdmin ? `
                          <button onclick="openEditAspectModal('${currentPa.id}', ${idx})" class="py-1.5 px-2.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-semibold text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer" title="แก้ไขเอกสารแนบและตัวชี้วัดด้านนี้">
                            <i data-lucide="plus-circle" class="w-3.5 h-3.5 text-amber-600"></i>
                            <span>เพิ่มภาพ/แก้ข้อมูล</span>
                          </button>
                        ` : ''}
                      </div>
                    </div>
                  </div>
                `;
              }).join("")}
            </div>
          </div>

          <!-- 2. ส่วนที่ 2: ข้อตกลงในการพัฒนางานที่เป็นประเด็นท้าทาย (Challenge Issue) & YouTube Embed -->
          <div class="pt-4 border-t space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div class="flex items-center gap-2 text-amber-700 font-bold text-base md:text-lg">
                <i data-lucide="target" class="w-5 h-5 text-amber-600"></i>
                <span>ส่วนที่ 2: ข้อตกลงในการพัฒนางานที่เป็นประเด็นท้าทาย (Challenge Issue)</span>
              </div>
              ${isAdmin ? `
                <button onclick="openEditPaChallengeModal('${currentPa.id}')" class="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs shrink-0">
                  <i data-lucide="edit-3" class="w-3.5 h-3.5 text-amber-600"></i>
                  <span>แก้ไขประเด็นท้าทาย & วิดีโอ</span>
                </button>
              ` : ""}
            </div>

            ${hasVideo ? `
              <!-- 2 Columns: Challenge Issue + Video Player -->
              <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div class="lg:col-span-7 space-y-4">
                  <div class="p-5 bg-amber-50/50 rounded-2xl border border-amber-200/70 space-y-3 font-sarabun text-sm">
                    <div>
                      <span class="font-bold text-slate-800 block text-xs font-prompt text-amber-800">ประเด็นท้าทาย:</span>
                      <p class="text-slate-700 mt-1 font-semibold leading-relaxed">${currentPa.challengeTitle || "-"}</p>
                    </div>
                    <div>
                      <span class="font-bold text-slate-800 block text-xs font-prompt text-slate-500">วัตถุประสงค์:</span>
                      <p class="text-slate-600 mt-0.5 whitespace-pre-line leading-relaxed">${currentPa.challengeObjective || "-"}</p>
                    </div>
                    <div>
                      <span class="font-bold text-slate-800 block text-xs font-prompt text-slate-500">วิธีดำเนินการ:</span>
                      <p class="text-slate-600 mt-0.5 leading-relaxed">${currentPa.challengeMethod || "-"}</p>
                    </div>
                    <div>
                      <span class="font-bold text-slate-800 block text-xs font-prompt text-emerald-700">ผลลัพธ์ที่เกิดขึ้นจริง:</span>
                      <p class="text-emerald-800 font-medium mt-0.5 leading-relaxed">${currentPa.challengeResult || "-"}</p>
                    </div>
                  </div>
                </div>

                <!-- YouTube Video Player -->
                <div class="lg:col-span-5 space-y-3">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <i data-lucide="video" class="w-4 h-4 text-rose-600"></i> วิดีโอบันทึกการสอน / นวัตกรรม (YouTube)
                    </span>
                    <a href="${currentPa.youtubeUrl || `https://www.youtube.com/watch?v=${ytVideoId}`}" target="_blank" class="text-xs text-blue-600 hover:underline">เปิดบน YouTube</a>
                  </div>
                  <div class="relative rounded-2xl overflow-hidden shadow-lg aspect-video bg-black border border-slate-200">
                    <iframe 
                      class="w-full h-full"
                      src="https://www.youtube-nocookie.com/embed/${ytVideoId}?rel=0" 
                      title="คลิปการจัดการเรียนรู้ วPA" 
                      frameborder="0" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowfullscreen>
                    </iframe>
                  </div>
                  <p class="text-[11px] text-slate-500 text-center font-sarabun">คลิปวิดีโอบันทึกการจัดกิจกรรมการเรียนรู้ตามสภาพจริง</p>
                </div>
              </div>
            ` : `
              <!-- 1 Column Full Width: Challenge Issue (When no video provided) -->
              <div class="p-6 bg-gradient-to-br from-amber-50/70 via-white to-amber-50/30 rounded-2xl border border-amber-200/70 space-y-4 font-sarabun text-sm shadow-xs">
                <div>
                  <span class="font-bold text-slate-800 block text-xs font-prompt text-amber-800">ประเด็นท้าทาย:</span>
                  <p class="text-slate-800 mt-1 font-semibold text-base leading-relaxed">${currentPa.challengeTitle || "-"}</p>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div class="p-4 bg-white rounded-xl border border-amber-100 shadow-2xs">
                    <span class="font-bold text-slate-700 block text-xs font-prompt text-slate-500">วัตถุประสงค์:</span>
                    <p class="text-slate-600 mt-1 whitespace-pre-line leading-relaxed text-xs md:text-sm">${currentPa.challengeObjective || "-"}</p>
                  </div>
                  <div class="p-4 bg-white rounded-xl border border-amber-100 shadow-2xs">
                    <span class="font-bold text-slate-700 block text-xs font-prompt text-slate-500">วิธีดำเนินการ:</span>
                    <p class="text-slate-600 mt-1 leading-relaxed text-xs md:text-sm">${currentPa.challengeMethod || "-"}</p>
                  </div>
                </div>
                <div class="p-4 bg-emerald-50/80 rounded-xl border border-emerald-200 shadow-2xs">
                  <span class="font-bold text-emerald-800 block text-xs font-prompt">ผลลัพธ์ที่เกิดขึ้นจริง:</span>
                  <p class="text-emerald-900 font-medium mt-1 leading-relaxed text-xs md:text-sm">${currentPa.challengeResult || "-"}</p>
                </div>
              </div>
            `}

            <!-- ภาพถ่ายกิจกรรมและร่องรอยหลักฐานประเด็นท้าทาย -->
            ${(currentPa.challengeImages && currentPa.challengeImages.length > 0) ? `
              <div class="p-5 bg-white rounded-2xl border border-amber-200/80 shadow-xs space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-slate-800 flex items-center gap-1.5 font-prompt">
                    <i data-lucide="camera" class="w-4 h-4 text-amber-600"></i> ภาพถ่ายกิจกรรมและร่องรอยหลักฐานประเด็นท้าทาย (${currentPa.challengeImages.length} ภาพ):
                  </span>
                  <span class="text-[11px] text-slate-400 font-sarabun">คลิกที่รูปภาพเพื่อขยายดูขนาดเต็ม</span>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                  ${currentPa.challengeImages.map((imgObj, i) => {
                    const imgUrl = typeof imgObj === 'string' ? imgObj : imgObj.url;
                    const imgCap = typeof imgObj === 'string' ? '' : (imgObj.caption || '');
                    const safeTitle = (currentPa.challengeTitle || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
                    const safeCap = (imgCap || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
                    return `
                      <div class="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group">
                        <div onclick="openImageViewer('${imgUrl}', 'ประเด็นท้าทาย: ${safeCap || safeTitle}')" class="relative aspect-4/3 overflow-hidden bg-slate-100 cursor-pointer">
                          <img src="${imgUrl}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                          <div class="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1 font-prompt">
                            <i data-lucide="zoom-in" class="w-4 h-4"></i> ขยายภาพ
                          </div>
                        </div>
                        <div class="p-2.5 bg-slate-50 border-t border-slate-100">
                          <p class="text-xs font-sarabun text-slate-700 leading-relaxed flex items-start gap-1.5">
                            <i data-lucide="info" class="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5"></i>
                            <span>${imgCap || 'ภาพกิจกรรมและผลลัพธ์ประเด็นท้าทาย'}</span>
                          </p>
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            ` : `
              ${isAdmin ? `
                <div class="p-4 bg-amber-50/40 rounded-2xl border border-dashed border-amber-300 text-center space-y-2">
                  <i data-lucide="camera" class="w-6 h-6 text-amber-500 mx-auto"></i>
                  <p class="text-xs text-amber-900 font-sarabun">ยังไม่มีรูปภาพกิจกรรม/หลักฐานสำหรับประเด็นท้าทายนี้</p>
                  <button type="button" onclick="openEditPaChallengeModal('${currentPa.id}')" class="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-navy-950 rounded-xl text-xs font-bold font-prompt transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5">
                    <i data-lucide="image-plus" class="w-3.5 h-3.5"></i> เพิ่มรูปภาพประเด็นท้าทาย
                  </button>
                </div>
              ` : ''}
            `}
          </div>

          <!-- 3. เอกสารหลักฐานประกอบการประเมิน วPA ฉบับเต็ม (PA-1, PA-2, PA-3) -->
          <div class="pt-4 border-t space-y-3">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 class="font-bold text-slate-800 text-sm md:text-base flex items-center gap-2">
                  <i data-lucide="file-text" class="w-5 h-5 text-blue-600"></i> เอกสารหลักฐานและแบบประเมิน วPA ฉบับเต็ม
                </h4>
                <p class="text-xs text-slate-500 font-sarabun mt-0.5">คลิกเปิดอ่านไฟล์ PDF เพื่อตรวจสอบความสมบูรณ์ของแบบข้อตกลงและรายงานผล</p>
              </div>
              ${isAdmin ? `
                <button onclick="openEditPaDocsModal('${currentPa.id}')" class="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-300 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs shrink-0">
                  <i data-lucide="file-edit" class="w-3.5 h-3.5 text-blue-600"></i>
                  <span>แก้ไขลิงก์เอกสาร วPA (PA 1-3)</span>
                </button>
              ` : ""}
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div onclick="openDocumentPreview('${currentPa.roundTitle} - แบบข้อตกลง PA 1/ส', '${currentPa.pa1DocUrl || ''}')" class="p-4 rounded-2xl border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer bg-white group">
                <div class="flex items-center gap-3">
                  <div class="w-11 h-11 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs shrink-0">
                    <i data-lucide="file" class="w-5 h-5"></i>
                  </div>
                  <div>
                    <div class="font-bold text-slate-800 text-sm group-hover:text-blue-600">แบบ PA 1/ส</div>
                    <div class="text-xs text-slate-500 font-sarabun">ข้อตกลงในการพัฒนางาน</div>
                  </div>
                </div>
              </div>
              <div onclick="openDocumentPreview('${currentPa.roundTitle} - รายงานผล PA 2/ส', '${currentPa.pa2DocUrl || ''}')" class="p-4 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer bg-white group">
                <div class="flex items-center gap-3">
                  <div class="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs shrink-0">
                    <i data-lucide="file-check-2" class="w-5 h-5"></i>
                  </div>
                  <div>
                    <div class="font-bold text-slate-800 text-sm group-hover:text-emerald-600">แบบ PA 2/ส</div>
                    <div class="text-xs text-slate-500 font-sarabun">รายงานผลการพัฒนางาน</div>
                  </div>
                </div>
              </div>
              <div onclick="openDocumentPreview('${currentPa.roundTitle} - แบบประเมิน PA 3/ส', '${currentPa.pa3DocUrl || ''}')" class="p-4 rounded-2xl border border-slate-200 hover:border-purple-500 hover:shadow-md transition-all cursor-pointer bg-white group">
                <div class="flex items-center gap-3">
                  <div class="w-11 h-11 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs shrink-0">
                    <i data-lucide="award" class="w-5 h-5"></i>
                  </div>
                  <div>
                    <div class="font-bold text-slate-800 text-sm group-hover:text-purple-600">แบบ PA 3/ส</div>
                    <div class="text-xs text-slate-500 font-sarabun">แบบประเมินผลการพัฒนางาน</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `}
    </div>
  `;
}

function setPaYear(year) {
  AppState.activePaYear = year;
  renderCurrentView();
}

// ==========================================
// 5. Lesson Plans View (แผนการจัดการเรียนรู้)
// ==========================================
function renderLessonPlansView(data, isAdmin) {
  const allItems = data.lessonPlans || [];
  let items = allItems;

  if (!isAdmin) {
    items = items.filter(item => item.isVisible);
  }

  if (AppState.activeFilterYear !== "all") {
    items = items.filter(item => item.academicYear === AppState.activeFilterYear);
  }

  if (AppState.searchQuery) {
    items = items.filter(item => 
      item.title.toLowerCase().includes(AppState.searchQuery) ||
      item.code.toLowerCase().includes(AppState.searchQuery) ||
      item.grade.toLowerCase().includes(AppState.searchQuery) ||
      item.subject.toLowerCase().includes(AppState.searchQuery)
    );
  }

  return `
    <div class="page-view space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <i data-lucide="book-open" class="w-7 h-7 text-sky-600"></i> แผนการจัดการเรียนรู้ (Lesson Plans)
          </h2>
          <p class="text-xs md:text-sm text-slate-500 mt-0.5">ชั้นหนังสือรวบรวมแผนการสอน สื่อ นวัตกรรม และบันทึกหลังสอน</p>
        </div>
        ${isAdmin ? `
          <button onclick="openAddItemModal('lessonPlans')" class="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-md transition-colors">
            <i data-lucide="plus-circle" class="w-4 h-4"></i> เพิ่มแผนการสอน
          </button>
        ` : ""}
      </div>

      <!-- Filter Bar -->
      <div class="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold text-slate-600 font-prompt">กรองตามปีการศึกษา:</span>
          <select onchange="setYearFilter(this.value)" class="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 font-sarabun">
            <option value="all" ${AppState.activeFilterYear === "all" ? "selected" : ""}>ทุกปีการศึกษา</option>
            <option value="2568" ${AppState.activeFilterYear === "2568" ? "selected" : ""}>2568</option>
            <option value="2567" ${AppState.activeFilterYear === "2567" ? "selected" : ""}>2567</option>
            <option value="2566" ${AppState.activeFilterYear === "2566" ? "selected" : ""}>2566</option>
          </select>
        </div>
        <div class="text-xs text-slate-500">
          แสดง ${items.length} รายการ
        </div>
      </div>

      <!-- Digital Bookshelf / Grid View -->
      ${items.length === 0 ? `
        <div class="text-center py-12 glass-card rounded-2xl border border-dashed border-slate-300">
          <i data-lucide="book-x" class="w-12 h-12 text-slate-300 mx-auto mb-3"></i>
          <p class="text-slate-500 text-sm font-sarabun">ไม่พบแผนการจัดการเรียนรู้ตามเงื่อนไขที่เลือก</p>
        </div>
      ` : `
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          ${items.map(item => renderBookCard("lessonPlans", item, isAdmin)).join("")}
        </div>
      `}
    </div>
  `;
}

// ==========================================
// 6. Official Documents View (เอกสารทางราชการ)
// ==========================================
function renderOfficialDocsView(data, isAdmin) {
  const allItems = data.officialDocs || [];
  let items = allItems;

  if (!isAdmin) {
    items = items.filter(item => item.isVisible);
  }

  if (AppState.activeFilterCategory !== "all") {
    items = items.filter(item => item.category === AppState.activeFilterCategory);
  }

  if (AppState.searchQuery) {
    items = items.filter(item => 
      item.title.toLowerCase().includes(AppState.searchQuery) ||
      item.docNumber?.toLowerCase().includes(AppState.searchQuery) ||
      item.category?.toLowerCase().includes(AppState.searchQuery)
    );
  }

  const categories = ["คำสั่งโรงเรียน", "เกียรติบัตร/วุฒิบัตร", "ตารางสอน/ตารางกิจกรรม", "บันทึกข้อความ"];

  return `
    <div class="page-view space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <i data-lucide="folder-kanban" class="w-7 h-7 text-indigo-600"></i> เอกสารทางราชการ (Official Documents)
          </h2>
          <p class="text-xs md:text-sm text-slate-500 mt-0.5">คำสั่งโรงเรียน เกียรติบัตรการพัฒนาตนเอง และตารางการปฏิบัติงาน</p>
        </div>
        ${isAdmin ? `
          <button onclick="openAddItemModal('officialDocs')" class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md transition-colors">
            <i data-lucide="plus-circle" class="w-4 h-4"></i> เพิ่มเอกสารราชการ
          </button>
        ` : ""}
      </div>

      <!-- Category Filter Pills -->
      <div class="flex items-center gap-2 overflow-x-auto pb-2">
        <button onclick="setCategoryFilter('all')" class="px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${AppState.activeFilterCategory === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-700 border border-slate-200 hover:bg-indigo-50'}">
          ทั้งหมด
        </button>
        ${categories.map(cat => `
          <button onclick="setCategoryFilter('${cat}')" class="px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${AppState.activeFilterCategory === cat ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-700 border border-slate-200 hover:bg-indigo-50'}">
            ${cat}
          </button>
        `).join("")}
      </div>

      <!-- Document Shelf Grid -->
      ${items.length === 0 ? `
        <div class="text-center py-12 glass-card rounded-2xl border border-dashed border-slate-300">
          <i data-lucide="file-x" class="w-12 h-12 text-slate-300 mx-auto mb-3"></i>
          <p class="text-slate-500 text-sm font-sarabun">ไม่พบเอกสารในหมวดหมู่นี้</p>
        </div>
      ` : `
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          ${items.map(item => renderBookCard("officialDocs", item, isAdmin)).join("")}
        </div>
      `}
    </div>
  `;
}

// ==========================================
// 7. Achievements & Awards View (ผลงานและรางวัล)
// ==========================================
function renderAchievementsView(data, isAdmin) {
  const allItems = data.achievements || [];
  const currentTab = AppState.activeAchTab;
  let items = allItems.filter(item => item.type === currentTab);

  if (!isAdmin) {
    items = items.filter(item => item.isVisible);
  }

  if (AppState.searchQuery) {
    items = items.filter(item => 
      item.title.toLowerCase().includes(AppState.searchQuery) ||
      item.organization?.toLowerCase().includes(AppState.searchQuery) ||
      item.level?.toLowerCase().includes(AppState.searchQuery)
    );
  }

  return `
    <div class="page-view space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <i data-lucide="trophy" class="w-7 h-7 text-amber-500"></i> ผลงานและรางวัลที่ภาคภูมิใจ (Achievements & Awards)
          </h2>
          <p class="text-xs md:text-sm text-slate-500 mt-0.5">รางวัลเชิดชูเกียรติครูผู้สอน และรางวัลความสำเร็จของนักเรียน</p>
        </div>
        ${isAdmin ? `
          <button onclick="openAddItemModal('achievements')" class="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold shadow-md transition-colors">
            <i data-lucide="plus-circle" class="w-4 h-4"></i> เพิ่มรางวัลผลงาน
          </button>
        ` : ""}
      </div>

      <!-- Tab Switcher: Teacher vs Student -->
      <div class="flex border-b border-slate-200">
        <button onclick="setAchTab('teacher')" class="px-6 py-3 font-prompt font-semibold text-sm border-b-2 flex items-center gap-2 transition-all ${currentTab === 'teacher' ? 'border-amber-500 text-amber-600 bg-amber-50/50' : 'border-transparent text-slate-500 hover:text-slate-800'}">
          <i data-lucide="award" class="w-4 h-4"></i> ผลงานและรางวัลของครูผู้สอน
        </button>
        <button onclick="setAchTab('student')" class="px-6 py-3 font-prompt font-semibold text-sm border-b-2 flex items-center gap-2 transition-all ${currentTab === 'student' ? 'border-amber-500 text-amber-600 bg-amber-50/50' : 'border-transparent text-slate-500 hover:text-slate-800'}">
          <i data-lucide="users" class="w-4 h-4"></i> ผลงานและรางวัลของนักเรียน
        </button>
      </div>

      <!-- Awards Shelf Grid -->
      ${items.length === 0 ? `
        <div class="text-center py-12 glass-card rounded-2xl border border-dashed border-slate-300">
          <i data-lucide="award" class="w-12 h-12 text-slate-300 mx-auto mb-3"></i>
          <p class="text-slate-500 text-sm font-sarabun">ยังไม่มีข้อมูลรางวัลในหมวดนี้</p>
        </div>
      ` : `
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          ${items.map(item => renderBookCard("achievements", item, isAdmin)).join("")}
        </div>
      `}
    </div>
  `;
}

function setAchTab(tab) {
  AppState.activeAchTab = tab;
  renderCurrentView();
}

// ==========================================
// 8. Activity Gallery View (ภาพกิจกรรมต่าง ๆ)
// ==========================================
function renderGalleryView(data, isAdmin) {
  const allItems = data.gallery || [];
  let items = allItems;

  if (!isAdmin) {
    items = items.filter(item => item.isVisible);
  }

  if (AppState.searchQuery) {
    items = items.filter(item => 
      item.title.toLowerCase().includes(AppState.searchQuery) ||
      item.description?.toLowerCase().includes(AppState.searchQuery) ||
      item.category?.toLowerCase().includes(AppState.searchQuery)
    );
  }

  return `
    <div class="page-view space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <i data-lucide="images" class="w-7 h-7 text-rose-600"></i> ภาพกิจกรรมต่าง ๆ (Activity Gallery)
          </h2>
          <p class="text-xs md:text-sm text-slate-500 mt-0.5">ประมวลภาพกิจกรรมการเรียนการสอน งานโครงการ และบริการสังคม</p>
        </div>
        ${isAdmin ? `
          <button onclick="openAddItemModal('gallery')" class="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-md transition-colors">
            <i data-lucide="plus-circle" class="w-4 h-4"></i> เพิ่มอัลบั้มภาพกิจกรรม
          </button>
        ` : ""}
      </div>

      <!-- Albums Grid -->
      ${items.length === 0 ? `
        <div class="text-center py-12 glass-card rounded-2xl border border-dashed border-slate-300">
          <i data-lucide="image-off" class="w-12 h-12 text-slate-300 mx-auto mb-3"></i>
          <p class="text-slate-500 text-sm font-sarabun">ไม่พบภาพกิจกรรม</p>
        </div>
      ` : `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${items.map(album => `
            <div class="glass-card rounded-2xl overflow-hidden border border-slate-200 hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div class="relative overflow-hidden aspect-video bg-slate-100 cursor-pointer" onclick="openGalleryLightbox('${album.id}')">
                  <img src="${album.coverImage}" alt="${album.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                  <div class="absolute top-3 left-3 px-2.5 py-1 bg-black/60 backdrop-blur-sm text-white text-xs rounded-lg font-medium">
                    ${album.category}
                  </div>
                  <div class="absolute bottom-3 right-3 px-2.5 py-1 bg-blue-600/90 text-white text-xs rounded-lg font-semibold flex items-center gap-1">
                    <i data-lucide="camera" class="w-3.5 h-3.5"></i> ${(album.images?.length || 1)} รูป
                  </div>
                  ${!album.isVisible ? `
                    <div class="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-white text-xs font-bold">
                      <i data-lucide="eye-off" class="w-4 h-4 mr-1"></i> ซ่อนจากคณะกรรมการ
                    </div>
                  ` : ""}
                </div>
                <div class="p-5 space-y-2">
                  <div class="text-xs text-slate-400 font-sarabun flex items-center gap-2">
                    <i data-lucide="calendar" class="w-3.5 h-3.5"></i> ${album.date}
                    ${album.location ? `• <span>${album.location}</span>` : ""}
                  </div>
                  <h3 class="font-bold text-slate-800 text-base leading-snug group-hover:text-rose-600 transition-colors line-clamp-2">${album.title}</h3>
                  <p class="text-xs text-slate-500 font-sarabun line-clamp-2">${album.description || ""}</p>
                </div>
              </div>

              <div class="p-5 pt-0 flex items-center justify-between border-t border-slate-100 mt-2">
                <button onclick="openGalleryLightbox('${album.id}')" class="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1">
                  ดูรูปทั้งหมด <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
                </button>
                ${isAdmin ? `
                  <div class="flex items-center gap-1.5">
                    <button onclick="toggleVisibility('gallery', '${album.id}')" class="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg text-xs" title="เปิด/ปิดการมองเห็น">
                      <i data-lucide="${album.isVisible ? 'eye' : 'eye-off'}" class="w-4 h-4"></i>
                    </button>
                    <button onclick="openEditItemModal('gallery', '${album.id}')" class="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded-lg text-xs" title="แก้ไข">
                      <i data-lucide="edit" class="w-4 h-4"></i>
                    </button>
                    <button onclick="confirmDeleteItem('gallery', '${album.id}')" class="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg text-xs" title="ลบ">
                      <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                  </div>
                ` : ""}
              </div>
            </div>
          `).join("")}
        </div>
      `}
    </div>
  `;
}

// ==========================================
// 8. Media & Online Systems View (สื่อและระบบออนไลน์ & เพจ)
// ==========================================
function renderMediaSystemsView(data, isAdmin) {
  const allItems = data.onlineSystems || [];
  let items = allItems;

  if (!isAdmin) {
    items = items.filter(item => item.isVisible);
  }

  if (AppState.activeFilterCategory && AppState.activeFilterCategory !== "all") {
    items = items.filter(item => item.category === AppState.activeFilterCategory);
  }

  if (AppState.searchQuery) {
    items = items.filter(item =>
      item.title.toLowerCase().includes(AppState.searchQuery) ||
      item.description?.toLowerCase().includes(AppState.searchQuery) ||
      item.platform?.toLowerCase().includes(AppState.searchQuery) ||
      item.category?.toLowerCase().includes(AppState.searchQuery)
    );
  }

  const categories = [
    "ระบบออนไลน์ / Web App",
    "สื่อการสอน / นวัตกรรม",
    "เพจ & โซเชียลมีเดีย"
  ];

  return `
    <div class="page-view space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-2xl font-bold text-slate-800 flex items-center gap-2 font-prompt">
              <i data-lucide="globe" class="w-7 h-7 text-cyan-600"></i> สื่อและระบบออนไลน์ (Digital Media & Online Systems)
            </h2>
            <span class="px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 text-xs font-bold font-prompt">
              ${items.length} รายการ
            </span>
          </div>
          <p class="text-xs md:text-sm text-slate-500 mt-0.5">คลังระบบเว็บแอปพลิเคชัน สื่อนวัตกรรมการเรียนรู้ดิจิทัล และช่องทางเพจประชาสัมพันธ์</p>
        </div>
        ${isAdmin ? `
          <button onclick="openAddOnlineSystemModal()" class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-xl text-xs font-bold font-prompt shadow-md transition-all cursor-pointer">
            <i data-lucide="plus-circle" class="w-4 h-4"></i> เพิ่มสื่อ / ระบบ / ลิงก์เพจ
          </button>
        ` : ""}
      </div>

      <!-- Filter Bar -->
      <div class="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div class="flex flex-wrap items-center gap-2">
          <button onclick="setCategoryFilter('all')" class="px-3.5 py-1.5 rounded-xl text-xs font-bold font-prompt whitespace-nowrap transition-all cursor-pointer ${(!AppState.activeFilterCategory || AppState.activeFilterCategory === 'all') ? 'bg-cyan-600 text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'}">
            ทั้งหมด
          </button>
          ${categories.map(cat => `
            <button onclick="setCategoryFilter('${cat}')" class="px-3.5 py-1.5 rounded-xl text-xs font-bold font-prompt whitespace-nowrap transition-all cursor-pointer ${AppState.activeFilterCategory === cat ? 'bg-cyan-600 text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'}">
              ${cat}
            </button>
          `).join("")}
        </div>
        <div class="text-xs text-slate-500 font-prompt">
          แสดง ${items.length} รายการ
        </div>
      </div>

      <!-- Online Media & Systems Grid -->
      ${items.length === 0 ? `
        <div class="text-center py-12 glass-card rounded-2xl border border-dashed border-slate-300">
          <i data-lucide="globe-2" class="w-12 h-12 text-slate-300 mx-auto mb-3"></i>
          <p class="text-slate-500 text-sm font-prompt">ไม่พบรายการสื่อหรือระบบออนไลน์ในหมวดนี้</p>
        </div>
      ` : `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${items.map(item => {
            const isPage = item.category?.includes("เพจ") || item.platform?.includes("Facebook");
            const isApp = item.category?.includes("ระบบ") || item.platform?.includes("App");
            const iconName = isPage ? "share-2" : isApp ? "laptop" : "sparkles";
            const badgeBg = isPage ? "bg-blue-600 text-white" : isApp ? "bg-cyan-600 text-white" : "bg-purple-600 text-white";

            return `
              <div class="glass-card rounded-2xl overflow-hidden border border-slate-200 hover:border-cyan-400 hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
                <div>
                  <!-- Cover & In-App Action Preview -->
                  <div class="relative overflow-hidden aspect-video bg-slate-900 cursor-pointer" onclick="openInAppWebViewer('${item.id}')">
                    <img src="${item.coverUrl || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71'}" alt="${item.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100">
                    
                    <div class="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      <span class="px-2.5 py-1 ${badgeBg} text-[11px] rounded-lg font-bold font-prompt shadow-md flex items-center gap-1">
                        <i data-lucide="${iconName}" class="w-3 h-3"></i> ${item.category}
                      </span>
                    </div>

                    ${item.platform ? `
                      <div class="absolute top-3 right-3 px-2 py-0.5 bg-black/70 backdrop-blur-xs text-amber-300 text-[10px] font-bold font-prompt rounded-md border border-white/20">
                        ${item.platform}
                      </div>
                    ` : ""}

                    <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4 text-white">
                      <span class="text-xs font-bold font-prompt flex items-center gap-1.5 bg-cyan-500/95 text-navy-950 px-3 py-1.5 rounded-xl shadow-lg">
                        <i data-lucide="laptop" class="w-3.5 h-3.5"></i> เปิดใช้งานในระบบ (In-App)
                      </span>
                    </div>

                    ${!item.isVisible ? `
                      <div class="absolute inset-0 bg-slate-900/70 flex items-center justify-center text-white text-xs font-bold z-20">
                        <i data-lucide="eye-off" class="w-4 h-4 mr-1"></i> ซ่อนจากคณะกรรมการ
                      </div>
                    ` : ""}
                  </div>

                  <!-- Details -->
                  <div class="p-5 space-y-2">
                    <h3 class="font-bold text-slate-800 text-base font-prompt leading-snug group-hover:text-cyan-600 transition-colors line-clamp-2 cursor-pointer" onclick="openInAppWebViewer('${item.id}')" title="${item.title}">
                      ${item.title}
                    </h3>
                    <p class="text-xs text-slate-500 font-sarabun line-clamp-3 leading-relaxed">
                      ${item.description || "ไม่มีคำอธิบายเพิ่มเติม"}
                    </p>
                  </div>
                </div>

                <!-- Footer Launch Actions (In-App + External Tab) -->
                <div class="p-5 pt-0 border-t border-slate-100 mt-2 flex items-center justify-between">
                  <div class="flex items-center gap-1.5">
                    <button onclick="openInAppWebViewer('${item.id}')" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-prompt text-xs font-bold transition-all shadow-sm cursor-pointer">
                      <i data-lucide="laptop" class="w-3.5 h-3.5"></i>
                      <span>เปิดในระบบ</span>
                    </button>
                    <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="p-1.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-cyan-700 font-prompt text-xs flex items-center gap-1 transition-colors" title="เปิดในแท็บเบราว์เซอร์ใหม่">
                      <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
                      <span class="text-[11px] hidden sm:inline">แท็บใหม่</span>
                    </a>
                  </div>

                  ${isAdmin ? `
                    <div class="flex items-center gap-1">
                      <button onclick="toggleVisibility('onlineSystems', '${item.id}')" class="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-slate-100 rounded-lg text-xs cursor-pointer" title="เปิด/ปิด การมองเห็น">
                        <i data-lucide="${item.isVisible ? 'eye' : 'eye-off'}" class="w-3.5 h-3.5"></i>
                      </button>
                      <button onclick="openEditOnlineSystemModal('${item.id}')" class="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded-lg text-xs cursor-pointer" title="แก้ไข">
                        <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                      </button>
                      <button onclick="confirmDeleteItem('onlineSystems', '${item.id}')" class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg text-xs cursor-pointer" title="ลบ">
                        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                      </button>
                    </div>
                  ` : ""}
                </div>
              </div>
            `;
          }).join("")}
        </div>
      `}
    </div>
  `;
}

// ==========================================
// Reusable Component: 3D Book Cover / Document / Award Photo Card
// ==========================================
function renderBookCard(collectionName, item, isAdmin) {
  const badgeText = item.score || item.grade || item.level || item.category || item.academicYear || "";
  const hasPdf = item.pdfUrl && String(item.pdfUrl).trim().length > 5 && !item.pdfUrl.includes("dummy.pdf");
  const isImageStory = collectionName === "achievements" || !hasPdf;

  return `
    <div class="book-card flex flex-col justify-between glass-card p-4 rounded-2xl border border-slate-200 group hover:border-blue-400 transition-all">
      <div>
        <!-- 3D Book Cover / Award Photo Frame -->
        <div class="book-cover cursor-pointer relative" onclick="openUniversalItemViewer('${collectionName}', '${item.id}')">
          <img src="${item.coverUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136'}" alt="${item.title}" class="w-full h-full object-cover">
          ${badgeText ? `<div class="ribbon-badge">${badgeText}</div>` : ""}
          <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 text-white">
            <span class="text-xs font-bold flex items-center gap-1.5 ${isImageStory ? 'bg-amber-500/95 text-navy-950' : 'bg-blue-600/95 text-white'} px-3 py-1.5 rounded-xl w-fit mb-1 shadow-lg font-prompt">
              <i data-lucide="${isImageStory ? 'image' : 'file-search'}" class="w-4 h-4"></i> ${isImageStory ? 'ดูภาพผลงาน & คำบรรยาย' : 'เปิดอ่านเอกสาร PDF'}
            </span>
            <span class="text-[10px] text-slate-200">คลิกเพื่อดูรายละเอียดและขยายภาพ</span>
          </div>
          ${!item.isVisible ? `
            <div class="absolute inset-0 bg-slate-900/70 flex items-center justify-center text-white text-xs font-bold z-20">
              <i data-lucide="eye-off" class="w-4 h-4 mr-1"></i> ซ่อนจากคณะกรรมการ
            </div>
          ` : ""}
        </div>

        <!-- Document / Award Details -->
        <div class="mt-4 space-y-1.5">
          ${item.code ? `<div class="text-xs font-bold text-blue-600 font-prompt">${item.code}</div>` : ""}
          <h3 class="font-bold text-slate-800 text-sm leading-snug group-hover:text-blue-600 transition-colors line-clamp-2" title="${item.title}">
            ${item.title}
          </h3>
          <p class="text-xs text-slate-500 font-sarabun line-clamp-2">${item.description || item.subCategory || item.organization || ""}</p>
        </div>
      </div>

      <!-- Action Footer -->
      <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <button onclick="openUniversalItemViewer('${collectionName}', '${item.id}')" class="text-xs font-bold ${isImageStory ? 'text-amber-600 hover:text-amber-700' : 'text-blue-600 hover:text-blue-800'} flex items-center gap-1 cursor-pointer font-prompt">
          <i data-lucide="${isImageStory ? 'image' : 'book-open'}" class="w-3.5 h-3.5"></i> ${isImageStory ? 'ดูภาพ / คำบรรยาย' : 'พรีวิวเอกสาร'}
        </button>

        ${isAdmin ? `
          <div class="flex items-center gap-1">
            <button onclick="toggleVisibility('${collectionName}', '${item.id}')" class="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-md cursor-pointer" title="เปิด/ปิด การมองเห็น">
              <i data-lucide="${item.isVisible ? 'eye' : 'eye-off'}" class="w-3.5 h-3.5"></i>
            </button>
            <button onclick="openEditItemModal('${collectionName}', '${item.id}')" class="p-1 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded-md cursor-pointer" title="แก้ไข">
              <i data-lucide="edit" class="w-3.5 h-3.5"></i>
            </button>
            <button onclick="confirmDeleteItem('${collectionName}', '${item.id}')" class="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-md cursor-pointer" title="ลบ">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        ` : ""}
      </div>
    </div>
  `;
}

// ==========================================
// Universal Rich Item Viewer (Image & Story & PDF)
// ==========================================
function openUniversalItemViewer(collectionName, itemId) {
  const data = window.portfolioStorage.getData();
  const list = data[collectionName] || [];
  const item = list.find(i => String(i.id) === String(itemId));
  if (!item) return;

  const isAdmin = window.portfolioStorage.isAdmin();
  const imgSrc = item.coverUrl || item.certificateUrl || item.imageUrl || "https://images.unsplash.com/photo-1544717305-2782549b5136";
  const hasPdf = item.pdfUrl && String(item.pdfUrl).trim().length > 5 && !item.pdfUrl.includes("dummy.pdf");
  const badgeText = item.score || item.grade || item.level || item.category || item.academicYear || "";

  Swal.fire({
    title: null,
    html: `
      <div class="space-y-4 text-left font-sarabun -m-1">
        <!-- Top Image Card Header with Category Badge & Close -->
        <div class="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-700 shadow-md group">
          <img id="viewer-main-image" src="${imgSrc}" class="w-full max-h-[380px] object-contain mx-auto bg-black/40 cursor-zoom-in" alt="${item.title}" onclick="window.open('${imgSrc}', '_blank')">
          
          <div class="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
            ${badgeText ? `
              <span class="px-3 py-1 rounded-xl text-xs font-bold font-prompt bg-amber-500 text-white shadow-lg">
                ${badgeText}
              </span>
            ` : ""}
            ${item.academicYear ? `
              <span class="px-2.5 py-1 rounded-xl text-xs font-bold font-prompt bg-black/60 text-amber-300 backdrop-blur-xs border border-white/20">
                ปีการศึกษา ${item.academicYear}
              </span>
            ` : ""}
          </div>

          <div class="absolute bottom-2 right-3">
            <a href="${imgSrc}" target="_blank" class="px-2.5 py-1 rounded-lg bg-black/60 hover:bg-black/80 text-white text-[11px] font-prompt flex items-center gap-1 backdrop-blur-xs border border-white/20 transition-all">
              <i data-lucide="external-link" class="w-3.5 h-3.5 text-amber-400"></i> ดูภาพเต็ม / บันทึกภาพ
            </a>
          </div>
        </div>

        <!-- Title & Metadata -->
        <div class="space-y-2 pt-1">
          ${item.code ? `<span class="text-xs font-bold text-blue-600 font-prompt block">${item.code}</span>` : ""}
          <h3 class="text-lg md:text-xl font-bold text-slate-900 font-prompt leading-snug">${item.title}</h3>
          
          <div class="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-prompt">
            ${item.date ? `<span class="flex items-center gap-1"><i data-lucide="calendar" class="w-3.5 h-3.5 text-amber-500"></i> ${item.date}</span>` : ""}
            ${item.organization ? `<span class="flex items-center gap-1"><i data-lucide="building" class="w-3.5 h-3.5 text-blue-500"></i> ${item.organization}</span>` : ""}
            ${item.location ? `<span class="flex items-center gap-1"><i data-lucide="map-pin" class="w-3.5 h-3.5 text-rose-500"></i> ${item.location}</span>` : ""}
          </div>
        </div>

        <!-- Description Box / Story -->
        ${(item.description || item.subCategory) ? `
          <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
            <span class="text-xs font-bold font-prompt text-slate-700 flex items-center gap-1.5">
              <i data-lucide="file-text" class="w-4 h-4 text-indigo-600"></i> คำบรรยายและรายละเอียดผลงาน:
            </span>
            <p class="text-xs md:text-sm text-slate-600 font-sarabun whitespace-pre-line leading-relaxed pl-1">
              ${item.description || item.subCategory}
            </p>
          </div>
        ` : `
          <div class="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-400 text-center">
            ไม่มีคำบรรยายเพิ่มเติม
          </div>
        `}

        <!-- Additional Action Buttons -->
        <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
          <div class="flex items-center gap-2">
            ${hasPdf ? `
              <button type="button" onclick="Swal.close(); openDocumentPreview('${item.title}', '${item.pdfUrl}')" class="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-prompt text-xs font-bold flex items-center gap-1.5 shadow transition-all cursor-pointer">
                <i data-lucide="file" class="w-4 h-4"></i> เปิดไฟล์เอกสาร PDF
              </button>
            ` : ""}
            <a href="${imgSrc}" target="_blank" class="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-prompt text-xs font-semibold flex items-center gap-1.5 transition-all">
              <i data-lucide="zoom-in" class="w-4 h-4"></i> ขยายภาพ
            </a>
          </div>

          ${isAdmin ? `
            <button type="button" onclick="Swal.close(); openEditItemModal('${collectionName}', '${item.id}')" class="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-prompt text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer">
              <i data-lucide="edit-3" class="w-3.5 h-3.5 text-amber-700"></i> แก้ไขข้อมูลนี้
            </button>
          ` : ""}
        </div>
      </div>
    `,
    width: "680px",
    showConfirmButton: false,
    showCloseButton: true,
    didOpen: () => initIcons()
  });
}

// ==========================================
// Mobile More Menu Sheet (จอเล็ก/มือถือ)
// ==========================================
function openMobileMoreMenu() {
  const data = window.portfolioStorage.getData();
  const isAdmin = window.portfolioStorage.isAdmin();

  Swal.fire({
    title: null,
    html: `
      <div class="space-y-4 text-left font-prompt -m-1">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
              <i data-lucide="grid" class="w-4 h-4"></i>
            </div>
            <div>
              <h4 class="font-bold text-slate-800 text-sm">เมนูทั้งหมดในระบบ</h4>
              <p class="text-[10px] text-slate-400">เลือกเมนูที่ต้องการนำทาง</p>
            </div>
          </div>
          <button type="button" onclick="Swal.close()" class="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <div class="grid grid-cols-2 gap-2 text-xs">
          <button onclick="Swal.close(); navigateTo('dashboard')" class="p-3 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 flex items-center gap-2.5 transition-all text-left cursor-pointer">
            <i data-lucide="layout-dashboard" class="w-4 h-4 text-blue-600 shrink-0"></i>
            <span class="font-semibold">แดชบอร์ด</span>
          </button>

          <button onclick="Swal.close(); navigateTo('profile')" class="p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 flex items-center gap-2.5 transition-all text-left cursor-pointer">
            <i data-lucide="user" class="w-4 h-4 text-indigo-600 shrink-0"></i>
            <span class="font-semibold">ประวัติส่วนตัว</span>
          </button>

          <button onclick="Swal.close(); navigateTo('intensive-prep')" class="p-3 rounded-xl bg-slate-50 hover:bg-teal-50 text-slate-700 hover:text-teal-700 border border-slate-200 flex items-center gap-2.5 transition-all text-left cursor-pointer">
            <i data-lucide="graduation-cap" class="w-4 h-4 text-teal-600 shrink-0"></i>
            <span class="font-semibold">ครูผู้ช่วย (4 ครั้ง)</span>
          </button>

          <button onclick="Swal.close(); navigateTo('pa')" class="p-3 rounded-xl bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-amber-700 border border-slate-200 flex items-center gap-2.5 transition-all text-left cursor-pointer">
            <i data-lucide="file-check" class="w-4 h-4 text-amber-600 shrink-0"></i>
            <span class="font-semibold">การประเมิน วPA</span>
          </button>

          <button onclick="Swal.close(); navigateTo('lesson-plans')" class="p-3 rounded-xl bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200 flex items-center gap-2.5 transition-all text-left cursor-pointer">
            <i data-lucide="book-open" class="w-4 h-4 text-sky-600 shrink-0"></i>
            <span class="font-semibold">แผนการสอน</span>
          </button>

          <button onclick="Swal.close(); navigateTo('official-docs')" class="p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 flex items-center gap-2.5 transition-all text-left cursor-pointer">
            <i data-lucide="folder-kanban" class="w-4 h-4 text-indigo-600 shrink-0"></i>
            <span class="font-semibold">เอกสารราชการ</span>
          </button>

          <button onclick="Swal.close(); navigateTo('achievements')" class="p-3 rounded-xl bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-amber-700 border border-slate-200 flex items-center gap-2.5 transition-all text-left cursor-pointer">
            <i data-lucide="trophy" class="w-4 h-4 text-amber-500 shrink-0"></i>
            <span class="font-semibold">ผลงานและรางวัล</span>
          </button>

          <button onclick="Swal.close(); navigateTo('gallery')" class="p-3 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 flex items-center gap-2.5 transition-all text-left cursor-pointer">
            <i data-lucide="images" class="w-4 h-4 text-rose-600 shrink-0"></i>
            <span class="font-semibold">ภาพกิจกรรม</span>
          </button>

          <button onclick="Swal.close(); navigateTo('media-systems')" class="p-3 rounded-xl bg-slate-50 hover:bg-cyan-50 text-slate-700 hover:text-cyan-700 border border-slate-200 flex items-center gap-2.5 transition-all text-left cursor-pointer col-span-2">
            <i data-lucide="globe" class="w-4 h-4 text-cyan-600 shrink-0"></i>
            <span class="font-semibold">สื่อและระบบออนไลน์</span>
          </button>
        </div>

        <div class="pt-2 border-t border-slate-100 flex flex-col gap-2">
          <button onclick="Swal.close(); handleAdminToggleClick()" class="w-full py-2.5 px-4 rounded-xl ${isAdmin ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-amber-500 text-white font-bold'} text-xs flex items-center justify-center gap-2 transition-all cursor-pointer">
            <i data-lucide="${isAdmin ? 'log-out' : 'shield-check'}" class="w-4 h-4"></i>
            <span>${isAdmin ? 'ออกจากโหมดผู้ดูแลระบบ (Admin)' : 'เข้าสู่ระบบผู้ดูแลระบบ (Admin)'}</span>
          </button>
          
          <button onclick="Swal.close(); openCloudConfigModal()" class="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 text-emerald-950 border border-emerald-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs">
            <i data-lucide="cloud" class="w-3.5 h-3.5 text-emerald-600"></i>
            <span>☁️ ตั้งค่าเชื่อมต่อ Cloud Database (Real-Time)</span>
          </button>

          <button onclick="Swal.close(); openBackupRestoreModal()" class="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer">
            <i data-lucide="database" class="w-3.5 h-3.5 text-blue-600"></i>
            <span>สำรองและกู้คืนข้อมูล (Backup/Restore)</span>
          </button>
        </div>
      </div>
    `,
    showConfirmButton: false,
    width: "440px",
    didOpen: () => initIcons()
  });
}

// ==========================================
// Modal Handlers: PDF & Document Preview Modal (Smart Drive/Docs/PDF Embedder)
// ==========================================
function normalizePdfViewerUrl(url) {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (!trimmed || trimmed === "#") return "";

  // 1. Google Drive File Links (e.g. drive.google.com/file/d/FILE_ID/view...)
  const driveFileMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveFileMatch && driveFileMatch[1]) {
    return `https://drive.google.com/file/d/${driveFileMatch[1]}/preview`;
  }

  // 2. Google Drive Open/UC ID parameter (e.g. drive.google.com/open?id=FILE_ID or /uc?id=FILE_ID)
  const driveIdMatch = trimmed.match(/drive\.google\.com\/(?:open|uc)\?(?:.*&)?id=([a-zA-Z0-9_-]+)/);
  if (driveIdMatch && driveIdMatch[1]) {
    return `https://drive.google.com/file/d/${driveIdMatch[1]}/preview`;
  }

  // 3. Google Docs / Presentation / Sheets
  if (trimmed.includes("docs.google.com/document/d/")) {
    return trimmed.replace(/\/edit.*$/, "/preview").replace(/\/view.*$/, "/preview");
  }
  if (trimmed.includes("docs.google.com/presentation/d/")) {
    return trimmed.replace(/\/edit.*$/, "/preview").replace(/\/view.*$/, "/preview");
  }
  if (trimmed.includes("docs.google.com/spreadsheets/d/")) {
    return trimmed.replace(/\/edit.*$/, "/preview").replace(/\/view.*$/, "/preview");
  }

  // 4. Google Drive Folder
  const driveFolderMatch = trimmed.match(/drive\.google\.com\/drive\/folders\/([a-zA-Z0-9_-]+)/);
  if (driveFolderMatch && driveFolderMatch[1]) {
    return `https://drive.google.com/embeddedfolderview?id=${driveFolderMatch[1]}#list`;
  }

  // 5. Canva Embed
  if (trimmed.includes("canva.com/design/")) {
    return trimmed.includes("?") ? `${trimmed}&embed` : `${trimmed}?embed`;
  }

  // 6. Direct PDF on Web / Local / Blob / Data URL
  if (trimmed.toLowerCase().endsWith(".pdf") || trimmed.startsWith("blob:") || trimmed.startsWith("data:")) {
    return trimmed;
  }

  // 7. For other HTTP/HTTPS documents, fallback to Google Docs Viewer
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return `https://docs.google.com/viewer?url=${encodeURIComponent(trimmed)}&embedded=true`;
  }

  return trimmed;
}

function openDocumentPreview(title, docUrl) {
  const modal = document.getElementById("pdf-preview-modal");
  const modalTitle = document.getElementById("pdf-modal-title");
  const iframe = document.getElementById("pdf-modal-iframe");
  const openExternalBtn = document.getElementById("pdf-modal-external-btn");

  const cleanTitle = title || "เอกสารประกอบการประเมิน";
  if (modalTitle) modalTitle.textContent = cleanTitle;
  if (openExternalBtn) {
    openExternalBtn.href = docUrl || "#";
    openExternalBtn.style.display = (docUrl && docUrl !== "#" && !docUrl.includes("dummy.pdf")) ? "inline-flex" : "none";
  }

  const embedUrl = normalizePdfViewerUrl(docUrl);
  const isDummyOrEmpty = !docUrl || docUrl === "#" || docUrl.includes("dummy.pdf") || !embedUrl;

  if (isDummyOrEmpty) {
    if (iframe) {
      iframe.removeAttribute("src");
      iframe.srcdoc = `
        <!DOCTYPE html>
        <html lang="th">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@400;500;600;700&family=Sarabun:wght@400;500;600&display=swap" rel="stylesheet">
          <script src="https://cdn.tailwindcss.com"></script>
          <style>body { font-family: 'Prompt', 'Sarabun', sans-serif; }</style>
        </head>
        <body class="bg-slate-900 text-slate-100 min-h-screen flex items-center justify-center p-6 text-center">
          <div class="max-w-lg p-8 bg-slate-950/90 rounded-3xl border border-slate-800 shadow-2xl space-y-5">
            <div class="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto shadow-inner">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div class="space-y-2">
              <span class="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold font-prompt border border-amber-500/30">
                เอกสารตัวอย่างเริ่มต้น (Placeholder)
              </span>
              <h3 class="text-lg font-bold text-white pt-1">${cleanTitle}</h3>
              <p class="text-xs text-slate-300 leading-relaxed font-sarabun">
                รายการนี้ยังไม่ได้ระบุลิงก์เอกสารจริง หรือลิงก์ยังเป็นไฟล์จำลองของระบบ
              </p>
            </div>
            <div class="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 text-left text-xs font-sarabun space-y-2 text-slate-300">
              <p class="font-bold text-amber-300 flex items-center gap-1 font-prompt">
                📌 วิธีนำลิงก์ไฟล์ PDF มาใส่ในระบบ:
              </p>
              <ol class="list-decimal list-inside space-y-1 text-[11px] leading-relaxed text-slate-400">
                <li>อัปโหลดไฟล์ PDF ขึ้นใน <b>Google Drive</b></li>
                <li>คลิกขวาที่ไฟล์ ➔ เลือก <b>แชร์ (Share)</b></li>
                <li>เปลี่ยนสิทธิ์เป็น <b>"ทุกคนที่มีลิงก์ (Anyone with the link)"</b></li>
                <li>คัดลอกลิงก์มาวางในระบบผ่านปุ่ม <b>"แก้ไข"</b> ได้ทันที</li>
              </ol>
            </div>
          </div>
        </body>
        </html>
      `;
    }
  } else {
    if (iframe) {
      iframe.removeAttribute("srcdoc");
      iframe.src = embedUrl;
    }
  }

  if (modal) {
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }
  initIcons();
}

function closePdfModal() {
  const modal = document.getElementById("pdf-preview-modal");
  const iframe = document.getElementById("pdf-modal-iframe");
  if (iframe) {
    iframe.removeAttribute("srcdoc");
    iframe.src = "about:blank";
  }
  if (modal) {
    modal.classList.add("hidden");
    document.body.style.overflow = "auto";
  }
}

// ==========================================
// Gallery Lightbox Modal
// ==========================================
function openGalleryLightbox(albumId) {
  const data = window.portfolioStorage.getData();
  const album = data.gallery?.find(a => String(a.id) === String(albumId));
  if (!album) return;

  const images = album.images && album.images.length > 0 ? album.images : [album.coverImage];

  Swal.fire({
    title: album.title,
    html: `
      <div class="space-y-4">
        <div class="text-xs text-slate-500 font-sarabun">${album.date} | ${album.location || ""}</div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto p-1">
          ${images.map(img => `
            <div class="rounded-xl overflow-hidden shadow-sm border">
              <img src="${img}" class="w-full h-48 object-cover hover:scale-105 transition-transform duration-300">
            </div>
          `).join("")}
        </div>
        <p class="text-xs text-slate-600 font-sarabun text-left">${album.description || ""}</p>
      </div>
    `,
    width: "800px",
    showCloseButton: true,
    showConfirmButton: false
  });
}

// ==========================================
// Committee / Visitor Feedback Sheet Modal
// ==========================================
function openCommitteeNoteModal() {
  Swal.fire({
    title: "แบบบันทึกข้อคิดเห็นและข้อเสนอแนะ",
    html: `
      <div class="space-y-4 text-left font-sarabun text-sm">
        <p class="text-xs text-slate-500 font-prompt">ผู้ประเมินหรือผู้เข้าชมสามารถระบุข้อเสนอแนะและข้อคิดเห็นได้ที่นี่</p>
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">ชื่อ-สกุล ผู้ประเมิน / ผู้เข้าชม:</label>
          <input id="swal-comm-name" class="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500" placeholder="ระบุชื่อ-นามสกุล">
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">ตำแหน่ง / สังกัด / หน่วยงาน:</label>
          <input id="swal-comm-pos" class="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500" placeholder="ระบุตำแหน่งหรือหน่วยงาน">
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">ข้อเสนอแนะและจุดเด่นของผลงาน:</label>
          <textarea id="swal-comm-note" rows="4" class="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500" placeholder="พิมพ์ข้อคิดเห็นหรือข้อเสนอแนะ..."></textarea>
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: '<i class="fa fa-print mr-1"></i> พิมพ์บันทึกข้อคิดเห็น',
    cancelButtonText: 'ปิดหน้าต่าง',
    confirmButtonColor: "#2563eb",
    cancelButtonColor: "#64748b"
  }).then((result) => {
    if (result.isConfirmed) {
      window.print();
    }
  });
}

// ==========================================
// Admin CRUD Operations
// ==========================================
function toggleVisibility(collectionName, itemId) {
  const newStatus = window.portfolioStorage.toggleItemVisibility(collectionName, itemId);
  Swal.fire({
    toast: true,
    position: "top-end",
    icon: "info",
    title: newStatus ? "เปิดแสดงผลแล้ว" : "ซ่อนรายการนี้แล้ว",
    showConfirmButton: false,
    timer: 1500
  });
  renderCurrentView();
}

function confirmDeleteItem(collectionName, itemId) {
  Swal.fire({
    title: "ยืนยันการลบรายการ?",
    text: "เมื่อลบแล้วจะไม่สามารถกู้คืนได้ ยกเว้นจะนำเข้าไฟล์สำรอง",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#e11d48",
    cancelButtonColor: "#64748b",
    confirmButtonText: "ลบรายการ",
    cancelButtonText: "ยกเลิก"
  }).then((result) => {
    if (result.isConfirmed) {
      window.portfolioStorage.deleteItem(collectionName, itemId);
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "ลบรายการเรียบร้อย",
        showConfirmButton: false,
        timer: 1500
      });
      renderCurrentView();
    }
  });
}

// Add Item Modal
function openAddItemModal(collectionName) {
  const isAchievement = collectionName === "achievements";
  Swal.fire({
    title: isAchievement ? "🏆 เพิ่มผลงาน / รางวัล / เกียรติบัตรใหม่" : "เพิ่มรายการเอกสาร/ผลงานใหม่",
    html: `
      <div class="space-y-3 text-left font-sarabun text-xs max-h-[70vh] overflow-y-auto p-1">
        <div>
          <label class="block font-bold text-slate-700 mb-1">${isAchievement ? 'ชื่อผลงาน / รางวัล / เกียรติบัตร: *' : 'ชื่อเอกสาร / หัวข้อผลงาน: *'}</label>
          <input id="modal-item-title" class="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 font-prompt" placeholder="เช่น รางวัลชนะเลิศ ครูผู้สอนดีเด่น ระดับชาติ">
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block font-bold text-slate-700 mb-1">หมวดหมู่ / ระดับรางวัล / หน่วยงาน:</label>
            <input id="modal-item-category" class="w-full p-2.5 rounded-lg border border-slate-300 font-prompt" placeholder="เช่น ระดับชาติ หรือ สพฐ.">
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">ปีการศึกษา / ปี พ.ศ.:</label>
            <input id="modal-item-year" class="w-full p-2.5 rounded-lg border border-slate-300 font-prompt" value="2568">
          </div>
        </div>

        <!-- Image Upload from Device or URL -->
        <div class="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
          <label class="block font-bold text-slate-800 font-prompt flex items-center gap-1.5">
            <i data-lucide="image" class="w-4 h-4 text-amber-600"></i> รูปภาพผลงาน / รูปเกียรติบัตร (เลือกไฟล์หรือใส่ลิงก์):
          </label>
          <input type="file" id="modal-item-file" accept="image/*" class="w-full text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer">
          <input id="modal-item-cover" class="w-full p-2 text-[11px] rounded-lg border border-slate-300" placeholder="หรือใส่ลิงก์รูปภาพ URL https://..." value="https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80">
          <div class="flex items-center gap-3 pt-1">
            <span class="text-[11px] text-slate-400 font-prompt">พรีวิวรูปภาพ:</span>
            <img id="modal-item-preview" src="https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80" class="w-20 h-14 rounded-lg object-cover border border-slate-300 shadow-xs">
          </div>
        </div>

        <div>
          <label class="block font-bold text-slate-700 mb-1">คำบรรยายรายละเอียดผลงาน / ความเป็นมา (เขียนบรรยายได้เต็มที่):</label>
          <textarea id="modal-item-desc" rows="3" class="w-full p-2.5 rounded-lg border border-slate-300 font-sarabun" placeholder="ระบุรายละเอียดความสำเร็จ ประโยชน์ที่เกิดต่อผู้เรียน หรือหน่วยงานที่มอบรางวัล"></textarea>
        </div>

        <div>
          <label class="block font-bold text-slate-700 mb-1">ลิงก์ไฟล์เอกสาร PDF / Google Drive (ถ้ามี / ไม่บังคับ):</label>
          <input id="modal-item-pdf" class="w-full p-2.5 rounded-lg border border-slate-300 font-sarabun" placeholder="https://drive.google.com/... หรือ ลิงก์ PDF (เว้นว่างได้หากไม่มี)">
        </div>
      </div>
    `,
    width: "600px",
    showCancelButton: true,
    confirmButtonText: "บันทึกรายการ",
    cancelButtonText: "ยกเลิก",
    confirmButtonColor: "#2563eb",
    cancelButtonColor: "#64748b",
    didOpen: () => {
      initIcons();
      const fileInput = document.getElementById("modal-item-file");
      const coverInput = document.getElementById("modal-item-cover");
      const previewImg = document.getElementById("modal-item-preview");
      if (fileInput) {
        fileInput.addEventListener("change", async (e) => {
          const file = e.target.files[0];
          if (!file) return;
          const compressed = await window.compressImage(file, 1280, 0.82);
          coverInput.value = compressed;
          if (previewImg) previewImg.src = compressed;
        });
      }
      if (coverInput) {
        coverInput.addEventListener("input", (e) => {
          if (previewImg) previewImg.src = e.target.value;
        });
      }
    },
    preConfirm: () => {
      const title = document.getElementById("modal-item-title").value.trim();
      const category = document.getElementById("modal-item-category").value.trim();
      const academicYear = document.getElementById("modal-item-year").value.trim();
      const coverUrl = document.getElementById("modal-item-cover").value.trim();
      const pdfUrl = document.getElementById("modal-item-pdf").value.trim();
      const description = document.getElementById("modal-item-desc").value.trim();

      if (!title) {
        Swal.showValidationMessage("กรุณากรอกชื่อผลงานหรือเอกสาร");
        return false;
      }
      return { title, category, academicYear, coverUrl, pdfUrl, description, round: AppState.activeIpRound, type: AppState.activeAchTab };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      window.portfolioStorage.addItem(collectionName, result.value);
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "เพิ่มรายการเรียบร้อยแล้ว",
        showConfirmButton: false,
        timer: 1500
      });
      renderCurrentView();
    }
  });
}

// Edit Item Modal
function openEditItemModal(collectionName, itemId) {
  const data = window.portfolioStorage.getData();
  const item = data[collectionName]?.find(i => String(i.id) === String(itemId));
  if (!item) return;

  const currentCover = item.coverUrl || item.coverImage || '';

  Swal.fire({
    title: "แก้ไขข้อมูลรายการ",
    html: `
      <div class="space-y-3 text-left font-sarabun text-xs max-h-[70vh] overflow-y-auto p-1">
        <div>
          <label class="block font-bold text-slate-700 mb-1">ชื่อเอกสาร / หัวข้อผลงาน: *</label>
          <input id="edit-item-title" class="w-full p-2.5 rounded-lg border border-slate-300 font-prompt" value="${item.title || item.roundTitle || ''}">
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block font-bold text-slate-700 mb-1">หมวดหมู่ / ระดับชั้น / ระดับรางวัล:</label>
            <input id="edit-item-category" class="w-full p-2.5 rounded-lg border border-slate-300 font-prompt" value="${item.category || item.score || item.level || item.code || ''}">
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">ปีการศึกษา / ปีงบประมาณ:</label>
            <input id="edit-item-year" class="w-full p-2.5 rounded-lg border border-slate-300 font-prompt" value="${item.academicYear || item.fiscalYear || ''}">
          </div>
        </div>

        <!-- Image Upload from Device or URL -->
        <div class="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
          <label class="block font-bold text-slate-800 font-prompt flex items-center gap-1.5">
            <i data-lucide="image" class="w-4 h-4 text-amber-600"></i> รูปภาพผลงาน / รูปเกียรติบัตร (เลือกไฟล์หรือใส่ลิงก์):
          </label>
          <input type="file" id="edit-item-file" accept="image/*" class="w-full text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer">
          <input id="edit-item-cover" class="w-full p-2 text-[11px] rounded-lg border border-slate-300" value="${currentCover}">
          <div class="flex items-center gap-3 pt-1">
            <span class="text-[11px] text-slate-400 font-prompt">พรีวิวรูปภาพ:</span>
            <img id="edit-item-preview" src="${currentCover || 'https://images.unsplash.com/photo-1544717305-2782549b5136'}" class="w-20 h-14 rounded-lg object-cover border border-slate-300 shadow-xs">
          </div>
        </div>

        <div>
          <label class="block font-bold text-slate-700 mb-1">คำบรรยายและรายละเอียดผลงาน (เขียนบรรยายได้เต็มที่):</label>
          <textarea id="edit-item-desc" rows="3" class="w-full p-2.5 rounded-lg border border-slate-300 font-sarabun">${item.description || item.challengeTitle || ''}</textarea>
        </div>

        <div>
          <label class="block font-bold text-slate-700 mb-1">ลิงก์ไฟล์เอกสาร PDF / Google Drive (ถ้ามี / ไม่บังคับ):</label>
          <input id="edit-item-pdf" class="w-full p-2.5 rounded-lg border border-slate-300 font-sarabun" value="${item.pdfUrl || item.certificateUrl || item.pa1DocUrl || ''}">
        </div>
      </div>
    `,
    width: "600px",
    showCancelButton: true,
    confirmButtonText: "บันทึกการแก้ไข",
    cancelButtonText: "ยกเลิก",
    confirmButtonColor: "#2563eb",
    cancelButtonColor: "#64748b",
    didOpen: () => {
      initIcons();
      const fileInput = document.getElementById("edit-item-file");
      const coverInput = document.getElementById("edit-item-cover");
      const previewImg = document.getElementById("edit-item-preview");
      if (fileInput) {
        fileInput.addEventListener("change", async (e) => {
          const file = e.target.files[0];
          if (!file) return;
          const compressed = await window.compressImage(file, 1280, 0.82);
          coverInput.value = compressed;
          if (previewImg) previewImg.src = compressed;
        });
      }
      if (coverInput) {
        coverInput.addEventListener("input", (e) => {
          if (previewImg) previewImg.src = e.target.value;
        });
      }
    },
    preConfirm: () => {
      const title = document.getElementById("edit-item-title").value.trim();
      const category = document.getElementById("edit-item-category").value.trim();
      const academicYear = document.getElementById("edit-item-year").value.trim();
      const coverUrl = document.getElementById("edit-item-cover").value.trim();
      const pdfUrl = document.getElementById("edit-item-pdf").value.trim();
      const description = document.getElementById("edit-item-desc").value.trim();

      return { title, category, academicYear, coverUrl, pdfUrl, description };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      window.portfolioStorage.updateItem(collectionName, itemId, result.value);
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "อัปเดตข้อมูลเรียบร้อยแล้ว",
        showConfirmButton: false,
        timer: 1500
      });
      renderCurrentView();
    }
  });
}

// Edit Profile Modal
function openProfileEditModal(overrideData = null) {
  const data = window.portfolioStorage.getData();
  const p = overrideData || data.profile || {};

  Swal.fire({
    title: "แก้ไขข้อมูลประวัติส่วนตัวและโรงเรียน",
    html: `
      <div class="space-y-3 text-left font-sarabun text-xs max-h-[70vh] overflow-y-auto p-1">
        <div>
          <label class="block font-bold text-slate-700 mb-1">ชื่อ-นามสกุล ครูผู้สอน: *</label>
          <input id="prof-name" class="w-full p-2.5 rounded-lg border border-slate-300" value="${p.fullName || ''}">
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block font-bold text-slate-700 mb-1">ตำแหน่ง:</label>
            <input id="prof-pos" class="w-full p-2.5 rounded-lg border border-slate-300" value="${p.position || ''}">
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">วิทยฐานะ:</label>
            <input id="prof-acad" class="w-full p-2.5 rounded-lg border border-slate-300" value="${p.academicStanding || ''}">
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block font-bold text-slate-700 mb-1">กลุ่มสาระการเรียนรู้:</label>
            <input id="prof-subject-group" class="w-full p-2.5 rounded-lg border border-slate-300" value="${p.subjectGroup || ''}">
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">เลขที่ตำแหน่ง:</label>
            <input id="prof-pos-num" class="w-full p-2.5 rounded-lg border border-slate-300" value="${p.positionNumber || ''}">
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block font-bold text-slate-700 mb-1">วันบรรจุรับราชการ:</label>
            <input id="prof-app-date" class="w-full p-2.5 rounded-lg border border-slate-300" value="${p.appointmentDate || ''}">
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">อายุราชการ:</label>
            <input id="prof-years-service" class="w-full p-2.5 rounded-lg border border-slate-300" value="${p.yearsOfService || ''}">
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block font-bold text-slate-700 mb-1">โรงเรียน:</label>
            <input id="prof-school" class="w-full p-2.5 rounded-lg border border-slate-300" value="${p.school || ''}">
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">สังกัด (สพป./สพม.):</label>
            <input id="prof-affil" class="w-full p-2.5 rounded-lg border border-slate-300" value="${p.affiliation || ''}">
          </div>
        </div>

        <!-- Avatar Upload with LINE Cropper -->
        <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <label class="block font-bold text-slate-700">รูปภาพโปรไฟล์ (เลือกไฟล์จากเครื่อง หรือใส่ URL):</label>
          <input type="file" id="prof-avatar-file" accept="image/*" class="text-xs file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer">
          <div class="flex gap-2 items-center">
            <input id="prof-avatar" class="w-full p-2 text-[11px] rounded-lg border border-slate-300" value="${p.avatarUrl || ''}">
            <button type="button" id="prof-crop-btn" class="px-2.5 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold shrink-0 border border-amber-300 cursor-pointer">
              ครอปภาพ
            </button>
          </div>
          <div class="flex items-center gap-3 pt-1">
            <span class="text-[11px] text-slate-400">พรีวิว:</span>
            <img id="prof-avatar-preview" src="${p.avatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2'}" class="w-12 h-12 rounded-full object-cover border-2 border-amber-400 shadow">
          </div>
        </div>

        <div>
          <label class="block font-bold text-slate-700 mb-1">คติประจำใจในการจัดการเรียนรู้:</label>
          <input id="prof-motto" class="w-full p-2.5 rounded-lg border border-slate-300" value="${p.motto || ''}">
        </div>
        <div>
          <label class="block font-bold text-slate-700 mb-1">วิสัยทัศน์และการจัดการเรียนรู้:</label>
          <textarea id="prof-bio" rows="3" class="w-full p-2.5 rounded-lg border border-slate-300">${p.bio || ''}</textarea>
        </div>
        <div class="grid grid-cols-3 gap-2">
          <div>
            <label class="block font-bold text-slate-700 mb-1">เบอร์โทรศัพท์:</label>
            <input id="prof-phone" class="w-full p-2.5 rounded-lg border border-slate-300" value="${p.phone || ''}">
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">อีเมล:</label>
            <input id="prof-email" class="w-full p-2.5 rounded-lg border border-slate-300" value="${p.email || ''}">
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">Line ID:</label>
            <input id="prof-line" class="w-full p-2.5 rounded-lg border border-slate-300" value="${p.lineId || ''}">
          </div>
        </div>
      </div>
    `,
    width: "700px",
    showCancelButton: true,
    confirmButtonText: "บันทึกข้อมูล",
    cancelButtonText: "ยกเลิก",
    confirmButtonColor: "#2563eb",
    cancelButtonColor: "#64748b",
    didOpen: () => {
      const fileInput = document.getElementById("prof-avatar-file");
      const urlInput = document.getElementById("prof-avatar");
      const previewImg = document.getElementById("prof-avatar-preview");
      const cropBtn = document.getElementById("prof-crop-btn");

      const getFormData = () => ({
        fullName: document.getElementById("prof-name")?.value || "",
        position: document.getElementById("prof-pos")?.value || "",
        academicStanding: document.getElementById("prof-acad")?.value || "",
        subjectGroup: document.getElementById("prof-subject-group")?.value || "",
        positionNumber: document.getElementById("prof-pos-num")?.value || "",
        appointmentDate: document.getElementById("prof-app-date")?.value || "",
        yearsOfService: document.getElementById("prof-years-service")?.value || "",
        school: document.getElementById("prof-school")?.value || "",
        affiliation: document.getElementById("prof-affil")?.value || "",
        motto: document.getElementById("prof-motto")?.value || "",
        bio: document.getElementById("prof-bio")?.value || "",
        phone: document.getElementById("prof-phone")?.value || "",
        email: document.getElementById("prof-email")?.value || "",
        lineId: document.getElementById("prof-line")?.value || ""
      });

      if (fileInput) {
        fileInput.addEventListener("change", async (e) => {
          const file = e.target.files[0];
          if (!file) return;
          const currentFormValues = getFormData();
          const compressed = await window.compressImage(file, 1280, 0.85);
          openAvatarCropperModal(compressed, (croppedDataUrl) => {
            openProfileEditModal({ ...currentFormValues, avatarUrl: croppedDataUrl });
          }, false);
        });
      }

      if (cropBtn) {
        cropBtn.addEventListener("click", () => {
          const currentSrc = urlInput?.value || p.avatarUrl;
          if (!currentSrc) return;
          const currentFormValues = getFormData();
          openAvatarCropperModal(currentSrc, (croppedDataUrl) => {
            openProfileEditModal({ ...currentFormValues, avatarUrl: croppedDataUrl });
          }, false);
        });
      }

      if (urlInput) {
        urlInput.addEventListener("input", (e) => {
          if (previewImg) previewImg.src = e.target.value;
        });
      }
    },
    preConfirm: () => {
      return {
        fullName: document.getElementById("prof-name").value.trim(),
        position: document.getElementById("prof-pos").value.trim(),
        academicStanding: document.getElementById("prof-acad").value.trim(),
        subjectGroup: document.getElementById("prof-subject-group").value.trim(),
        positionNumber: document.getElementById("prof-pos-num").value.trim(),
        appointmentDate: document.getElementById("prof-app-date").value.trim(),
        yearsOfService: document.getElementById("prof-years-service").value.trim(),
        school: document.getElementById("prof-school").value.trim(),
        affiliation: document.getElementById("prof-affil").value.trim(),
        avatarUrl: document.getElementById("prof-avatar").value.trim(),
        motto: document.getElementById("prof-motto").value.trim(),
        bio: document.getElementById("prof-bio").value.trim(),
        phone: document.getElementById("prof-phone").value.trim(),
        email: document.getElementById("prof-email").value.trim(),
        lineId: document.getElementById("prof-line").value.trim()
      };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      window.portfolioStorage.updateProfile(result.value);
      Swal.fire({
        icon: "success",
        title: "บันทึกประวัติส่วนตัวสำเร็จ",
        timer: 1500,
        showConfirmButton: false
      });
      updateGlobalStats();
      renderCurrentView();
    }
  });
}

// 1. Education CRUD Modals
function openAddEducationModal() {
  Swal.fire({
    title: "เพิ่มประวัติการศึกษา",
    html: `
      <div class="space-y-3 text-left font-sarabun text-xs">
        <div>
          <label class="block font-bold text-slate-700 mb-1">ระดับการศึกษา / วุฒิ: *</label>
          <input id="edu-degree" class="w-full p-2.5 rounded-lg border border-slate-300" placeholder="เช่น ปริญญาตรี ครุศาสตรบัณฑิต (ค.บ.)">
        </div>
        <div>
          <label class="block font-bold text-slate-700 mb-1">สาขาวิชา / วิชาเอก: *</label>
          <input id="edu-major" class="w-full p-2.5 rounded-lg border border-slate-300" placeholder="เช่น สาขาวิชาสังคมศึกษา">
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block font-bold text-slate-700 mb-1">สถาบันการศึกษา / มหาวิทยาลัย: *</label>
            <input id="edu-inst" class="w-full p-2.5 rounded-lg border border-slate-300" placeholder="เช่น มหาวิทยาลัยราชภัฏ...">
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">ปี พ.ศ. ที่สำเร็จการศึกษา:</label>
            <input id="edu-year" class="w-full p-2.5 rounded-lg border border-slate-300" placeholder="เช่น 2565">
          </div>
        </div>
        <div>
          <label class="block font-bold text-slate-700 mb-1">ผลการเรียนเฉลี่ย / เกียรตินิยม:</label>
          <input id="edu-gpa" class="w-full p-2.5 rounded-lg border border-slate-300" placeholder="เช่น 3.85 (เกียรตินิยมอันดับหนึ่ง)">
        </div>
      </div>
    `,
    width: "550px",
    showCancelButton: true,
    confirmButtonText: "บันทึก",
    cancelButtonText: "ยกเลิก",
    confirmButtonColor: "#4f46e5",
    cancelButtonColor: "#64748b",
    preConfirm: () => {
      const degree = document.getElementById("edu-degree").value.trim();
      const major = document.getElementById("edu-major").value.trim();
      const institution = document.getElementById("edu-inst").value.trim();
      const year = document.getElementById("edu-year").value.trim();
      const gpa = document.getElementById("edu-gpa").value.trim();

      if (!degree || !major || !institution) {
        Swal.showValidationMessage("กรุณากรอกข้อมูลระดับการศึกษา สาขาวิชา และสถาบัน");
        return false;
      }
      return { degree, major, institution, year, gpa };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      const data = window.portfolioStorage.getData();
      if (!data.profile.education) data.profile.education = [];
      data.profile.education.push(result.value);
      window.portfolioStorage.saveData(data);
      renderCurrentView();
    }
  });
}

function openEditEducationModal(idx) {
  const data = window.portfolioStorage.getData();
  const item = data.profile?.education?.[idx];
  if (!item) return;

  Swal.fire({
    title: "แก้ไขประวัติการศึกษา",
    html: `
      <div class="space-y-3 text-left font-sarabun text-xs">
        <div>
          <label class="block font-bold text-slate-700 mb-1">ระดับการศึกษา / วุฒิ: *</label>
          <input id="edu-degree" class="w-full p-2.5 rounded-lg border border-slate-300" value="${item.degree || ''}">
        </div>
        <div>
          <label class="block font-bold text-slate-700 mb-1">สาขาวิชา / วิชาเอก: *</label>
          <input id="edu-major" class="w-full p-2.5 rounded-lg border border-slate-300" value="${item.major || ''}">
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block font-bold text-slate-700 mb-1">สถาบันการศึกษา / มหาวิทยาลัย: *</label>
            <input id="edu-inst" class="w-full p-2.5 rounded-lg border border-slate-300" value="${item.institution || ''}">
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">ปี พ.ศ. ที่สำเร็จการศึกษา:</label>
            <input id="edu-year" class="w-full p-2.5 rounded-lg border border-slate-300" value="${item.year || ''}">
          </div>
        </div>
        <div>
          <label class="block font-bold text-slate-700 mb-1">ผลการเรียนเฉลี่ย / เกียรตินิยม:</label>
          <input id="edu-gpa" class="w-full p-2.5 rounded-lg border border-slate-300" value="${item.gpa || ''}">
        </div>
      </div>
    `,
    width: "550px",
    showCancelButton: true,
    confirmButtonText: "บันทึกการแก้ไข",
    cancelButtonText: "ยกเลิก",
    confirmButtonColor: "#4f46e5",
    cancelButtonColor: "#64748b",
    preConfirm: () => {
      const degree = document.getElementById("edu-degree").value.trim();
      const major = document.getElementById("edu-major").value.trim();
      const institution = document.getElementById("edu-inst").value.trim();
      const year = document.getElementById("edu-year").value.trim();
      const gpa = document.getElementById("edu-gpa").value.trim();

      if (!degree || !major || !institution) {
        Swal.showValidationMessage("กรุณากรอกข้อมูลระดับการศึกษา สาขาวิชา และสถาบัน");
        return false;
      }
      return { degree, major, institution, year, gpa };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      data.profile.education[idx] = result.value;
      window.portfolioStorage.saveData(data);
      renderCurrentView();
    }
  });
}

function confirmDeleteEducation(idx) {
  Swal.fire({
    title: "ยืนยันการลบประวัติการศึกษานี้?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "ลบ",
    cancelButtonText: "ยกเลิก",
    confirmButtonColor: "#e11d48",
    cancelButtonColor: "#64748b"
  }).then((result) => {
    if (result.isConfirmed) {
      const data = window.portfolioStorage.getData();
      data.profile.education.splice(idx, 1);
      window.portfolioStorage.saveData(data);
      renderCurrentView();
    }
  });
}

// 2. Work Experience CRUD Modals
function openAddWorkExpModal() {
  Swal.fire({
    title: "เพิ่มประวัติการรับราชการ",
    html: `
      <div class="space-y-3 text-left font-sarabun text-xs">
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block font-bold text-slate-700 mb-1">ตำแหน่ง / วิทยฐานะ: *</label>
            <input id="work-pos" class="w-full p-2.5 rounded-lg border border-slate-300" placeholder="เช่น ครู อันดับ คศ.1">
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">ช่วงระยะเวลา / ปี พ.ศ.: *</label>
            <input id="work-period" class="w-full p-2.5 rounded-lg border border-slate-300" placeholder="เช่น 2566 - ปัจจุบัน">
          </div>
        </div>
        <div>
          <label class="block font-bold text-slate-700 mb-1">สถานที่ปฏิบัติงาน / โรงเรียน: *</label>
          <input id="work-place" class="w-full p-2.5 rounded-lg border border-slate-300" placeholder="เช่น โรงเรียนวัดบางปูน สพป.สิงห์บุรี">
        </div>
        <div>
          <label class="block font-bold text-slate-700 mb-1">รายละเอียดหน้าที่และผลงานเด่น:</label>
          <textarea id="work-desc" rows="3" class="w-full p-2.5 rounded-lg border border-slate-300" placeholder="ระบุภาระหน้าที่สำคัญ"></textarea>
        </div>
      </div>
    `,
    width: "550px",
    showCancelButton: true,
    confirmButtonText: "บันทึก",
    cancelButtonText: "ยกเลิก",
    confirmButtonColor: "#2563eb",
    cancelButtonColor: "#64748b",
    preConfirm: () => {
      const position = document.getElementById("work-pos").value.trim();
      const period = document.getElementById("work-period").value.trim();
      const workplace = document.getElementById("work-place").value.trim();
      const description = document.getElementById("work-desc").value.trim();

      if (!position || !period || !workplace) {
        Swal.showValidationMessage("กรุณากรอกตำแหน่ง ช่วงเวลา และสถานที่ปฏิบัติงาน");
        return false;
      }
      return { position, period, workplace, description };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      const data = window.portfolioStorage.getData();
      if (!data.profile.workExperience) data.profile.workExperience = [];
      data.profile.workExperience.push(result.value);
      window.portfolioStorage.saveData(data);
      renderCurrentView();
    }
  });
}

function openEditWorkExpModal(idx) {
  const data = window.portfolioStorage.getData();
  const item = data.profile?.workExperience?.[idx];
  if (!item) return;

  Swal.fire({
    title: "แก้ไขประวัติการรับราชการ",
    html: `
      <div class="space-y-3 text-left font-sarabun text-xs">
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block font-bold text-slate-700 mb-1">ตำแหน่ง / วิทยฐานะ: *</label>
            <input id="work-pos" class="w-full p-2.5 rounded-lg border border-slate-300" value="${item.position || ''}">
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">ช่วงระยะเวลา / ปี พ.ศ.: *</label>
            <input id="work-period" class="w-full p-2.5 rounded-lg border border-slate-300" value="${item.period || ''}">
          </div>
        </div>
        <div>
          <label class="block font-bold text-slate-700 mb-1">สถานที่ปฏิบัติงาน / โรงเรียน: *</label>
          <input id="work-place" class="w-full p-2.5 rounded-lg border border-slate-300" value="${item.workplace || ''}">
        </div>
        <div>
          <label class="block font-bold text-slate-700 mb-1">รายละเอียดหน้าที่และผลงานเด่น:</label>
          <textarea id="work-desc" rows="3" class="w-full p-2.5 rounded-lg border border-slate-300">${item.description || ''}</textarea>
        </div>
      </div>
    `,
    width: "550px",
    showCancelButton: true,
    confirmButtonText: "บันทึกการแก้ไข",
    cancelButtonText: "ยกเลิก",
    confirmButtonColor: "#2563eb",
    cancelButtonColor: "#64748b",
    preConfirm: () => {
      const position = document.getElementById("work-pos").value.trim();
      const period = document.getElementById("work-period").value.trim();
      const workplace = document.getElementById("work-place").value.trim();
      const description = document.getElementById("work-desc").value.trim();

      if (!position || !period || !workplace) {
        Swal.showValidationMessage("กรุณากรอกตำแหน่ง ช่วงเวลา และสถานที่ปฏิบัติงาน");
        return false;
      }
      return { position, period, workplace, description };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      data.profile.workExperience[idx] = result.value;
      window.portfolioStorage.saveData(data);
      renderCurrentView();
    }
  });
}

function confirmDeleteWorkExp(idx) {
  Swal.fire({
    title: "ยืนยันการลบประวัติการรับราชการนี้?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "ลบ",
    cancelButtonText: "ยกเลิก",
    confirmButtonColor: "#e11d48",
    cancelButtonColor: "#64748b"
  }).then((result) => {
    if (result.isConfirmed) {
      const data = window.portfolioStorage.getData();
      data.profile.workExperience.splice(idx, 1);
      window.portfolioStorage.saveData(data);
      renderCurrentView();
    }
  });
}

// 3. Teaching Duties CRUD Modals (รองรับการเพิ่มทีละหลายวิชาพร้อมกัน)
function openAddTeachingDutyModal() {
  const initialRows = [
    { code: "", name: "", grade: "", hours: 2, students: 30 },
    { code: "", name: "", grade: "", hours: 1, students: 30 },
    { code: "", name: "", grade: "", hours: 2, students: 30 }
  ];

  Swal.fire({
    title: `<span class="text-base font-bold font-prompt text-slate-800 flex items-center justify-center gap-2">
      <i data-lucide="book-plus" class="w-5 h-5 text-emerald-600"></i> เพิ่มรายวิชาสอนตามตารางสอน (เพิ่มหลายวิชาพร้อมกัน)
    </span>`,
    html: `
      <div class="space-y-3.5 text-left font-sarabun text-xs">
        
        <!-- Quick Paste Accordion / Toggle -->
        <div class="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 space-y-2">
          <div class="flex items-center justify-between">
            <span class="font-bold text-emerald-900 flex items-center gap-1.5 font-prompt text-xs">
              <i data-lucide="clipboard-paste" class="w-4 h-4 text-emerald-600"></i> วางข้อความนำเข้าหลายวิชาแบบด่วน (Quick Paste):
            </span>
          </div>
          <p class="text-[11px] text-emerald-800/90 leading-relaxed font-sarabun">
            สามารถ Copy จาก Excel หรือพิมพ์วางข้อความ (1 บรรทัดต่อ 1 วิชา) แล้วกดปุ่ม <b>"แปลงเป็นแถวตาราง"</b> ระบบจะกรอกลงตารางให้อัตโนมัติครับ
          </p>
          <div class="space-y-1.5">
            <textarea id="bulk-subject-text" rows="2" class="w-full p-2.5 rounded-lg border border-emerald-300 font-mono text-[11px] bg-white focus:ring-2 focus:ring-emerald-500" placeholder="ตัวอย่าง:
ส15101 สังคมศึกษาฯ ชั้น ป.5 2 30
ส15102 ประวัติศาสตร์ ชั้น ป.5 1 30
ส16101 สังคมศึกษาฯ ชั้น ป.6 2 32"></textarea>
            <button type="button" id="btn-parse-bulk-subjects" class="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-prompt text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer">
              <i data-lucide="sparkles" class="w-3.5 h-3.5"></i> แปลงข้อความเป็นแถวตาราง
            </button>
          </div>
        </div>

        <!-- Dynamic Multi-Row Table -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label class="font-bold text-slate-800 font-prompt text-xs flex items-center gap-1.5">
              <i data-lucide="list-plus" class="w-4 h-4 text-blue-600"></i> ตารางกรอกรายวิชาที่ต้องการเพิ่ม:
            </label>
            <button type="button" id="btn-add-subject-row" class="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold font-prompt flex items-center gap-1 transition-all cursor-pointer">
              <i data-lucide="plus" class="w-3.5 h-3.5"></i> เพิ่มแถววิชา (+1)
            </button>
          </div>

          <div class="border border-slate-200 rounded-xl overflow-hidden shadow-2xs max-h-[38vh] overflow-y-auto bg-slate-50/50">
            <table class="w-full text-left font-sarabun text-xs">
              <thead class="bg-slate-100 text-slate-700 font-prompt sticky top-0 z-10 border-b border-slate-200 text-[11px]">
                <tr>
                  <th class="p-2 w-8 text-center">#</th>
                  <th class="p-2 w-28">รหัสวิชา *</th>
                  <th class="p-2">ชื่อรายวิชา *</th>
                  <th class="p-2 w-32">ระดับชั้น *</th>
                  <th class="p-2 w-20 text-center">คาบ/สัปดาห์</th>
                  <th class="p-2 w-20 text-center">นร. (คน)</th>
                  <th class="p-2 w-10 text-center">ลบ</th>
                </tr>
              </thead>
              <tbody id="multi-subject-tbody" class="divide-y divide-slate-200 bg-white">
                <!-- Rows injected dynamically -->
              </tbody>
            </table>
          </div>
        </div>

        <!-- Real-time Summary Badge -->
        <div id="multi-subject-summary" class="p-2.5 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-prompt text-slate-700">
          <span class="font-semibold text-emerald-800">📊 รวมทั้งหมด: <b id="sum-count">0</b> รายวิชา</span>
          <span class="font-semibold text-blue-800">⏱️ รวม: <b id="sum-hours">0</b> คาบ/สัปดาห์</span>
        </div>
      </div>
    `,
    width: "780px",
    showCancelButton: true,
    confirmButtonText: "💾 บันทึกรายวิชาทั้งหมด",
    cancelButtonText: "ยกเลิก",
    confirmButtonColor: "#059669",
    cancelButtonColor: "#64748b",
    didOpen: () => {
      initIcons();

      const tbody = document.getElementById("multi-subject-tbody");
      let rowCount = 0;

      function renderRow(code = "", name = "", grade = "", hours = 2, students = 30) {
        rowCount++;
        const tr = document.createElement("tr");
        tr.className = "hover:bg-slate-50/80 transition-colors group";
        tr.innerHTML = `
          <td class="p-2 text-center text-slate-400 font-bold row-index text-[11px]">${rowCount}</td>
          <td class="p-1.5">
            <input class="row-code w-full p-1.5 rounded-lg border border-slate-300 font-semibold text-blue-700 text-xs focus:ring-2 focus:ring-emerald-500" value="${escapeHtml(code)}" placeholder="เช่น ส15101">
          </td>
          <td class="p-1.5">
            <input class="row-name w-full p-1.5 rounded-lg border border-slate-300 text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500" value="${escapeHtml(name)}" placeholder="เช่น สังคมศึกษา ศาสนาฯ">
          </td>
          <td class="p-1.5">
            <input class="row-grade w-full p-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs focus:ring-2 focus:ring-emerald-500" value="${escapeHtml(grade)}" placeholder="เช่น ชั้น ป.5">
          </td>
          <td class="p-1.5 text-center">
            <input type="number" min="1" max="40" class="row-hours w-full p-1.5 rounded-lg border border-slate-300 text-center font-bold text-slate-800 text-xs" value="${hours}">
          </td>
          <td class="p-1.5 text-center">
            <input type="number" min="0" max="500" class="row-students w-full p-1.5 rounded-lg border border-slate-300 text-center text-slate-700 text-xs" value="${students}">
          </td>
          <td class="p-1.5 text-center">
            <button type="button" class="btn-remove-row p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer" title="ลบแถวนี้">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </td>
        `;

        tr.querySelector(".btn-remove-row")?.addEventListener("click", () => {
          tr.remove();
          updateRowIndices();
          updateSummary();
        });

        tr.querySelectorAll("input").forEach(input => {
          input.addEventListener("input", updateSummary);
        });

        tbody.appendChild(tr);
        initIcons();
        updateSummary();
      }

      function updateRowIndices() {
        const rows = tbody.querySelectorAll("tr");
        rows.forEach((row, i) => {
          const idxEl = row.querySelector(".row-index");
          if (idxEl) idxEl.textContent = i + 1;
        });
        rowCount = rows.length;
      }

      function updateSummary() {
        const rows = tbody.querySelectorAll("tr");
        let validSubjects = 0;
        let totalHours = 0;

        rows.forEach(row => {
          const code = row.querySelector(".row-code")?.value.trim();
          const name = row.querySelector(".row-name")?.value.trim();
          const hours = parseInt(row.querySelector(".row-hours")?.value) || 0;

          if (code || name) {
            validSubjects++;
            totalHours += hours;
          }
        });

        const sumCountEl = document.getElementById("sum-count");
        const sumHoursEl = document.getElementById("sum-hours");
        if (sumCountEl) sumCountEl.textContent = validSubjects;
        if (sumHoursEl) sumHoursEl.textContent = totalHours;
      }

      // Populate initial 3 rows
      initialRows.forEach(r => renderRow(r.code, r.name, r.grade, r.hours, r.students));

      // Add Row button
      document.getElementById("btn-add-subject-row")?.addEventListener("click", () => {
        renderRow("", "", "", 2, 30);
      });

      // Quick Parse bulk text button
      document.getElementById("btn-parse-bulk-subjects")?.addEventListener("click", () => {
        const text = document.getElementById("bulk-subject-text")?.value.trim();
        if (!text) {
          Swal.showValidationMessage("กรุณากรอกข้อความก่อนกดแปลง");
          return;
        }

        const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
        if (lines.length === 0) return;

        // Clear existing empty rows if not filled
        const existingRows = tbody.querySelectorAll("tr");
        let hasFilledRow = false;
        existingRows.forEach(r => {
          if (r.querySelector(".row-code")?.value.trim() || r.querySelector(".row-name")?.value.trim()) {
            hasFilledRow = true;
          }
        });

        if (!hasFilledRow) {
          tbody.innerHTML = "";
          rowCount = 0;
        }

        lines.forEach(line => {
          let parts = line.includes("\t") ? line.split("\t") :
                      line.includes("|") ? line.split("|") :
                      line.includes(",") ? line.split(",") : [];

          if (parts.length >= 2) {
            const code = parts[0]?.trim() || "";
            const name = parts[1]?.trim() || "";
            const grade = parts[2]?.trim() || "ชั้นประถมศึกษา";
            const hours = parseInt(parts[3]?.trim()) || 2;
            const students = parseInt(parts[4]?.trim()) || 30;
            renderRow(code, name, grade, hours, students);
          } else {
            const tokens = line.split(/\s+/);
            if (tokens.length >= 2) {
              const code = tokens[0];
              const lastToken = tokens[tokens.length - 1];
              const secondLastToken = tokens[tokens.length - 2];
              let students = parseInt(lastToken) || 30;
              let hours = parseInt(secondLastToken) || 2;
              let nameTokens = tokens.slice(1);
              if (!isNaN(parseInt(lastToken))) nameTokens.pop();
              if (!isNaN(parseInt(secondLastToken))) nameTokens.pop();
              const name = nameTokens.join(" ");
              renderRow(code, name, "ชั้นประถมศึกษา", hours, students);
            } else {
              renderRow("", line, "ชั้นประถมศึกษา", 2, 30);
            }
          }
        });

        updateRowIndices();
        updateSummary();
      });
    },
    preConfirm: () => {
      const tbody = document.getElementById("multi-subject-tbody");
      const rows = tbody.querySelectorAll("tr");
      const validItems = [];

      rows.forEach(row => {
        const subjectCode = row.querySelector(".row-code")?.value.trim();
        const subjectName = row.querySelector(".row-name")?.value.trim();
        const grade = row.querySelector(".row-grade")?.value.trim() || "ชั้นประถมศึกษา";
        const hoursPerWeek = parseInt(row.querySelector(".row-hours")?.value) || 1;
        const studentsCount = parseInt(row.querySelector(".row-students")?.value) || 0;

        if (subjectCode && subjectName) {
          validItems.push({
            subjectCode,
            subjectName,
            grade,
            hoursPerWeek,
            studentsCount
          });
        }
      });

      if (validItems.length === 0) {
        Swal.showValidationMessage("กรุณากรอกรหัสวิชาและชื่อวิชาอย่างน้อย 1 รายการ");
        return false;
      }
      return validItems;
    }
  }).then((result) => {
    if (result.isConfirmed && result.value) {
      const data = window.portfolioStorage.getData();
      if (!data.profile.teachingDuties) data.profile.teachingDuties = [];
      data.profile.teachingDuties.push(...result.value);
      window.portfolioStorage.saveData(data);
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: `เพิ่ม ${result.value.length} รายวิชาสอนเรียบร้อยแล้ว`,
        showConfirmButton: false,
        timer: 1500
      });
      renderCurrentView();
    }
  });
}

function openEditTeachingDutyModal(idx) {
  const data = window.portfolioStorage.getData();
  const item = data.profile?.teachingDuties?.[idx];
  if (!item) return;

  Swal.fire({
    title: "แก้ไขรายวิชาสอนตามตารางสอน",
    html: `
      <div class="space-y-3 text-left font-sarabun text-xs">
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block font-bold text-slate-700 mb-1">รหัสวิชา: *</label>
            <input id="duty-code" class="w-full p-2.5 rounded-lg border border-slate-300" value="${item.subjectCode || ''}">
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">ระดับชั้น: *</label>
            <input id="duty-grade" class="w-full p-2.5 rounded-lg border border-slate-300" value="${item.grade || ''}">
          </div>
        </div>
        <div>
          <label class="block font-bold text-slate-700 mb-1">ชื่อรายวิชา: *</label>
          <input id="duty-name" class="w-full p-2.5 rounded-lg border border-slate-300" value="${item.subjectName || ''}">
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block font-bold text-slate-700 mb-1">จำนวนชั่วโมง/สัปดาห์ (คาบ): *</label>
            <input id="duty-hours" type="number" class="w-full p-2.5 rounded-lg border border-slate-300" value="${item.hoursPerWeek || 1}">
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">จำนวนนักเรียน (คน):</label>
            <input id="duty-students" type="number" class="w-full p-2.5 rounded-lg border border-slate-300" value="${item.studentsCount || 0}">
          </div>
        </div>
      </div>
    `,
    width: "550px",
    showCancelButton: true,
    confirmButtonText: "บันทึกการแก้ไข",
    cancelButtonText: "ยกเลิก",
    confirmButtonColor: "#059669",
    cancelButtonColor: "#64748b",
    preConfirm: () => {
      const subjectCode = document.getElementById("duty-code").value.trim();
      const subjectName = document.getElementById("duty-name").value.trim();
      const grade = document.getElementById("duty-grade").value.trim();
      const hoursPerWeek = parseInt(document.getElementById("duty-hours").value) || 1;
      const studentsCount = parseInt(document.getElementById("duty-students").value) || 0;

      if (!subjectCode || !subjectName || !grade) {
        Swal.showValidationMessage("กรุณากรอกรหัสวิชา ชื่อวิชา และระดับชั้น");
        return false;
      }
      return { subjectCode, subjectName, grade, hoursPerWeek, studentsCount };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      data.profile.teachingDuties[idx] = result.value;
      window.portfolioStorage.saveData(data);
      renderCurrentView();
    }
  });
}

function confirmDeleteTeachingDuty(idx) {
  Swal.fire({
    title: "ยืนยันการลบรายวิชานี้?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "ลบ",
    cancelButtonText: "ยกเลิก",
    confirmButtonColor: "#e11d48",
    cancelButtonColor: "#64748b"
  }).then((result) => {
    if (result.isConfirmed) {
      const data = window.portfolioStorage.getData();
      data.profile.teachingDuties.splice(idx, 1);
      window.portfolioStorage.saveData(data);
      renderCurrentView();
    }
  });
}

// 4. Special Duties CRUD Modals
function openAddSpecialDutyModal() {
  Swal.fire({
    title: "เพิ่มงานพิเศษ / หน้าที่ที่ได้รับมอบหมาย",
    html: `
      <div class="space-y-3 text-left font-sarabun text-xs">
        <div>
          <label class="block font-bold text-slate-700 mb-1 font-prompt">กลุ่มงานบริหาร: *</label>
          <select id="special-duty-group" class="w-full p-2.5 rounded-lg border border-slate-300 font-prompt text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500">
            <option value="กลุ่มบริหารงานวิชาการ">กลุ่มบริหารงานวิชาการ</option>
            <option value="กลุ่มบริหารงานงบประมาณ">กลุ่มบริหารงานงบประมาณ</option>
            <option value="กลุ่มบริหารงานบุคคล">กลุ่มบริหารงานบุคคล</option>
            <option value="กลุ่มบริหารงานทั่วไป">กลุ่มบริหารงานทั่วไป</option>
            <option value="กิจกรรมพัฒนาผู้เรียน">กิจกรรมพัฒนาผู้เรียน</option>
            <option value="กิจกรรมอื่น ๆ">กิจกรรมอื่น ๆ</option>
          </select>
        </div>
        <div>
          <label class="block font-bold text-slate-700 mb-1 font-prompt">ชื่องานพิเศษ / คำสั่งมอบหมาย: *</label>
          <textarea id="special-duty-text" rows="3" class="w-full p-2.5 rounded-lg border border-slate-300 font-prompt text-xs focus:ring-2 focus:ring-amber-500" placeholder="เช่น หัวหน้ากลุ่มสาระการเรียนรู้สังคมศึกษาฯ"></textarea>
        </div>
        <div>
          <label class="block font-bold text-slate-700 mb-1 font-prompt">หมายเหตุ / คำสั่งโรงเรียน (ถ้ามี):</label>
          <input id="special-duty-note" class="w-full p-2.5 rounded-lg border border-slate-300 font-prompt text-xs" placeholder="เช่น คำสั่งโรงเรียนวัดบางปูน ที่ 15/2568">
        </div>
      </div>
    `,
    width: "550px",
    showCancelButton: true,
    confirmButtonText: "เพิ่มงานพิเศษ",
    cancelButtonText: "ยกเลิก",
    confirmButtonColor: "#d97706",
    cancelButtonColor: "#64748b",
    preConfirm: () => {
      const group = document.getElementById("special-duty-group").value.trim();
      const title = document.getElementById("special-duty-text").value.trim();
      const note = document.getElementById("special-duty-note").value.trim();
      if (!title) {
        Swal.showValidationMessage("กรุณากรอกรายละเอียดงานพิเศษ");
        return false;
      }
      return { title, group, note };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      const data = window.portfolioStorage.getData();
      if (!data.profile.specialAssignments) data.profile.specialAssignments = [];
      data.profile.specialAssignments.push(result.value);
      window.portfolioStorage.saveData(data);
      renderCurrentView();
    }
  });
}

function openEditSpecialDutyModal(idx) {
  const data = window.portfolioStorage.getData();
  const rawItem = data.profile?.specialAssignments?.[idx];
  if (rawItem === undefined || rawItem === null) return;

  const currentTitle = typeof rawItem === "object" ? rawItem.title : rawItem;
  const currentGroup = typeof rawItem === "object" ? rawItem.group : "";
  const currentNote = typeof rawItem === "object" ? rawItem.note : "";

  Swal.fire({
    title: "แก้ไขงานพิเศษ / หน้าที่ที่ได้รับมอบหมาย",
    html: `
      <div class="space-y-3 text-left font-sarabun text-xs">
        <div>
          <label class="block font-bold text-slate-700 mb-1 font-prompt">กลุ่มงานบริหาร: *</label>
          <select id="special-duty-group" class="w-full p-2.5 rounded-lg border border-slate-300 font-prompt text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500">
            <option value="กลุ่มบริหารงานวิชาการ" ${currentGroup === "กลุ่มบริหารงานวิชาการ" ? "selected" : ""}>กลุ่มบริหารงานวิชาการ</option>
            <option value="กลุ่มบริหารงานงบประมาณ" ${currentGroup === "กลุ่มบริหารงานงบประมาณ" ? "selected" : ""}>กลุ่มบริหารงานงบประมาณ</option>
            <option value="กลุ่มบริหารงานบุคคล" ${currentGroup === "กลุ่มบริหารงานบุคคล" ? "selected" : ""}>กลุ่มบริหารงานบุคคล</option>
            <option value="กลุ่มบริหารงานทั่วไป" ${currentGroup === "กลุ่มบริหารงานทั่วไป" ? "selected" : ""}>กลุ่มบริหารงานทั่วไป</option>
            <option value="กิจกรรมพัฒนาผู้เรียน" ${currentGroup === "กิจกรรมพัฒนาผู้เรียน" ? "selected" : ""}>กิจกรรมพัฒนาผู้เรียน</option>
            <option value="กิจกรรมอื่น ๆ" ${currentGroup === "กิจกรรมอื่น ๆ" ? "selected" : ""}>กิจกรรมอื่น ๆ</option>
          </select>
        </div>
        <div>
          <label class="block font-bold text-slate-700 mb-1 font-prompt">ชื่องานพิเศษ / คำสั่งมอบหมาย: *</label>
          <textarea id="special-duty-text" rows="3" class="w-full p-2.5 rounded-lg border border-slate-300 font-prompt text-xs focus:ring-2 focus:ring-amber-500">${currentTitle}</textarea>
        </div>
        <div>
          <label class="block font-bold text-slate-700 mb-1 font-prompt">หมายเหตุ / คำสั่งโรงเรียน (ถ้ามี):</label>
          <input id="special-duty-note" class="w-full p-2.5 rounded-lg border border-slate-300 font-prompt text-xs" value="${currentNote}" placeholder="เช่น คำสั่งโรงเรียนวัดบางปูน ที่ 15/2568">
        </div>
      </div>
    `,
    width: "550px",
    showCancelButton: true,
    confirmButtonText: "บันทึกการแก้ไข",
    cancelButtonText: "ยกเลิก",
    confirmButtonColor: "#d97706",
    cancelButtonColor: "#64748b",
    preConfirm: () => {
      const group = document.getElementById("special-duty-group").value.trim();
      const title = document.getElementById("special-duty-text").value.trim();
      const note = document.getElementById("special-duty-note").value.trim();
      if (!title) {
        Swal.showValidationMessage("กรุณากรอกรายละเอียดงานพิเศษ");
        return false;
      }
      return { title, group, note };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      data.profile.specialAssignments[idx] = result.value;
      window.portfolioStorage.saveData(data);
      renderCurrentView();
    }
  });
}

function confirmDeleteSpecialDuty(idx) {
  Swal.fire({
    title: "ยืนยันการลบงานพิเศษนี้?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "ลบ",
    cancelButtonText: "ยกเลิก",
    confirmButtonColor: "#e11d48",
    cancelButtonColor: "#64748b"
  }).then((result) => {
    if (result.isConfirmed) {
      const data = window.portfolioStorage.getData();
      data.profile.specialAssignments.splice(idx, 1);
      window.portfolioStorage.saveData(data);
      renderCurrentView();
    }
  });
}

// ==========================================
// PA (Performance Agreement) Management Modals
// ==========================================
function openAddPaModal() {
  const currentYear = new Date().getFullYear() + 543;
  Swal.fire({
    title: "เพิ่มรอบการประเมิน วPA ใหม่",
    html: `
      <div class="space-y-3 text-left font-sarabun text-xs max-h-[70vh] overflow-y-auto p-1">
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block font-bold text-slate-700 mb-1">ปีงบประมาณ (พ.ศ.): *</label>
            <input id="pa-fiscal-year" class="w-full p-2.5 rounded-lg border border-slate-300 font-bold" placeholder="เช่น 2568" value="${currentYear}">
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">ตำแหน่งเป้าหมาย / วิทยฐานะ:</label>
            <input id="pa-target-pos" class="w-full p-2.5 rounded-lg border border-slate-300" placeholder="เช่น ครูชำนาญการ" value="ครูชำนาญการ">
          </div>
        </div>

        <div>
          <label class="block font-bold text-slate-700 mb-1">ชื่อรอบการประเมิน: *</label>
          <input id="pa-round-title" class="w-full p-2.5 rounded-lg border border-slate-300" placeholder="เช่น รอบการประเมิน วPA ประจำปีงบประมาณ พ.ศ. 2568" value="รอบการประเมิน วPA ประจำปีงบประมาณ พ.ศ. ${currentYear} (1 ต.ค. ${currentYear - 1} - 30 ก.ย. ${currentYear})">
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block font-bold text-slate-700 mb-1">สถานะรอบการประเมิน:</label>
            <select id="pa-status" class="w-full p-2.5 rounded-lg border border-slate-300 bg-white">
              <option value="พร้อมรับการประเมิน" selected>⏳ พร้อมรับการประเมิน (ยังไม่สรุปคะแนน)</option>
              <option value="ประเมินผ่านเกณฑ์ (ระดับดีเยี่ยม)">✅ ประเมินผ่านเกณฑ์ (ระดับดีเยี่ยม)</option>
              <option value="ประเมินผ่านเกณฑ์ (ระดับดีมาก)">✅ ประเมินผ่านเกณฑ์ (ระดับดีมาก)</option>
              <option value="ประเมินผ่านเกณฑ์ (ระดับดี)">✅ ประเมินผ่านเกณฑ์ (ระดับดี)</option>
              <option value="อยู่ระหว่างการประเมิน">🔄 อยู่ระหว่างการประเมิน</option>
            </select>
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">คะแนนรวม (เว้นว่างได้ถ้ายังไม่ได้รับผล):</label>
            <input id="pa-total-score" class="w-full p-2.5 rounded-lg border border-slate-300 font-bold text-emerald-700" placeholder="เช่น 95.00 (เว้นว่างได้)" value="">
          </div>
        </div>

        <!-- YouTube Video Link (Optional) -->
        <div class="p-3 bg-rose-50/70 rounded-xl border border-rose-200/80 space-y-1.5">
          <label class="block font-bold text-rose-900 flex items-center gap-1.5">
            <i data-lucide="video" class="w-4 h-4 text-rose-600"></i> ลิงก์คลิปวิดีโอบันทึกการสอน / นวัตกรรม (YouTube):
          </label>
          <input id="pa-youtube-url" class="w-full p-2.5 rounded-lg border border-rose-200 bg-white" placeholder="https://www.youtube.com/watch?v=... หรือ https://youtu.be/... (เว้นว่างได้ถ้าไม่มีวิดีโอ)">
          <p class="text-[11px] text-rose-700/80 font-sarabun">* หากไม่ระบุลิงก์ ระบบจะไม่แสดงกรอบวิดีโอ และจะขยายข้อความประเด็นท้าทายเต็มหน้าจออัตโนมัติ</p>
        </div>

        <!-- Challenge Issue -->
        <div class="p-3 bg-amber-50/70 rounded-xl border border-amber-200/80 space-y-2">
          <span class="block font-bold text-amber-900">ส่วนที่ 2: ข้อตกลงในการพัฒนางานที่เป็นประเด็นท้าทาย</span>
          <div>
            <label class="block font-semibold text-slate-700 mb-1">ชื่อประเด็นท้าทาย: *</label>
            <input id="pa-challenge-title" class="w-full p-2.5 rounded-lg border border-slate-300 bg-white" placeholder="ระบุหัวข้อประเด็นท้าทาย">
          </div>
          <div>
            <label class="block font-semibold text-slate-700 mb-1">วัตถุประสงค์:</label>
            <textarea id="pa-challenge-obj" rows="2" class="w-full p-2 rounded-lg border border-slate-300 bg-white" placeholder="ระบุวัตถุประสงค์ข้อ 1, 2..."></textarea>
          </div>
          <div>
            <label class="block font-semibold text-slate-700 mb-1">วิธีดำเนินการ:</label>
            <textarea id="pa-challenge-method" rows="2" class="w-full p-2 rounded-lg border border-slate-300 bg-white" placeholder="ระบุขั้นตอนการจัดกิจกรรม/นวัตกรรม"></textarea>
          </div>
          <div>
            <label class="block font-semibold text-slate-700 mb-1">ผลลัพธ์ที่เกิดขึ้นจริง:</label>
            <textarea id="pa-challenge-res" rows="2" class="w-full p-2 rounded-lg border border-slate-300 bg-white" placeholder="ระบุผลสัมฤทธิ์หรือผลลัพธ์เชิงประจักษ์"></textarea>
          </div>
        </div>

        <!-- Documents Section: Official PA Docs -->
        <div class="p-3 bg-blue-50/70 rounded-xl border border-blue-200/80 space-y-2">
          <label class="block font-bold text-blue-900 flex items-center gap-1.5">
            <i data-lucide="file-text" class="w-4 h-4 text-blue-600"></i> ลิงก์ไฟล์เอกสาร วPA ฉบับเต็ม (PDF / Google Drive):
          </label>
          <div>
            <label class="block text-[11px] font-semibold text-slate-600 mb-0.5">แบบ PA 1/ส (ข้อตกลงในการพัฒนางาน):</label>
            <input id="pa-doc-1" class="w-full p-2 rounded-lg border border-slate-300 bg-white" placeholder="https://drive.google.com/... หรือ ลิงก์ PDF" value="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf">
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-slate-600 mb-0.5">แบบ PA 2/ส (รายงานผลการพัฒนางาน):</label>
            <input id="pa-doc-2" class="w-full p-2 rounded-lg border border-slate-300 bg-white" placeholder="https://drive.google.com/... หรือ ลิงก์ PDF" value="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf">
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-slate-600 mb-0.5">แบบ PA 3/ส (แบบประเมินผลการพัฒนางาน):</label>
            <input id="pa-doc-3" class="w-full p-2 rounded-lg border border-slate-300 bg-white" placeholder="https://drive.google.com/... หรือ ลิงก์ PDF" value="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf">
          </div>
        </div>

        <!-- Documents Section: 3 Aspects Evidence -->
        <div class="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200/80 space-y-2">
          <label class="block font-bold text-emerald-900 flex items-center gap-1.5">
            <i data-lucide="folder-check" class="w-4 h-4 text-emerald-600"></i> ลิงก์เอกสาร/โฟลเดอร์ร่องรอยหลักฐาน 3 ด้าน (PDF / Google Drive):
          </label>
          <div>
            <label class="block text-[11px] font-semibold text-slate-600 mb-0.5">หลักฐานด้านที่ 1: ด้านการจัดการเรียนรู้ (8 ตัวชี้วัด):</label>
            <input id="pa-aspect-1-doc" class="w-full p-2 rounded-lg border border-slate-300 bg-white" placeholder="https://drive.google.com/... หรือ ลิงก์ PDF" value="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf">
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-slate-600 mb-0.5">หลักฐานด้านที่ 2: ด้านการส่งเสริมสนับสนุน (4 ตัวชี้วัด):</label>
            <input id="pa-aspect-2-doc" class="w-full p-2 rounded-lg border border-slate-300 bg-white" placeholder="https://drive.google.com/... หรือ ลิงก์ PDF" value="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf">
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-slate-600 mb-0.5">หลักฐานด้านที่ 3: ด้านการพัฒนาตนเองและวิชาชีพ (3 ตัวชี้วัด):</label>
            <input id="pa-aspect-3-doc" class="w-full p-2 rounded-lg border border-slate-300 bg-white" placeholder="https://drive.google.com/... หรือ ลิงก์ PDF" value="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf">
          </div>
        </div>
      </div>
    `,
    width: "700px",
    showCancelButton: true,
    confirmButtonText: "บันทึกรอบ วPA",
    cancelButtonText: "ยกเลิก",
    confirmButtonColor: "#d97706",
    cancelButtonColor: "#64748b",
    didOpen: () => initIcons(),
    preConfirm: () => {
      const fiscalYear = document.getElementById("pa-fiscal-year").value.trim();
      const roundTitle = document.getElementById("pa-round-title").value.trim();
      const targetPosition = document.getElementById("pa-target-pos").value.trim();
      const status = document.getElementById("pa-status").value.trim();
      const totalScore = document.getElementById("pa-total-score").value.trim();
      const youtubeUrl = document.getElementById("pa-youtube-url").value.trim();
      const youtubeVideoId = extractYoutubeId(youtubeUrl);
      const challengeTitle = document.getElementById("pa-challenge-title").value.trim();
      const challengeObjective = document.getElementById("pa-challenge-obj").value.trim();
      const challengeMethod = document.getElementById("pa-challenge-method").value.trim();
      const challengeResult = document.getElementById("pa-challenge-res").value.trim();
      const pa1DocUrl = document.getElementById("pa-doc-1").value.trim();
      const pa2DocUrl = document.getElementById("pa-doc-2").value.trim();
      const pa3DocUrl = document.getElementById("pa-doc-3").value.trim();
      const aspect1Doc = document.getElementById("pa-aspect-1-doc").value.trim();
      const aspect2Doc = document.getElementById("pa-aspect-2-doc").value.trim();
      const aspect3Doc = document.getElementById("pa-aspect-3-doc").value.trim();

      if (!fiscalYear || !roundTitle) {
        Swal.showValidationMessage("กรุณาระบุปีงบประมาณและชื่อรอบการประเมิน");
        return false;
      }

      return {
        fiscalYear,
        academicYear: fiscalYear,
        roundTitle,
        targetPosition,
        status,
        totalScore,
        youtubeUrl,
        youtubeVideoId,
        challengeTitle: challengeTitle || "ข้อตกลงในการพัฒนางานที่เป็นประเด็นท้าทาย",
        challengeObjective,
        challengeMethod,
        challengeResult,
        pa1DocUrl,
        pa2DocUrl,
        pa3DocUrl,
        coverUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80",
        isVisible: true,
        indicators: [
          { standard: "ด้านที่ 1 ด้านการจัดการเรียนรู้ (8 ตัวชี้วัด)", detail: "สร้างและพัฒนาหลักสูตร, ออกแบบหน่วยการเรียนรู้, จัดกิจกรรมเชิงรุก (Active Learning), สร้างสื่อ/นวัตกรรม, วัดและประเมินผล", score: "", docUrl: aspect1Doc },
          { standard: "ด้านที่ 2 ด้านการส่งเสริมและสนับสนุนการจัดการเรียนรู้ (4 ตัวชี้วัด)", detail: "จัดทำข้อมูลสารสนเทศนักเรียน, ดำเนินการตามระบบดูแลช่วยเหลือ, ปฏิบัติงานวิชาการและงานสถานศึกษา", score: "", docUrl: aspect2Doc },
          { standard: "ด้านที่ 3 ด้านการพัฒนาตนเองและวิชาชีพ (3 ตัวชี้วัด)", detail: "พัฒนาตนเองอย่างเป็นระบบและต่อเนื่อง, มีส่วนร่วมในชุมชนแห่งการเรียนรู้ทางวิชาชีพ (PLC), นำผลมาพัฒนาผู้เรียน", score: "", docUrl: aspect3Doc }
        ]
      };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      window.portfolioStorage.addItem("paRecords", result.value);
      AppState.activePaYear = result.value.fiscalYear;
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: `เพิ่มรอบการประเมิน วPA ปี ${result.value.fiscalYear} เรียบร้อยแล้ว`,
        showConfirmButton: false,
        timer: 1500
      });
      renderCurrentView();
    }
  });
}

// ==========================================
// 1. Modular Edit Modal: PA Header & Round Settings
// ==========================================
function openEditPaHeaderModal(paId) {
  const data = window.portfolioStorage.getData();
  const item = data.paRecords?.find(p => String(p.id) === String(paId));
  if (!item) return;

  const currentStatus = item.status || "พร้อมรับการประเมิน";

  Swal.fire({
    title: `แก้ไขข้อมูลรอบการประเมิน วPA (ปี ${item.fiscalYear})`,
    html: `
      <div class="space-y-3.5 text-left font-sarabun text-xs max-h-[75vh] overflow-y-auto p-1">
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block font-bold text-slate-700 mb-1">ปีงบประมาณ (พ.ศ.): *</label>
            <input id="edit-pa-fiscal-year" class="w-full p-2.5 rounded-lg border border-slate-300 font-bold" value="${item.fiscalYear || ''}">
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">ตำแหน่งเป้าหมาย: *</label>
            <input id="edit-pa-target-pos" class="w-full p-2.5 rounded-lg border border-slate-300" value="${item.targetPosition || 'ครู'}">
          </div>
        </div>

        <div>
          <label class="block font-bold text-slate-700 mb-1">ชื่อรอบการประเมิน: *</label>
          <input id="edit-pa-round-title" class="w-full p-2.5 rounded-lg border border-slate-300 font-bold" value="${item.roundTitle || ''}">
        </div>

        <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
          <label class="block font-bold text-slate-800 text-xs">ผลการประเมินและคะแนนรวม (สำหรับบันทึกเมื่อกรรมการตรวจเสร็จแล้ว):</label>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-[11px] font-bold text-slate-600 mb-1">สถานะรอบการประเมิน:</label>
              <select id="edit-pa-status" class="w-full p-2.5 rounded-lg border border-slate-300 bg-white text-xs">
                <option value="พร้อมรับการประเมิน" ${currentStatus.includes('พร้อม') ? 'selected' : ''}>⏳ พร้อมรับการประเมิน (ยังไม่สรุปคะแนน)</option>
                <option value="ประเมินผ่านเกณฑ์ (ระดับดีเยี่ยม)" ${currentStatus.includes('ดีเยี่ยม') ? 'selected' : ''}>✅ ประเมินผ่านเกณฑ์ (ระดับดีเยี่ยม)</option>
                <option value="ประเมินผ่านเกณฑ์ (ระดับดีมาก)" ${currentStatus.includes('ดีมาก') ? 'selected' : ''}>✅ ประเมินผ่านเกณฑ์ (ระดับดีมาก)</option>
                <option value="ประเมินผ่านเกณฑ์ (ระดับดี)" ${(currentStatus.includes('ระดับดี') && !currentStatus.includes('ดีมาก') && !currentStatus.includes('ดีเยี่ยม')) ? 'selected' : ''}>✅ ประเมินผ่านเกณฑ์ (ระดับดี)</option>
                <option value="อยู่ระหว่างการประเมิน" ${currentStatus.includes('อยู่ระหว่าง') ? 'selected' : ''}>🔄 อยู่ระหว่างการประเมิน</option>
              </select>
            </div>
            <div>
              <label class="block text-[11px] font-bold text-slate-600 mb-1">คะแนนรวมที่ได้รับ (100 คะแนนเต็ม):</label>
              <input id="edit-pa-total-score" class="w-full p-2.5 rounded-lg border border-slate-300 font-bold text-emerald-700 bg-white" placeholder="เช่น 95.50 (เว้นว่างได้)" value="${item.totalScore || ''}">
            </div>
          </div>
        </div>
      </div>
    `,
    width: "600px",
    showCancelButton: true,
    confirmButtonText: "บันทึกข้อมูลรอบนี้",
    cancelButtonText: "ยกเลิก",
    confirmButtonColor: "#d97706",
    cancelButtonColor: "#64748b",
    preConfirm: () => {
      const fiscalYear = document.getElementById("edit-pa-fiscal-year").value.trim();
      const targetPosition = document.getElementById("edit-pa-target-pos").value.trim();
      const roundTitle = document.getElementById("edit-pa-round-title").value.trim();
      const status = document.getElementById("edit-pa-status").value.trim();
      const totalScore = document.getElementById("edit-pa-total-score").value.trim();

      if (!fiscalYear || !roundTitle) {
        Swal.showValidationMessage("กรุณาระบุปีงบประมาณและชื่อรอบการประเมิน");
        return false;
      }

      return {
        fiscalYear,
        academicYear: fiscalYear,
        targetPosition,
        roundTitle,
        status,
        totalScore
      };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      window.portfolioStorage.updateItem("paRecords", paId, result.value);
      AppState.activePaYear = result.value.fiscalYear;
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "อัปเดตข้อมูลรอบการประเมินเรียบร้อยแล้ว",
        showConfirmButton: false,
        timer: 1500
      });
      renderCurrentView();
    }
  });
}

// ==========================================
// 2. Modular Edit Modal: Challenge Issue, Images & YouTube Video
// ==========================================
function openEditPaChallengeModal(paId) {
  const data = window.portfolioStorage.getData();
  const item = data.paRecords?.find(p => String(p.id) === String(paId));
  if (!item) return;

  let currentChallengeImages = (item.challengeImages || []).map(img => {
    if (typeof img === "string") return { url: img, caption: "ภาพกิจกรรมและร่องรอยหลักฐานประเด็นท้าทาย" };
    return { url: img.url || "", caption: img.caption || "" };
  });

  function renderChallengeImageListHtml() {
    if (currentChallengeImages.length === 0) {
      return `<p class="text-xs text-slate-400 font-sarabun py-3 text-center bg-white rounded-xl border border-dashed border-slate-200">ยังไม่มีรูปภาพสำหรับประเด็นท้าทายนี้</p>`;
    }
    return `
      <div class="space-y-3 pt-1">
        ${currentChallengeImages.map((img, i) => `
          <div class="p-3 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center gap-3 shadow-2xs">
            <div class="relative w-24 h-18 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
              <img src="${img.url}" class="w-full h-full object-cover">
            </div>
            <div class="flex-1 w-full space-y-1">
              <label class="block text-[11px] font-bold text-slate-600 font-prompt">คำบรรยายใต้ภาพที่ ${i + 1}:</label>
              <input id="challenge-img-caption-${i}" class="w-full p-2 rounded-lg border border-slate-300 text-xs bg-slate-50 focus:bg-white font-sarabun" placeholder="พิมพ์คำบรรยายใต้ภาพ เช่น ภาพการจัดกิจกรรมตามประเด็นท้าทาย..." value="${img.caption || ''}">
            </div>
            <button type="button" onclick="removeChallengeImage(${i})" class="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0 font-prompt" title="ลบภาพนี้">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i> ลบรูป
            </button>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Global helper for challenge image removal
  window.removeChallengeImage = (imgIdx) => {
    currentChallengeImages.forEach((img, idx) => {
      const input = document.getElementById(`challenge-img-caption-${idx}`);
      if (input) img.caption = input.value.trim();
    });
    currentChallengeImages.splice(imgIdx, 1);
    const container = document.getElementById("challenge-images-container");
    if (container) {
      container.innerHTML = renderChallengeImageListHtml();
      initIcons();
    }
  };

  Swal.fire({
    title: `<span class="text-base font-bold font-prompt text-slate-800 flex items-center justify-center gap-2">
      <i data-lucide="edit-3" class="w-5 h-5 text-amber-600"></i> แก้ไขส่วนที่ 2: ประเด็นท้าทาย, รูปภาพ & วิดีโอ
    </span>`,
    html: `
      <div class="space-y-3.5 text-left font-sarabun text-xs max-h-[75vh] overflow-y-auto p-1">
        <div>
          <label class="block font-bold text-slate-700 mb-1 font-prompt">ชื่อประเด็นท้าทาย: *</label>
          <input id="edit-pa-challenge-title" class="w-full p-2.5 rounded-lg border border-slate-300 font-bold bg-white font-prompt" placeholder="เช่น การพัฒนาผลสัมฤทธิ์การเขียนโปรแกรม..." value="${item.challengeTitle || ''}">
        </div>

        <div>
          <label class="block font-bold text-slate-700 mb-1 font-prompt">วัตถุประสงค์:</label>
          <textarea id="edit-pa-challenge-obj" rows="2" class="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-sarabun text-xs leading-relaxed" placeholder="ระบุเป้าหมายหรือวัตถุประสงค์">${item.challengeObjective || ''}</textarea>
        </div>

        <div>
          <label class="block font-bold text-slate-700 mb-1 font-prompt">วิธีดำเนินการ:</label>
          <textarea id="edit-pa-challenge-method" rows="3" class="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-sarabun text-xs leading-relaxed" placeholder="ระบุกระบวนการ ออกแบบ หรือนวัตกรรมที่นำมาใช้">${item.challengeMethod || ''}</textarea>
        </div>

        <div>
          <label class="block font-bold text-slate-700 mb-1 font-prompt">ผลลัพธ์ที่เกิดขึ้นจริง:</label>
          <textarea id="edit-pa-challenge-res" rows="2" class="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-sarabun text-xs leading-relaxed" placeholder="ระบุผลสัมฤทธิ์เชิงปริมาณและเชิงคุณภาพ">${item.challengeResult || ''}</textarea>
        </div>

        <!-- Image Management Section with Captions for Challenge Issue -->
        <div class="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200 space-y-3">
          <div class="flex items-center justify-between">
            <label class="block font-bold text-amber-950 flex items-center gap-1.5 text-xs font-prompt">
              <i data-lucide="camera" class="w-4 h-4 text-amber-600"></i> จัดการรูปภาพและคำบรรยายใต้ภาพสำหรับประเด็นท้าทาย:
            </label>
            <span class="text-[11px] text-amber-800 font-semibold bg-amber-200/60 px-2 py-0.5 rounded-md font-prompt">บีบอัดภาพอัตโนมัติ</span>
          </div>

          <div class="space-y-1">
            <label class="block text-[11px] font-semibold text-slate-700 font-prompt">1. อัปโหลดรูปภาพจากคอมพิวเตอร์ / มือถือ (เลือกหลายรูปพร้อมกันได้):</label>
            <input type="file" id="challenge-file-input" multiple accept="image/*" class="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-600 file:text-white hover:file:bg-amber-700 cursor-pointer">
          </div>

          <div class="space-y-1 pt-1">
            <label class="block text-[11px] font-semibold text-slate-700 font-prompt">2. หรือวาง URL ลิงก์รูปภาพ:</label>
            <div class="flex gap-2">
              <input id="challenge-url-input" class="flex-1 p-2 rounded-lg border border-slate-300 text-xs bg-white font-mono" placeholder="https://... ลิงก์รูปภาพ">
              <button type="button" id="btn-add-challenge-url" class="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold cursor-pointer shrink-0 font-prompt">
                เพิ่มรูป
              </button>
            </div>
          </div>

          <!-- Image List with Caption Inputs -->
          <div id="challenge-images-container">
            ${renderChallengeImageListHtml()}
          </div>
        </div>

        <!-- YouTube Video Link -->
        <div class="p-3.5 bg-rose-50/80 rounded-2xl border border-rose-200 space-y-1.5">
          <label class="block font-bold text-rose-900 text-xs flex items-center gap-1.5 font-prompt">
            <i data-lucide="video" class="w-4 h-4 text-rose-600"></i> ลิงก์คลิปวิดีโอบันทึกการสอน / นวัตกรรม (YouTube):
          </label>
          <input id="edit-pa-youtube-url" class="w-full p-2.5 rounded-lg border border-rose-300 bg-white font-mono text-xs" placeholder="https://www.youtube.com/watch?v=... หรือ https://youtu.be/... (เว้นว่างได้)" value="${item.youtubeUrl || (item.youtubeVideoId ? `https://www.youtube.com/watch?v=${item.youtubeVideoId}` : '')}">
          <p class="text-[11px] text-rose-700/90 font-sarabun">* หากไม่ระบุลิงก์ ระบบจะซ่อนกรอบวิดีโอและขยายเนื้อหาประเด็นท้าทายเต็มหน้าจออย่างสวยงาม</p>
        </div>
      </div>
    `,
    width: "740px",
    showCancelButton: true,
    confirmButtonText: "💾 บันทึกข้อมูลประเด็นท้าทาย",
    cancelButtonText: "ยกเลิก",
    confirmButtonColor: "#d97706",
    cancelButtonColor: "#64748b",
    didOpen: () => {
      initIcons();
      const fileInput = document.getElementById("challenge-file-input");
      const urlInput = document.getElementById("challenge-url-input");
      const addUrlBtn = document.getElementById("btn-add-challenge-url");
      const container = document.getElementById("challenge-images-container");

      function syncCaptions() {
        currentChallengeImages.forEach((img, idx) => {
          const input = document.getElementById(`challenge-img-caption-${idx}`);
          if (input) img.caption = input.value.trim();
        });
      }

      if (fileInput) {
        fileInput.addEventListener("change", async (e) => {
          syncCaptions();
          const files = Array.from(e.target.files);
          for (const file of files) {
            const compressed = await window.compressImage(file, 1600, 0.85);
            currentChallengeImages.push({
              url: compressed,
              caption: file.name ? `ภาพกิจกรรม: ${file.name.replace(/\.[^/.]+$/, "")}` : "ภาพกิจกรรมและการใช้นวัตกรรมตามประเด็นท้าทาย"
            });
          }
          if (container) {
            container.innerHTML = renderChallengeImageListHtml();
            initIcons();
          }
        });
      }

      if (addUrlBtn && urlInput) {
        addUrlBtn.addEventListener("click", () => {
          syncCaptions();
          const url = urlInput.value.trim();
          if (url) {
            currentChallengeImages.push({
              url: url,
              caption: "ภาพกิจกรรมและการใช้นวัตกรรมตามประเด็นท้าทาย"
            });
            urlInput.value = "";
            if (container) {
              container.innerHTML = renderChallengeImageListHtml();
              initIcons();
            }
          }
        });
      }
    },
    preConfirm: () => {
      const challengeTitle = document.getElementById("edit-pa-challenge-title").value.trim();
      const challengeObjective = document.getElementById("edit-pa-challenge-obj").value.trim();
      const challengeMethod = document.getElementById("edit-pa-challenge-method").value.trim();
      const challengeResult = document.getElementById("edit-pa-challenge-res").value.trim();
      const youtubeUrl = document.getElementById("edit-pa-youtube-url").value.trim();
      const youtubeVideoId = extractYoutubeId(youtubeUrl);

      if (!challengeTitle) {
        Swal.showValidationMessage("กรุณาระบุชื่อประเด็นท้าทาย");
        return false;
      }

      // Collect updated captions
      const finalImages = currentChallengeImages.map((img, idx) => {
        const input = document.getElementById(`challenge-img-caption-${idx}`);
        return {
          url: img.url,
          caption: input ? input.value.trim() : (img.caption || "")
        };
      });

      return {
        challengeTitle,
        challengeObjective,
        challengeMethod,
        challengeResult,
        youtubeUrl,
        youtubeVideoId,
        challengeImages: finalImages
      };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      window.portfolioStorage.updateItem("paRecords", paId, result.value);
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "บันทึกข้อมูลประเด็นท้าทายเรียบร้อยแล้ว",
        showConfirmButton: false,
        timer: 1500
      });
      renderCurrentView();
    }
  });
}

// ==========================================
// 3. Modular Edit Modal: Official PA Documents (PA-1, PA-2, PA-3)
// ==========================================
function openEditPaDocsModal(paId) {
  const data = window.portfolioStorage.getData();
  const item = data.paRecords?.find(p => String(p.id) === String(paId));
  if (!item) return;

  Swal.fire({
    title: "แก้ไขลิงก์เอกสารหลัก วPA (PA 1/ส, PA 2/ส, PA 3/ส)",
    html: `
      <div class="space-y-4 text-left font-sarabun text-xs max-h-[75vh] overflow-y-auto p-1">
        <p class="text-slate-600">ระบุลิงก์ไฟล์ PDF หรือ Google Drive สำหรับแบบประเมินหลัก 3 ฉบับ:</p>

        <div class="p-3.5 bg-blue-50/80 rounded-xl border border-blue-200 space-y-1.5">
          <label class="block font-bold text-blue-900 text-xs flex items-center gap-1.5">
            <i data-lucide="file" class="w-4 h-4 text-blue-600"></i> แบบ PA 1/ส (ข้อตกลงในการพัฒนางาน):
          </label>
          <input id="edit-pa-doc-1" class="w-full p-2.5 rounded-lg border border-blue-300 bg-white font-mono text-xs" placeholder="https://drive.google.com/... หรือ ลิงก์ PDF" value="${item.pa1DocUrl || ''}">
        </div>

        <div class="p-3.5 bg-emerald-50/80 rounded-xl border border-emerald-200 space-y-1.5">
          <label class="block font-bold text-emerald-900 text-xs flex items-center gap-1.5">
            <i data-lucide="file-check-2" class="w-4 h-4 text-emerald-600"></i> แบบ PA 2/ส (รายงานผลการพัฒนางาน):
          </label>
          <input id="edit-pa-doc-2" class="w-full p-2.5 rounded-lg border border-emerald-300 bg-white font-mono text-xs" placeholder="https://drive.google.com/... หรือ ลิงก์ PDF" value="${item.pa2DocUrl || ''}">
        </div>

        <div class="p-3.5 bg-purple-50/80 rounded-xl border border-purple-200 space-y-1.5">
          <label class="block font-bold text-purple-900 text-xs flex items-center gap-1.5">
            <i data-lucide="award" class="w-4 h-4 text-purple-600"></i> แบบ PA 3/ส (แบบประเมินผลการพัฒนางาน):
          </label>
          <input id="edit-pa-doc-3" class="w-full p-2.5 rounded-lg border border-purple-300 bg-white font-mono text-xs" placeholder="https://drive.google.com/... หรือ ลิงก์ PDF" value="${item.pa3DocUrl || ''}">
        </div>
      </div>
    `,
    width: "650px",
    showCancelButton: true,
    confirmButtonText: "บันทึกเอกสารทั้ง 3 ฉบับ",
    cancelButtonText: "ยกเลิก",
    confirmButtonColor: "#2563eb",
    cancelButtonColor: "#64748b",
    didOpen: () => initIcons(),
    preConfirm: () => {
      const pa1DocUrl = document.getElementById("edit-pa-doc-1").value.trim();
      const pa2DocUrl = document.getElementById("edit-pa-doc-2").value.trim();
      const pa3DocUrl = document.getElementById("edit-pa-doc-3").value.trim();

      return {
        pa1DocUrl,
        pa2DocUrl,
        pa3DocUrl
      };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      window.portfolioStorage.updateItem("paRecords", paId, result.value);
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "บันทึกเอกสาร วPA ฉบับเต็มเรียบร้อยแล้ว",
        showConfirmButton: false,
        timer: 1500
      });
      renderCurrentView();
    }
  });
}

function handleDeletePaRecord(paId) {
  const data = window.portfolioStorage.getData();
  const item = data.paRecords?.find(p => String(p.id) === String(paId));
  if (!item) return;

  if (data.paRecords.length <= 1) {
    Swal.fire({
      icon: "warning",
      title: "ไม่สามารถลบได้",
      text: "ระบบต้องมีรอบการประเมิน วPA อย่างน้อย 1 รอบ"
    });
    return;
  }

  Swal.fire({
    title: `ยืนยันการลบรอบ วPA ปี ${item.fiscalYear}?`,
    text: "ข้อมูลรอบการประเมินและประเด็นท้าทายของปีนี้จะถูกลบออกจากระบบ",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#e11d48",
    cancelButtonColor: "#64748b",
    confirmButtonText: "ยืนยันลบ",
    cancelButtonText: "ยกเลิก"
  }).then((result) => {
    if (result.isConfirmed) {
      window.portfolioStorage.deleteItem("paRecords", paId);
      const remaining = window.portfolioStorage.getData().paRecords || [];
      AppState.activePaYear = remaining[0]?.fiscalYear || "2567";
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "ลบรอบการประเมินเรียบร้อยแล้ว",
        showConfirmButton: false,
        timer: 1500
      });
      renderCurrentView();
    }
  });
}

// ==========================================
// PA Aspect & Indicator Detail Showcase Modal (Committee View)
// ==========================================
function openAspectDetailModal(paId, aspectIndex, activeIndicatorCode = null) {
  const data = window.portfolioStorage.getData();
  const paRecord = data.paRecords?.find(p => String(p.id) === String(paId));
  if (!paRecord) return;
  const aspect = paRecord.indicators?.[aspectIndex];
  if (!aspect) return;

  const isAdmin = window.portfolioStorage.isAdmin();
  const items = aspect.items && aspect.items.length > 0 ? aspect.items : [];
  
  let currentActiveCode = activeIndicatorCode || items[0]?.code || `${aspectIndex + 1}.1`;
  const idxNum = aspectIndex + 1;
  const accentColor = idxNum === 1 ? "blue" : idxNum === 2 ? "teal" : "purple";

  function getIndicatorContentHtml(indCode) {
    const activeItem = items.find(it => it.code === indCode) || items[0] || {
      code: indCode,
      title: aspect.standard,
      details: aspect.evidenceDetails || aspect.detail || "",
      images: []
    };
    const images = activeItem.images || [];
    const isPLC = activeItem.code === "3.2";
    const isTrainingIndicator = activeItem.code === "3.1" || activeItem.code === "3.2" || (activeItem.trainings && activeItem.trainings.length > 0);
    const dateColLabel = isPLC ? "พ.ศ." : "วันที่เข้าอบรม";
    const tableHeaderLabel = isPLC 
      ? `ตารางบันทึกการมีส่วนร่วมในชุมชนแห่งการเรียนรู้ทางวิชาชีพ (PLC) (${(activeItem.trainings || []).length || 1} รายการ):`
      : `ตารางบันทึกประวัติการเข้าอบรม / สัมมนา / พัฒนาตนเอง (${(activeItem.trainings || []).length || 1} รายการ):`;
    const addBtnLabel = isPLC ? "➕ เพิ่มรายการ PLC" : "➕ เพิ่มรายการอบรม";
    const emptyTableText = isPLC ? "ยังไม่มีรายการบันทึก PLC สำหรับตัวชี้วัดนี้" : "ยังไม่มีรายการบันทึกการอบรมสำหรับตัวชี้วัดนี้";

    const trainings = activeItem.trainings || (activeItem.code === "3.1" ? [
      {
        id: "tr-1",
        no: "๑",
        title: "การอบรมเชิงปฏิบัติการวิทยากรแกนนำการจัดการเรียนรู้ผ่านฐานการเรียนรู้ตามหลักปรัชญาของเศรษฐกิจพอเพียง จำนวน ๖ ชั่วโมง",
        date: "๑๙ ธ.ค. ๖๘",
        organizer: "สพป.สิงห์บุรี",
        evidenceType: "เกียรติบัตร/รูปภาพ",
        certificateUrl: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80",
        pdfUrl: "",
        images: [
          { url: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80", caption: "เกียรติบัตรผ่านการอบรมวิทยากรแกนนำ" }
        ]
      }
    ] : activeItem.code === "3.2" ? [
      {
        id: "plc-1",
        no: "๑",
        title: "การขับเคลื่อนกระบวนการชุมชนแห่งการเรียนรู้ทางวิชาชีพ (PLC) เพื่อยกระดับผลสัมฤทธิ์ทางการเรียนและการคิดเชิงคำนวณ",
        date: "๒๕๖๘",
        organizer: "โรงเรียนวัดบางปูน",
        evidenceType: "เกียรติบัตร/รูปภาพ",
        certificateUrl: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80",
        pdfUrl: "",
        images: [
          { url: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80", caption: "บันทึกการประชุมชุมชนแห่งการเรียนรู้ทางวิชาชีพ (PLC) และภาพกิจกรรม" }
        ]
      }
    ] : []);

    return `
      <div class="p-5 bg-white rounded-2xl border-2 border-amber-400/80 shadow-md space-y-4 animate-in fade-in duration-200">
        <!-- Indicator Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div class="space-y-0.5">
            <span class="text-xs font-bold text-amber-700 flex items-center gap-1.5 font-prompt">
              <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-600"></i> ตัวชี้วัดที่ ${activeItem.code}
            </span>
            <h4 class="text-base sm:text-lg font-bold text-slate-800 leading-snug font-prompt">${activeItem.title}</h4>
          </div>
          <div class="flex items-center gap-2 shrink-0 flex-wrap">
            ${isTrainingIndicator && isAdmin ? `
              <button type="button" onclick="openAddTrainingModal('${paId}', ${aspectIndex}, '${activeItem.code}')" class="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer">
                <i data-lucide="plus-circle" class="w-3.5 h-3.5"></i>
                <span>เพิ่ม 1 รายการ</span>
              </button>
              <button type="button" onclick="openBatchAddTrainingModal('${paId}', ${aspectIndex}, '${activeItem.code}')" class="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer">
                <i data-lucide="layers" class="w-3.5 h-3.5"></i>
                <span>เพิ่มหลายรายการ (Batch)</span>
              </button>
            ` : ''}
            ${isAdmin ? `
              <button type="button" onclick="openEditSingleIndicatorModal('${paId}', ${aspectIndex}, '${activeItem.code}')" class="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-amber-100 text-slate-800 hover:text-amber-950 font-bold text-xs flex items-center gap-1.5 transition-all border border-slate-200 hover:border-amber-300 shadow-2xs cursor-pointer">
                <i data-lucide="edit-3" class="w-3.5 h-3.5 text-amber-600"></i>
                <span>แก้ไขสรุปผลงาน/ภาพ</span>
              </button>
            ` : ''}
          </div>
        </div>

        <!-- 1. คำอธิบายผลการปฏิบัติงานของตัวชี้วัดนี้ -->
        <div class="space-y-1.5">
          <span class="font-bold text-xs text-slate-700 flex items-center gap-1.5 font-prompt">
            <i data-lucide="file-edit" class="w-3.5 h-3.5 text-blue-600"></i> ผลการปฏิบัติงานและร่องรอยหลักฐานเชิงประจักษ์:
          </span>
          <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 font-sarabun text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            ${activeItem.details || "ยังไม่ได้ระบุรายละเอียดผลการปฏิบัติงานสำหรับตัวชี้วัดนี้"}
          </div>
        </div>

        <!-- 2. ตารางบันทึกการเข้าอบรม/พัฒนาตนเอง หรือ PLC (ตัวชี้วัด 3.1 และ 3.2) -->
        ${isTrainingIndicator ? `
          <div class="space-y-2.5 pt-1">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span class="font-bold text-xs text-slate-800 flex items-center gap-1.5 font-prompt">
                <i data-lucide="table" class="w-4 h-4 text-amber-600"></i> ${tableHeaderLabel}
              </span>
              <span class="text-[11px] text-slate-400 font-sarabun">คลิกที่ปุ่มเกียรติบัตร/รูปภาพ เพื่อเปิดดูหลักฐานเต็มจอ</span>
            </div>

            ${trainings.length > 0 ? `
              <div class="overflow-x-auto rounded-2xl border border-slate-300 shadow-xs bg-white">
                <table class="w-full text-xs font-sarabun text-slate-800 border-collapse">
                  <thead>
                    <tr class="bg-gradient-to-r from-slate-100 to-slate-200/90 text-slate-800 font-bold border-b border-slate-300 text-center">
                      <th class="py-3 px-3 w-12 border-r border-slate-300 font-prompt text-slate-900">ที่</th>
                      <th class="py-3 px-4 border-r border-slate-300 text-left font-prompt text-slate-900">${isPLC ? 'ชื่อกิจกรรม / หัวข้อการแลกเปลี่ยนเรียนรู้ (PLC)' : 'ชื่อกิจกรรมที่เข้าอบรม/พัฒนา'}</th>
                      <th class="py-3 px-3 w-28 border-r border-slate-300 font-prompt text-slate-900">${dateColLabel}</th>
                      <th class="py-3 px-3 w-32 border-r border-slate-300 font-prompt text-slate-900">${isPLC ? 'หน่วยงาน / กลุ่มสาระ' : 'หน่วยงานที่จัดอบรม'}</th>
                      <th class="py-3 px-3 w-48 font-prompt text-slate-900">หลักฐาน/เอกสารอ้างอิง</th>
                      ${isAdmin ? `<th class="py-3 px-2 w-20 font-prompt border-l border-slate-300 text-slate-900">จัดการ</th>` : ''}
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-200">
                    ${trainings.map((t, idx) => {
                      const certImg = t.certificateUrl || (t.images && t.images[0]?.url) || '';
                      const safeTitle = (t.title || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
                      const safeDate = (t.date || '-').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
                      const safeOrg = (t.organizer || '-').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
                      const safePdf = (t.pdfUrl || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
                      return `
                        <tr class="hover:bg-amber-50/40 transition-colors">
                          <td class="py-3.5 px-2 text-center font-bold text-slate-700 border-r border-slate-200 bg-slate-50/40">
                            ${t.no || getNextThaiNumber(idx + 1)}
                          </td>
                          <td class="py-3.5 px-4 text-left font-medium text-slate-800 border-r border-slate-200 leading-relaxed">
                            <p class="font-bold text-slate-800 text-xs sm:text-[13px]">${t.title}</p>
                          </td>
                          <td class="py-3.5 px-3 text-center text-slate-700 border-r border-slate-200 font-medium whitespace-nowrap">
                            ${t.date || '-'}
                          </td>
                          <td class="py-3.5 px-3 text-center text-slate-700 border-r border-slate-200 font-medium">
                            ${t.organizer || '-'}
                          </td>
                          <td class="py-3.5 px-3 text-center border-r border-slate-200">
                            <div class="flex items-center justify-center gap-1.5 flex-wrap">
                              ${certImg ? `
                                <button type="button" onclick="openCertificateLightbox('${certImg}', '${safeTitle}', '${safeDate}', '${safeOrg}', '${safePdf}', ${isPLC})" class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs transition-all cursor-pointer shadow-2xs group" title="คลิกเพื่อดูรูปภาพหลักฐานเต็มจอ">
                                  <i data-lucide="award" class="w-3.5 h-3.5 text-amber-600 group-hover:scale-110 transition-transform"></i>
                                  <span>${t.evidenceType || (isPLC ? 'เกียรติบัตร/รูปภาพ' : 'เกียรติบัตร/รูปภาพ')}</span>
                                </button>
                              ` : `
                                <span class="text-slate-400 text-xs">${t.evidenceType || 'เกียรติบัตร/รูปภาพ'}</span>
                              `}
                              ${t.pdfUrl ? `
                                <button type="button" onclick="openDocumentPreview('${safeTitle}', '${safePdf}')" class="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-bold text-xs transition-all cursor-pointer shadow-2xs" title="เปิดดูเอกสาร PDF">
                                  <i data-lucide="file-text" class="w-3.5 h-3.5 text-blue-600"></i>
                                  <span>PDF</span>
                                </button>
                              ` : ''}
                            </div>
                          </td>
                          ${isAdmin ? `
                            <td class="py-3.5 px-2 text-center border-l border-slate-200">
                              <div class="flex items-center justify-center gap-1">
                                <button type="button" onclick="openEditTrainingModal('${paId}', ${aspectIndex}, '${activeItem.code}', '${t.id}')" class="p-1.5 rounded-lg hover:bg-amber-100 text-amber-800 transition-colors cursor-pointer" title="แก้ไขรายการ">
                                  <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                                </button>
                                <button type="button" onclick="deleteTrainingRecord('${paId}', ${aspectIndex}, '${activeItem.code}', '${t.id}')" class="p-1.5 rounded-lg hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer" title="ลบรายการ">
                                  <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                                </button>
                              </div>
                            </td>
                          ` : ''}
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            ` : `
              <div class="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center space-y-2">
                <i data-lucide="file-text" class="w-8 h-8 text-slate-300 mx-auto"></i>
                <p class="text-xs text-slate-500 font-sarabun">${emptyTableText}</p>
                ${isAdmin ? `
                  <div class="flex items-center justify-center gap-2 pt-1 flex-wrap">
                    <button type="button" onclick="openAddTrainingModal('${paId}', ${aspectIndex}, '${activeItem.code}')" class="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-navy-950 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs flex items-center gap-1.5">
                      <i data-lucide="plus-circle" class="w-3.5 h-3.5"></i>
                      <span>เพิ่ม 1 รายการ</span>
                    </button>
                    <button type="button" onclick="openBatchAddTrainingModal('${paId}', ${aspectIndex}, '${activeItem.code}')" class="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs flex items-center gap-1.5">
                      <i data-lucide="layers" class="w-3.5 h-3.5"></i>
                      <span>เพิ่มหลายรายการพร้อมกัน (Batch Add)</span>
                    </button>
                  </div>
                ` : ''}
              </div>
            `}
          </div>
        ` : ''}

        <!-- 3. รูปภาพหลักฐานประกอบทั่วไป (พร้อมคำบรรยายใต้ภาพ) -->
        <div class="space-y-2 pt-1">
          <div class="flex items-center justify-between">
            <span class="font-bold text-xs text-slate-700 flex items-center gap-1.5 font-prompt">
              <i data-lucide="camera" class="w-4 h-4 text-amber-600"></i> ภาพถ่ายกิจกรรมและหลักฐานเชิงประจักษ์ (${images.length} ภาพ):
            </span>
            <span class="text-[11px] text-slate-400 font-sarabun">คลิกที่รูปภาพเพื่อขยายดูขนาดเต็ม</span>
          </div>

          ${images.length > 0 ? `
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              ${images.map((imgObj, i) => {
                const imgUrl = typeof imgObj === 'string' ? imgObj : imgObj.url;
                const imgCaption = typeof imgObj === 'string' ? '' : (imgObj.caption || '');
                return `
                  <div class="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group">
                    <div onclick="openImageViewer('${imgUrl}', 'ตัวชี้วัด ${activeItem.code} - ${imgCaption || activeItem.title}')" class="relative aspect-4/3 overflow-hidden bg-slate-100 cursor-pointer">
                      <img src="${imgUrl}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                      <div class="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                        <i data-lucide="zoom-in" class="w-4 h-4"></i> ขยายภาพ
                      </div>
                    </div>
                    <div class="p-3 bg-slate-50 border-t border-slate-100">
                      <p class="text-xs font-sarabun text-slate-700 leading-relaxed flex items-start gap-1.5">
                        <i data-lucide="info" class="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5"></i>
                        <span>${imgCaption || 'ภาพกิจกรรมและร่องรอยหลักฐานประกอบการประเมิน'}</span>
                      </p>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          ` : `
            <div class="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center space-y-2">
              <i data-lucide="camera" class="w-8 h-8 text-slate-300 mx-auto"></i>
              <p class="text-xs text-slate-500 font-sarabun">ยังไม่มีรูปภาพกิจกรรมเพิ่มเติมสำหรับตัวชี้วัดนี้</p>
              ${isAdmin ? `
                <button type="button" onclick="openEditSingleIndicatorModal('${paId}', ${aspectIndex}, '${activeItem.code}')" class="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-navy-950 rounded-lg text-xs font-bold cursor-pointer transition-all">
                  + เพิ่มรูปภาพและคำบรรยาย
                </button>
              ` : ''}
            </div>
          `}
        </div>
      </div>
    `;
  }

  // Smooth in-place tab switcher without re-opening modal
  window.switchIndicatorTab = (targetPaId, targetAspectIndex, targetCode) => {
    currentActiveCode = targetCode;
    // Update button states
    items.forEach(it => {
      const btn = document.getElementById(`ind-btn-${it.code.replace('.', '-')}`);
      if (btn) {
        const isActive = it.code === targetCode;
        if (isActive) {
          btn.className = "p-2.5 rounded-xl border text-left font-prompt transition-all flex flex-col justify-between gap-1 cursor-pointer bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold shadow-md border-amber-600 ring-2 ring-amber-400/40 scale-[1.02]";
          const badge = btn.querySelector(".ind-badge");
          if (badge) badge.className = "ind-badge px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/20 text-white";
          const count = btn.querySelector(".ind-count");
          if (count) count.className = "ind-count text-[10px] text-amber-100";
        } else {
          btn.className = "p-2.5 rounded-xl border text-left font-prompt transition-all flex flex-col justify-between gap-1 cursor-pointer bg-white hover:bg-amber-50 text-slate-700 border-slate-200 hover:border-amber-300 shadow-2xs";
          const badge = btn.querySelector(".ind-badge");
          if (badge) badge.className = "ind-badge px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600";
          const count = btn.querySelector(".ind-count");
          if (count) count.className = "ind-count text-[10px] text-slate-400";
        }
      }
    });

    // Update content area with smooth fade
    const container = document.getElementById("indicator-content-area");
    if (container) {
      container.style.opacity = "0.4";
      setTimeout(() => {
        container.innerHTML = getIndicatorContentHtml(targetCode);
        container.style.opacity = "1";
        initIcons();
      }, 100);
    }
  };

  Swal.fire({
    title: null,
    html: `
      <div class="text-left font-prompt space-y-4 max-h-[82vh] overflow-y-auto pr-1">
        <!-- Header Banner -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-${accentColor}-50/85 rounded-2xl border border-${accentColor}-200/90 shadow-2xs">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-bold text-xs bg-${accentColor}-600 text-white shadow-xs">
                <i data-lucide="bookmark" class="w-3.5 h-3.5"></i> ด้านที่ ${idxNum}
              </span>
              <span class="text-xs text-slate-500 font-sarabun">รอบการประเมิน วPA ปีงบประมาณ พ.ศ. ${paRecord.fiscalYear}</span>
            </div>
            <h3 class="text-base sm:text-lg font-bold text-slate-800 leading-snug">${aspect.standard}</h3>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            ${aspect.docUrl ? `
              <button onclick="openDocumentPreview('${aspect.standard}', '${aspect.docUrl}')" class="px-3.5 py-2 rounded-xl bg-white hover:bg-blue-600 hover:text-white text-blue-700 border border-blue-200 font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer" title="เปิดดูเอกสารภาพรวมด้านนี้">
                <i data-lucide="file-text" class="w-4 h-4"></i>
                <span>เอกสารภาพรวมด้านที่ ${idxNum}</span>
              </button>
            ` : ''}
            ${isAdmin ? `
              <button onclick="openEditAspectModal('${paId}', ${aspectIndex})" class="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-navy-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer" title="แก้ไขเอกสารแนบและข้อมูลด้านนี้">
                <i data-lucide="settings" class="w-4 h-4"></i>
                <span>แก้ไขเอกสาร & ด้านนี้</span>
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Indicator Selection Tabs (8, 4, หรือ 3 ตัวชี้วัด) -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="font-bold text-xs text-slate-700 flex items-center gap-1.5">
              <i data-lucide="layout-grid" class="w-4 h-4 text-amber-600"></i> เลือกตัวชี้วัดที่ต้องการตรวจประเมิน (${items.length} ตัวชี้วัด):
            </span>
            <span class="text-[11px] text-slate-400 font-sarabun">คลิกที่ตัวชี้วัดเพื่อดูข้อมูลและภาพประกอบ</span>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            ${items.map(it => {
              const isActive = it.code === currentActiveCode;
              const itImgs = it.images || [];
              const btnId = `ind-btn-${it.code.replace('.', '-')}`;
              return `
                <button type="button" id="${btnId}" onclick="switchIndicatorTab('${paId}', ${aspectIndex}, '${it.code}')" 
                  class="p-2.5 rounded-xl border text-left font-prompt transition-all flex flex-col justify-between gap-1 cursor-pointer ${isActive ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold shadow-md border-amber-600 ring-2 ring-amber-400/40 scale-[1.02]' : 'bg-white hover:bg-amber-50 text-slate-700 border-slate-200 hover:border-amber-300 shadow-2xs'}">
                  <div class="flex items-center justify-between w-full">
                    <span class="ind-badge px-1.5 py-0.5 rounded text-[10px] font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}">
                      ตัวชี้วัด ${it.code}
                    </span>
                    <span class="ind-count text-[10px] ${isActive ? 'text-amber-100' : 'text-slate-400'}">
                      📷 ${itImgs.length} ภาพ
                    </span>
                  </div>
                  <div class="line-clamp-2 text-[11px] leading-snug pt-0.5">${it.title}</div>
                </button>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Dynamic Indicator Content Area (Smooth In-Place Transition) -->
        <div id="indicator-content-area" class="transition-opacity duration-150 ease-in-out">
          ${getIndicatorContentHtml(currentActiveCode)}
        </div>
      </div>
    `,
    width: "840px",
    showCloseButton: true,
    showConfirmButton: false,
    didOpen: () => initIcons()
  });
}

// ==========================================
// PA Aspect Overall Edit & Document Management Modal (Admin)
// ==========================================
function openEditAspectModal(paId, aspectIndex) {
  const data = window.portfolioStorage.getData();
  const paRecord = data.paRecords?.find(p => String(p.id) === String(paId));
  if (!paRecord) return;
  const aspect = paRecord.indicators?.[aspectIndex];
  if (!aspect) return;

  const idxNum = aspectIndex + 1;
  const items = aspect.items || [];

  Swal.fire({
    title: `จัดการข้อมูลและเอกสาร: ด้านที่ ${idxNum}`,
    html: `
      <div class="space-y-4 text-left font-sarabun text-xs max-h-[75vh] overflow-y-auto p-1">
        <!-- 1. Document PDF Link -->
        <div class="p-3.5 bg-blue-50/80 rounded-xl border border-blue-200 space-y-2">
          <label class="block font-bold text-blue-900 text-xs flex items-center gap-1.5">
            <i data-lucide="file-text" class="w-4 h-4 text-blue-600"></i> ลิงก์เอกสารหลักฐานประกอบ (PDF / Google Drive) ประจำด้านที่ ${idxNum}:
          </label>
          <input id="edit-aspect-doc-url" class="w-full p-2.5 rounded-lg border border-blue-300 bg-white font-mono text-xs" placeholder="https://drive.google.com/... หรือ ลิงก์ไฟล์ PDF" value="${aspect.docUrl || ''}">
          <p class="text-[11px] text-blue-700 font-sarabun">
            * ลิงก์นี้จะเชื่อมโยงกับปุ่ม <strong>[ 📄 เอกสาร PDF ]</strong> ในหน้าแรก และปุ่ม <strong>[ เอกสารภาพรวมด้านที่ ${idxNum} ]</strong>
          </p>
        </div>

        <!-- 2. Aspect Standard Title -->
        <div>
          <label class="block font-bold text-slate-700 mb-1">ชื่อด้าน / มาตรฐานตำแหน่ง:</label>
          <input id="edit-aspect-title" class="w-full p-2.5 rounded-lg border border-slate-300 font-bold" value="${aspect.standard || ''}">
        </div>

        <!-- 3. Indicators list in this aspect -->
        <div class="space-y-2 pt-2 border-t border-slate-200">
          <div class="flex items-center justify-between">
            <label class="font-bold text-slate-700 flex items-center gap-1 text-xs">
              <i data-lucide="list-checks" class="w-4 h-4 text-amber-600"></i> จัดการตัวชี้วัดย่อย (${items.length} ตัวชี้วัด):
            </label>
            <span class="text-[11px] text-slate-500">คลิกที่ตัวชี้วัดเพื่อแก้ไขข้อความและอัปโหลดรูปภาพ</span>
          </div>

          <div class="space-y-2 max-h-56 overflow-y-auto pr-1">
            ${items.map(it => {
              const itImgs = it.images || [];
              return `
                <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 hover:bg-amber-50/60 transition-colors">
                  <div class="space-y-0.5 flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-bold text-[10px]">
                        ตัวชี้วัด ${it.code}
                      </span>
                      <span class="text-[11px] text-slate-500 font-medium">📷 ${itImgs.length} ภาพ</span>
                    </div>
                    <p class="font-bold text-slate-800 text-xs truncate">${it.title}</p>
                  </div>
                  <button type="button" onclick="Swal.close(); setTimeout(() => openEditSingleIndicatorModal('${paId}', ${aspectIndex}, '${it.code}'), 150);" class="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-navy-950 font-bold text-xs flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs">
                    <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                    <span>จัดการภาพ & ข้อมูล</span>
                  </button>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `,
    width: "680px",
    showCancelButton: true,
    confirmButtonText: "บันทึกข้อมูลด้านนี้",
    cancelButtonText: "ยกเลิก",
    confirmButtonColor: "#d97706",
    cancelButtonColor: "#64748b",
    didOpen: () => initIcons(),
    preConfirm: () => {
      const standard = document.getElementById("edit-aspect-title").value.trim();
      const docUrl = document.getElementById("edit-aspect-doc-url").value.trim();

      if (!standard) {
        Swal.showValidationMessage("กรุณาระบุชื่อด้าน / มาตรฐานตำแหน่ง");
        return false;
      }

      return { standard, docUrl };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      const indicators = [...(paRecord.indicators || [])];
      indicators[aspectIndex] = {
        ...indicators[aspectIndex],
        standard: result.value.standard,
        docUrl: result.value.docUrl
      };

      window.portfolioStorage.updateItem("paRecords", paId, { indicators });
      
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: `บันทึกข้อมูลด้านที่ ${idxNum} สำเร็จ`,
        showConfirmButton: false,
        timer: 1500
      });

      renderCurrentView();
    }
  });
}

// ==========================================
// PA Single Indicator Edit & Photo Caption Management Modal (Admin)
// ==========================================
function openEditSingleIndicatorModal(paId, aspectIndex, indCode) {
  const data = window.portfolioStorage.getData();
  const paRecord = data.paRecords?.find(p => String(p.id) === String(paId));
  if (!paRecord) return;
  const aspect = paRecord.indicators?.[aspectIndex];
  if (!aspect) return;

  const itemIndex = (aspect.items || []).findIndex(it => it.code === indCode);
  if (itemIndex === -1) return;

  const item = aspect.items[itemIndex];
  let currentImages = (item.images || []).map(img => {
    if (typeof img === "string") return { url: img, caption: "ภาพกิจกรรมและหลักฐาน" };
    return { url: img.url || "", caption: img.caption || "" };
  });

  function renderImageListHtml() {
    if (currentImages.length === 0) {
      return `<p class="text-xs text-slate-400 font-sarabun py-3 text-center bg-white rounded-lg border border-dashed">ยังไม่มีรูปภาพสำหรับตัวชี้วัดนี้</p>`;
    }
    return `
      <div class="space-y-3 pt-1">
        ${currentImages.map((img, i) => `
          <div class="p-3 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center gap-3 shadow-2xs">
            <div class="relative w-24 h-18 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
              <img src="${img.url}" class="w-full h-full object-cover">
            </div>
            <div class="flex-1 w-full space-y-1">
              <label class="block text-[11px] font-bold text-slate-600">คำบรรยายใต้ภาพที่ ${i + 1}:</label>
              <input id="img-caption-${i}" class="w-full p-2 rounded-lg border border-slate-300 text-xs bg-slate-50 focus:bg-white" placeholder="พิมพ์คำบรรยายใต้ภาพ เช่น ภาพการจัดกิจกรรม..." value="${img.caption || ''}">
            </div>
            <button type="button" onclick="removeSingleIndicatorImage(${i})" class="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0" title="ลบภาพนี้">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i> ลบรูป
            </button>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Global helper for image removal
  window.removeSingleIndicatorImage = (imgIdx) => {
    // Save current captions first
    currentImages.forEach((img, idx) => {
      const input = document.getElementById(`img-caption-${idx}`);
      if (input) img.caption = input.value.trim();
    });
    currentImages.splice(imgIdx, 1);
    const container = document.getElementById("indicator-images-container");
    if (container) {
      container.innerHTML = renderImageListHtml();
      initIcons();
    }
  };

  Swal.fire({
    title: `แก้ไขตัวชี้วัด ${item.code}: ${item.title}`,
    html: `
      <div class="space-y-3 text-left font-sarabun text-xs max-h-[75vh] overflow-y-auto p-1">
        <div>
          <label class="block font-bold text-slate-700 mb-1">ชื่อตัวชี้วัด: *</label>
          <input id="edit-ind-title" class="w-full p-2.5 rounded-lg border border-slate-300 font-bold" value="${item.title || ''}">
        </div>

        <div>
          <label class="block font-bold text-slate-700 mb-1">ผลการปฏิบัติงานและร่องรอยหลักฐานเชิงประจักษ์: *</label>
          <textarea id="edit-ind-details" rows="4" class="w-full p-2.5 rounded-lg border border-slate-300 text-xs leading-relaxed" placeholder="อธิบายกิจกรรม นวัตกรรม หรือผลลัพธ์ที่เกิดขึ้น">${item.details || ''}</textarea>
        </div>

        <!-- Image Management Section with Captions -->
        <div class="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200/80 space-y-3">
          <label class="block font-bold text-amber-900 flex items-center gap-1.5 text-xs">
            <i data-lucide="camera" class="w-4 h-4 text-amber-600"></i> จัดการรูปภาพและคำบรรยายใต้ภาพสำหรับตัวชี้วัด ${item.code}:
          </label>
          
          <div class="space-y-1">
            <label class="block text-[11px] font-semibold text-slate-700">1. อัปโหลดรูปภาพจากคอมพิวเตอร์ / มือถือ (เลือกหลายรูปพร้อมกันได้):</label>
            <input type="file" id="ind-file-input" multiple accept="image/*" class="text-xs file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-100 file:text-amber-900 hover:file:bg-amber-200">
          </div>

          <div class="space-y-1 pt-1">
            <label class="block text-[11px] font-semibold text-slate-700">2. หรือวาง URL ลิงก์รูปภาพ:</label>
            <div class="flex gap-2">
              <input id="ind-url-input" class="flex-1 p-2 rounded-lg border border-slate-300 bg-white text-xs" placeholder="https://images.unsplash.com/...">
              <button type="button" id="btn-add-ind-url" class="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-navy-950 font-bold rounded-lg text-xs cursor-pointer shadow-2xs">
                + เพิ่มรูป
              </button>
            </div>
          </div>

          <div class="pt-2">
            <label class="block font-bold text-slate-700 mb-1">รายการรูปภาพและคำบรรยาย:</label>
            <div id="indicator-images-container">
              ${renderImageListHtml()}
            </div>
          </div>
        </div>
      </div>
    `,
    width: "740px",
    showCancelButton: true,
    confirmButtonText: "บันทึกตัวชี้วัดนี้",
    cancelButtonText: "ยกเลิก",
    confirmButtonColor: "#d97706",
    cancelButtonColor: "#64748b",
    didOpen: () => {
      initIcons();
      const fileInput = document.getElementById("ind-file-input");
      const urlInput = document.getElementById("ind-url-input");
      const addUrlBtn = document.getElementById("btn-add-ind-url");
      const container = document.getElementById("indicator-images-container");

      function syncCaptions() {
        currentImages.forEach((img, idx) => {
          const input = document.getElementById(`img-caption-${idx}`);
          if (input) img.caption = input.value.trim();
        });
      }

      if (fileInput) {
        fileInput.addEventListener("change", async (e) => {
          syncCaptions();
          const files = Array.from(e.target.files);
          for (const file of files) {
            const compressed = await window.compressImage(file, 1280, 0.82);
            currentImages.push({
              url: compressed,
              caption: file.name ? `ภาพกิจกรรม: ${file.name.replace(/\.[^/.]+$/, "")}` : "ภาพกิจกรรมประกอบการประเมิน"
            });
          }
          if (container) {
            container.innerHTML = renderImageListHtml();
            initIcons();
          }
        });
      }

      if (addUrlBtn && urlInput) {
        addUrlBtn.addEventListener("click", () => {
          syncCaptions();
          const url = urlInput.value.trim();
          if (url) {
            currentImages.push({
              url: url,
              caption: "ภาพกิจกรรมประกอบการประเมิน"
            });
            urlInput.value = "";
            if (container) {
              container.innerHTML = renderImageListHtml();
              initIcons();
            }
          }
        });
      }
    },
    preConfirm: () => {
      const title = document.getElementById("edit-ind-title").value.trim();
      const details = document.getElementById("edit-ind-details").value.trim();

      if (!title) {
        Swal.showValidationMessage("กรุณาระบุชื่อตัวชี้วัด");
        return false;
      }

      // Collect updated captions
      const finalImages = currentImages.map((img, idx) => {
        const input = document.getElementById(`img-caption-${idx}`);
        return {
          url: img.url,
          caption: input ? input.value.trim() : (img.caption || "")
        };
      });

      return {
        title,
        details,
        images: finalImages
      };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      // Update this indicator inside aspect.items
      const indicators = [...(paRecord.indicators || [])];
      const itemsCopy = [...(indicators[aspectIndex].items || [])];
      
      itemsCopy[itemIndex] = {
        ...itemsCopy[itemIndex],
        title: result.value.title,
        details: result.value.details,
        images: result.value.images
      };

      indicators[aspectIndex] = {
        ...indicators[aspectIndex],
        items: itemsCopy
      };

      window.portfolioStorage.updateItem("paRecords", paId, { indicators });
      
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: `บันทึกข้อมูลตัวชี้วัด ${indCode} สำเร็จ`,
        showConfirmButton: false,
        timer: 1500
      });

      // Re-render main view and reopen aspect modal smoothly on this indicator
      renderCurrentView();
      setTimeout(() => {
        openAspectDetailModal(paId, aspectIndex, indCode);
      }, 200);
    }
  });
}

// ==========================================
// PA Indicator 3.1 Training & Development Table Management
// ==========================================
function getNextThaiNumber(num) {
  const thaiDigits = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
  return String(num).split('').map(d => thaiDigits[d] !== undefined ? thaiDigits[d] : d).join('');
}
window.getNextThaiNumber = getNextThaiNumber;

function openCertificateLightbox(certUrl, title, date, organizer, pdfUrl, isPLC = false) {
  if (!certUrl) {
    if (pdfUrl) {
      openDocumentPreview(title, pdfUrl);
    }
    return;
  }
  const cleanTitle = title || (isPLC ? "หลักฐาน/ภาพกิจกรรม PLC" : "หลักฐาน/เกียรติบัตรการอบรม");
  const badgeTitle = isPLC ? "หลักฐาน / ภาพกิจกรรม / บันทึก PLC" : "หลักฐาน / เกียรติบัตรการพัฒนาตนเอง";
  const dateTitle = isPLC ? "พ.ศ." : "วันที่";
  const orgTitle = isPLC ? "หน่วยงาน/กลุ่มสาระ" : "หน่วยงาน";

  Swal.fire({
    title: `<div class="text-left font-prompt space-y-1.5 pt-1">
      <div class="flex items-center gap-2">
        <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 text-xs font-bold shadow-2xs">
          <i data-lucide="award" class="w-3.5 h-3.5 text-amber-700"></i> ${badgeTitle}
        </span>
      </div>
      <h4 class="text-sm sm:text-base font-bold text-slate-800 leading-snug">${cleanTitle}</h4>
      <p class="text-xs text-slate-500 font-sarabun flex items-center gap-2 flex-wrap">
        <span>📅 ${dateTitle}: <strong class="text-slate-700">${date || '-'}</strong></span>
        <span>•</span>
        <span>🏢 ${orgTitle}: <strong class="text-slate-700">${organizer || '-'}</strong></span>
      </p>
    </div>`,
    imageUrl: certUrl,
    imageAlt: cleanTitle,
    imageWidth: "100%",
    showConfirmButton: !!pdfUrl,
    confirmButtonText: "📄 เปิดดูเอกสาร PDF เต็ม",
    confirmButtonColor: "#2563eb",
    showCloseButton: true,
    background: "#ffffff",
    customClass: {
      popup: "rounded-3xl p-4 sm:p-5 max-w-4xl border border-slate-200 shadow-2xl",
      image: "rounded-2xl max-h-[75vh] object-contain shadow-sm border border-slate-200"
    },
    didOpen: () => initIcons()
  }).then((result) => {
    if (result.isConfirmed && pdfUrl) {
      openDocumentPreview(cleanTitle, pdfUrl);
    }
  });
}
window.openCertificateLightbox = openCertificateLightbox;

function openAddTrainingModal(paId, aspectIndex, indCode) {
  const data = window.portfolioStorage.getData();
  const paRecord = data.paRecords?.find(p => String(p.id) === String(paId));
  if (!paRecord) return;
  const aspect = paRecord.indicators?.[aspectIndex];
  if (!aspect) return;
  const item = aspect.items?.find(it => it.code === indCode);
  if (!item) return;

  const isPLC = indCode === "3.2";
  const currentTrainings = item.trainings || [];
  const nextNo = getNextThaiNumber(currentTrainings.length + 1);

  const modalTitle = isPLC ? `เพิ่มรายการแลกเปลี่ยนเรียนรู้ทางวิชาชีพ (PLC) (ตัวชี้วัด ${indCode})` : `เพิ่มรายการอบรม / พัฒนาตนเอง (ตัวชี้วัด ${indCode})`;
  const dateLabel = isPLC ? "พ.ศ.: *" : "วันที่เข้าอบรม: *";
  const datePlaceholder = isPLC ? "เช่น ๒๕๖๘ หรือ 2568" : "เช่น ๑๙ ธ.ค. ๖๘ หรือ 19 ธ.ค. 2568";
  const defaultDate = isPLC ? "๒๕๖๘" : "";
  const titleLabel = isPLC ? "ชื่อกิจกรรม / หัวข้อการแลกเปลี่ยนเรียนรู้ (PLC): *" : "ชื่อกิจกรรมที่เข้าอบรม / พัฒนาตนเอง: *";
  const titlePlaceholder = isPLC ? "เช่น การขับเคลื่อนกระบวนการชุมชนแห่งการเรียนรู้ทางวิชาชีพ (PLC) เพื่อยกระดับผลสัมฤทธิ์ทางการเรียนและการคิดเชิงคำนวณ" : "เช่น การอบรมเชิงปฏิบัติการวิทยากรแกนนำการจัดการเรียนรู้ผ่านฐานการเรียนรู้ตามหลักปรัชญาของเศรษฐกิจพอเพียง จำนวน ๖ ชั่วโมง";
  const orgLabel = isPLC ? "หน่วยงาน / สถานศึกษา / กลุ่มสาระ: *" : "หน่วยงานที่จัดอบรม: *";
  const orgPlaceholder = isPLC ? "เช่น โรงเรียนวัดบางปูน หรือ สพป.สิงห์บุรี" : "เช่น สพป.สิงห์บุรี หรือ สพฐ.";
  const uploadLabel = isPLC ? "รูปภาพกิจกรรม / ภาพบันทึก PLC / เกียรติบัตร (เลือกไฟล์จากเครื่อง):" : "รูปภาพเกียรติบัตร / รูปถ่ายหลักฐาน (เลือกไฟล์จากเครื่อง):";

  Swal.fire({
    title: `<span class="text-base font-bold font-prompt text-slate-800 flex items-center justify-center gap-2">
      <i data-lucide="plus-circle" class="w-5 h-5 text-amber-600"></i> ${modalTitle}
    </span>`,
    html: `
      <div class="space-y-3.5 text-left font-sarabun text-xs max-h-[75vh] overflow-y-auto p-1">
        <!-- Quick Jump to Batch Mode -->
        <div class="p-2.5 bg-blue-50/90 rounded-xl border border-blue-200 flex items-center justify-between gap-2 shadow-2xs">
          <span class="text-blue-900 text-[11px] font-prompt font-semibold flex items-center gap-1.5">
            <i data-lucide="layers" class="w-4 h-4 text-blue-600"></i> มีเกียรติบัตร / ภาพหลายใบต้องการเพิ่มพร้อมกัน?
          </span>
          <button type="button" onclick="Swal.close(); setTimeout(() => openBatchAddTrainingModal('${paId}', ${aspectIndex}, '${indCode}'), 120);" class="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold font-prompt cursor-pointer transition-all shadow-xs shrink-0 flex items-center gap-1">
            <i data-lucide="sparkles" class="w-3 h-3 text-amber-300"></i>
            <span>เปิดโหมดเพิ่มหลายรายการ</span>
          </button>
        </div>

        <div class="grid grid-cols-4 gap-2">
          <div class="col-span-1">
            <label class="block font-bold text-slate-700 mb-1 font-prompt">ลำดับที่ (ที่): *</label>
            <input id="tr-no" class="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-center text-sm text-amber-900 bg-amber-50/50" value="${nextNo}">
          </div>
          <div class="col-span-3">
            <label class="block font-bold text-slate-700 mb-1 font-prompt">${dateLabel}</label>
            <input id="tr-date" class="w-full p-2.5 rounded-xl border border-slate-300 font-prompt text-xs" placeholder="${datePlaceholder}" value="${defaultDate}">
          </div>
        </div>

        <div>
          <label class="block font-bold text-slate-700 mb-1 font-prompt">${titleLabel}</label>
          <textarea id="tr-title" rows="3" class="w-full p-2.5 rounded-xl border border-slate-300 font-sarabun text-xs leading-relaxed" placeholder="${titlePlaceholder}"></textarea>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block font-bold text-slate-700 mb-1 font-prompt">${orgLabel}</label>
            <input id="tr-organizer" class="w-full p-2.5 rounded-xl border border-slate-300 font-prompt text-xs" placeholder="${orgPlaceholder}" value="${isPLC ? 'โรงเรียนวัดบางปูน' : ''}">
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1 font-prompt">ข้อความประเภทหลักฐาน:</label>
            <input id="tr-evidence-type" class="w-full p-2.5 rounded-xl border border-slate-300 font-prompt text-xs" value="เกียรติบัตร/รูปภาพ" placeholder="เกียรติบัตร/รูปภาพ">
          </div>
        </div>

        <!-- Certificate / Photo Upload Section with Compression -->
        <div class="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-2.5">
          <div class="flex items-center justify-between">
            <label class="block font-bold text-amber-950 font-prompt text-xs flex items-center gap-1.5">
              <i data-lucide="image" class="w-4 h-4 text-amber-600"></i> ${uploadLabel}
            </label>
            <span class="text-[11px] text-amber-800 font-semibold bg-amber-200/60 px-2 py-0.5 rounded-md">บีบอัดภาพอัตโนมัติ</span>
          </div>

          <input type="file" id="tr-file-input" accept="image/*" class="w-full text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-600 file:text-white hover:file:bg-amber-700 cursor-pointer">
          <input id="tr-cert-url" class="w-full p-2 text-[11px] rounded-lg border border-slate-300 font-mono bg-white" placeholder="หรือใส่ลิงก์รูปภาพ URL https://...">

          <div class="flex items-center gap-3 pt-1">
            <span class="text-[11px] text-slate-500 font-prompt">พรีวิวรูปภาพ:</span>
            <img id="tr-preview-img" src="${isPLC ? 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80' : 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80'}" class="w-20 h-14 rounded-lg object-cover border border-slate-300 shadow-xs">
          </div>
        </div>

        <div>
          <label class="block font-bold text-slate-700 mb-1 font-prompt">ลิงก์เอกสาร PDF / Google Drive (ถ้ามี / ไม่บังคับ):</label>
          <input id="tr-pdf-url" class="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-xs" placeholder="https://drive.google.com/file/d/...">
        </div>
      </div>
    `,
    width: "640px",
    showCancelButton: true,
    confirmButtonText: "💾 บันทึกรายการ",
    cancelButtonText: "ยกเลิก",
    confirmButtonColor: "#d97706",
    cancelButtonColor: "#64748b",
    didOpen: () => {
      initIcons();
      const fileInput = document.getElementById("tr-file-input");
      const urlInput = document.getElementById("tr-cert-url");
      const previewImg = document.getElementById("tr-preview-img");

      if (fileInput) {
        fileInput.addEventListener("change", async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const compressed = await window.compressImage(file, 1600, 0.85);
          if (urlInput) urlInput.value = compressed;
          if (previewImg) previewImg.src = compressed;
        });
      }

      if (urlInput) {
        urlInput.addEventListener("input", (e) => {
          if (previewImg && e.target.value.trim()) previewImg.src = e.target.value.trim();
        });
      }
    },
    preConfirm: () => {
      const no = document.getElementById("tr-no").value.trim();
      const date = document.getElementById("tr-date").value.trim();
      const title = document.getElementById("tr-title").value.trim();
      const organizer = document.getElementById("tr-organizer").value.trim();
      const evidenceType = document.getElementById("tr-evidence-type").value.trim();
      const certificateUrl = document.getElementById("tr-cert-url").value.trim();
      const pdfUrl = document.getElementById("tr-pdf-url").value.trim();

      if (!title) {
        Swal.showValidationMessage(isPLC ? "กรุณากรอกชื่อกิจกรรม / หัวข้อ PLC" : "กรุณากรอกชื่อกิจกรรมที่เข้าอบรม/พัฒนา");
        return false;
      }

      return {
        id: `tr-${Date.now()}`,
        no: no || "๑",
        title,
        date: date || "-",
        organizer: organizer || "-",
        evidenceType: evidenceType || "เกียรติบัตร/รูปภาพ",
        certificateUrl,
        pdfUrl,
        images: certificateUrl ? [{ url: certificateUrl, caption: `${isPLC ? 'กิจกรรม PLC' : 'เกียรติบัตร'}: ${title}` }] : []
      };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      const indicators = [...(paRecord.indicators || [])];
      const itemsCopy = [...(indicators[aspectIndex].items || [])];
      const targetItem = itemsCopy.find(it => it.code === indCode);
      if (targetItem) {
        if (!targetItem.trainings) targetItem.trainings = [];
        targetItem.trainings.push(result.value);
        indicators[aspectIndex] = { ...indicators[aspectIndex], items: itemsCopy };
        window.portfolioStorage.updateItem("paRecords", paId, { indicators });
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: isPLC ? "เพิ่มรายการ PLC สำเร็จ" : "เพิ่มรายการอบรมสำเร็จ",
          showConfirmButton: false,
          timer: 1500
        });
        renderCurrentView();
        setTimeout(() => openAspectDetailModal(paId, aspectIndex, indCode), 200);
      }
    }
  });
}
window.openAddTrainingModal = openAddTrainingModal;

// ==========================================
// Batch / Multi Add Training & PLC Modal
// ==========================================
function openBatchAddTrainingModal(paId, aspectIndex, indCode) {
  const data = window.portfolioStorage.getData();
  const paRecord = data.paRecords?.find(p => String(p.id) === String(paId));
  if (!paRecord) return;
  const aspect = paRecord.indicators?.[aspectIndex];
  if (!aspect) return;
  const item = aspect.items?.find(it => it.code === indCode);
  if (!item) return;

  const isPLC = indCode === "3.2";
  const currentTrainings = item.trainings || [];
  let startIndex = currentTrainings.length;

  const modalTitle = isPLC ? `เพิ่มรายการแลกเปลี่ยนเรียนรู้ (PLC) หลายรายการ (ตัวชี้วัด ${indCode})` : `เพิ่มรายการอบรม / พัฒนาตนเอง หลายรายการ (ตัวชี้วัด ${indCode})`;
  const dateLabel = isPLC ? "พ.ศ.: *" : "วันที่เข้าอบรม: *";
  const datePlaceholder = isPLC ? "เช่น ๒๕๖๘" : "เช่น ๑๙ ธ.ค. ๖๘";
  const defaultDate = isPLC ? "๒๕๖๘" : "";
  const titleLabel = isPLC ? "ชื่อกิจกรรม / หัวข้อ PLC: *" : "ชื่อกิจกรรมที่เข้าอบรม: *";
  const titlePlaceholder = isPLC ? "ระบุชื่อกิจกรรมการแลกเปลี่ยนเรียนรู้ PLC" : "ระบุชื่อหลักสูตร / กิจกรรมการอบรม";
  const orgLabel = isPLC ? "หน่วยงาน / กลุ่มสาระ: *" : "หน่วยงานที่จัด: *";
  const defaultOrg = isPLC ? "โรงเรียนวัดบางปูน" : "สพป.สิงห์บุรี";
  const orgPlaceholder = isPLC ? "เช่น โรงเรียนวัดบางปูน" : "เช่น สพป.สิงห์บุรี หรือ สพฐ.";

  let rowCounter = 0;

  Swal.fire({
    title: `<span class="text-base font-bold font-prompt text-slate-800 flex items-center justify-center gap-2">
      <i data-lucide="layers" class="w-5 h-5 text-blue-600"></i> ${modalTitle}
    </span>`,
    html: `
      <div class="space-y-4 text-left font-sarabun text-xs max-h-[75vh] overflow-y-auto p-1">
        <!-- Multi-File Upload Box -->
        <div class="p-4 bg-gradient-to-r from-blue-50 to-indigo-50/80 rounded-2xl border-2 border-dashed border-blue-300 text-center space-y-2.5">
          <div class="flex items-center justify-center gap-2 text-blue-900 font-prompt font-bold text-xs">
            <i data-lucide="upload-cloud" class="w-5 h-5 text-blue-600"></i>
            <span>เลือกรูปภาพเกียรติบัตร / ภาพกิจกรรมหลายไฟล์พร้อมกัน</span>
          </div>
          <p class="text-[11px] text-slate-500 font-sarabun">
            สามารถเลือกได้พร้อมกันหลายภาพ (เช่น 5, 10, 20 ภาพ) ระบบจะสร้างแถวรายการให้อัตโนมัติพร้อมบีบอัดภาพให้อย่างรวดเร็ว
          </p>
          <div class="flex items-center justify-center gap-2">
            <label class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold font-prompt cursor-pointer transition-all shadow-xs">
              <i data-lucide="image-plus" class="w-4 h-4"></i>
              <span>📂 เลือกไฟล์รูปภาพทั้งหมดจากเครื่อง</span>
              <input type="file" id="batch-multi-file-input" multiple accept="image/*" class="hidden">
            </label>
          </div>
          <div id="batch-upload-status" class="hidden text-[11px] font-bold text-blue-700 animate-pulse"></div>
        </div>

        <!-- Quick-Fill Defaults Toolbar -->
        <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <div class="flex items-center justify-between">
            <span class="font-bold text-slate-700 text-[11px] font-prompt flex items-center gap-1">
              <i data-lucide="sparkles" class="w-3.5 h-3.5 text-amber-500"></i> กรอกข้อมูลร่วมกัน (นำไปใส่ทุกแถวได้ใน 1 คลิก):
            </span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label class="block text-[10px] font-bold text-slate-500 font-prompt mb-0.5">${dateLabel}</label>
              <input id="batch-global-date" class="w-full p-2 text-xs rounded-lg border border-slate-300 font-prompt bg-white" value="${defaultDate}" placeholder="${datePlaceholder}">
            </div>
            <div>
              <label class="block text-[10px] font-bold text-slate-500 font-prompt mb-0.5">${orgLabel}</label>
              <input id="batch-global-org" class="w-full p-2 text-xs rounded-lg border border-slate-300 font-prompt bg-white" value="${defaultOrg}" placeholder="${orgPlaceholder}">
            </div>
            <div class="flex items-end">
              <button type="button" id="btn-batch-apply-defaults" class="w-full p-2 bg-amber-500 hover:bg-amber-600 text-navy-950 font-bold font-prompt text-xs rounded-lg transition-all shadow-2xs flex items-center justify-center gap-1 cursor-pointer">
                <i data-lucide="check" class="w-3.5 h-3.5"></i> นำไปใช้กับทุกแถว
              </button>
            </div>
          </div>
        </div>

        <!-- List of Batch Rows Container -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="font-bold text-slate-800 text-xs font-prompt flex items-center gap-1.5">
              <i data-lucide="list" class="w-4 h-4 text-amber-600"></i> รายการที่จะเพิ่ม (<span id="batch-rows-count">0</span> รายการ):
            </span>
            <button type="button" id="btn-batch-add-blank" class="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer">
              <i data-lucide="plus" class="w-3.5 h-3.5"></i> เพิ่มแถวเปล่า
            </button>
          </div>

          <div id="batch-rows-list" class="space-y-3">
            <!-- Dynamic Row Cards will be inserted here -->
          </div>
        </div>
      </div>
    `,
    width: "780px",
    showCancelButton: true,
    confirmButtonText: "💾 บันทึกรายการทั้งหมด",
    cancelButtonText: "ยกเลิก",
    confirmButtonColor: "#2563eb",
    cancelButtonColor: "#64748b",
    didOpen: () => {
      initIcons();
      const multiFileInput = document.getElementById("batch-multi-file-input");
      const rowsList = document.getElementById("batch-rows-list");
      const rowsCountSpan = document.getElementById("batch-rows-count");
      const uploadStatus = document.getElementById("batch-upload-status");
      const addBlankBtn = document.getElementById("btn-batch-add-blank");
      const applyDefaultsBtn = document.getElementById("btn-batch-apply-defaults");

      function updateCounts() {
        const count = rowsList ? rowsList.querySelectorAll(".batch-row-item").length : 0;
        if (rowsCountSpan) rowsCountSpan.innerText = count;
      }

      function renderRow(data = {}) {
        rowCounter++;
        const currentIdx = rowsList.querySelectorAll(".batch-row-item").length;
        const thaiNo = getNextThaiNumber(startIndex + currentIdx + 1);
        const rowId = `batch-row-${rowCounter}`;

        const rowDiv = document.createElement("div");
        rowDiv.id = rowId;
        rowDiv.className = "batch-row-item p-3.5 bg-white rounded-2xl border border-slate-300 shadow-2xs hover:border-blue-400 transition-all space-y-2.5";
        rowDiv.innerHTML = `
          <div class="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <div class="flex items-center gap-2">
              <span class="text-[11px] font-bold text-slate-500 font-prompt">ที่:</span>
              <input type="text" class="row-no w-12 p-1 text-center font-bold text-xs text-amber-900 bg-amber-50 rounded-lg border border-slate-300" value="${data.no || thaiNo}">
              <span class="text-xs font-bold text-slate-800 font-prompt">รายการที่ ${currentIdx + 1}</span>
            </div>
            <button type="button" class="btn-remove-row text-slate-400 hover:text-rose-600 p-1 rounded-lg transition-colors cursor-pointer" title="ลบรายการนี้">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>

          <div class="flex flex-col sm:flex-row gap-3">
            <!-- Thumbnail Box -->
            <div class="relative w-full sm:w-28 h-24 sm:h-auto shrink-0 bg-slate-900 rounded-xl overflow-hidden border border-slate-300 flex items-center justify-center group/img">
              <img src="${data.certificateUrl || (isPLC ? 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80' : 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80')}" class="row-img-preview w-full h-full object-cover">
              <input type="hidden" class="row-cert-url" value="${data.certificateUrl || ''}">
              <label class="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white text-[10px] font-bold cursor-pointer backdrop-blur-xs">
                <i data-lucide="camera" class="w-4 h-4 text-amber-400"></i>
                <span>เปลี่ยนรูป</span>
                <input type="file" accept="image/*" class="row-single-file-input hidden">
              </label>
            </div>

            <!-- Fields Container -->
            <div class="grow space-y-2">
              <div>
                <label class="block text-[11px] font-bold text-slate-700 font-prompt mb-0.5">${titleLabel}</label>
                <input type="text" class="row-title w-full p-2 rounded-lg border border-slate-300 font-sarabun text-xs" value="${escapeHtml(data.title || '')}" placeholder="${titlePlaceholder}">
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label class="block text-[10px] font-bold text-slate-600 font-prompt mb-0.5">${dateLabel}</label>
                  <input type="text" class="row-date w-full p-1.5 rounded-lg border border-slate-300 font-prompt text-xs" value="${escapeHtml(data.date || defaultDate)}" placeholder="${datePlaceholder}">
                </div>
                <div>
                  <label class="block text-[10px] font-bold text-slate-600 font-prompt mb-0.5">${orgLabel}</label>
                  <input type="text" class="row-organizer w-full p-1.5 rounded-lg border border-slate-300 font-prompt text-xs" value="${escapeHtml(data.organizer || defaultOrg)}" placeholder="${orgPlaceholder}">
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label class="block text-[10px] font-bold text-slate-600 font-prompt mb-0.5">ประเภทหลักฐาน:</label>
                  <input type="text" class="row-evidence w-full p-1.5 rounded-lg border border-slate-300 font-prompt text-xs" value="${escapeHtml(data.evidenceType || 'เกียรติบัตร/รูปภาพ')}">
                </div>
                <div>
                  <label class="block text-[10px] font-bold text-slate-600 font-prompt mb-0.5">ลิงก์ PDF (ถ้ามี):</label>
                  <input type="text" class="row-pdf w-full p-1.5 rounded-lg border border-slate-300 font-mono text-xs" value="${escapeHtml(data.pdfUrl || '')}" placeholder="https://drive.google.com/...">
                </div>
              </div>
            </div>
          </div>
        `;

        rowsList.appendChild(rowDiv);
        initIcons();

        // Bind single file replace per row
        const singleFileInput = rowDiv.querySelector(".row-single-file-input");
        const hiddenCertUrl = rowDiv.querySelector(".row-cert-url");
        const imgPreview = rowDiv.querySelector(".row-img-preview");
        if (singleFileInput) {
          singleFileInput.addEventListener("change", async (e) => {
            const file = e.target.files?.[0];
            if (file) {
              const compressed = await window.compressImage(file, 1600, 0.85);
              if (hiddenCertUrl) hiddenCertUrl.value = compressed;
              if (imgPreview) imgPreview.src = compressed;
            }
          });
        }

        // Bind remove row
        const removeBtn = rowDiv.querySelector(".btn-remove-row");
        if (removeBtn) {
          removeBtn.addEventListener("click", () => {
            rowDiv.remove();
            // re-index remaining rows thai numbers
            rowsList.querySelectorAll(".batch-row-item").forEach((itemEl, idx) => {
              const noInput = itemEl.querySelector(".row-no");
              if (noInput) noInput.value = getNextThaiNumber(startIndex + idx + 1);
            });
            updateCounts();
          });
        }

        updateCounts();
      }

      // Add initial 1 blank row if empty
      renderRow();

      // Handle Multi-file Upload
      if (multiFileInput) {
        multiFileInput.addEventListener("change", async (e) => {
          const files = Array.from(e.target.files || []);
          if (files.length === 0) return;

          if (uploadStatus) {
            uploadStatus.classList.remove("hidden");
            uploadStatus.innerText = `⏳ กำลังบีบอัดและเพิ่มรูปภาพ ${files.length} รายการ...`;
          }

          // If there is only 1 blank row with no title and no uploaded image, remove it first
          const existingRows = rowsList.querySelectorAll(".batch-row-item");
          if (existingRows.length === 1) {
            const firstTitle = existingRows[0].querySelector(".row-title")?.value.trim();
            const firstCert = existingRows[0].querySelector(".row-cert-url")?.value.trim();
            if (!firstTitle && !firstCert) {
              existingRows[0].remove();
            }
          }

          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const compressed = await window.compressImage(file, 1600, 0.85);
            const rawName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
            const globalDate = document.getElementById("batch-global-date")?.value.trim() || defaultDate;
            const globalOrg = document.getElementById("batch-global-org")?.value.trim() || defaultOrg;

            renderRow({
              title: rawName,
              date: globalDate,
              organizer: globalOrg,
              certificateUrl: compressed,
              evidenceType: "เกียรติบัตร/รูปภาพ"
            });
          }

          if (uploadStatus) {
            uploadStatus.classList.add("hidden");
          }
          multiFileInput.value = "";
        });
      }

      // Add Blank Row Button
      if (addBlankBtn) {
        addBlankBtn.addEventListener("click", () => {
          const globalDate = document.getElementById("batch-global-date")?.value.trim() || defaultDate;
          const globalOrg = document.getElementById("batch-global-org")?.value.trim() || defaultOrg;
          renderRow({ date: globalDate, organizer: globalOrg });
        });
      }

      // Apply Defaults to All Rows
      if (applyDefaultsBtn) {
        applyDefaultsBtn.addEventListener("click", () => {
          const globalDate = document.getElementById("batch-global-date")?.value.trim() || "";
          const globalOrg = document.getElementById("batch-global-org")?.value.trim() || "";
          rowsList.querySelectorAll(".batch-row-item").forEach(rowEl => {
            if (globalDate) {
              const dateInput = rowEl.querySelector(".row-date");
              if (dateInput) dateInput.value = globalDate;
            }
            if (globalOrg) {
              const orgInput = rowEl.querySelector(".row-organizer");
              if (orgInput) orgInput.value = globalOrg;
            }
          });
          applyDefaultsBtn.innerText = "✅ อัปเดตครบทุกแถวแล้ว!";
          setTimeout(() => {
            applyDefaultsBtn.innerHTML = `<i data-lucide="check" class="w-3.5 h-3.5"></i> นำไปใช้กับทุกแถว`;
            initIcons();
          }, 1500);
        });
      }
    },
    preConfirm: () => {
      const rowsList = document.getElementById("batch-rows-list");
      const rowEls = rowsList ? Array.from(rowsList.querySelectorAll(".batch-row-item")) : [];
      if (rowEls.length === 0) {
        Swal.showValidationMessage("กรุณาเพิ่มอย่างน้อย 1 รายการ");
        return false;
      }

      const results = [];
      for (let i = 0; i < rowEls.length; i++) {
        const r = rowEls[i];
        const no = r.querySelector(".row-no")?.value.trim() || getNextThaiNumber(startIndex + i + 1);
        const title = r.querySelector(".row-title")?.value.trim();
        const date = r.querySelector(".row-date")?.value.trim() || "-";
        const organizer = r.querySelector(".row-organizer")?.value.trim() || "-";
        const evidenceType = r.querySelector(".row-evidence")?.value.trim() || "เกียรติบัตร/รูปภาพ";
        const certificateUrl = r.querySelector(".row-cert-url")?.value.trim() || "";
        const pdfUrl = r.querySelector(".row-pdf")?.value.trim() || "";

        if (!title && !certificateUrl) {
          // Skip completely empty row if multiple rows exist
          if (rowEls.length > 1) continue;
          Swal.showValidationMessage(`กรุณากรอกชื่อกิจกรรมในแถวที่ ${i + 1}`);
          return false;
        }

        const finalTitle = title || `กิจกรรม${isPLC ? 'แลกเปลี่ยนเรียนรู้ PLC' : 'การอบรม'} ลำดับที่ ${no}`;

        results.push({
          id: `tr-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
          no,
          title: finalTitle,
          date,
          organizer,
          evidenceType,
          certificateUrl,
          pdfUrl,
          images: certificateUrl ? [{ url: certificateUrl, caption: `${isPLC ? 'กิจกรรม PLC' : 'เกียรติบัตร'}: ${finalTitle}` }] : []
        });
      }

      if (results.length === 0) {
        Swal.showValidationMessage("กรุณากรอกชื่อกิจกรรมหรือเลือกรูปภาพอย่างน้อย 1 รายการ");
        return false;
      }

      return results;
    }
  }).then((result) => {
    if (result.isConfirmed && result.value) {
      const newItems = result.value;
      const indicators = [...(paRecord.indicators || [])];
      const itemsCopy = [...(indicators[aspectIndex].items || [])];
      const targetItem = itemsCopy.find(it => it.code === indCode);
      if (targetItem) {
        if (!targetItem.trainings) targetItem.trainings = [];
        targetItem.trainings.push(...newItems);
        indicators[aspectIndex] = { ...indicators[aspectIndex], items: itemsCopy };
        window.portfolioStorage.updateItem("paRecords", paId, { indicators });
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: `เพิ่ม ${newItems.length} รายการเรียบร้อยแล้ว`,
          showConfirmButton: false,
          timer: 1800
        });
        renderCurrentView();
        setTimeout(() => openAspectDetailModal(paId, aspectIndex, indCode), 200);
      }
    }
  });
}
window.openBatchAddTrainingModal = openBatchAddTrainingModal;

function openEditTrainingModal(paId, aspectIndex, indCode, trainingId) {
  const data = window.portfolioStorage.getData();
  const paRecord = data.paRecords?.find(p => String(p.id) === String(paId));
  if (!paRecord) return;
  const aspect = paRecord.indicators?.[aspectIndex];
  if (!aspect) return;
  const item = aspect.items?.find(it => it.code === indCode);
  if (!item) return;

  const isPLC = indCode === "3.2";
  const training = (item.trainings || []).find(t => String(t.id) === String(trainingId));
  if (!training) return;

  const currentCert = training.certificateUrl || training.images?.[0]?.url || "";

  const modalTitle = isPLC ? `แก้ไขรายการ PLC (ลำดับที่ ${training.no || ''})` : `แก้ไขรายการอบรม (ลำดับที่ ${training.no || ''})`;
  const dateLabel = isPLC ? "พ.ศ.: *" : "วันที่เข้าอบรม: *";
  const titleLabel = isPLC ? "ชื่อกิจกรรม / หัวข้อการแลกเปลี่ยนเรียนรู้ (PLC): *" : "ชื่อกิจกรรมที่เข้าอบรม / พัฒนาตนเอง: *";
  const orgLabel = isPLC ? "หน่วยงาน / สถานศึกษา / กลุ่มสาระ: *" : "หน่วยงานที่จัดอบรม: *";
  const uploadLabel = isPLC ? "รูปภาพกิจกรรม / ภาพบันทึก PLC / เกียรติบัตร (เลือกไฟล์จากเครื่อง):" : "รูปภาพเกียรติบัตร / รูปถ่ายหลักฐาน (เลือกไฟล์จากเครื่อง):";

  Swal.fire({
    title: `<span class="text-base font-bold font-prompt text-slate-800 flex items-center justify-center gap-2">
      <i data-lucide="edit-3" class="w-5 h-5 text-amber-600"></i> ${modalTitle}
    </span>`,
    html: `
      <div class="space-y-3.5 text-left font-sarabun text-xs max-h-[75vh] overflow-y-auto p-1">
        <div class="grid grid-cols-4 gap-2">
          <div class="col-span-1">
            <label class="block font-bold text-slate-700 mb-1 font-prompt">ลำดับที่ (ที่): *</label>
            <input id="edit-tr-no" class="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-center text-sm text-amber-900 bg-amber-50/50" value="${training.no || ''}">
          </div>
          <div class="col-span-3">
            <label class="block font-bold text-slate-700 mb-1 font-prompt">${dateLabel}</label>
            <input id="edit-tr-date" class="w-full p-2.5 rounded-xl border border-slate-300 font-prompt text-xs" value="${training.date || ''}">
          </div>
        </div>

        <div>
          <label class="block font-bold text-slate-700 mb-1 font-prompt">${titleLabel}</label>
          <textarea id="edit-tr-title" rows="3" class="w-full p-2.5 rounded-xl border border-slate-300 font-sarabun text-xs leading-relaxed">${training.title || ''}</textarea>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block font-bold text-slate-700 mb-1 font-prompt">${orgLabel}</label>
            <input id="edit-tr-organizer" class="w-full p-2.5 rounded-xl border border-slate-300 font-prompt text-xs" value="${training.organizer || ''}">
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1 font-prompt">ข้อความประเภทหลักฐาน:</label>
            <input id="edit-tr-evidence-type" class="w-full p-2.5 rounded-xl border border-slate-300 font-prompt text-xs" value="${training.evidenceType || 'เกียรติบัตร/รูปภาพ'}">
          </div>
        </div>

        <!-- Certificate / Photo Upload Section -->
        <div class="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-2.5">
          <div class="flex items-center justify-between">
            <label class="block font-bold text-amber-950 font-prompt text-xs flex items-center gap-1.5">
              <i data-lucide="image" class="w-4 h-4 text-amber-600"></i> ${uploadLabel}
            </label>
            <span class="text-[11px] text-amber-800 font-semibold bg-amber-200/60 px-2 py-0.5 rounded-md">บีบอัดภาพอัตโนมัติ</span>
          </div>

          <input type="file" id="edit-tr-file-input" accept="image/*" class="w-full text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-600 file:text-white hover:file:bg-amber-700 cursor-pointer">
          <input id="edit-tr-cert-url" class="w-full p-2 text-[11px] rounded-lg border border-slate-300 font-mono bg-white" value="${currentCert}" placeholder="หรือใส่ลิงก์รูปภาพ URL https://...">

          <div class="flex items-center gap-3 pt-1">
            <span class="text-[11px] text-slate-500 font-prompt">พรีวิวรูปภาพ:</span>
            <img id="edit-tr-preview-img" src="${currentCert || 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80'}" class="w-20 h-14 rounded-lg object-cover border border-slate-300 shadow-xs">
          </div>
        </div>

        <div>
          <label class="block font-bold text-slate-700 mb-1 font-prompt">ลิงก์เอกสาร PDF / Google Drive (ถ้ามี / ไม่บังคับ):</label>
          <input id="edit-tr-pdf-url" class="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-xs" value="${training.pdfUrl || ''}">
        </div>
      </div>
    `,
    width: "640px",
    showCancelButton: true,
    confirmButtonText: "💾 บันทึกการแก้ไข",
    cancelButtonText: "ยกเลิก",
    confirmButtonColor: "#d97706",
    cancelButtonColor: "#64748b",
    didOpen: () => {
      initIcons();
      const fileInput = document.getElementById("edit-tr-file-input");
      const urlInput = document.getElementById("edit-tr-cert-url");
      const previewImg = document.getElementById("edit-tr-preview-img");

      if (fileInput) {
        fileInput.addEventListener("change", async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const compressed = await window.compressImage(file, 1600, 0.85);
          if (urlInput) urlInput.value = compressed;
          if (previewImg) previewImg.src = compressed;
        });
      }

      if (urlInput) {
        urlInput.addEventListener("input", (e) => {
          if (previewImg && e.target.value.trim()) previewImg.src = e.target.value.trim();
        });
      }
    },
    preConfirm: () => {
      const no = document.getElementById("edit-tr-no").value.trim();
      const date = document.getElementById("edit-tr-date").value.trim();
      const title = document.getElementById("edit-tr-title").value.trim();
      const organizer = document.getElementById("edit-tr-organizer").value.trim();
      const evidenceType = document.getElementById("edit-tr-evidence-type").value.trim();
      const certificateUrl = document.getElementById("edit-tr-cert-url").value.trim();
      const pdfUrl = document.getElementById("edit-tr-pdf-url").value.trim();

      if (!title) {
        Swal.showValidationMessage(isPLC ? "กรุณากรอกชื่อกิจกรรม / หัวข้อ PLC" : "กรุณากรอกชื่อกิจกรรมที่เข้าอบรม/พัฒนา");
        return false;
      }

      return {
        id: training.id,
        no: no || training.no,
        title,
        date: date || "-",
        organizer: organizer || "-",
        evidenceType: evidenceType || "เกียรติบัตร/รูปภาพ",
        certificateUrl,
        pdfUrl,
        images: certificateUrl ? [{ url: certificateUrl, caption: `${isPLC ? 'กิจกรรม PLC' : 'เกียรติบัตร'}: ${title}` }] : []
      };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      const indicators = [...(paRecord.indicators || [])];
      const itemsCopy = [...(indicators[aspectIndex].items || [])];
      const targetItem = itemsCopy.find(it => it.code === indCode);
      if (targetItem && targetItem.trainings) {
        const trIdx = targetItem.trainings.findIndex(t => String(t.id) === String(trainingId));
        if (trIdx !== -1) {
          targetItem.trainings[trIdx] = result.value;
          indicators[aspectIndex] = { ...indicators[aspectIndex], items: itemsCopy };
          window.portfolioStorage.updateItem("paRecords", paId, { indicators });
          Swal.fire({
            toast: true,
            position: "top-end",
            icon: "success",
            title: isPLC ? "อัปเดตข้อมูล PLC สำเร็จ" : "อัปเดตข้อมูลการอบรมสำเร็จ",
            showConfirmButton: false,
            timer: 1500
          });
          renderCurrentView();
          setTimeout(() => openAspectDetailModal(paId, aspectIndex, indCode), 200);
        }
      }
    }
  });
}
window.openEditTrainingModal = openEditTrainingModal;

function deleteTrainingRecord(paId, aspectIndex, indCode, trainingId) {
  const data = window.portfolioStorage.getData();
  const paRecord = data.paRecords?.find(p => String(p.id) === String(paId));
  if (!paRecord) return;
  const aspect = paRecord.indicators?.[aspectIndex];
  if (!aspect) return;
  const item = aspect.items?.find(it => it.code === indCode);
  if (!item || !item.trainings) return;

  const targetTraining = item.trainings.find(t => String(t.id) === String(trainingId));
  const trTitle = targetTraining ? targetTraining.title : "รายการนี้";

  Swal.fire({
    title: "ยืนยันการลบรายการอบรม?",
    html: `<p class="text-xs font-sarabun text-slate-600">คุณต้องการลบ <strong>"${trTitle}"</strong> ออกจากตารางตัวชี้วัด ${indCode} ใช่หรือไม่?</p>`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "ลบรายการ",
    cancelButtonText: "ยกเลิก",
    confirmButtonColor: "#e11d48",
    cancelButtonColor: "#64748b"
  }).then((result) => {
    if (result.isConfirmed) {
      const indicators = [...(paRecord.indicators || [])];
      const itemsCopy = [...(indicators[aspectIndex].items || [])];
      const targetItem = itemsCopy.find(it => it.code === indCode);
      if (targetItem && targetItem.trainings) {
        targetItem.trainings = targetItem.trainings.filter(t => String(t.id) !== String(trainingId));
        indicators[aspectIndex] = { ...indicators[aspectIndex], items: itemsCopy };
        window.portfolioStorage.updateItem("paRecords", paId, { indicators });
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: "ลบรายการอบรมเรียบร้อยแล้ว",
          showConfirmButton: false,
          timer: 1500
        });
        renderCurrentView();
        setTimeout(() => openAspectDetailModal(paId, aspectIndex, indCode), 200);
      }
    }
  });
}
window.deleteTrainingRecord = deleteTrainingRecord;

// ==========================================
// Image Viewer Modal (Full Screen Photo Preview)
// ==========================================
function openImageViewer(imageUrl, title = "ภาพกิจกรรม") {
  Swal.fire({
    title: `<span class="text-sm font-prompt font-bold text-slate-800">${title}</span>`,
    imageUrl: imageUrl,
    imageAlt: title,
    imageWidth: "100%",
    showConfirmButton: false,
    showCloseButton: true,
    background: "#ffffff",
    customClass: {
      popup: "rounded-3xl p-4 max-w-3xl border border-slate-200 shadow-2xl",
      image: "rounded-2xl max-h-[75vh] object-contain shadow-sm border border-slate-100"
    }
  });
}

// ==========================================
// Backup & Restore / Data Export Center Modal
// ==========================================
function openBackupRestoreModal() {
  Swal.fire({
    title: `<span class="text-base font-bold font-prompt text-slate-800 flex items-center justify-center gap-2">
      <i data-lucide="database" class="w-5 h-5 text-amber-500"></i> ศูนย์ดาวน์โหลดข้อมูล & อัปเดตขึ้นออนไลน์
    </span>`,
    html: `
      <div class="space-y-4 text-left font-sarabun text-xs max-h-[75vh] overflow-y-auto p-1">
        
        <!-- Key Solution Banner for Cross-Browser / Online Sync -->
        <div class="p-4 bg-gradient-to-r from-amber-50 via-amber-100/70 to-orange-50 rounded-2xl border-2 border-amber-300 text-amber-950 space-y-2.5 shadow-sm">
          <div class="flex items-center justify-between">
            <span class="font-bold text-xs font-prompt flex items-center gap-1.5 text-amber-900">
              <i data-lucide="globe-2" class="w-4 h-4 text-amber-700"></i> 1. วิธีทำให้ข้อมูลอัปเดตเมื่อส่งลิงก์ให้ผู้อื่น / เปิดเครื่องอื่น (สำคัญที่สุด ⭐)
            </span>
            <span class="text-[10px] text-amber-900 font-bold bg-amber-200 px-2 py-0.5 rounded-md">อัปเดตออนไลน์</span>
          </div>
          <p class="text-[11px] text-slate-700 leading-relaxed font-sarabun">
            เมื่อคุณครูกรอกข้อมูล เพิ่มรูป หรือแก้ไขผลงานในเครื่องนี้เสร็จแล้ว ให้กดปุ่มด้านล่างเพื่อ <strong>ดาวน์โหลดไฟล์ <code>data.js</code></strong> แล้วนำไปวางในโฟลเดอร์เว็บ จากนั้นอัปโหลดขึ้น <strong>GitHub / Vercel</strong> จะทำให้ทุกคนที่เปิดลิงก์เห็นข้อมูลอัปเดตล่าสุดตรงกันทุกเครื่อง 100% ครับ!
          </p>
          <button onclick="handleExportDataJS()" class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white font-bold font-prompt text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer">
            <i data-lucide="download" class="w-4 h-4"></i>
            <span>📥 ดาวน์โหลดไฟล์ data.js อัปเดตล่าสุด (สำหรับอัปขึ้น GitHub)</span>
          </button>
        </div>

        <div class="space-y-3">
          <!-- Export JSON Backup -->
          <div class="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div class="flex items-center justify-between">
              <span class="font-bold text-slate-800 text-xs font-prompt flex items-center gap-1.5">
                <i data-lucide="download-cloud" class="w-4 h-4 text-blue-600"></i> 2. ดาวน์โหลดไฟล์สำรองข้อมูล (JSON Backup)
              </span>
            </div>
            <p class="text-[11px] text-slate-600">บันทึกข้อมูลทุกอย่างเป็นไฟล์สำรอง .json เก็บไว้ในเครื่องเพื่อนำเข้าในภายหลัง</p>
            <button onclick="handleExportJSON()" class="w-full py-2 px-4 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-bold font-prompt text-xs flex items-center justify-center gap-2 transition-all shadow-2xs cursor-pointer">
              <i data-lucide="file-json" class="w-4 h-4 text-blue-600"></i>
              <span>ดาวน์โหลดไฟล์สำรองข้อมูล (JSON Backup)</span>
            </button>
          </div>
          
          <!-- Import JSON Section -->
          <div class="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
            <span class="font-bold text-slate-800 text-xs font-prompt flex items-center gap-1.5">
              <i data-lucide="upload-cloud" class="w-4 h-4 text-indigo-600"></i> 3. นำเข้าไฟล์สำรองข้อมูล (Import JSON)
            </span>
            <p class="text-[11px] text-slate-600">เลือกไฟล์ .json ที่เคยสำรองไว้ เพื่อดึงข้อมูลกลับมาแสดงผลในเบราว์เซอร์นี้ทันที</p>
            <input type="file" id="import-json-file" accept=".json" class="w-full text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer">
            <button onclick="handleImportJSON()" class="w-full py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold font-prompt text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer">
              <i data-lucide="check" class="w-4 h-4"></i>
              <span>ยืนยันนำเข้าข้อมูล JSON นี้</span>
            </button>
          </div>

          <!-- Reset Default -->
          <div class="pt-1 border-t border-slate-200">
            <button onclick="handleResetDefaultData()" class="w-full py-2 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold font-prompt text-xs flex items-center justify-center gap-2 transition-all cursor-pointer">
              <i data-lucide="rotate-ccw" class="w-4 h-4"></i>
              <span>รีเซ็ตกลับเป็นข้อมูลตัวอย่างเริ่มต้น</span>
            </button>
          </div>
        </div>
      </div>
    `,
    width: "640px",
    showConfirmButton: false,
    showCloseButton: true,
    didOpen: () => initIcons()
  });
}

function handleExportDataJS() {
  window.portfolioStorage.exportDataJS();
  Swal.fire({
    icon: "success",
    title: "ดาวน์โหลดไฟล์ data.js สำเร็จ",
    html: `
      <div class="space-y-2 text-left font-sarabun text-xs text-slate-700">
        <p>นำไฟล์ <strong>data.js</strong> ที่ดาวน์โหลดได้ ไปวางทับในโฟลเดอร์ของเว็บไซต์:</p>
        <div class="p-2.5 bg-slate-100 rounded-xl font-mono text-[11px] text-slate-800 space-y-1">
          <p>📁 TS001/data.js</p>
          <p>📁 TS001/js/data.js</p>
        </div>
        <p class="text-amber-800 font-bold">จากนั้นอัปโหลดไฟล์ทั้งหมดขึ้น GitHub / Vercel ตามปกติ ลิงก์ออนไลน์และทุกเครื่องจะอัปเดตข้อมูลตรงกันทันทีครับ!</p>
      </div>
    `,
    confirmButtonText: "รับทราบ",
    confirmButtonColor: "#d97706"
  });
}

function handleExportJSON() {
  window.portfolioStorage.exportJSON();
  Swal.fire({
    toast: true,
    position: "top-end",
    icon: "success",
    title: "ส่งออกไฟล์สำรองเรียบร้อย",
    showConfirmButton: false,
    timer: 1500
  });
}

function handleImportJSON() {
  const fileInput = document.getElementById("import-json-file");
  if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
    Swal.showValidationMessage("กรุณาเลือกไฟล์ .json");
    return;
  }

  const file = fileInput.files[0];
  const reader = new FileReader();
  reader.onload = (e) => {
    const result = window.portfolioStorage.importJSON(e.target.result);
    if (result.success) {
      Swal.fire({
        icon: "success",
        title: "นำเข้าข้อมูลสำเร็จ",
        text: result.message,
        timer: 1500,
        showConfirmButton: false
      });
      renderCurrentView();
      updateGlobalStats();
    } else {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: result.message
      });
    }
  };
  reader.readAsText(file);
}

function handleResetDefaultData() {
  Swal.fire({
    title: "ยืนยันการรีเซ็ตข้อมูล?",
    text: "ระบบจะคืนค่าข้อมูลตัวอย่างมาตรฐานของโรงเรียนวัดบางปูนทั้งหมด",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#e11d48",
    cancelButtonColor: "#64748b",
    confirmButtonText: "ยืนยันรีเซ็ต",
    cancelButtonText: "ยกเลิก"
  }).then((result) => {
    if (result.isConfirmed) {
      window.portfolioStorage.resetToDefault();
      Swal.fire({
        icon: "success",
        title: "รีเซ็ตข้อมูลเรียบร้อยแล้ว",
        timer: 1500,
        showConfirmButton: false
      });
      renderCurrentView();
      updateGlobalStats();
    }
  });
}

// Helpers
function setYearFilter(year) {
  AppState.activeFilterYear = year;
  renderCurrentView();
}

function setCategoryFilter(category) {
  AppState.activeFilterCategory = category;
  renderCurrentView();
}

// ==========================================
// Layout & Simulation Controllers
// ==========================================
function toggleViewerSimulation(status) {
  window.portfolioStorage.setSimulatingViewer(status);
  renderCurrentView();
  Swal.fire({
    toast: true,
    position: "top-end",
    icon: status ? "info" : "success",
    title: status ? "เข้าสู่โหมดจำลองมุมมองผู้เข้าชม (Public View)" : "กลับสู่โหมดผู้ดูแลระบบ (Admin)",
    showConfirmButton: false,
    timer: 1500
  });
}

function changeUpdateLayout(layoutName) {
  window.portfolioStorage.updateSettings({ dashboardUpdateLayout: layoutName });
  renderCurrentView();
  Swal.fire({
    toast: true,
    position: "top-end",
    icon: "success",
    title: `เปลี่ยนรูปแบบเป็น: ${layoutName === 'cards' ? 'การ์ด 3 มิติ' : layoutName === 'timeline' ? 'ไทม์ไลน์' : 'ไฮไลต์เด่น'}`,
    showConfirmButton: false,
    timer: 1200
  });
}

// ==========================================
// Recent Updates Feed Renderers (3 Distinct Layouts)
// ==========================================
function renderUpdatesContent(updates, layout, isAdmin) {
  if (!updates || updates.length === 0) {
    return `
      <div class="glass-card p-8 rounded-2xl border border-slate-200 text-center text-slate-400">
        <i data-lucide="newspaper" class="w-10 h-10 mx-auto mb-2 text-slate-300"></i>
        <p class="font-bold text-slate-700 text-sm">ยังไม่มีรายการผลงานหรือภารกิจอัปเดต</p>
        <p class="text-xs text-slate-400 mt-1">คุณครูสามารถเพิ่มข่าวสาร รางวัล หรือการไปปฏิบัติหน้าที่วิทยากรได้ตลอดเวลา</p>
        ${isAdmin ? `
          <button onclick="openAddUpdateModal()" class="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition-all">
            <i data-lucide="plus" class="w-4 h-4"></i> เพิ่มอัปเดตแรกของคุณครู
          </button>
        ` : ""}
      </div>
    `;
  }

  if (layout === "timeline") {
    return renderUpdatesTimeline(updates, isAdmin);
  } else if (layout === "spotlight") {
    return renderUpdatesSpotlight(updates, isAdmin);
  }
  // Default: cards
  return renderUpdatesCards(updates, isAdmin);
}

// 1. Cards Layout
function renderUpdatesCards(updates, isAdmin) {
  return `
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      ${updates.map(item => `
        <div class="glass-card rounded-2xl border border-slate-200/90 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group ${!item.isVisible ? 'opacity-60 bg-slate-50' : ''}">
          <div class="relative h-44 overflow-hidden bg-slate-100">
            <img src="${item.coverUrl || 'https://images.unsplash.com/photo-1579389083078-4e7018379f7e?auto=format&fit=crop&w=600&q=80'}" alt="${item.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
            <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
            
            <div class="absolute top-3 left-3 flex items-center gap-1.5">
              <span class="px-2.5 py-1 rounded-lg text-[10px] font-bold text-white shadow-md ${item.badgeColor || 'bg-amber-500'}">
                ${item.badgeText || item.category || 'อัปเดต'}
              </span>
              <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/60 text-amber-300 backdrop-blur-xs">
                ปี ${item.academicYear || '2568'}
              </span>
            </div>

            <div class="absolute bottom-2.5 left-3 right-3 text-white text-[11px] font-sarabun flex items-center gap-1.5 opacity-90">
              <i data-lucide="calendar" class="w-3.5 h-3.5 text-amber-400"></i>
              <span>${item.date}</span>
            </div>
          </div>

          <div class="p-4 flex-1 flex flex-col justify-between space-y-3">
            <div>
              <h3 class="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors line-clamp-2">
                ${item.title}
              </h3>
              <p class="text-xs text-slate-500 font-sarabun mt-1.5 line-clamp-2">
                ${item.description || ''}
              </p>
            </div>

            <div class="pt-2 border-t border-slate-100 flex items-center justify-between">
              ${item.linkUrl ? `
                <button onclick="openDocumentPreview('${item.title}', '${item.linkUrl}')" class="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                  <i data-lucide="file-text" class="w-3.5 h-3.5"></i> เอกสาร/เกียรติบัตร
                </button>
              ` : `
                <span class="text-[11px] text-slate-400 font-sarabun flex items-center gap-1">
                  <i data-lucide="check-circle" class="w-3 h-3 text-emerald-500"></i> กิจกรรมเสร็จสิ้น
                </span>
              `}

              ${isAdmin ? `
                <div class="flex items-center gap-1">
                  <button onclick="toggleVisibility('recentUpdates', '${item.id}')" class="p-1 text-slate-400 hover:text-blue-600 rounded-md" title="เปิด/ปิดการมองเห็น">
                    <i data-lucide="${item.isVisible ? 'eye' : 'eye-off'}" class="w-3.5 h-3.5"></i>
                  </button>
                  <button onclick="openEditUpdateModal('${item.id}')" class="p-1 text-slate-400 hover:text-amber-600 rounded-md" title="แก้ไข">
                    <i data-lucide="edit" class="w-3.5 h-3.5"></i>
                  </button>
                  <button onclick="confirmDeleteItem('recentUpdates', '${item.id}')" class="p-1 text-slate-400 hover:text-rose-600 rounded-md" title="ลบ">
                    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                  </button>
                </div>
              ` : ""}
            </div>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

// 2. Timeline Layout
function renderUpdatesTimeline(updates, isAdmin) {
  return `
    <div class="glass-card p-6 rounded-2xl border border-slate-200">
      <div class="relative border-l-2 border-amber-400/60 ml-4 md:ml-6 space-y-8 pl-6 md:pl-8 py-2">
        ${updates.map((item, idx) => `
          <div class="relative group ${!item.isVisible ? 'opacity-60' : ''}">
            <!-- Timeline node circle -->
            <div class="absolute -left-[35px] md:-left-[43px] top-1.5 w-6 h-6 rounded-full bg-white border-4 border-amber-500 shadow-md flex items-center justify-center group-hover:scale-110 transition-transform">
              <div class="w-2 h-2 rounded-full bg-amber-500"></div>
            </div>

            <div class="bg-white/80 backdrop-blur-xs p-4 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row gap-4 items-start">
              ${item.coverUrl ? `
                <div class="w-full md:w-36 h-28 rounded-lg overflow-hidden shrink-0 bg-slate-100 border border-slate-200">
                  <img src="${item.coverUrl}" alt="${item.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                </div>
              ` : ""}

              <div class="flex-1 space-y-1.5">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="px-2 py-0.5 rounded-md text-[10px] font-bold text-white ${item.badgeColor || 'bg-amber-500'}">
                    ${item.badgeText || item.category || 'อัปเดต'}
                  </span>
                  <span class="text-xs text-slate-400 font-sarabun flex items-center gap-1">
                    <i data-lucide="calendar" class="w-3.5 h-3.5 text-amber-500"></i> ${item.date} (ปีการศึกษา ${item.academicYear || '2568'})
                  </span>
                </div>

                <h3 class="font-bold text-slate-800 text-sm md:text-base group-hover:text-blue-600 transition-colors">
                  ${item.title}
                </h3>

                <p class="text-xs text-slate-600 font-sarabun">
                  ${item.description || ''}
                </p>

                <div class="pt-2 flex items-center justify-between">
                  ${item.linkUrl ? `
                    <button onclick="openDocumentPreview('${item.title}', '${item.linkUrl}')" class="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                      <i data-lucide="file-text" class="w-3.5 h-3.5"></i> เปิดดูเอกสารแนบ
                    </button>
                  ` : `<div></div>`}

                  ${isAdmin ? `
                    <div class="flex items-center gap-1.5">
                      <button onclick="toggleVisibility('recentUpdates', '${item.id}')" class="p-1 text-slate-400 hover:text-blue-600 rounded-md" title="เปิด/ปิด">
                        <i data-lucide="${item.isVisible ? 'eye' : 'eye-off'}" class="w-3.5 h-3.5"></i>
                      </button>
                      <button onclick="openEditUpdateModal('${item.id}')" class="p-1 text-slate-400 hover:text-amber-600 rounded-md" title="แก้ไข">
                        <i data-lucide="edit" class="w-3.5 h-3.5"></i>
                      </button>
                      <button onclick="confirmDeleteItem('recentUpdates', '${item.id}')" class="p-1 text-slate-400 hover:text-rose-600 rounded-md" title="ลบ">
                        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                      </button>
                    </div>
                  ` : ""}
                </div>
              </div>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

// 3. Spotlight Featured Layout
function renderUpdatesSpotlight(updates, isAdmin) {
  const featured = updates[0];
  const others = updates.slice(1);

  return `
    <div class="space-y-4">
      <!-- Main Featured Hero Spotlight -->
      ${featured ? `
        <div class="glass-card rounded-3xl border-2 border-amber-400/60 overflow-hidden shadow-lg bg-gradient-to-r from-slate-900 to-navy-950 text-white flex flex-col md:flex-row items-center group ${!featured.isVisible ? 'opacity-60' : ''}">
          <div class="w-full md:w-1/2 h-64 md:h-72 overflow-hidden relative">
            <img src="${featured.coverUrl || 'https://images.unsplash.com/photo-1579389083078-4e7018379f7e'}" alt="${featured.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
            <div class="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-slate-950/80 via-transparent to-transparent"></div>
          </div>

          <div class="p-6 md:p-8 flex-1 space-y-3">
            <div class="flex items-center gap-2">
              <span class="px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-slate-950 shadow-md">
                ⭐ ไฮไลต์เด่นอันดับ 1
              </span>
              <span class="text-xs text-amber-300 font-sarabun">
                ${featured.date} • ปี ${featured.academicYear || '2568'}
              </span>
            </div>

            <h3 class="text-lg md:text-xl font-bold text-white group-hover:text-amber-300 transition-colors">
              ${featured.title}
            </h3>

            <p class="text-xs md:text-sm text-slate-300 font-sarabun leading-relaxed">
              ${featured.description || ''}
            </p>

            <div class="pt-2 flex items-center justify-between">
              ${featured.linkUrl ? `
                <button onclick="openDocumentPreview('${featured.title}', '${featured.linkUrl}')" class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5">
                  <i data-lucide="file-check" class="w-4 h-4"></i> ดูเอกสาร/เกียรติบัตร
                </button>
              ` : `<div></div>`}

              ${isAdmin ? `
                <div class="flex items-center gap-2">
                  <button onclick="openEditUpdateModal('${featured.id}')" class="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-amber-300 text-xs font-semibold">
                    <i data-lucide="edit" class="w-3.5 h-3.5 inline mr-1"></i> แก้ไขไฮไลต์
                  </button>
                </div>
              ` : ""}
            </div>
          </div>
        </div>
      ` : ""}

      <!-- Other updates as compact grid -->
      ${others.length > 0 ? `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${others.map(item => `
            <div class="glass-card p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5 group hover:border-blue-400 transition-all ${!item.isVisible ? 'opacity-60' : ''}">
              <div class="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-slate-100 border">
                <img src="${item.coverUrl || 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655'}" class="w-full h-full object-cover">
              </div>
              <div class="flex-1 min-w-0 space-y-1">
                <div class="flex items-center gap-1.5">
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold text-white ${item.badgeColor || 'bg-blue-600'}">
                    ${item.badgeText || item.category}
                  </span>
                  <span class="text-[11px] text-slate-400 truncate">${item.date}</span>
                </div>
                <h4 class="font-bold text-slate-800 text-xs truncate group-hover:text-blue-600">${item.title}</h4>
                <p class="text-[11px] text-slate-500 font-sarabun truncate">${item.description || ''}</p>
              </div>
              ${isAdmin ? `
                <button onclick="openEditUpdateModal('${item.id}')" class="p-1.5 text-slate-400 hover:text-amber-600 rounded-md">
                  <i data-lucide="edit" class="w-3.5 h-3.5"></i>
                </button>
              ` : ""}
            </div>
          `).join("")}
        </div>
      ` : ""}
    </div>
  `;
}

// ==========================================
// Modals for Recent Updates, Year Config, and Image Uploads
// ==========================================

// 1. Add Recent Update Modal
function openAddUpdateModal() {
  Swal.fire({
    title: "เพิ่มผลงาน / ภารกิจอัปเดตใหม่",
    html: `
      <div class="space-y-3 text-left font-sarabun text-xs max-h-[65vh] overflow-y-auto p-1">
        <div>
          <label class="block font-bold text-slate-700 mb-1">หัวข้อผลงาน / ภารกิจ: *</label>
          <input id="upd-title" class="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500" placeholder="เช่น ได้รับรางวัลชนะเลิศ หรือ ไปเป็นวิทยากร...">
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block font-bold text-slate-700 mb-1">หมวดหมู่ / ประเภท:</label>
            <select id="upd-cat" class="w-full p-2.5 rounded-lg border border-slate-300 bg-white">
              <option value="รางวัลและผลงานเด่น">🏆 รางวัลและผลงานเด่น</option>
              <option value="การไปทำหน้าที่ / วิทยากร">🎤 การไปทำหน้าที่ / วิทยากร</option>
              <option value="กิจกรรมการเรียนรู้">💡 กิจกรรมการเรียนรู้</option>
              <option value="อบรมพัฒนาตนเอง">📚 อบรมพัฒนาตนเอง</option>
              <option value="การนิเทศและชุมชน">🤝 การนิเทศและชุมชน</option>
            </select>
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">ปีการศึกษา:</label>
            <input id="upd-year" class="w-full p-2.5 rounded-lg border border-slate-300" value="2568">
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block font-bold text-slate-700 mb-1">วันที่ปฏิบัติงาน / ได้รับรางวัล:</label>
            <input id="upd-date" class="w-full p-2.5 rounded-lg border border-slate-300" placeholder="เช่น 16 มกราคม 2568">
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">สีป้ายแท็ก (Badge Color):</label>
            <select id="upd-color" class="w-full p-2.5 rounded-lg border border-slate-300 bg-white">
              <option value="bg-amber-500">🟡 สีทอง (รางวัล/เกียรติยศ)</option>
              <option value="bg-blue-600">🔵 สีน้ำเงิน (วิทยากร/ทางการ)</option>
              <option value="bg-emerald-600">🟢 สีเขียว (กิจกรรม/การเรียนรู้)</option>
              <option value="bg-purple-600">🟣 สีม่วง (นวัตกรรม/สื่อ)</option>
              <option value="bg-rose-600">🔴 สีแดง (สำคัญเร่งด่วน)</option>
            </select>
          </div>
        </div>

        <!-- Image Upload from Device or URL -->
        <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <label class="block font-bold text-slate-700">รูปภาพประกอบ (เลือกไฟล์จากเครื่อง หรือใส่ลิงก์):</label>
          <div class="flex items-center gap-2">
            <input type="file" id="upd-file-input" accept="image/*" class="text-xs file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100">
          </div>
          <input id="upd-cover" class="w-full p-2 text-[11px] rounded-lg border border-slate-300" placeholder="หรือใส่ลิงก์รูปภาพ URL https://..." value="https://images.unsplash.com/photo-1579389083078-4e7018379f7e?auto=format&fit=crop&w=800&q=80">
          <div class="flex items-center gap-3 pt-1">
            <span class="text-[11px] text-slate-400">พรีวิวรูปภาพ:</span>
            <img id="upd-preview-img" src="https://images.unsplash.com/photo-1579389083078-4e7018379f7e?auto=format&fit=crop&w=800&q=80" class="w-16 h-12 rounded object-cover border">
          </div>
        </div>

        <div>
          <label class="block font-bold text-slate-700 mb-1">ลิงก์ไฟล์เอกสาร / เกียรติบัตร PDF (ถ้ามี):</label>
          <input id="upd-link" class="w-full p-2.5 rounded-lg border border-slate-300" placeholder="https://drive.google.com/... หรือ ลิงก์ PDF">
        </div>

        <div>
          <label class="block font-bold text-slate-700 mb-1">คำอธิบายรายละเอียด:</label>
          <textarea id="upd-desc" rows="2" class="w-full p-2.5 rounded-lg border border-slate-300" placeholder="ระบุรายละเอียดสังเขป"></textarea>
        </div>
      </div>
    `,
    width: "600px",
    showCancelButton: true,
    confirmButtonText: "บันทึกอัปเดต",
    cancelButtonText: "ยกเลิก",
    confirmButtonColor: "#2563eb",
    cancelButtonColor: "#64748b",
    didOpen: () => {
      // Connect file picker to base64 converter
      const fileInput = document.getElementById("upd-file-input");
      const coverInput = document.getElementById("upd-cover");
      const previewImg = document.getElementById("upd-preview-img");
      if (fileInput) {
        fileInput.addEventListener("change", async (e) => {
          const file = e.target.files[0];
          if (!file) return;
          const compressed = await window.compressImage(file, 1280, 0.82);
          coverInput.value = compressed;
          if (previewImg) previewImg.src = compressed;
        });
      }
      if (coverInput) {
        coverInput.addEventListener("input", (e) => {
          if (previewImg) previewImg.src = e.target.value;
        });
      }
    },
    preConfirm: () => {
      const title = document.getElementById("upd-title").value.trim();
      const category = document.getElementById("upd-cat").value;
      const academicYear = document.getElementById("upd-year").value.trim();
      const date = document.getElementById("upd-date").value.trim();
      const badgeColor = document.getElementById("upd-color").value;
      const coverUrl = document.getElementById("upd-cover").value.trim();
      const linkUrl = document.getElementById("upd-link").value.trim();
      const description = document.getElementById("upd-desc").value.trim();

      if (!title) {
        Swal.showValidationMessage("กรุณากรอกหัวข้อผลงาน");
        return false;
      }
      return { title, category, academicYear, date, badgeColor, badgeText: category.split(" ")[0], coverUrl, linkUrl, description };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      window.portfolioStorage.addItem("recentUpdates", result.value);
      Swal.fire({
        icon: "success",
        title: "เพิ่มรายการอัปเดตสำเร็จ",
        timer: 1500,
        showConfirmButton: false
      });
      renderCurrentView();
    }
  });
}

// 2. Edit Recent Update Modal
function openEditUpdateModal(updateId) {
  const data = window.portfolioStorage.getData();
  const item = data.recentUpdates?.find(i => String(i.id) === String(updateId));
  if (!item) return;

  Swal.fire({
    title: "แก้ไขผลงาน / ภารกิจอัปเดต",
    html: `
      <div class="space-y-3 text-left font-sarabun text-xs max-h-[65vh] overflow-y-auto p-1">
        <div>
          <label class="block font-bold text-slate-700 mb-1">หัวข้อผลงาน / ภารกิจ: *</label>
          <input id="upd-title" class="w-full p-2.5 rounded-lg border border-slate-300" value="${item.title || ''}">
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block font-bold text-slate-700 mb-1">หมวดหมู่ / ประเภท:</label>
            <select id="upd-cat" class="w-full p-2.5 rounded-lg border border-slate-300 bg-white">
              <option value="รางวัลและผลงานเด่น" ${item.category === 'รางวัลและผลงานเด่น' ? 'selected' : ''}>🏆 รางวัลและผลงานเด่น</option>
              <option value="การไปทำหน้าที่ / วิทยากร" ${item.category?.includes('วิทยากร') ? 'selected' : ''}>🎤 การไปทำหน้าที่ / วิทยากร</option>
              <option value="กิจกรรมการเรียนรู้" ${item.category?.includes('กิจกรรม') ? 'selected' : ''}>💡 กิจกรรมการเรียนรู้</option>
              <option value="อบรมพัฒนาตนเอง" ${item.category?.includes('อบรม') ? 'selected' : ''}>📚 อบรมพัฒนาตนเอง</option>
              <option value="การนิเทศและชุมชน" ${item.category?.includes('นิเทศ') ? 'selected' : ''}>🤝 การนิเทศและชุมชน</option>
            </select>
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">ปีการศึกษา:</label>
            <input id="upd-year" class="w-full p-2.5 rounded-lg border border-slate-300" value="${item.academicYear || '2568'}">
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block font-bold text-slate-700 mb-1">วันที่:</label>
            <input id="upd-date" class="w-full p-2.5 rounded-lg border border-slate-300" value="${item.date || ''}">
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">สีป้ายแท็ก:</label>
            <select id="upd-color" class="w-full p-2.5 rounded-lg border border-slate-300 bg-white">
              <option value="bg-amber-500" ${item.badgeColor === 'bg-amber-500' ? 'selected' : ''}>🟡 สีทอง (รางวัล/เกียรติยศ)</option>
              <option value="bg-blue-600" ${item.badgeColor === 'bg-blue-600' ? 'selected' : ''}>🔵 สีน้ำเงิน (วิทยากร/ทางการ)</option>
              <option value="bg-emerald-600" ${item.badgeColor === 'bg-emerald-600' ? 'selected' : ''}>🟢 สีเขียว (กิจกรรม)</option>
              <option value="bg-purple-600" ${item.badgeColor === 'bg-purple-600' ? 'selected' : ''}>🟣 สีม่วง (นวัตกรรม)</option>
              <option value="bg-rose-600" ${item.badgeColor === 'bg-rose-600' ? 'selected' : ''}>🔴 สีแดง (สำคัญ)</option>
            </select>
          </div>
        </div>

        <!-- Image Upload from Device or URL -->
        <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <label class="block font-bold text-slate-700">รูปภาพประกอบ (เลือกไฟล์จากเครื่อง หรือใส่ลิงก์):</label>
          <input type="file" id="upd-file-input" accept="image/*" class="text-xs file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100">
          <input id="upd-cover" class="w-full p-2 text-[11px] rounded-lg border border-slate-300" value="${item.coverUrl || ''}">
          <div class="flex items-center gap-3 pt-1">
            <span class="text-[11px] text-slate-400">พรีวิวรูปภาพ:</span>
            <img id="upd-preview-img" src="${item.coverUrl || 'https://images.unsplash.com/photo-1579389083078-4e7018379f7e'}" class="w-16 h-12 rounded object-cover border">
          </div>
        </div>

        <div>
          <label class="block font-bold text-slate-700 mb-1">ลิงก์ไฟล์เอกสาร / เกียรติบัตร PDF:</label>
          <input id="upd-link" class="w-full p-2.5 rounded-lg border border-slate-300" value="${item.linkUrl || ''}">
        </div>

        <div>
          <label class="block font-bold text-slate-700 mb-1">คำอธิบายรายละเอียด:</label>
          <textarea id="upd-desc" rows="2" class="w-full p-2.5 rounded-lg border border-slate-300">${item.description || ''}</textarea>
        </div>
      </div>
    `,
    width: "600px",
    showCancelButton: true,
    confirmButtonText: "บันทึกการแก้ไข",
    cancelButtonText: "ยกเลิก",
    confirmButtonColor: "#2563eb",
    cancelButtonColor: "#64748b",
    didOpen: () => {
      const fileInput = document.getElementById("upd-file-input");
      const coverInput = document.getElementById("upd-cover");
      const previewImg = document.getElementById("upd-preview-img");
      if (fileInput) {
        fileInput.addEventListener("change", async (e) => {
          const file = e.target.files[0];
          if (!file) return;
          const compressed = await window.compressImage(file, 1280, 0.82);
          coverInput.value = compressed;
          if (previewImg) previewImg.src = compressed;
        });
      }
      if (coverInput) {
        coverInput.addEventListener("input", (e) => {
          if (previewImg) previewImg.src = e.target.value;
        });
      }
    },
    preConfirm: () => {
      return {
        title: document.getElementById("upd-title").value.trim(),
        category: document.getElementById("upd-cat").value,
        academicYear: document.getElementById("upd-year").value.trim(),
        date: document.getElementById("upd-date").value.trim(),
        badgeColor: document.getElementById("upd-color").value,
        badgeText: document.getElementById("upd-cat").value.split(" ")[0],
        coverUrl: document.getElementById("upd-cover").value.trim(),
        linkUrl: document.getElementById("upd-link").value.trim(),
        description: document.getElementById("upd-desc").value.trim()
      };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      window.portfolioStorage.updateItem("recentUpdates", updateId, result.value);
      Swal.fire({
        icon: "success",
        title: "อัปเดตข้อมูลสำเร็จ",
        timer: 1500,
        showConfirmButton: false
      });
      renderCurrentView();
    }
  });
}

// 3. Year Configuration & Evaluation Status Modal
function openYearConfigModal() {
  const data = window.portfolioStorage.getData();
  const settings = data.settings || {};
  const currentYear = settings.currentAcademicYear || "2568";
  const currentStatus = settings.evaluationStatus || "พร้อมรับการประเมิน";

  Swal.fire({
    title: "⚙️ กำหนดปีการศึกษาและสถานะประเมิน",
    html: `
      <div class="space-y-4 text-left font-sarabun text-xs">
        <div class="p-3 bg-blue-50 rounded-xl border border-blue-100 text-blue-900 leading-relaxed">
          <i data-lucide="info" class="w-4 h-4 inline mr-1 text-blue-600"></i>
          คุณครูสามารถกำหนดปีการศึกษาปัจจุบัน และเลือกสถานะการประเมินได้ หากบางรายการยังไม่เริ่มประเมิน สามารถเลือก <b>"ยังไม่เริ่มประเมิน"</b> ได้ครับ
        </div>

        <div>
          <label class="block font-bold text-slate-700 mb-1">ปีการศึกษาที่ใช้งานปัจจุบัน (Active Year):</label>
          <input id="cfg-year" class="w-full p-2.5 rounded-lg border border-slate-300 font-bold text-sm text-blue-800" value="${currentYear}" placeholder="เช่น 2568 หรือ 2569">
        </div>

        <div>
          <label class="block font-bold text-slate-700 mb-1">สถานะความพร้อมการประเมิน:</label>
          <select id="cfg-status" class="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium text-xs">
            <option value="พร้อมรับการประเมิน" ${currentStatus.includes('พร้อม') ? 'selected' : ''}>🟢 พร้อมรับการประเมิน (เปิดแสดงผลสมบูรณ์)</option>
            <option value="ยังไม่เริ่มประเมิน / เตรียมการ" ${currentStatus.includes('ยังไม่') ? 'selected' : ''}>🟡 ยังไม่เริ่มประเมิน / อยู่ระหว่างจัดเตรียมเอกสาร</option>
            <option value="ประเมินเสร็จสิ้นแล้ว" ${currentStatus.includes('เสร็จ') ? 'selected' : ''}>🔵 ประเมินเสร็จสิ้นแล้ว</option>
          </select>
        </div>

        <div>
          <label class="block font-bold text-slate-700 mb-1">ชื่อแอปพลิเคชันส่วนตัว:</label>
          <input id="cfg-app-name" class="w-full p-2.5 rounded-lg border border-slate-300" value="${settings.appName || 'KRUSOS E-PORTFOLIO'}">
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: "บันทึกการตั้งค่า",
    cancelButtonText: "ยกเลิก",
    confirmButtonColor: "#2563eb",
    cancelButtonColor: "#64748b",
    preConfirm: () => {
      return {
        currentAcademicYear: document.getElementById("cfg-year").value.trim(),
        evaluationStatus: document.getElementById("cfg-status").value,
        appName: document.getElementById("cfg-app-name").value.trim()
      };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      window.portfolioStorage.updateSettings(result.value);
      Swal.fire({
        icon: "success",
        title: "บันทึกการตั้งค่าปีการศึกษาสำเร็จ",
        timer: 1500,
        showConfirmButton: false
      });
      updateGlobalStats();
      renderCurrentView();
    }
  });
}

// ==========================================
// 4. LINE-Style Avatar Cropper & Quick Avatar Upload
// ==========================================
let currentCropperInstance = null;

function openAvatarCropperModal(imageSrc, onCropDone, shouldSaveToProfile = true) {
  Swal.fire({
    title: `<span class="text-base font-bold font-prompt text-slate-800 flex items-center justify-center gap-2">
      <i data-lucide="crop" class="w-5 h-5 text-blue-600"></i> ปรับขนาดและครอบตัดรูปโปรไฟล์ (LINE Style)
    </span>`,
    html: `
      <div class="space-y-3 text-left font-sarabun text-xs">
        <p class="text-slate-500 text-center text-[11px]">
          ลากเพื่อเลื่อนตำแหน่งภาพ และใช้สไลเดอร์เพื่อซูมเข้า-ออก (แสดงผลเป็นวงกลมเหมือนในแอป LINE)
        </p>

        <!-- Cropper Canvas Container -->
        <div class="relative w-full h-[320px] bg-slate-950 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center border border-slate-700">
          <img id="cropper-target-image" crossorigin="anonymous" src="${imageSrc}" class="max-w-full max-h-full block" alt="Crop Target">
        </div>

        <!-- Controls Toolbar -->
        <div class="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
          <!-- Zoom Slider -->
          <div class="flex items-center justify-between gap-3 text-slate-700 font-semibold text-xs">
            <span class="flex items-center gap-1 shrink-0"><i data-lucide="zoom-out" class="w-4 h-4 text-slate-400"></i> ซูม:</span>
            <input type="range" id="crop-slider-zoom" min="0.1" max="3" step="0.02" value="1" class="w-full accent-blue-600 cursor-pointer">
            <span class="flex items-center gap-1 shrink-0"><i data-lucide="zoom-in" class="w-4 h-4 text-slate-400"></i></span>
          </div>

          <!-- Action Buttons (Rotate, Reset, Flip) -->
          <div class="flex flex-wrap items-center justify-center gap-2 pt-1 border-t border-slate-200">
            <button type="button" id="crop-btn-rotate-left" class="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-prompt text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer">
              <i data-lucide="rotate-ccw" class="w-3.5 h-3.5 text-blue-600"></i> หมุนซ้าย 90°
            </button>
            <button type="button" id="crop-btn-rotate-right" class="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-prompt text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer">
              <i data-lucide="rotate-cw" class="w-3.5 h-3.5 text-blue-600"></i> หมุนขวา 90°
            </button>
            <button type="button" id="crop-btn-flip" class="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-prompt text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer">
              <i data-lucide="flip-horizontal" class="w-3.5 h-3.5 text-indigo-600"></i> พลิกภาพ
            </button>
            <button type="button" id="crop-btn-reset" class="px-3 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 font-prompt text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer">
              <i data-lucide="refresh-cw" class="w-3.5 h-3.5 text-rose-600"></i> รีเซ็ต
            </button>
          </div>
        </div>
      </div>
    `,
    width: "540px",
    showCancelButton: true,
    confirmButtonText: "✅ ตัดรูปและใช้ภาพนี้ทันที",
    cancelButtonText: "ยกเลิก",
    confirmButtonColor: "#2563eb",
    cancelButtonColor: "#64748b",
    allowOutsideClick: false,
    didOpen: () => {
      initIcons();
      const imageElement = document.getElementById("cropper-target-image");
      if (!imageElement) return;

      let scaleX = 1;

      // Check if Cropper is loaded
      if (typeof Cropper !== "undefined") {
        currentCropperInstance = new Cropper(imageElement, {
          aspectRatio: 1,
          viewMode: 1,
          dragMode: "move",
          autoCropArea: 0.85,
          restore: false,
          guides: false,
          center: false,
          highlight: false,
          cropBoxMovable: false,
          cropBoxResizable: false,
          toggleDragModeOnDblclick: false,
          checkCrossOrigin: true,
          ready() {
            const slider = document.getElementById("crop-slider-zoom");
            if (slider) {
              slider.addEventListener("input", (e) => {
                const val = parseFloat(e.target.value);
                currentCropperInstance.zoomTo(val);
              });
            }
          },
          zoom(e) {
            const slider = document.getElementById("crop-slider-zoom");
            if (slider && e.detail && e.detail.ratio) {
              slider.value = Math.min(3, Math.max(0.1, e.detail.ratio));
            }
          }
        });
      }

      document.getElementById("crop-btn-rotate-left")?.addEventListener("click", () => {
        currentCropperInstance?.rotate(-90);
      });
      document.getElementById("crop-btn-rotate-right")?.addEventListener("click", () => {
        currentCropperInstance?.rotate(90);
      });
      document.getElementById("crop-btn-flip")?.addEventListener("click", () => {
        scaleX = scaleX === 1 ? -1 : 1;
        currentCropperInstance?.scaleX(scaleX);
      });
      document.getElementById("crop-btn-reset")?.addEventListener("click", () => {
        scaleX = 1;
        currentCropperInstance?.reset();
      });
    },
    preConfirm: () => {
      if (currentCropperInstance) {
        try {
          const croppedCanvas = currentCropperInstance.getCroppedCanvas({
            width: 600,
            height: 600,
            fillColor: "#ffffff",
            imageSmoothingEnabled: true,
            imageSmoothingQuality: "high"
          });
          if (croppedCanvas) {
            return croppedCanvas.toDataURL("image/jpeg", 0.92);
          }
        } catch (e) {
          console.warn("Canvas crop failed:", e);
        }
      }
      return imageSrc;
    }
  }).then((result) => {
    const croppedResult = result.value;
    if (currentCropperInstance) {
      currentCropperInstance.destroy();
      currentCropperInstance = null;
    }
    if (result.isConfirmed && croppedResult) {
      if (shouldSaveToProfile) {
        window.portfolioStorage.updateProfile({ avatarUrl: croppedResult });
        Swal.fire({
          icon: "success",
          title: "บันทึกและเปลี่ยนรูปโปรไฟล์เรียบร้อยแล้ว",
          text: "รูปโปรไฟล์ได้รับการตัดและจัดตำแหน่งตามที่คุณครูกำหนดเรียบร้อย",
          timer: 1800,
          showConfirmButton: false
        });
        updateGlobalStats();
        renderCurrentView();
      }
      if (typeof onCropDone === "function") {
        onCropDone(croppedResult);
      }
    }
  });
}

function openQuickAvatarModal() {
  const data = window.portfolioStorage.getData();
  const currentAvatar = data.profile?.avatarUrl || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2";

  Swal.fire({
    title: "📸 เปลี่ยนรูปภาพโปรไฟล์ครูซอส",
    html: `
      <div class="space-y-4 text-center font-sarabun text-xs">
        <div class="flex flex-col items-center gap-2">
          <div class="relative group">
            <img id="avatar-live-preview" src="${currentAvatar}" class="w-36 h-36 rounded-full object-cover border-4 border-amber-400 shadow-xl">
          </div>
          <button type="button" id="btn-crop-current-avatar" class="px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-prompt text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer">
            <i data-lucide="crop" class="w-3.5 h-3.5 text-amber-700"></i>
            <span>ครอป / ปรับแต่งรูปภาพนี้ (LINE Style)</span>
          </button>
        </div>

        <div class="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-2">
          <label class="block font-bold text-slate-800 text-xs font-prompt flex items-center gap-1.5">
            <i data-lucide="image-plus" class="w-4 h-4 text-blue-600"></i> 1. อัปโหลดรูปภาพใหม่ (จะเปิดหน้าต่างครอปรูปทันที):
          </label>
          <input type="file" id="avatar-file-upload" accept="image/*" class="w-full text-xs file:mr-2 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer">
        </div>

        <div class="text-left space-y-1">
          <label class="block font-bold text-slate-700">2. หรือ วางลิงก์รูปภาพ (Image URL):</label>
          <div class="flex gap-2">
            <input id="avatar-url-input" class="w-full p-2.5 rounded-lg border border-slate-300 text-xs" value="${currentAvatar}" placeholder="https://...">
            <button type="button" id="btn-crop-url-avatar" class="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold shrink-0 cursor-pointer">
              ครอป
            </button>
          </div>
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: "บันทึกรูปโปรไฟล์",
    cancelButtonText: "ยกเลิก",
    confirmButtonColor: "#2563eb",
    cancelButtonColor: "#64748b",
    didOpen: () => {
      initIcons();
      const fileInput = document.getElementById("avatar-file-upload");
      const urlInput = document.getElementById("avatar-url-input");
      const previewImg = document.getElementById("avatar-live-preview");

      // Handle File Upload ➔ Open LINE-style Cropper & Auto-save!
      if (fileInput) {
        fileInput.addEventListener("change", async (e) => {
          const file = e.target.files[0];
          if (!file) return;
          const compressed = await window.compressImage(file, 1280, 0.85);
          openAvatarCropperModal(compressed, null, true);
        });
      }

      // Crop Current Avatar ➔ Open LINE-style Cropper & Auto-save!
      document.getElementById("btn-crop-current-avatar")?.addEventListener("click", () => {
        const currentSrc = urlInput ? urlInput.value : currentAvatar;
        openAvatarCropperModal(currentSrc, null, true);
      });

      document.getElementById("btn-crop-url-avatar")?.addEventListener("click", () => {
        const currentSrc = urlInput?.value;
        if (currentSrc) {
          openAvatarCropperModal(currentSrc, null, true);
        }
      });

      if (urlInput) {
        urlInput.addEventListener("input", (e) => {
          if (previewImg) previewImg.src = e.target.value;
        });
      }
    },
    preConfirm: () => {
      const avatarUrl = document.getElementById("avatar-url-input").value.trim();
      if (!avatarUrl) {
        Swal.showValidationMessage("กรุณาเลือกไฟล์ภาพหรือระบุ URL");
        return false;
      }
      return avatarUrl;
    }
  }).then((result) => {
    if (result.isConfirmed) {
      window.portfolioStorage.updateProfile({ avatarUrl: result.value });
      Swal.fire({
        icon: "success",
        title: "เปลี่ยนรูปโปรไฟล์เรียบร้อยแล้ว",
        timer: 1500,
        showConfirmButton: false
      });
      updateGlobalStats();
      renderCurrentView();
    }
  });
}

// ==========================================
// Online Systems & Media Modals
// ==========================================
function openAddOnlineSystemModal() {
  Swal.fire({
    title: "🌐 เพิ่มสื่อ / ระบบออนไลน์ / ลิงก์เพจใหม่",
    html: `
      <div class="space-y-3 text-left font-sarabun text-xs max-h-[70vh] overflow-y-auto p-1">
        <div>
          <label class="block font-bold text-slate-700 mb-1 font-prompt">ชื่อสื่อ / ระบบออนไลน์ / ชื่อเพจ: *</label>
          <input id="sys-title" class="w-full p-2.5 rounded-lg border border-slate-300 font-prompt text-xs focus:ring-2 focus:ring-cyan-500" placeholder="เช่น ระบบเช็คชื่อออนไลน์ หรือ เพจครูซอสสอนสังคม">
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block font-bold text-slate-700 mb-1 font-prompt">หมวดหมู่: *</label>
            <select id="sys-category" class="w-full p-2.5 rounded-lg border border-slate-300 font-prompt text-xs bg-slate-50">
              <option value="ระบบออนไลน์ / Web App">ระบบออนไลน์ / Web App</option>
              <option value="สื่อการสอน / นวัตกรรม">สื่อการสอน / นวัตกรรม</option>
              <option value="เพจ & โซเชียลมีเดีย">เพจ & โซเชียลมีเดีย</option>
            </select>
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1 font-prompt">แพลตฟอร์ม / เทคโนโลยี:</label>
            <input id="sys-platform" class="w-full p-2.5 rounded-lg border border-slate-300 font-prompt text-xs" placeholder="เช่น Web App, Canva, Facebook">
          </div>
        </div>

        <div>
          <label class="block font-bold text-slate-700 mb-1 font-prompt">ลิงก์ URL เข้าใช้งาน (https://...): *</label>
          <input id="sys-url" class="w-full p-2.5 rounded-lg border border-slate-300 font-prompt text-xs focus:ring-2 focus:ring-cyan-500" placeholder="https://...">
        </div>

        <!-- Cover / Screenshot Upload -->
        <div class="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
          <label class="block font-bold text-slate-800 font-prompt flex items-center gap-1.5">
            <i data-lucide="image" class="w-4 h-4 text-cyan-600"></i> รูปภาพหน้าปก / ภาพตัวอย่างระบบ:
          </label>
          <input type="file" id="sys-file" accept="image/*" class="w-full text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-700 cursor-pointer">
          <input id="sys-cover" class="w-full p-2 text-[11px] rounded-lg border border-slate-300" placeholder="หรือใส่ลิงก์รูปภาพ URL https://..." value="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80">
          <div class="flex items-center gap-3 pt-1">
            <span class="text-[11px] text-slate-400 font-prompt">พรีวิวรูปภาพ:</span>
            <img id="sys-preview" src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80" class="w-20 h-14 rounded-lg object-cover border border-slate-300 shadow-xs">
          </div>
        </div>

        <div>
          <label class="block font-bold text-slate-700 mb-1 font-prompt">คำอธิบายรายละเอียด / ประโยชน์ที่ได้รับ:</label>
          <textarea id="sys-desc" rows="3" class="w-full p-2.5 rounded-lg border border-slate-300 font-sarabun text-xs" placeholder="ระบุฟังก์ชันการทำงาน กลุ่มเป้าหมาย หรือการนำไปใช้"></textarea>
        </div>
      </div>
    `,
    width: "600px",
    showCancelButton: true,
    confirmButtonText: "บันทึกรายการ",
    cancelButtonText: "ยกเลิก",
    confirmButtonColor: "#0891b2",
    cancelButtonColor: "#64748b",
    didOpen: () => {
      initIcons();
      const fileInput = document.getElementById("sys-file");
      const coverInput = document.getElementById("sys-cover");
      const previewImg = document.getElementById("sys-preview");
      if (fileInput) {
        fileInput.addEventListener("change", async (e) => {
          const file = e.target.files[0];
          if (!file) return;
          const compressed = await window.compressImage(file, 1280, 0.82);
          coverInput.value = compressed;
          if (previewImg) previewImg.src = compressed;
        });
      }
      if (coverInput) {
        coverInput.addEventListener("input", (e) => {
          if (previewImg) previewImg.src = e.target.value;
        });
      }
    },
    preConfirm: () => {
      const title = document.getElementById("sys-title").value.trim();
      const category = document.getElementById("sys-category").value.trim();
      const platform = document.getElementById("sys-platform").value.trim();
      const url = document.getElementById("sys-url").value.trim();
      const coverUrl = document.getElementById("sys-cover").value.trim();
      const description = document.getElementById("sys-desc").value.trim();

      if (!title || !url) {
        Swal.showValidationMessage("กรุณากรอกชื่อและลิงก์ URL");
        return false;
      }
      return { title, category, platform, url, coverUrl, description, academicYear: "2568" };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      window.portfolioStorage.addItem("onlineSystems", result.value);
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "เพิ่มรายการเรียบร้อยแล้ว",
        showConfirmButton: false,
        timer: 1500
      });
      renderCurrentView();
    }
  });
}

function openEditOnlineSystemModal(itemId) {
  const data = window.portfolioStorage.getData();
  const item = (data.onlineSystems || []).find(i => String(i.id) === String(itemId));
  if (!item) return;

  Swal.fire({
    title: "🌐 แก้ไขสื่อ / ระบบออนไลน์ / ลิงก์เพจ",
    html: `
      <div class="space-y-3 text-left font-sarabun text-xs max-h-[70vh] overflow-y-auto p-1">
        <div>
          <label class="block font-bold text-slate-700 mb-1 font-prompt">ชื่อสื่อ / ระบบออนไลน์ / ชื่อเพจ: *</label>
          <input id="sys-title" class="w-full p-2.5 rounded-lg border border-slate-300 font-prompt text-xs focus:ring-2 focus:ring-cyan-500" value="${item.title || ''}">
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block font-bold text-slate-700 mb-1 font-prompt">หมวดหมู่: *</label>
            <select id="sys-category" class="w-full p-2.5 rounded-lg border border-slate-300 font-prompt text-xs bg-slate-50">
              <option value="ระบบออนไลน์ / Web App" ${item.category === "ระบบออนไลน์ / Web App" ? "selected" : ""}>ระบบออนไลน์ / Web App</option>
              <option value="สื่อการสอน / นวัตกรรม" ${item.category === "สื่อการสอน / นวัตกรรม" ? "selected" : ""}>สื่อการสอน / นวัตกรรม</option>
              <option value="เพจ & โซเชียลมีเดีย" ${item.category === "เพจ & โซเชียลมีเดีย" ? "selected" : ""}>เพจ & โซเชียลมีเดีย</option>
            </select>
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1 font-prompt">แพลตฟอร์ม / เทคโนโลยี:</label>
            <input id="sys-platform" class="w-full p-2.5 rounded-lg border border-slate-300 font-prompt text-xs" value="${item.platform || ''}">
          </div>
        </div>

        <div>
          <label class="block font-bold text-slate-700 mb-1 font-prompt">ลิงก์ URL เข้าใช้งาน (https://...): *</label>
          <input id="sys-url" class="w-full p-2.5 rounded-lg border border-slate-300 font-prompt text-xs focus:ring-2 focus:ring-cyan-500" value="${item.url || ''}">
        </div>

        <!-- Cover / Screenshot Upload -->
        <div class="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
          <label class="block font-bold text-slate-800 font-prompt flex items-center gap-1.5">
            <i data-lucide="image" class="w-4 h-4 text-cyan-600"></i> รูปภาพหน้าปก / ภาพตัวอย่างระบบ:
          </label>
          <input type="file" id="sys-file" accept="image/*" class="w-full text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-700 cursor-pointer">
          <input id="sys-cover" class="w-full p-2 text-[11px] rounded-lg border border-slate-300" value="${item.coverUrl || ''}">
          <div class="flex items-center gap-3 pt-1">
            <span class="text-[11px] text-slate-400 font-prompt">พรีวิวรูปภาพ:</span>
            <img id="sys-preview" src="${item.coverUrl || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71'}" class="w-20 h-14 rounded-lg object-cover border border-slate-300 shadow-xs">
          </div>
        </div>

        <div>
          <label class="block font-bold text-slate-700 mb-1 font-prompt">คำอธิบายรายละเอียด / ประโยชน์ที่ได้รับ:</label>
          <textarea id="sys-desc" rows="3" class="w-full p-2.5 rounded-lg border border-slate-300 font-sarabun text-xs">${item.description || ''}</textarea>
        </div>
      </div>
    `,
    width: "600px",
    showCancelButton: true,
    confirmButtonText: "บันทึกการแก้ไข",
    cancelButtonText: "ยกเลิก",
    confirmButtonColor: "#0891b2",
    cancelButtonColor: "#64748b",
    didOpen: () => {
      initIcons();
      const fileInput = document.getElementById("sys-file");
      const coverInput = document.getElementById("sys-cover");
      const previewImg = document.getElementById("sys-preview");
      if (fileInput) {
        fileInput.addEventListener("change", async (e) => {
          const file = e.target.files[0];
          if (!file) return;
          const compressed = await window.compressImage(file, 1280, 0.82);
          coverInput.value = compressed;
          if (previewImg) previewImg.src = compressed;
        });
      }
      if (coverInput) {
        coverInput.addEventListener("input", (e) => {
          if (previewImg) previewImg.src = e.target.value;
        });
      }
    },
    preConfirm: () => {
      const title = document.getElementById("sys-title").value.trim();
      const category = document.getElementById("sys-category").value.trim();
      const platform = document.getElementById("sys-platform").value.trim();
      const url = document.getElementById("sys-url").value.trim();
      const coverUrl = document.getElementById("sys-cover").value.trim();
      const description = document.getElementById("sys-desc").value.trim();

      if (!title || !url) {
        Swal.showValidationMessage("กรุณากรอกชื่อและลิงก์ URL");
        return false;
      }
      return { title, category, platform, url, coverUrl, description };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      window.portfolioStorage.updateItem("onlineSystems", itemId, result.value);
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "อัปเดตข้อมูลเรียบร้อยแล้ว",
        showConfirmButton: false,
        timer: 1500
      });
      renderCurrentView();
    }
  });
}

// ==========================================
// In-App Web Viewer Modal (เปิดใช้งานระบบในหน้าต่างแอป ไม่ต้องสลับเบราว์เซอร์)
// ==========================================
function openInAppWebViewer(itemId) {
  const data = window.portfolioStorage.getData();
  const item = (data.onlineSystems || []).find(i => String(i.id) === String(itemId));
  if (!item) return;

  const title = item.title || "ระบบออนไลน์";
  const url = item.url || "#";
  const category = item.category || "ระบบออนไลน์";
  const platform = item.platform || "Web Platform";

  Swal.fire({
    title: null,
    html: `
      <div class="space-y-3 text-left font-prompt -m-2">
        <!-- Top Toolbar Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-gradient-to-r from-navy-950 via-slate-900 to-navy-950 text-white rounded-t-2xl border-b border-cyan-500/30">
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="w-8 h-8 rounded-lg bg-cyan-600/90 text-white flex items-center justify-center shrink-0 shadow-md">
              <i data-lucide="globe" class="w-4 h-4 text-cyan-200"></i>
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-1.5">
                <h4 class="font-bold text-sm text-white truncate max-w-xs md:max-w-md">${title}</h4>
                <span class="text-[10px] font-semibold px-2 py-0.2 bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 rounded-md shrink-0">${platform}</span>
              </div>
              <p class="text-[11px] text-slate-300 truncate max-w-xs md:max-w-md font-sarabun">${url}</p>
            </div>
          </div>

          <!-- Actions Toolbar -->
          <div class="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
            <button onclick="reloadInAppIframe()" class="p-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs flex items-center gap-1 border border-slate-700 transition-colors cursor-pointer" title="รีเฟรชหน้าเว็บ">
              <i data-lucide="rotate-cw" class="w-3.5 h-3.5"></i>
              <span class="hidden md:inline text-[11px]">รีโหลด</span>
            </button>
            <a href="${url}" target="_blank" rel="noopener noreferrer" class="p-1.5 px-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1 shadow-md transition-colors cursor-pointer" title="เปิดในแท็บภายนอก">
              <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
              <span class="text-[11px]">เปิดแท็บแยก ↗️</span>
            </a>
            <button type="button" onclick="Swal.close()" class="p-1.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1 shadow-md transition-colors cursor-pointer" title="ปิดหน้าต่างและกลับสู่ระบบ">
              <i data-lucide="x" class="w-4 h-4"></i>
              <span class="text-xs">ปิดกลับสู่ระบบ</span>
            </button>
          </div>
        </div>

        <!-- In-App Interactive Frame Container -->
        <div class="relative bg-slate-900 rounded-b-2xl overflow-hidden border border-slate-200" style="height: 72vh;">
          <iframe id="inapp-web-frame" src="${url}" class="w-full h-full border-0 rounded-b-2xl bg-white" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-presentation"></iframe>
        </div>

        <!-- Footer Help Hint -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 text-[11px] text-slate-500 font-sarabun">
          <span class="flex items-center gap-1">
            <i data-lucide="info" class="w-3.5 h-3.5 text-cyan-600 shrink-0"></i>
            <span>ท่านสามารถทดลองใช้งานระบบผ่านหน้าต่างนี้ได้ทันที เมื่อเสร็จแล้วกดปุ่ม <b>[ ปิดกลับสู่ระบบ ]</b> สีแดงด้านบน</span>
          </span>
          <span class="text-[10px] text-slate-400">หากหน้าเว็บปิดกั้นการฝังกรอบ (เช่น Facebook) ให้กดปุ่ม <b>เปิดแท็บแยก ↗️</b></span>
        </div>
      </div>
    `,
    width: "95vw",
    maxWidth: "1200px",
    padding: "0.5rem",
    showConfirmButton: false,
    showCloseButton: false,
    customClass: {
      popup: "rounded-2xl shadow-2xl p-2 md:p-3 overflow-hidden bg-slate-950 border border-slate-800"
    },
    didOpen: () => {
      initIcons();
    }
  });
}

function reloadInAppIframe() {
  const iframe = document.getElementById("inapp-web-frame");
  if (iframe) {
    iframe.src = iframe.src;
  }
}

// ==========================================
// Dashboard Hero Photo Carousel & Slider Manager (ภาพสไลด์หมุนเวียนหน้าแรก)
// ==========================================
let heroSlideTimer = null;
let currentHeroSlideIndex = 0;

function renderDashboardHeroCarousel(slides, isAdmin) {
  const visibleSlides = (slides || []).filter(s => isAdmin || s.isVisible);

  if (visibleSlides.length === 0 && !isAdmin) return "";

  if (visibleSlides.length === 0 && isAdmin) {
    return `
      <div class="glass-card p-8 rounded-3xl border-2 border-dashed border-amber-300/80 bg-amber-50/40 text-center space-y-3 shadow-sm">
        <div class="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
          <i data-lucide="image-plus" class="w-6 h-6"></i>
        </div>
        <h4 class="font-bold text-slate-800 text-base font-prompt">ยังไม่มีภาพสไลด์หมุนเวียน (Highlight Carousel)</h4>
        <p class="text-xs text-slate-500 font-sarabun max-w-md mx-auto">แอดมินสามารถเพิ่มภาพกิจกรรมเด่น ภาพรับรางวัล หรือภาพพิธีสำคัญเพื่อให้แสดงผลสไลด์หมุนเวียนอัตโนมัติที่หน้าแรกได้ครับ</p>
        <button onclick="openAddHeroSlideModal()" class="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold font-prompt shadow-md hover:scale-105 transition-all cursor-pointer">
          <i data-lucide="plus-circle" class="w-4 h-4"></i> เพิ่มภาพสไลด์แรก
        </button>
      </div>
    `;
  }

  // Ensure index in bounds
  if (currentHeroSlideIndex >= visibleSlides.length) {
    currentHeroSlideIndex = 0;
  }

  return `
    <div class="relative rounded-3xl overflow-hidden shadow-2xl border-2 border-slate-700/60 bg-slate-950 group" id="hero-carousel-container">
      
      <!-- Admin Management Overlay Toolbar -->
      ${isAdmin ? `
        <div class="absolute top-4 right-4 z-30 flex items-center gap-2">
          <button onclick="openHeroSlideManagerModal()" class="px-3.5 py-1.5 rounded-xl bg-navy-950/85 hover:bg-navy-900 text-amber-300 border border-amber-400/40 backdrop-blur-md text-xs font-bold font-prompt flex items-center gap-1.5 shadow-xl transition-all hover:scale-105 cursor-pointer">
            <i data-lucide="sliders-horizontal" class="w-3.5 h-3.5"></i>
            <span>จัดการภาพสไลด์ (${visibleSlides.length})</span>
          </button>
          <button onclick="openAddHeroSlideModal()" class="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-navy-950 font-extrabold font-prompt text-xs flex items-center gap-1 shadow-xl transition-all hover:scale-105 cursor-pointer">
            <i data-lucide="plus-circle" class="w-3.5 h-3.5"></i>
            <span>เพิ่มภาพ</span>
          </button>
        </div>
      ` : ""}

      <!-- Slide Items Frame -->
      <div class="relative aspect-[16/9] sm:aspect-[21/9] min-h-[280px] md:min-h-[380px] lg:min-h-[440px] w-full overflow-hidden">
        ${visibleSlides.map((slide, idx) => {
          const isActive = idx === currentHeroSlideIndex;
          return `
            <div class="hero-slide-item absolute inset-0 transition-all duration-700 ease-in-out ${isActive ? 'opacity-100 scale-100 pointer-events-auto z-10' : 'opacity-0 scale-105 pointer-events-none z-0'}" data-slide-index="${idx}">
              
              <!-- Slide Photo (Sharp & Full Coverage) -->
              <img src="${slide.imageUrl || 'https://images.unsplash.com/photo-1577896851231-70ef18881754'}" alt="${slide.title || 'Highlight'}" class="w-full h-full object-cover">
              
              <!-- Cinematic Dark Gradient Overlay -->
              <div class="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-black/10"></div>

              <!-- Top Left Tag / Badge -->
              ${slide.tag ? `
                <div class="absolute top-4 left-4 z-20">
                  <span class="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-xl text-xs font-bold font-prompt bg-amber-500 text-navy-950 shadow-lg border border-amber-300/60">
                    <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
                    <span>${slide.tag}</span>
                  </span>
                </div>
              ` : ""}

              <!-- Slide Bottom Content -->
              <div class="absolute bottom-0 inset-x-0 p-6 md:p-8 lg:p-10 z-20 space-y-2 max-w-3xl text-left">
                <h3 class="text-lg sm:text-2xl md:text-3xl font-extrabold text-white font-prompt leading-tight drop-shadow-lg">
                  ${slide.title}
                </h3>
                ${slide.subtitle ? `
                  <p class="text-xs sm:text-sm text-slate-200 font-sarabun line-clamp-2 leading-relaxed drop-shadow">
                    ${slide.subtitle}
                  </p>
                ` : ""}

                <div class="pt-3 flex flex-wrap items-center gap-2.5">
                  ${slide.linkView ? `
                    <button type="button" onclick="handleSlideActionClick('${slide.linkView}')" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-600 hover:to-amber-500 text-navy-950 text-xs md:text-sm font-extrabold font-prompt shadow-xl shadow-amber-500/25 hover:scale-105 transition-all cursor-pointer">
                      <span>ดูรายละเอียด</span>
                      <i data-lucide="arrow-right" class="w-4 h-4"></i>
                    </button>
                  ` : ""}
                  <button type="button" onclick="openPhotoViewer('${slide.imageUrl || ''}', '${(slide.title || '').replace(/'/g, "\\'")}')" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-white backdrop-blur-md text-xs md:text-sm font-semibold font-prompt border border-slate-600/80 shadow-lg hover:scale-105 transition-all cursor-pointer">
                    <i data-lucide="maximize-2" class="w-3.5 h-3.5 text-amber-300"></i>
                    <span>ดูภาพเต็ม</span>
                  </button>
                </div>
              </div>

              ${!slide.isVisible ? `
                <div class="absolute inset-0 bg-slate-950/80 z-25 flex items-center justify-center text-white font-bold text-sm">
                  <i data-lucide="eye-off" class="w-5 h-5 mr-2 text-amber-400"></i> แอดมินตั้งค่าซ่อนจากผู้ชม
                </div>
              ` : ""}
            </div>
          `;
        }).join("")}
      </div>

      <!-- Navigation Arrows (Prev / Next) -->
      ${visibleSlides.length > 1 ? `
        <button onclick="prevHeroSlide()" class="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/40 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 transition-all flex items-center justify-center opacity-70 hover:opacity-100 cursor-pointer shadow-xl hover:scale-110" title="ภาพก่อนหน้า">
          <i data-lucide="chevron-left" class="w-5 h-5"></i>
        </button>
        <button onclick="nextHeroSlide()" class="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/40 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 transition-all flex items-center justify-center opacity-70 hover:opacity-100 cursor-pointer shadow-xl hover:scale-110" title="ภาพถัดไป">
          <i data-lucide="chevron-right" class="w-5 h-5"></i>
        </button>
      ` : ""}

      <!-- Pagination Dots Indicator -->
      ${visibleSlides.length > 1 ? `
        <div class="absolute bottom-3 md:bottom-4 inset-x-0 z-30 flex items-center justify-center gap-2 py-1">
          ${visibleSlides.map((_, dotIdx) => `
            <button onclick="jumpToHeroSlide(${dotIdx})" class="transition-all duration-300 cursor-pointer rounded-full ${dotIdx === currentHeroSlideIndex ? 'w-8 h-2.5 bg-amber-400 shadow-lg shadow-amber-400/60' : 'w-2.5 h-2.5 bg-white/50 hover:bg-white/90'}" title="ไปยังภาพที่ ${dotIdx + 1}"></button>
          `).join("")}
        </div>
      ` : ""}
    </div>
  `;
}

function jumpToHeroSlide(index) {
  currentHeroSlideIndex = index;
  updateHeroSlideUI();
  resetHeroSlideTimer();
}

function nextHeroSlide() {
  const data = window.portfolioStorage.getData();
  const isAdmin = window.portfolioStorage.isAdmin();
  const isSimulating = window.portfolioStorage.isSimulatingViewer();
  const effectiveIsAdmin = isAdmin && !isSimulating;
  const slides = (data.heroSlides || []).filter(s => effectiveIsAdmin || s.isVisible);
  if (slides.length <= 1) return;

  currentHeroSlideIndex = (currentHeroSlideIndex + 1) % slides.length;
  updateHeroSlideUI();
  resetHeroSlideTimer();
}

function prevHeroSlide() {
  const data = window.portfolioStorage.getData();
  const isAdmin = window.portfolioStorage.isAdmin();
  const isSimulating = window.portfolioStorage.isSimulatingViewer();
  const effectiveIsAdmin = isAdmin && !isSimulating;
  const slides = (data.heroSlides || []).filter(s => effectiveIsAdmin || s.isVisible);
  if (slides.length <= 1) return;

  currentHeroSlideIndex = (currentHeroSlideIndex - 1 + slides.length) % slides.length;
  updateHeroSlideUI();
  resetHeroSlideTimer();
}

function updateHeroSlideUI() {
  const container = document.getElementById("hero-carousel-container");
  if (!container) return;

  const slideItems = container.querySelectorAll(".hero-slide-item");
  slideItems.forEach((item, idx) => {
    if (idx === currentHeroSlideIndex) {
      item.classList.remove("opacity-0", "scale-105", "pointer-events-none", "z-0");
      item.classList.add("opacity-100", "scale-100", "pointer-events-auto", "z-10");
    } else {
      item.classList.remove("opacity-100", "scale-100", "pointer-events-auto", "z-10");
      item.classList.add("opacity-0", "scale-105", "pointer-events-none", "z-0");
    }
  });

  const dots = container.querySelectorAll(".bottom-3 button, .bottom-4 button");
  dots.forEach((dot, idx) => {
    if (idx === currentHeroSlideIndex) {
      dot.className = "transition-all duration-300 cursor-pointer rounded-full w-8 h-2.5 bg-amber-400 shadow-lg shadow-amber-400/60";
    } else {
      dot.className = "transition-all duration-300 cursor-pointer rounded-full w-2.5 h-2.5 bg-white/50 hover:bg-white/90";
    }
  });
}

function initHeroSliderAutoplay() {
  if (heroSlideTimer) clearInterval(heroSlideTimer);
  heroSlideTimer = setInterval(() => {
    nextHeroSlide();
  }, 4500);

  const container = document.getElementById("hero-carousel-container");
  if (container) {
    container.addEventListener("mouseenter", () => {
      if (heroSlideTimer) clearInterval(heroSlideTimer);
    });
    container.addEventListener("mouseleave", () => {
      resetHeroSlideTimer();
    });
  }
}

function resetHeroSlideTimer() {
  if (heroSlideTimer) clearInterval(heroSlideTimer);
  heroSlideTimer = setInterval(() => {
    nextHeroSlide();
  }, 4500);
}

function handleSlideActionClick(viewKey) {
  if (!viewKey) return;
  if (viewKey.startsWith("http://") || viewKey.startsWith("https://")) {
    window.open(viewKey, "_blank");
  } else {
    navigateTo(viewKey);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function openPhotoViewer(imgUrl, caption) {
  if (!imgUrl) return;
  const cleanTitle = caption || "ดูภาพขนาดเต็ม";
  Swal.fire({
    title: `<span class="text-sm md:text-base font-bold font-prompt text-white flex items-center justify-center gap-2">
      <i data-lucide="image" class="w-4 h-4 text-amber-400"></i> ${cleanTitle}
    </span>`,
    html: `
      <div class="space-y-3 text-center -mx-2">
        <div class="relative max-h-[75vh] overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 flex items-center justify-center p-1 shadow-inner">
          <img src="${imgUrl}" alt="${cleanTitle}" class="max-h-[70vh] w-auto max-w-full object-contain rounded-xl shadow-2xl">
        </div>
        ${caption ? `<p class="text-xs text-slate-300 font-sarabun text-center px-4 leading-relaxed">${caption}</p>` : ''}
      </div>
    `,
    background: "#081735",
    showCloseButton: true,
    showConfirmButton: false,
    width: "auto",
    maxWidth: "92vw",
    customClass: {
      popup: "rounded-3xl p-4 md:p-6 shadow-2xl border-2 border-amber-400/40 text-white max-w-5xl backdrop-blur-xl"
    },
    didOpen: () => initIcons()
  });
}

// ==========================================
// Aspect Card Auto-Slideshow Carousel Engine
// ==========================================
let aspectCarouselTimers = [];

function stopAspectCarousels() {
  if (aspectCarouselTimers && aspectCarouselTimers.length > 0) {
    aspectCarouselTimers.forEach(t => clearInterval(t));
    aspectCarouselTimers = [];
  }
}

function initAspectCarousels() {
  stopAspectCarousels();

  const boxes = document.querySelectorAll("[id^='aspect-carousel-box-']");
  boxes.forEach((box, bIdx) => {
    const idParts = box.id.replace("aspect-carousel-box-", "").split("-");
    const paId = idParts[0];
    const aspectIdx = parseInt(idParts[1], 10);

    const slides = box.querySelectorAll(".aspect-slide-item");
    if (slides.length <= 1) return;

    let currentIndex = 0;

    function showSlide(index) {
      slides.forEach((s, idx) => {
        if (idx === index) {
          s.classList.remove("opacity-0", "z-0", "pointer-events-none");
          s.classList.add("opacity-100", "z-10");
        } else {
          s.classList.remove("opacity-100", "z-10");
          s.classList.add("opacity-0", "z-0", "pointer-events-none");
        }
      });

      // Update counter
      const counter = document.getElementById(`aspect-counter-${paId}-${aspectIdx}`);
      if (counter) counter.innerText = `${index + 1} / ${slides.length}`;

      // Update dots
      const dots = box.querySelectorAll(`.aspect-dot-${paId}-${aspectIdx}`);
      dots.forEach((dot, dIdx) => {
        if (dIdx === index % (dots.length || 1)) {
          dot.className = `aspect-dot-${paId}-${aspectIdx} h-1 rounded-full transition-all duration-300 w-3.5 bg-amber-400`;
        } else {
          dot.className = `aspect-dot-${paId}-${aspectIdx} h-1 rounded-full transition-all duration-300 w-1 bg-white/50`;
        }
      });

      currentIndex = index;
    }

    // Attach step functions on window for manual buttons
    window[`prevAspectSlide_${paId}_${aspectIdx}`] = () => {
      const newIdx = (currentIndex - 1 + slides.length) % slides.length;
      showSlide(newIdx);
    };
    window[`nextAspectSlide_${paId}_${aspectIdx}`] = () => {
      const newIdx = (currentIndex + 1) % slides.length;
      showSlide(newIdx);
    };

    // Staggered autoplay per aspect card: 3500ms + (bIdx * 500ms)
    const intervalMs = 3500 + (bIdx * 500);
    let timer = setInterval(() => {
      const newIdx = (currentIndex + 1) % slides.length;
      showSlide(newIdx);
    }, intervalMs);

    aspectCarouselTimers.push(timer);

    // Pause on hover, resume on leave
    box.addEventListener("mouseenter", () => {
      clearInterval(timer);
    });
    box.addEventListener("mouseleave", () => {
      clearInterval(timer);
      timer = setInterval(() => {
        const newIdx = (currentIndex + 1) % slides.length;
        showSlide(newIdx);
      }, intervalMs);
      aspectCarouselTimers.push(timer);
    });
  });
}

function prevAspectSlide(paId, aspectIdx) {
  const fn = window[`prevAspectSlide_${paId}_${aspectIdx}`];
  if (typeof fn === "function") fn();
}

function nextAspectSlide(paId, aspectIdx) {
  const fn = window[`nextAspectSlide_${paId}_${aspectIdx}`];
  if (typeof fn === "function") fn();
}

window.initAspectCarousels = initAspectCarousels;
window.stopAspectCarousels = stopAspectCarousels;
window.prevAspectSlide = prevAspectSlide;
window.nextAspectSlide = nextAspectSlide;

// --- Admin Hero Slide Management Modals ---
function openHeroSlideManagerModal() {
  const data = window.portfolioStorage.getData();
  const slides = data.heroSlides || [];

  Swal.fire({
    title: `<span class="text-base font-bold font-prompt text-slate-800 flex items-center justify-center gap-2">
      <i data-lucide="sliders-horizontal" class="w-5 h-5 text-amber-500"></i> จัดการภาพสไลด์หมุนเวียนหน้าแรก (Hero Carousel)
    </span>`,
    html: `
      <div class="space-y-4 text-left font-sarabun text-xs">
        <div class="flex items-center justify-between p-2 bg-blue-50/80 rounded-xl border border-blue-100">
          <p class="text-blue-900 text-xs font-sarabun">มีภาพสไลด์ทั้งหมด <b>${slides.length}</b> ภาพ</p>
          <button onclick="Swal.close(); openAddHeroSlideModal();" class="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-navy-950 font-bold font-prompt text-xs flex items-center gap-1 shadow-sm transition-all cursor-pointer">
            <i data-lucide="plus-circle" class="w-3.5 h-3.5"></i> เพิ่มภาพใหม่
          </button>
        </div>

        <div class="space-y-2.5 max-h-[55vh] overflow-y-auto pr-1">
          ${slides.length === 0 ? `
            <div class="p-8 text-center text-slate-400 font-sarabun border border-dashed rounded-xl">
              ยังไม่มีภาพสไลด์ กดปุ่ม "เพิ่มภาพใหม่" ด้านบนเพื่อเริ่มสร้างภาพสไลด์แรก
            </div>
          ` : slides.map((slide, idx) => `
            <div class="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-3 hover:border-blue-400 transition-colors">
              <div class="flex items-center gap-3 min-w-0">
                <span class="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-[11px] shrink-0 font-mono">${idx + 1}</span>
                <img src="${slide.imageUrl || 'https://images.unsplash.com/photo-1577896851231-70ef18881754'}" alt="${slide.title}" class="w-16 h-11 rounded-lg object-cover border border-slate-200 shrink-0">
                <div class="min-w-0">
                  <div class="flex items-center gap-1.5">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 truncate shrink-0">${slide.tag || 'ทั่วไป'}</span>
                    <h5 class="font-bold text-slate-800 truncate text-xs font-prompt">${slide.title}</h5>
                  </div>
                  <p class="text-[11px] text-slate-500 truncate mt-0.5">${slide.subtitle || '-'}</p>
                </div>
              </div>

              <div class="flex items-center gap-1.5 shrink-0">
                <button onclick="toggleHeroSlideVisibility('${slide.id}')" class="p-1.5 rounded-lg border ${slide.isVisible ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200'} hover:scale-105 transition-all cursor-pointer" title="${slide.isVisible ? 'กำลังแสดงผล (คลิกเพื่อซ่อน)' : 'ซ่อนอยู่ (คลิกเพื่อแสดง)'}">
                  <i data-lucide="${slide.isVisible ? 'eye' : 'eye-off'}" class="w-4 h-4"></i>
                </button>
                <button onclick="Swal.close(); openEditHeroSlideModal('${slide.id}');" class="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 transition-all cursor-pointer" title="แก้ไข">
                  <i data-lucide="edit-3" class="w-4 h-4"></i>
                </button>
                <button onclick="confirmDeleteHeroSlide('${slide.id}')" class="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-all cursor-pointer" title="ลบภาพนี้">
                  <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `,
    width: "600px",
    showConfirmButton: false,
    showCancelButton: true,
    cancelButtonText: "ปิดหน้าต่าง",
    cancelButtonColor: "#64748b",
    didOpen: () => initIcons()
  });
}

function toggleHeroSlideVisibility(slideId) {
  window.portfolioStorage.toggleItemVisibility("heroSlides", slideId);
  openHeroSlideManagerModal();
  renderCurrentView();
}

function confirmDeleteHeroSlide(slideId) {
  Swal.fire({
    title: "ยืนยันการลบภาพสไลด์?",
    text: "ภาพสไลด์นี้จะถูกลบออกจากหน้าภาพรวม",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#e11d48",
    cancelButtonColor: "#64748b",
    confirmButtonText: "ยืนยันลบ",
    cancelButtonText: "ยกเลิก"
  }).then((result) => {
    if (result.isConfirmed) {
      window.portfolioStorage.deleteItem("heroSlides", slideId);
      openHeroSlideManagerModal();
      renderCurrentView();
    }
  });
}

function openAddHeroSlideModal(initialData = {}) {
  const currentTitle = initialData.title || '';
  const currentSubtitle = initialData.subtitle || '';
  const currentTag = initialData.tag || '';
  const currentLink = initialData.linkView || '';
  const currentFitMode = initialData.fitMode || 'contain';
  const currentImg = initialData.imageUrl || 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80';

  Swal.fire({
    title: `<span class="text-base font-bold font-prompt text-slate-800 flex items-center justify-center gap-2">
      <i data-lucide="plus-circle" class="w-5 h-5 text-amber-500"></i> เพิ่มภาพสไลด์หมุนเวียนใหม่
    </span>`,
    html: `
      <div class="space-y-3.5 text-left font-sarabun text-xs">
        <div>
          <label class="block font-bold text-slate-700 mb-1 font-prompt">หัวข้อภาพสไลด์ (Title): *</label>
          <input id="slide-title-input" type="text" value="${escapeHtml(currentTitle)}" class="w-full p-2.5 rounded-xl border border-slate-300 font-prompt text-xs" placeholder="เช่น การประเมินการเตรียมความพร้อมครูผู้ช่วย ครั้งที่ 1">
        </div>

        <div>
          <label class="block font-bold text-slate-700 mb-1 font-prompt">คำบรรยาย / รายละเอียดภาพ (Subtitle):</label>
          <textarea id="slide-subtitle-input" rows="2" class="w-full p-2.5 rounded-xl border border-slate-300 font-sarabun text-xs" placeholder="เช่น บรรยากาศการนำเสนอผลงานและรับมอบเกียรติบัตรต่อหน้าคณะกรรมการสถานศึกษา">${escapeHtml(currentSubtitle)}</textarea>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label class="block font-bold text-slate-700 mb-1 font-prompt">ป้ายข้อความ (Tag / Badge):</label>
            <input id="slide-tag-input" type="text" value="${escapeHtml(currentTag)}" class="w-full p-2.5 rounded-xl border border-slate-300 font-prompt text-xs" placeholder="เช่น ⭐ กิจกรรมเด่น หรือ 🏆 รางวัล">
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1 font-prompt">การนำทางเมื่อคลิก (Link View):</label>
            <select id="slide-link-input" class="w-full p-2.5 rounded-xl border border-slate-300 font-prompt text-xs bg-white">
              <option value="" ${!currentLink ? 'selected' : ''}>ไม่มี / ดูภาพอย่างเดียว</option>
              <option value="profile" ${currentLink === 'profile' ? 'selected' : ''}>ประวัติส่วนตัว (Profile)</option>
              <option value="intensive-prep" ${currentLink === 'intensive-prep' ? 'selected' : ''}>การประเมินครูผู้ช่วย (4 ครั้ง)</option>
              <option value="pa" ${currentLink === 'pa' ? 'selected' : ''}>การประเมิน วPA</option>
              <option value="lesson-plans" ${currentLink === 'lesson-plans' ? 'selected' : ''}>แผนการจัดการเรียนรู้</option>
              <option value="official-docs" ${currentLink === 'official-docs' ? 'selected' : ''}>คำสั่งและเอกสารราชการ</option>
              <option value="achievements" ${currentLink === 'achievements' ? 'selected' : ''}>ผลงานและรางวัล</option>
              <option value="gallery" ${currentLink === 'gallery' ? 'selected' : ''}>ภาพกิจกรรม</option>
              <option value="media-systems" ${currentLink === 'media-systems' ? 'selected' : ''}>สื่อและระบบออนไลน์</option>
            </select>
          </div>
        </div>

        <!-- Image Source Selector & Crop Tool -->
        <div class="space-y-3 pt-2 border-t border-slate-200">
          <div class="flex items-center justify-between">
            <label class="block font-bold text-slate-700 font-prompt">รูปภาพสำหรับสไลด์: *</label>
            <button type="button" id="btn-crop-new-slide" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold font-prompt text-xs cursor-pointer shadow-xs transition-all">
              <i data-lucide="crop" class="w-3.5 h-3.5 text-amber-700"></i>
              <span>✂️ ครอป/ตัดแต่งภาพ</span>
            </button>
          </div>

          <!-- Fit Mode Selector (Contain vs Cover) -->
          <div>
            <label class="block font-bold text-slate-700 mb-1.5 font-prompt">โหมดการแสดงผลภาพ:</label>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label class="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-amber-50/60 has-[:checked]:border-amber-500 has-[:checked]:bg-amber-50/90 transition-all">
                <input type="radio" name="slide-fit-mode" value="contain" ${currentFitMode === 'contain' ? 'checked' : ''} class="text-amber-600 focus:ring-amber-500">
                <div>
                  <span class="block font-bold text-xs text-slate-800 font-prompt">🖼️ แสดงภาพเต็ม 100% (ไม่ตัดขอบ)</span>
                  <span class="block text-[10px] text-slate-500 font-sarabun">คงสัดส่วนเดิม 100% พร้อมพื้นหลังเบลอ</span>
                </div>
              </label>

              <label class="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-amber-50/60 has-[:checked]:border-amber-500 has-[:checked]:bg-amber-50/90 transition-all">
                <input type="radio" name="slide-fit-mode" value="cover" ${currentFitMode === 'cover' ? 'checked' : ''} class="text-amber-600 focus:ring-amber-500">
                <div>
                  <span class="block font-bold text-xs text-slate-800 font-prompt">📐 ขยายเต็มกรอบ (Cover Fill)</span>
                  <span class="block text-[10px] text-slate-500 font-sarabun">ขยายภาพเต็มพื้นที่แบนเนอร์</span>
                </div>
              </label>
            </div>
          </div>
          
          <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <div class="flex items-center gap-2">
              <label class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold font-prompt text-xs shadow-xs cursor-pointer">
                <i data-lucide="upload" class="w-3.5 h-3.5"></i>
                <span>เลือกไฟล์ภาพจากเครื่อง</span>
                <input type="file" id="slide-file-input" accept="image/*" class="hidden">
              </label>
              <span class="text-slate-400 text-[11px]">หรือระบุ URL ด้านล่าง</span>
            </div>

            <input id="slide-url-input" type="text" value="${escapeHtml(currentImg)}" class="w-full p-2 rounded-lg border border-slate-300 text-xs font-mono" placeholder="https://images.unsplash.com/...">

            <!-- Image Preview Box with Quick Crop Action -->
            <div class="relative h-36 rounded-xl overflow-hidden border border-slate-300 bg-slate-950 flex items-center justify-center group/prev">
              <img id="slide-img-preview" src="${currentImg}" alt="Preview" class="w-full h-full object-contain">
              <button type="button" id="btn-quick-crop-new" class="absolute inset-0 bg-black/60 opacity-0 group-hover/prev:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-bold text-xs font-prompt cursor-pointer backdrop-blur-xs">
                <i data-lucide="crop" class="w-4 h-4 text-amber-400"></i>
                <span>คลิกเพื่อครอป / ปรับสัดส่วนภาพ</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `,
    width: "580px",
    showCancelButton: true,
    confirmButtonText: "💾 บันทึกภาพสไลด์",
    cancelButtonText: "ยกเลิก",
    confirmButtonColor: "#2563eb",
    cancelButtonColor: "#64748b",
    didOpen: () => {
      initIcons();
      const fileInput = document.getElementById("slide-file-input");
      const urlInput = document.getElementById("slide-url-input");
      const imgPreview = document.getElementById("slide-img-preview");
      const cropBtn = document.getElementById("btn-crop-new-slide");
      const quickCropBtn = document.getElementById("btn-quick-crop-new");

      function getCurrentFormData(newImgUrl) {
        return {
          title: document.getElementById("slide-title-input")?.value || '',
          subtitle: document.getElementById("slide-subtitle-input")?.value || '',
          tag: document.getElementById("slide-tag-input")?.value || '',
          linkView: document.getElementById("slide-link-input")?.value || '',
          fitMode: document.querySelector('input[name="slide-fit-mode"]:checked')?.value || 'contain',
          imageUrl: newImgUrl || document.getElementById("slide-url-input")?.value.trim() || imgPreview?.src || currentImg
        };
      }

      if (urlInput) {
        urlInput.addEventListener("input", (e) => {
          if (imgPreview && e.target.value.trim()) {
            imgPreview.src = e.target.value.trim();
          }
        });
      }

      if (fileInput) {
        fileInput.addEventListener("change", async (e) => {
          const file = e.target.files?.[0];
          if (file) {
            const base64 = await window.compressImage(file, 1600, 0.85);
            const formData = getCurrentFormData(base64);
            openSlideCropperModal(base64, (croppedBase64) => {
              openAddHeroSlideModal({ ...formData, imageUrl: croppedBase64 });
            }, () => {
              openAddHeroSlideModal(formData);
            });
          }
        });
      }

      function handleCropClick() {
        const currentSrc = urlInput?.value.trim() || imgPreview?.src || currentImg;
        if (currentSrc) {
          const formData = getCurrentFormData(currentSrc);
          openSlideCropperModal(currentSrc, (croppedBase64) => {
            openAddHeroSlideModal({ ...formData, imageUrl: croppedBase64 });
          }, () => {
            openAddHeroSlideModal(formData);
          });
        }
      }

      if (cropBtn) cropBtn.addEventListener("click", handleCropClick);
      if (quickCropBtn) quickCropBtn.addEventListener("click", handleCropClick);
    },
    preConfirm: () => {
      const title = document.getElementById("slide-title-input").value.trim();
      const subtitle = document.getElementById("slide-subtitle-input").value.trim();
      const tag = document.getElementById("slide-tag-input").value.trim();
      const linkView = document.getElementById("slide-link-input").value;
      const imageUrl = document.getElementById("slide-url-input").value.trim() || document.getElementById("slide-img-preview").src;
      const fitModeInput = document.querySelector('input[name="slide-fit-mode"]:checked');
      const fitMode = fitModeInput ? fitModeInput.value : "contain";

      if (!title) {
        Swal.showValidationMessage("กรุณากรอกหัวข้อภาพสไลด์");
        return false;
      }
      if (!imageUrl) {
        Swal.showValidationMessage("กรุณาระบุหรืออัปโหลดรูปภาพ");
        return false;
      }

      return {
        id: `slide-${Date.now()}`,
        title,
        subtitle,
        tag: tag || "กิจกรรมเด่น",
        linkView,
        imageUrl,
        fitMode,
        isVisible: true
      };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      window.portfolioStorage.addItem("heroSlides", result.value);
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "เพิ่มภาพสไลด์เรียบร้อยแล้ว",
        showConfirmButton: false,
        timer: 1500
      });
      renderCurrentView();
    }
  });
}

function openEditHeroSlideModal(slideId, initialData = null) {
  const data = window.portfolioStorage.getData();
  const slide = (data.heroSlides || []).find(s => String(s.id) === String(slideId));
  if (!slide && !initialData) return;

  const currentTitle = initialData?.title ?? slide?.title ?? '';
  const currentSubtitle = initialData?.subtitle ?? slide?.subtitle ?? '';
  const currentTag = initialData?.tag ?? slide?.tag ?? '';
  const currentLink = initialData?.linkView ?? slide?.linkView ?? '';
  const currentFitMode = initialData?.fitMode ?? slide?.fitMode ?? 'contain';
  const currentImg = initialData?.imageUrl ?? slide?.imageUrl ?? 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80';

  Swal.fire({
    title: `<span class="text-base font-bold font-prompt text-slate-800 flex items-center justify-center gap-2">
      <i data-lucide="edit-3" class="w-5 h-5 text-blue-600"></i> แก้ไขภาพสไลด์หมุนเวียน
    </span>`,
    html: `
      <div class="space-y-3.5 text-left font-sarabun text-xs">
        <div>
          <label class="block font-bold text-slate-700 mb-1 font-prompt">หัวข้อภาพสไลด์ (Title): *</label>
          <input id="edit-slide-title-input" type="text" value="${escapeHtml(currentTitle)}" class="w-full p-2.5 rounded-xl border border-slate-300 font-prompt text-xs" placeholder="หัวข้อภาพ">
        </div>

        <div>
          <label class="block font-bold text-slate-700 mb-1 font-prompt">คำบรรยาย / รายละเอียดภาพ (Subtitle):</label>
          <textarea id="edit-slide-subtitle-input" rows="2" class="w-full p-2.5 rounded-xl border border-slate-300 font-sarabun text-xs" placeholder="คำบรรยาย">${escapeHtml(currentSubtitle)}</textarea>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label class="block font-bold text-slate-700 mb-1 font-prompt">ป้ายข้อความ (Tag / Badge):</label>
            <input id="edit-slide-tag-input" type="text" value="${escapeHtml(currentTag)}" class="w-full p-2.5 rounded-xl border border-slate-300 font-prompt text-xs" placeholder="ป้ายกำกับ">
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1 font-prompt">การนำทางเมื่อคลิก (Link View):</label>
            <select id="edit-slide-link-input" class="w-full p-2.5 rounded-xl border border-slate-300 font-prompt text-xs bg-white">
              <option value="" ${!currentLink ? 'selected' : ''}>ไม่มี / ดูภาพอย่างเดียว</option>
              <option value="profile" ${currentLink === 'profile' ? 'selected' : ''}>ประวัติส่วนตัว (Profile)</option>
              <option value="intensive-prep" ${currentLink === 'intensive-prep' ? 'selected' : ''}>การประเมินครูผู้ช่วย (4 ครั้ง)</option>
              <option value="pa" ${currentLink === 'pa' ? 'selected' : ''}>การประเมิน วPA</option>
              <option value="lesson-plans" ${currentLink === 'lesson-plans' ? 'selected' : ''}>แผนการจัดการเรียนรู้</option>
              <option value="official-docs" ${currentLink === 'official-docs' ? 'selected' : ''}>คำสั่งและเอกสารราชการ</option>
              <option value="achievements" ${currentLink === 'achievements' ? 'selected' : ''}>ผลงานและรางวัล</option>
              <option value="gallery" ${currentLink === 'gallery' ? 'selected' : ''}>ภาพกิจกรรม</option>
              <option value="media-systems" ${currentLink === 'media-systems' ? 'selected' : ''}>สื่อและระบบออนไลน์</option>
            </select>
          </div>
        </div>

        <!-- Image Source Selector & Crop Tool -->
        <div class="space-y-3 pt-2 border-t border-slate-200">
          <div class="flex items-center justify-between">
            <label class="block font-bold text-slate-700 font-prompt">รูปภาพสำหรับสไลด์: *</label>
            <button type="button" id="btn-crop-edit-slide" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold font-prompt text-xs cursor-pointer shadow-xs transition-all">
              <i data-lucide="crop" class="w-3.5 h-3.5 text-amber-700"></i>
              <span>✂️ ครอป/ตัดแต่งภาพ</span>
            </button>
          </div>

          <!-- Fit Mode Selector (Contain vs Cover) -->
          <div>
            <label class="block font-bold text-slate-700 mb-1.5 font-prompt">โหมดการแสดงผลภาพ:</label>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label class="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-amber-50/60 has-[:checked]:border-amber-500 has-[:checked]:bg-amber-50/90 transition-all">
                <input type="radio" name="edit-slide-fit-mode" value="contain" ${currentFitMode === 'contain' ? 'checked' : ''} class="text-amber-600 focus:ring-amber-500">
                <div>
                  <span class="block font-bold text-xs text-slate-800 font-prompt">🖼️ แสดงภาพเต็ม 100% (ไม่ตัดขอบ)</span>
                  <span class="block text-[10px] text-slate-500 font-sarabun">คงสัดส่วนเดิม 100% พร้อมพื้นหลังเบลอ</span>
                </div>
              </label>

              <label class="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-amber-50/60 has-[:checked]:border-amber-500 has-[:checked]:bg-amber-50/90 transition-all">
                <input type="radio" name="edit-slide-fit-mode" value="cover" ${currentFitMode === 'cover' ? 'checked' : ''} class="text-amber-600 focus:ring-amber-500">
                <div>
                  <span class="block font-bold text-xs text-slate-800 font-prompt">📐 ขยายเต็มกรอบ (Cover Fill)</span>
                  <span class="block text-[10px] text-slate-500 font-sarabun">ขยายภาพเต็มพื้นที่แบนเนอร์</span>
                </div>
              </label>
            </div>
          </div>

          <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <div class="flex items-center gap-2">
              <label class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold font-prompt text-xs shadow-xs cursor-pointer">
                <i data-lucide="upload" class="w-3.5 h-3.5"></i>
                <span>เปลี่ยนไฟล์ภาพใหม่</span>
                <input type="file" id="edit-slide-file-input" accept="image/*" class="hidden">
              </label>
              <span class="text-slate-400 text-[11px]">หรือแก้ไข URL</span>
            </div>

            <input id="edit-slide-url-input" type="text" value="${escapeHtml(currentImg)}" class="w-full p-2 rounded-lg border border-slate-300 text-xs font-mono" placeholder="URL รูปภาพ">

            <!-- Image Preview Box with Quick Crop Action -->
            <div class="relative h-36 rounded-xl overflow-hidden border border-slate-300 bg-slate-950 flex items-center justify-center group/prev">
              <img id="edit-slide-img-preview" src="${currentImg}" alt="Preview" class="w-full h-full object-contain">
              <button type="button" id="btn-quick-crop-edit" class="absolute inset-0 bg-black/60 opacity-0 group-hover/prev:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-bold text-xs font-prompt cursor-pointer backdrop-blur-xs">
                <i data-lucide="crop" class="w-4 h-4 text-amber-400"></i>
                <span>คลิกเพื่อครอป / ปรับสัดส่วนภาพ</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `,
    width: "580px",
    showCancelButton: true,
    confirmButtonText: "💾 บันทึกการแก้ไข",
    cancelButtonText: "ยกเลิก",
    confirmButtonColor: "#2563eb",
    cancelButtonColor: "#64748b",
    didOpen: () => {
      initIcons();
      const fileInput = document.getElementById("edit-slide-file-input");
      const urlInput = document.getElementById("edit-slide-url-input");
      const imgPreview = document.getElementById("edit-slide-img-preview");
      const cropBtn = document.getElementById("btn-crop-edit-slide");
      const quickCropBtn = document.getElementById("btn-quick-crop-edit");

      function getCurrentFormData(newImgUrl) {
        return {
          title: document.getElementById("edit-slide-title-input")?.value || '',
          subtitle: document.getElementById("edit-slide-subtitle-input")?.value || '',
          tag: document.getElementById("edit-slide-tag-input")?.value || '',
          linkView: document.getElementById("edit-slide-link-input")?.value || '',
          fitMode: document.querySelector('input[name="edit-slide-fit-mode"]:checked')?.value || 'contain',
          imageUrl: newImgUrl || document.getElementById("edit-slide-url-input")?.value.trim() || imgPreview?.src || currentImg
        };
      }

      if (urlInput) {
        urlInput.addEventListener("input", (e) => {
          if (imgPreview && e.target.value.trim()) {
            imgPreview.src = e.target.value.trim();
          }
        });
      }

      if (fileInput) {
        fileInput.addEventListener("change", async (e) => {
          const file = e.target.files?.[0];
          if (file) {
            const base64 = await window.compressImage(file, 1600, 0.85);
            const formData = getCurrentFormData(base64);
            openSlideCropperModal(base64, (croppedBase64) => {
              openEditHeroSlideModal(slideId, { ...formData, imageUrl: croppedBase64 });
            }, () => {
              openEditHeroSlideModal(slideId, formData);
            });
          }
        });
      }

      function handleCropClick() {
        const currentSrc = urlInput?.value.trim() || imgPreview?.src || currentImg;
        if (currentSrc) {
          const formData = getCurrentFormData(currentSrc);
          openSlideCropperModal(currentSrc, (croppedBase64) => {
            openEditHeroSlideModal(slideId, { ...formData, imageUrl: croppedBase64 });
          }, () => {
            openEditHeroSlideModal(slideId, formData);
          });
        }
      }

      if (cropBtn) cropBtn.addEventListener("click", handleCropClick);
      if (quickCropBtn) quickCropBtn.addEventListener("click", handleCropClick);
    },
    preConfirm: () => {
      const title = document.getElementById("edit-slide-title-input").value.trim();
      const subtitle = document.getElementById("edit-slide-subtitle-input").value.trim();
      const tag = document.getElementById("edit-slide-tag-input").value.trim();
      const linkView = document.getElementById("edit-slide-link-input").value;
      const imageUrl = document.getElementById("edit-slide-url-input").value.trim() || document.getElementById("edit-slide-img-preview").src;
      const fitModeInput = document.querySelector('input[name="edit-slide-fit-mode"]:checked');
      const fitMode = fitModeInput ? fitModeInput.value : "contain";

      if (!title) {
        Swal.showValidationMessage("กรุณากรอกหัวข้อภาพสไลด์");
        return false;
      }
      if (!imageUrl) {
        Swal.showValidationMessage("กรุณาระบุหรืออัปโหลดรูปภาพ");
        return false;
      }

      return {
        title,
        subtitle,
        tag: tag || "กิจกรรมเด่น",
        linkView,
        imageUrl,
        fitMode
      };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      window.portfolioStorage.updateItem("heroSlides", slideId, result.value);
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "บันทึกการแก้ไขเรียบร้อยแล้ว",
        showConfirmButton: false,
        timer: 1500
      });
      renderCurrentView();
    }
  });
}

// ==========================================
// Interactive Banner Cropper Modal (Cropper.js Tool)
// ==========================================
let currentSlideCropper = null;

function openSlideCropperModal(imageSrc, onCroppedCallback, onCancelCallback) {
  if (!imageSrc) return;

  Swal.fire({
    title: `<span class="text-base font-bold font-prompt text-slate-800 flex items-center justify-center gap-2">
      <i data-lucide="crop" class="w-5 h-5 text-amber-500"></i> ครอปและปรับสัดส่วนภาพสไลด์
    </span>`,
    html: `
      <div class="space-y-3 font-sarabun text-xs">
        <!-- Preset Ratio Selector Buttons -->
        <div class="flex items-center justify-center gap-1.5 flex-wrap pb-1">
          <span class="text-slate-500 font-bold text-[11px] mr-1">เลือกสัดส่วน:</span>
          <button type="button" onclick="setSlideCropRatio(21/9, this)" class="crop-ratio-btn px-3 py-1 rounded-lg bg-amber-500 text-navy-950 font-bold font-prompt text-xs shadow-xs cursor-pointer">21:9 (แบนเนอร์กว้าง)</button>
          <button type="button" onclick="setSlideCropRatio(16/9, this)" class="crop-ratio-btn px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium font-prompt text-xs cursor-pointer">16:9 (มาตรฐาน)</button>
          <button type="button" onclick="setSlideCropRatio(4/3, this)" class="crop-ratio-btn px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium font-prompt text-xs cursor-pointer">4:3 (รูปถ่ายทั่วไป)</button>
          <button type="button" onclick="setSlideCropRatio(NaN, this)" class="crop-ratio-btn px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium font-prompt text-xs cursor-pointer">อิสระ (Free)</button>
        </div>

        <!-- Cropper Workspace Container -->
        <div class="relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 flex items-center justify-center shadow-inner" style="max-height: 52vh; min-height: 280px;">
          <img id="cropper-target-img" src="${imageSrc}" class="max-w-full block" style="max-height: 48vh;">
        </div>

        <!-- Zoom & Rotate Toolbar -->
        <div class="flex items-center justify-center gap-2 pt-1 flex-wrap">
          <button type="button" onclick="if(currentSlideCropper) currentSlideCropper.zoom(0.1)" class="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 cursor-pointer">
            <i data-lucide="zoom-in" class="w-3.5 h-3.5"></i> ซูมเข้า (+)
          </button>
          <button type="button" onclick="if(currentSlideCropper) currentSlideCropper.zoom(-0.1)" class="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 cursor-pointer">
            <i data-lucide="zoom-out" class="w-3.5 h-3.5"></i> ซูมออก (-)
          </button>
          <button type="button" onclick="if(currentSlideCropper) currentSlideCropper.rotate(90)" class="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 cursor-pointer">
            <i data-lucide="rotate-cw" class="w-3.5 h-3.5"></i> หมุน 90°
          </button>
          <button type="button" onclick="if(currentSlideCropper) currentSlideCropper.reset()" class="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 cursor-pointer">
            <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i> รีเซ็ต
          </button>
        </div>
      </div>
    `,
    width: "740px",
    showCancelButton: true,
    confirmButtonText: "✂️ บันทึกรูปที่ตัดแต่ง",
    cancelButtonText: "ยกเลิก",
    confirmButtonColor: "#2563eb",
    cancelButtonColor: "#64748b",
    didOpen: () => {
      initIcons();
      const img = document.getElementById("cropper-target-img");
      if (img && typeof Cropper !== "undefined") {
        currentSlideCropper = new Cropper(img, {
          aspectRatio: 21 / 9,
          viewMode: 1,
          autoCropArea: 1,
          responsive: true,
          guides: true,
          center: true,
          highlight: false,
          background: true
        });
      }
    },
    preConfirm: () => {
      if (currentSlideCropper) {
        const canvas = currentSlideCropper.getCroppedCanvas({
          maxWidth: 1920,
          maxHeight: 1080,
          imageSmoothingEnabled: true,
          imageSmoothingQuality: "high"
        });
        return canvas.toDataURL("image/jpeg", 0.92);
      }
      return imageSrc;
    }
  }).then((result) => {
    if (currentSlideCropper) {
      currentSlideCropper.destroy();
      currentSlideCropper = null;
    }
    if (result.isConfirmed && typeof onCroppedCallback === "function") {
      onCroppedCallback(result.value);
    } else if (!result.isConfirmed && typeof onCancelCallback === "function") {
      onCancelCallback();
    }
  });
}

function setSlideCropRatio(ratio, btn) {
  if (currentSlideCropper) {
    currentSlideCropper.setAspectRatio(ratio);
  }
  document.querySelectorAll(".crop-ratio-btn").forEach(b => {
    b.className = "crop-ratio-btn px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium font-prompt text-xs cursor-pointer";
  });
  if (btn) {
    btn.className = "crop-ratio-btn px-3 py-1 rounded-lg bg-amber-500 text-navy-950 font-bold font-prompt text-xs shadow-xs cursor-pointer";
  }
}

// ==========================================
// Cloud Sync Configuration Modal (Firebase Firestore)
// ==========================================
function parseFirebaseConfigInput(text) {
  if (!text) return null;
  text = text.trim();
  
  // Try direct JSON
  try {
    const obj = JSON.parse(text);
    if (obj.apiKey && obj.projectId) return obj;
  } catch(e) {}

  // Try regex extraction from javascript code snippet
  const apiKeyMatch = text.match(/apiKey:\s*["']([^"']+)["']/i) || text.match(/"apiKey":\s*["']([^"']+)["']/i);
  const authDomainMatch = text.match(/authDomain:\s*["']([^"']+)["']/i) || text.match(/"authDomain":\s*["']([^"']+)["']/i);
  const projectIdMatch = text.match(/projectId:\s*["']([^"']+)["']/i) || text.match(/"projectId":\s*["']([^"']+)["']/i);
  const storageBucketMatch = text.match(/storageBucket:\s*["']([^"']+)["']/i) || text.match(/"storageBucket":\s*["']([^"']+)["']/i);
  const messagingSenderIdMatch = text.match(/messagingSenderId:\s*["']([^"']+)["']/i) || text.match(/"messagingSenderId":\s*["']([^"']+)["']/i);
  const appIdMatch = text.match(/appId:\s*["']([^"']+)["']/i) || text.match(/"appId":\s*["']([^"']+)["']/i);

  if (apiKeyMatch && projectIdMatch) {
    return {
      apiKey: apiKeyMatch[1],
      authDomain: authDomainMatch ? authDomainMatch[1] : `${projectIdMatch[1]}.firebaseapp.com`,
      projectId: projectIdMatch[1],
      storageBucket: storageBucketMatch ? storageBucketMatch[1] : `${projectIdMatch[1]}.appspot.com`,
      messagingSenderId: messagingSenderIdMatch ? messagingSenderIdMatch[1] : "",
      appId: appIdMatch ? appIdMatch[1] : ""
    };
  }
  return null;
}

function openCloudConfigModal() {
  const isConnected = window.portfolioStorage.isCloudConnected;
  const currentConfig = window.portfolioStorage.getFirebaseConfig();

  Swal.fire({
    title: `<span class="text-base font-bold font-prompt text-slate-800 flex items-center justify-center gap-2">
      <i data-lucide="cloud" class="w-5 h-5 text-blue-600"></i> ตั้งค่าฐานข้อมูลคลาวด์เรียลไทม์ (Google Firebase Cloud DB)
    </span>`,
    html: `
      <div class="space-y-4 text-left font-sarabun text-xs max-h-[75vh] overflow-y-auto p-1">
        
        <!-- Status Card -->
        <div class="p-3.5 rounded-2xl border ${isConnected ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950' : 'bg-amber-50/90 border-amber-300 text-amber-950'} space-y-2">
          <div class="flex items-center justify-between">
            <span class="font-bold text-xs font-prompt flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}"></span>
              สถานะ: ${isConnected ? '🟢 เชื่อมต่อ Cloud สำเร็จ (Real-Time Auto-Sync พร้อมใช้งาน)' : '⚪ ยังไม่ได้เชื่อมต่อ Cloud (ใช้งานโหมด Local Storage)'}
            </span>
            ${isConnected ? `<span class="text-[10px] bg-emerald-200/80 text-emerald-900 font-bold px-2 py-0.5 rounded-md font-mono">${currentConfig?.projectId || ''}</span>` : ''}
          </div>
          <p class="text-[11px] leading-relaxed ${isConnected ? 'text-emerald-800' : 'text-amber-800'}">
            ${isConnected 
              ? '✨ ระบบจะซิงค์ข้อมูลและภาพทั้งหมดขึ้นคลาวด์แบบอัตโนมัติทันทีที่กดบันทึก ไม่ต้องดาวน์โหลดหรืออัปไฟล์ใด ๆ ทุกเครื่องที่เปิดลิงก์จะเห็นข้อมูลล่าสุดตรงกัน 100% ครับ!'
              : '⚡ เมื่อเชื่อมต่อ Firebase Cloud แล้ว ข้อมูลทุกอย่างที่คุณครูกรอกจะถูกส่งขึ้นคลาวด์อัตโนมัติแบบเรียลไทม์ทันที ไม่ต้องกดปุ่มบันทึกหรืออัปไฟล์ซ้ำ'}
          </p>
        </div>

        ${isConnected ? `
          <!-- Actions when connected -->
          <div class="space-y-2.5">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button type="button" onclick="handleForcePushCloud()" class="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold font-prompt text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer">
                <i data-lucide="upload-cloud" class="w-4 h-4"></i>
                <span>ซิงค์ข้อมูลปัจจุบันขึ้น Cloud</span>
              </button>
              <button type="button" onclick="handleDisconnectCloud()" class="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold font-prompt text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer">
                <i data-lucide="unlink" class="w-4 h-4"></i>
                <span>ยกเลิกการเชื่อมต่อ Cloud</span>
              </button>
            </div>
          </div>
        ` : `
          <!-- Tutorial & Setup Form when not connected -->
          <div class="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
            <span class="font-bold text-slate-800 text-xs font-prompt flex items-center gap-1.5">
              <i data-lucide="help-circle" class="w-4 h-4 text-blue-600"></i> วิธีรับค่า Firebase Config ฟรี (ทำครั้งเดียว 1-2 นาที):
            </span>
            <ol class="list-decimal list-inside space-y-1 text-[11px] text-slate-600 leading-relaxed font-sarabun pl-1">
              <li>เปิดเว็บ <a href="https://console.firebase.google.com" target="_blank" class="text-blue-600 underline font-bold">console.firebase.google.com</a> (ล็อกอินด้วย Gmail)</li>
              <li>กด <strong>Create a project</strong> (สร้างโปรเจกต์ฟรี เช่น <code>krusos-portfolio</code>)</li>
              <li>ไปที่เมนู <strong>Firestore Database</strong> ➔ กด <strong>Create database</strong> ➔ เลือก Start in <strong>test mode</strong></li>
              <li>กดรูปเฟือง ⚙️ Project Settings ➔ เลื่อนลงไปที่ Web App <code>&lt;/&gt;</code> ➔ คัดลอกโค้ด <code>firebaseConfig</code> มาวางในช่องด้านล่าง</li>
            </ol>
          </div>

          <div class="space-y-1.5">
            <label class="block font-bold text-slate-700 text-xs font-prompt">
              วางโค้ด Firebase Config ที่นี่ (รองรับทั้ง JavaScript Object หรือ JSON):
            </label>
            <textarea id="firebase-config-input" rows="5" class="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-[11px] bg-slate-50 leading-normal" placeholder='const firebaseConfig = {&#10;  apiKey: "AIzaSy...",&#10;  authDomain: "your-app.firebaseapp.com",&#10;  projectId: "your-app-id",&#10;  ...&#10;};'></textarea>
          </div>

          <button type="button" onclick="handleConnectFirebase()" class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold font-prompt text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer">
            <i data-lucide="zap" class="w-4 h-4 text-amber-300"></i>
            <span>🚀 ทดสอบและเริ่มใช้งาน Cloud Real-Time ทันที</span>
          </button>
        `}
      </div>
    `,
    width: "620px",
    showConfirmButton: false,
    showCloseButton: true,
    didOpen: () => initIcons()
  });
}

function handleConnectFirebase() {
  const input = document.getElementById("firebase-config-input")?.value;
  if (!input || !input.trim()) {
    Swal.showValidationMessage("กรุณาวางโค้ด Firebase Config");
    return;
  }

  const parsed = parseFirebaseConfigInput(input);
  if (!parsed || !parsed.apiKey || !parsed.projectId) {
    Swal.showValidationMessage("รูปแบบ Firebase Config ไม่ถูกต้อง กรุณาคัดลอกค่า apiKey และ projectId ให้ครบถ้วน");
    return;
  }

  const success = window.portfolioStorage.connectFirebase(parsed);
  if (success) {
    // Also save into settings if desirable
    const currentData = window.portfolioStorage.getData();
    if (currentData && currentData.settings) {
      currentData.settings.firebaseConfig = parsed;
    }
    // Force push current data as base
    window.portfolioStorage.saveToCloud(currentData);

    Swal.fire({
      icon: "success",
      title: "เชื่อมต่อ Cloud Database สำเร็จ!",
      text: "ระบบคลาวด์เปิดใช้งานเรียบร้อยแล้ว ต่อไปนี้ข้อมูลจะอัปเดตแบบเรียลไทม์อัตโนมัติทันที 100% ทุกเครื่องครับ",
      confirmButtonText: "ยอดเยี่ยม!",
      confirmButtonColor: "#2563eb"
    }).then(() => {
      updateCloudStatusBadge();
    });
  } else {
    Swal.fire({
      icon: "error",
      title: "เชื่อมต่อไม่สำเร็จ",
      text: "กรุณาตรวจสอบการตั้งค่า Firebase หรือ Rules ใน Firestore Database (แนะนำเลือก Test mode)",
      confirmButtonColor: "#ef4444"
    });
  }
}

function handleForcePushCloud() {
  const currentData = window.portfolioStorage.getData();
  window.portfolioStorage.saveToCloud(currentData);
  Swal.fire({
    toast: true,
    position: "top-end",
    icon: "success",
    title: "ซิงค์ข้อมูลปัจจุบันขึ้น Cloud เรียบร้อย",
    showConfirmButton: false,
    timer: 1500
  });
}

function handleDisconnectCloud() {
  Swal.fire({
    title: "ต้องการยกเลิกการเชื่อมต่อ Cloud หรือไม่?",
    text: "ระบบจะกลับไปบันทึกข้อมูลใน Local Storage ของเครื่องนี้ตามปกติ",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "ใช่, ยกเลิกการเชื่อมต่อ",
    cancelButtonText: "ไม่, คงเดิมไว้",
    confirmButtonColor: "#ef4444",
    cancelButtonColor: "#64748b"
  }).then((result) => {
    if (result.isConfirmed) {
      window.portfolioStorage.disconnectFirebase();
      updateCloudStatusBadge();
      Swal.fire({
        icon: "success",
        title: "ยกเลิกการเชื่อมต่อเรียบร้อย",
        timer: 1200,
        showConfirmButton: false
      });
    }
  });
}

window.openCloudConfigModal = openCloudConfigModal;
window.handleConnectFirebase = handleConnectFirebase;
window.handleForcePushCloud = handleForcePushCloud;
window.handleDisconnectCloud = handleDisconnectCloud;

