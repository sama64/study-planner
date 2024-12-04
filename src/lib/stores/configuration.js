import { writable } from 'svelte/store';
import { browser } from '$app/environment';

function createConfigurationStore() {
  const initialValue = {
    theme: 'day',
    selectedImageIndex: 0,
    maxHoursPerTerm: 256,
    preferredTime: 'day'
  };

  const { subscribe, set, update } = writable(initialValue);

  if (browser) {
    try {
      const savedConfig = localStorage.getItem('userConfiguration');
      if (savedConfig) {
        set(JSON.parse(savedConfig));
      }
    } catch (error) {
      console.error('Error loading configuration:', error);
    }

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
    update,
    setIntensity: (index) => update(config => ({
      ...config,
      maxHoursPerTerm: index === 0 ? Infinity : 256
    })),
    setPreferredTime: (time) => update(config => ({
      ...config,
      preferredTime: time
    }))
  };
}

export const configuration = createConfigurationStore();