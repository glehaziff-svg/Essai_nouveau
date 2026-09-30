// Processus principal : fenêtre, zone de notification, numérisation (IJ Scan Utility), rappels.
const { app, BrowserWindow, Tray, Menu, ipcMain, dialog, shell, Notification, nativeImage } = require("electron");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");

const isWin = process.platform === "win32";
let win = null, tray = null, quitting = false, scanWatcher = null;

/* ---- Réglages persistants (dossier de scan) ---- */
const settingsPath = () => path.join(app.getPath("userData"), "settings.json");
function loadSettings(){ try { return JSON.parse(fs.readFileSync(settingsPath(), "utf8")); } catch { return {}; } }
function saveSettings(s){ try { fs.writeFileSync(settingsPath(), JSON.stringify(s, null, 2)); } catch {} }

/* ---- Emplacements habituels d'IJ Scan Utility ---- */
function findScanUtility(){
  if (!isWin) return null;
  const pf = process.env["ProgramFiles"] || "C:\\Program Files";
  const pf86 = process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)";
  const candidates = [
    path.join(pf86, "Canon", "IJ Scan Utility", "SCANUTILITY.EXE"),
    path.join(pf, "Canon", "IJ Scan Utility", "SCANUTILITY.EXE"),
    path.join(pf86, "Canon", "IJ Scan Utility Lite", "SCANUTILITYLITE.EXE"),
    path.join(pf, "Canon", "IJ Scan Utility Lite", "SCANUTILITYLITE.EXE"),
  ];
  return candidates.find(p => fs.existsSync(p)) || null;
}

/* ---- Dossier de scan par défaut (celui d'IJ Scan Utility : Documents) ---- */
function defaultScanDir(){
  const s = loadSettings();
  if (s.scanDir && fs.existsSync(s.scanDir)) return s.scanDir;
  return app.getPath("documents");
}

/* ---- Surveillance du dossier de scan : tout nouveau PDF/JPG est envoyé à l'application ---- */
const SCAN_EXT = new Set([".pdf", ".jpg", ".jpeg", ".png"]);
function stopWatch(){ if (scanWatcher) { try { scanWatcher.close(); } catch {} scanWatcher = null; } }
function watchScanDir(dir, sinceMs){
  stopWatch();
  const seen = new Set(fs.readdirSync(dir));
  const pending = new Map();
  try {
    scanWatcher = fs.watch(dir, (_evt, name) => {
      if (!name) return;
      const ext = path.extname(name).toLowerCase();
      if (!SCAN_EXT.has(ext) || seen.has(name)) return;
      // Attend que le scanner ait fini d'écrire le fichier (taille stable pendant 1,5 s)
      clearTimeout(pending.get(name));
      pending.set(name, setTimeout(() => {
        const full = path.join(dir, name);
        try {
          const st = fs.statSync(full);
          if (st.mtimeMs < sinceMs - 5000 || st.size === 0) return;
          seen.add(name);
          sendScan(full);
        } catch {}
      }, 1500));
    });
  } catch (e) { /* dossier inaccessible */ }
}
function sendScan(full){
  const data = fs.readFileSync(full);
  const ext = path.extname(full).toLowerCase();
  const type = ext === ".pdf" ? "application/pdf" : ext === ".png" ? "image/png" : "image/jpeg";
  const dataUrl = "data:" + type + ";base64," + data.toString("base64");
  if (win) { win.webContents.send("scan:file", { name: path.basename(full), type, dataUrl }); showWindow(); }
}

/* ---- IPC ---- */
ipcMain.handle("scan:start", async () => {
  const exe = findScanUtility();
  const dir = defaultScanDir();
  watchScanDir(dir, Date.now());
  if (exe) {
    try { spawn(exe, [], { detached: true, stdio: "ignore" }).unref(); } catch (e) { return { ok: false, dir, error: String(e) }; }
    return { ok: true, dir, launched: true };
  }
  return { ok: true, dir, launched: false };
});
ipcMain.handle("scan:stop", async () => { stopWatch(); return true; });
ipcMain.handle("scan:chooseDir", async () => {
  const r = await dialog.showOpenDialog(win, { title: "Dossier où IJ Scan Utility enregistre les scans", properties: ["openDirectory"], defaultPath: defaultScanDir() });
  if (r.canceled || !r.filePaths[0]) return defaultScanDir();
  const s = loadSettings(); s.scanDir = r.filePaths[0]; saveSettings(s);
  return s.scanDir;
});
ipcMain.handle("scan:getDir", async () => defaultScanDir());
ipcMain.handle("scan:hasUtility", async () => !!findScanUtility());
ipcMain.handle("app:notify", async (_e, { title, body }) => {
  if (Notification.isSupported()) { const n = new Notification({ title, body }); n.on("click", showWindow); n.show(); }
  return true;
});
ipcMain.handle("app:openExternal", async (_e, url) => { if (/^https?:/.test(url)) shell.openExternal(url); return true; });
ipcMain.handle("app:saveFile", async (_e, { name, dataUrl, filters }) => {
  const r = await dialog.showSaveDialog(win, { defaultPath: path.join(app.getPath("downloads"), name), filters });
  if (r.canceled || !r.filePath) return null;
  const m = /^data:([^;]+);base64,(.*)$/s.exec(dataUrl);
  fs.writeFileSync(r.filePath, m ? Buffer.from(m[2], "base64") : dataUrl);
  return r.filePath;
});

/* ---- Fenêtre & zone de notification ---- */
function showWindow(){ if (!win) return; if (win.isMinimized()) win.restore(); win.show(); win.focus(); }
function createWindow(){
  win = new BrowserWindow({
    width: 1120, height: 820, minWidth: 720, minHeight: 560,
    title: "Mon Classeur", autoHideMenuBar: true, backgroundColor: "#f4f6fb",
    webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, nodeIntegration: false, spellcheck: true },
  });
  win.loadFile(path.join(__dirname, "..", "index.html"));
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/.test(url)) { shell.openExternal(url); return { action: "deny" }; } return { action: "allow" }; });
  win.on("close", e => { if (!quitting) { e.preventDefault(); win.hide(); } });
  win.on("closed", () => { win = null; });
}
function createTray(){
  const icon = nativeImage.createFromPath(path.join(__dirname, "icon.png"));
  tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon.resize({ width: 16, height: 16 }));
  tray.setToolTip("Mon Classeur — rappels actifs");
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: "Ouvrir Mon Classeur", click: showWindow },
    { label: "Numériser un papier", click: () => { showWindow(); win && win.webContents.send("scan:request"); } },
    { type: "separator" },
    { label: "Quitter", click: () => { quitting = true; app.quit(); } },
  ]));
  tray.on("click", showWindow);
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();
else {
  app.on("second-instance", showWindow);
  app.whenReady().then(() => { createWindow(); createTray(); });
  app.on("before-quit", () => { quitting = true; stopWatch(); });
  app.on("window-all-closed", () => { /* reste en zone de notification pour les rappels */ });
  app.on("activate", () => { if (!win) createWindow(); else showWindow(); });
}
