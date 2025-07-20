import fetch from "node-fetch";
import {
  getEnabledServices,
  getServiceConfig,
  IMAGE_SERVICES_CONFIG,
} from "./imageServicesConfig.js";

/**
 * Get a fallback image URL when all AI services fail
 * @param {string} prompt - The original prompt
 * @returns {string} - Fallback image URL
 */
function getFallbackImageUrl(prompt) {
  const { fallbackImage } = IMAGE_SERVICES_CONFIG;
  const keywords = prompt.toLowerCase().split(" ").slice(0, 3).join("+");
  return `https://via.placeholder.com/${fallbackImage.width}x${
    fallbackImage.height
  }/${fallbackImage.backgroundColor}/${
    fallbackImage.textColor
  }?text=${encodeURIComponent(prompt.slice(0, 30))}`;
}

/**
 * Generate image using Unsplash API (free tier)
 * @param {string} prompt - The prompt describing the image
 * @returns {Promise<string>} - Direct URL to the image
 */
async function callUnsplash({ prompt }) {
  try {
    // Unsplash API requires an access key, but we can use their public API for basic searches
    const searchTerm = prompt.toLowerCase().split(" ").slice(0, 2).join(" ");
    const encodedSearch = encodeURIComponent(searchTerm);

    // Use Unsplash's public API (limited but free)
    const url = `https://source.unsplash.com/800x600/?${encodedSearch}`;

    const serviceConfig = getServiceConfig("Unsplash");
    const timeout = serviceConfig?.timeout || 15000;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Unsplash API error: ${res.status} ${res.statusText}`);
    }

    return url;
  } catch (error) {
    console.error("callUnsplash error:", error.message);
    throw new Error(`Unsplash service unavailable: ${error.message}`);
  }
}

/**
 * Generate image using Lorem Flickr (reliable free service)
 * @param {string} prompt - The prompt describing the image
 * @param {number} slideNumber - The slide number for uniqueness
 * @returns {Promise<string>} - Direct URL to the image
 */
async function callLoremFlickr({ prompt, slideNumber = 0 }) {
  try {
    console.log(
      `🔧 Lorem Flickr called with prompt: "${prompt}" for slide ${
        slideNumber + 1
      }`
    );

    // Extract meaningful keywords from the prompt
    const words = prompt
      .toLowerCase()
      .replace(/[^\w\s]/g, "") // Remove special characters
      .split(" ")
      .filter((word) => word.length > 2) // Only words longer than 2 characters
      .slice(0, 3); // Take first 3 meaningful words

    // If no meaningful words, use some defaults
    const searchTerms =
      words.length > 0 ? words : ["abstract", "design", "color"];

    // Create a unique search string
    const searchString = searchTerms.join(",");
    const encodedSearch = encodeURIComponent(searchString);

    // Add slide number and random seed to ensure uniqueness
    const randomSeed = Math.floor(Math.random() * 1000);
    const uniqueSeed = slideNumber * 1000 + randomSeed;

    // Use Lorem Flickr's public API with unique parameters
    const url = `https://loremflickr.com/800/600/${encodedSearch}?random=${uniqueSeed}`;

    console.log(`🔧 Lorem Flickr URL: ${url}`);

    const serviceConfig = getServiceConfig("Lorem Flickr");
    const timeout = serviceConfig?.timeout || 15000;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(
        `Lorem Flickr API error: ${res.status} ${res.statusText}`
      );
    }

    console.log(`🔧 Lorem Flickr success: ${url}`);
    return url;
  } catch (error) {
    console.error("callLoremFlickr error:", error.message);
    throw new Error(`Lorem Flickr service unavailable: ${error.message}`);
  }
}

/**
 * Generate image using Lorem Picsum (reliable fallback)
 * @param {string} prompt - The prompt describing the image
 * @param {number} slideNumber - The slide number for uniqueness
 * @returns {Promise<string>} - Direct URL to the image
 */
async function callLoremPicsum({ prompt, slideNumber = 0 }) {
  try {
    console.log(
      `🔧 Lorem Picsum called with prompt: "${prompt}" for slide ${
        slideNumber + 1
      }`
    );

    // Generate a unique seed based on the prompt content and slide number
    const promptHash = prompt
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const randomSeed = Math.floor(Math.random() * 1000);
    const uniqueSeed = promptHash + randomSeed + slideNumber * 1000;

    // Add blur and grayscale variations for more uniqueness
    const blur = Math.floor(Math.random() * 10) + 1; // Random blur 1-10
    const grayscale = Math.random() > 0.5 ? "&grayscale" : ""; // Random grayscale

    const url = `https://picsum.photos/800/600?random=${uniqueSeed}&blur=${blur}${grayscale}`;

    console.log(`🔧 Lorem Picsum URL: ${url}`);

    const serviceConfig = getServiceConfig("Lorem Picsum");
    const timeout = serviceConfig?.timeout || 10000;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(
        `Lorem Picsum API error: ${res.status} ${res.statusText}`
      );
    }

    console.log(`🔧 Lorem Picsum success: ${url}`);
    return url;
  } catch (error) {
    console.error("callLoremPicsum error:", error.message);
    throw new Error(`Lorem Picsum service unavailable: ${error.message}`);
  }
}

/**
 * Generate a simple colored placeholder image (guaranteed to work)
 * @param {string} prompt - The prompt describing the image
 * @param {number} slideNumber - The slide number for uniqueness
 * @returns {Promise<string>} - Direct URL to the image
 */
