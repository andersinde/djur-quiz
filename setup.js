import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGES_SRC = path.resolve(__dirname, "..", "images");
const PUBLIC_IMAGES = path.join(__dirname, "public", "images");
const VILT_JSON = path.resolve(__dirname, "..", "vilt.json");
const MANIFEST_OUT = path.join(__dirname, "public", "manifest.json");

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".tiff", ".avif"]);

// Symlink images into public/
fs.mkdirSync(path.join(__dirname, "public"), { recursive: true });
if (!fs.existsSync(PUBLIC_IMAGES)) {
  fs.symlinkSync(IMAGES_SRC, PUBLIC_IMAGES);
  console.log("Symlinked images/ -> public/images/");
}

// Build manifest: { "category/animal/filename": true }
const manifest = {};

function scan(dir, prefix) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      scan(path.join(dir, entry.name), rel);
    } else if (IMAGE_EXTS.has(path.extname(entry.name).toLowerCase())) {
      manifest[rel] = true;
    }
  }
}

scan(IMAGES_SRC, "");

// Also copy vilt.json into public/
fs.copyFileSync(VILT_JSON, path.join(__dirname, "public", "vilt.json"));

fs.writeFileSync(MANIFEST_OUT, JSON.stringify(manifest, null, 2));
console.log(`Manifest: ${Object.keys(manifest).length} images`);
