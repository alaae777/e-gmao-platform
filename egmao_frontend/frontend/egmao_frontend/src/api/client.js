/**
 * Real API client (Django REST Framework). Replaces `mock/mockServer.js`.
 *
 * This module is an adapter: it keeps the exact same shape the UI already
 * expects (see `mock/mockServer.js` for the reference contract — `_id`
 * suffixed foreign keys, plain arrays, etc.) so pages built against the
 * mock keep working unchanged, while every call now hits the real API.
 */
import http, { tokenStore, unwrap, toRequestBody } from "./http";

// ------------------------------------------------------------- crud factory
/**
 * Generic REST CRUD wrapper around a DRF ViewSet.
 * @param resource     API path segment, e.g. "catalog/categories"
 * @param fkMap        { bareName: aliasName } e.g. { category: "category_id" }
 *                      Adds `aliasName` on read, and maps `aliasName` back
 *                      to `bareName` before sending writes to the API.
 */
function makeCrud(resource, fkMap = {}) {
  const withAliases = (row) => {
    if (!row) return row;
    const out = { ...row };
    for (const [bare, alias] of Object.entries(fkMap)) {
      if (bare in out) out[alias] = out[bare];
    }
    return out;
  };
  const stripAliases = (payload) => {
    const out = { ...payload };
    for (const [bare, alias] of Object.entries(fkMap)) {
      if (alias in out) {
        out[bare] = out[alias];
        if (alias !== bare) delete out[alias];
      }
    }
    return out;
  };

  return {
    list: async () => {
      const { data } = await http.get(`/${resource}/`, { params: { page_size: 500 } });
      return unwrap(data).map(withAliases);
    },
    get: async (id) => {
      const { data } = await http.get(`/${resource}/${id}/`);
      return withAliases(data);
    },
    create: async (payload) => {
      const clean = stripAliases(payload);
      const { data: body, isMultipart } = toRequestBody(clean);
      const { data } = await http.post(`/${resource}/`, body, {
        headers: isMultipart ? { "Content-Type": "multipart/form-data" } : undefined,
      });
      return withAliases(data);
    },
    update: async (id, payload) => {
      const clean = stripAliases(payload);
      const { data: body, isMultipart } = toRequestBody(clean);
      const { data } = await http.patch(`/${resource}/${id}/`, body, {
        headers: isMultipart ? { "Content-Type": "multipart/form-data" } : undefined,
      });
      return withAliases(data);
    },
    remove: async (id) => {
      await http.delete(`/${resource}/${id}/`);
      return { ok: true };
    },
  };
}

// ------------------------------------------------------------------- auth
async function login(matricule, password) {
  const { data } = await http.post("/accounts/auth/login/", { matricule, password });
  tokenStore.set(data.access, data.refresh);
  return data.user; // { id, matricule, first_name, last_name, email, role, photo, is_active }
}

function logout() {
  tokenStore.clear();
}
async function register({ matricule, first_name, last_name, email, password }) {
  const { data } = await http.post("/accounts/auth/register/", {
    matricule, first_name, last_name, email, password,
  });
  return data;
}
// ---------------------------------------------------------------- catalog
async function listCategories() {
  const { data } = await http.get("/catalog/categories/", { params: { page_size: 500 } });
  return unwrap(data);
}

async function listTrainings() {
  const { data } = await http.get("/catalog/trainings/", { params: { page_size: 500 } });
  return unwrap(data).map((t) => ({ ...t, category_id: t.category }));
}

async function getTraining(trainingId) {
  const { data: t } = await http.get(`/catalog/trainings/${trainingId}/`);
  return {
    ...t,
    category_id: t.category,
    modules: (t.modules || []).map((m) => ({
      ...m,
      training_id: m.training,
      chapters: (m.chapters || []).map((c) => ({ ...c, module_id: c.module })),
    })),
  };
}

async function getChapter(chapterId) {
  const { data: chapter } = await http.get(`/catalog/chapters/${chapterId}/`);
  let moduleObj = null;
  if (chapter.module) {
    const { data: mod } = await http.get(`/catalog/modules/${chapter.module}/`);
    moduleObj = mod;
  }
  return {
    ...chapter,
    module_id: chapter.module,
    module: moduleObj,
    videos: (chapter.videos || []).map((v) => ({ ...v, chapter_id: v.chapter })),
    documents: (chapter.documents || []).map((d) => ({ ...d, chapter_id: d.chapter })),
  };
}

