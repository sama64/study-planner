import { writable, derived } from 'svelte/store';

// Sample course data with more structured information
const rawStudyPlan = [
  {
    id: 1,
    name: "Medios de Representación Gráfica I",
    year: 1,
    term: 1,
    hours: 128,
    scheduleOptions: [
      { days: ["Lunes", "Jueves"], time: "14:00-18:00" },
      { days: ["Lunes", "Jueves"], time: "18:30-22:30" }
    ],
    correlatives: []
  },
  {
    id: 2,
    name: "Introducción a la Ingeniería",
    year: 1,
    term: 1,
    hours: 64,
    scheduleOptions: [
      { days: ["Miércoles"], time: "14:00-18:00" },
      { days: ["Miércoles"], time: "18:30-22:30" }
    ],
    correlatives: []
  },
  {
    id: 3,
    name: "Inglés",
    year: 1,
    term: 1,
    hours: 64,
    scheduleOptions: [
      { days: ["Viernes"], time: "14:00-18:00" },
      { days: ["Viernes"], time: "18:30-22:30" }
    ],
    correlatives: []
  },
  {
    id: 4,
    name: "Taller de Informática General y Aplicada",
    year: 1,
    term: 1,
    hours: 32,
    scheduleOptions: [
      { days: ["Martes"], time: "18:30-20:30" }
    ],
    correlatives: []
  },
  {
    id: 5,
    name: "Medios de Representación Gráfica II",
    year: 1,
    term: 2,
    hours: 128,
    scheduleOptions: [
      { days: ["Lunes", "Viernes"], time: "18:30-22:30" }
    ],
    correlatives: [1]
  },
  {
    id: 6,
    name: "Fundamentos de los Computadores Digitales",
    year: 1,
    term: 2,
    hours: 64,
    scheduleOptions: [
      { days: ["Martes"], time: "14:00-18:00" },
      { days: ["Martes"], time: "18:30-22:30" }
    ],
    correlatives: [4]
  },
  {
    id: 7,
    name: "Higiene y Seguridad en el Trabajo I",
    year: 1,
    term: 2,
    hours: 32,
    scheduleOptions: [
      { days: ["Martes"], time: "14:00-16:00" },
      { days: ["Martes"], time: "16:00-18:00" },
      { days: ["Martes"], time: "18:30-20:30" },
      { days: ["Martes"], time: "20:30-22:30" },
      { days: ["Jueves"], time: "18:30-20:30" },
      { days: ["Jueves"], time: "20:30-22:30" }
    ],
    correlatives: [2]
  },
  {
    id: 8,
    name: "Introducción a la Gestión del Medio Ambiente",
    year: 1,
    term: 2,
    hours: 32,
    scheduleOptions: [
      { days: ["Martes"], time: "18:30-20:30" },
      { days: ["Martes"], time: "20:30-22:30" },
      { days: ["Jueves"], time: "18:30-20:30" },
      { days: ["Jueves"], time: "20:30-22:30" }
    ],
    correlatives: [2]
  },
  {
    id: 9,
    name: "Economía I",
    year: 1,
    term: 2,
    hours: 32,
    scheduleOptions: [
      { days: ["Miércoles"], time: "14:00-16:00" },
      { days: ["Miércoles"], time: "18:30-20:30" },
      { days: ["Miércoles"], time: "20:30-22:30" }
    ],
    correlatives: [2]
  },
  {
    id: 10,
    name: "Matemática I",
    year: 1,
    term: 3,
    hours: 128,
    scheduleOptions: [
      { days: ["Martes", "Viernes"], time: "14:00-18:00" },
      { days: ["Martes", "Viernes"], time: "18:30-22:30" }
    ],
    correlatives: [6]
  },
  {
    id: 11,
    name: "Introducción a la Gestión de la Innovación y la Tecnología",
    year: 1,
    term: 3,
    hours: 32,
    scheduleOptions: [
      { days: ["Miércoles"], time: "16:00-18:00" },
      { days: ["Miércoles"], time: "18:30-20:30" },
      { days: ["Miércoles"], time: "20:30-22:30" }
    ],
    correlatives: [2, 3]
  },
  {
    id: 12,
    name: "Informática y Programación Industrial",
    year: 2,
    term: 3,
    hours: 64,
    scheduleOptions: [
      { days: ["Sábado"], time: "08:30-12:30" }
    ],
    correlatives: [6]
  },
  {
    id: 13,
    name: "Legislación y Ejercicio Profesional",
    year: 2,
    term: 3,
    hours: 64,
    scheduleOptions: [
      { days: ["Jueves"], time: "14:00-18:00" },
      { days: ["Jueves"], time: "18:30-22:30" }
    ],
    correlatives: [7]
  },
  {
    id: 14,
    name: "Gestión de la Calidad",
    year: 2,
    term: 3,
    hours: 32,
    scheduleOptions: [
      { days: ["Lunes"], time: "18:30-20:30" },
      { days: ["Lunes"], time: "20:30-22:30" },
      { days: ["Martes"], time: "18:30-20:30" },
      { days: ["Martes"], time: "20:30-22:30" }
    ],
    correlatives: [9]
  },
  {
    id: 15,
    name: "Economía II",
    year: 2,
    term: 3,
    hours: 32,
    scheduleOptions: [
      { days: ["Miércoles"], time: "18:30-20:30" },
      { days: ["Miércoles"], time: "20:30-22:30" }
    ],
    correlatives: [9]
  },
  {
    id: 16,
    name: "Física I",
    year: 2,
    term: 4,
    hours: 128,
    scheduleOptions: [
      { days: ["Miércoles", "Viernes"], time: "14:00-18:00" },
      { days: ["Miércoles", "Viernes"], time: "18:30-22:30" }
    ],
    correlatives: [10]
  },
  {
    id: 17,
    name: "Matemática II",
    year: 2,
    term: 4,
    hours: 128,
    scheduleOptions: [
      { days: ["Lunes", "Jueves"], time: "14:00-18:00" },
      { days: ["Lunes", "Jueves"], time: "18:30-22:30" }
    ],
    correlatives: [10]
  },
  {
    id: 18,
    name: "Fundamentos de Química",
    year: 2,
    term: 4,
    hours: 64,
    scheduleOptions: [
      { days: ["Martes"], time: "14:00-18:00" },
      { days: ["Martes"], time: "18:30-22:30" },
      { days: ["Sábado"], time: "08:30-12:30" }
    ],
    correlatives: [8]
  },
  {
    id: 19,
    name: "Organización y Gestión Industrial",
    year: 2,
    term: 4,
    hours: 64,
    scheduleOptions: [
      { days: ["Lunes"], time: "14:00-18:00" },
      { days: ["Lunes"], time: "18:30-22:30" },
      { days: ["Martes"], time: "18:30-22:30" }
    ],
    correlatives: [14, 15]
  },
  {
    id: 20,
    name: "Física II",
    year: 3,
    term: 5,
    hours: 64,
    scheduleOptions: [
      { days: ["Martes"], time: "18:30-22:30" }
    ],
    correlatives: [16]
  },
  {
    id: 21,
    name: "Termodinámica",
    year: 3,
    term: 5,
    hours: 128,
    scheduleOptions: [
      { days: ["Lunes"], time: "14:00-18:00" },
      { days: ["Lunes"], time: "18:30-22:30" },
      { days: ["Sábado"], time: "08:30-12:30" }
    ],
    correlatives: [16, 18]
  },
  {
    id: 22,
    name: "Cálculo I",
    year: 3,
    term: 5,
    hours: 128,
    scheduleOptions: [
      { days: ["Miércoles", "Viernes"], time: "14:00-18:00" },
      { days: ["Miércoles", "Viernes"], time: "18:30-22:30" }
    ],
    correlatives: [17]
  },
  {
    id: 23,
    name: "Probabilidad y Estadística",
    year: 3,
    term: 5,
    hours: 64,
    scheduleOptions: [
      { days: ["Jueves"], time: "18:30-22:30" },
      { days: ["Sábado"], time: "08:30-12:30" }
    ],
    correlatives: [10, 14]
  },
  {
    id: 24,
    name: "Estática",
    year: 3,
    term: 6,
    hours: 128,
    scheduleOptions: [
      { days: ["Lunes", "Jueves"], time: "18:30-22:30" }
    ],
    correlatives: [5, 16]
  },
  {
    id: 25,
    name: "Higiene y Seguridad en el Trabajo II",
    year: 3,
    term: 6,
    hours: 32,
    scheduleOptions: [
      { days: ["Miércoles"], time: "20:30-22:30" },
      { days: ["Jueves"], time: "18:30-20:30" },
      { days: ["Jueves"], time: "20:30-22:30" }
    ],
    correlatives: [7, 20]
  },
  {
    id: 26,
    name: "Cálculo II",
    year: 3,
    term: 6,
    hours: 128,
    scheduleOptions: [
      { days: ["Martes", "Viernes"], time: "18:30-22:30" }
    ],
    correlatives: [22]
  },
  {
    id: 27,
    name: "Mecánica Teórica",
    year: 3,
    term: 6,
    hours: 32,
    scheduleOptions: [
      { days: ["Miércoles"], time: "18:30-20:30" }
    ],
    correlatives: [22]
  },
  {
    id: 28,
    name: "Electrónica General y de Potencia",
    year: 3,
    term: 6,
    hours: 64,
    scheduleOptions: [
      { days: ["Sábado"], time: "08:30-12:30" }
    ],
    correlatives: [12, 20]
  },
  {
    id: 29,
    name: "Formulación, Gestión y Evaluación de Proyectos",
    year: 4,
    term: 7,
    hours: 64,
    scheduleOptions: [
      { days: ["Lunes"], time: "18:30-22:30" }
    ],
    correlatives: [19]
  },
  {
    id: 30,
    name: "Mecánica de los Materiales",
    year: 4,
    term: 7,
    hours: 64,
    scheduleOptions: [
      { days: ["Viernes"], time: "18:30-22:30" }
    ],
    correlatives: [24]
  },
  {
    id: 31,
    name: "Ciencia de los Materiales",
    year: 4,
    term: 7,
    hours: 64,
    scheduleOptions: [
      { days: ["Martes"], time: "18:30-22:30" }
    ],
    correlatives: [18]
  },
  {
    id: 32,
    name: "Electrotecnia",
    year: 4,
    term: 7,
    hours: 128,
    scheduleOptions: [
      { days: ["Jueves"], time: "18:30-22:30" },
      { days: ["Sábado"], time: "08:30-12:30" }
    ],
    correlatives: [20, 26]
  },
  {
    id: 33,
    name: "Sistemas y Tecnologías para la Gestión Ambiental",
    year: 4,
    term: 7,
    hours: 32,
    scheduleOptions: [
      { days: ["Miércoles"], time: "18:30-20:30" }
    ],
    correlatives: [19]
  },
  {
    id: 34,
    name: "Mecanismos",
    year: 4,
    term: 7,
    hours: 32,
    scheduleOptions: [
      { days: ["Miércoles"], time: "20:30-22:30" }
    ],
    correlatives: [27]
  },
  {
    id: 35,
    name: "Tecnología del Calor",
    year: 4,
    term: 8,
    hours: 64,
    scheduleOptions: [
      { days: ["Sábado"], time: "08:30-12:30" }
    ],
    correlatives: [21, 26]
  },
];

