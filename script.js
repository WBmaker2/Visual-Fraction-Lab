const state = {
  defaults: {
    a: { num: 3, den: 4 },
    b: { num: 2, den: 6 },
    shape: "circle",
  },
  a: { num: 3, den: 4 },
  b: { num: 2, den: 6 },
  shape: "circle",
  unitMode: false,
  selectedAnswer: null,
  quiz: {
    active: false,
    difficulty: "normal",
    questions: [],
    currentIndex: 0,
    score: 0,
    checkedCurrent: false,
  },
};

const els = {
  aDen: document.getElementById("aDen"),
  aNum: document.getElementById("aNum"),
  bDen: document.getElementById("bDen"),
  bNum: document.getElementById("bNum"),
  aDenValue: document.getElementById("aDenValue"),
  aNumValue: document.getElementById("aNumValue"),
  bDenValue: document.getElementById("bDenValue"),
  bNumValue: document.getElementById("bNumValue"),
  formulaA: document.getElementById("formulaA"),
  formulaB: document.getElementById("formulaB"),
  canvasA: document.getElementById("canvasA"),
  canvasB: document.getElementById("canvasB"),
  mergeText: document.getElementById("mergeText"),
  checkBtn: document.getElementById("checkBtn"),
  startQuizBtn: document.getElementById("startQuizBtn"),
  nextBtn: document.getElementById("nextBtn"),
  stopQuizBtn: document.getElementById("stopQuizBtn"),
  difficulty: document.getElementById("difficulty"),
  quizProgress: document.getElementById("quizProgress"),
  quizResult: document.getElementById("quizResult"),
  unitMode: document.getElementById("unitMode"),
  quizAnswerButtons: Array.from(document.querySelectorAll(".quiz-buttons button")),
  shapeOptions: Array.from(document.querySelectorAll('input[name="shape"]')),
};

function syncSliders(group) {
  const denInput = group === "a" ? els.aDen : els.bDen;
  const numInput = group === "a" ? els.aNum : els.bNum;
  const den = Number(denInput.value);
  numInput.max = String(den);

  if (Number(numInput.value) > den) {
    numInput.value = String(den);
  }
}

function readState() {
  syncSliders("a");
  syncSliders("b");
  state.a.den = Number(els.aDen.value);
  state.b.den = Number(els.bDen.value);
  if (state.unitMode) {
    els.aNum.value = "1";
    els.bNum.value = "1";
  }
  state.a.num = Number(els.aNum.value);
  state.b.num = Number(els.bNum.value);
}

function updateLabels() {
  els.aDenValue.textContent = String(state.a.den);
  els.aNumValue.textContent = String(state.a.num);
  els.bDenValue.textContent = String(state.b.den);
  els.bNumValue.textContent = String(state.b.num);
  els.formulaA.textContent = `${state.a.num}/${state.a.den}`;
  els.formulaB.textContent = `${state.b.num}/${state.b.den}`;
}

