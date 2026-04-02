/**
 * Download face-api.js model files to public/models directory.
 * Run: node scripts/download-models.js
 */
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODELS_DIR = path.join(__dirname, '..', 'public', 'models');

// Using vladmandic/face-api repo (maintained fork) — correct file names use .bin
const BASE_URL = 'https://raw.githubusercontent.com/vladmandic/face-api/master/model';

const MODEL_FILES = [
  // Tiny Face Detector
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model.bin',
  // Face Landmark 68
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model.bin',
  // Face Recognition
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model.bin',
];

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    
    const request = (url) => {
      https.get(url, (response) => {
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          request(response.headers.location);
          return;
        }
        
        if (response.statusCode !== 200) {
          file.close();
          fs.unlink(dest, () => {});
          reject(new Error(`HTTP ${response.statusCode}`));
          return;
        }
        
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      }).on('error', (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
    };
    
    request(url);
  });
}

async function main() {
  console.log('📦 Downloading face-api.js model files...\n');
  console.log(`   Source: ${BASE_URL}\n`);

  if (!fs.existsSync(MODELS_DIR)) {
    fs.mkdirSync(MODELS_DIR, { recursive: true });
    console.log(`   Created directory: ${MODELS_DIR}\n`);
  }

  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const filename of MODEL_FILES) {
    const dest = path.join(MODELS_DIR, filename);
    
    // Skip if file exists AND is larger than 100 bytes (prevents 0-byte broken file issues)
    if (fs.existsSync(dest) && fs.statSync(dest).size > 100) {
      console.log(`  ⏭  ${filename} (already exists)`);
      skipped++;
      continue;
    }

    const url = `${BASE_URL}/${filename}`;
    process.stdout.write(`  ⬇  ${filename}...`);
    
    try {
      await downloadFile(url, dest);
      const size = fs.statSync(dest).size;
      const sizeStr = size > 1024 * 1024 
        ? `${(size / 1024 / 1024).toFixed(1)} MB` 
        : `${(size / 1024).toFixed(0)} KB`;
      console.log(` ✅ (${sizeStr})`);
      downloaded++;
    } catch (err) {
      console.log(` ❌ ${err.message}`);
      failed++;
    }
  }

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`  Downloaded: ${downloaded}  |  Skipped: ${skipped}  |  Failed: ${failed}`);
  console.log(`  📁 Models: ${MODELS_DIR}`);
  
  if (failed > 0) {
    console.log(`\n  💡 If downloads failed, manually download from:`);
    console.log(`     https://github.com/vladmandic/face-api/tree/master/model`);
    console.log(`     Place files in: ${MODELS_DIR}`);
  } else {
    console.log(`\n  ✅ All models ready! You can now run: npm run dev`);
  }
}

main().catch(console.error);
