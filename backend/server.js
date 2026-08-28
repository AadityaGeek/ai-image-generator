const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("AI Image Generator API is running");
});

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.post('/generate', async (req, res) => {
  const { model, prompt, width, height, seed } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: "Prompt is required" });
  }

  const targetWidth = parseInt(width, 10) || 512;
  const targetHeight = parseInt(height, 10) || 512;
  const targetSeed = seed !== undefined ? seed : Math.floor(Math.random() * 1000000);

  // 1. Hugging Face Serverless Models (e.g., stabilityai/stable-diffusion-3-medium-diffusers)
  if (model && model.includes('/')) {
    const apiKeys = (process.env.HF_API_KEYS || '')
      .split(',')
      .map(k => k.trim())
      .filter(Boolean);
    const randomApiKey = apiKeys.length > 0
      ? apiKeys[Math.floor(Math.random() * apiKeys.length)]
      : null;

    try {
      const headers = {
        "Content-Type": "application/json",
        "x-use-cache": "false"
      };
      if (randomApiKey) {
        headers["Authorization"] = `Bearer ${randomApiKey}`;
      }

      const hfResponse = await fetch(
        `https://router.huggingface.co/hf-inference/models/${model}`,
        {
          headers,
          method: "POST",
          body: JSON.stringify({
            inputs: prompt,
            parameters: { width: targetWidth, height: targetHeight }
          })
        }
      );

      if (hfResponse.ok) {
        const buffer = await hfResponse.arrayBuffer();
        const contentType = hfResponse.headers.get('content-type') || 'image/jpeg';
        res.set('Content-Type', contentType);
        return res.send(Buffer.from(buffer));
      }

      const errText = await hfResponse.text();
      let errMsg = errText;
      try {
        const json = JSON.parse(errText);
        errMsg = json.error || json.message || errText;
      } catch (_) {}

      console.warn(`HF Model [${model}] failed (${hfResponse.status}):`, errMsg);
      return res.status(hfResponse.status).json({ error: errMsg });
    } catch (error) {
      console.error("HF request error:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  // 2. High-Speed Multi-Model Engine (FLUX.1 Schnell, Realism, Anime, 3D, Turbo)
  try {
    const selectedModel = model || 'flux';
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?model=${encodeURIComponent(selectedModel)}&width=${targetWidth}&height=${targetHeight}&seed=${targetSeed}&nologo=true`;

    const imgResponse = await fetch(imageUrl);
    if (!imgResponse.ok) {
      const errText = await imgResponse.text().catch(() => '');
      throw new Error(errText || `Generation failed: ${imgResponse.status}`);
    }

    const buffer = await imgResponse.arrayBuffer();
    const contentType = imgResponse.headers.get('content-type') || 'image/jpeg';
    res.set('Content-Type', contentType);
    return res.send(Buffer.from(buffer));
  } catch (error) {
    console.error("Generation error:", error);
    return res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
