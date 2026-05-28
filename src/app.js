(function () {
  const MODE_CONFIGS = {
    full150: {
      questionCount: 150,
      durationSeconds: 60 * 60,
      order: 'random',
    },
    test30: {
      questionCount: 30,
      durationSeconds: 12 * 60,
      order: 'random',
    },
    test1: {
      questionCount: 30,
      durationSeconds: 12 * 60,
      test: 1,
      order: 'sequential',
    },
    test2: {
      questionCount: 30,
      durationSeconds: 12 * 60,
      test: 2,
      order: 'sequential',
    },
    test3: {
      questionCount: 30,
      durationSeconds: 12 * 60,
      test: 3,
      order: 'sequential',
    },
    test4: {
      questionCount: 30,
      durationSeconds: 12 * 60,
      test: 4,
      order: 'sequential',
    },
    test5: {
      questionCount: 30,
      durationSeconds: 12 * 60,
      test: 5,
      order: 'sequential',
    },
  };
  const DEFAULT_MODE = 'test30';
  const HISTORY_KEY = 'toeicPart5QuizHistory:v1';
  const QUESTION_FIXES = {
    'T1-102': { options: { D: 'himself' } },
    'T1-106': { options: { D: 'having kept' } },
    'T1-108': {
      question: 'Donors to nonprofit organizations receive _____ tax benefits under the province\'s new tax policy.',
      options: { B: 'generous', C: 'enthusiastic' },
    },
    'T1-109': { options: { D: 'Until' } },
    'T1-110': { question: 'The Steppville Star Award honors citizens who have made _____ contributions to the community.' },
    'T1-111': {
      question: 'The Drayton supermarket chain claims that the _____ of its frozen foods is carried out via state-of-the-art refrigerated trucks.',
    },
    'T1-113': { answer: 'D', options: { D: 'profitable' } },
    'T1-114': {
      question: 'Market research shows that most people _____ Hardwood Gym\'s membership fee pricing very reasonable.',
    },
    'T1-115': {
      question: 'Regardless of _____ goods are being stored there at the moment, the warehouse must be secured at night.',
      options: { C: 'whether' },
    },
    'T1-117': { options: { A: 'potentially' } },
    'T1-119': {
      question: 'There is _____ more skilled at attracting positive media attention than our new head of public relations.',
      options: { B: 'anyone', D: 'no one' },
    },
    'T1-120': {
      question: '_____ the projector in the conference room broke down, the IT team was able to fix it before the meeting was scheduled to start.',
      options: { C: 'Although' },
    },
    'T1-121': {
      question: 'Ms. Cardenas is trying to improve her career _____ by earning additional qualifications.',
      options: { D: 'obstacles' },
    },
    'T1-122': { question: 'Many reviews of Silver Sword give special praise to its director for the thrilling action scene _____ the end of the film.' },
    'T1-123': {
      question: 'The interior decorator explained that measuring the lobby\'s dimensions _____ was an important part of her planning process.',
      answer: 'B',
    },
    'T1-124': {
      question: '_____ its limited collection of artworks, the Zielinski Museum consistently attracts remarkable numbers of visitors.',
      options: { D: 'Rather than' },
    },
    'T1-126': { question: 'The state environmental agency has made _____ progress in reducing air pollution.' },
    'T1-129': {
      question: 'No other salesperson at Jinkwang Laboratories can speak _____ about the advantages of its medical devices than Vincent Cobb.',
    },
    'T2-105': { answer: 'B', options: { B: 'at' } },
    'T2-106': { answer: 'B', options: { B: 'accessible' } },
    'T2-107': { question: 'Nia Aldridge has shown _____ for learning the skills needed to become a software engineer.' },
    'T2-109': { answer: 'A' },
    'T2-110': { question: 'The employee picnic celebrating the start of summer may need to be postponed if the rain _____.' },
    'T2-111': { question: 'Ever since the Dwyerton Building\'s construction, its architecture has been considered the most _____ in the city.' },
    'T2-112': {
      question: 'UBN Tours will offer daily walking tours of downtown Peralta _____ this week.',
      answer: 'C',
      options: { B: 'from' },
    },
    'T2-113': {
      question: 'The management team of Shelzan Pharmaceuticals has developed a _____ for expanding its operations into China within a few years.',
      answer: 'C',
    },
    'T2-115': { answer: 'C', options: { D: 'Although' } },
    'T2-116': {
      question: 'For the premiere of its new film, Lofton Studios\'s publicity team has been instructed to reserve the largest theater _____.',
      options: { D: 'available' },
    },
    'T2-118': { options: { C: 'Within' } },
    'T2-119': { question: 'Planning committee members were proud that the final cost of the project matched their initial estimate _____.', answer: 'D' },
    'T2-120': { answer: 'B' },
    'T2-122': { question: 'Clury Insurance made a _____ donation to charity on its tenth anniversary in business.' },
    'T2-124': { answer: 'A' },
    'T2-126': { answer: 'B' },
    'T2-129': { answer: 'C' },
    'T2-130': { question: 'Following Thursday\'s training, Ms. Adkins acknowledged the advantages of the new database software.' },
    'T3-104': { question: 'Prospective students are invited to learn more about the university\'s programs by viewing its _____ course schedule.', answer: 'A' },
    'T3-105': { question: 'At Hartway Terrace, all dishes are prepared under the _____ of master chef Yoo-Jeong Jin.', answer: 'D' },
    'T3-107': { options: { A: 'by' } },
    'T3-108': { options: { C: 'commended' } },
    'T3-109': { question: 'Residential furnaces and boilers should undergo inspection _____ for safety reasons.' },
    'T3-110': { question: 'To maintain client _____, the destruction of old files must be carried out carefully.' },
    'T3-111': { answer: 'A' },
    'T3-114': { question: 'Employees who are _____ for exceeding their output goals are more likely to maintain a high level of productivity.' },
    'T3-115': { answer: 'A' },
    'T3-116': { options: { A: 'yet', B: 'too', C: 'already' } },
    'T3-117': { options: { A: 'grows' } },
    'T3-118': { question: 'The opening of the community center was only possible through the public\'s _____ support.', answer: 'A' },
    'T3-121': { answer: 'D' },
    'T3-122': { question: 'The focus of the board members is _____ investors react to the news of the CEO\'s retirement.' },
    'T3-123': { question: 'The program coordinator asked staff to circulate the volunteer recruitment post _____ using their personal social media accounts.' },
    'T3-125': { options: { D: 'has constructed' } },
    'T3-126': { answer: 'B' },
    'T3-130': { answer: 'D' },
    'T4-101': { question: 'Each participant in the debate will have an _____ amount of speaking time.', options: { D: 'equal' } },
    'T4-102': { question: 'A recent study by Melbourne University researchers _____ that blue-light glasses may not actually prevent eye strain.', options: { D: 'suggestion' } },
    'T4-103': { options: { C: 'during' } },
    'T4-104': { question: 'Next summer, all guests at Ankville-area hotels _____ a booklet of coupons for local attractions.' },
    'T4-108': { question: 'Yowton City\'s plans to build a wind farm were canceled in _____ to opposition from residents.' },
    'T4-111': { question: 'Ms. Waggoner has directed the billing department to keep any _____ with clients regarding payment.' },
    'T4-112': { options: { C: 'inclusive' } },
    'T4-113': { options: { B: 'by' } },
    'T4-115': {
      question: 'In spite of the high temperatures outdoors on the day of our appointment, Ms. Delvay _____ inspected the exterior of the property.',
      answer: 'D',
      options: { A: 'considerably', D: 'thoroughly' },
    },
    'T4-117': {
      question: 'Demand for public transportation has grown _____ the capacity of the city\'s current infrastructure.',
      options: { B: 'up' },
    },
    'T4-118': { question: 'To arrange a special tour of the museum _____ our normal opening hours, please call 555-0149.', options: { B: 'while' } },
    'T4-122': { options: { D: 'availability' } },
    'T4-125': {
      question: 'The Gimdan Company supplies _____ industries, including packaging, automotive, and construction, with made-to-order plastics.',
      answer: 'A',
      options: { B: 'instant' },
    },
    'T4-128': { options: { D: 'else' } },
    'T4-130': { answer: 'A' },
    'T5-101': { options: { B: 'and' } },
    'T5-102': { question: 'Mr. Fletcher was transferred to another branch after _____ department was eliminated in the corporate restructuring.', options: { C: 'his' } },
    'T5-105': { answer: 'B' },
    'T5-106': { question: 'Problems with the air purifier may _____ either from incorrect storage or the use of the wrong filters.', answer: 'C' },
    'T5-108': { question: 'Ms. Burke will encourage the staff to donate canned goods _____ she did during the holidays last year.', answer: 'C' },
    'T5-109': { question: 'The pharmacy\'s medications and supplements must be _____ labeled.' },
    'T5-110': { question: 'Bayside Financial has expanded its customer base by an impressive ninety percent _____ the past five years.', options: { A: 'by' } },
    'T5-111': { question: 'You must assess all aspects of the properties before _____ which best suits your personal circumstances.' },
    'T5-112': { question: 'FT Supplies\' headquarters building was _____ used as a ceramics factory because the surrounding area is rich in clay deposits.' },
    'T5-118': { options: { B: 'prior to' } },
    'T5-119': { question: 'The café, _____ caters to vegan and vegetarian diners, has received positive reviews so far.', options: { D: 'it' } },
    'T5-124': { options: { D: 'withstand' } },
    'T5-125': { options: { C: 'quite' } },
    'T5-126': { answer: 'C', options: { C: 'attentive' } },
    'T5-127': { answer: 'A' },
  };
  const rawBank = Array.isArray(window.QUESTION_BANK) ? window.QUESTION_BANK : [];
  const bank = rawBank.map(applyQuestionFixes);

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
  let remainingSeconds = MODE_CONFIGS[DEFAULT_MODE].durationSeconds;
  let attemptDurationSeconds = MODE_CONFIGS[DEFAULT_MODE].durationSeconds;
  let timerId = null;
  let selectedSet = DEFAULT_MODE;
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

  function applyQuestionFixes(question) {
    const fix = QUESTION_FIXES[question.id];
    if (!fix) return question;

    return {
      ...question,
      question: fix.question || question.question,
      answer: fix.answer || question.answer,
      options: question.options.map((option) => ({
        ...option,
        text: fix.options?.[option.letter] || option.text,
      })),
    };
  }

  function getSelectedMode() {
    return MODE_CONFIGS[selectedSet] || MODE_CONFIGS[DEFAULT_MODE];
  }

  function getModePool(mode) {
    const pool = mode.test ? bank.filter((question) => question.test === mode.test) : bank;
    return pool.slice().sort((a, b) => a.test - b.test || a.sourceNumber - b.sourceNumber);
  }

  function getVisibleQuestionCount() {
    const mode = getSelectedMode();
    return Math.min(mode.questionCount, getModePool(mode).length);
  }

  function updateStartMetrics() {
    remainingSeconds = getSelectedMode().durationSeconds;
    attemptDurationSeconds = getSelectedMode().durationSeconds;
    els.questionCounter.textContent = `0/${getVisibleQuestionCount()}`;
    renderTimer();
  }

  function startAttempt() {
    const mode = getSelectedMode();
    const pool = getModePool(mode);
    const selectedQuestions = mode.order === 'sequential' ? pool : shuffled(pool);
    attemptDurationSeconds = mode.durationSeconds;
    attempt = selectedQuestions
      .slice(0, Math.min(mode.questionCount, pool.length))
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
    remainingSeconds = attemptDurationSeconds;
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
    updateStartMetrics();
    els.startView.hidden = false;
    els.quizView.hidden = true;
    els.resultView.hidden = true;
    els.actionbar.hidden = true;
    els.restartTopButton.hidden = true;
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
    const used = attemptDurationSeconds - Math.max(0, remainingSeconds);
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
    els.mistakePanel.hidden = false;
    els.mistakeList.replaceChildren(
      ...(weakItems.length ? weakItems.map(createWeakItem) : [createHistoryEmpty('Chưa có câu sai nào được ghi nhận trên trình duyệt này.')])
    );
  }

  function renderStartHistory() {
    const history = readHistory();
    const attempts = history.attempts || [];
    els.startHistory.hidden = false;

    if (!attempts.length) {
      els.startHistorySummary.textContent = 'Chưa có lượt làm nào';
      els.startWeakList.replaceChildren(createHistoryEmpty('Sau khi làm xong một đề, lịch sử và các câu hay sai sẽ hiện ở đây.'));
      return;
    }

    const latest = attempts[0];
    const average = Math.round(
      attempts.reduce((sum, attemptItem) => sum + (attemptItem.score / Math.max(1, attemptItem.total)) * 100, 0) / attempts.length
    );
    const weakItems = getWeakQuestions(history, 3);

    els.startHistorySummary.textContent = `${attempts.length} lượt • gần nhất ${latest.score}/${latest.total} • TB ${average}%`;
    els.startWeakList.replaceChildren(
      ...(weakItems.length ? weakItems.map(createWeakItem) : [createHistoryEmpty('Bạn chưa có câu sai lặp lại. Cứ tiếp tục luyện để hệ thống theo dõi chính xác hơn.')])
    );
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

  function createHistoryEmpty(message) {
    const empty = document.createElement('div');
    empty.className = 'history-empty';
    empty.textContent = message;
    return empty;
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
    updateStartMetrics();
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
