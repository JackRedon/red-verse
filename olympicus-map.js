// Mobile Menu Toggle
const rvMapHamburger = document.getElementById("rvMapHamburger");
const rvMapMobileMenu = document.getElementById("rvMapMobileMenu");

if (rvMapHamburger && rvMapMobileMenu) {
    rvMapHamburger.addEventListener("click", function () {
        const isOpen = rvMapMobileMenu.classList.toggle("open");
        rvMapHamburger.classList.toggle("open", isOpen);
        rvMapHamburger.setAttribute("aria-expanded", isOpen);
    });
}

// Map Elements
const frame = document.getElementById("mapFrame");
const container = document.getElementById("mapContainer");
const image = document.getElementById("mapImage");

// Camera Settings
let scale = 1;
let minimumScale = 1;
let x = 0;
let y = 0;

let zoomInHeld = false;
let zoomOutHeld = false;

const MAX_ZOOM = 6;
const ZOOM_SPEED = 0.0015;

// Drag Settings
let dragging = false;
let pointerStartX = 0;
let pointerStartY = 0;
let startingX = 0;
let startingY = 0;

function updateMap() {
    if (!container) return;
    container.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
}

function clampMap() {
    if (!frame || !image) return;

    const frameWidth = frame.clientWidth;
    const frameHeight = frame.clientHeight;
    const mapWidth = image.naturalWidth * scale;
    const mapHeight = image.naturalHeight * scale;

    if (mapWidth <= frameWidth) {
        x = (frameWidth - mapWidth) / 2;
    } else {
        const minimumX = frameWidth - mapWidth;
        x = Math.max(minimumX, Math.min(0, x));
    }

    if (mapHeight <= frameHeight) {
        y = (frameHeight - mapHeight) / 2;
    } else {
        const minimumY = frameHeight - mapHeight;
        y = Math.max(minimumY, Math.min(0, y));
    }
}

function fitMap() {
    if (!frame || !image) return;

    const frameWidth = frame.clientWidth;
    const frameHeight = frame.clientHeight;
    const imageWidth = image.naturalWidth;
    const imageHeight = image.naturalHeight;

    if (!imageWidth || !imageHeight || !frameWidth || !frameHeight) return;

    const widthRatio = frameWidth / imageWidth;
    const heightRatio = frameHeight / imageHeight;

    minimumScale = Math.min(widthRatio, heightRatio);
    scale = minimumScale;

    const mapWidth = imageWidth * scale;
    const mapHeight = imageHeight * scale;

    x = (frameWidth - mapWidth) / 2;
    y = (frameHeight - mapHeight) / 2;

    updateMap();
}

function sizeFrame() {
    if (!frame || !image) return;

    const imageWidth = image.naturalWidth;
    const imageHeight = image.naturalHeight;

    if (!imageWidth || !imageHeight) return;

    const ratio = imageWidth / imageHeight;
    const availableWidth = window.innerWidth * 0.94;
    const availableHeight = window.innerHeight * 0.76;

    let width = availableWidth;
    let height = width / ratio;

    if (height > availableHeight) {
        height = availableHeight;
        width = height * ratio;
    }

    frame.style.width = `${width}px`;
    frame.style.height = `${height}px`;

    fitMap();
}

let lastTime = performance.now();

function zoomLoop(currentTime) {
    const delta = Math.min(currentTime - lastTime, 50);
    lastTime = currentTime;

    let direction = 0;
    if (zoomInHeld) direction = 1;
    if (zoomOutHeld) direction = -1;

    if (direction !== 0 && frame) {
        const oldScale = scale;
        scale *= Math.pow(1 + ZOOM_SPEED, direction * delta);

        const maximumScale = minimumScale * MAX_ZOOM;
        scale = Math.max(minimumScale, Math.min(maximumScale, scale));

        const centerX = frame.clientWidth / 2;
        const centerY = frame.clientHeight / 2;
        const ratio = scale / oldScale;

        x = centerX - (centerX - x) * ratio;
        y = centerY - (centerY - y) * ratio;

        clampMap();
        updateMap();
    }

    requestAnimationFrame(zoomLoop);
}

