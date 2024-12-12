<script>
  import CourseCard from '$lib/components/CourseCard.svelte';
  import DropZone from '$lib/components/DropZone.svelte';
  import ScheduleSelector from '$lib/components/ScheduleSelector.svelte';
  import IntensitySelector from '$lib/components/IntensitySelector.svelte';
  import { selectedCoursesStore as classes, statsStore as stats } from '$lib/utils/courseScheduler';
  import { optimizeCourseSchedule } from '$lib/utils/courseScheduler';
  import { configuration } from '$lib/stores/configuration';

  let currentYear = new Date().getFullYear();
  let currentMonth = new Date().getMonth(); // 0-11
  
  // Si estamos en diciembre, comenzar desde el próximo año
  if (currentMonth === 11) {
    currentYear++;
  }
  
  let currentTerm = currentMonth < 6 ? 1 : 2;
  
  // Si estamos en diciembre, comenzar desde el término 1
  if (currentMonth === 11) {
    currentTerm = 1;
  }

  // Generate the year-term list
  let totalEntries = 16; // Number of entries to display
  let yearTermList = [];

  for (let i = 0; i < totalEntries; i++) {
    yearTermList.push({ year: currentYear, term: currentTerm });
    currentTerm++;
    if (currentTerm > 2) { // Reset term and increment year
      currentTerm = 1;
      currentYear++;
    }
  }

  let error = '';
  
  function handleDrop(course, year, term) {
    classes.update(courses => {
      const updatedCourse = { ...course, year, term };
      const existingIndex = courses.findIndex(c => c.id === course.id);
      if (existingIndex >= 0) {
        courses[existingIndex] = updatedCourse;
        return [...courses];
      }
      return [...courses, updatedCourse];
    });
  }

  function handleError(event) {
    error = event.detail.message;
    setTimeout(() => {
      error = '';
    }, 3000);
  }

  function handleOptimizeSchedule() {
    try {
      console.log('Starting optimization...');
      
      const preferences = {
        preferredTime: $configuration.preferredTime,
        maxHoursPerTerm: $configuration.maxHoursPerTerm
      };
      console.log('Optimization preferences:', preferences);

      const result = optimizeCourseSchedule(preferences);
      console.log('Optimization result:', result);

      if (!result || !result.plan) {
        throw new Error('Invalid optimization result');
      }

      // Update courses with new assignments
      classes.update(courses => {
        const updatedCourses = [...courses];
        
        // Reset non-approved courses
        updatedCourses.forEach(course => {
          if (!course.approved) {
            course.year = null;
            course.term = null;
            course.selectedSchedule = null;
          }
        });

        // Apply new assignments from optimization
        Object.entries(result.plan).forEach(([termId, termCourses]) => {
          const [year, term] = termId.match(/(\d{4})C(\d)/).slice(1);
          
          termCourses.forEach(optimizedCourse => {
            const courseIndex = updatedCourses.findIndex(c => c.id === optimizedCourse.id);
            if (courseIndex >= 0 && !updatedCourses[courseIndex].approved) {
              updatedCourses[courseIndex] = {
                ...updatedCourses[courseIndex],
                year: parseInt(year),
                term: parseInt(term),
                selectedSchedule: result.schedules[optimizedCourse.id]
              };
            }
          });
        });

        return updatedCourses;
      });

      if (result.unassignedCourses?.length > 0) {
        error = `No se pudieron programar ${result.unassignedCourses.length} materias`;
      }

    } catch (err) {
      console.error('Optimization error:', err);
      error = `Error en la optimización: ${err.message}`;
    }
  }

  $: getCoursesForTerm = (year, term) => 
    $classes.filter(c => c.year === year && c.term === term && !c.approved);
</script>

<div class="container mx-auto p-4 space-y-6">
  <div class="navbar bg-base-100 rounded-box shadow">
    <div class="flex-1">
      <h1 class="text-2xl font-bold">Study Planner</h1>
    </div>
    <div class="flex-none">
      <div class="stats shadow">
        <div class="stat px-4">
          <div class="stat-title">Passed</div>
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
            {#each $classes as course}
              <CourseCard 
                {course} 
                onToggleApproved={(id) => {
                  classes.update(courses => 
                    courses.map(c => 
                      c.id === id ? {...c, approved: !c.approved} : c
                    )
                  );
                }}
                on:scheduleChange={(event) => {
                  const { courseId, schedule } = event.detail;
                  classes.update(courses =>
                    courses.map(c =>
                      c.id === courseId ? {...c, selectedSchedule: schedule} : c
                    )
                  );
                }}
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
          <div class="card bg-base-200 p-3 px-20 flex flex-row items-center">
            <div class="flex flex-row items-center">
              Preferred <br> Schedule
              <ScheduleSelector />
            </div>
            <div class="flex flex-row items-center ml-12">
              Intensity
              <IntensitySelector />
            </div>
            <button class="btn btn-primary ml-20" on:click={handleOptimizeSchedule}>
              Optimize
            </button>
          </div>
          <div class="divider"></div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            {#each yearTermList as { year, term }}
              <DropZone
                {year}
                {term}
                courses={getCoursesForTerm(year, term)}
                allSelectedCourses={$classes}
                onDrop={handleDrop}
                onRemove={(id) => {
                  classes.update(courses =>
                    courses.map(c =>
                      c.id === id ? {...c, year: null, term: null} : c
                    )
                  );
                }}
                onToggleApproved={(id) => {
                  classes.update(courses =>
                    courses.map(c =>
                      c.id === id ? {...c, approved: !c.approved} : c
                    )
                  );
                }}
                on:error={handleError}
              />
            {/each}
          </div>
        </div>
      </div>
    </div>

  </div>
</div>