// This store holds all available courses
function createCoursesStore() {
  const { subscribe, set, update } = writable(rawStudyPlan);

  return {
    subscribe,
    reset: () => set(rawStudyPlan)
  };
}

// This store holds the selected courses, initially empty, but we will populate it automatically
function createSelectedCoursesStore() {
  const { subscribe, set, update } = writable([]);

  const createTermId = (year, term) => `${year}C${term}`;

  return {
    subscribe,
    addCourse: (course, year, term) => update(courses => {
      console.log('Adding/Updating course:', { course, year, term });
      
      const existingCourse = courses.find(c => c.id === course.id);
      let updatedCourses;

      if (existingCourse) {
        console.log('Updating existing course');
        updatedCourses = courses.map(c =>
          c.id === course.id
            ? { 
                ...c, 
                ...course,
                selectedSchedule: course.selectedSchedule || existingCourse.selectedSchedule,
                termId: year && term ? createTermId(year, term) : course.termId,
                year: year || course.year,
                term: term || course.term
              }
            : c
        );
      } else {
        console.log('Adding new course');
        updatedCourses = [...courses, {
          ...course,
          approved: false,
          termId: year && term ? createTermId(year, term) : null,
          year: year,
          term: term,
          selectedSchedule: course.selectedSchedule || null,
          lockedSchedule: false,
          lockedTerm: false
        }];
      }

      console.log('Updated courses:', updatedCourses);
      return updatedCourses;
    }),

    toggleApproved: (courseId) => update(courses => {
      console.log('Toggling approved for course:', courseId);
      return courses.map(c =>
        c.id === courseId ? { ...c, approved: !c.approved } : c
      );
    }),

    reset: () => {
      console.log('Resetting courses');
      set([]);
    }
  };
}

