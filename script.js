const themeToggle = document.querySelector(".theme-toggle");
const promptForm = document.querySelector(".prompt-form");
const promptInput = document.querySelector(".prompt-input");
const promptBtn = document.querySelector(".prompt-btn");
const generateBtn = document.querySelector(".generate-btn");
const modelSelect = document.getElementById("model-select");
const countSelect = document.getElementById("count-select");
const ratioSelect = document.getElementById("ratio-select");
const gridGallery = document.querySelector(".gallery-grid");

// ==========================================
// BACKEND CONFIGURATION
// Replace this with your new Render service URL if creating a new service:
// ==========================================
const PRODUCTION_BACKEND_URL = "https://image-generator-backend-rti3.onrender.com/generate";
const LOCAL_BACKEND_URL = "http://localhost:3000/generate";

// Dynamic routing: connects to localhost during local dev, or your production URL live
const BACKEND_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1" ||
  window.location.port === "3000"
    ? LOCAL_BACKEND_URL
    : PRODUCTION_BACKEND_URL;

// ==========================================
// DYNAMIC MODULAR PROMPT GENERATOR
// Combinatorial system generating thousands of unique, high-detail prompts
// ==========================================
const promptComponents = {
  subjects: [
    "a cybernetic ronin in carbon-fiber armor with glowing cyan circuitry",
    "an ethereal spirit fox woven from northern lights and starlight",
    "a majestic crystal dragon with amethyst scales and incandescent horns",
    "a curious baby red panda wearing a detective hat and knitted vest",
    "a solitary interstellar astronaut in an illuminated advanced spacesuit",
    "an elegant celestial goddess draped in flowing translucent stardust silk",
    "a Victorian steampunk airship with polished brass gears and canvas sails",
    "an intricate mechanical clockwork owl with golden gears and glowing eyes",
    "a powerful sorceress wielding glowing runes and floating spellbooks",
    "a sleek futuristic cyberpunk supercar with glowing neon outlines",
    "a majestic snow leopard with frost-dusted fur and piercing golden eyes",
    "an ancient stone guardian overgrown with bioluminescent flora",
    "an avant-garde fashion model in a sculpted liquid gold gown",
    "a mythical phoenix with radiant wings of incandescent pure flame"
  ],
  environments: [
    "against the backdrop of a rain-soaked Neo-Tokyo cyberpunk metropolis",
    "situated deep within an enchanted bioluminescent forest with glowing flora",
    "floating high above golden sunset clouds over a mythical mountain citadel",
    "exploring ancient overgrown Mayan ruins wrapped in lush tropical jungle vines",
    "nestled inside a warm glass greenhouse during a gentle winter snowfall",
    "perched atop a jagged sea cliff overlooking crashing turquoise waves",
    "inside a grand celestial library with towering spiraling mahogany bookshelves",
    "amidst the red sand dunes and glass biodomes of a Mars research colony",
    "within an ancient submerged cathedral surrounded by glowing jellyfish schools",
    "in a serene Japanese zen garden with falling pink cherry blossom petals"
  ],
  lighting: [
    "illuminated by dramatic volumetric god rays and soft atmospheric haze",
    "bathed in warm cinematic golden hour rim lighting with deep soft shadows",
    "lit by vibrant neon signs reflecting off wet surfaces in moody twilight",
    "shimmering under mystical moonlight and an emerald aurora borealis",
    "glowing with warm amber lanterns and soft background bokeh",
    "cast in ethereal morning mist with pastel twilight gradients"
  ],
  styles: [
    "hyper-realistic 8k cinematic photography, shot on 85mm f/1.4 lens, masterpiece",
    "Studio Ghibli inspired anime watercolor, soft painterly textures, vibrant color palette",
    "isometric 3D diorama render, Octane engine, ray-traced reflections, ultra-sharp detail",
    "epic fantasy digital matte painting, highly detailed concept art, ArtStation trending",
    "Pixar and Disney 3D animation style, rich subsurface scattering, whimsical mood",
    "cinematic sci-fi concept art, Unreal Engine 5 render, photorealistic textures",
    "high-fashion editorial photography, Vogue cover aesthetic, dramatic studio lighting"
  ]
};

