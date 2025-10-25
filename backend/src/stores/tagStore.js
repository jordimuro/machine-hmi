import logger from '../config/logger.js';

/**
 * TagStore - In-memory store for real-time tag values
 * Structure: Map<string, TagValue>
 *
 * TagValue: {
 *   name: string,
 *   value: number | boolean | string,
 *   quality: "good" | "bad" | "uncertain",
 *   timestamp: number (ms epoch)
 * }
 */
class TagStore {
  constructor() {
    this.tags = new Map();
    this.listeners = new Set();
  }

  /**
   * Update a tag value and notify listeners
   */
  update(name, value, quality = 'good') {
    const tagValue = {
      name,
      value,
      quality,
      timestamp: Date.now(),
    };

    const oldValue = this.tags.get(name);
    this.tags.set(name, tagValue);

    // Notify listeners only if value changed
    if (!oldValue || oldValue.value !== value || oldValue.quality !== quality) {
      this.notifyListeners(tagValue);
    }

    return tagValue;
  }

  /**
   * Get a tag value by name
   */
  get(name) {
    return this.tags.get(name);
  }

  /**
   * Get all tags
   */
  getAll() {
    return Array.from(this.tags.values());
  }

  /**
   * Check if tag exists
   */
  has(name) {
    return this.tags.has(name);
  }

  /**
   * Set tag quality (e.g., when connection lost)
   */
  setQuality(name, quality) {
    const tag = this.tags.get(name);
    if (tag) {
      tag.quality = quality;
      tag.timestamp = Date.now();
      this.notifyListeners(tag);
    }
  }

  /**
   * Set all tags to a specific quality
   */
  setAllQuality(quality) {
    this.tags.forEach((tag, name) => {
      tag.quality = quality;
      tag.timestamp = Date.now();
      this.notifyListeners(tag);
    });
    logger.warn(`All tags set to quality: ${quality}`);
  }

  /**
   * Register a listener for tag updates
   * Listener signature: (tagValue) => void
   */
  addListener(listener) {
    this.listeners.add(listener);
  }

  /**
   * Unregister a listener
   */
  removeListener(listener) {
    this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of tag update
   */
  notifyListeners(tagValue) {
    this.listeners.forEach(listener => {
      try {
        listener(tagValue);
      } catch (error) {
        logger.error({ err: error, tag: tagValue.name }, 'Error in tag listener');
      }
    });
  }

  /**
   * Clear all tags (useful for testing)
   */
  clear() {
    this.tags.clear();
  }
}

// Singleton instance
const tagStore = new TagStore();

export default tagStore;
