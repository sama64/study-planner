class CourseScheduler {
  constructor(courses) {
    this.courses = Array.isArray(courses) ? courses : [];
    this.maxYears = 10;
    this.debug = true; // Enable detailed logging
  }

  // Detailed logging method
  log(message, details = {}) {
    if (this.debug) {
      console.log(`[Course Scheduler] ${message}`, details);
    }
  }

  checkPrerequisites(course, year, term, selectedCourses) {
    // If no correlatives, it can be placed anywhere
    if (!course.correlatives || course.correlatives.length === 0) {
      this.log(`No prerequisites for ${course.name}`, { year, term });
      return true;
    }

    // Check each prerequisite
    const unmetPrerequisites = course.correlatives.filter(prereqId => {
      const prerequisite = selectedCourses.find(c => c.id === prereqId);

      // If prerequisite not found or not approved
      if (!prerequisite || !prerequisite.approved) {
        this.log(`Prerequisite not met for ${course.name}`, {
          prereqId,
          prerequisiteName: this.getCourseName(prereqId),
          prerequisiteFound: !!prerequisite,
          prerequisiteApproved: prerequisite?.approved
        });
        return true;
      }

      // Check if prerequisite is in an earlier term/year
      const isValidPrerequisite = prerequisite.year < year ||
        (prerequisite.year === year && prerequisite.term < term);

      if (!isValidPrerequisite) {
        this.log(`Prerequisite timing invalid for ${course.name}`, {
          prereqName: this.getCourseName(prereqId),
          prereqYear: prerequisite.year,
          prereqTerm: prerequisite.term,
          currentYear: year,
          currentTerm: term
        });
      }

      return !isValidPrerequisite;
    });

    return unmetPrerequisites.length === 0;
  }

  getCourseName(courseId) {
    const course = this.courses.find(c => c.id === courseId);
    return course ? course.name : 'Unknown Course';
  }

  checkScheduleConflicts(course, year, term, selectedCourses) {
    const coursesInTerm = selectedCourses.filter(
      c => c.year === year && c.term === term
    );

    // If no schedule options, can't check conflicts
    if (!course.scheduleOptions || course.scheduleOptions.length === 0) {
      this.log(`No schedule options for ${course.name}`, { year, term });
      return false;
    }

    // Try each schedule option
    const conflictingOptions = course.scheduleOptions.filter(scheduleOption =>
      coursesInTerm.some(existingCourse =>
        existingCourse.scheduleOptions?.some(existingSchedule =>
          this.hasScheduleConflict(scheduleOption, existingSchedule)
        )
      )
    );

    if (conflictingOptions.length === course.scheduleOptions.length) {
      this.log(`All schedule options conflict for ${course.name}`, {
        year,
        term,
        existingCoursesCount: coursesInTerm.length
      });
      return false;
    }

    return true;
  }

  hasScheduleConflict(schedule1, schedule2) {
    if (!schedule1 || !schedule2 || !schedule1.days || !schedule2.days) return false;

    const daysOverlap = schedule1.days.some(
      day => schedule2.days.includes(day)
    );

    const timeOverlap = this.timeRangesOverlap(
      this.parseTimeRange(schedule1.time),
      this.parseTimeRange(schedule2.time)
    );

    return daysOverlap && timeOverlap;
  }

  parseTimeRange(timeString) {
    if (typeof timeString !== 'string') return { start: 0, end: 0 };

    const [start, end] = timeString.split('-').map(t => {
      const [hours, minutes] = t.split(':').map(Number);
      return hours * 60 + minutes;
    });
    return { start, end };
  }

  timeRangesOverlap(range1, range2) {
    return !(range1.end <= range2.start || range2.end <= range1.start);
  }

  sortCoursesByPriority(courses) {
    if (!Array.isArray(courses)) return [];

    return [...courses].sort((a, b) => {
      // Prioritize courses with more prerequisites
      const prereqDiff = (b.correlatives?.length || 0) - (a.correlatives?.length || 0);

      // Secondary sort by hours (more complex courses first)
      return prereqDiff || (b.hours || 0) - (a.hours || 0);
    });
  }

  scheduleCoursesOptimally() {
    if (this.courses.length === 0) {
      this.log('No courses provided for scheduling');
      return [];
    }

    const sortedCourses = this.sortCoursesByPriority(this.courses);
    const schedule = [];

    // Pre-approve first-year courses with no prerequisites
    const firstYearCourses = sortedCourses.filter(course =>
      course.year === 1 && (!course.correlatives || course.correlatives.length === 0)
    );
    firstYearCourses.forEach(course => {
      course.approved = true;
      schedule.push({ ...course, year: 1, term: 1 });
    });

    for (const course of sortedCourses) {
      // Skip already scheduled courses
      if (schedule.some(s => s.id === course.id)) continue;

      this.placeCourseOptimally(course, schedule);
    }

    return schedule;
  }

  placeCourseOptimally(course, schedule) {
    // Try to place the course in its suggested year/term first
    if (this.tryPlaceCourseInSuggestedTerm(course, schedule)) return true;

    // If that fails, try a more flexible placement
    for (let year = 1; year <= this.maxYears; year++) {
      for (let term = 1; term <= 2; term++) {
        if (!course.scheduleOptions || course.scheduleOptions.length === 0) {
          this.log(`No schedule options for ${course.name}`);
          continue;
        }

        for (const scheduleOption of course.scheduleOptions) {
          const proposedCourse = {
            ...course,
            year,
            term,
            selectedSchedule: scheduleOption
          };

          if (this.isValidPlacement(proposedCourse, year, term, schedule)) {
            schedule.push(proposedCourse);
            return true;
          }
        }
      }
    }

    this.log(`Could not place course: ${course.name}`);
    return false;
  }

  tryPlaceCourseInSuggestedTerm(course, schedule) {
    if (!course.year || !course.term) return false;

    for (const scheduleOption of course.scheduleOptions || []) {
      const proposedCourse = {
        ...course,
        selectedSchedule: scheduleOption
      };

      if (this.isValidPlacement(proposedCourse, course.year, course.term, schedule)) {
        schedule.push({ ...proposedCourse, year: course.year, term: course.term });
        return true;
      }
    }

    return false;
  }

  isValidPlacement(course, year, term, selectedCourses) {
    const prereqsMet = this.checkPrerequisites(course, year, term, selectedCourses);
    const noConflicts = this.checkScheduleConflicts(course, year, term, selectedCourses);

    return prereqsMet && noConflicts;
  }
}

// Example usage
export function optimizeCourseSchedule(courses) {
  const scheduler = new CourseScheduler(courses);
  return scheduler.scheduleCoursesOptimally();
}