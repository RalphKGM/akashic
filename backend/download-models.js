import fs from 'fs';
import https from 'https';
import path from 'path';

const MODELS_DIR = './models/face';
if (!fs.existsSync(MODELS_DIR)) fs.mkdirSync(MODELS_DIR, { recursive: true });

const download = (url, dest) => new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const get = (u) => https.get(u, res => {
        if (res.statusCode === 301 || res.statusCode === 302) {
            file.close();
            return get(res.headers.location);
        }
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
    }).on('error', err => { fs.unlink(dest, () => {}); reject(err); });
    get(url);
});

console.log('Cleaning old model files...');
if (fs.existsSync(MODELS_DIR)) {
    fs.readdirSync(MODELS_DIR).forEach(f => fs.unlinkSync(path.join(MODELS_DIR, f)));
}

const BASE = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';

const FILES = [
    'ssd_mobilenetv1_model-weights_manifest.json',
    'ssd_mobilenetv1_model-shard1',
    'ssd_mobilenetv1_model-shard2',
    'face_landmark_68_model-weights_manifest.json',
    'face_landmark_68_model.bin',
    'face_recognition_model-weights_manifest.json',
    'face_recognition_model-shard1',
    'face_recognition_model-shard2',
];

console.log('Downloading models...');
for (const file of FILES) {
    const dest = path.join(MODELS_DIR, file);
    process.stdout.write(`  ${file}...`);
    await download(`${BASE}/${file}`, dest);
    console.log(' done');
}
const manifestPath = path.join(MODELS_DIR, 'face_landmark_68_model-weights_manifest.json');
const manifest = fs.readFileSync(manifestPath, 'utf8');
const patched = manifest.replace(/face_landmark_68_model-shard1/g, 'face_landmark_68_model.bin');
fs.writeFileSync(manifestPath, patched);
console.log('  patched face_landmark_68_model manifest');

console.log('done');