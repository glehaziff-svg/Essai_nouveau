// Pont sécurisé entre la page (index.html) et le processus principal.
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("classeur", {
  isElectron: true,
  scanStart: () => ipcRenderer.invoke("scan:start"),
  scanStop: () => ipcRenderer.invoke("scan:stop"),
  scanChooseDir: () => ipcRenderer.invoke("scan:chooseDir"),
  scanGetDir: () => ipcRenderer.invoke("scan:getDir"),
  scanHasUtility: () => ipcRenderer.invoke("scan:hasUtility"),
  onScanFile: (cb) => ipcRenderer.on("scan:file", (_e, f) => cb(f)),
  onScanRequest: (cb) => ipcRenderer.on("scan:request", () => cb()),
  notify: (title, body) => ipcRenderer.invoke("app:notify", { title, body }),
  openExternal: (url) => ipcRenderer.invoke("app:openExternal", url),
  saveFile: (name, dataUrl, filters) => ipcRenderer.invoke("app:saveFile", { name, dataUrl, filters }),
});