async function callSimplePlaceholder({ prompt, slideNumber = 0 }) {
  try {
    console.log(
      `🔧 Simple Placeholder called with prompt: "${prompt}" for slide ${
        slideNumber + 1
      }`
    );

    // Generate colors based on the prompt content and slide number
    const colors = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#96CEB4",
      "#FFEAA7",
      "#DDA0DD",
      "#98D8C8",
      "#F7DC6F",
      "#BB8FCE",
      "#85C1E9",
      "#F8C471",
      "#82E0AA",
      "#F1948A",
      "#85C1E9",
      "#D7BDE2",
      "#FAD7A0",
      "#ABEBC6",
      "#F9E79F",
      "#D5A6BD",
      "#A9CCE3",
    ];

    // Create a unique color based on prompt content and slide number
    const promptHash = prompt
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colorIndex = (promptHash + slideNumber) % colors.length;
    const bgColor = colors[colorIndex].replace("#", "");

    // Choose contrasting text color
    const textColor = "ffffff"; // White text for dark backgrounds

    // Extract meaningful words from prompt for display
    const words = prompt
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(" ")
      .filter((word) => word.length > 2)
      .slice(0, 2);

    const displayText = words.length > 0 ? words.join(" ") : "Image";
    const encodedText = encodeURIComponent(displayText);

    // Add slide number and random size variations for uniqueness
    const width = 800 + Math.floor(Math.random() * 100) + slideNumber * 10; // 800-900 + slide variation
    const height = 600 + Math.floor(Math.random() * 50) + slideNumber * 5; // 600-650 + slide variation

    // Create a simple placeholder with the prompt text
    const url = `https://via.placeholder.com/${width}x${height}/${bgColor}/${textColor}?text=${encodedText}`;

    console.log(`🔧 Simple Placeholder URL: ${url}`);
    console.log(`🔧 Simple Placeholder success: ${url}`);

    return url;
  } catch (error) {
    console.error("callSimplePlaceholder error:", error.message);
    throw new Error(`Simple Placeholder service unavailable: ${error.message}`);
  }
}

/**
 * @params {string} prompt - The prompt describing the image
 * @returns {Promise<string>} - Direct URL to the generated image
 */
async function callPollinations({ prompt }) {
  try {
    const encodedPrompt = encodeURIComponent(prompt.trim());
    const url = `https://image.pollinations.ai/prompt/${encodedPrompt}`;

    const serviceConfig = getServiceConfig("Pollinations");
    const timeout = serviceConfig?.timeout || 30000;

    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      // Provide more specific error messages based on status codes
      let errorMessage = `Pollinations API error: ${res.status} ${res.statusText}`;

      switch (res.status) {
        case 502:
          errorMessage =
            "Pollinations API is temporarily unavailable (Bad Gateway). Please try again later.";
          break;
        case 503:
          errorMessage =
            "Pollinations API is currently under maintenance. Please try again later.";
          break;
        case 429:
          errorMessage =
            "Rate limit exceeded for Pollinations API. Please wait a moment and try again.";
          break;
        case 500:
          errorMessage =
            "Pollinations API internal server error. Please try again later.";
          break;
      }

      throw new Error(errorMessage);
    }

    return url;
  } catch (error) {
    console.error("callPollinations error:", error.message);

    // If it's a timeout or network error, provide a more helpful message
    if (error.name === "AbortError") {
      throw new Error(
        "Image generation timed out. The service may be slow. Please try again."
      );
    }

    if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
      throw new Error(
        "Cannot connect to image generation service. Please check your internet connection."
      );
    }

    throw error;
  }
}

/**
 * Try multiple image generation services in order of preference
 * @param {string} prompt - The prompt describing the image
 * @param {number} slideNumber - The slide number for uniqueness
 * @returns {Promise<string>} - Direct URL to the generated image
 */
async function generateImageWithFallbacks({ prompt, slideNumber = 0 }) {
  const enabledServices = getEnabledServices();

  // Map service names to their functions
  const serviceFunctions = {
    Pollinations: callPollinations,
    Unsplash: callUnsplash,
    "Lorem Flickr": callLoremFlickr,
    "Lorem Picsum": callLoremPicsum,
    "Simple Placeholder": callSimplePlaceholder,
  };

  console.log(
    `🔍 Available services:`,
    enabledServices.map((s) => s.name)
  );
  console.log(`🔍 Service functions:`, Object.keys(serviceFunctions));
  console.log(
    `🔍 Processing slide ${slideNumber + 1} with prompt: "${prompt}"`
  );

  for (let i = 0; i < enabledServices.length; i++) {
    const service = enabledServices[i];
    const serviceFunction = serviceFunctions[service.name];

    console.log(
      `🔍 Processing service: ${service.name}, Function: ${
        serviceFunction ? serviceFunction.name : "NOT FOUND"
      }`
    );

    if (!serviceFunction) {
      console.warn(`⚠️ Service function not found for ${service.name}`);
      continue;
    }

    try {
      console.log(
        `🖼️ Trying ${service.name} for image generation (slide ${
          slideNumber + 1
        })...`
      );
      const imageUrl = await serviceFunction({ prompt, slideNumber });
      console.log(
        `✅ ${service.name} generated image successfully for slide ${
          slideNumber + 1
        }`
      );
      return imageUrl;
    } catch (error) {
      console.error(
        `❌ ${service.name} failed for slide ${slideNumber + 1}:`,
        error.message
      );

      // If this is the last service, throw the error
      if (i === enabledServices.length - 1) {
        throw new Error(
          `All image generation services failed for slide ${
            slideNumber + 1
          }. Last error: ${error.message}`
        );
      }

      // Continue to next service
      console.log(`⏭️ Moving to next service for slide ${slideNumber + 1}...`);
    }
  }
}

export {
  callPollinations,
  callUnsplash,
  callLoremFlickr,
  callLoremPicsum,
  callSimplePlaceholder,
  generateImageWithFallbacks,
  getFallbackImageUrl,
};
