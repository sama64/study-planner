<script>
  import { configuration } from '$lib/stores/configuration';
  import SunIcon from '$lib/icons/sun-icon.svg';
  import MoonIcon from '$lib/icons/moon-icon.svg';

  function handleThemeChange(preferredTime) {
    configuration.update(config => ({
        ...config,
        theme: preferredTime
    }));
  }
</script>


<div class="flex gap-2 ml-4">
  <button 
      class="w-12 h-12 rounded-lg flex items-center justify-center
      {$configuration.theme === 'day' 
          ? 'border-2 border-white/20 ring-2 ring-primary/50 bg-primary/10' 
          : 'bg-base-content/10 hover:bg-base-content/20'}"
      on:click={() => handleThemeChange('day')}
  >
      <img 
          src={SunIcon} 
          alt="Day" 
          class="w-8 h-8 object-contain"
      />
  </button>
  <button 
      class="w-12 h-12 rounded-lg flex items-center justify-center
      {$configuration.theme === 'night' 
          ? 'border-2 border-white/20 ring-2 ring-primary/50 bg-primary/10' 
          : 'bg-base-content/10 hover:bg-base-content/20'}"
      on:click={() => handleThemeChange('night')}
  >
      <img 
          src={MoonIcon} 
          alt="Night" 
          class="w-8 h-8 object-contain"
      />
  </button>
</div>