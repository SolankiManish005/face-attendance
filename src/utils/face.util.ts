import * as canvas from "canvas";
import path from "path";

const { Canvas, Image, ImageData } = canvas;

// eslint-disable-next-line @typescript-eslint/no-require-imports
const faceapi = require("face-api.js");
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

let modelsLoaded = false;

export const loadModels = async () => {
    if (modelsLoaded) return;
    console.log("[FACE] Loading face detection models...");
    const modelsPath = path.join(__dirname, "../../models");
    await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromDisk(modelsPath),
        faceapi.nets.faceLandmark68Net.loadFromDisk(modelsPath),
        faceapi.nets.faceRecognitionNet.loadFromDisk(modelsPath),
    ]);
    modelsLoaded = true;
    console.log("[FACE] ✅ Face models loaded successfully");
};

export const extractDescriptor = async (imageBuffer: Buffer): Promise<number[] | null> => {
    await loadModels();
    console.log("[FACE] Extracting face descriptor from image...");
    const img = await canvas.loadImage(imageBuffer);
    const detection = await faceapi
        .detectSingleFace(img)
        .withFaceLandmarks()
        .withFaceDescriptor();
    if (!detection) {
        console.log("[FACE] ❌ No face detected in image");
        return null;
    }
    console.log(`[FACE] ✅ Face detected - confidence: ${detection.detection.score.toFixed(3)}`);
    return Array.from(detection.descriptor as Float32Array);
};
