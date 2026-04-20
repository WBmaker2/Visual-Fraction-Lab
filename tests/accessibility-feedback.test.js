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

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  getAttribute(name) {
    return this.attributes.get(name) || null;
  }

  closest() {
    return new FakeElement();
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
  };
  const answerButtons = ["A", "B", "E"].map((answer) => new FakeElement({ dataset: { answer } }));
  const shapeOptions = [
    new FakeElement({ value: "circle", checked: true }),
    new FakeElement({ value: "bar", checked: false }),
  ];
  const document = {
    getElementById(id) {
      return elements[id];
    },
    querySelectorAll(selector) {
      if (selector === ".quiz-buttons button") return answerButtons;
      if (selector === 'input[name="shape"]') return shapeOptions;
      return [];
    },
  };
  const source = fs.readFileSync(path.join(__dirname, "..", "script.js"), "utf8");
  vm.runInNewContext(source, { document }, { filename: "script.js" });

  return { answerButtons, elements, shapeOptions };
}

test("answer buttons expose the selected state to assistive technology", () => {
  const { answerButtons } = createHarness();

  answerButtons[1].dispatchEvent("click");

  assert.equal(answerButtons[0].getAttribute("aria-pressed"), "false");
  assert.equal(answerButtons[1].getAttribute("aria-pressed"), "true");
  assert.equal(answerButtons[2].getAttribute("aria-pressed"), "false");
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

test("answer feedback explains the comparison with cross multiplication", () => {
  const { answerButtons, elements } = createHarness();

  answerButtons[0].dispatchEvent("click");
  elements.checkBtn.dispatchEvent("click");

  assert.match(elements.quizResult.textContent, /3\s*×\s*6\s*=\s*18/);
  assert.match(elements.quizResult.textContent, /2\s*×\s*4\s*=\s*8/);
  assert.match(elements.quizResult.textContent, /분수 A/);
});
