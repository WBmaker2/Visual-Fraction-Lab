const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

class FakeClassList {
  constructor() {
    this.values = new Set();
  }

  add(value) {
    this.values.add(value);
  }

  remove(value) {
    this.values.delete(value);
  }

  toggle(value, force) {
    if (force) {
      this.add(value);
      return true;
    }
    this.remove(value);
    return false;
  }
}

class FakeElement {
  constructor({ id = "", value = "", checked = false, dataset = {} } = {}) {
    this.id = id;
    this.value = value;
    this.checked = checked;
    this.dataset = dataset;
    this.attributes = new Map();
    this.classList = new FakeClassList();
    this.listeners = new Map();
    this.textContent = "";
    this.className = "";
    this.disabled = false;
    this.max = "";
    this.ownerDocument = null;
  }

  addEventListener(type, handler) {
    const handlers = this.listeners.get(type) || [];
    handlers.push(handler);
    this.listeners.set(type, handlers);
  }

  dispatchEvent(type) {
    const handlers = this.listeners.get(type) || [];
    handlers.forEach((handler) => handler({ target: this }));
  }

  dispatchKeyboardEvent(key) {
    const handlers = this.listeners.get("keydown") || [];
    const event = {
      key,
      target: this,
      preventDefault() {
        this.defaultPrevented = true;
      },
      defaultPrevented: false,
    };
    handlers.forEach((handler) => handler(event));
    return event;
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  getAttribute(name) {
    return this.attributes.get(name) || null;
  }

  closest() {
    return new FakeElement();
  }

  focus() {
    if (this.ownerDocument) {
      this.ownerDocument.activeElement = this;
    }
  }

  getContext() {
    return {
      clearRect() {},
      beginPath() {},
      moveTo() {},
      arc() {},
      closePath() {},
      fill() {},
      stroke() {},
      rect() {},
    };
  }
}

function createHarness() {
  const elements = {
    aDen: new FakeElement({ id: "aDen", value: "4" }),
    aNum: new FakeElement({ id: "aNum", value: "3" }),
    bDen: new FakeElement({ id: "bDen", value: "6" }),
    bNum: new FakeElement({ id: "bNum", value: "2" }),
    aDenValue: new FakeElement({ id: "aDenValue" }),
    aNumValue: new FakeElement({ id: "aNumValue" }),
    bDenValue: new FakeElement({ id: "bDenValue" }),
    bNumValue: new FakeElement({ id: "bNumValue" }),
    formulaA: new FakeElement({ id: "formulaA" }),
    formulaB: new FakeElement({ id: "formulaB" }),
    canvasA: new FakeElement({ id: "canvasA" }),
    canvasB: new FakeElement({ id: "canvasB" }),
    mergeText: new FakeElement({ id: "mergeText" }),
    checkBtn: new FakeElement({ id: "checkBtn" }),
    startQuizBtn: new FakeElement({ id: "startQuizBtn" }),
    nextBtn: new FakeElement({ id: "nextBtn" }),
    stopQuizBtn: new FakeElement({ id: "stopQuizBtn" }),
    difficulty: new FakeElement({ id: "difficulty", value: "normal" }),
    quizProgress: new FakeElement({ id: "quizProgress" }),
    quizResult: new FakeElement({ id: "quizResult" }),
    unitMode: new FakeElement({ id: "unitMode" }),
    comparisonSummary: new FakeElement({ id: "comparisonSummary" }),
    modelTextA: new FakeElement({ id: "modelTextA" }),
    modelTextB: new FakeElement({ id: "modelTextB" }),
  };
  const answerButtons = ["A", "B", "E"].map((answer) => new FakeElement({ dataset: { answer } }));
  const shapeOptions = [
    new FakeElement({ value: "circle", checked: true }),
    new FakeElement({ value: "bar", checked: false }),
  ];
  const document = {
    activeElement: null,
    getElementById(id) {
      return elements[id];
    },
    querySelectorAll(selector) {
      if (selector === ".quiz-buttons button") return answerButtons;
      if (selector === 'input[name="shape"]') return shapeOptions;
      return [];
    },
  };
  [...Object.values(elements), ...answerButtons, ...shapeOptions].forEach((element) => {
    element.ownerDocument = document;
  });
  const source = fs.readFileSync(path.join(__dirname, "..", "script.js"), "utf8");
  vm.runInNewContext(source, { document }, { filename: "script.js" });

  return { answerButtons, elements, shapeOptions };
}

test("answer buttons use radio semantics and expose the selected state", () => {
  const { answerButtons } = createHarness();

  answerButtons[1].dispatchEvent("click");

  assert.equal(answerButtons[0].getAttribute("role"), "radio");
  assert.equal(answerButtons[1].getAttribute("role"), "radio");
  assert.equal(answerButtons[2].getAttribute("role"), "radio");
  assert.equal(answerButtons[0].getAttribute("aria-checked"), "false");
  assert.equal(answerButtons[1].getAttribute("aria-checked"), "true");
  assert.equal(answerButtons[2].getAttribute("aria-checked"), "false");
  assert.equal(answerButtons[0].getAttribute("tabindex"), "-1");
  assert.equal(answerButtons[1].getAttribute("tabindex"), "0");
  assert.equal(answerButtons[2].getAttribute("tabindex"), "-1");
});

test("answer radio buttons support arrow-key navigation", () => {
  const { answerButtons } = createHarness();

  answerButtons[0].dispatchKeyboardEvent("ArrowDown");

  assert.equal(answerButtons[1].getAttribute("aria-checked"), "true");
  assert.equal(answerButtons[1].getAttribute("tabindex"), "0");
  assert.equal(answerButtons[1].ownerDocument.activeElement, answerButtons[1]);
});

test("canvas labels describe the current fraction and visual model", () => {
  const { elements } = createHarness();

  assert.match(elements.canvasA.getAttribute("aria-label") || "", /분수 A/);
  assert.match(elements.canvasA.getAttribute("aria-label") || "", /3\/4/);
  assert.match(elements.canvasA.getAttribute("aria-label") || "", /원형/);

  elements.aNum.value = "1";
  elements.aNum.dispatchEvent("input");

  assert.match(elements.canvasA.getAttribute("aria-label") || "", /1\/4/);
});

test("answer feedback explains unlike denominators with equivalent pieces", () => {
  const { answerButtons, elements } = createHarness();

  answerButtons[0].dispatchEvent("click");
  elements.checkBtn.dispatchEvent("click");

  assert.match(elements.quizResult.textContent, /같은 크기 조각/);
  assert.match(elements.quizResult.textContent, /12개/);
  assert.match(elements.quizResult.textContent, /분수 A는 9조각/);
  assert.match(elements.quizResult.textContent, /분수 B는 4조각/);
  assert.match(elements.quizResult.textContent, /분수 A가 더 커요/);
  assert.doesNotMatch(elements.quizResult.textContent, /×/);
  assert.doesNotMatch(elements.quizResult.textContent, /확인:/);
});

test("same-denominator feedback uses piece-count reasoning without calculations", () => {
  const { answerButtons, elements } = createHarness();

  elements.bDen.value = "4";
  elements.bNum.value = "2";
  elements.bNum.dispatchEvent("input");
  answerButtons[0].dispatchEvent("click");
  elements.checkBtn.dispatchEvent("click");

  assert.match(elements.quizResult.textContent, /같은 크기의 조각 4개/);
  assert.match(elements.quizResult.textContent, /3조각/);
  assert.match(elements.quizResult.textContent, /2조각/);
  assert.doesNotMatch(elements.quizResult.textContent, /×/);
  assert.doesNotMatch(elements.quizResult.textContent, /확인:/);
});

test("unit-fraction feedback explains that smaller denominators make larger pieces", () => {
  const { answerButtons, elements } = createHarness();

  elements.unitMode.checked = true;
  elements.unitMode.dispatchEvent("change");
  elements.aDen.value = "4";
  elements.bDen.value = "6";
  elements.aDen.dispatchEvent("input");
  answerButtons[0].dispatchEvent("click");
  elements.checkBtn.dispatchEvent("click");

  assert.match(elements.quizResult.textContent, /단위분수/);
  assert.match(elements.quizResult.textContent, /더 적게 나눌수록/);
  assert.match(elements.quizResult.textContent, /전체를 4조각/);
  assert.match(elements.quizResult.textContent, /전체를 6조각/);
  assert.doesNotMatch(elements.quizResult.textContent, /×/);
  assert.doesNotMatch(elements.quizResult.textContent, /확인:/);
});

test("equal unlike-denominator feedback compares the same number of pieces", () => {
  const { answerButtons, elements } = createHarness();

  elements.aNum.value = "1";
  elements.aDen.value = "2";
  elements.bNum.value = "2";
  elements.bDen.value = "4";
  elements.aNum.dispatchEvent("input");
  answerButtons[2].dispatchEvent("click");
  elements.checkBtn.dispatchEvent("click");

  assert.match(elements.quizResult.textContent, /같은 크기 조각/);
  assert.match(elements.quizResult.textContent, /4개/);
  assert.match(elements.quizResult.textContent, /분수 A도 2조각/);
  assert.match(elements.quizResult.textContent, /분수 B도 2조각/);
  assert.match(elements.quizResult.textContent, /두 분수는 같아요/);
  assert.doesNotMatch(elements.quizResult.textContent, /×/);
  assert.doesNotMatch(elements.quizResult.textContent, /확인:/);
});

test("manual slider changes clear the previous answer selection", () => {
  const { answerButtons, elements } = createHarness();

  answerButtons[0].dispatchEvent("click");
  elements.aNum.value = "2";
  elements.aNum.dispatchEvent("input");

  assert.equal(answerButtons[0].getAttribute("aria-checked"), "false");
  assert.equal(answerButtons[1].getAttribute("aria-checked"), "false");
  assert.equal(answerButtons[2].getAttribute("aria-checked"), "false");
});

test("model descriptions and comparison summary update with current values", () => {
  const { elements } = createHarness();

  assert.match(elements.modelTextA.textContent, /4조각 중 3조각/);
  assert.match(elements.modelTextB.textContent, /6조각 중 2조각/);
  assert.match(elements.comparisonSummary.textContent, /A 3\/4/);
  assert.match(elements.comparisonSummary.textContent, /B 2\/6/);

  elements.aNum.value = "1";
  elements.aNum.dispatchEvent("input");

  assert.match(elements.modelTextA.textContent, /4조각 중 1조각/);
  assert.match(elements.comparisonSummary.textContent, /A 1\/4/);
});

test("quiz flow enables next only after checking an answer", () => {
  const { answerButtons, elements } = createHarness();

  elements.startQuizBtn.dispatchEvent("click");

  const a = { num: Number(elements.aNum.value), den: Number(elements.aDen.value) };
  const b = { num: Number(elements.bNum.value), den: Number(elements.bDen.value) };
  const correct =
    a.num * b.den > b.num * a.den ? "A" : a.num * b.den < b.num * a.den ? "B" : "E";
  const answerButton = answerButtons.find((button) => button.dataset.answer === correct);

  assert.equal(elements.nextBtn.disabled, true);
  answerButton.dispatchEvent("click");
  elements.checkBtn.dispatchEvent("click");

  assert.equal(elements.nextBtn.disabled, false);
  assert.match(elements.quizProgress.textContent, /현재 점수/);
});
