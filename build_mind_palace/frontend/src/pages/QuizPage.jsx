import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import BackLink from '../components/ui/BackLink';
import { progressService } from '../services/content.service';

const QUESTION_TYPE_LABELS = {
  multiple_choice: 'Избор',
  checklist: 'Списък',
  open: 'Отворен',
  word: 'Дума',
};

function resultClass(isCorrect) {
  return isCorrect ? 'quiz-result ok' : 'quiz-result bad';
}

function normalizeText(value) {
  return String(value || '')
    .toLocaleLowerCase('bg-BG')
    .replace(/[^\p{L}\p{N}\s+\-=*/().,%]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getAnswerId(question) {
  return question.answerId || question.answerContentId || question.answerLocationId;
}

function getExpectedAnswerIds(question) {
  if (Array.isArray(question.answerIds)) return question.answerIds;
  const answerId = getAnswerId(question);
  return answerId ? [answerId] : [];
}

function hasAnswer(question, answer) {
  if (question.answerType === 'checklist') return Array.isArray(answer) && answer.length > 0;
  return Boolean(String(answer || '').trim());
}

function sameIdSet(left = [], right = []) {
  if (left.length !== right.length) return false;
  const expected = new Set(right);
  return left.every((item) => expected.has(item));
}

function textMatchesKeyword(answer, keyword) {
  const normalizedAnswer = normalizeText(answer);
  const normalizedKeyword = normalizeText(keyword);

  return normalizedKeyword.length > 0 && (
    normalizedAnswer === normalizedKeyword ||
    normalizedAnswer.includes(normalizedKeyword)
  );
}

function isQuestionCorrect(question, answer) {
  if (question.answerType === 'checklist') {
    return sameIdSet(answer || [], getExpectedAnswerIds(question));
  }

  if (question.answerType === 'word') {
    return (question.acceptedAnswers || [question.answerText, question.answer])
      .some((accepted) => textMatchesKeyword(answer, accepted));
  }

  if (question.answerType === 'open') {
    const keywords = question.expectedKeywords || [];
    if (keywords.length === 0) return normalizeText(answer).length >= 12;

    const matched = keywords.filter((keyword) => textMatchesKeyword(answer, keyword)).length;
    return matched >= Math.min(2, keywords.length);
  }

  return answer === getAnswerId(question);
}

function expectedAnswerText(question) {
  if (question.answerType === 'checklist') return question.answer || 'Изберете всички верни отговори.';
  if (question.answerType === 'word') return question.acceptedAnswers?.[0] || question.answerText || question.answer;
  if (question.answerType === 'open') return question.answerText || question.answer;
  return question.answer;
}

function answerPlaceholder(question) {
  if (question.answerType === 'word') return 'Кратък отговор';
  if (question.answerType === 'open') return 'Напишете 1-2 изречения';
  return question.answerMode === 'location' ? 'Избор на място' : 'Избор на учебен елемент';
}

export default function QuizPage() {
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [progress, setProgress] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [quizData, progressData] = await Promise.all([
          progressService.quiz(id),
          progressService.get(id),
        ]);
        setQuiz(quizData);
        setProgress(progressData);
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const questions = quiz?.questions || [];
  const answeredCount = useMemo(
    () => questions.filter((question) => hasAnswer(question, answers[question.id])).length,
    [answers, questions],
  );
  const scorePercent = questions.length ? Math.round((score / questions.length) * 100) : 0;

  const setAnswer = (questionId, value) => {
    setAnswers((current) => ({ ...current, [questionId]: value }));
  };

  const toggleChecklistAnswer = (questionId, optionId) => {
    setAnswers((current) => {
      const selected = Array.isArray(current[questionId]) ? current[questionId] : [];
      const next = selected.includes(optionId)
        ? selected.filter((idValue) => idValue !== optionId)
        : [...selected, optionId];

      return { ...current, [questionId]: next };
    });
  };

  const submitQuiz = async () => {
    setError('');
    setFeedback('');

    if (answeredCount < questions.length) {
      setError('Отговорете на всички въпроси, преди да проверите резултата.');
      return;
    }

    const correct = questions.reduce((sum, question) => (
      isQuestionCorrect(question, answers[question.id]) ? sum + 1 : sum
    ), 0);

    setSubmitting(true);
    try {
      const updated = await progressService.update(id, {
        quizResult: {
          correct,
          total: questions.length,
        },
      });
      setScore(correct);
      setSubmitted(true);
      setProgress(updated);
      setFeedback('Резултатът е запазен в статистиката.');
    } catch (err) {
      setError(String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const retry = async () => {
    setAnswers({});
    setSubmitted(false);
    setScore(0);
    setError('');
    setFeedback('');
    setLoading(true);
    try {
      setQuiz(await progressService.quiz(id));
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const renderAnswerControl = (question) => {
    const selected = answers[question.id];

    if (question.answerType === 'checklist') {
      const selectedIds = Array.isArray(selected) ? selected : [];

      return (
        <div className="quiz-options" role="group" aria-label={answerPlaceholder(question)}>
          {question.options.map((option) => (
            <label key={option.id} className="quiz-option">
              <input
                type="checkbox"
                checked={selectedIds.includes(option.id)}
                onChange={() => toggleChecklistAnswer(question.id, option.id)}
                disabled={submitted}
              />
              <span>{option.title}</span>
            </label>
          ))}
        </div>
      );
    }

    if (question.answerType === 'word') {
      return (
        <input
          value={selected || ''}
          onChange={(event) => setAnswer(question.id, event.target.value)}
          placeholder={answerPlaceholder(question)}
          disabled={submitted}
        />
      );
    }

    if (question.answerType === 'open') {
      return (
        <textarea
          rows={4}
          value={selected || ''}
          onChange={(event) => setAnswer(question.id, event.target.value)}
          placeholder={answerPlaceholder(question)}
          disabled={submitted}
        />
      );
    }

    return (
      <div className="quiz-options" role="radiogroup" aria-label={answerPlaceholder(question)}>
        {question.options.map((option) => (
          <label key={option.id} className="quiz-option">
            <input
              type="radio"
              name={question.id}
              value={option.id}
              checked={selected === option.id}
              onChange={() => setAnswer(question.id, option.id)}
              disabled={submitted}
            />
            <span>{option.title}</span>
          </label>
        ))}
      </div>
    );
  };

  if (loading) return (
    <section className="section">
      <div className="container narrow-container">
        <div className="glass-card editor-card">Генериране на умна самопроверка от темите, местата и съдържанието...</div>
      </div>
    </section>
  );

  return (
    <section className="section">
      <div className="container narrow-container stack-lg">
        <BackLink to={`/spaces/${id}/quiz`}>Назад към викторини и тестове</BackLink>

        <div className="page-header">
          <div>
            <span className="eyebrow">Самопроверка</span>
            <h1>{quiz?.space?.title || 'Самопроверка'}</h1>
            <p className="muted">Въпросите се изграждат от темите, ключовите думи, местата и снимките, с различни типове отговори.</p>
          </div>
        </div>

        <div className="quiz-summary glass-card">
          <div>
            <span className="eyebrow">Готовност</span>
            <strong>{answeredCount}/{questions.length}</strong>
            <small>отговорени въпроса</small>
          </div>
          <div>
            <span className="eyebrow">Опити</span>
            <strong>{progress?.attempts || 0}</strong>
            <small>записани теста</small>
          </div>
          <div>
            <span className="eyebrow">Последен резултат</span>
            <strong>{progress?.lastScore || 0}</strong>
            <small>верни отговора</small>
          </div>
        </div>

        {error && <div className="form-error">{error}</div>}
        {feedback && <div className="feedback-message">{feedback}</div>}

        <div className="glass-card editor-card stack-md">
          {questions.length === 0 ? (
            <div className="empty-panel">
              <h3>Няма достатъчно материали за самопроверка</h3>
              <p>Добавете учебно съдържание към местата. После въпросите ще се появят автоматично тук.</p>
            </div>
          ) : questions.map((question, index) => {
            const selected = answers[question.id];
            const isCorrect = isQuestionCorrect(question, selected);
            const typeLabel = QUESTION_TYPE_LABELS[question.answerType] || 'Избор';

            return (
              <div key={question.id} className="quiz-item">
                <div className="quiz-head">
                  <strong>Въпрос {index + 1}</strong>
                  <div className="quiz-chips">
                    <span className="chip">{question.meta}</span>
                    <span className="chip">{typeLabel}</span>
                  </div>
                </div>
                <p>{question.prompt}</p>
                {question.mediaUrl && <img className="quiz-media" src={question.mediaUrl} alt={`Снимка на място: ${question.meta}`} />}
                {renderAnswerControl(question)}
                {submitted && (
                  <div className={resultClass(isCorrect)}>
                    {isCorrect ? 'Верен отговор.' : `Верен отговор: ${expectedAnswerText(question)}`}
                  </div>
                )}
              </div>
            );
          })}

          {questions.length > 0 && !submitted && (
            <button className="btn btn-primary" onClick={submitQuiz} disabled={submitting}>
              {submitting ? 'Записване...' : 'Провери резултата'}
            </button>
          )}
          {submitted && (
            <div className="score-banner">
              Резултат: {score} / {questions.length} ({scorePercent}%)
              <button className="btn btn-secondary" onClick={retry}>Нов опит</button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