// --------------------------------------------------------------- learning
async function getModuleUnlockState(_userId, moduleId) {
  const [{ data: state }, { data: chaptersRaw }, { data: quizzesRaw }] = await Promise.all([
    http.get(`/progress/modules/${moduleId}/unlock-state/`),
    http.get("/catalog/chapters/", { params: { module: moduleId, page_size: 200 } }),
    http.get("/quizzes/quizzes/", { params: { module: moduleId, page_size: 5 } }),
  ]);
  const chaptersMeta = unwrap(chaptersRaw);
  const quizList = unwrap(quizzesRaw);
  const quiz = quizList[0] || null;

  const chapters = state.chapters.map((c) => {
    const meta = chaptersMeta.find((m) => m.id === c.chapter_id) || {};
    return {
      id: c.chapter_id,
      title: meta.title,
      order: meta.order,
      unlocked: c.unlocked,
      completed: c.completed,
    };
  });

  return {
    chapters,
    quiz: quiz
      ? {
          id: quiz.id,
          title: quiz.title,
          score_minimal: quiz.score_minimal,
          duration_minutes: quiz.duration_minutes,
          question_count: (quiz.questions || []).length,
          unlocked: state.quiz_unlocked,
        }
      : null,
  };
}

async function markChapterComplete(_userId, chapterId) {
  const { data } = await http.post(`/progress/chapters/${chapterId}/complete/`);
  return data;
}

async function getQuiz(quizId) {
  const { data: quiz } = await http.get(`/quizzes/quizzes/${quizId}/`);
  return { ...quiz, module_id: quiz.module };
}

async function submitQuiz(_userId, quizId, answers) {
  // `answers` comes in as { [questionId]: choiceId } from QuizPage.
  const payload = {
    answers: Object.entries(answers).map(([question, choice]) => ({
      question: Number(question),
      choice: Number(choice),
    })),
  };
  const { data } = await http.post(`/quizzes/quizzes/${quizId}/submit/`, payload);
  return data; // { attempt_id, score, passed, score_minimal, correct_count, total_questions }
}

// ---------------------------------------------------------------- progress
async function listProgress(_userId) {
  const { data } = await http.get("/progress/progress/", { params: { page_size: 500 } });
  return unwrap(data).map((p) => ({ ...p, training_id: p.training }));
}

async function listCertificates(_userId) {
  const { data } = await http.get("/progress/certificates/", { params: { page_size: 500 } });
  return unwrap(data).map((c) => ({ ...c, training_id: c.training }));
}

async function getAdminStats() {
  const { data: s } = await http.get("/progress/admin/stats/");
  return {
    totalUsers: s.total_users,
    totalTrainings: s.total_trainings,
    totalCategories: s.total_categories,
    totalCertificatesIssued: s.total_certificates,
    averageProgress: s.global_progress_avg,
    attemptsCount: undefined, // not tracked separately server-side; see quiz_success_rate
    quizSuccessRate: s.quiz_success_rate,
    totalModules: s.total_modules,
    totalChapters: s.total_chapters,
    totalQuizzes: s.total_quizzes,
  };
}

// ------------------------------------------------------------------- chat
async function sendChatMessage({ conversationId, message, chapterId }) {
  const { data } = await http.post("/assistant/chat/", {
    conversation_id: conversationId ?? null,
    message,
    chapter_id: chapterId ?? null,
  });
  return data; // { conversation_id, reply, sources }
}

// --------------------------------------------------------------------- api
export const api = {
  auth: { login, logout, register },
  catalog: { listCategories, listTrainings, getTraining, getChapter },
  learning: { getModuleUnlockState, markChapterComplete, getQuiz, submitQuiz },
  progress: { list: listProgress, listCertificates },
  assistant: { sendMessage: sendChatMessage },
  admin: {
    stats: getAdminStats,
    categories: makeCrud("catalog/categories"),
    trainings: makeCrud("catalog/trainings", { category: "category_id" }),
    modules: makeCrud("catalog/modules", { training: "training_id" }),
    chapters: makeCrud("catalog/chapters", { module: "module_id" }),
    videos: makeCrud("catalog/videos", { chapter: "chapter_id" }),
    documents: makeCrud("catalog/documents", { chapter: "chapter_id" }),
    quizzes: makeCrud("quizzes/quizzes", { module: "module_id" }),
    questions: makeCrud("quizzes/questions", { quiz: "quiz_id" }),
    choices: makeCrud("quizzes/choices", { question: "question_id" }),
    users: makeCrud("accounts/users"),
  },
};
