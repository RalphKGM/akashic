import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import canvas from 'canvas';
import { convertHeicImage } from '../utils/compressImage.js';

const require = createRequire(import.meta.url);
const faceapi = require('face-api.js');

const { createCanvas, loadImage } = canvas;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MODELS_DIR = path.join(__dirname, '../models/face');

let modelsLoaded = false;

const isHeic = (buffer) => {
    if (!buffer || buffer.length < 12) return false;
    return buffer.slice(4, 12).toString().includes('ftypheic');
};

const normalizeImageBuffer = async (buffer) => {
    if (!isHeic(buffer)) return buffer;
    return await convertHeicImage(buffer);
};

const initFaceApi = async () => {
    if (modelsLoaded) return;

    const { Canvas, Image, ImageData } = canvas;
    faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

    await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromDisk(MODELS_DIR),
        faceapi.nets.faceLandmark68Net.loadFromDisk(MODELS_DIR),
        faceapi.nets.faceRecognitionNet.loadFromDisk(MODELS_DIR),
    ]);

    modelsLoaded = true;
    console.log('Face recognition models loaded');
};

const bufferToCanvas = async (buffer) => {
    const normalized = await normalizeImageBuffer(buffer);
    const img = await loadImage(normalized);
    const cnv = createCanvas(img.width, img.height);
    cnv.getContext('2d').drawImage(img, 0, 0);
    return cnv;
};

export const registerFace = async (imageBuffer) => {
    await initFaceApi();
    const img = await bufferToCanvas(imageBuffer);
    console.log(`[registerFace] image size: ${img.width}x${img.height}`);
    const detection = await faceapi
        .detectSingleFace(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.7 }))
        .withFaceLandmarks()
        .withFaceDescriptor();
    console.log(`[registerFace] detection: ${detection ? 'found' : 'NOT FOUND'}`);
    if (!detection) throw new Error('No face detected. Use a clear, front-facing photo.');
    console.log(`[registerFace] descriptor length: ${detection.descriptor.length}`);
    return Array.from(detection.descriptor);
};

export const detectFacesInImage = async (imageBuffer, knownFaces) => {
    if (!knownFaces || knownFaces.length === 0) return null;
    try {
        await initFaceApi();
        const img = await bufferToCanvas(imageBuffer);
        console.log(`[detectFaces] image size: ${img.width}x${img.height}, known faces: ${knownFaces.map(f => f.name).join(', ')}`);

        const detections = await faceapi
            .detectAllFaces(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.7 }))
            .withFaceLandmarks()
            .withFaceDescriptors();

        console.log(`[detectFaces] faces detected in image: ${detections?.length ?? 0}`);
        if (!detections?.length) return null;

        const labeled = knownFaces.map(f =>
            new faceapi.LabeledFaceDescriptors(f.name, [new Float32Array(f.descriptor.map(Number))])
        );
        const matcher = new faceapi.FaceMatcher(labeled, 0.45);

        const names = new Set();
        for (const d of detections) {
            const match = matcher.findBestMatch(d.descriptor);
            console.log(`[detectFaces] match: ${match.label} (distance: ${match.distance.toFixed(3)})`);
            if (match.label !== 'unknown') names.add(match.label);
        }

        const result = names.size > 0 ? [...names].join(', ') : null;
        console.log(`[detectFaces] result: ${result ?? 'none'}`);
        return result;
    } catch (err) {
        console.error('detectFacesInImage error:', err.message);
        return null;
    }
};