import * as tmImage from '@teachablemachine/image';

const URL = '/model/';

let model: tmImage.CustomMobileNet | null = null;

export async function loadModel() {
  if (model) return model;
  const modelURL = URL + 'model.json';
  const metadataURL = URL + 'metadata.json';
  
  try {
    model = await tmImage.load(modelURL, metadataURL);
    return model;
  } catch (error) {
    console.error("Gagal memuat model AI:", error);
    return null;
  }
}

export async function predictImage(imageElement: HTMLImageElement | HTMLCanvasElement) {
  if (!model) {
    await loadModel();
  }
  if (!model) return null;
  
  try {
    // Return array of objects: { className: string, probability: number }
    const predictions = await model.predictTopK(imageElement, 2);
    return predictions;
  } catch (error) {
    console.error("Gagal melakukan prediksi AI:", error);
    return null;
  }
}
