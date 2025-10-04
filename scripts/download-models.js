const https = require('https');
const fs = require('fs');
const path = require('path');

const MODELS_DIR = path.join(__dirname, '../frontend/public/models');
const BASE_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/';

const MODEL_FILES = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2',
];

function downloadFile(url, destination) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destination);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Falha ao baixar ${url}: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (error) => {
      fs.unlink(destination, () => {});
      reject(error);
    });
  });
}

async function downloadModels() {
  console.log('Baixando modelos do face-api.js...\n');

  if (!fs.existsSync(MODELS_DIR)) {
    fs.mkdirSync(MODELS_DIR, { recursive: true });
    console.log(`Pasta criada: ${MODELS_DIR}\n`);
  }

  let downloadedCount = 0;
  let skippedCount = 0;

  for (const fileName of MODEL_FILES) {
    const filePath = path.join(MODELS_DIR, fileName);
    
    if (fs.existsSync(filePath)) {
      console.log(`✓ ${fileName} (já existe)`);
      skippedCount++;
      continue;
    }

    try {
      const url = BASE_URL + fileName;
      console.log(`Baixando ${fileName}...`);
      await downloadFile(url, filePath);
      console.log(`✓ ${fileName} (baixado com sucesso)`);
      downloadedCount++;
    } catch (error) {
      console.error(`✗ Erro ao baixar ${fileName}:`, error.message);
      process.exit(1);
    }
  }

  console.log(`\nConcluído!`);
  console.log(`- ${downloadedCount} arquivo(s) baixado(s)`);
  console.log(`- ${skippedCount} arquivo(s) já existia(m)`);
  console.log(`\nModelos prontos em: ${MODELS_DIR}`);
}

downloadModels().catch((error) => {
  console.error('Erro ao baixar modelos:', error);
  process.exit(1);
});