// Keyboard Controls
window.addEventListener("keydown", function (event) {
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        event.preventDefault();
    }
    if (event.key === "ArrowUp") zoomInHeld = true;
    if (event.key === "ArrowDown") zoomOutHeld = true;
});

window.addEventListener("keyup", function (event) {
    if (event.key === "ArrowUp") zoomInHeld = false;
    if (event.key === "ArrowDown") zoomOutHeld = false;
});

// Drag Controls
if (frame) {
    frame.addEventListener("pointerdown", function (event) {
        if (event.target.closest(".country-label")) return;
        if (scale <= minimumScale + 0.001) return;

        dragging = true;
        pointerStartX = event.clientX;
        pointerStartY = event.clientY;
        startingX = x;
        startingY = y;
        frame.setPointerCapture(event.pointerId);
    });

    frame.addEventListener("pointermove", function (event) {
        if (!dragging) return;
        x = startingX + (event.clientX - pointerStartX);
        y = startingY + (event.clientY - pointerStartY);
        clampMap();
        updateMap();
        updateMapLabels();
    });

    frame.addEventListener("pointerup", function () {
        dragging = false;
    });

    frame.addEventListener("pointercancel", function () {
        dragging = false;
    });
}

function startMap() {
    sizeFrame();
    requestAnimationFrame(zoomLoop);
}

if (image) {
    if (image.complete) {
        startMap();
    } else {
        image.addEventListener("load", startMap);
    }
}

window.addEventListener("resize", sizeFrame);

// Label Visibility
const continentLabels = document.querySelectorAll(".continent-label");
const countryLabels = document.querySelectorAll(".country-label");

function updateMapLabels() {
    if (!minimumScale) return;
    const zoomLevel = scale / minimumScale;

    if (zoomLevel >= 1.5) {
        continentLabels.forEach(label => (label.style.display = "none"));
        countryLabels.forEach(label => (label.style.display = "block"));
    } else {
        continentLabels.forEach(label => (label.style.display = "block"));
        countryLabels.forEach(label => (label.style.display = "none"));
    }
}

setInterval(updateMapLabels, 50);

/* =========================================
   PANEL OPEN & CLOSE LOGIC
========================================= */

function openCountry(countryEl) {
    const panel = document.getElementById("countryInfoPanel");
    const nameEl = document.getElementById("countryInfoName");
    const listEl = document.getElementById("countryCharacterList");

    if (!panel || !nameEl || !listEl) return;

    nameEl.textContent = countryEl.getAttribute("data-country") || "UNKNOWN";
    listEl.innerHTML = "";

    const characterData = countryEl.getAttribute("data-characters");
    if (characterData) {
        characterData.split(",").forEach(character => {
            const li = document.createElement("li");
            li.textContent = character.trim();
            listEl.appendChild(li);
        });
    }

    panel.classList.add("open");
    panel.style.setProperty("display", "block", "important");
}

function closeCountry() {
    const panel = document.getElementById("countryInfoPanel");
    if (panel) {
        panel.classList.remove("open");
        panel.style.setProperty("display", "none", "important");
    }
}

// Global Listener Initialization
document.addEventListener("DOMContentLoaded", function () {
    const countries = document.querySelectorAll(".country-label");
    const closeBtn = document.getElementById("countryInfoClose");
    const panel = document.getElementById("countryInfoPanel");

    // Handle Country Label Clicks
    countries.forEach(function (country) {
        country.addEventListener("pointerdown", function (event) {
            event.stopPropagation();
        });

        country.addEventListener("click", function (event) {
            event.preventDefault();
            event.stopPropagation();
            openCountry(country);
        });
    });

    // Handle Close Button Clicks directly
    if (closeBtn) {
        closeBtn.addEventListener("pointerdown", function (event) {
            event.preventDefault();
            event.stopPropagation();
        });

        closeBtn.addEventListener("click", function (event) {
            event.preventDefault();
            event.stopPropagation();
            closeCountry();
        });
    }

    // Stop drag events firing when interacting inside the info box
    if (panel) {
        panel.addEventListener("pointerdown", function (event) {
            event.stopPropagation();
        });
    }
});