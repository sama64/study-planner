<script>
  import { createEventDispatcher } from 'svelte';
  import CourseCard from './CourseCard.svelte';
  import { validatePrerequisites, checkScheduleConflict } from '$lib/stores/classes';
  
  export let year;
  export let term;
  export let courses = [];
  export let allSelectedCourses = [];
  export let onDrop;
  export let onRemove;
  export let onToggleApproved;

  const dispatch = createEventDispatcher();
  let isDropping = false;
  let error = '';

  function handleDragOver(event) {
    event.preventDefault();
    isDropping = true;
  }

  function handleDragLeave(event) {
    // Only set isDropping to false if we're leaving the container (not entering a child)
    if (!event.currentTarget.contains(event.relatedTarget)) {
      isDropping = false;
    }
  }

  function handleDrop(event) {
    event.preventDefault();
    isDropping = false;
    const course = JSON.parse(event.dataTransfer.getData('text/plain'));
    
    // Validation
    if (!validatePrerequisites(course, year, term, allSelectedCourses)) {
      const prereqsList = course.correlatives
        .map(id => allSelectedCourses.find(c => c.id === id)?.name || id)
        .join(', ');
      error = `Cannot add ${course.name} - prerequisites not met (${prereqsList})`;
      dispatch('error', { message: error });
      return;
    }
    
    // Schedule conflict check
    const conflictingCourse = courses.find(c => checkScheduleConflict(c, course));
    if (conflictingCourse) {
      error = `Schedule conflict: ${course.name} and ${conflictingCourse.name} share ${course.schedule.days.join('/')} ${course.schedule.timeSlot}`;
      dispatch('error', { message: error });
      return;
    }
    
    onDrop(course, year, term);
    error = '';
  }

  $: totalHours = courses.reduce((sum, course) => sum + course.hours, 0);
  $: approvedCourses = courses.filter(course => course.approved).length;
  $: isOverloaded = totalHours > 160; // Example threshold
</script>

<div 
  class="card bg-base-200 transition-all duration-200"
  class:ring-2={isDropping}
  class:ring-primary={isDropping}
  class:ring-offset-2={isDropping}
  class:bg-warning={isOverloaded}
  class:bg-opacity-5={isOverloaded}
>
  <div class="card-body p-4 gap-3"
    on:dragover={handleDragOver}
    on:dragleave={handleDragLeave}
    on:drop={handleDrop}
    aria-label={`Drop zone for ${year} C${term}`}
    role="region"
  >
    <div class="flex justify-between items-center">
      <h4 class="card-title text-base">
        {year} C{term}
        {#if isOverloaded}
          <span class="badge badge-warning badge-sm">High load</span>
        {/if}
      </h4>
      <div class="flex gap-2">
        <div class="badge badge-neutral gap-1">
          {totalHours}hs
        </div>
        {#if courses.length > 0}
          <div class="badge badge-success gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
            {approvedCourses}/{courses.length}
          </div>
        {/if}
      </div>
    </div>

    {#if error}
      <div class="alert alert-error text-sm py-2">
        {error}
      </div>
    {/if}

    <div class="divider my-0"></div>

    <div class="space-y-3 min-h-[100px]" class:opacity-50={isDropping}>
      {#each courses as course}
        <CourseCard
          {course}
          isDraggable={true}
          {onRemove}
          {onToggleApproved}
        />
      {/each}
      
      {#if courses.length === 0}
        <div class="h-[100px] border-2 border-dashed border-base-300 rounded-lg flex items-center justify-center text-base-content/50 text-sm">
          <div class="text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Drop courses here
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>