import * as ort from 'onnxruntime-web';

// Configure ONNX Runtime to load wasm files from CDN so that bundle size on Vercel remains small
ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.30.0/dist/';
ort.env.wasm.numThreads = 1; // 1 thread is safest and most compatible across browser environments

const MODEL_PATH = '/model_mobilenetv3/flood_mobilenetv3.onnx';
const CLASS_INDICES_PATH = '/model_mobilenetv3/class_indices.json';

let session: ort.InferenceSession | null = null;
let classNames: string[] = ['Banjir', 'Bukan Banjir'];

export interface PredictionResult {
  className: string;
  probability: number;
}

export async function loadModel(): Promise<ort.InferenceSession | null> {
  if (session) return session;

  try {
    // Attempt to load dynamic class indices if available
    try {
      const res = await fetch(CLASS_INDICES_PATH);
      if (res.ok) {
        const indicesMap: Record<string, number> = await res.json();
        const sorted = Object.entries(indicesMap).sort((a, b) => a[1] - b[1]);
        classNames = sorted.map(([name]) =>
          name === 'banjir' ? 'Banjir' :
          name === 'bukan_banjir' ? 'Bukan Banjir' :
          name
        );
      }
    } catch {
      // Fallback default
    }

    session = await ort.InferenceSession.create(MODEL_PATH, {
      executionProviders: ['wasm'],
    });
    console.log('✅ Model MobileNetV3 (ONNX) berhasil dimuat');
    return session;
  } catch (error) {
    console.error('Gagal memuat model MobileNetV3 ONNX:', error);
    return null;
  }
}

/**
 * Preprocesses HTMLImageElement or HTMLCanvasElement to PyTorch ImageNet normalized NCHW tensor
 * Expected input shape: [1, 3, 224, 224]
 */
function preprocessImage(imageElement: HTMLImageElement | HTMLCanvasElement): ort.Tensor {
  const width = 224;
  const height = 224;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Cannot get 2D canvas context');

  ctx.drawImage(imageElement, 0, 0, width, height);
  const imgData = ctx.getImageData(0, 0, width, height).data;

  // PyTorch MobileNetV3 expects NCHW format: [1, 3, 224, 224]
  const totalPixels = width * height;
  const float32Data = new Float32Array(3 * totalPixels);

  // PyTorch ImageNet standard normalization constants
  const mean = [0.485, 0.456, 0.406];
  const std = [0.229, 0.224, 0.225];

  for (let i = 0; i < totalPixels; i++) {
    const r = imgData[i * 4] ?? 0;
    const g = imgData[i * 4 + 1] ?? 0;
    const b = imgData[i * 4 + 2] ?? 0;

    // Normalization formula: (pixel / 255.0 - mean) / std
    float32Data[i] = (r / 255.0 - mean[0]!) / std[0]!;                         // Channel R
    float32Data[i + totalPixels] = (g / 255.0 - mean[1]!) / std[1]!;           // Channel G
    float32Data[i + 2 * totalPixels] = (b / 255.0 - mean[2]!) / std[2]!;       // Channel B
  }

  return new ort.Tensor('float32', float32Data, [1, 3, height, width]);
}

/**
 * Softmax activation function to convert logits into probabilities
 */
function softmax(logits: Float32Array | number[]): number[] {
  const max = Math.max(...logits);
  const exp = Array.from(logits).map((v) => Math.exp(v - max));
  const sum = exp.reduce((a, b) => a + b, 0);
  return exp.map((v) => v / (sum || 1));
}

export async function predictImage(
  imageElement: HTMLImageElement | HTMLCanvasElement
): Promise<PredictionResult[] | null> {
  try {
    if (!session) {
      await loadModel();
    }
    if (!session) return null;

    const inputTensor = preprocessImage(imageElement);
    const inputName = session.inputNames[0] || 'input';
    const feeds: Record<string, ort.Tensor> = { [inputName]: inputTensor };

    const outputMap = await session.run(feeds);
    const outputName = session.outputNames[0] || 'output';
    const outputTensor = outputMap[outputName];

    if (!outputTensor) {
      throw new Error('Output tensor tidak ditemukan dari model');
    }

    const logits = outputTensor.data as Float32Array;
    const probabilities = softmax(logits);

    const predictions: PredictionResult[] = probabilities.map((prob, idx) => ({
      className: classNames[idx] || `Kelas ${idx}`,
      probability: prob,
    }));

    // Sort descending by probability
    predictions.sort((a, b) => b.probability - a.probability);
    return predictions;
  } catch (error) {
    console.error('Gagal melakukan prediksi MobileNetV3:', error);
    return null;
  }
}
