import { UniqueConstraintError } from "sequelize";

import { Content, Location, Progress, Space, sequelize } from "../models/index.js";
import { ApiError } from "../utils/ApiError.js";
import ArchiveService from "./ArchiveService.js";
import { getOwnedSpaceGraph } from "./spaceGraph.js";

const MAX_HISTORY_ITEMS = 30;
const MAX_QUIZ_QUESTIONS = 12;
const MAX_QUESTIONS_PER_LOCATION = 3;

function toPlain(model) {
  return model?.get ? model.get({ plain: true }) : model;
}

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, Number.isFinite(value) ? Math.round(value) : 0));
}

function normalizeHistory(history) {
  return Array.isArray(history) ? history.slice(0, MAX_HISTORY_ITEMS) : [];
}

function pushHistory(history, entry) {
  const normalized = normalizeHistory(history);
  const duplicate = normalized.find((item) => {
    if (item.type !== entry.type) return false;
    if ((item.label || "") !== (entry.label || "")) return false;
    if ((item.correct ?? null) !== (entry.correct ?? null)) return false;
    if ((item.total ?? null) !== (entry.total ?? null)) return false;

    const itemTime = item.at ? new Date(item.at).getTime() : Number.NaN;
    const entryTime = entry.at ? new Date(entry.at).getTime() : Number.NaN;
    return Number.isFinite(itemTime) && Number.isFinite(entryTime) && Math.abs(itemTime - entryTime) < 5000;
  });

  if (duplicate) return normalized;
  return [entry, ...normalized].slice(0, MAX_HISTORY_ITEMS);
}

function historyMinuteKey(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 16);
}

function dedupeDashboardHistory(entries) {
  const seen = new Set();
  const result = [];

  for (const entry of entries) {
    const minuteKey = historyMinuteKey(entry.at);
    const key = entry.type === "quiz"
      ? [
        entry.spaceId,
        entry.type,
        minuteKey,
        entry.correct ?? "",
        entry.total ?? "",
        entry.percent ?? entry.score ?? "",
      ].join("|")
      : [entry.spaceId, entry.type, minuteKey].join("|");

    if (seen.has(key)) continue;
    seen.add(key);
    result.push(entry);
  }

  return result;
}

function truncate(value, length = 120) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length > length ? `${text.slice(0, length - 1)}...` : text;
}

function contentLabel(content) {
  if (content.type === "formula") return `Формула: ${truncate(content.value, 120)}`;
  if (content.type === "image") return "Изображение в мястото";
  return truncate(content.value, 120);
}

function cleanContentLabel(content) {
  if (content.type === "formula") return `Формула: ${truncate(content.value, 120)}`;
  if (content.type === "image") return "Изображение в мястото";
  return truncate(content.value, 120);
}

const BG_STOP_WORDS = new Set([
  "аз", "ако", "без", "бе", "би", "бил", "била", "били", "било", "в", "вас", "ви", "вие",
  "във", "ги", "го", "да", "до", "е", "един", "една", "едно", "за", "и", "или", "им",
  "има", "като", "към", "ли", "ме", "ми", "му", "на", "над", "не", "него", "ние", "ни",
  "но", "о", "обаче", "около", "от", "по", "под", "при", "са", "се", "си", "сме", "с",
  "със", "тази", "това", "този", "тези", "те", "тя", "то", "той", "тук", "ще", "че",
  "чрез", "я", "което", "която", "който", "кои", "как", "кога", "къде", "защо"
]);

