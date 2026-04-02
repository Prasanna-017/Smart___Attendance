/**
 * Face Detection Service using @vladmandic/face-api
 * Handles model loading, face detection, descriptor extraction, and matching.
 */
import * as faceapi from '@vladmandic/face-api';

const MODEL_URL = '/models';
let modelsLoaded = false;

/**
 * Load all required face-api.js models from /public/models
 */
export async function loadModels() {
  if (modelsLoaded) return true;
  
  try {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
    modelsLoaded = true;
    console.log('✅ Face-api.js models loaded successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to load face-api.js models:', error);
    return false;
  }
}

/**
 * Check if models are loaded
 */
export function areModelsLoaded() {
  return modelsLoaded;
}

/**
 * Detect a single face in an image/video element and return its descriptor.
 * @param {HTMLVideoElement|HTMLImageElement|HTMLCanvasElement} input 
 * @returns {Promise<{detection: object, descriptor: Float32Array} | null>}
 */
export async function detectSingleFace(input) {
  if (!modelsLoaded) {
    console.warn('Models not loaded yet');
    return null;
  }

  const result = await faceapi
    .detectSingleFace(input, new faceapi.TinyFaceDetectorOptions({
      inputSize: 416,
      scoreThreshold: 0.5,
    }))
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!result) return null;

  return {
    detection: result.detection,
    landmarks: result.landmarks,
    descriptor: result.descriptor,
    box: result.detection.box,
  };
}

/**
 * Detect all faces in an input element.
 * @param {HTMLVideoElement|HTMLImageElement|HTMLCanvasElement} input
 * @returns {Promise<Array>}
 */
export async function detectAllFaces(input) {
  if (!modelsLoaded) return [];

  const results = await faceapi
    .detectAllFaces(input, new faceapi.TinyFaceDetectorOptions({
      inputSize: 416,
      scoreThreshold: 0.5,
    }))
    .withFaceLandmarks()
    .withFaceDescriptors();

  return results;
}

/**
 * Match a face descriptor against a list of known descriptors.
 * Uses Euclidean distance — lower is better.
 * @param {Float32Array} descriptor - The detected face descriptor
 * @param {Array<{id, name, student_id, face_descriptor}>} knownStudents - Known students with descriptors
 * @param {number} threshold - Maximum distance for a valid match (default: 0.52)
 * @returns {{ student: object, distance: number } | null}
 */
export function matchFace(descriptor, knownStudents, threshold = 0.52) {
  if (!knownStudents || knownStudents.length === 0) return null;

  let bestMatch = null;
  let bestDistance = Infinity;

  for (const student of knownStudents) {
    if (!student.face_descriptor) continue;

    let fd = student.face_descriptor;
    
    // Robustly parse face_descriptor since it might be serialized as a string or object from the DB
    if (typeof fd === 'string') {
      try {
        fd = JSON.parse(fd);
      } catch (e) {
        continue;
      }
    }
    
    // In case JS array got serialized as an object with numeric keys {"0": 0.1, "1": 0.2}
    if (fd && !Array.isArray(fd) && typeof fd === 'object') {
      fd = Object.values(fd);
    }

    if (!fd || !fd.length) continue;

    const knownDescriptor = new Float32Array(fd);
    const distance = faceapi.euclideanDistance(descriptor, knownDescriptor);

    if (distance < bestDistance) {
      bestDistance = distance;
      bestMatch = student;
    }
  }

  if (bestDistance <= threshold && bestMatch) {
    // Math: In face-api, a distance of 0.3 to 0.5 is actually a very strong match.
    // However, 1 - 0.4 = 0.6 (60%), which looks unintuitive to users.
    // We adjust the curve so valid matches (<=0.6) visually map closer to 80%-100%
    const adjustedConfidence = Math.min(1.0, (1 - bestDistance) + 0.35);

    return {
      student: bestMatch,
      distance: bestDistance,
      confidence: adjustedConfidence,
    };
  }

  return null;
}

/**
 * Extract face descriptor from an uploaded image file.
 * @param {File} imageFile 
 * @returns {Promise<Float32Array | null>}
 */
export async function extractDescriptorFromFile(imageFile) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.onload = async () => {
        try {
          const result = await detectSingleFace(img);
          resolve(result ? result.descriptor : null);
        } catch (err) {
          reject(err);
        }
      };
      img.src = e.target.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(imageFile);
  });
}

/**
 * Draw face detection result on a canvas overlay.
 * @param {HTMLCanvasElement} canvas 
 * @param {object} detection 
 * @param {{ width: number, height: number }} displaySize 
 * @param {string} label 
 * @param {string} color 
 */
export function drawDetection(canvas, detection, displaySize, label = '', color = '#3b82f6') {
  const ctx = canvas.getContext('2d');
  faceapi.matchDimensions(canvas, displaySize);

  const resizedDetection = faceapi.resizeResults(detection, displaySize);
  const box = resizedDetection.detection.box;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw bounding box
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(box.x, box.y, box.width, box.height);

  // Draw label background
  if (label) {
    const textWidth = ctx.measureText(label).width;
    ctx.fillStyle = color;
    ctx.fillRect(box.x, box.y - 24, textWidth + 16, 24);

    // Draw label text
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Inter, sans-serif';
    ctx.fillText(label, box.x + 8, box.y - 7);
  }

  // Draw corner accents
  const cornerLen = 12;
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;

  // Top-left
  ctx.beginPath();
  ctx.moveTo(box.x, box.y + cornerLen);
  ctx.lineTo(box.x, box.y);
  ctx.lineTo(box.x + cornerLen, box.y);
  ctx.stroke();

  // Top-right
  ctx.beginPath();
  ctx.moveTo(box.x + box.width - cornerLen, box.y);
  ctx.lineTo(box.x + box.width, box.y);
  ctx.lineTo(box.x + box.width, box.y + cornerLen);
  ctx.stroke();

  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(box.x, box.y + box.height - cornerLen);
  ctx.lineTo(box.x, box.y + box.height);
  ctx.lineTo(box.x + cornerLen, box.y + box.height);
  ctx.stroke();

  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(box.x + box.width - cornerLen, box.y + box.height);
  ctx.lineTo(box.x + box.width, box.y + box.height);
  ctx.lineTo(box.x + box.width, box.y + box.height - cornerLen);
  ctx.stroke();
}

export { faceapi };
