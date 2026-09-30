// Copie les bibliothèques OCR (Tesseract.js) et PDF (pdf.js) dans vendor/ pour un usage hors-ligne,
// et récupère le modèle de langue français si absent.
const fs = require("fs"), path = require("path"), zlib = require("zlib"), https = require("https");
const root = path.join(__dirname, ".."), nm = path.join(root, "node_modules"), out = path.join(root, "vendor");
const cp = (src, dst) => { fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.copyFileSync(src, dst); };

// Tesseract.js
const tdir = path.join(out, "tesseract");
cp(path.join(nm, "tesseract.js/dist/tesseract.min.js"), path.join(tdir, "tesseract.min.js"));
cp(path.join(nm, "tesseract.js/dist/worker.min.js"), path.join(tdir, "worker.min.js"));
for (const f of fs.readdirSync(path.join(nm, "tesseract.js-core")))
  if (/^tesseract-core.*\.(js|wasm)$/.test(f)) cp(path.join(nm, "tesseract.js-core", f), path.join(tdir, "core", f));

// pdf.js
cp(path.join(nm, "pdfjs-dist/build/pdf.min.js"), path.join(out, "pdfjs/pdf.min.js"));
cp(path.join(nm, "pdfjs-dist/build/pdf.worker.min.js"), path.join(out, "pdfjs/pdf.worker.min.js"));

// Modèle français (tessdata_fast) → fra.traineddata.gz
const langDir = path.join(tdir, "lang"), gz = path.join(langDir, "fra.traineddata.gz");
fs.mkdirSync(langDir, { recursive: true });
const local = [path.join(root, "fra.traineddata"), "/tmp/fra.dl"].find(p => fs.existsSync(p) && fs.statSync(p).size > 100000);
function finish(buf) { fs.writeFileSync(gz, zlib.gzipSync(buf)); console.log("vendor prêt :", fs.statSync(gz).size, "octets de modèle fra"); }
if (fs.existsSync(gz) && fs.statSync(gz).size > 100000) console.log("vendor prêt (modèle déjà présent)");
else if (local) finish(fs.readFileSync(local));
else {
  const url = "https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/main/fra.traineddata";
  const get = (u, n) => https.get(u, r => { if (r.statusCode >= 300 && r.headers.location && n < 5) return get(r.headers.location, n + 1);
    const chunks = []; r.on("data", c => chunks.push(c)); r.on("end", () => finish(Buffer.concat(chunks))); }).on("error", e => { console.error("Téléchargement du modèle impossible :", e.message); process.exit(1); });
  get(url, 0);
}
