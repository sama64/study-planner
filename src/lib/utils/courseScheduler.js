class CourseScheduler {
  constructor(courses) {
    this.originalCourses = JSON.parse(JSON.stringify(courses));
    this.courses = this.originalCourses;
  }

  // [Previous utility methods remain the same]

  // Main optimization method
  optimizeCourseSchedule() {
    // Track approved courses initially
    let approvedCourses = new Set(
      this.courses
        .filter(course => course.approved)
        .map(course => course.id)
    );

    // Optimization results
    const results = {
      term1: null,
      term2: null
    };

    // Optimize first term
    results.term1 = this.optimizeTermSchedule(1, approvedCourses);

    // Update approved courses for second term
    const term1ApprovedCourses = new Set([
      ...approvedCourses,
      ...results.term1.scheduledCourses.map(c => c.id)
    ]);

    // Optimize second term
    results.term2 = this.optimizeTermSchedule(2, term1ApprovedCourses);

    // Update original courses with scheduled options
    this.courses = this.courses.map(course => {
      const term1Match = results.term1.scheduledCourses.find(c => c.id === course.id);
      const term2Match = results.term2.scheduledCourses.find(c => c.id === course.id);

      return {
        ...course,
        selectedSchedule: term1Match?.selectedSchedule ||
          term2Match?.selectedSchedule ||
          course.selectedSchedule
      };
    });

    return {
      scheduledCourses: this.courses,
      schedulingLogs: {
        term1: results.term1.schedulingLog,
        term2: results.term2.schedulingLog
      }
    };
  }

  // Rest of the implementation remains the same as in the previous version
}

// Export function matching original interface
function optimizeCourseSchedule(courses) {
  const scheduler = new CourseScheduler(courses);
  return scheduler.optimizeCourseSchedule().scheduledCourses;
}

export default optimizeCourseSchedule;