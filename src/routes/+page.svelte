<script>
  import { courses, selectedCourses, stats } from '$lib/stores/courses';
  import CourseCard from '$lib/components/CourseCard.svelte';
  import DropZone from '$lib/components/DropZone.svelte';
  
  let currentYear = new Date().getFullYear();
  let years = Array.from({length: 5}, (_, i) => currentYear + i);
  let terms = [1, 2];
  let error = '';
  
  function handleDrop(course, year, term) {
    selectedCourses.addCourse(course, year, term);
  }

  function handleError(event) {
    error = event.detail.message;
    setTimeout(() => {
      error = '';
    }, 3000);
  }

  $: getCoursesForTerm = (year, term) => 
    $selectedCourses.filter(c => c.year === year && c.term === term);
</script>

<div class="container mx-auto p-4 space-y-6">
  <div class="navbar bg-base-100 rounded-box shadow">
    <div class="flex-1">
      <h1 class="text-2xl font-bold">Course Planner</h1>
    </div>
    <div class="flex-none">
      <div class="stats shadow">
        <div class="stat px-4">
          <div class="stat-title">Approved</div>
          <div class="stat-value text-success text-2xl">
            {$stats.totalApproved}/{$stats.totalCourses}
          </div>
        </div>
      </div>
    </div>
  </div>

  {#if error}
    <div class="alert alert-error shadow-lg">
      <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{error}</span>
    </div>
  {/if}
  
  <div class="grid grid-cols-1 xl:grid-cols-5 gap-6">
    <!-- Available Courses -->
    <div class="xl:col-span-2">
      <div class="card bg-base-100 shadow-lg">
        <div class="card-body">
          <h2 class="card-title text-xl">Available Courses</h2>
          <div class="divider"></div>
          <div class="grid grid-cols-1 gap-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
            {#each $selectedCourses as course}
              <CourseCard 
              {course} 
              onToggleApproved={(id) => selectedCourses.toggleApproved(id)}
              />
            {/each}
          </div>
        </div>
      </div>
    </div>
    
    <!-- Course Plan -->
    <div class="xl:col-span-3">
      <div class="card bg-base-100 shadow-lg">
        <div class="card-body">
          <h2 class="card-title text-xl">Your Course Plan</h2>
          <div class="divider"></div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            {#each years as year}
              {#each terms as term}
                <DropZone
                  {year}
                  {term}
                  courses={getCoursesForTerm(year, term)}
                  allSelectedCourses={$selectedCourses}
                  onDrop={handleDrop}
                  onRemove={(id) => selectedCourses.removeCourse(id)}
                  onToggleApproved={(id) => selectedCourses.toggleApproved(id)}
                  on:error={handleError}
                />
              {/each}
            {/each}
          </div>
        </div>
      </div>
    </div>

  </div>
</div>