(function () {
  // Theme follows the local day/night schedule until the visitor makes an explicit choice.
  var themeButton = document.querySelector('.theme-btn');
  if (themeButton) {
    var themeRoot = document.documentElement;
    var themeKey = 'keco-theme';
    var themeTimer;

    function readSavedTheme() {
      try { return localStorage.getItem(themeKey); } catch (error) { return null; }
    }

    function saveTheme(theme) {
      try { localStorage.setItem(themeKey, theme); } catch (error) {}
    }

    function clearSavedTheme() {
      try { localStorage.removeItem(themeKey); } catch (error) {}
    }

    function updateThemeButton() {
      var isDark = themeRoot.dataset.theme === 'dark';
      var label = themeRoot.dataset.themeMode === 'manual' ? 'Follow time-based theme' : isDark ? 'Use light mode' : 'Use dark mode';
      themeButton.setAttribute('aria-label', label);
      themeButton.setAttribute('title', label);
      themeButton.setAttribute('aria-pressed', themeRoot.dataset.themeMode === 'manual' ? 'true' : 'false');
    }

    function scheduleTheme() {
      var now = new Date();
      var seconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
      var nextBoundary = now.getHours() < 6 ? 6 * 3600 : now.getHours() < 18 ? 18 * 3600 : 30 * 3600;
      window.clearTimeout(themeTimer);
      themeTimer = window.setTimeout(function () {
        if (themeRoot.dataset.themeMode === 'auto') applyAutomaticTheme();
      }, (nextBoundary - seconds) * 1000 - now.getMilliseconds());
    }

    function applyAutomaticTheme() {
      var hour = new Date().getHours();
      themeRoot.dataset.theme = hour >= 18 || hour < 6 ? 'dark' : 'light';
      themeRoot.dataset.themeMode = 'auto';
      updateThemeButton();
      scheduleTheme();
    }

    var savedTheme = readSavedTheme();
    if (savedTheme === 'light' || savedTheme === 'dark') {
      themeRoot.dataset.theme = savedTheme;
      themeRoot.dataset.themeMode = 'manual';
      updateThemeButton();
    } else {
      applyAutomaticTheme();
    }

    themeButton.addEventListener('click', function () {
      if (themeRoot.dataset.themeMode === 'manual') {
        clearSavedTheme();
        applyAutomaticTheme();
      } else {
        themeRoot.dataset.theme = themeRoot.dataset.theme === 'dark' ? 'light' : 'dark';
        themeRoot.dataset.themeMode = 'manual';
        saveTheme(themeRoot.dataset.theme);
        updateThemeButton();
      }
    });
  }

  // Pixel dungeon maps used as tile imagery
  var MAPS = {
    hero: ['###############', '#....#....i...#', '#.##.#.####.#.#', '#.#..........##', '#.#.###.##.#..#', '#...#e..#..#.##', '###.#.###.##..#', '#...#...P....e#', '#.#####.#####.#', '#.....#.....#.#', '#.###.#.###.#.#', '#i..#...#...i.#', '###############'],
    build: ['#######', '#..i..#', '#.###.#', '#..P..#', '#.#.#e#', '#e....#', '#######'],
    a: ['#######', '#.....#', '#.#.#.#', '#..P..#', '#.#.#.#', '#i...e#', '#######'],
    b: ['#######', '#e..#i#', '#.#.#.#', '#.#P..#', '#...#.#', '#.#...#', '#######'],
    c: ['#######', '#i#...#', '#.#.#e#', '#...#.#', '###.#.#', '#P....#', '#######']
  };
  var COLORS = { '#': '#252b3b', '.': '#121620', 'P': '#3b6cf5', 'e': '#8990a3', 'i': '#dde1ea' };
  document.querySelectorAll('[data-map]').forEach(function (el) {
    var rows = MAPS[el.getAttribute('data-map')] || [];
    var width = rows.reduce(function (w, r) { return Math.max(w, r.length); }, 0);
    el.style.gridTemplateColumns = 'repeat(' + width + ', var(--cell, 44px))';
    var frag = document.createDocumentFragment();
    rows.forEach(function (r) {
      for (var i = 0; i < width; i++) {
        var s = document.createElement('span');
        s.style.background = COLORS[r.charAt(i) || '#'];
        frag.appendChild(s);
      }
    });
    el.appendChild(frag);
  });

  // Agent tile cells
  document.querySelectorAll('.agent-cells').forEach(function (el) {
    for (var i = 0; i < 48; i++) {
      var s = document.createElement('span');
      if (i === 34) s.className = 'hot';
      el.appendChild(s);
    }
  });

  // Mobile menu
  var btn = document.querySelector('.menu-btn');
  var panel = document.getElementById('mobile-panel');
  if (btn && panel) {
    btn.addEventListener('click', function () {
      var open = panel.hidden;
      panel.hidden = !open;
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    panel.addEventListener('click', function (e) {
      if (e.target.closest('a')) { panel.hidden = true; btn.setAttribute('aria-expanded', 'false'); }
    });
  }

  // Updates form (no backend yet)
  document.querySelectorAll('form[data-updates]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var status = form.querySelector('.form-status');
      if (status) {
        status.hidden = false;
        status.textContent = 'Sign-ups open soon. This preview form doesn’t send anything yet.';
      }
    });
  });
})();
