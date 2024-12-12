import { writable, derived } from 'svelte/store';
import rawStudyPlan from '../../static/mecatronica-2024C2.json';

class Course {
  constructor(id, name, year, term, hours, scheduleOptions, correlatives) {
    this.id = id;
    this.name = name;
    this.year = year;
    this.term = term;
    this.hours = hours;
    this.scheduleOptions = scheduleOptions;
    this.correlatives = correlatives;
  }
}

export class CourseScheduler {
  constructor(preferences = { preferredTime: 'day', maxHoursPerTerm: 384 }) {
    this.preferences = preferences;
    this.terms = [
      '2024C2',
      '2025C1', '2025C2', '2026C1', '2026C2',
      '2027C1', '2027C2', '2028C1', '2028C2',
      '2029C1', '2029C2', '2030C1', '2030C2',
      '2031C1', '2031C2', '2032C1', '2032C2',

    ];

    // Convert raw courses data to Course instances
    this.courses = new Map(
      rawStudyPlan.map(c => [
        c.id,
        new Course(c.id, c.name, c.year, c.term, c.hours, c.scheduleOptions, c.correlatives)
      ])
    );

    this.approvedCourses = new Set();
    this.chosenSchedules = new Map();
  }

  timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  checkScheduleCompatibility(schedule1, schedule2) {
    const days1 = new Set(schedule1.days);
    const days2 = new Set(schedule2.days);

    // If no common days, schedules are compatible
    if (!Array.from(days1).some(day => days2.has(day))) {
      return true;
    }

    const [start1, end1] = schedule1.time.split('-')
      .map(t => this.timeToMinutes(t.trim()));
    const [start2, end2] = schedule2.time.split('-')
      .map(t => this.timeToMinutes(t.trim()));

    return end1 <= start2 || end2 <= start1;
  }

  findValidSchedule(course, termCourses) {
    for (const newSchedule of course.scheduleOptions) {
      let isValid = true;
      
      for (const existingCourse of termCourses) {
        const existingSchedule = this.chosenSchedules.get(existingCourse.id);
        if (existingSchedule && !this.checkScheduleCompatibility(newSchedule, existingSchedule)) {
          isValid = false;
          break;
        }
      }

      if (isValid) {
        return newSchedule;
      }
    }
    return null;
  }

  canAssignToTerm(course, term, currentPlan) {
    // Check if course is already approved
    if (this.approvedCourses.has(course.id)) {
      return false;
    }

    // Check prerequisites
    for (const prereqId of course.correlatives) {
      if (this.approvedCourses.has(prereqId)) {
        continue;
      }

      let prereqCompleted = false;
      const termIndex = this.terms.indexOf(term);
      
      for (let i = 0; i < termIndex; i++) {
        const prevTerm = this.terms[i];
        if (currentPlan[prevTerm]?.some(c => c.id === prereqId)) {
          prereqCompleted = true;
          break;
        }
      }

      if (!prereqCompleted) {
        return false;
      }
    }

    // Check term hours limit
    const termCourses = currentPlan[term] || [];
    const termHours = termCourses.reduce((sum, c) => sum + c.hours, 0);
    if (termHours + course.hours > this.preferences.maxHoursPerTerm) {
      return false;
    }

    // Check schedule availability
    return this.findValidSchedule(course, termCourses) !== null;
  }

  tryScheduleCourses(remainingCourses, currentPlan, attempted = new Set()) {
    if (remainingCourses.length === 0) {
      return [true, currentPlan];
    }

    const courseId = remainingCourses[0];
    const course = this.courses.get(courseId);

    if (this.approvedCourses.has(courseId)) {
      return this.tryScheduleCourses(remainingCourses.slice(1), currentPlan, attempted);
    }

    const assignmentKey = `${courseId}`;
    if (attempted.has(assignmentKey)) {
      return this.tryScheduleCourses(remainingCourses.slice(1), currentPlan, new Set());
    }

    for (const term of this.terms) {
      // Create a deep copy of the current plan
      const testPlan = Object.fromEntries(
        Object.entries(currentPlan).map(([t, courses]) => [t, [...courses]])
      );

      if (this.canAssignToTerm(course, term, testPlan)) {
        if (!testPlan[term]) testPlan[term] = [];
        testPlan[term].push(course);
        
        const schedule = this.findValidSchedule(course, testPlan[term].slice(0, -1));
        this.chosenSchedules.set(courseId, schedule);

        const [success, newPlan] = this.tryScheduleCourses(
          remainingCourses.slice(1),
          testPlan,
          attempted
        );

        if (success) {
          return [true, newPlan];
        }
      }
    }

    attempted.add(assignmentKey);
    return this.tryScheduleCourses(remainingCourses.slice(1), currentPlan, new Set());
  }