// Generates dynamic combined prompts across word categories
const getRandomItem = (array) =>
  array[Math.floor(Math.random() * array.length)];

const generateDynamicPrompt = () => {
  const s = getRandomItem(promptComponents.subjects);
  const e = getRandomItem(promptComponents.environments);
  const l = getRandomItem(promptComponents.lighting);
  const st = getRandomItem(promptComponents.styles);

  // Capitalize first character and cleanly join comma-separated modular clauses
  const subjectCapitalized = s.charAt(0).toUpperCase() + s.slice(1);
  return `${subjectCapitalized}, ${e}, ${l}, ${st}.`;
};

// Set theme based on saved preference or system default
(() => {
  const savedTheme = localStorage.getItem("theme");
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches;

  const isDarkTheme = savedTheme === "dark" || (!savedTheme && systemTheme);
  document.body.classList.toggle("dark-theme", isDarkTheme);
  themeToggle.querySelector("i").className = isDarkTheme
    ? "fa-solid fa-sun"
    : "fa-solid fa-moon";
})();

// Switch between light and dark theme
const toggleTheme = () => {
  const isDarkTheme = document.body.classList.toggle("dark-theme");
  localStorage.setItem("theme", isDarkTheme ? "dark" : "light");
  themeToggle.querySelector("i").className = isDarkTheme
    ? "fa-solid fa-sun"
    : "fa-solid fa-moon";
};

// Calculate width/height based on chosen aspect ratio
const getImageDimensions = (aspectRatio, baseSize = 512) => {
  const [width, height] = aspectRatio.split("/").map(Number);
  const scaleFactor = baseSize / Math.sqrt(width * height);

  let calculatedWidth = Math.round(width * scaleFactor);
  let calculatedHeight = Math.round(height * scaleFactor);

  // Ensure dimensions are multiples of 16(AI model requirements)
  calculatedWidth = Math.floor(calculatedWidth / 16) * 16;
  calculatedHeight = Math.floor(calculatedHeight / 16) * 16;

  return { width: calculatedWidth, height: calculatedHeight };
};

