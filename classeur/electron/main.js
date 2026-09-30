// Processus principal : fenêtre, zone de notification, numérisation (IJ Scan Utility), rappels.
const { app, BrowserWindow, Tray, Menu, ipcMain, dialog, shell, Notification, nativeImage, protocol, net } = require("electron");
const path = require("path");
const fs = require("fs");
const { pathToFileURL } = require("url");

/* ---- Schéma app:// : sert le dossier de l'application avec une vraie origine (nécessaire aux workers OCR/PDF) ---- */
const APP_ROOT = path.join(__dirname, "..");
protocol.registerSchemesAsPrivileged([{ scheme: "app", privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } }]);
function registerAppProtocol(){
  protocol.handle("app", (req) => {
    const u = new URL(req.url);
    let p = decodeURIComponent(u.pathname); if (p === "/" || p === "") p = "/index.html";
    const full = path.normalize(path.join(APP_ROOT, p));
    if (!full.startsWith(APP_ROOT)) return new Response("Forbidden", { status: 403 });
    return net.fetch(pathToFileURL(full).toString());
  });
}
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
  const s = loadSettings(); if (s.scanApp && fs.existsSync(s.scanApp)) return s.scanApp;
  const pf = process.env["ProgramFiles"] || "C:\\Program Files";
  const pf86 = process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)";
  const candidates = [
    path.join(pf86, "Canon", "IJ Scan Utility", "SCANUTILITY.EXE"),
    path.join(pf, "Canon", "IJ Scan Utility", "SCANUTILITY.EXE"),
    path.join(pf86, "Canon", "IJ Scan Utility Lite", "SCANUTILITYLITE.EXE"),
    path.join(pf, "Canon", "IJ Scan Utility Lite", "SCANUTILITYLITE.EXE"),
  ];
  const hit = candidates.find(p => fs.existsSync(p)); if (hit) return hit;
  // Recherche large dans les dossiers Canon, puis les raccourcis du menu Démarrer
  for (const base of [pf86, pf]) {
    const canon = path.join(base, "Canon");
    try { for (const d of fs.readdirSync(canon)) { if (!/scan/i.test(d)) continue; const dir = path.join(canon, d);
      for (const f of fs.readdirSync(dir)) if (/scan.*\.exe$/i.test(f)) return path.join(dir, f); } } catch {}
  }
  for (const sm of [path.join(process.env.ProgramData || "C:\\ProgramData", "Microsoft", "Windows", "Start Menu", "Programs"), path.join(app.getPath("appData"), "Microsoft", "Windows", "Start Menu", "Programs")]) {
    try { for (const d of fs.readdirSync(sm)) { if (!/canon/i.test(d)) continue; const dir = path.join(sm, d);
      const walk = (p, depth) => { for (const f of fs.readdirSync(p)) { const full = path.join(p, f); if (fs.statSync(full).isDirectory()) { if (depth < 2) { const r = walk(full, depth + 1); if (r) return r; } } else if (/scan.*\.lnk$/i.test(f)) return full; } return null; };
      const r = walk(dir, 0); if (r) return r; } } catch {}
  }
  return null;
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
    try { if (/\.lnk$/i.test(exe)) await shell.openPath(exe); else spawn(exe, [], { detached: true, stdio: "ignore" }).unref(); }
    catch (e) { return { ok: false, dir, error: String(e) }; }
    return { ok: true, dir, launched: true, exe };
  }
  return { ok: true, dir, launched: false };
});
ipcMain.handle("scan:chooseApp", async () => {
  const r = await dialog.showOpenDialog(win, { title: "Programme de numérisation (ex. SCANUTILITY.EXE)", properties: ["openFile"], filters: [{ name: "Programme", extensions: ["exe", "lnk"] }] });
  if (r.canceled || !r.filePaths[0]) return findScanUtility();
  const s = loadSettings(); s.scanApp = r.filePaths[0]; saveSettings(s); return s.scanApp;
});
/* ---- Numérisation directe (WIA) : le scanner démarre, l'image est renvoyée à l'application ---- */
let wiaProc = null;
ipcMain.handle("scan:wia", async (_e, opts) => {
  if (!isWin) return { ok: false, error: "La numérisation directe n'est disponible que sous Windows." };
  if (wiaProc) return { ok: false, error: "Une numérisation est déjà en cours." };
  const dir = path.join(app.getPath("userData"), "scans"); fs.mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
  const out = path.join(dir, "scan-" + stamp + ".jpg");
  const script = path.join(__dirname, "scan.ps1");
  const args = ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", script, "-out", out, "-dpi", String((opts && opts.dpi) || 300), "-mode", (opts && opts.mode) || "color"];
  return new Promise((resolve) => {
    let output = "", err = "";
    try { wiaProc = spawn("powershell.exe", args, { windowsHide: true }); }
    catch (e) { wiaProc = null; return resolve({ ok: false, error: "PowerShell introuvable : " + e.message }); }
    const timer = setTimeout(() => { try { wiaProc.kill(); } catch {} }, 240000);
    wiaProc.stdout.on("data", d => output += d.toString());
    wiaProc.stderr.on("data", d => err += d.toString());
    wiaProc.on("close", () => {
      clearTimeout(timer); wiaProc = null;
      const m = /OK:(.+)$/m.exec(output);
      if (m && fs.existsSync(m[1].trim())) { const file = m[1].trim(); const data = fs.readFileSync(file);
        return resolve({ ok: true, name: path.basename(file), type: "image/jpeg", dataUrl: "data:image/jpeg;base64," + data.toString("base64") }); }
      const e = /ERR:([A-Z_]+):(.*)$/m.exec(output);
      resolve({ ok: false, code: e ? e[1] : "UNKNOWN", error: e ? e[2].trim() : ("Échec de la numérisation. " + (err || output).trim().slice(0, 300)) });
    });
  });
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

/* ---- Google Agenda : lecture de l'adresse iCal secrète (lecture seule, depuis le processus principal : pas de CORS) ---- */
function validGcalUrl(u){ return /^https:\/\/calendar\.google\.com\/calendar\/ical\/.+\.ics$/.test(u||""); }
ipcMain.handle("gcal:getUrl", async () => loadSettings().gcalUrl || "");
ipcMain.handle("gcal:setUrl", async (_e, url) => {
  url = String(url || "").trim();
  if (url && !validGcalUrl(url)) return { ok: false, error: "Adresse invalide : elle doit commencer par https://calendar.google.com/calendar/ical/ et finir par .ics" };
  const s = loadSettings(); s.gcalUrl = url; saveSettings(s); return { ok: true };
});
ipcMain.handle("gcal:fetch", async () => {
  const url = loadSettings().gcalUrl; if (!validGcalUrl(url)) return { ok: false, error: "Aucune adresse Google Agenda enregistrée." };
  try {
    const r = await net.fetch(url, { headers: { "User-Agent": "MonClasseur/1.0" } });
    if (!r.ok) return { ok: false, error: "Google a répondu " + r.status + (r.status === 404 ? " — l'adresse secrète a peut-être été réinitialisée." : "") };
    const text = await r.text();
    if (!/BEGIN:VCALENDAR/.test(text)) return { ok: false, error: "La réponse n'est pas un agenda iCal." };
    return { ok: true, text };
  } catch (e) { return { ok: false, error: "Connexion impossible (" + (e.message || e) + ")" }; }
});

/* ---- Fenêtre & zone de notification ---- */
function showWindow(){ if (!win) return; if (win.isMinimized()) win.restore(); win.show(); win.focus(); }
function createWindow(){
  win = new BrowserWindow({
    width: 1120, height: 820, minWidth: 720, minHeight: 560,
    title: "Mon Classeur", autoHideMenuBar: true, backgroundColor: "#f4f6fb",
    webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, nodeIntegration: false, spellcheck: true },
  });
  win.loadURL("app://classeur/index.html");
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
  app.whenReady().then(() => { registerAppProtocol(); createWindow(); createTray(); });
  app.on("before-quit", () => { quitting = true; stopWatch(); });
  app.on("window-all-closed", () => { /* reste en zone de notification pour les rappels */ });
  app.on("activate", () => { if (!win) createWindow(); else showWindow(); });
}
