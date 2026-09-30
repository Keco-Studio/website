import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const source = await readFile(new URL("../site.js", import.meta.url), "utf8");

function bootTheme({ hour, storedTheme = null, storageUnavailable = false }) {
  const clock = { hour };
  const timers = [];
  const themeButton = {
    attributes: {},
    addEventListener(type, listener) { this.listener = listener; },
    click() { this.listener(); },
    getAttribute(name) { return this.attributes[name] ?? null; },
    setAttribute(name, value) { this.attributes[name] = String(value); }
  };
  const values = new Map(storedTheme ? [["keco-theme", storedTheme]] : []);
  const localStorage = storageUnavailable ? {
    getItem() { throw new Error("Storage access denied"); },
    removeItem() { throw new Error("Storage access denied"); },
    setItem() { throw new Error("Storage access denied"); }
  } : {
    getItem(key) { return values.get(key) ?? null; },
    removeItem(key) { values.delete(key); },
    setItem(key, value) { values.set(key, String(value)); }
  };
  const document = {
    documentElement: { dataset: {} },
    getElementById() { return null; },
    querySelector(selector) { return selector === ".theme-btn" ? themeButton : null; },
    querySelectorAll() { return []; }
  };

  class DateAtHour {
    getHours() { return clock.hour; }
    getMinutes() { return 0; }
    getSeconds() { return 0; }
    getMilliseconds() { return 0; }
  }
  const window = {
    clearTimeout() {},
    setTimeout(callback, delay) { timers.push({ callback, delay }); return timers.length; }
  };

  vm.runInNewContext(source, { Date: DateAtHour, document, localStorage, setTimeout: window.setTimeout, window });
  return { clock, document, localStorage, themeButton, timers };
}

test("theme control uses dark mode during scheduled night hours", () => {
  const runtime = bootTheme({ hour: 20 });

  assert.equal(runtime.document.documentElement.dataset.theme, "dark");
  assert.equal(runtime.document.documentElement.dataset.themeMode, "auto");
  assert.equal(runtime.themeButton.getAttribute("aria-label"), "Use light mode");
});

test("theme control applies an opposite manual theme then restores scheduled mode", () => {
  const runtime = bootTheme({ hour: 20 });

  runtime.themeButton.click();
  assert.equal(runtime.document.documentElement.dataset.theme, "light");
  assert.equal(runtime.document.documentElement.dataset.themeMode, "manual");
  assert.equal(runtime.localStorage.getItem("keco-theme"), "light");

  runtime.themeButton.click();
  assert.equal(runtime.document.documentElement.dataset.theme, "dark");
  assert.equal(runtime.document.documentElement.dataset.themeMode, "auto");
  assert.equal(runtime.localStorage.getItem("keco-theme"), null);
});

test("theme control restores a saved manual preference", () => {
  const runtime = bootTheme({ hour: 20, storedTheme: "light" });

  assert.equal(runtime.document.documentElement.dataset.theme, "light");
  assert.equal(runtime.document.documentElement.dataset.themeMode, "manual");
  assert.equal(runtime.themeButton.getAttribute("aria-label"), "Follow time-based theme");
});

test("theme control updates when the scheduled night boundary is reached", () => {
  const runtime = bootTheme({ hour: 17 });

  runtime.clock.hour = 18;
  runtime.timers[0].callback();
  assert.equal(runtime.document.documentElement.dataset.theme, "dark");
});

test("theme control remains usable when browser storage is unavailable", () => {
  let runtime;

  assert.doesNotThrow(() => {
    runtime = bootTheme({ hour: 20, storageUnavailable: true });
  });

  runtime.themeButton.click();
  assert.equal(runtime.document.documentElement.dataset.theme, "light");
});
