class CourseScheduler {
  constructor(courses, preferences = { preferredTime: 'day', maxHoursPerTerm: 384 }) {
    this.originalCourses = JSON.parse(JSON.stringify(courses));
    this.preferences = preferences;
    this.terms = [
      '2024C2', 
      '2025C1', '2025C2', 
      '2026C1', '2026C2',
      '2027C1', '2027C2',
      '2028C1', '2028C2',
      '2029C1'
    ];
  }

  canTakeCourse(course, approvedCourses, currentTermCourses) {
    if (!course.correlatives?.length) return true;
    
    const hasApprovedPrereqs = course.correlatives.every(prereqId => 
      approvedCourses.has(prereqId)
    );

    const hasPrereqInSameTerm = course.correlatives.some(prereqId => 
      currentTermCourses.some(tc => tc.id === prereqId)
    );

    return hasApprovedPrereqs && !hasPrereqInSameTerm;
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

  optimizeCourseSchedule() {
    const approvedCourses = new Set(
      this.originalCourses
        .filter(course => course.approved)
        .map(course => course.id)
    );

    const scheduledCourses = [];
    const remainingCourses = [...this.originalCourses]
      .filter(course => !course.approved)
      .sort((a, b) => {
        const aWeight = this.originalCourses.filter(c => 
          c.correlatives?.includes(a.id)).length - (a.correlatives?.length || 0);
        const bWeight = this.originalCourses.filter(c => 
          c.correlatives?.includes(b.id)).length - (b.correlatives?.length || 0);
        return bWeight - aWeight;
      });

    const termSchedules = {};

    for (const termId of this.terms) {
      const [year, term] = termId.match(/(\d+)C(\d+)/).slice(1);
      const termCourses = [];
      let termHours = 0;

      for (let i = 0; i < remainingCourses.length; i++) {
        const course = remainingCourses[i];
        
        if (this.canTakeCourse(course, approvedCourses, termCourses) &&
            termHours + course.hours <= this.preferences.maxHoursPerTerm) {
          
          const selectedSchedule = this.selectBestSchedule(course, termCourses);
          
          if (selectedSchedule) {
            course.selectedSchedule = selectedSchedule;
            course.termId = termId;
            course.year = parseInt(year);
            course.term = parseInt(term);
            
            termCourses.push(course);
            termHours += course.hours;
            
            remainingCourses.splice(i, 1);
            i--;
          }
        }
      }

      termSchedules[termId] = {
        courses: termCourses.map(course => ({
          id: course.id,
          name: course.name,
          schedule: course.selectedSchedule,
          hours: course.hours
        })),
        totalHours: termHours
      };

      termCourses.forEach(course => approvedCourses.add(course.id));
      scheduledCourses.push(...termCourses);
    }

    return {
      courses: scheduledCourses,
      termSchedules: termSchedules,
      unscheduledCourses: remainingCourses
    };
  }
}

function optimizeCourseSchedule(courses, preferences = { preferredTime: 'day', maxHoursPerTerm: 384 }) {
  const scheduler = new CourseScheduler(courses, preferences);
  return scheduler.optimizeCourseSchedule();
}

export default optimizeCourseSchedule;
