/**
 * Configuration for image generation services
 * You can enable/disable services or change their order here
 */

export const IMAGE_SERVICES_CONFIG = {
  // Service order (first to last fallback)
  services: [
    {
      name: "Pollinations",
      enabled: true, // Primary service
      priority: 1,
      description: "AI-generated images (best quality)",
      timeout: 30000,
    },
    {
      name: "Unsplash",
      enabled: true, // Enable as first fallback
      priority: 2,
      description: "High-quality stock photos",
      timeout: 15000,
    },
    {
      name: "Lorem Flickr",
      enabled: true, // Enable as second fallback
      priority: 3,
      description: "Random images based on keywords",
      timeout: 15000,
    },
    {
      name: "Lorem Picsum",
      enabled: true, // Enable as third fallback
      priority: 4,
      description: "Reliable placeholder images",
      timeout: 10000,
    },
    {
      name: "Simple Placeholder",
      enabled: true, // Enable as final fallback
      priority: 5,
      description: "Guaranteed working colored placeholders",
      timeout: 5000,
    },
    {
      name: "Pattern Generator",
      enabled: false,
      priority: 6,
      description: "Unique pattern images (guaranteed different)",
      timeout: 5000,
    },
    {
      name: "Gradient Generator",
      enabled: false,
      priority: 7,
      description: "Unique gradient images (guaranteed different)",
      timeout: 5000,
    },
  ],

  // Global settings
  maxRetries: 2,
  retryDelay: 2000, // Base delay in milliseconds
  concurrencyLimit: 3,

  // Fallback settings
  fallbackImage: {
    width: 800,
    height: 600,
    backgroundColor: "f0f0f0",
    textColor: "999999",
  },
};

/**
 * Get enabled services in priority order
 */
export function getEnabledServices() {
  return IMAGE_SERVICES_CONFIG.services
    .filter((service) => service.enabled)
    .sort((a, b) => a.priority - b.priority);
}

/**
 * Get service configuration by name
 */
export function getServiceConfig(serviceName) {
  return IMAGE_SERVICES_CONFIG.services.find(
    (service) => service.name === serviceName
  );
}

export default IMAGE_SERVICES_CONFIG;
