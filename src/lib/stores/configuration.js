import { writable } from 'svelte/store';
import { browser } from '$app/environment';

function createConfigurationStore() {
  const initialValue = {
    theme: 'day',
    selectedImageIndex: 0
  };

  const { subscribe, set, update } = writable(initialValue);

  if (browser) {
    // Try to load from localStorage when in browser
    try {
      const savedConfig = localStorage.getItem('userConfiguration');
      if (savedConfig) {
        set(JSON.parse(savedConfig));
      }
    } catch (error) {
      console.error('Error loading configuration:', error);
    }

    // Subscribe to changes and save to localStorage
    subscribe((value) => {
      try {
        localStorage.setItem('userConfiguration', JSON.stringify(value));
      } catch (error) {
        console.error('Error saving configuration:', error);
      }
    });
  }

  return {
    subscribe,
    set,
    update
  };
}

export const configuration = createConfigurationStore();