function normalizeText(value) {
  return String(value || "")
    .toLocaleLowerCase("bg-BG")
    .replace(/[^\p{L}\p{N}\s+\-=*/().,%]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractKeywords(value, limit = 5) {
  const text = normalizeText(value);
  const formulaParts = text.match(/[a-zа-я0-9]+(?:\s*[+\-=*/]\s*[a-zа-я0-9]+)+/giu) || [];
  const words = text
    .split(/\s+/)
    .map((word) => word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ""))
    .filter((word) => word.length >= 4 && !BG_STOP_WORDS.has(word));

  const scored = new Map();
  for (const word of [...formulaParts, ...words]) {
    scored.set(word, (scored.get(word) || 0) + 1);
  }

  return [...scored.entries()]
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .map(([word]) => word)
    .slice(0, limit);
}

function topicFromContent(content) {
  const keywords = extractKeywords(content.value, 4);
  if (keywords.length > 0) {
    return keywords.slice(0, content.type === "formula" ? 2 : 3).join(", ");
  }

  return truncate(content.value, 70);
}

function makeQuestionBase({ id, answerType, kind, prompt, meta, type, mediaUrl = null }) {
  return {
    id,
    answerType,
    kind,
    type,
    prompt,
    mediaUrl,
    meta,
  };
}

function buildContentOptions(answer, contentOptions) {
  const distractors = contentOptions
    .filter((option) => option.id !== answer.id && option.locationId !== answer.locationId)
    .slice(0, 5);

  return [answer, ...distractors].sort((a, b) => String(a.id).localeCompare(String(b.id)));
}

function shuffle(values = []) {
  return [...values].sort(() => Math.random() - 0.5);
}

function normalizeLocations(space) {
  return (space?.Locations || [])
    .map((location) => toPlain(location))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function calculateStats(space, progress) {
  const locations = normalizeLocations(space);
  const locationIds = locations.map((location) => location.id);
  const visitedLocationIds = unique(progress?.visitedLocationIds || []).filter((id) => locationIds.includes(id));
  const totalItems = locations.length;
  const completedItems = visitedLocationIds.length;
  const percent = totalItems > 0 ? clampPercent((completedItems / totalItems) * 100) : 0;
  const totalContent = locations.reduce((sum, location) => sum + (location.Contents?.length || 0), 0);
  const currentLocationId = locationIds.includes(progress?.currentLocationId) ? progress.currentLocationId : null;

  return {
    totalItems,
    completedItems,
    totalLocations: totalItems,
    totalContent,
    percent,
    visitedLocationIds,
    currentLocationId,
    completed: totalItems > 0 && completedItems === totalItems,
  };
}

function normalizeProgressResponse(progress, space) {
  const plain = toPlain(progress);
  const stats = calculateStats(space, plain);

  return {
    ...plain,
    ...stats,
    quizHistory: normalizeHistory(plain.quizHistory),
    studyHistory: normalizeHistory(plain.studyHistory),
  };
}

function buildPrompt(content) {
  if (content.type === "image") {
    return {
      prompt: "Кое място съдържа това изображение?",
      mediaUrl: content.value,
      meta: "Изображение",
    };
  }

  if (content.type === "formula") {
    return {
      prompt: `Къде е поставена формулата или понятието: "${String(content.value || "")}"?`,
      meta: "Формула",
    };
  }

  return {
    prompt: `В кое място е записан този факт: "${String(content.value || "")}"?`,
    meta: "Текст",
  };
}

function makeQuestion(content, location, locations) {
  return {
    id: `${content.id}-${location.id}`,
    contentId: content.id,
    type: content.type,
    prompt: "Кое място е свързано с този учебен елемент?",
    mediaUrl: content.type === "image" ? content.value : null,
    meta: content.type === "formula" ? "Формула" : content.type === "image" ? "Изображение" : "Текст",
    answerLocationId: location.id,
    answer: location.title,
    options: locations.map((option) => ({
      id: option.id,
      title: option.title,
    })),
  };
}

function makeImageMemoryQuestion(content, location, contentOptions) {
  const answer = {
    ...content,
    locationTitle: location.title,
  };
  const options = buildContentOptions(answer, contentOptions);

  return {
    id: `${content.id}-${location.id}`,
    contentId: content.id,
    type: content.type,
    prompt: "Разгледайте снимката на мястото. Кой учебен елемент е запомнен тук?",
    mediaUrl: location.image || null,
    meta: location.title,
    answerId: content.id,
    answerContentId: content.id,
    answerLocationId: location.id,
    answer: cleanContentLabel(content),
    answerLocation: location.title,
    options: options.map((option) => ({
      id: option.id,
      title: cleanContentLabel(option),
      locationTitle: option.locationTitle,
    })),
  };
}

function makeSmartImageMemoryQuestion(content, location, contentOptions) {
  return {
    ...makeImageMemoryQuestion(content, location, contentOptions),
    id: `image-content-${content.id}-${location.id}`,
    kind: "image_to_content",
    answerMode: "content",
    prompt: "Разгледайте снимката на мястото. Кой учебен елемент е запомнен тук?",
  };
}

function makeContentToLocationQuestion(content, location, locations) {
  return {
    id: `content-location-${content.id}-${location.id}`,
    contentId: content.id,
    kind: "content_to_location",
    answerMode: "location",
    type: content.type,
    prompt: content.type === "formula"
      ? `Къде е запомнена тази формула или идея: "${String(content.value || "")}"?`
      : `Къде е запомнен този учебен елемент: "${String(content.value || "")}"?`,
    mediaUrl: null,
    meta: content.type === "formula" ? "Формула" : "Текст",
    answerLocationId: location.id,
    answer: location.title,
    options: shuffle(locations).map((option) => ({
      id: option.id,
      title: option.title,
    })),
  };
}

function makeLocationBundleQuestion(location, contentOptions) {
  const studyItems = (location.Contents || []).filter((content) => content.value && content.type !== "image");
  const answer = {
    id: `bundle-${location.id}`,
    locationId: location.id,
    title: studyItems.map((content) => contentLabel(content)).slice(0, 3).join(" + "),
  };
  const groupedDistractors = new Map();

  for (const item of shuffle(contentOptions)) {
    if (item.locationId === location.id || groupedDistractors.has(item.locationId)) {
      continue;
    }

    const group = contentOptions.filter((option) => option.locationId === item.locationId);
    groupedDistractors.set(item.locationId, {
      id: `bundle-${item.locationId}`,
      locationId: item.locationId,
      title: group.map((content) => contentLabel(content)).slice(0, 3).join(" + "),
    });
  }

  return {
    id: `location-bundle-${location.id}`,
    kind: "location_bundle",
    answerMode: "content",
    type: "bundle",
    prompt: `Коя група учебни елементи е свързана с мястото "${location.title}"?`,
    mediaUrl: location.image || null,
    meta: location.title,
    answerId: answer.id,
    answerLocationId: location.id,
    answer: answer.title,
    answerLocation: location.title,
    options: shuffle([answer, ...[...groupedDistractors.values()].slice(0, 5)]).map((option) => ({
      id: option.id,
      title: option.title,
      locationTitle: option.locationTitle,
    })),
  };
}

function makeLocationToContentQuestion(content, location, contentOptions) {
  const answer = {
    ...content,
    locationId: location.id,
    locationTitle: location.title,
  };
  const distractors = shuffle(contentOptions)
    .filter((option) => option.id !== content.id)
    .slice(0, 5);
  const options = shuffle([answer, ...distractors]);

  return {
    id: `location-content-${content.id}-${location.id}`,
    contentId: content.id,
    kind: "location_to_content",
    answerMode: "content",
    type: content.type,
    prompt: `Кой учебен елемент е свързан с мястото "${location.title}"?`,
    mediaUrl: location.image || null,
    meta: location.title,
    answerId: content.id,
    answerContentId: content.id,
    answerLocationId: location.id,
    answer: cleanContentLabel(content),
    answerLocation: location.title,
    options: options.map((option) => ({
      id: option.id,
      title: cleanContentLabel(option),
      locationTitle: option.locationTitle,
    })),
  };
}

function makeSmartContentToLocationQuestion(content, location, locations) {
  const fullText = String(content.value || "");

  return {
    ...makeQuestionBase({
      id: `smart-content-location-${content.id}-${location.id}`,
      answerType: "multiple_choice",
      kind: "content_to_location",
      type: content.type,
      meta: content.type === "formula" ? "Формула" : "Текст",
      prompt: content.type === "formula"
        ? `В кое място е запомнена формулата или идеята: "${fullText}"?`
        : `В кое място е запомнен този учебен елемент: "${fullText}"?`,
    }),
    contentId: content.id,
    answerMode: "location",
    answerLocationId: location.id,
    answer: location.title,
    options: shuffle(locations).map((option) => ({
      id: option.id,
      title: option.title,
    })),
  };
}

function makeSmartLocationToContentQuestion(content, location, contentOptions) {
  const answer = {
    ...content,
    locationId: location.id,
    locationTitle: location.title,
  };
  const options = shuffle([
    answer,
    ...shuffle(contentOptions).filter((option) => option.id !== content.id).slice(0, 5),
  ]);

  return {
    ...makeQuestionBase({
      id: `smart-location-content-${content.id}-${location.id}`,
      answerType: "multiple_choice",
      kind: "location_to_content",
      type: content.type,
      mediaUrl: location.image || null,
      meta: location.title,
      prompt: `Кой учебен елемент е свързан с мястото "${location.title}"?`,
    }),
    contentId: content.id,
    answerMode: "content",
    answerId: content.id,
    answerContentId: content.id,
    answerLocationId: location.id,
    answer: cleanContentLabel(content),
    answerLocation: location.title,
    options: options.map((option) => ({
      id: option.id,
      title: cleanContentLabel(option),
      locationTitle: option.locationTitle,
    })),
  };
}

function makeChecklistQuestion(location, contentOptions) {
  const correctItems = (location.Contents || [])
    .filter((content) => content.value && content.type !== "image")
    .slice(0, 4)
    .map((content) => ({
      ...content,
      locationId: location.id,
      locationTitle: location.title,
    }));
  const distractors = shuffle(contentOptions)
    .filter((option) => option.locationId !== location.id)
    .slice(0, Math.max(2, 6 - correctItems.length));
  const options = shuffle([...correctItems, ...distractors]);

  return {
    ...makeQuestionBase({
      id: `smart-checklist-${location.id}`,
      answerType: "checklist",
      kind: "location_checklist",
      type: "checklist",
      mediaUrl: location.image || null,
      meta: location.title,
      prompt: `Кои учебни елементи принадлежат към мястото "${location.title}"?`,
    }),
    answerMode: "content",
    answerLocationId: location.id,
    answerIds: correctItems.map((item) => item.id),
    answer: correctItems.map((item) => cleanContentLabel(item)).join("; "),
    answerLocation: location.title,
    options: options.map((option) => ({
      id: option.id,
      title: cleanContentLabel(option),
      locationTitle: option.locationTitle,
    })),
  };
}

function makeWordQuestion(content, location) {
  return {
    ...makeQuestionBase({
      id: `smart-word-${content.id}-${location.id}`,
      answerType: "word",
      kind: "keyword_recall",
      type: content.type,
      meta: "Текст",
      prompt: "Напишете целия текст на учебния елемент.",
    }),
    contentId: content.id,
    answerMode: "text",
    answerLocationId: location.id,
    answerText: String(content.value || ""),
    acceptedAnswers: [String(content.value || "")],
    expectedKeywords: [],
    answer: String(content.value || ""),
  };
}

function makeOpenQuestion(content, location) {
  return {
    ...makeQuestionBase({
      id: `smart-open-${content.id}-${location.id}`,
      answerType: "open",
      kind: "open_recall",
      type: content.type,
      meta: "Текст",
      prompt: `Напишете целия текст на учебния елемент от мястото "${location.title}".`,
    }),
    contentId: content.id,
    answerMode: "text",
    answerLocationId: location.id,
    answerText: String(content.value || ""),
    expectedKeywords: [],
    answer: String(content.value || ""),
  };
}

function selectQuizQuestions(questionPool, maxQuestions = MAX_QUIZ_QUESTIONS) {
  const countsByLocation = new Map();

  return shuffle(questionPool).filter((question) => {
    const locationId = question.answerLocationId || question.locationId;
    const currentCount = countsByLocation.get(locationId) || 0;

    if (currentCount >= MAX_QUESTIONS_PER_LOCATION) {
      return false;
    }

    countsByLocation.set(locationId, currentCount + 1);
    return true;
  }).slice(0, maxQuestions);
}

class ProgressService {
  async getOwnedSpace(spaceId, userId, { transaction } = {}) {
    const space = await getOwnedSpaceGraph(spaceId, userId, { transaction });

    if (!space) {
      throw new ApiError(404, "Пространството не е намерено или нямате достъп до него.");
    }

    return space;
  }

  async getProgressRecord(userId, spaceId, { transaction, lock = false } = {}) {
    const baseOptions = {
      where: { userId, spaceId },
      defaults: { userId, spaceId },
      transaction,
    };

    try {
      await Progress.findOrCreate(baseOptions);
    } catch (err) {
      if (!(err instanceof UniqueConstraintError)) {
        throw err;
      }
    }

    const findOptions = {
      where: { userId, spaceId },
      transaction,
    };

    if (lock && transaction) {
      findOptions.lock = transaction.LOCK.UPDATE;
    }

    const progress = await Progress.findOne(findOptions);
    if (!progress) {
      throw new ApiError(500, "Неуспешно създаване или зареждане на напредъка.");
    }

    return progress;
  }

  async getProgress(userId, spaceId) {
    return sequelize.transaction(async (transaction) => {
      const space = await this.getOwnedSpace(spaceId, userId, { transaction });
      const progress = await this.getProgressRecord(userId, spaceId, { transaction, lock: true });

      return this.recalculate(progress, space, { transaction });
    });
  }

  async recalculate(progress, space, { transaction } = {}) {
    const stats = calculateStats(space, progress);
    const nextData = {
      percent: stats.percent,
      totalItems: stats.totalItems,
      completedItems: stats.completedItems,
      visitedLocationIds: stats.visitedLocationIds,
      currentLocationId: stats.currentLocationId,
      completed: stats.completed,
    };

    const plain = toPlain(progress);
    const changed = Object.entries(nextData).some(([key, value]) => (
      JSON.stringify(plain[key]) !== JSON.stringify(value)
    ));

    const updated = changed ? await progress.update(nextData, { transaction }) : progress;
    return normalizeProgressResponse(updated, space);
  }

  async updateProgress(userId, spaceId, data = {}) {
    const result = await sequelize.transaction(async (transaction) => {
      const space = await this.getOwnedSpace(spaceId, userId, { transaction });
      const progress = await this.getProgressRecord(userId, spaceId, { transaction, lock: true });

      const locations = normalizeLocations(space);
      const validLocationIds = locations.map((location) => location.id);
      const plain = toPlain(progress);
      const now = new Date();
      const updates = {
        visitedLocationIds: unique(plain.visitedLocationIds || []).filter((id) => validLocationIds.includes(id)),
        quizHistory: normalizeHistory(plain.quizHistory),
        studyHistory: normalizeHistory(plain.studyHistory),
        currentLocationId: validLocationIds.includes(plain.currentLocationId) ? plain.currentLocationId : null,
        score: plain.score || 0,
        bestScore: plain.bestScore || 0,
        lastScore: plain.lastScore || 0,
        attempts: plain.attempts || 0,
        lastStudiedAt: now,
      };

      const markLocationId = data.visitedLocationId || data.markLocationId;
      if (markLocationId) {
        if (!validLocationIds.includes(markLocationId)) {
          throw new ApiError(400, "Избраното място не принадлежи към това пространство.");
        }

        updates.visitedLocationIds = unique([...updates.visitedLocationIds, markLocationId]);
        updates.currentLocationId = markLocationId;

        const location = locations.find((item) => item.id === markLocationId);
        updates.studyHistory = pushHistory(updates.studyHistory, {
          type: "recall",
          label: location?.title || "Преговор",
          at: now.toISOString(),
        });
      }

      if (Array.isArray(data.visitedLocationIds)) {
        const invalid = data.visitedLocationIds.find((id) => !validLocationIds.includes(id));
        if (invalid) {
          throw new ApiError(400, "Списъкът с преминати места съдържа невалидно място.");
        }

        updates.visitedLocationIds = unique(data.visitedLocationIds);
      }

      if (data.currentLocationId) {
        if (!validLocationIds.includes(data.currentLocationId)) {
          throw new ApiError(400, "Текущото място не принадлежи към това пространство.");
        }

        updates.currentLocationId = data.currentLocationId;
      }

      if (data.completed === true) {
        updates.visitedLocationIds = validLocationIds;
        updates.studyHistory = pushHistory(updates.studyHistory, {
          type: "completed",
          label: "Завършено преговаряне",
          at: now.toISOString(),
        });
      }

      if (Object.hasOwn(data, "score")) {
        const score = Number(data.score);
        if (!Number.isInteger(score) || score < 0) {
          throw new ApiError(400, "Резултатът трябва да бъде неотрицателно цяло число.");
        }

        updates.score = score;
        updates.lastScore = score;
        updates.bestScore = Math.max(updates.bestScore, score);
      }

      if (data.quizResult) {
        const correct = Number(data.quizResult.correct);
        const total = Number(data.quizResult.total);

        if (!Number.isInteger(correct) || !Number.isInteger(total) || correct < 0 || total < 0 || correct > total) {
          throw new ApiError(400, "Резултатът от теста е невалиден.");
        }

        const percent = total > 0 ? clampPercent((correct / total) * 100) : 0;
        updates.score = correct;
        updates.lastScore = correct;
        updates.bestScore = Math.max(updates.bestScore, correct);
        updates.attempts += 1;
        updates.quizHistory = pushHistory(updates.quizHistory, {
          type: "quiz",
          correct,
          total,
          percent,
          at: now.toISOString(),
        });
      }

      const updated = await progress.update(updates, { transaction });
      const recalculated = await this.recalculate(updated, space, { transaction });
      return recalculated;
    });
    await ArchiveService.createUserArchive(userId, "progress-updated").catch(() => {});
    return result;
  }

  async generateQuiz(userId, spaceId) {
    const space = await this.getOwnedSpace(spaceId, userId);
    const locations = normalizeLocations(space);
    const quizLocations = locations.filter((location) => (
      (location.Contents || []).some((content) => content.value && content.type !== "image")
    ));
    const contentOptions = locations.flatMap((location) => (
      (location.Contents || [])
        .filter((content) => content.value && content.type !== "image")
        .map((content) => ({
          ...content,
          locationId: location.id,
          locationTitle: location.title,
        }))
    ));

    const questionPool = quizLocations.length < 1
      ? []
      : quizLocations.flatMap((location) => {
        const studyItems = (location.Contents || []).filter((content) => content.value && content.type !== "image");
        const primaryItem = studyItems[0];
        const secondaryItem = studyItems[1] || primaryItem;
        const variedQuestions = [];

        if (studyItems.length > 1 && contentOptions.length > studyItems.length) {
          variedQuestions.push(makeChecklistQuestion(location, contentOptions));
        }

        if (primaryItem && quizLocations.length > 1) {
          variedQuestions.push(makeSmartContentToLocationQuestion(primaryItem, location, quizLocations));
        }

        if (location.image && secondaryItem && contentOptions.length > 1) {
          variedQuestions.push(makeSmartLocationToContentQuestion(secondaryItem, location, contentOptions));
        }

        if (primaryItem) {
          variedQuestions.push(makeWordQuestion(primaryItem, location));
        }

        if (secondaryItem) {
          variedQuestions.push(makeOpenQuestion(secondaryItem, location));
        }

        return variedQuestions;
      }).filter((question) => {
        if (["multiple_choice", "checklist"].includes(question.answerType)) {
          return Array.isArray(question.options) && question.options.length > 1;
        }

        return Boolean(question.answerText || question.expectedKeywords?.length);
      });
    const questions = selectQuizQuestions(questionPool);

    return {
      space: {
        id: space.id,
        title: space.title,
      },
      generatedFrom: {
        locations: locations.length,
        contentItems: contentOptions.length,
        questionPool: questionPool.length,
      },
      questions,
    };
  }

  async getDashboard(userId) {
    const [spaces, progressRows] = await Promise.all([
      Space.findAll({
        where: { userId },
        include: {
          model: Location,
          include: Content,
        },
        order: [["createdAt", "DESC"]],
      }),
      Progress.findAll({ where: { userId } }),
    ]);

    const progressBySpace = new Map(progressRows.map((row) => [row.spaceId, row]));
    const rows = spaces.map((spaceModel) => {
      const space = toPlain(spaceModel);
      const progress = toPlain(progressBySpace.get(space.id)) || {
        visitedLocationIds: [],
        quizHistory: [],
        studyHistory: [],
        attempts: 0,
        bestScore: 0,
        lastScore: 0,
        score: 0,
      };
      const stats = calculateStats(space, progress);

      return {
        id: space.id,
        title: space.title,
        coverImage: space.coverImage,
        createdAt: space.createdAt,
        progress: stats.percent,
        completed: stats.completed,
        locations: stats.totalLocations,
        contentItems: stats.totalContent,
        completedLocations: stats.completedItems,
        attempts: progress.attempts || 0,
        bestScore: progress.bestScore || 0,
        lastScore: progress.lastScore || 0,
        lastStudiedAt: progress.lastStudiedAt || null,
        quizHistory: normalizeHistory(progress.quizHistory),
        studyHistory: normalizeHistory(progress.studyHistory),
      };
    });

    const summary = rows.reduce((acc, row) => ({
      spaces: acc.spaces + 1,
      locations: acc.locations + row.locations,
      contentItems: acc.contentItems + row.contentItems,
      completedSpaces: acc.completedSpaces + (row.completed ? 1 : 0),
      attempts: acc.attempts + row.attempts,
      progressTotal: acc.progressTotal + row.progress,
    }), {
      spaces: 0,
      locations: 0,
      contentItems: 0,
      completedSpaces: 0,
      attempts: 0,
      progressTotal: 0,
    });

    const averageProgress = summary.spaces ? clampPercent(summary.progressTotal / summary.spaces) : 0;
    const latestHistory = dedupeDashboardHistory(rows
      .flatMap((row) => [
        ...row.studyHistory
          .filter((entry) => entry.type !== "quiz")
          .map((entry) => ({ ...entry, spaceId: row.id, spaceTitle: row.title })),
        ...row.quizHistory.map((entry) => ({ ...entry, spaceId: row.id, spaceTitle: row.title })),
      ]))
      .filter((entry) => entry.at)
      .sort((a, b) => new Date(b.at) - new Date(a.at))
      .slice(0, 10);

    const weakest = rows
      .filter((row) => row.locations > 0)
      .sort((a, b) => a.progress - b.progress)[0] || null;
    const strongest = rows
      .filter((row) => row.locations > 0)
      .sort((a, b) => b.progress - a.progress)[0] || null;

    return {
      summary: {
        ...summary,
        averageProgress,
      },
      spaces: rows,
      history: latestHistory,
      insights: {
        weakest: weakest ? {
          spaceId: weakest.id,
          title: weakest.title,
          progress: weakest.progress,
        } : null,
        strongest: strongest ? {
          spaceId: strongest.id,
          title: strongest.title,
          progress: strongest.progress,
        } : null,
        recommendation: weakest
          ? `Най-полезно е следващото преговаряне да бъде в "${weakest.title}".`
          : "Създайте първо пространство и добавете учебни места.",
      },
    };
  }
}

export default new ProgressService();
