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

  // Update Nav Links UI
  document.querySelectorAll(".nav-link").forEach(link => {
    const target = link.getAttribute("data-view");
    if (target === viewId) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
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
  initIcons();
}

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
    title: "เปลี่ยนรหัส PIN ผู้ดูแลระบบ",
    html: `
      <div class="space-y-3 text-left font-sarabun text-xs">
        <div>
          <label class="block font-bold text-slate-700 mb-1">รหัส PIN เดิม (ค่าเริ่มต้น: 1234):</label>
          <input id="old-pin-input" type="password" class="w-full p-2.5 rounded-lg border border-slate-300" placeholder="ใส่รหัส PIN ปัจจุบัน">
        </div>
        <div>
          <label class="block font-bold text-slate-700 mb-1">รหัส PIN ใหม่ (อย่างน้อย 4 หลัก):</label>
          <input id="new-pin-input" type="password" class="w-full p-2.5 rounded-lg border border-slate-300" placeholder="ใส่รหัส PIN ใหม่">
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: "บันทึก PIN ใหม่",
    cancelButtonText: "ยกเลิก",
    confirmButtonColor: "#2563eb",
    cancelButtonColor: "#64748b",
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
        default:
          html = renderDashboardView(data, isAdmin);
      }
      container.innerHTML = html;
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

  const lpCount = data.lessonPlans?.filter(i => effectiveIsAdmin || i.isVisible).length || 0;
  const docCount = data.officialDocs?.filter(i => effectiveIsAdmin || i.isVisible).length || 0;
  const achCount = data.achievements?.filter(i => effectiveIsAdmin || i.isVisible).length || 0;
  const actCount = data.gallery?.filter(i => effectiveIsAdmin || i.isVisible).length || 0;

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

      <!-- Quick Stats Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div onclick="navigateTo('lesson-plans')" class="glass-card p-4 rounded-2xl shadow-sm border border-slate-200/80 hover:border-blue-400 hover:shadow-md transition-all flex items-center gap-3.5 cursor-pointer group">
          <div class="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <i data-lucide="book-open" class="w-6 h-6"></i>
          </div>
          <div>
            <div class="text-2xl font-bold text-slate-800">${lpCount}</div>
            <div class="text-xs text-slate-500 font-medium">แผนการจัดการเรียนรู้</div>
          </div>
        </div>
        <div onclick="navigateTo('official-docs')" class="glass-card p-4 rounded-2xl shadow-sm border border-slate-200/80 hover:border-amber-400 hover:shadow-md transition-all flex items-center gap-3.5 cursor-pointer group">
          <div class="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <i data-lucide="file-text" class="w-6 h-6"></i>
          </div>
          <div>
            <div class="text-2xl font-bold text-slate-800">${docCount}</div>
            <div class="text-xs text-slate-500 font-medium">เอกสารทางราชการ</div>
          </div>
        </div>
        <div onclick="navigateTo('achievements')" class="glass-card p-4 rounded-2xl shadow-sm border border-slate-200/80 hover:border-emerald-400 hover:shadow-md transition-all flex items-center gap-3.5 cursor-pointer group">
          <div class="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <i data-lucide="trophy" class="w-6 h-6"></i>
          </div>
          <div>
            <div class="text-2xl font-bold text-slate-800">${achCount}</div>
            <div class="text-xs text-slate-500 font-medium">ผลงานและรางวัล</div>
          </div>
        </div>
        <div onclick="navigateTo('gallery')" class="glass-card p-4 rounded-2xl shadow-sm border border-slate-200/80 hover:border-purple-400 hover:shadow-md transition-all flex items-center gap-3.5 cursor-pointer group">
          <div class="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <i data-lucide="image" class="w-6 h-6"></i>
          </div>
          <div>
            <div class="text-2xl font-bold text-slate-800">${actCount}</div>
            <div class="text-xs text-slate-500 font-medium">อัลบั้มภาพกิจกรรม</div>
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
          <p class="text-xs md:text-sm text-slate-500 mt-0.5">ข้อมูลประวัติการศึกษา การรับราชการ และงานที่ได้รับมอบหมาย</p>
        </div>
        ${isAdmin ? `
          <button onclick="openProfileEditModal()" class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md transition-colors">
            <i data-lucide="edit-3" class="w-4 h-4"></i> แก้ไขข้อมูลประวัติ
          </button>
        ` : ""}
      </div>

      <!-- Basic Profile Info Card -->
      <div class="glass-card p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="flex flex-col items-center text-center p-4 bg-slate-50 rounded-xl border border-slate-100">
            <img src="${p.avatarUrl}" alt="${p.fullName}" class="w-28 h-28 rounded-full object-cover border-4 border-blue-500 shadow-md">
            <h3 class="font-bold text-slate-800 mt-3 text-base">${p.fullName}</h3>
            <span class="text-xs text-blue-600 font-semibold mt-0.5">${p.position}</span>
            <span class="text-xs text-slate-500 mt-1">${p.school}</span>
          </div>

          <div class="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 font-sarabun text-sm">
            <div class="p-3 bg-white rounded-xl border border-slate-100">
              <span class="text-xs text-slate-400 block font-prompt">กลุ่มสาระการเรียนรู้</span>
              <span class="font-semibold text-slate-800">${p.subjectGroup}</span>
            </div>
            <div class="p-3 bg-white rounded-xl border border-slate-100">
              <span class="text-xs text-slate-400 block font-prompt">เลขที่ตำแหน่ง</span>
              <span class="font-semibold text-slate-800">${p.positionNumber}</span>
            </div>
            <div class="p-3 bg-white rounded-xl border border-slate-100">
              <span class="text-xs text-slate-400 block font-prompt">วันบรรจุรับราชการ</span>
              <span class="font-semibold text-slate-800">${p.appointmentDate}</span>
            </div>
            <div class="p-3 bg-white rounded-xl border border-slate-100">
              <span class="text-xs text-slate-400 block font-prompt">อายุราชการ</span>
              <span class="font-semibold text-slate-800">${p.yearsOfService}</span>
            </div>
            <div class="sm:col-span-2 p-3 bg-white rounded-xl border border-slate-100">
              <span class="text-xs text-slate-400 block font-prompt">สังกัดหน่วยงาน</span>
              <span class="font-semibold text-slate-800">${p.affiliation}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Education and Career History -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Education -->
        <div class="glass-card p-6 rounded-2xl border border-slate-200 space-y-4">
          <h3 class="font-bold text-slate-800 flex items-center gap-2 text-base border-b pb-3">
            <i data-lucide="graduation-cap" class="w-5 h-5 text-indigo-600"></i> ประวัติการศึกษา
          </h3>
          <div class="space-y-4">
            ${p.education?.map(edu => `
              <div class="relative pl-6 pb-2 border-l-2 border-indigo-200 last:border-l-0">
                <div class="absolute -left-2 top-0 w-4 h-4 rounded-full bg-indigo-600 border-2 border-white"></div>
                <div class="font-bold text-slate-800 text-sm">${edu.degree}</div>
                <div class="text-xs text-indigo-700 font-medium font-sarabun">${edu.major}</div>
                <div class="text-xs text-slate-500 font-sarabun mt-1">${edu.institution} (ปีสำเร็จการศึกษา ${edu.year})</div>
                <div class="text-xs text-emerald-600 font-semibold mt-0.5">ผลการเรียนเฉลี่ย: ${edu.gpa}</div>
              </div>
            `).join("")}
          </div>
        </div>

        <!-- Work Experience -->
        <div class="glass-card p-6 rounded-2xl border border-slate-200 space-y-4">
          <h3 class="font-bold text-slate-800 flex items-center gap-2 text-base border-b pb-3">
            <i data-lucide="briefcase" class="w-5 h-5 text-blue-600"></i> ประวัติการรับราชการ
          </h3>
          <div class="space-y-4">
            ${p.workExperience?.map(work => `
              <div class="relative pl-6 pb-2 border-l-2 border-blue-200 last:border-l-0">
                <div class="absolute -left-2 top-0 w-4 h-4 rounded-full bg-blue-600 border-2 border-white"></div>
                <div class="flex items-center justify-between">
                  <span class="font-bold text-slate-800 text-sm">${work.position}</span>
                  <span class="text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md">${work.period}</span>
                </div>
                <div class="text-xs text-slate-600 font-medium font-sarabun mt-0.5">${work.workplace}</div>
                <p class="text-xs text-slate-500 font-sarabun mt-1">${work.description}</p>
              </div>
            `).join("")}
          </div>
        </div>
      </div>

      <!-- Teaching Duties Table -->
      <div class="glass-card p-6 rounded-2xl border border-slate-200 space-y-4">
        <h3 class="font-bold text-slate-800 flex items-center gap-2 text-base border-b pb-3">
          <i data-lucide="calendar" class="w-5 h-5 text-emerald-600"></i> ภาระงานสอนตามตารางสอน
        </h3>
        <div class="overflow-x-auto">
          <table class="w-full text-left font-sarabun text-sm">
            <thead class="bg-slate-50 text-slate-600 text-xs font-prompt uppercase">
              <tr>
                <th class="px-4 py-3 rounded-l-lg">รหัสวิชา</th>
                <th class="px-4 py-3">ชื่อรายวิชา</th>
                <th class="px-4 py-3">ระดับชั้น</th>
                <th class="px-4 py-3 text-center">จำนวนชั่วโมง/สัปดาห์</th>
                <th class="px-4 py-3 text-center rounded-r-lg">จำนวนนักเรียน</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${p.teachingDuties?.map(duty => `
                <tr class="hover:bg-slate-50/80 transition-colors">
                  <td class="px-4 py-3 font-semibold text-blue-700">${duty.subjectCode}</td>
                  <td class="px-4 py-3 font-medium text-slate-800">${duty.subjectName}</td>
                  <td class="px-4 py-3 text-slate-600">${duty.grade}</td>
                  <td class="px-4 py-3 text-center font-bold text-slate-700">${duty.hoursPerWeek} คาบ</td>
                  <td class="px-4 py-3 text-center text-slate-600">${duty.studentsCount} คน</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Special Duties -->
      <div class="glass-card p-6 rounded-2xl border border-slate-200 space-y-4">
        <h3 class="font-bold text-slate-800 flex items-center gap-2 text-base border-b pb-3">
          <i data-lucide="check-square" class="w-5 h-5 text-amber-600"></i> งานพิเศษและหน้าที่ที่ได้รับมอบหมาย
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          ${p.specialAssignments?.map(task => `
            <div class="flex items-start gap-3 p-3 bg-amber-50/40 rounded-xl border border-amber-100/60 font-sarabun text-xs md:text-sm text-slate-700">
              <i data-lucide="check-circle-2" class="w-4 h-4 text-amber-600 shrink-0 mt-0.5"></i>
              <span>${task}</span>
            </div>
          `).join("")}
        </div>
      </div>
    </div>
  `;
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
                const allImgs = (ind.items && ind.items.length > 0) 
                  ? ind.items.flatMap(it => it.images || []) 
                  : (ind.images || []);
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

                      <!-- Photo Gallery Preview Strip -->
                      ${imgCount > 0 ? `
                        <div class="space-y-1.5 pt-1">
                          <div class="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                            <span class="flex items-center gap-1"><i data-lucide="image" class="w-3.5 h-3.5 text-amber-600"></i> ภาพกิจกรรม/หลักฐาน</span>
                            <span class="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-bold text-[10px]">📷 ${imgCount} รูป</span>
                          </div>
                          <div class="grid grid-cols-3 gap-1.5 h-16 overflow-hidden rounded-xl">
                            ${allImgs.slice(0, 3).map((imgObj, imgIdx) => {
                              const url = typeof imgObj === 'string' ? imgObj : imgObj.url;
                              return `
                                <div class="relative h-full overflow-hidden rounded-lg border border-slate-200 group/img bg-slate-100">
                                  <img src="${url}" class="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-300">
                                  ${(imgIdx === 2 && imgCount > 3) ? `
                                    <div class="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-xs">
                                      +${imgCount - 3}
                                    </div>
                                  ` : ''}
                                </div>
                              `;
                            }).join('')}
                          </div>
                        </div>
                      ` : `
                        <div class="p-2.5 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
                          <i data-lucide="camera" class="w-3.5 h-3.5 text-slate-400"></i>
                          <span>ยังไม่ได้แนบรูปภาพกิจกรรม</span>
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
// Reusable Component: 3D Book Cover / Document Card
// ==========================================
function renderBookCard(collectionName, item, isAdmin) {
  const badgeText = item.score || item.grade || item.level || item.category || item.academicYear || "";
  const docUrl = item.pdfUrl || item.certificateUrl || item.driveUrl || "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";

  return `
    <div class="book-card flex flex-col justify-between glass-card p-4 rounded-2xl border border-slate-200 group">
      <div>
        <!-- 3D Book Cover Frame -->
        <div class="book-cover cursor-pointer relative" onclick="openDocumentPreview('${item.title}', '${docUrl}')">
          <img src="${item.coverUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136'}" alt="${item.title}" class="w-full h-full object-cover">
          ${badgeText ? `<div class="ribbon-badge">${badgeText}</div>` : ""}
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 text-white">
            <span class="text-xs font-bold flex items-center gap-1.5 bg-blue-600/90 px-3 py-1.5 rounded-lg w-fit mb-1">
              <i data-lucide="file-search" class="w-4 h-4"></i> เปิดอ่านเอกสาร PDF
            </span>
            <span class="text-[10px] text-blue-200">คลิกเพื่อดูตัวอย่างทันที</span>
          </div>
          ${!item.isVisible ? `
            <div class="absolute inset-0 bg-slate-900/70 flex items-center justify-center text-white text-xs font-bold z-20">
              <i data-lucide="eye-off" class="w-4 h-4 mr-1"></i> ซ่อนจากคณะกรรมการ
            </div>
          ` : ""}
        </div>

        <!-- Document Details -->
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
        <button onclick="openDocumentPreview('${item.title}', '${docUrl}')" class="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
          <i data-lucide="book-open" class="w-3.5 h-3.5"></i> พรีวิวเอกสาร
        </button>

        ${isAdmin ? `
          <div class="flex items-center gap-1">
            <button onclick="toggleVisibility('${collectionName}', '${item.id}')" class="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-md" title="เปิด/ปิด การมองเห็น">
              <i data-lucide="${item.isVisible ? 'eye' : 'eye-off'}" class="w-3.5 h-3.5"></i>
            </button>
            <button onclick="openEditItemModal('${collectionName}', '${item.id}')" class="p-1 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded-md" title="แก้ไข">
              <i data-lucide="edit" class="w-3.5 h-3.5"></i>
            </button>
            <button onclick="confirmDeleteItem('${collectionName}', '${item.id}')" class="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-md" title="ลบ">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        ` : ""}
      </div>
    </div>
  `;
}

// ==========================================
// Modal Handlers: PDF Preview Modal
// ==========================================
function openDocumentPreview(title, docUrl) {
  const modal = document.getElementById("pdf-preview-modal");
  const modalTitle = document.getElementById("pdf-modal-title");
  const iframe = document.getElementById("pdf-modal-iframe");
  const openExternalBtn = document.getElementById("pdf-modal-external-btn");

  if (modalTitle) modalTitle.textContent = title || "เอกสารประกอบการประเมิน";
  if (openExternalBtn) openExternalBtn.href = docUrl;

  // Use Google Docs Viewer for universal PDF preview compatibility
  const previewUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(docUrl)}&embedded=true`;
  if (iframe) iframe.src = previewUrl;

  if (modal) {
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }
  initIcons();
}

function closePdfModal() {
  const modal = document.getElementById("pdf-preview-modal");
  const iframe = document.getElementById("pdf-modal-iframe");
  if (iframe) iframe.src = "about:blank";
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
  Swal.fire({
    title: "เพิ่มรายการเอกสาร/ผลงานใหม่",
    html: `
      <div class="space-y-3 text-left font-sarabun text-xs max-h-[65vh] overflow-y-auto p-1">
        <div>
          <label class="block font-bold text-slate-700 mb-1">ชื่อเอกสาร / หัวข้อผลงาน: *</label>
          <input id="modal-item-title" class="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500" placeholder="เช่น แผนการจัดการเรียนรู้ วิทยาการคำนวณ">
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block font-bold text-slate-700 mb-1">หมวดหมู่ / ระดับชั้น / ตัวชี้วัด:</label>
            <input id="modal-item-category" class="w-full p-2.5 rounded-lg border border-slate-300" placeholder="เช่น ป.6 หรือ การปฏิบัติตน">
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">ปีการศึกษา / ปีงบประมาณ:</label>
            <input id="modal-item-year" class="w-full p-2.5 rounded-lg border border-slate-300" value="2568">
          </div>
        </div>

        <!-- Image Upload from Device or URL -->
        <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <label class="block font-bold text-slate-700">รูปภาพหน้าปก / เอกสาร (เลือกไฟล์หรือใส่ลิงก์):</label>
          <input type="file" id="modal-item-file" accept="image/*" class="text-xs file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100">
          <input id="modal-item-cover" class="w-full p-2 text-[11px] rounded-lg border border-slate-300" placeholder="หรือใส่ลิงก์รูปภาพ URL https://..." value="https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80">
          <div class="flex items-center gap-3 pt-1">
            <span class="text-[11px] text-slate-400">พรีวิวรูปภาพ:</span>
            <img id="modal-item-preview" src="https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80" class="w-16 h-12 rounded object-cover border">
          </div>
        </div>

        <div>
          <label class="block font-bold text-slate-700 mb-1">ลิงก์ไฟล์เอกสาร PDF / Google Drive: *</label>
          <input id="modal-item-pdf" class="w-full p-2.5 rounded-lg border border-slate-300" placeholder="https://drive.google.com/... หรือ ลิงก์ PDF" value="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf">
        </div>
        <div>
          <label class="block font-bold text-slate-700 mb-1">คำอธิบายรายละเอียดเพิ่มเติม:</label>
          <textarea id="modal-item-desc" rows="2" class="w-full p-2.5 rounded-lg border border-slate-300" placeholder="ระบุรายละเอียดสังเขป"></textarea>
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
      const fileInput = document.getElementById("modal-item-file");
      const coverInput = document.getElementById("modal-item-cover");
      const previewImg = document.getElementById("modal-item-preview");
      if (fileInput) {
        fileInput.addEventListener("change", (e) => {
          const file = e.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (ev) => {
            coverInput.value = ev.target.result;
            previewImg.src = ev.target.result;
          };
          reader.readAsDataURL(file);
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
        Swal.showValidationMessage("กรุณากรอกชื่อเอกสาร");
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
      <div class="space-y-3 text-left font-sarabun text-xs max-h-[65vh] overflow-y-auto p-1">
        <div>
          <label class="block font-bold text-slate-700 mb-1">ชื่อเอกสาร / หัวข้อผลงาน:</label>
          <input id="edit-item-title" class="w-full p-2.5 rounded-lg border border-slate-300" value="${item.title || item.roundTitle || ''}">
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block font-bold text-slate-700 mb-1">หมวดหมู่ / ระดับชั้น / คะแนน:</label>
            <input id="edit-item-category" class="w-full p-2.5 rounded-lg border border-slate-300" value="${item.category || item.score || item.level || item.code || ''}">
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">ปีการศึกษา / ปีงบประมาณ:</label>
            <input id="edit-item-year" class="w-full p-2.5 rounded-lg border border-slate-300" value="${item.academicYear || item.fiscalYear || ''}">
          </div>
        </div>

        <!-- Image Upload from Device or URL -->
        <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <label class="block font-bold text-slate-700">รูปภาพหน้าปก (เลือกไฟล์จากเครื่อง หรือใส่ลิงก์):</label>
          <input type="file" id="edit-item-file" accept="image/*" class="text-xs file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100">
          <input id="edit-item-cover" class="w-full p-2 text-[11px] rounded-lg border border-slate-300" value="${currentCover}">
          <div class="flex items-center gap-3 pt-1">
            <span class="text-[11px] text-slate-400">พรีวิวรูปภาพ:</span>
            <img id="edit-item-preview" src="${currentCover || 'https://images.unsplash.com/photo-1544717305-2782549b5136'}" class="w-16 h-12 rounded object-cover border">
          </div>
        </div>

        <div>
          <label class="block font-bold text-slate-700 mb-1">ลิงก์ไฟล์เอกสาร PDF / Google Drive:</label>
          <input id="edit-item-pdf" class="w-full p-2.5 rounded-lg border border-slate-300" value="${item.pdfUrl || item.certificateUrl || item.pa1DocUrl || ''}">
        </div>
        <div>
          <label class="block font-bold text-slate-700 mb-1">คำอธิบายรายละเอียด:</label>
          <textarea id="edit-item-desc" rows="3" class="w-full p-2.5 rounded-lg border border-slate-300">${item.description || item.challengeTitle || ''}</textarea>
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
      const fileInput = document.getElementById("edit-item-file");
      const coverInput = document.getElementById("edit-item-cover");
      const previewImg = document.getElementById("edit-item-preview");
      if (fileInput) {
        fileInput.addEventListener("change", (e) => {
          const file = e.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (ev) => {
            coverInput.value = ev.target.result;
            previewImg.src = ev.target.result;
          };
          reader.readAsDataURL(file);
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
function openProfileEditModal() {
  const data = window.portfolioStorage.getData();
  const p = data.profile || {};

  Swal.fire({
    title: "แก้ไขข้อมูลประวัติส่วนตัวและโรงเรียน",
    html: `
      <div class="space-y-3 text-left font-sarabun text-xs max-h-[65vh] overflow-y-auto p-1">
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
            <label class="block font-bold text-slate-700 mb-1">โรงเรียน:</label>
            <input id="prof-school" class="w-full p-2.5 rounded-lg border border-slate-300" value="${p.school || ''}">
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">สังกัด (สพป./สพม.):</label>
            <input id="prof-affil" class="w-full p-2.5 rounded-lg border border-slate-300" value="${p.affiliation || ''}">
          </div>
        </div>

        <!-- Avatar Upload from Device or URL -->
        <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <label class="block font-bold text-slate-700">รูปภาพโปรไฟล์ (เลือกไฟล์จากเครื่อง หรือใส่ URL):</label>
          <input type="file" id="prof-avatar-file" accept="image/*" class="text-xs file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100">
          <input id="prof-avatar" class="w-full p-2 text-[11px] rounded-lg border border-slate-300" value="${p.avatarUrl || ''}">
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
      if (fileInput) {
        fileInput.addEventListener("change", (e) => {
          const file = e.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (ev) => {
            urlInput.value = ev.target.result;
            previewImg.src = ev.target.result;
          };
          reader.readAsDataURL(file);
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
// 2. Modular Edit Modal: Challenge Issue & YouTube Video
// ==========================================
function openEditPaChallengeModal(paId) {
  const data = window.portfolioStorage.getData();
  const item = data.paRecords?.find(p => String(p.id) === String(paId));
  if (!item) return;

  Swal.fire({
    title: "แก้ไขส่วนที่ 2: ประเด็นท้าทาย & วิดีโอ",
    html: `
      <div class="space-y-3.5 text-left font-sarabun text-xs max-h-[75vh] overflow-y-auto p-1">
        <div>
          <label class="block font-bold text-slate-700 mb-1">ชื่อประเด็นท้าทาย: *</label>
          <input id="edit-pa-challenge-title" class="w-full p-2.5 rounded-lg border border-slate-300 font-bold bg-white" placeholder="เช่น การพัฒนาผลสัมฤทธิ์การเขียนโปรแกรม..." value="${item.challengeTitle || ''}">
        </div>

        <div>
          <label class="block font-bold text-slate-700 mb-1">วัตถุประสงค์:</label>
          <textarea id="edit-pa-challenge-obj" rows="2" class="w-full p-2.5 rounded-lg border border-slate-300 bg-white" placeholder="ระบุเป้าหมายหรือวัตถุประสงค์">${item.challengeObjective || ''}</textarea>
        </div>

        <div>
          <label class="block font-bold text-slate-700 mb-1">วิธีดำเนินการ:</label>
          <textarea id="edit-pa-challenge-method" rows="3" class="w-full p-2.5 rounded-lg border border-slate-300 bg-white" placeholder="ระบุกระบวนการ ออกแบบ หรือนวัตกรรมที่นำมาใช้">${item.challengeMethod || ''}</textarea>
        </div>

        <div>
          <label class="block font-bold text-slate-700 mb-1">ผลลัพธ์ที่เกิดขึ้นจริง:</label>
          <textarea id="edit-pa-challenge-res" rows="2" class="w-full p-2.5 rounded-lg border border-slate-300 bg-white" placeholder="ระบุผลสัมฤทธิ์เชิงปริมาณและเชิงคุณภาพ">${item.challengeResult || ''}</textarea>
        </div>

        <!-- YouTube Video Link -->
        <div class="p-3.5 bg-rose-50/80 rounded-xl border border-rose-200 space-y-1.5">
          <label class="block font-bold text-rose-900 text-xs flex items-center gap-1.5">
            <i data-lucide="video" class="w-4 h-4 text-rose-600"></i> ลิงก์คลิปวิดีโอบันทึกการสอน / นวัตกรรม (YouTube):
          </label>
          <input id="edit-pa-youtube-url" class="w-full p-2.5 rounded-lg border border-rose-300 bg-white font-mono text-xs" placeholder="https://www.youtube.com/watch?v=... หรือ https://youtu.be/... (เว้นว่างได้)" value="${item.youtubeUrl || (item.youtubeVideoId ? `https://www.youtube.com/watch?v=${item.youtubeVideoId}` : '')}">
          <p class="text-[11px] text-rose-700/90 font-sarabun">* หากไม่ระบุลิงก์ ระบบจะซ่อนกรอบวิดีโอและขยายเนื้อหาประเด็นท้าทายเต็มหน้าจออย่างสวยงาม</p>
        </div>
      </div>
    `,
    width: "680px",
    showCancelButton: true,
    confirmButtonText: "บันทึกประเด็นท้าทาย",
    cancelButtonText: "ยกเลิก",
    confirmButtonColor: "#d97706",
    cancelButtonColor: "#64748b",
    didOpen: () => initIcons(),
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

      return {
        challengeTitle,
        challengeObjective,
        challengeMethod,
        challengeResult,
        youtubeUrl,
        youtubeVideoId
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

    return `
      <div class="p-5 bg-white rounded-2xl border-2 border-amber-400/80 shadow-md space-y-4 animate-in fade-in duration-200">
        <!-- Indicator Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div class="space-y-0.5">
            <span class="text-xs font-bold text-amber-700 flex items-center gap-1.5">
              <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-600"></i> ตัวชี้วัดที่ ${activeItem.code}
            </span>
            <h4 class="text-base sm:text-lg font-bold text-slate-800 leading-snug">${activeItem.title}</h4>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            ${isAdmin ? `
              <button type="button" onclick="openEditSingleIndicatorModal('${paId}', ${aspectIndex}, '${activeItem.code}')" class="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-navy-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer">
                <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                <span>แก้ไขตัวชี้วัดนี้/เพิ่มภาพ</span>
              </button>
            ` : ''}
          </div>
        </div>

        <!-- 1. คำอธิบายผลการปฏิบัติงานของตัวชี้วัดนี้ -->
        <div class="space-y-1.5">
          <span class="font-bold text-xs text-slate-700 flex items-center gap-1.5">
            <i data-lucide="file-edit" class="w-3.5 h-3.5 text-blue-600"></i> ผลการปฏิบัติงานและร่องรอยหลักฐานเชิงประจักษ์:
          </span>
          <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 font-sarabun text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            ${activeItem.details || "ยังไม่ได้ระบุรายละเอียดผลการปฏิบัติงานสำหรับตัวชี้วัดนี้"}
          </div>
        </div>

        <!-- 2. รูปภาพหลักฐานพร้อมคำบรรยายใต้ภาพ -->
        <div class="space-y-2 pt-1">
          <div class="flex items-center justify-between">
            <span class="font-bold text-xs text-slate-700 flex items-center gap-1.5">
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
              <p class="text-xs text-slate-500 font-sarabun">ยังไม่มีรูปภาพกิจกรรมสำหรับตัวชี้วัดนี้</p>
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
        fileInput.addEventListener("change", (e) => {
          syncCaptions();
          const files = Array.from(e.target.files);
          files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => {
              currentImages.push({
                url: ev.target.result,
                caption: file.name ? `ภาพกิจกรรม: ${file.name.replace(/\.[^/.]+$/, "")}` : "ภาพกิจกรรมประกอบการประเมิน"
              });
              if (container) {
                container.innerHTML = renderImageListHtml();
                initIcons();
              }
            };
            reader.readAsDataURL(file);
          });
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
// ==========================================
// Backup & Restore / Data Export Center Modal
// ==========================================
function openBackupRestoreModal() {
  Swal.fire({
    title: "ศูนย์ดาวน์โหลด & สำรองข้อมูลทั้งหมด",
    html: `
      <div class="space-y-4 text-left font-sarabun text-xs max-h-[75vh] overflow-y-auto p-1">
        <div class="p-3 bg-blue-50 rounded-2xl border border-blue-200 text-blue-900 leading-relaxed">
          <p class="font-bold flex items-center gap-1.5 text-xs text-blue-800 mb-1">
            <i data-lucide="info" class="w-4 h-4 text-blue-600"></i> เกี่ยวกับการสำรองและย้ายระบบ:
          </p>
          <span>ท่านสามารถดาวน์โหลดไฟล์ข้อมูลทั้งหมด (ทั้งประวัติ, แผนการสอน, รูปภาพ, ข้อมูล วPA 15 ตัวชี้วัด, ประเด็นท้าทาย, และลิงก์เอกสาร) เก็บไว้ในเครื่องคอมพิวเตอร์ และนำไปเปิดใช้งานบน <strong>Vercel (vercel.app)</strong> หรือเครื่องอื่นได้ทันที 100%</span>
        </div>

        <div class="space-y-3">
          <!-- Export Button -->
          <div class="p-4 bg-gradient-to-r from-amber-50 to-amber-100/50 rounded-2xl border border-amber-200 space-y-2">
            <div class="flex items-center justify-between">
              <span class="font-bold text-slate-800 text-xs font-prompt flex items-center gap-1.5">
                <i data-lucide="download-cloud" class="w-4 h-4 text-amber-600"></i> 1. ดาวน์โหลดข้อมูลทั้งหมด (Export JSON)
              </span>
              <span class="text-[10px] text-amber-800 font-semibold bg-amber-200/70 px-2 py-0.5 rounded-md">แนะนำ</span>
            </div>
            <p class="text-[11px] text-slate-600">บันทึกข้อมูลทุกอย่างในระบบเป็นไฟล์สำรอง .json เก็บไว้ในเครื่อง</p>
            <button onclick="handleExportJSON()" class="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold font-prompt text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer">
              <i data-lucide="download" class="w-4 h-4"></i>
              <span>ดาวน์โหลดไฟล์สำรองข้อมูล (JSON Backup)</span>
            </button>
          </div>
          
          <!-- Import Section -->
          <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
            <span class="font-bold text-slate-800 text-xs font-prompt flex items-center gap-1.5">
              <i data-lucide="upload-cloud" class="w-4 h-4 text-blue-600"></i> 2. นำเข้าข้อมูลที่เคยบันทึกไว้ (Import JSON)
            </span>
            <p class="text-[11px] text-slate-600">เลือกไฟล์ .json ที่เคยสำรองไว้ เพื่อดึงข้อมูลกลับมาแสดงผลทันที</p>
            <input type="file" id="import-json-file" accept=".json" class="w-full text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-800 hover:file:bg-blue-200 cursor-pointer">
            <button onclick="handleImportJSON()" class="w-full py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold font-prompt text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer">
              <i data-lucide="check" class="w-4 h-4"></i>
              <span>ยืนยันนำเข้าข้อมูลนี้เข้าสู่ระบบ</span>
            </button>
          </div>

          <!-- Reset Default -->
          <div class="pt-2 border-t border-slate-200">
            <button onclick="handleResetDefaultData()" class="w-full py-2 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold font-prompt text-xs flex items-center justify-center gap-2 transition-all cursor-pointer">
              <i data-lucide="rotate-ccw" class="w-4 h-4"></i>
              <span>รีเซ็ตกลับเป็นข้อมูลตัวอย่างเริ่มต้น</span>
            </button>
          </div>
        </div>
      </div>
    `,
    width: "600px",
    showConfirmButton: false,
    showCloseButton: true,
    didOpen: () => initIcons()
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
        fileInput.addEventListener("change", (e) => {
          const file = e.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (ev) => {
            coverInput.value = ev.target.result;
            previewImg.src = ev.target.result;
          };
          reader.readAsDataURL(file);
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
        fileInput.addEventListener("change", (e) => {
          const file = e.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (ev) => {
            coverInput.value = ev.target.result;
            previewImg.src = ev.target.result;
          };
          reader.readAsDataURL(file);
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

// 4. Quick Avatar Upload Modal (เปลี่ยนรูปโปรไฟล์แบบด่วน)
function openQuickAvatarModal() {
  const data = window.portfolioStorage.getData();
  const currentAvatar = data.profile?.avatarUrl || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2";

  Swal.fire({
    title: "📸 เปลี่ยนรูปภาพโปรไฟล์ครูซอส",
    html: `
      <div class="space-y-4 text-center font-sarabun text-xs">
        <div class="flex justify-center">
          <img id="avatar-live-preview" src="${currentAvatar}" class="w-32 h-32 rounded-full object-cover border-4 border-amber-400 shadow-xl">
        </div>

        <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 text-left space-y-2">
          <label class="block font-bold text-slate-700">1. เลือกรูปภาพจากเครื่องคอมพิวเตอร์ หรือ มือถือ:</label>
          <input type="file" id="avatar-file-upload" accept="image/*" class="w-full text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-500 file:text-white hover:file:bg-amber-600">
        </div>

        <div class="text-left space-y-1">
          <label class="block font-bold text-slate-700">2. หรือ วางลิงก์รูปภาพ (Image URL):</label>
          <input id="avatar-url-input" class="w-full p-2.5 rounded-lg border border-slate-300" value="${currentAvatar}" placeholder="https://...">
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: "บันทึกรูปโปรไฟล์",
    cancelButtonText: "ยกเลิก",
    confirmButtonColor: "#2563eb",
    cancelButtonColor: "#64748b",
    didOpen: () => {
      const fileInput = document.getElementById("avatar-file-upload");
      const urlInput = document.getElementById("avatar-url-input");
      const previewImg = document.getElementById("avatar-live-preview");

      if (fileInput) {
        fileInput.addEventListener("change", (e) => {
          const file = e.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (ev) => {
            urlInput.value = ev.target.result;
            previewImg.src = ev.target.result;
          };
          reader.readAsDataURL(file);
        });
      }
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
