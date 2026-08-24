/**
 * Storage Manager for Teacher E-Portfolio Web App
 * Features:
 * - Dual-Engine Persistence (IndexedDB for unlimited storage + LocalStorage for instant sync)
 * - Automatic Image Compression (Canvas-based high-efficiency compression)
 * - QuotaExceededError Prevention & Self-Healing Data Pipeline
 * - Real-time Reactive Events & Admin Role/PIN Security
 */

const STORAGE_KEY = "kru_teacher_portfolio_data_v1";
const ADMIN_SESSION_KEY = "kru_portfolio_admin_auth";
const IDB_NAME = "kru_teacher_portfolio_db";
const IDB_VERSION = 1;
const IDB_STORE = "portfolio_store";

// ==========================================
// IndexedDB Engine (Unlimited Storage Quota)
// ==========================================
function getIndexedDB() {
  return new Promise((resolve) => {
    if (!window.indexedDB) {
      resolve(null);
      return;
    }
    const request = indexedDB.open(IDB_NAME, IDB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => {
      console.warn("IndexedDB open error:", event.target?.error);
      resolve(null);
    };
  });
}

async function saveToIDB(key, value) {
  try {
    const db = await getIndexedDB();
    if (!db) return false;
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, "readwrite");
      const store = tx.objectStore(IDB_STORE);
      const req = store.put(value, key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch (e) {
    console.warn("IndexedDB save error:", e);
    return false;
  }
}

async function loadFromIDB(key) {
  try {
    const db = await getIndexedDB();
    if (!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, "readonly");
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch (e) {
    console.warn("IndexedDB load error:", e);
    return null;
  }
}

// ==========================================
// Client-side Automatic Image Compressor
// ==========================================
window.compressImage = function(fileOrBase64, maxWidth = 1280, quality = 0.82) {
  return new Promise((resolve) => {
    if (!fileOrBase64) {
      resolve("");
      return;
    }

    if (fileOrBase64 instanceof File || fileOrBase64 instanceof Blob) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target.result;
        compressBase64String(base64, maxWidth, quality).then(resolve);
      };
      reader.onerror = () => resolve("");
      reader.readAsDataURL(fileOrBase64);
      return;
    }

    if (typeof fileOrBase64 === "string") {
      if (fileOrBase64.startsWith("data:image")) {
        compressBase64String(fileOrBase64, maxWidth, quality).then(resolve);
      } else {
        resolve(fileOrBase64);
      }
    } else {
      resolve("");
    }
  });
};

function compressBase64String(base64, maxWidth = 1280, quality = 0.82) {
  return new Promise((resolve) => {
    if (!base64 || typeof base64 !== "string" || !base64.startsWith("data:image")) {
      resolve(base64);
      return;
    }
    // If under 80KB or SVG/GIF, keep original
    if (base64.length < 90000 || base64.startsWith("data:image/svg") || base64.startsWith("data:image/gif")) {
      resolve(base64);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      try {
        const compressed = canvas.toDataURL("image/jpeg", quality);
        resolve(compressed);
      } catch (err) {
        resolve(base64);
      }
    };
    img.onerror = () => resolve(base64);
    img.src = base64;
  });
}

// ==========================================
// PortfolioStorage Class Implementation
// ==========================================
class PortfolioStorage {
  constructor() {
    this.memoryData = null;
    this.init();
  }

  init() {
    // 1. Synchronous Instant Load from LocalStorage or Default Data
    try {
      const existing = localStorage.getItem(STORAGE_KEY);
      if (existing) {
        this.memoryData = this.normalizeData(JSON.parse(existing));
      } else {
        this.memoryData = this.normalizeData(DEFAULT_PORTFOLIO_DATA);
        this.saveData(this.memoryData);
      }
    } catch (e) {
      this.memoryData = this.normalizeData(DEFAULT_PORTFOLIO_DATA);
    }

    // 2. Background Async Sync from IndexedDB (Unlimited Data Store)
    loadFromIDB(STORAGE_KEY).then((idbData) => {
      if (idbData && typeof idbData === "object" && idbData.profile) {
        this.memoryData = this.normalizeData(idbData);
        window.dispatchEvent(new CustomEvent("portfolioDataChanged", { detail: this.memoryData }));
      }
    }).catch(err => console.warn("IDB sync warning:", err));
  }

  normalizeData(raw) {
    if (!raw || typeof raw !== "object") {
      return JSON.parse(JSON.stringify(DEFAULT_PORTFOLIO_DATA));
    }
    const parsed = { ...raw };

    if (!parsed.heroSlides) {
      parsed.heroSlides = DEFAULT_PORTFOLIO_DATA.heroSlides || [];
    }
    if (!parsed.recentUpdates) {
      parsed.recentUpdates = DEFAULT_PORTFOLIO_DATA.recentUpdates || [];
    }
    if (!parsed.onlineSystems) {
      parsed.onlineSystems = DEFAULT_PORTFOLIO_DATA.onlineSystems || [];
    }
    if (!parsed.settings) {
      parsed.settings = { ...DEFAULT_PORTFOLIO_DATA.settings };
    }
    if (!parsed.settings.appName || parsed.settings.appName.includes("แฟ้มสะสมงาน")) {
      parsed.settings.appName = "KRUSOS E-PORTFOLIO";
    }
    if (!parsed.settings.dashboardUpdateLayout) {
      parsed.settings.dashboardUpdateLayout = DEFAULT_PORTFOLIO_DATA.settings.dashboardUpdateLayout || "cards";
    }
    if (!parsed.settings.evaluationStatus) {
      parsed.settings.evaluationStatus = DEFAULT_PORTFOLIO_DATA.settings.evaluationStatus || "พร้อมรับการประเมิน";
    }
    if (!parsed.settings.currentAcademicYear) {
      parsed.settings.currentAcademicYear = DEFAULT_PORTFOLIO_DATA.settings.currentAcademicYear || "2568";
    }

    // Clean up dummy placeholder videos so video only displays if user adds one
    if (parsed.paRecords && Array.isArray(parsed.paRecords)) {
      parsed.paRecords.forEach(rec => {
        if (rec.youtubeVideoId === "dQw4w9WgXcQ" || rec.youtubeVideoId === "kJQP7kiw5Fk") {
          rec.youtubeVideoId = "";
          rec.youtubeUrl = "";
        }
        if (rec.totalScore === "95.50" || rec.totalScore === "94.00") {
          rec.totalScore = "";
          rec.status = "พร้อมรับการประเมิน";
        }
        if (rec.indicators && Array.isArray(rec.indicators)) {
          rec.indicators = rec.indicators.filter(ind => !ind.standard.includes("ส่วนที่ 2"));
          const defaultAspects = DEFAULT_PORTFOLIO_DATA.paRecords?.[0]?.indicators || [];
          rec.indicators.forEach((ind, idx) => {
            const def = defaultAspects[idx] || {};
            if (!ind.items || !Array.isArray(ind.items) || ind.items.length === 0) {
              ind.items = JSON.parse(JSON.stringify(def.items || []));
            }
            if (ind.images && Array.isArray(ind.images)) {
              ind.images = ind.images.map(img => typeof img === "string" ? { url: img, caption: "ภาพกิจกรรมและหลักฐาน" } : img);
            } else {
              ind.images = def.images || [];
            }
            if (!ind.evidenceDetails) ind.evidenceDetails = def.evidenceDetails || ind.detail || "";
            if (!ind.docUrl) ind.docUrl = def.docUrl || "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
          });
        }
      });
    }

    return parsed;
  }

  getData() {
    if (this.memoryData) {
      return this.normalizeData(this.memoryData);
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.memoryData = this.normalizeData(JSON.parse(raw));
        return this.memoryData;
      }
    } catch (e) {
      console.error("Error reading portfolio data:", e);
    }
    this.memoryData = this.normalizeData(DEFAULT_PORTFOLIO_DATA);
    return this.memoryData;
  }

  saveData(data) {
    if (!data) return false;
    this.memoryData = this.normalizeData(data);

    // 1. Try to save to LocalStorage (Safe Quota Handling)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.memoryData));
    } catch (e) {
      console.warn("LocalStorage quota reached (5MB), relying on IndexedDB:", e.message);
    }

    // 2. Always persist to IndexedDB (Gigabytes quota)
    saveToIDB(STORAGE_KEY, this.memoryData).catch(err => console.warn("IDB save error:", err));

    // 3. Dispatch reactive change event
    window.dispatchEvent(new CustomEvent("portfolioDataChanged", { detail: this.memoryData }));
    return true;
  }

  resetToDefault() {
    this.memoryData = this.normalizeData(DEFAULT_PORTFOLIO_DATA);
    this.saveData(this.memoryData);
    return true;
  }

  // --- Admin Security & Role Management ---
  isAdmin() {
    return sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
  }

  setAdmin(status) {
    if (status) {
      sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
    } else {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      sessionStorage.removeItem("kru_simulating_viewer");
    }
    window.dispatchEvent(new CustomEvent("adminStatusChanged", { detail: { isAdmin: status } }));
  }

  // Live Viewer Simulation for Admin
  isSimulatingViewer() {
    return this.isAdmin() && sessionStorage.getItem("kru_simulating_viewer") === "true";
  }

  setSimulatingViewer(status) {
    if (status) {
      sessionStorage.setItem("kru_simulating_viewer", "true");
    } else {
      sessionStorage.removeItem("kru_simulating_viewer");
    }
    window.dispatchEvent(new CustomEvent("viewerSimulationChanged", { detail: { isSimulating: status } }));
  }

  verifyPin(inputPin) {
    const data = this.getData();
    const currentPin = data.settings?.pin || "1234";
    return String(inputPin).trim() === String(currentPin).trim();
  }

  changePin(oldPin, newPin) {
    if (!this.verifyPin(oldPin)) {
      return { success: false, message: "รหัส PIN เดิมไม่ถูกต้อง" };
    }
    if (!newPin || newPin.length < 4) {
      return { success: false, message: "รหัส PIN ใหม่ต้องมีอย่างน้อย 4 หลัก" };
    }
    const data = this.getData();
    if (!data.settings) data.settings = {};
    data.settings.pin = String(newPin).trim();
    this.saveData(data);
    return { success: true, message: "เปลี่ยนรหัส PIN สำเร็จ" };
  }

  // --- Settings Management (Academic Years, Layout, Status) ---
  updateSettings(newSettings) {
    const data = this.getData();
    data.settings = { ...data.settings, ...newSettings };
    return this.saveData(data);
  }

  // --- Profile Management ---
  updateProfile(profileData) {
    const data = this.getData();
    data.profile = { ...data.profile, ...profileData };
    return this.saveData(data);
  }

  // --- Generic Item CRUD helper ---
  addItem(collectionName, item) {
    const data = this.getData();
    if (!data[collectionName]) {
      data[collectionName] = [];
    }
    const newItem = {
      ...item,
      id: item.id || `${collectionName.slice(0, 3)}-${Date.now()}`,
      isVisible: item.isVisible !== undefined ? item.isVisible : true
    };
    data[collectionName].unshift(newItem);
    this.saveData(data);
    return newItem;
  }

  updateItem(collectionName, itemId, updatedFields) {
    const data = this.getData();
    if (!data[collectionName]) return false;
    const index = data[collectionName].findIndex(item => String(item.id) === String(itemId));
    if (index !== -1) {
      data[collectionName][index] = { ...data[collectionName][index], ...updatedFields };
      this.saveData(data);
      return true;
    }
    return false;
  }

  deleteItem(collectionName, itemId) {
    const data = this.getData();
    if (!data[collectionName]) return false;
    data[collectionName] = data[collectionName].filter(item => String(item.id) !== String(itemId));
    return this.saveData(data);
  }

  toggleItemVisibility(collectionName, itemId) {
    const data = this.getData();
    if (!data[collectionName]) return false;
    const item = data[collectionName].find(i => String(i.id) === String(itemId));
    if (item) {
      item.isVisible = !item.isVisible;
      this.saveData(data);
      return item.isVisible;
    }
    return null;
  }

  // --- Export & Import Backup ---
  exportJSON() {
    const data = this.getData();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `kru_portfolio_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  importJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && parsed.profile && parsed.settings) {
        this.saveData(parsed);
        return { success: true, message: "นำเข้าข้อมูลสำเร็จ เรียบร้อยแล้ว" };
      } else {
        return { success: false, message: "รูปแบบไฟล์ JSON ไม่ถูกต้อง ไม่พบโครงสร้าง Portfolio" };
      }
    } catch (err) {
      return { success: false, message: "เกิดข้อผิดพลาดในการอ่านไฟล์ JSON: " + err.message };
    }
  }
}

// Global instance
window.portfolioStorage = new PortfolioStorage();
