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

  timeToMinutes(timeStr) {
    const normalizedTime = timeStr.replace(':', '').padEnd(4, '0');
    const hours = parseInt(normalizedTime.substring(0, 2));
    const minutes = parseInt(normalizedTime.substring(2, 4));
    return hours * 60 + minutes;
  }

  getTimeRange(schedule) {
    const [startTime, endTime] = schedule.timeSlot.split('-').map(this.timeToMinutes);
    return {
      start: startTime,
      end: endTime,
      duration: endTime - startTime
    };
  }

  isPreferredTimeSlot(timeRange, preferredTime) {
    const startHour = Math.floor(timeRange.start / 60);
    const endHour = Math.floor(timeRange.end / 60);
    
    switch (preferredTime) {
      case 'morning':
        return startHour >= 8 && endHour <= 13;
      case 'afternoon':
        return startHour >= 13 && endHour <= 18;
      case 'night':
        return startHour >= 18;
      case 'day':
        return startHour >= 8 && endHour <= 18;
      default:
        return true;
    }
  }

  hasScheduleConflict(course1, course2) {
    if (!course1.schedule || !course2.selectedSchedule) return false;
    
    const schedule1 = course1.schedule;
    const schedule2 = course2.selectedSchedule;
    
    console.log('Checking conflict between:', {
      course1: course1.name,
      schedule1,
      course2: course2.name,
      schedule2
    });

    const hasCommonDay = schedule1.days.some(day => 
      schedule2.days.includes(day)
    );
    
    if (!hasCommonDay) {
      console.log('No common days, no conflict');
      return false;
    }

    const [start1, end1] = schedule1.timeSlot.split('-')
      .map(t => t.trim());
    const [start2, end2] = schedule2.timeSlot.split('-')
      .map(t => t.trim());
    
    const time1Start = this.timeToMinutes(start1);
    const time1End = this.timeToMinutes(end1);
    const time2Start = this.timeToMinutes(start2);
    const time2End = this.timeToMinutes(end2);

    console.log('Time comparison:', {
      course1: `${course1.name}: ${time1Start}-${time1End}`,
      course2: `${course2.name}: ${time2Start}-${time2End}`
    });

    const hasOverlap = (
      (time2Start >= time1Start && time2Start < time1End) ||
      (time1Start >= time2Start && time1Start < time2End)
    );

    if (hasOverlap) {
      console.log('CONFLICT DETECTED:', {
        course1: `${course1.name} (${start1}-${end1})`,
        course2: `${course2.name} (${start2}-${end2})`
      });
    }

    return hasOverlap;
  }

  selectBestSchedule(course, currentTermCourses) {
    console.log('Selecting schedule for:', course.name);
    console.log('Current term courses:', currentTermCourses);

    const schedules = course.scheduleOptions || [];
    if (schedules.length === 0) return null;

    const validSchedules = schedules.filter(schedule => {
      const courseWithSchedule = {
        ...course,
        selectedSchedule: {
          days: schedule.days,
          timeSlot: schedule.time
        }
      };
      
      const conflicts = currentTermCourses.filter(tc => 
        this.hasScheduleConflict(tc, courseWithSchedule)
      );

      if (conflicts.length > 0) {
        console.log(`Schedule ${schedule.time} has conflicts with:`, 
          conflicts.map(c => `${c.name} (${c.schedule.timeSlot})`)
        );
        return false;
      }

      return true;
    });

    if (validSchedules.length === 0) {
      console.log(`No valid schedules found for ${course.name}`);
      return null;
    }

    console.log(`Valid schedules for ${course.name}:`, validSchedules);

    const selectedSchedule = validSchedules[0];
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
      
      availableCourses.forEach(course => currentApproved.add(course.id));
      remainingCourses = remainingCourses.filter(course => 
        !availableCourses.some(ac => ac.id === course.id)
      );
    }

    return levels;
  }

  optimizeCourseSchedule() {
    const approvedCourses = new Set(
      this.originalCourses
        .filter(course => course.approved)
        .map(course => course.id)
    );

    const lockedCourses = this.originalCourses.filter(course => 
      !course.approved && course.locked
    );

    const coursesToOptimize = this.originalCourses
      .filter(course => !course.approved && !course.locked);

    console.log('Initial state:', {
      approved: Array.from(approvedCourses),
      locked: lockedCourses.map(c => c.name),
      toOptimize: coursesToOptimize.map(c => c.name)
    });

    const courseLevels = this.buildCourseLevels(coursesToOptimize, approvedCourses);

    console.log('Course levels:', courseLevels.map(level => 
      level.map(c => c.name)
    ));

    const termSchedules = {};
    const scheduledCourses = [...lockedCourses];
    const unscheduledCourses = [];

    for (const termId of this.terms) {
      termSchedules[termId] = {
        courses: [],
        totalHours: 0
      };
    }

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
              const courseWithSchedule = {
                ...course,
                selectedSchedule
              };

              const hasConflict = currentTermCourses.some(tc => 
                this.hasScheduleConflict(tc, courseWithSchedule)
              );

              if (!hasConflict) {
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
