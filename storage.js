/**
 * Storage Manager for Teacher E-Portfolio Web App
 * Handles LocalStorage persistence, Export/Import, Admin PIN authentication, and CRUD operations.
 */

const STORAGE_KEY = "kru_teacher_portfolio_data_v1";
const ADMIN_SESSION_KEY = "kru_portfolio_admin_auth";

class PortfolioStorage {
  constructor() {
    this.init();
  }

  init() {
    try {
      const existing = localStorage.getItem(STORAGE_KEY);
      if (!existing) {
        this.saveData(DEFAULT_PORTFOLIO_DATA);
      }
    } catch (e) {
      console.error("LocalStorage access error:", e);
    }
  }

  getData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Merge missing default keys
        if (!parsed.recentUpdates) {
          parsed.recentUpdates = DEFAULT_PORTFOLIO_DATA.recentUpdates || [];
        }
        if (!parsed.onlineSystems) {
          parsed.onlineSystems = DEFAULT_PORTFOLIO_DATA.onlineSystems || [];
        }
        if (!parsed.settings) {
          parsed.settings = { ...DEFAULT_PORTFOLIO_DATA.settings };
        }
        // Always enforce clean appName
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
              // Ensure default sub-indicators, sample images, and evidence details if missing
              const defaultAspects = DEFAULT_PORTFOLIO_DATA.paRecords?.[0]?.indicators || [];
              rec.indicators.forEach((ind, idx) => {
                const def = defaultAspects[idx] || {};
                if (!ind.items || !Array.isArray(ind.items) || ind.items.length === 0) {
                  ind.items = JSON.parse(JSON.stringify(def.items || []));
                }
                // Ensure image format is object { url, caption }
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
    } catch (e) {
      console.error("Error reading portfolio data:", e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_PORTFOLIO_DATA));
  }

  saveData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      // Dispatch custom event for real-time reactivity
      window.dispatchEvent(new CustomEvent("portfolioDataChanged", { detail: data }));
      return true;
    } catch (e) {
      console.error("Error saving portfolio data:", e);
      return false;
    }
  }

  resetToDefault() {
    this.saveData(DEFAULT_PORTFOLIO_DATA);
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
