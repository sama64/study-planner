import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		fs: {
			allow: [
				// Add your static directory to the allow list
				'/home/yeriko/projects/study-planner/static'
			]
		}
	}
});
