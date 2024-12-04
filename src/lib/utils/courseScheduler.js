export class CourseScheduler {
  constructor(courses, preferences = { preferredTime: 'day', maxHoursPerTerm: 384 }) {
    this.originalCourses = JSON.parse(JSON.stringify(courses));
    const maxHoursLimit = 384;
    this.preferences = {
      ...preferences,
      maxHoursPerTerm: Math.min(preferences.maxHoursPerTerm, maxHoursLimit)
    };
    this.terms = [
      '2024C2', 
      '2025C1', '2025C2', 
      '2026C1', '2026C2',
      '2027C1', '2027C2',
      '2028C1', '2028C2',
      '2029C1', '2029C2'
    ];
  }

  canTakeCourse(course, approvedCourses, currentTermCourses, termId) {
    if (!course.correlatives?.length) return true;
    
    return course.correlatives.every(prereqId => {
      if (approvedCourses.has(prereqId)) return true;

      const prerequisiteCourse = this.originalCourses.find(c => c.id === prereqId);
      if (!prerequisiteCourse) return false;

      if (prerequisiteCourse.termId >= termId) return false;

      return true;
    });
  }

  hasScheduleConflict(course1, course2) {
    if (!course1.selectedSchedule || !course2.selectedSchedule) return false;
    
    const schedule1 = course1.selectedSchedule;
    const schedule2 = course2.selectedSchedule;
    
    const daysOverlap = schedule1.days.some(day => schedule2.days.includes(day));
    if (!daysOverlap) return false;

    const [startTime1, endTime1] = schedule1.timeSlot.split('-').map(this.timeToMinutes);
    const [startTime2, endTime2] = schedule2.timeSlot.split('-').map(this.timeToMinutes);

    return !(endTime1 <= startTime2 || endTime2 <= startTime1);
  }

  timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  selectBestSchedule(course, currentTermCourses) {
    const schedules = course.scheduleOptions || [];
    if (schedules.length === 0) return null;

    const preferredTime = this.preferences.preferredTime;
    
    const validSchedules = schedules.filter(schedule => {
      const courseWithSchedule = { ...course, selectedSchedule: {
        days: schedule.days,
        timeSlot: schedule.time
      }};
      
      return !currentTermCourses.some(tc => 
        this.hasScheduleConflict(tc, courseWithSchedule)
      );
    });

    if (validSchedules.length === 0) return null;

    const preferredSchedules = validSchedules.filter(schedule => {
      const startTime = parseInt(schedule.time.split(':')[0]);
      return preferredTime === 'day' ? startTime < 18 : startTime >= 18;
    });

    const selectedSchedule = preferredSchedules.length > 0 ? 
      preferredSchedules[0] : validSchedules[0];

    return {
      days: selectedSchedule.days,
      timeSlot: selectedSchedule.time
    };
  }

  getPrerequisiteDepth(courseId, memo = new Map()) {
    if (memo.has(courseId)) return memo.get(courseId);
    
    const course = this.originalCourses.find(c => c.id === courseId);
    if (!course || !course.correlatives?.length) {
      memo.set(courseId, 0);
      return 0;
    }

    const depth = 1 + Math.max(...course.correlatives.map(prereqId => 
      this.getPrerequisiteDepth(prereqId, memo)
    ));
    
    memo.set(courseId, depth);
    return depth;
  }

  getEarliestPossibleTerm(course, approvedCourses, scheduledCourses) {
    if (!course.correlatives?.length) return this.terms[0];
    
    let maxPrereqTerm = '0000C0';
    
    for (const prereqId of course.correlatives) {
      if (approvedCourses.has(prereqId)) continue;
      
      const prereqCourse = scheduledCourses.find(c => c.id === prereqId);
      if (!prereqCourse || !prereqCourse.termId) {
        return null;
      }
      
      maxPrereqTerm = prereqCourse.termId > maxPrereqTerm ? prereqCourse.termId : maxPrereqTerm;
    }
    
    const termIndex = this.terms.indexOf(maxPrereqTerm);
    return termIndex >= 0 ? this.terms[termIndex + 1] : null;
  }

  findBaseCourses(courses, approvedCourses) {
    return courses.filter(course => {
      if (!course.correlatives?.length) return true;
      return course.correlatives.every(prereqId => approvedCourses.has(prereqId));
    });
  }

  buildCourseLevels(coursesToOptimize, approvedCourses) {
    const levels = [];
    let remainingCourses = [...coursesToOptimize];
    let currentApproved = new Set(approvedCourses);

    console.log('Building levels with:', {
      coursesToOptimize: coursesToOptimize.length,
      approvedCourses: Array.from(approvedCourses),
      remainingCourses: remainingCourses.length
    });

    while (remainingCourses.length > 0) {
      const availableCourses = this.findBaseCourses(remainingCourses, currentApproved);
      
      console.log('Available courses:', availableCourses.map(c => c.name));
      
      if (availableCourses.length === 0) {
        console.warn('Correlative chain broken, remaining courses:', 
          remainingCourses.map(c => ({
            name: c.name, 
            correlatives: c.correlatives
          }))
        );
        break;
      }

      levels.push(availableCourses);
      
      // Actualizar conjuntos para la siguiente iteración
      availableCourses.forEach(course => currentApproved.add(course.id));
      remainingCourses = remainingCourses.filter(course => 
        !availableCourses.some(ac => ac.id === course.id)
      );
    }

    return levels;
  }

  optimizeCourseSchedule() {
    // Obtener materias aprobadas
    const approvedCourses = new Set(
      this.originalCourses
        .filter(course => course.approved)
        .map(course => course.id)
    );

    // Obtener materias bloqueadas (asignadas manualmente)
    const lockedCourses = this.originalCourses.filter(course => 
      !course.approved && course.locked
    );

    // Filtrar materias para optimizar (no aprobadas y no bloqueadas)
    const coursesToOptimize = this.originalCourses
      .filter(course => !course.approved && !course.locked);

    console.log('Initial state:', {
      approved: Array.from(approvedCourses),
      locked: lockedCourses.map(c => c.name),
      toOptimize: coursesToOptimize.map(c => c.name)
    });

    // Organizar cursos en niveles basados en correlatividades
    const courseLevels = this.buildCourseLevels(coursesToOptimize, approvedCourses);

    console.log('Course levels:', courseLevels.map(level => 
      level.map(c => c.name)
    ));

    const termSchedules = {};
    const scheduledCourses = [...lockedCourses];
    const unscheduledCourses = [];

    // Inicializar términos
    for (const termId of this.terms) {
      termSchedules[termId] = {
        courses: [],
        totalHours: 0
      };
    }

    // Agregar cursos bloqueados a sus términos correspondientes
    lockedCourses.forEach(course => {
      if (course.termId) {
        termSchedules[course.termId].courses.push({
          id: course.id,
          name: course.name,
          schedule: course.selectedSchedule,
          hours: course.hours
        });
        termSchedules[course.termId].totalHours += course.hours;
      }
    });

    // Procesar cada nivel de cursos
    let currentTermIndex = 0;

    for (const levelCourses of courseLevels) {
      for (const course of levelCourses) {
        let assigned = false;
        let attemptedTerms = 0;

        while (currentTermIndex < this.terms.length && !assigned && attemptedTerms < this.terms.length) {
          const termId = this.terms[currentTermIndex];
          const currentTermCourses = termSchedules[termId].courses;
          const termHours = termSchedules[termId].totalHours;

          if (currentTermCourses.length < 6 && 
              termHours + course.hours <= this.preferences.maxHoursPerTerm) {
            
            const selectedSchedule = this.selectBestSchedule(course, currentTermCourses);
            
            if (selectedSchedule) {
              const [year, term] = termId.match(/(\d+)C(\d+)/).slice(1);
              const assignedCourse = {
                ...course,
                selectedSchedule,
                termId,
                year: parseInt(year),
                term: parseInt(term)
              };
              
              currentTermCourses.push({
                id: course.id,
                name: course.name,
                schedule: selectedSchedule,
                hours: course.hours
              });
              
              termSchedules[termId].totalHours += course.hours;
              scheduledCourses.push(assignedCourse);
              assigned = true;
            }
          }

          if (!assigned) {
            currentTermIndex = (currentTermIndex + 1) % this.terms.length;
            attemptedTerms++;
          }
        }

        if (!assigned) {
          unscheduledCourses.push({
            ...course,
            termId: null,
            year: null,
            term: null,
            selectedSchedule: null
          });
        }
      }
    }

    // Agregar información de debug
    console.log('Optimization results:', {
      scheduled: scheduledCourses.map(c => c.name),
      unscheduled: unscheduledCourses.map(c => c.name)
    });

    return {
      courses: [...scheduledCourses, ...unscheduledCourses],
      termSchedules,
      unscheduledCourses
    };
  }
}

function optimizeCourseSchedule(courses, preferences = { preferredTime: 'day', maxHoursPerTerm: 384 }) {
  const scheduler = new CourseScheduler(courses, preferences);
  return scheduler.optimizeCourseSchedule();
}

export default optimizeCourseSchedule;
