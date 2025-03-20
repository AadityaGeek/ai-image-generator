const themeToggle = document.querySelector(".theme-toggle");
const promptForm = document.querySelector(".prompt-form");
const promptInput = document.querySelector(".prompt-input");
const promptBtn = document.querySelector(".prompt-btn");
const generateBtn = document.querySelector(".generate-btn");
const modelSelect = document.getElementById("model-select");
const countSelect = document.getElementById("count-select");
const ratioSelect = document.getElementById("ratio-select");
const gridGallery = document.querySelector(".gallery-grid");

// Your backend URL from Render.com
const BACKEND_URL = 'https://image-generator-api-xv6i.onrender.com/generate'; // Replace with your actual Render URL

const examplePrompts = [
    "A picture of a dog",
    "A picture of a cat",
    "A picture of a fox",
    "A picture of a panda",
    "A picture of a panda eating a strawberry",
    "A picture of a panda playing with a ball",
    "A magic forest with glowing plants and fairy homes among giant mushrooms",
    "An old steampunk airship floating through golden clouds at sunset",
    "A future Mars colony with glass domes and gardens against red mountains",
    "A dragon sleeping on gold coins in a crystal cave",
    "An underwater kingdom with merpeople and glowing coral buildings",
    "A floating island with waterfalls pouring into clouds below",
    "A witch's cottage in fall with magic herbs in the garden",
    "A robot painting in a sunny studio with art supplies around it",
    "A magical library with floating glowing books and spiral staircases",
    "A Japanese shrine during cherry blossom season with lanterns and misty mountains",
    "A cosmic beach with glowing sand and an aurora in the night sky",
    "A medieval marketplace with colorful tents and street performers",
    "A cyberpunk city with neon signs and flying cars at night",
    "A peaceful bamboo forest with a hidden ancient temple",
    "A giant turtle carrying a village on its back in the ocean",
    "A futuristic city with skyscrapers and futuristic cars",
    "A crystalline ice palace with aurora borealis in the background",
    "A cozy treehouse cafe serving magical potions and floating pastries",
    "An ancient ruins overgrown with bioluminescent plants at twilight",
    "A steampunk laboratory with brass instruments and tesla coils",
    "A floating market in space with alien vendors and exotic goods",
    "A mystical garden where musical instruments grow like plants",
    "A dragon's tea party with cupcakes and floating teacups",
    "An underwater art gallery with merfolk admiring sea-themed paintings",
    "A candy kingdom with chocolate waterfalls and lollipop trees",
    "A time-traveling train station with portals to different eras",
    "A giant clockwork city powered by rainbow-colored gears",
    "A desert oasis with floating crystal pools and palm trees",
    "A library in the clouds with books flying like birds",
    "A greenhouse on Mars with exotic alien plants",
    "A fairy village built from mushrooms and autumn leaves",
    "A phoenix rising from crystal ashes in a volcanic cave",
    "A city where buildings are made of giant musical instruments",
    "A magical toy shop at midnight with toys coming to life",
    "An enchanted forest wedding with fairy lights and unicorns",
    "A space station garden with zero-gravity floating flowers",
];

// Set theme based on saved preference or system default
(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches;

    const isDarkTheme = savedTheme === "dark" || (!savedTheme && systemTheme);
    document.body.classList.toggle("dark-theme", isDarkTheme);
    themeToggle.querySelector("i").className = isDarkTheme ? "fa-solid fa-sun" : "fa-solid fa-moon";
})();

// Switch between light and dark theme
const toggleTheme = () => {
    const isDarkTheme = document.body.classList.toggle("dark-theme");
    localStorage.setItem("theme", isDarkTheme ? "dark" : "light");
    themeToggle.querySelector("i").className = isDarkTheme ? "fa-solid fa-sun" : "fa-solid fa-moon";
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
    if(!imgCard) return;

    imgCard.classList.remove("loading");
    imgCard.innerHTML = `<img src="${imgUrl}" class="result-img"/>
                        <div class="img-overlay">
                            <button class="img-fullview-btn">
                                <i class="fa-solid fa-expand"></i>
                            </button>
                            <a href="${imgUrl}" class="img-download-btn" download="${Date.now()}.png">
                                <i class="fa-solid fa-download"></i>
                            </a>
                        </div>`;
};


// Updated generateImages function to use backend
const generateImages = async (selectedModel, imageCount, aspectRatio, promptText) => {
    const { width, height } = getImageDimensions(aspectRatio);
    generateBtn.setAttribute("disabled", true);

    const imagePromises = Array.from({ length: imageCount }, async(_, i) => {
        try {
            const response = await fetch(BACKEND_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: selectedModel,
                    prompt: promptText,
                    width,
                    height
                })
            });

            if (!response.ok) throw new Error('Generation failed');

            const blob = await response.blob();
            updateImageCard(i, URL.createObjectURL(blob));
        } catch (error) {
            console.log(error);
            const imgCard = document.getElementById(`img-card-${i}`);
            imgCard.classList.replace("loading", "error");
            imgCard.querySelector(".status-text").textContent = "Generation Failed! Check console for more details.";
        }
    });

    await Promise.all(imagePromises);
    generateBtn.removeAttribute("disabled");
};

// Create placeholder cards with loading spinner
const createImageCards = (selectedModel, imageCount, aspectRatio, promptText) => {
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

// Fill prompt input with a random example prompt
promptBtn.addEventListener("click", () => {
    const prompt = examplePrompts[Math.floor(Math.random() * examplePrompts.length)];
    promptInput.value = prompt;
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
    
    const currentScale = parseFloat(fullviewImage.style.transform.replace("scale(", "")) || 1;
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
