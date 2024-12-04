<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
  
  export let course;
  export let isDraggable = true;
  export let onRemove = undefined;
  export let onToggleApproved = undefined;
  import { classLookup } from "$lib/stores/classes";
  import { get } from "svelte/store";

  function handleDragStart(event) {
    event.dataTransfer.setData('text/plain', JSON.stringify(course));
    // Add a visual indicator for dragging
    event.target.classList.add('dragging');
  }

  function handleDragEnd(event) {
    event.target.classList.remove('dragging');
  }

  // Function to map IDs to names
  const getClassNames = (ids) => {
    const lookup = get(classLookup);
    return ids.map(id => lookup[id] || "Unknown").join(", ");
  };
</script>

<div
  class="card bg-base-100 shadow-sm hover:shadow-md transition-all duration-200"
  class:cursor-move={isDraggable}
  class:bg-success={course.approved}
  class:bg-opacity-10={course.approved}
  class:opacity-75={isDraggable}
  class:hover:opacity-100={isDraggable}
  draggable={isDraggable}
  on:dragstart={handleDragStart}
  on:dragend={handleDragEnd}
  role="listitem"
>
  <div class="card-body p-4 gap-2">
    <div class="flex justify-between items-start">
      <div>
        <h3 class="card-title text-sm font-medium">{course.name}</h3>
        {#if course.code}
          <p class="text-xs opacity-60">{course.code}</p>
        {/if}
      </div>
      
      <button 
        class="btn btn-circle btn-xs hover:scale-110 transition-transform"
        class:btn-success={course.approved}
        class:btn-ghost={!course.approved}
        on:click={() => onToggleApproved(course.id)}
        title={course.approved ? "Mark as not approved" : "Mark as approved"}
        aria-label="toggle approved"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>
    
    <div class="flex flex-wrap gap-2 text-xs opacity-70">
      <span class="badge badge-neutral">{course.hours}hs</span>
      
      {#if course.scheduleOptions?.length > 0}
        <select 
          class="select select-xs select-bordered w-48"
          value={course.selectedSchedule ? `${course.selectedSchedule.days.join('/')}-${course.selectedSchedule.timeSlot}` : ''}
          on:change={(e) => {
            if (!e.target.value) {
              course.selectedSchedule = null;
              dispatch('scheduleChange', { courseId: course.id, schedule: null });
              return;
            }
            
            const [days, time] = e.target.value.split('-');
            const newSchedule = {
              days: days.split('/'),
              timeSlot: time
            };
            dispatch('scheduleChange', { courseId: course.id, schedule: newSchedule });
          }}
        >
          <option value="">Select schedule</option>
          {#each course.scheduleOptions as option}
            <option 
              value={`${option.days.join('/')}-${option.time}`}
              selected={course.selectedSchedule && 
                course.selectedSchedule.days.join('/') === option.days.join('/') && 
                course.selectedSchedule.timeSlot === option.time}
            >
              {option.days.join('/')} - {option.time}
            </option>
          {/each}
        </select>
      {:else}
        <span class="badge badge-ghost">No schedules available</span>
      {/if}
    </div>

    {#if course.correlatives?.length > 0}
      <div class="text-xs">
        <span class="badge badge-warning badge-sm">
          <!-- Prereq: {course.correlatives.join(', ')} -->
          Prereq: {getClassNames(course.correlatives)}
        </span>
      </div>
    {/if}

    <!-- {#if onRemove} -->
     {#if false}
      <div class="card-actions justify-end mt-2">
        <button 
          class="btn btn-xs btn-error btn-outline hover:scale-105 transition-transform"
          on:click={() => onRemove(course.id)}
        >
          Remove
        </button>
      </div>
    {/if}
    
  </div>
</div>

<style>
  .dragging {
    @apply opacity-50 scale-105;
  }
</style>