// Create stores
// export const classes = createCoursesStore();
export const classes = createSelectedCoursesStore();

// Add all classes to selectedCourses by default (without a term initially)
rawStudyPlan.forEach(course => {
  classes.addCourse(course); // Add all courses as selected, without assigning a term here
});

// Enhanced stats store, reflecting the selected courses
export const stats = derived(classes, $selectedCourses => ({
  totalCourses: $selectedCourses.length,
  totalApproved: $selectedCourses.filter(c => c.approved).length,
  hoursPerTerm: $selectedCourses.reduce((acc, course) => {
    const termId = `${course.year}C${course.term}`;
    acc[termId] = (acc[termId] || 0) + course.hours;
    return acc;
  }, {})
}));

// Improved validation functions
export function validatePrerequisites(course, year, term, selectedCourses) {
  if (!course.correlatives?.length) return true;

  const termId = `${year}C${term}`;

  return course.correlatives.every(prereqId => {
    const prerequisite = selectedCourses.find(c => c.id === prereqId);
    if (!prerequisite?.approved) return false;

    const prereqTermId = `${prerequisite.year}C${prerequisite.term}`;
    return prereqTermId < termId;
  });
}

export function checkScheduleConflict(course1, course2) {
  if (!course1.scheduleOptions || !course2.scheduleOptions) return false;

  const daysOverlap = course1.scheduleOptions.some(option =>
    course2.scheduleOptions.some(otherOption =>
      otherOption.days.some(day => option.days.includes(day))
    )
  );

  return daysOverlap && course1.scheduleOptions.some(option =>
    course2.scheduleOptions.some(otherOption =>
      option.time === otherOption.time
    )
  );
}

// Map correlatives IDs to class names
export const classLookup = derived(classes, ($classes) => {
  const lookup = {};
  $classes.forEach((course) => {
    lookup[course.id] = course.name;
  });
  return lookup;
});