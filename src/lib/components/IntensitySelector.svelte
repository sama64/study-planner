<script>
    import { configuration } from '$lib/stores/configuration.js';
    import Image1 from '$lib/images/berserk.jpg';
    import Image2 from '$lib/images/chill.jpg';

    const images = [Image1, Image2];

    function handleImageChange(index) {
        configuration.update(config => ({
            ...config,
            selectedImageIndex: index
        }));
    }
</script>

<div class="flex gap-2 ml-4">
    {#each images as image, index}
        <button 
            class="w-16 h-16 rounded-lg flex items-center justify-center
            {$configuration.selectedImageIndex === index 
                ? 'border-2 border-white/20 ring-2 ring-primary/50 bg-primary/10' 
                : 'bg-base-content/10 hover:bg-base-content/20'}"
            on:click={() => handleImageChange(index)}
        >
            <img 
                src={image} 
                alt="Image {index + 1}" 
                class="w-auto object-cover rounded-md"
            />
        </button>
    {/each}
</div>