function drawCircle(ctx, num, den, color) {
  const cx = 130;
  const cy = 110;
  const r = 82;
  ctx.clearRect(0, 0, 260, 220);

  for (let i = 0; i < den; i += 1) {
    const start = -Math.PI / 2 + (i / den) * Math.PI * 2;
    const end = -Math.PI / 2 + ((i + 1) / den) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, end);
    ctx.closePath();
    ctx.fillStyle = i < num ? color : "#f3f6f9";
    ctx.fill();
    ctx.strokeStyle = "#2f3e46";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function drawBar(ctx, num, den, color) {
  ctx.clearRect(0, 0, 260, 220);
  const x = 20;
  const y = 80;
  const w = 220;
  const h = 60;
  const segment = w / den;

  for (let i = 0; i < den; i += 1) {
    ctx.beginPath();
    ctx.rect(x + i * segment, y, segment, h);
    ctx.fillStyle = i < num ? color : "#f3f6f9";
    ctx.fill();
    ctx.strokeStyle = "#2f3e46";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function drawFraction(canvas, fraction, color) {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }
  if (state.shape === "circle") {
    drawCircle(ctx, fraction.num, fraction.den, color);
  } else {
    drawBar(ctx, fraction.num, fraction.den, color);
  }
}

function simplify(num, den) {
  let a = num;
  let b = den;
  while (b !== 0) {
    const t = b;
    b = a % b;
    a = t;
  }
  return { num: num / a, den: den / a };
}

function updateMergeHint() {
  const remain = state.a.den - state.a.num;
  const reduced = simplify(remain, state.a.den);
  if (remain === 0) {
    els.mergeText.innerHTML = "분수 A는 이미 <strong>1(전체)</strong>예요! 아주 잘했어요.";
    return;
  }
  els.mergeText.innerHTML = `분수 A와 더해 1이 되려면 <strong>${reduced.num}/${reduced.den}</strong> 조각이 더 필요해요.`;
}

function compareFractions(x, y) {
  const left = x.num * y.den;
  const right = y.num * x.den;
  if (left > right) return "A";
  if (left < right) return "B";
  return "E";
}

function resetQuizMessage() {
  els.quizResult.textContent = "";
  els.quizResult.className = "result-text";
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeRandomFraction(minDen, maxDen) {
  const den = randomInt(minDen, maxDen);
  const num = randomInt(1, den);
  return { num, den };
}

function simplifyPair(fraction) {
  return simplify(fraction.num, fraction.den);
}

function makeEquivalentFraction(fraction, maxDen) {
  const maxFactor = Math.floor(maxDen / fraction.den);
  if (maxFactor < 2) {
    return { num: fraction.num, den: fraction.den };
  }
  const factor = randomInt(2, maxFactor);
  return { num: fraction.num * factor, den: fraction.den * factor };
}

function generateQuestion(difficulty) {
  const config =
    difficulty === "easy"
      ? { minDen: 2, maxDen: 6, sameDenChance: 0.65, equalChance: 0.1 }
      : difficulty === "hard"
        ? { minDen: 4, maxDen: 12, sameDenChance: 0.2, equalChance: 0.15 }
        : { minDen: 2, maxDen: 9, sameDenChance: 0.35, equalChance: 0.2 };

  for (let attempt = 0; attempt < 100; attempt += 1) {
    const a = makeRandomFraction(config.minDen, config.maxDen);
    let b = makeRandomFraction(config.minDen, config.maxDen);

    if (Math.random() < config.sameDenChance) {
      b.den = a.den;
      b.num = randomInt(1, b.den);
    }

    if (Math.random() < config.equalChance) {
      b = makeEquivalentFraction(a, config.maxDen);
    }

    if (difficulty === "hard" && Math.random() < 0.5) {
      const closeDen = Math.min(config.maxDen, Math.max(config.minDen, a.den + randomInt(-2, 2)));
      b.den = closeDen;
      b.num = randomInt(1, closeDen);
    }

    const aSimple = simplifyPair(a);
    const bSimple = simplifyPair(b);
    const equivalent = aSimple.num === bSimple.num && aSimple.den === bSimple.den;

    if (difficulty === "easy" && !equivalent && Math.abs(a.num - b.num) <= 1 && a.den === b.den) {
      continue;
    }

    return { a, b };
  }

  return { a: { num: 1, den: 2 }, b: { num: 1, den: 3 } };
}

function generateQuizSet(difficulty, count) {
  const set = [];
  for (let i = 0; i < count; i += 1) {
    set.push(generateQuestion(difficulty));
  }
  return set;
}

function setControlsLocked(locked) {
  els.aDen.disabled = locked;
  els.aNum.disabled = locked || state.unitMode;
  els.bDen.disabled = locked;
  els.bNum.disabled = locked || state.unitMode;
  els.unitMode.disabled = locked;

  [els.aDen, els.aNum, els.bDen, els.bNum, els.unitMode].forEach((input) => {
    const block = input.closest(".control-block");
    if (!block) return;
    block.classList.toggle("locked", locked);
  });
}

function clearSelectedAnswer() {
  state.selectedAnswer = null;
  els.quizAnswerButtons.forEach((x) => x.classList.remove("primary"));
}

function applyQuestion(question) {
  els.aDen.value = String(question.a.den);
  els.aNum.value = String(question.a.num);
  els.bDen.value = String(question.b.den);
  els.bNum.value = String(question.b.num);
  render();
}

function updateQuizProgressText() {
  if (!state.quiz.active) {
    return;
  }
  const current = state.quiz.currentIndex + 1;
  const total = state.quiz.questions.length;
  els.quizProgress.textContent = `${current}/${total}문제 | 현재 점수: ${state.quiz.score}점`;
}

function startQuiz() {
  state.quiz.difficulty = els.difficulty.value;
  state.quiz.questions = generateQuizSet(state.quiz.difficulty, 10);
  state.quiz.currentIndex = 0;
  state.quiz.score = 0;
  state.quiz.active = true;
  state.quiz.checkedCurrent = false;

  state.unitMode = false;
  els.unitMode.checked = false;
  clearSelectedAnswer();
  resetQuizMessage();
  setControlsLocked(true);
  applyQuestion(state.quiz.questions[0]);
  updateQuizProgressText();
  els.startQuizBtn.textContent = "랜덤 10문제 다시 시작";
  els.nextBtn.disabled = true;
  els.checkBtn.disabled = false;
}

function finishQuiz() {
  state.quiz.active = false;
  state.quiz.checkedCurrent = false;
  setControlsLocked(false);
  clearSelectedAnswer();
  els.nextBtn.disabled = true;
  els.quizProgress.textContent = `완료! 총점: ${state.quiz.score}/10점`;
  els.quizResult.textContent = "10문제가 끝났어요. 난이도를 바꿔 다시 도전해 보세요.";
  els.quizResult.className = "result-text ok";
}

function resetToHome() {
  state.quiz.active = false;
  state.quiz.checkedCurrent = false;
  state.quiz.questions = [];
  state.quiz.currentIndex = 0;
  state.quiz.score = 0;
  state.selectedAnswer = null;
  state.unitMode = false;
  state.shape = state.defaults.shape;

  els.aDen.value = String(state.defaults.a.den);
  els.aNum.value = String(state.defaults.a.num);
  els.bDen.value = String(state.defaults.b.den);
  els.bNum.value = String(state.defaults.b.num);
  els.unitMode.checked = false;
  els.shapeOptions.forEach((opt) => {
    opt.checked = opt.value === state.defaults.shape;
  });

  setControlsLocked(false);
  clearSelectedAnswer();
  resetQuizMessage();
  els.startQuizBtn.textContent = "랜덤 10문제 시작";
  els.quizProgress.textContent = "대기 중: 시작 버튼을 눌러 주세요.";
  els.nextBtn.disabled = true;
  els.checkBtn.disabled = false;
  render();
}

function goNextQuestion() {
  if (!state.quiz.active) {
    return;
  }
  if (!state.quiz.checkedCurrent) {
    els.quizResult.textContent = "정답 확인 후 다음 문제로 넘어갈 수 있어요.";
    els.quizResult.className = "result-text bad";
    return;
  }

  if (state.quiz.currentIndex >= state.quiz.questions.length - 1) {
    finishQuiz();
    return;
  }

  state.quiz.currentIndex += 1;
  state.quiz.checkedCurrent = false;
  clearSelectedAnswer();
  resetQuizMessage();
  applyQuestion(state.quiz.questions[state.quiz.currentIndex]);
  updateQuizProgressText();
  els.nextBtn.disabled = true;
}

function render() {
  readState();
  updateLabels();
  drawFraction(els.canvasA, state.a, "#ff7b89");
  drawFraction(els.canvasB, state.b, "#5ec2f7");
  updateMergeHint();
}

function bindEvents() {
  [els.aDen, els.aNum, els.bDen, els.bNum].forEach((input) => {
    input.addEventListener("input", () => {
      resetQuizMessage();
      render();
    });
  });

  els.shapeOptions.forEach((option) => {
    option.addEventListener("change", () => {
      state.shape = option.value;
      render();
    });
  });

  els.unitMode.addEventListener("change", () => {
    state.unitMode = els.unitMode.checked;
    els.aNum.disabled = state.unitMode;
    els.bNum.disabled = state.unitMode;
    if (state.unitMode) {
      els.aNum.value = "1";
      els.bNum.value = "1";
    }
    resetQuizMessage();
    render();
  });

  els.startQuizBtn.addEventListener("click", () => {
    startQuiz();
  });

  els.nextBtn.addEventListener("click", () => {
    goNextQuestion();
  });

  els.stopQuizBtn.addEventListener("click", () => {
    resetToHome();
  });

  els.quizAnswerButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      state.selectedAnswer = btn.dataset.answer;
      els.quizAnswerButtons.forEach((x) => x.classList.remove("primary"));
      btn.classList.add("primary");
    });
  });

  els.checkBtn.addEventListener("click", () => {
    if (!state.selectedAnswer) {
      els.quizResult.textContent = "먼저 답을 골라 주세요!";
      els.quizResult.className = "result-text bad";
      return;
    }

    if (state.quiz.active) {
      if (state.quiz.checkedCurrent) {
        els.quizResult.textContent = "이미 확인한 문제예요. 다음 문제로 넘어가세요.";
        els.quizResult.className = "result-text bad";
        return;
      }

      readState();
      const correct = compareFractions(state.a, state.b);
      if (state.selectedAnswer === correct) {
        state.quiz.score += 1;
        els.quizResult.textContent = "정답! 아주 잘했어요.";
        els.quizResult.className = "result-text ok";
      } else {
        const answerLabel = correct === "A" ? "분수 A" : correct === "B" ? "분수 B" : "같다";
        els.quizResult.textContent = `아쉬워요. 정답은 "${answerLabel}"예요.`;
        els.quizResult.className = "result-text bad";
      }
      state.quiz.checkedCurrent = true;
      updateQuizProgressText();
      els.nextBtn.disabled = false;
      return;
    }

    const correct = compareFractions(state.a, state.b);
    if (state.selectedAnswer === correct) {
      els.quizResult.textContent = "정답! 분수의 크기를 정확히 비교했어요.";
      els.quizResult.className = "result-text ok";
    } else {
      const answerLabel = correct === "A" ? "분수 A" : correct === "B" ? "분수 B" : "같다";
      els.quizResult.textContent = `아쉬워요. 정답은 "${answerLabel}"예요.`;
      els.quizResult.className = "result-text bad";
    }
  });
}

bindEvents();
els.nextBtn.disabled = true;
render();