// Update image card with generated image
const updateImageCard = (imgIndex, imgUrl) => {
  const imgCard = document.getElementById(`img-card-${imgIndex}`);
  if (!imgCard) return;

  // Format current date and time
  const now = new Date();
  const formattedDate = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}_${now.getHours().toString().padStart(2, "0")}-${now.getMinutes().toString().padStart(2, "0")}-${now.getSeconds().toString().padStart(2, "0")}`;

  imgCard.classList.remove("loading");
  imgCard.innerHTML = `<img src="${imgUrl}" class="result-img"/>
                        <div class="img-overlay">
                            <button class="img-fullview-btn">
                                <i class="fa-solid fa-expand"></i>
                            </button>
                            <a href="${imgUrl}" class="img-download-btn" download="AI-Image_${formattedDate}.png">
                                <i class="fa-solid fa-download"></i>
                            </a>
                        </div>`;
};

// Updated generateImages function to use backend with unique seed per card
const generateImages = async (
  selectedModel,
  imageCount,
  aspectRatio,
  promptText,
) => {
  const { width, height } = getImageDimensions(aspectRatio);
  generateBtn.setAttribute("disabled", true);

  const baseSeed = Math.floor(Math.random() * 1000000);

  const imagePromises = Array.from({ length: imageCount }, async (_, i) => {
    const cardSeed = baseSeed + i * 7919;
    try {
      const response = await fetch(BACKEND_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: selectedModel,
          prompt: promptText,
          width,
          height,
          seed: cardSeed,
        }),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        let errMsg = `Generation failed (${response.status})`;
        try {
          const json = JSON.parse(errText);
          errMsg = json.error || json.message || errMsg;
        } catch (_) {}
        console.error("Server returned", response.status, errText);
        throw new Error(errMsg);
      }

      const blob = await response.blob();
      updateImageCard(i, URL.createObjectURL(blob));
    } catch (error) {
      console.error(error);
      const imgCard = document.getElementById(`img-card-${i}`);
      if (imgCard) {
        imgCard.classList.replace("loading", "error");
        imgCard.querySelector(".status-text").textContent =
          error.message || "Generation Failed! Please try again.";
      }
    }
  });

  await Promise.all(imagePromises);
  generateBtn.removeAttribute("disabled");
};

// Create placeholder cards with loading spinner
const createImageCards = (
  selectedModel,
  imageCount,
  aspectRatio,
  promptText,
) => {
  gridGallery.innerHTML = "";

  for (let i = 0; i < imageCount; i++) {
    gridGallery.innerHTML += `<div class="img-card loading" id="img-card-${i}" style="aspect-ratio: ${aspectRatio}">
                        <div class="status-container">
                            <div class="spinner"></div>
                            <i class="fa-solid fa-triangle-exclamation"></i>
                            <p class="status-text">Generating...</p>
                        </div>
                    </div>`;
  }

  generateImages(selectedModel, imageCount, aspectRatio, promptText);
};

// Handle form submission
const handleFormSubmit = (e) => {
  e.preventDefault();

  // Get form values
  const selectedModel = modelSelect.value;
  const imageCount = parseInt(countSelect.value) || 1;
  const aspectRatio = ratioSelect.value || "1/1";
  const promptText = promptInput.value.trim();

  createImageCards(selectedModel, imageCount, aspectRatio, promptText);
};

// Generate a new dynamic combinatorial prompt on dice button click
promptBtn.addEventListener("click", () => {
  promptInput.value = generateDynamicPrompt();
  promptInput.focus();
});

promptForm.addEventListener("submit", handleFormSubmit);

// Toggle theme on button click
themeToggle.addEventListener("click", toggleTheme);

// Fullview functionality
const fullviewContainer = document.querySelector(".fullview-container");
const fullviewImage = document.querySelector(".fullview-image");

// Show full view image
const showFullView = (imgUrl) => {
  fullviewImage.src = imgUrl;
  fullviewContainer.style.display = "flex";
  document.body.style.overflow = "hidden";
  fullviewImage.style.transform = "scale(1)";
};

// Hide full view image
const hideFullView = () => {
  fullviewContainer.style.display = "none";
  fullviewImage.src = "";
  document.body.style.overflow = "auto";
  fullviewImage.style.transform = "scale(1)";
  zoomIndicator.style.display = "none";
};

// Zoom indicator
const createZoomIndicator = () => {
  const indicator = document.createElement("div");
  indicator.className = "zoom-indicator";
  indicator.style.display = "none";
  fullviewContainer.appendChild(indicator);
  return indicator;
};

const zoomIndicator = createZoomIndicator();

const updateZoomIndicator = (scale, event) => {
  zoomIndicator.textContent = `${Math.round(scale * 100)}%`;
  zoomIndicator.style.display = "block";

  if (event) {
    const x = event.clientX;
    const y = event.clientY - 30;
    zoomIndicator.style.left = `${x}px`;
    zoomIndicator.style.top = `${y}px`;
  }

  setTimeout(() => {
    zoomIndicator.style.display = "none";
  }, 1500);
};

// Add zoom functionality
fullviewImage.addEventListener("wheel", (e) => {
  e.preventDefault();

  const currentScale =
    parseFloat(fullviewImage.style.transform.replace("scale(", "")) || 1;
  let newScale = currentScale;

  if (e.deltaY < 0) {
    newScale = Math.min(currentScale + 0.1, 3);
  } else {
    newScale = Math.max(currentScale - 0.1, 0.5);
  }

  fullviewImage.style.transform = `scale(${newScale})`;
  updateZoomIndicator(newScale, e);
});

// Image view event listeners
document.addEventListener("click", (e) => {
  if (e.target.closest(".img-fullview-btn")) {
    e.preventDefault();
    e.stopPropagation();
    const imgCard = e.target.closest(".img-card");
    const img = imgCard.querySelector(".result-img");
    showFullView(img.src);
  }

  if (e.target.closest(".close-btn")) {
    e.preventDefault();
    e.stopPropagation();
    hideFullView();
  }
});
