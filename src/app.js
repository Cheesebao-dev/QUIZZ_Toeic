(function () {
  const TOTAL_QUESTIONS = 30;
  const DURATION_SECONDS = 12 * 60;
  const HISTORY_KEY = 'toeicPart5QuizHistory:v1';
  const bank = Array.isArray(window.QUESTION_BANK) ? window.QUESTION_BANK : [];

  const els = {
    startView: document.getElementById('startView'),
    setPicker: document.getElementById('setPicker'),
    startButton: document.getElementById('startButton'),
    confirmOverlay: document.getElementById('confirmOverlay'),
    cancelLeaveButton: document.getElementById('cancelLeaveButton'),
    confirmLeaveButton: document.getElementById('confirmLeaveButton'),
    questionCounter: document.getElementById('questionCounter'),
    timerText: document.getElementById('timerText'),
    questionSource: document.getElementById('questionSource'),
    questionText: document.getElementById('questionText'),
    optionsList: document.getElementById('optionsList'),
    feedbackLine: document.getElementById('feedbackLine'),
    quizView: document.getElementById('quizView'),
    resultView: document.getElementById('resultView'),
    actionbar: document.getElementById('actionbar'),
    submitButton: document.getElementById('submitButton'),
    nextButton: document.getElementById('nextButton'),
    prevButton: document.getElementById('prevButton'),
    restartTopButton: document.getElementById('restartTopButton'),
    restartResultButton: document.getElementById('restartResultButton'),
    scoreNumber: document.getElementById('scoreNumber'),
    scoreBadge: document.getElementById('scoreBadge'),
    scoreCaption: document.getElementById('scoreCaption'),
    scoreMessage: document.getElementById('scoreMessage'),
    resultStats: document.getElementById('resultStats'),
    mistakePanel: document.getElementById('mistakePanel'),
    mistakeList: document.getElementById('mistakeList'),
    startHistory: document.getElementById('startHistory'),
    startHistorySummary: document.getElementById('startHistorySummary'),
    startWeakList: document.getElementById('startWeakList'),
    reviewList: document.getElementById('reviewList'),
  };

  let attempt = [];
  let currentIndex = 0;
  let responses = [];
  let remainingSeconds = DURATION_SECONDS;
  let timerId = null;
  let selectedSet = 'all';
  let attemptActive = false;

  function randomInt(max) {
    if (window.crypto && window.crypto.getRandomValues) {
      const values = new Uint32Array(1);
      window.crypto.getRandomValues(values);
      return values[0] % max;
    }
    return Math.floor(Math.random() * max);
  }

  function shuffled(items) {
    const copy = items.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = randomInt(i + 1);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function startAttempt() {
    const pool = selectedSet === 'all' ? bank : bank.filter((question) => String(question.test) === selectedSet);
    attempt = shuffled(pool)
      .slice(0, Math.min(TOTAL_QUESTIONS, pool.length))
      .map((question) => ({
        ...question,
        options: shuffled(
          question.options.map((option) => ({
            ...option,
            isCorrect: option.letter === question.answer,
            originalLetter: option.letter,
          }))
        ).map((option, index) => ({
          ...option,
          letter: String.fromCharCode(65 + index),
        })),
      }));
    currentIndex = 0;
    responses = attempt.map(() => ({ selected: null, submitted: false }));
    remainingSeconds = DURATION_SECONDS;
    attemptActive = true;
    closeConfirm();
    els.startView.hidden = true;
    els.quizView.hidden = false;
    els.resultView.hidden = true;
    els.actionbar.hidden = false;
    startTimer();
    renderQuestion();
  }

  function showStart() {
    window.clearInterval(timerId);
    closeConfirm();
    attempt = [];
    responses = [];
    attemptActive = false;
    currentIndex = 0;
    remainingSeconds = DURATION_SECONDS;
    els.startView.hidden = false;
    els.quizView.hidden = true;
    els.resultView.hidden = true;
    els.actionbar.hidden = true;
    els.restartTopButton.hidden = true;
    els.questionCounter.textContent = '0/30';
    renderTimer();
    renderStartHistory();
  }

  function startTimer() {
    window.clearInterval(timerId);
    renderTimer();
    timerId = window.setInterval(() => {
      remainingSeconds -= 1;
      renderTimer();
      if (remainingSeconds <= 0) finishAttempt();
    }, 1000);
  }

  function renderTimer() {
    const value = Math.max(0, remainingSeconds);
    const minutes = String(Math.floor(value / 60)).padStart(2, '0');
    const seconds = String(value % 60).padStart(2, '0');
    els.timerText.textContent = `${minutes}:${seconds}`;
  }

  function renderQuestion() {
    if (!attempt.length) {
      renderEmptyState();
      return;
    }

    const question = attempt[currentIndex];
    const response = responses[currentIndex];
    const total = attempt.length;

    els.questionCounter.textContent = `${currentIndex + 1}/${total}`;
    els.questionSource.textContent = `Test ${question.test} • Câu ${question.sourceNumber}`;
    els.questionText.textContent = question.question;
    els.feedbackLine.textContent = '';
    els.feedbackLine.className = 'feedback-line';
    els.optionsList.replaceChildren(...question.options.map((option) => createOption(question, response, option)));

    els.prevButton.disabled = currentIndex === 0;
    els.restartTopButton.hidden = false;
    els.submitButton.hidden = response.submitted;
    els.nextButton.hidden = !response.submitted;
    els.submitButton.disabled = !response.selected;
    els.nextButton.textContent = currentIndex === total - 1 ? 'Xem kết quả' : 'Câu tiếp theo';

    if (response.submitted) renderFeedback(question, response);
  }

  function createOption(question, response, option) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'option-card';
    button.dataset.value = option.letter;
    button.setAttribute('aria-pressed', response.selected === option.letter ? 'true' : 'false');

    if (response.selected === option.letter) button.classList.add('is-selected');
    if (response.submitted) {
      button.classList.add('is-locked');
      if (option.isCorrect) button.classList.add('is-correct');
      if (response.selected === option.letter && !option.isCorrect) button.classList.add('is-wrong');
    }

    const marker = document.createElement('span');
    marker.className = 'option-marker';

    const copy = document.createElement('span');
    copy.className = 'option-copy';

    const letter = document.createElement('span');
    letter.className = 'option-letter';
    letter.textContent = option.letter;

    const text = document.createElement('span');
    text.textContent = option.text;

    copy.append(letter, text);
    button.append(marker, copy);

    button.addEventListener('click', () => {
      if (response.submitted) return;
      response.selected = option.letter;
      renderQuestion();
    });

    return button;
  }

  function renderFeedback(question, response) {
    const correct = isCorrectResponse(question, response);
    const correctLetter = getCorrectLetter(question);
    els.feedbackLine.textContent = correct ? 'Chính xác' : `Đáp án đúng: ${correctLetter}`;
    els.feedbackLine.classList.add(correct ? 'correct' : 'wrong');
  }

  function submitCurrent() {
    const response = responses[currentIndex];
    if (!response || !response.selected) return;
    response.submitted = true;
    renderQuestion();
  }

  function goNext() {
    if (currentIndex >= attempt.length - 1) {
      finishAttempt();
      return;
    }
    currentIndex += 1;
    renderQuestion();
  }

  function goPrevious() {
    if (currentIndex === 0) return;
    currentIndex -= 1;
    renderQuestion();
  }

  function finishAttempt() {
    window.clearInterval(timerId);
    attemptActive = false;
    const score = attempt.reduce((sum, question, index) => {
      return sum + (isCorrectResponse(question, responses[index]) ? 1 : 0);
    }, 0);
    const answered = responses.filter((response) => response.selected).length;
    const used = DURATION_SECONDS - Math.max(0, remainingSeconds);
    const history = recordAttempt(score, answered, used);

    els.quizView.hidden = true;
    els.resultView.hidden = false;
    els.actionbar.hidden = true;
    els.restartTopButton.hidden = false;
    els.questionCounter.textContent = `${attempt.length}/${attempt.length}`;
    renderResultSummary(score, attempt.length, answered, used, history);
    renderMistakeHistory(history);
    els.reviewList.replaceChildren(...attempt.map((question, index) => createReviewItem(question, responses[index], index)));
  }

  function renderResultSummary(score, total, answered, used, history) {
    const percent = total ? Math.round((score / total) * 100) : 0;
    const wrong = total - score;
    const level = getScoreLevel(percent);

    els.scoreNumber.textContent = `${score}/${total}`;
    els.scoreBadge.textContent = `${level.label} • ${percent}%`;
    els.scoreCaption.textContent = `${answered} câu đã chọn • ${formatDuration(used)}`;
    els.scoreMessage.textContent = level.message;
    els.resultStats.replaceChildren(
      createStatCard('Đúng', `${score} câu`),
      createStatCard('Sai / bỏ trống', `${wrong} câu`),
      createStatCard('Lượt đã làm', `${history.attempts.length}`)
    );
  }

  function getScoreLevel(percent) {
    if (percent >= 90) {
      return {
        label: 'Xuất sắc',
        message: 'Bạn đang kiểm soát rất tốt Part 5. Giữ nhịp luyện tập này và tập trung vào vài câu sai còn lại.',
      };
    }
    if (percent >= 75) {
      return {
        label: 'Rất tốt',
        message: 'Nền tảng đã khá chắc. Chỉ cần rà lại các câu sai lặp lại là điểm sẽ tăng rất nhanh.',
      };
    }
    if (percent >= 55) {
      return {
        label: 'Đang tiến bộ',
        message: 'Bạn đã có đà rồi. Hãy ưu tiên ôn những câu xuất hiện trong mục hay mắc lỗi trước.',
      };
    }
    return {
      label: 'Cần củng cố',
      message: 'Chưa sao cả. Mỗi lần làm sai là thêm một dấu mốc để biết nên học phần nào tiếp theo.',
    };
  }

  function createStatCard(label, value) {
    const card = document.createElement('div');
    card.className = 'stat-card';

    const valueNode = document.createElement('strong');
    valueNode.textContent = value;

    const labelNode = document.createElement('span');
    labelNode.textContent = label;

    card.append(valueNode, labelNode);
    return card;
  }

  function createReviewItem(question, response, index) {
    const selected = response.selected || 'Chưa chọn';
    const correctLetter = getCorrectLetter(question);
    const correct = isCorrectResponse(question, response);
    const item = document.createElement('div');
    item.className = `review-item ${correct ? 'is-correct' : 'is-wrong'}`;

    const title = document.createElement('strong');
    title.textContent = `${index + 1}. Test ${question.test} • Câu ${question.sourceNumber}`;

    const detail = document.createElement('span');
    detail.textContent = `Bạn chọn: ${selected} • Đáp án: ${correctLetter}`;

    item.append(title, detail);
    return item;
  }

  function recordAttempt(score, answered, usedSeconds) {
    const history = readHistory();
    const now = new Date().toISOString();
    const wrongIds = [];

    attempt.forEach((question, index) => {
      const response = responses[index];
      const correct = isCorrectResponse(question, response);
      const id = getQuestionId(question);
      const selectedOption = getSelectedOption(question, response);
      const correctOption = getCorrectOption(question);

      const existing = history.questions[id] || {};
      const next = {
        id,
        test: question.test,
        sourceNumber: question.sourceNumber,
        question: question.question,
        seen: Number(existing.seen || 0) + 1,
        correct: Number(existing.correct || 0) + (correct ? 1 : 0),
        wrong: Number(existing.wrong || 0) + (correct ? 0 : 1),
        lastAt: now,
        lastSelected: selectedOption?.text || 'Chưa chọn',
        lastSelectedLetter: response?.selected || '',
        correctAnswer: correctOption?.text || '',
        correctLetter: getCorrectLetter(question),
      };

      if (!correct) {
        next.lastWrongAt = now;
        wrongIds.push(id);
      } else {
        next.lastWrongAt = existing.lastWrongAt || '';
      }

      history.questions[id] = next;
    });

    history.attempts.unshift({
      id: now,
      at: now,
      set: selectedSet,
      score,
      total: attempt.length,
      answered,
      usedSeconds,
      wrongIds,
    });
    history.attempts = history.attempts.slice(0, 50);
    saveHistory(history);
    return history;
  }

  function renderMistakeHistory(history) {
    const weakItems = getWeakQuestions(history, 5);
    els.mistakePanel.hidden = weakItems.length === 0;
    els.mistakeList.replaceChildren(...weakItems.map(createWeakItem));
  }

  function renderStartHistory() {
    const history = readHistory();
    const attempts = history.attempts || [];
    if (!attempts.length) {
      els.startHistory.hidden = true;
      els.startWeakList.replaceChildren();
      return;
    }

    const latest = attempts[0];
    const average = Math.round(
      attempts.reduce((sum, attemptItem) => sum + (attemptItem.score / Math.max(1, attemptItem.total)) * 100, 0) / attempts.length
    );

    els.startHistory.hidden = false;
    els.startHistorySummary.textContent = `${attempts.length} lượt • gần nhất ${latest.score}/${latest.total} • TB ${average}%`;
    els.startWeakList.replaceChildren(...getWeakQuestions(history, 3).map(createWeakItem));
  }

  function createWeakItem(item) {
    const card = document.createElement('div');
    card.className = 'weak-item';

    const title = document.createElement('strong');
    title.textContent = `Test ${item.test} • Câu ${item.sourceNumber}`;

    const count = document.createElement('span');
    count.className = 'weak-count';
    count.textContent = `Sai ${item.wrong} lần`;

    const question = document.createElement('p');
    question.textContent = item.question;

    const detail = document.createElement('small');
    detail.textContent = `Gần nhất chọn: ${item.lastSelected || 'Chưa chọn'} • Đáp án: ${item.correctAnswer || item.correctLetter}`;

    card.append(title, count, question, detail);
    return card;
  }

  function getWeakQuestions(history, limit) {
    return Object.values(history.questions || {})
      .filter((item) => Number(item.wrong || 0) > 0)
      .sort((a, b) => {
        const wrongDiff = Number(b.wrong || 0) - Number(a.wrong || 0);
        if (wrongDiff) return wrongDiff;
        const rateA = Number(a.wrong || 0) / Math.max(1, Number(a.seen || 1));
        const rateB = Number(b.wrong || 0) / Math.max(1, Number(b.seen || 1));
        if (rateB !== rateA) return rateB - rateA;
        return String(b.lastWrongAt || '').localeCompare(String(a.lastWrongAt || ''));
      })
      .slice(0, limit);
  }

  function readHistory() {
    try {
      const raw = window.localStorage.getItem(HISTORY_KEY);
      if (!raw) return createEmptyHistory();
      const parsed = JSON.parse(raw);
      return {
        version: 1,
        attempts: Array.isArray(parsed.attempts) ? parsed.attempts : [],
        questions: parsed.questions && typeof parsed.questions === 'object' ? parsed.questions : {},
      };
    } catch (error) {
      return createEmptyHistory();
    }
  }

  function saveHistory(history) {
    try {
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      // Lịch sử là tính năng phụ; nếu trình duyệt chặn lưu trữ thì bài quiz vẫn chạy bình thường.
    }
  }

  function createEmptyHistory() {
    return { version: 1, attempts: [], questions: {} };
  }

  function formatDuration(totalSeconds) {
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${minutes}:${seconds}`;
  }

  function getCorrectLetter(question) {
    return question.options.find((option) => option.isCorrect)?.letter || question.answer;
  }

  function getCorrectOption(question) {
    return question.options.find((option) => option.isCorrect);
  }

  function getSelectedOption(question, response) {
    if (!response?.selected) return null;
    return question.options.find((option) => option.letter === response.selected) || null;
  }

  function getQuestionId(question) {
    return question.id || `T${question.test}-${question.sourceNumber}`;
  }

  function isCorrectResponse(question, response) {
    if (!response?.selected) return false;
    const selectedOption = question.options.find((option) => option.letter === response.selected);
    return Boolean(selectedOption?.isCorrect);
  }

  function renderEmptyState() {
    els.questionCounter.textContent = '0/0';
    els.questionSource.textContent = '';
    els.questionText.textContent = 'Không tìm thấy dữ liệu câu hỏi.';
    els.optionsList.replaceChildren();
    els.feedbackLine.textContent = '';
    els.submitButton.disabled = true;
    els.prevButton.disabled = true;
  }

  function updateSetPicker() {
    for (const button of els.setPicker.querySelectorAll('.set-option')) {
      const active = button.dataset.set === selectedSet;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-checked', active ? 'true' : 'false');
    }
  }

  function openConfirm() {
    els.confirmOverlay.hidden = false;
    els.cancelLeaveButton.focus();
  }

  function closeConfirm() {
    els.confirmOverlay.hidden = true;
  }

  function handleBackToStart() {
    if (!els.quizView.hidden) {
      openConfirm();
      return;
    }
    showStart();
  }

  els.setPicker.addEventListener('click', (event) => {
    const button = event.target.closest('.set-option');
    if (!button) return;
    selectedSet = button.dataset.set;
    updateSetPicker();
  });

  els.startButton.addEventListener('click', startAttempt);
  els.submitButton.addEventListener('click', submitCurrent);
  els.nextButton.addEventListener('click', goNext);
  els.prevButton.addEventListener('click', goPrevious);
  els.restartTopButton.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    handleBackToStart();
  });
  els.restartResultButton.addEventListener('click', showStart);
  els.cancelLeaveButton.addEventListener('click', closeConfirm);
  els.confirmLeaveButton.addEventListener('click', showStart);
  els.confirmOverlay.addEventListener('click', (event) => {
    if (event.target === els.confirmOverlay) closeConfirm();
  });
  window.addEventListener('beforeunload', (event) => {
    if (!attemptActive) return;
    event.preventDefault();
    event.returnValue = '';
  });

  document.addEventListener('keydown', (event) => {
    if (els.resultView.hidden === false) return;
    if (!els.confirmOverlay.hidden) {
      if (event.key === 'Escape') closeConfirm();
      return;
    }
    const optionIndex = Number(event.key) - 1;
    if (optionIndex >= 0 && optionIndex < 4) {
      const question = attempt[currentIndex];
      const response = responses[currentIndex];
      if (question && response && !response.submitted) {
        response.selected = question.options[optionIndex]?.letter || null;
        renderQuestion();
      }
    }
    if (event.key === 'Enter') {
      const response = responses[currentIndex];
      if (response?.submitted) goNext();
      else submitCurrent();
    }
  });

  updateSetPicker();
  showStart();
})();