  buildGraph() {
    const graph = new Map();
    const inverseGraph = new Map();
    const inDegree = new Map();
    
    for (const [courseId, course] of this.courses) {
      if (!course.correlatives?.length) {
        inDegree.set(courseId, 0);
      }
      for (const correlativeId of course.correlatives || []) {
        if (!graph.has(correlativeId)) graph.set(correlativeId, []);
        if (!inverseGraph.has(courseId)) inverseGraph.set(courseId, []);
        
        graph.get(correlativeId).push(courseId);
        inverseGraph.get(courseId).push(correlativeId);
        inDegree.set(courseId, (inDegree.get(courseId) || 0) + 1);
      }
    }
    
    return { graph, inverseGraph, inDegree };
  }

  topologicalSort() {
    const { graph, inDegree } = this.buildGraph();
    
    // Queue for courses without dependencies
    const queue = Array.from(this.courses.keys())
      .filter(id => !inDegree.get(id));
    
    const sortedCourses = [];
    const levels = new Map();
    const courseLevels = new Map();
    let currentLevel = 0;
    
    while (queue.length) {
      const levelSize = queue.length;
      levels.set(currentLevel, []);
      
      for (let i = 0; i < levelSize; i++) {
        const courseId = queue.shift();
        sortedCourses.push(courseId);
        levels.get(currentLevel).push(courseId);
        courseLevels.set(courseId, currentLevel);
        
        // Process dependent courses
        for (const dependent of graph.get(courseId) || []) {
          inDegree.set(dependent, inDegree.get(dependent) - 1);
          if (inDegree.get(dependent) === 0) {
            queue.push(dependent);
          }
        }
      }
      
      currentLevel++;
    }
    
    return { sortedCourses, levels, courseLevels };
  }

  planCourses() {
    // Initialize structures
    this.chosenSchedules = new Map();
    const initialPlan = Object.fromEntries(
      this.terms.map(term => [term, []])
    );
    
    // Get topological sort
    const { sortedCourses } = this.topologicalSort();
    
    // Filter out approved courses
    const coursesToSchedule = sortedCourses
      .filter(id => !this.approvedCourses.has(id));
    
    // Try to generate plan
    const [success, finalPlan] = this.tryScheduleCourses(coursesToSchedule, initialPlan);
    
    // Identify assigned and unassigned courses
    const assignedCourses = new Set(
      Object.values(finalPlan)
        .flat()
        .map(course => course.id)
    );
    
    const unassignedCourses = coursesToSchedule
      .filter(id => !assignedCourses.has(id))
      .map(id => this.courses.get(id));

    if (unassignedCourses.length > 0) {
      console.warn('Unassigned courses:', unassignedCourses);
    }

    return {
      success,
      plan: finalPlan,
      unassignedCourses,
      schedules: Object.fromEntries(this.chosenSchedules)
    };
  }
}

// Create stores
export const coursesStore = writable(rawStudyPlan);
export const selectedCoursesStore = writable([]);

// Initialize selectedCoursesStore with all courses
selectedCoursesStore.set(rawStudyPlan.map(course => ({
  ...course,
  approved: false,
  selectedSchedule: null,
  locked: false
})));

// Stats store
export const statsStore = derived(selectedCoursesStore, $courses => ({
  totalCourses: $courses.length,
  totalApproved: $courses.filter(c => c.approved).length,
  hoursPerTerm: $courses.reduce((acc, course) => {
    const termId = `${course.year}C${course.term}`;
    acc[termId] = (acc[termId] || 0) + course.hours;
    return acc;
  }, {})
}));

export function optimizeCourseSchedule(preferences) {
  const scheduler = new CourseScheduler(preferences);
  return scheduler.planCourses();
}

export default optimizeCourseSchedule;
