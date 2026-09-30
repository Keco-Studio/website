import assert from "node:assert/strict";
import test from "node:test";

const pages = ["index.html", "game-designers.html", "pricing.html"];

for (const page of pages) {
  test(`${page} allows the system color scheme to control native UI`, async () => {
    const response = await fetch(`http://127.0.0.1:8000/${page}`);
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.doesNotMatch(html, /color-scheme\s*:\s*light\b/i);
    assert.match(html, /class="icon-btn theme-btn"/);
    assert.match(html, /href="styles\.css\?v=theme-time-3"/);
    assert.match(html, /src="site\.js\?v=theme-time-3"/);
  });
}
