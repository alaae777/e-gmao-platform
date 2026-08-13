/**
 * Utility functions for computing estimated training durations from videos, PDFs, and quizzes.
 */

/**
 * Calculates estimated duration in minutes for a chapter based on its videos and documents.
 * @param {Object} chapter - Chapter object containing videos and documents arrays
 * @returns {number} Estimated duration in minutes
 */
export function calculateChapterDuration(chapter) {
  if (!chapter) return 0;

  // Video duration: convert seconds to minutes, defaulting to 10 minutes if duration is 0
  const videoMinutes = (chapter.videos || []).reduce((acc, video) => {
    const sec = video.duration_seconds || 0;
    return acc + (sec > 0 ? Math.ceil(sec / 60) : 10);
  }, 0);

  // Document duration: estimate ~5 minutes per PDF/document
  const docMinutes = (chapter.documents || []).reduce((acc) => acc + 5, 0);

  return videoMinutes + docMinutes;
}

/**
 * Calculates estimated duration in minutes for a module.
 * @param {Object} module - Module object containing chapters and optional quiz
 * @returns {number} Estimated duration in minutes
 */
export function calculateModuleDuration(module) {
  if (!module) return 0;

  const chaptersMinutes = (module.chapters || []).reduce(
    (acc, ch) => acc + calculateChapterDuration(ch),
    0
  );

  // Quiz duration: use quiz duration_minutes or fallback to ~1.5 min per question
  let quizMinutes = 0;
  if (module.quiz) {
    if (module.quiz.duration_minutes > 0) {
      quizMinutes = module.quiz.duration_minutes;
    } else if (module.quiz.question_count > 0) {
      quizMinutes = Math.ceil(module.quiz.question_count * 1.5);
    } else {
      quizMinutes = 10;
    }
  }

  return chaptersMinutes + quizMinutes;
}

/**
 * Calculates total estimated duration in minutes for a training path.
 * @param {Object} training - Training object containing modules array
 * @returns {number} Total estimated duration in minutes
 */
export function calculateTrainingDuration(training) {
  if (!training) return 0;

  // If training modules are available, compute from modules, chapters, videos, documents, quizzes
  if (training.modules && training.modules.length > 0) {
    const computed = training.modules.reduce(
      (acc, mod) => acc + calculateModuleDuration(mod),
      0
    );
    if (computed > 0) return computed;
  }

  // Fallback to training.duration_estimated_minutes if set, or estimate based on module_count
  if (training.duration_estimated_minutes > 0) {
    return training.duration_estimated_minutes;
  }

  return (training.module_count || 1) * 45;
}

/**
 * Formats duration in minutes into a clean human-readable French string.
 * e.g. 135 -> "2 h 15 min", 45 -> "45 min"
 * @param {number} minutes 
 * @returns {string} Formatted duration string
 */
export function formatDuration(minutes) {
  const total = Math.max(0, Math.round(minutes || 0));
  if (total < 60) {
    return `${total} min`;
  }
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return mins > 0 ? `${hours} h ${mins} min` : `${hours} h`;
}
