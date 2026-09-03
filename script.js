document.addEventListener('DOMContentLoaded', () => {
  const storageKeys = {
    preferences: 'wayfinder-preferences',
    route: 'wayfinder-saved-route',
    demoUser: 'wayfinder-demo-user'
  };

  const routes = {
    Transit: { time: 28, route: 'Green Line → Red Line', detail: 'Reliable service with the best pattern match.', condition: 'Light traffic and clear skies.' },
    Drive: { time: 31, route: 'Via Storrow Drive', detail: 'Direct route with light traffic right now.', condition: 'Light traffic, with $4.20 in tolls.' },
    Bike: { time: 36, route: 'Charles River path', detail: 'A clear, scenic route for an active start.', condition: 'Clear route with comfortable conditions.' }
  };

  const trips = [
    { date: 'Tuesday, October 24', origin: 'South End', destination: 'Cambridge', mode: 'Transit', duration: 28, status: 'On time', traffic: 'Light traffic', notes: 'Smooth Green Line connection and a clear arrival window.' },
    { date: 'Monday, October 23', origin: 'South End', destination: 'Cambridge', mode: 'Transit', duration: 30, status: 'On time', traffic: 'Moderate traffic', notes: 'Two-minute platform wait added a little time.' },
    { date: 'Friday, October 20', origin: 'South End', destination: 'Cambridge', mode: 'Bike', duration: 35, status: 'Completed', traffic: 'Clear route', notes: 'Comfortable ride along the Charles River path.' },
    { date: 'Thursday, October 19', origin: 'South End', destination: 'Cambridge', mode: 'Drive', duration: 34, status: 'Delayed', traffic: 'Heavy traffic', notes: 'Storrow Drive slowed near the river crossing.' }
  ];

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const readStorage = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw) ?? fallback;
    } catch {
      return fallback;
    }
  };

  const saveStorage = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore storage quota or file URL restrictions.
    }
  };

  const defaultPreferences = { home: 'South End', work: 'Cambridge', mode: 'Transit', time: '07:42', avoidTolls: false, notifications: 'on' };

  const getSavedName = () => readStorage(storageKeys.demoUser, {}).name || 'Jordan Davis';

  const updateNameDisplays = () => {
    const name = getSavedName();
    const initials = name.split(/\s+/).map((part) => part.charAt(0)).join('').slice(0, 2).toUpperCase();
    $$('.profile-button b, #profile-title').forEach((element) => { element.textContent = name; });
    $$('.profile-button span, .profile-summary > span').forEach((element) => { element.textContent = initials; });
  };

  const formatTime = (value) => {
    const [hour, minute] = value.split(':').map(Number);
    return `${((hour + 11) % 12) + 1}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  const formatDate = (date) => new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(date);

  const showToast = (message) => {
    const toast = $('.toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('visible');
    if (window.toastTimer) clearTimeout(window.toastTimer);
    window.toastTimer = setTimeout(() => toast.classList.remove('visible'), 2800);
  };

  const setPopover = (popover, button, open) => {
    if (!popover || !button) return;
    popover.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
  };

  const closePopovers = () => {
    const profileMenu = $('#profile-menu');
    const profileButton = $('.profile-button');
    if (profileMenu && profileButton) setPopover(profileMenu, profileButton, false);
    const routeMenu = $('#route-menu');
    const routeButton = $('.icon-button');
    if (routeMenu && routeButton) setPopover(routeMenu, routeButton, false);
  };

  const openModal = (id) => {
    closePopovers();
    const backdrop = $(`#${id}`);
    if (!backdrop) return;
    backdrop.hidden = false;
    document.body.classList.add('modal-open');
    const closeButton = $('.modal-close', backdrop);
    if (closeButton) closeButton.focus();
  };

  const closeModal = (backdrop) => {
    if (!backdrop) return;
    backdrop.hidden = true;
    if ($$('.modal-backdrop:not([hidden])').length === 0) {
      document.body.classList.remove('modal-open');
    }
  };

  const dashboardInit = () => {
    let preferences = { ...defaultPreferences, ...readStorage(storageKeys.preferences, {}) };
    let selectedMode = routes[readStorage(storageKeys.route, {}).mode] ? readStorage(storageKeys.route, {}).mode : preferences.mode || 'Transit';

    const updateRoute = (mode, notify = false) => {
      const nextMode = routes[mode] ? mode : 'Transit';
      selectedMode = nextMode;
      const route = routes[nextMode];
      const departure = preferences.time || '07:42';
      const homeLocation = preferences.home || 'South End';
      const workLocation = preferences.work || 'Cambridge';
      const timeParts = formatTime(departure).split(' ');
      const delta = (() => {
        const [hour, minute] = departure.split(':').map(Number);
        const minutes = (hour * 60) + minute;
        const target = (7 * 60) + 42;
        const diff = minutes - target;
        if (diff <= -15) return '12 min earlier';
        if (diff <= -5) return '6 min earlier';
        if (diff <= 10) return 'on time';
        if (diff <= 25) return '5 min later';
        return '12 min later';
      })();

      saveStorage(storageKeys.route, { ...readStorage(storageKeys.route, {}), mode: nextMode });

      const routeOptions = $$('.route-option');
      routeOptions.forEach((option) => option.classList.toggle('selected', option.dataset.mode === nextMode));

      const heroTitleStrong = $('.hero-card h2 strong');
      const heroTitleSmall = $('.hero-card h2 small');
      const lineStartSmall = $('.line-start small');
      const lineEndSmall = $('.line-end small');
      const heroCopy = $('.hero-copy');
      const routeTrackEm = $('.route-track em');
      const routeMode = $('[data-route-mode]');
      const routeTime = $('[data-route-time]');
      const routeDeparture = $('[data-route-departure]');
      const routeSummary = $('[data-route-summary]');
      const routeCondition = $('[data-route-condition]');
      const modalHome = $('.modal-route .home-label');
      const modalWork = $('.modal-route .work-label');

      if (heroTitleStrong) heroTitleStrong.textContent = timeParts[0];
      if (heroTitleSmall) heroTitleSmall.textContent = timeParts[1];
      if (lineStartSmall) lineStartSmall.textContent = homeLocation;
      if (lineEndSmall) lineEndSmall.textContent = workLocation;
      if (heroCopy) heroCopy.innerHTML = `${route.detail} <strong>${delta === 'on time' ? 'A comfortable fit for your routine.' : `${delta} than your usual trip.`}</strong>`;
      if (routeTrackEm) routeTrackEm.textContent = `${route.time} min`;
      if (routeMode) routeMode.textContent = nextMode;
      if (routeTime) routeTime.textContent = route.time;
      if (routeDeparture) routeDeparture.textContent = formatTime(departure);
      if (routeSummary) routeSummary.textContent = route.route;
      if (routeCondition) routeCondition.textContent = route.condition;
      if (modalHome) modalHome.textContent = homeLocation;
      if (modalWork) modalWork.textContent = workLocation;

      if (notify) showToast(`${nextMode} is now your selected route.`);
    };

    const renderPatterns = () => {
      const patternsView = $('#patterns-view');
      if (!patternsView) return;
      patternsView.innerHTML = `
        <div class="view-heading">
          <div>
            <p class="eyebrow">Your commute intelligence</p>
            <h1 id="patterns-title">My patterns<span>.</span></h1>
            <p class="lede">A clearer picture of the way you move through the week.</p>
          </div>
          <button class="view-back" type="button" data-view="today">← Back to today</button>
        </div>
        <div class="pattern-grid">
          <article class="panel pattern-lead">
            <p class="eyebrow">Your rhythm</p>
            <h2>Consistency is your superpower.</h2>
            <p>Your most reliable window is between 7:35 and 7:50 AM, with ${preferences.mode} as your most predictable mode.</p>
            <div class="pattern-bar"><span style="width: 78%"></span></div>
            <small>78% of weekday trips start in your usual window</small>
          </article>
          <article class="panel metric-card"><p class="eyebrow">Usual departure</p><strong>7:42 <small>AM</small></strong><span>Most common weekday start</span></article>
          <article class="panel metric-card"><p class="eyebrow">Average duration</p><strong>29 <small>min</small></strong><span>8 min faster than last week</span></article>
          <article class="panel metric-card"><p class="eyebrow">Preferred mode</p><strong>${preferences.mode}</strong><span>Selected in your preferences</span></article>
          <article class="panel metric-card"><p class="eyebrow">Fastest weekday</p><strong>Tuesday</strong><span>28 min average</span></article>
          <article class="panel metric-card"><p class="eyebrow">Busiest weekday</p><strong>Thursday</strong><span>34 min average</span></article>
        </div>
        <article class="panel pattern-chart-panel">
          <div class="panel-heading">
            <div><p class="eyebrow">Weekly commute pattern</p><h2>Time across the week</h2></div>
            <span class="insight-badge">4.8 / 5 accuracy</span>
          </div>
          <div class="pattern-chart">
            <span class="bar-label">40 min</span>
            <i style="height: 56%"><b>Mon</b></i>
            <i style="height: 46%"><b>Tue</b></i>
            <i style="height: 62%"><b>Wed</b></i>
            <i style="height: 77%"><b>Thu</b></i>
            <i style="height: 50%"><b>Fri</b></i>
          </div>
          <div class="pattern-summary">
            <span><small>Best route</small><b>${preferences.mode}</b></span>
            <span><small>Goal time</small><b>28 min</b></span>
            <span><small>Trend</small><b>4 recent trips</b></span>
          </div>
        </article>
      `;
    };

    const renderHistory = () => {
      const historyView = $('#history-view');
      if (!historyView) return;
      historyView.innerHTML = `
        <div class="view-heading">
          <div>
            <p class="eyebrow">Your journeys</p>
            <h1 id="history-view-title">Trip history<span>.</span></h1>
            <p class="lede">A simple record of recent sample trips.</p>
          </div>
          <button class="view-back" type="button" data-view="today">← Back to today</button>
        </div>
        <div class="history-list">
          ${trips.map((trip, index) => `
            <button class="history-item" type="button" data-trip-index="${index}">
              <span class="history-date">${trip.date}</span>
              <span class="history-route"><b>${trip.origin}</b><em>→</em><b>${trip.destination}</b></span>
              <span class="history-mode">${trip.mode}</span>
              <strong>${trip.duration} min</strong>
              <span class="history-status ${trip.status === 'Delayed' ? 'delayed' : ''}">${trip.status}</span>
              <span class="history-arrow">→</span>
            </button>
          `).join('')}
        </div>
      `;
    };

    const loadPreferences = () => {
      const homeInput = $('#home-location');
      const workInput = $('#work-location');
      const modeInput = $('#preferred-mode');
      const timeInput = $('#preferred-time');
      const avoidInput = $('#avoid-tolls');
      const notificationsInput = $('#notification-preference');
      const profileMode = $('[data-profile-mode]');

      if (homeInput) homeInput.value = preferences.home || 'South End';
      if (workInput) workInput.value = preferences.work || 'Cambridge';
      if (modeInput) modeInput.value = preferences.mode || 'Transit';
      if (timeInput) timeInput.value = preferences.time || '07:42';
      if (avoidInput) avoidInput.checked = !!preferences.avoidTolls;
      if (notificationsInput) notificationsInput.value = preferences.notifications || 'on';
      if (profileMode) profileMode.textContent = preferences.mode || 'Transit';
    };

    const saveRoute = () => {
      const viewRouteButton = $('.view-route-button');
      saveStorage(storageKeys.route, { mode: selectedMode, savedAt: Date.now() });
      if (viewRouteButton) viewRouteButton.classList.add('is-saved');
      showToast(`${selectedMode} route saved on this device.`);
    };

    const syncForecastHeader = (selectedDate = new Date()) => {
      const dateInput = $('#forecast-date');
      const dateLabel = $('#date-label');
      const welcomeTitle = $('#welcome-title');
      const eyebrow = $('.welcome-row .eyebrow');
      if (!dateInput || !dateLabel || !welcomeTitle || !eyebrow) return;

      const pad = (value) => String(value).padStart(2, '0');
      const dateText = formatDate(selectedDate);
      const dateValue = `${selectedDate.getFullYear()}-${pad(selectedDate.getMonth() + 1)}-${pad(selectedDate.getDate())}`;
      dateInput.value = dateValue;
      dateLabel.textContent = dateText;
      eyebrow.innerHTML = `${dateText} <span class="status-dot"></span> Live forecast`;
      const greeting = selectedDate.getDay() === 0 || selectedDate.getDay() === 6 ? 'Enjoy your day' : `Good morning, ${getSavedName()}`;
      welcomeTitle.innerHTML = `${greeting}<span>.</span>`;

      const weather = (() => {
        const day = selectedDate.getDay();
        const baseline = [
          { temp: 54, summary: 'Clear skies', low: 48, high: 61, rain: '0%', updated: '6:58 AM' },
          { temp: 59, summary: 'Bright and mild', low: 51, high: 64, rain: '10%', updated: '7:02 AM' },
          { temp: 63, summary: 'Partly cloudy', low: 54, high: 68, rain: '15%', updated: '7:09 AM' },
          { temp: 57, summary: 'Cool breeze', low: 50, high: 62, rain: '20%', updated: '6:51 AM' }
        ];
        const index = ((selectedDate.getDate() + day) % baseline.length + baseline.length) % baseline.length;
        const sample = baseline[index];
        if (day === 0 || day === 6) return { ...sample, summary: 'Sunny and easy', temp: 62, low: 56, high: 67, rain: '5%', updated: '7:18 AM' };
        return sample;
      })();

      const weatherUpdated = $('.weather-card .side-title span');
      const weatherStrong = $('.weather-card .weather-reading strong');
      const weatherP = $('.weather-card .weather-reading p');
      const weatherLow = $('.weather-card .weather-range span:nth-child(1) b');
      const weatherHigh = $('.weather-card .weather-range span:nth-child(2) b');
      const weatherRain = $('.weather-card .weather-range span:nth-child(3) b');
      if (weatherUpdated) weatherUpdated.textContent = `Updated ${weather.updated}`;
      if (weatherStrong) weatherStrong.textContent = `${weather.temp}°`;
      if (weatherP) weatherP.textContent = weather.summary;
      if (weatherLow) weatherLow.textContent = `${weather.low}°`;
      if (weatherHigh) weatherHigh.textContent = `${weather.high}°`;
      if (weatherRain) weatherRain.textContent = weather.rain;
    };

    const syncLiveClock = () => {
      const clock = $('#live-clock');
      if (!clock) return;
      const now = new Date();
      const hour = now.getHours();
      const minute = String(now.getMinutes()).padStart(2, '0');
      const second = String(now.getSeconds()).padStart(2, '0');
      const suffix = hour >= 12 ? 'PM' : 'AM';
      const displayHour = ((hour + 11) % 12) + 1;
      clock.textContent = `${displayHour}:${minute}:${second} ${suffix}`;
    };

    const animateRecentTrips = () => {
      const chartLine = document.querySelector('.mini-chart .chart-line');
      const chartFill = document.querySelector('.mini-chart .chart-fill');
      const points = document.querySelectorAll('.mini-chart circle');
      if (!chartLine || !chartFill || !points.length) return;

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        chartLine.style.opacity = '1';
        chartLine.style.strokeDasharray = 'none';
        chartLine.style.strokeDashoffset = '0';
        chartFill.style.opacity = '1';
        points.forEach((point) => {
          point.style.opacity = '1';
          point.style.transform = 'scale(1)';
        });
        return;
      }

      const length = chartLine.getTotalLength();
      chartLine.style.strokeDasharray = String(length);
      chartLine.style.strokeDashoffset = String(length);
      chartLine.style.opacity = '1';
      chartFill.style.opacity = '0';

      requestAnimationFrame(() => {
        chartLine.style.transition = 'stroke-dashoffset 900ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 220ms ease';
        chartLine.style.strokeDashoffset = '0';
        chartFill.style.transition = 'opacity 260ms ease 420ms';
        chartFill.style.opacity = '1';
        points.forEach((point, index) => {
          point.style.transition = 'opacity 220ms ease, transform 220ms ease';
          point.style.transitionDelay = `${180 + index * 130}ms`;
          point.style.opacity = '1';
          point.style.transform = 'scale(1)';
        });
      });
    };

    renderPatterns();
    renderHistory();
    loadPreferences();
    syncForecastHeader(new Date());
    syncLiveClock();
    updateRoute(selectedMode);
    animateRecentTrips();

    const switchView = (view) => {
      const mainSections = $$('.welcome-row, .forecast-grid, .lower-grid');
      mainSections.forEach((section) => { section.hidden = view !== 'today'; });
      const patternsView = $('#patterns-view');
      const historyView = $('#history-view');
      if (patternsView) patternsView.hidden = view !== 'patterns';
      if (historyView) historyView.hidden = view !== 'history';
      $$('.nav-links a').forEach((link) => {
        const active = link.dataset.page === view;
        link.classList.toggle('active', active);
        if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
      });
      if (view === 'patterns') renderPatterns();
      if (view === 'history') renderHistory();
      closePopovers();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    $$('.nav-links a').forEach((link) => {
      const pageMap = { 'Today': 'today', 'My patterns': 'patterns', 'Trip history': 'history' };
      link.dataset.page = pageMap[link.textContent.trim()] || 'today';
      link.addEventListener('click', (event) => {
        event.preventDefault();
        switchView(link.dataset.page);
      });
    });

    const brandLink = $('.brand');
    if (brandLink) {
      brandLink.addEventListener('click', (event) => {
        if (brandLink.getAttribute('href') === '#top' || brandLink.getAttribute('href') === '#') {
          event.preventDefault();
          switchView('today');
        }
      });
    }

    const profileButton = $('.profile-button');
    if (profileButton) {
      profileButton.addEventListener('click', (event) => {
        event.stopPropagation();
        const menu = $('#profile-menu');
        if (menu) setPopover(menu, profileButton, menu.hidden);
      });
    }

    const routeButton = $('.icon-button');
    if (routeButton) {
      routeButton.addEventListener('click', (event) => {
        event.stopPropagation();
        const menu = $('#route-menu');
        if (menu) setPopover(menu, routeButton, menu.hidden);
      });
    }

    document.addEventListener('click', (event) => {
      const target = event.target;
      if (!target.closest('.profile-wrap, .menu-wrap')) closePopovers();
      if (target.matches('.modal-backdrop')) closeModal(target);
      const viewButton = target.closest('[data-view]');
      if (viewButton) switchView(viewButton.dataset.view);
      const tripButton = target.closest('[data-trip-index]');
      if (tripButton) {
        const trip = trips[tripButton.dataset.tripIndex];
        const tripDetail = $('[data-trip-detail]');
        if (tripDetail) tripDetail.innerHTML = `<b>${trip.date}</b><span>${trip.origin} → ${trip.destination} · ${trip.mode} · ${trip.duration} min</span><small>${trip.traffic}. ${trip.notes}</small>`;
        openModal('trip-modal');
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closePopovers();
        $$('.modal-backdrop:not([hidden])').forEach((modal) => closeModal(modal));
      }
    });

    $$('.route-option').forEach((option) => {
      option.addEventListener('click', () => updateRoute(option.dataset.mode, true));
    });

    const viewRouteButton = $('.view-route-button');
    if (viewRouteButton) {
      viewRouteButton.addEventListener('click', () => {
        const saved = readStorage(storageKeys.route, {});
        const savedLabel = $('[data-route-saved]');
        if (savedLabel) savedLabel.textContent = saved.savedAt ? 'Saved on this device' : '';
        openModal('route-modal');
      });
    }

    $$('[data-open-preferences]').forEach((button) => {
      button.addEventListener('click', () => {
        loadPreferences();
        openModal('preferences-modal');
      });
    });

    const profileOpen = $('[data-open-profile]');
    if (profileOpen) profileOpen.addEventListener('click', () => openModal('profile-modal'));

    const signOutButton = $('[data-demo-signout]');
    if (signOutButton) {
      signOutButton.addEventListener('click', () => {
        localStorage.removeItem(storageKeys.demoUser);
        window.location.href = 'login.html';
      });
    }

    const saveRouteAction = $('[data-action="save-route"]');
    if (saveRouteAction) {
      saveRouteAction.addEventListener('click', () => {
        saveRoute();
        closePopovers();
      });
    }

    const toggleTolls = $('[data-action="toggle-tolls"]');
    if (toggleTolls) {
      toggleTolls.addEventListener('click', () => {
        preferences.avoidTolls = !preferences.avoidTolls;
        saveStorage(storageKeys.preferences, preferences);
        loadPreferences();
        updateRoute(selectedMode);
        showToast(preferences.avoidTolls ? 'Avoid tolls enabled.' : 'Avoid tolls disabled.');
        closePopovers();
      });
    }

    const shareRoute = $('[data-action="share-route"]');
    if (shareRoute) {
      shareRoute.addEventListener('click', async () => {
        const text = `${selectedMode} route: South End to Cambridge, ${routes[selectedMode].time} minutes via ${routes[selectedMode].route}.`;
        try {
          if (navigator.share) {
            await navigator.share({ title: 'Wayfinder route', text });
            showToast('Route share sheet opened.');
          } else if (navigator.clipboard) {
            await navigator.clipboard.writeText(text);
            showToast('Route summary copied to clipboard.');
          } else {
            showToast('Sharing is not available here.');
          }
        } catch {
          showToast('Sharing was cancelled.');
        }
        closePopovers();
      });
    }

    const saveRouteButton = $('.save-route-button');
    if (saveRouteButton) saveRouteButton.addEventListener('click', saveRoute);

    const smallLink = $('.small-link');
    if (smallLink) {
      smallLink.addEventListener('click', (event) => {
        event.preventDefault();
        switchView('history');
      });
    }

    const insightLink = $('.insight-card a');
    if (insightLink) {
      insightLink.addEventListener('click', (event) => {
        event.preventDefault();
        switchView('patterns');
      });
    }

    $$('.modal-close, .cancel-button').forEach((button) => {
      button.addEventListener('click', () => closeModal(button.closest('.modal-backdrop')));
    });

    const preferencesForm = $('#preferences-form');
    if (preferencesForm) {
      preferencesForm.addEventListener('submit', (event) => {
        event.preventDefault();
        preferences = {
          home: $('#home-location').value.trim() || 'South End',
          work: $('#work-location').value.trim() || 'Cambridge',
          mode: $('#preferred-mode').value,
          time: $('#preferred-time').value || '07:42',
          avoidTolls: $('#avoid-tolls').checked,
          notifications: $('#notification-preference').value
        };
        saveStorage(storageKeys.preferences, preferences);
        updateRoute(preferences.mode);
        loadPreferences();
        renderPatterns();
        closeModal($('#preferences-modal'));
        showToast('Preferences saved on this device.');
      });
    }

    setInterval(syncLiveClock, 1000);
  };

  if (document.body.classList.contains('auth-page')) {
    const form = $('#login-form');
    const signedInState = $('#signed-in-state');
    const existingUser = readStorage(storageKeys.demoUser, null);

    if (existingUser && existingUser.signedIn) {
      if (form) form.hidden = true;
      if (signedInState) signedInState.hidden = false;
    }

    if (form) {
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const emailInput = form.querySelector('input[name="email"]');
        const rawEmail = (emailInput ? emailInput.value : '').trim() || 'jordan@example.com';
        const name = rawEmail.split('@')[0].replace(/[._-]/g, ' ').split(' ').filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ') || 'Jordan Davis';
        saveStorage(storageKeys.demoUser, { signedIn: true, name, email: rawEmail });
        updateNameDisplays();
        window.location.href = 'index.html';
      });
    }
    return;
  }

  if (document.body.classList.contains('preferences-page')) {
    const form = $('#preferences-page-form');
    const status = $('#preferences-status');
    const applyValues = (values) => {
      const home = $('#pref-home');
      const work = $('#pref-work');
      const mode = $('#pref-mode');
      const time = $('#pref-time');
      const avoid = $('#pref-avoid-tolls');
      const notifications = $('#pref-notifications');
      if (home) home.value = values.home || 'South End';
      if (work) work.value = values.work || 'Cambridge';
      if (mode) mode.value = values.mode || 'Transit';
      if (time) time.value = values.time || '07:42';
      if (avoid) avoid.checked = !!values.avoidTolls;
      if (notifications) notifications.value = values.notifications || 'on';
    };

    const savedSettings = { ...defaultPreferences, ...readStorage(storageKeys.preferences, {}) };
    applyValues(savedSettings);

    if (form) {
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const next = {
          home: $('#pref-home').value.trim() || 'South End',
          work: $('#pref-work').value.trim() || 'Cambridge',
          mode: $('#pref-mode').value || 'Transit',
          time: $('#pref-time').value || '07:42',
          avoidTolls: $('#pref-avoid-tolls').checked,
          notifications: $('#pref-notifications').value || 'on'
        };
        saveStorage(storageKeys.preferences, next);
        if (status) status.textContent = 'Preferences saved. Ready to continue to the dashboard.';
      });
    }

    const cancelButton = $('#preferences-cancel');
    if (cancelButton) {
      cancelButton.addEventListener('click', () => {
        applyValues({ ...defaultPreferences, ...readStorage(storageKeys.preferences, {}) });
        if (status) status.textContent = 'Changes were not saved.';
      });
    }

    const signOutButton = $('[data-demo-signout]');
    if (signOutButton) {
      signOutButton.addEventListener('click', () => {
        localStorage.removeItem(storageKeys.demoUser);
        window.location.href = 'login.html';
      });
    }

    const profileButton = $('.profile-button');
    if (profileButton) {
      profileButton.addEventListener('click', (event) => {
        event.stopPropagation();
        const menu = $('#profile-menu');
        if (menu) setPopover(menu, profileButton, menu.hidden);
      });
    }

    document.addEventListener('click', (event) => {
      if (!event.target.closest('.profile-wrap')) {
        const menu = $('#profile-menu');
        const button = $('.profile-button');
        if (menu && button) setPopover(menu, button, false);
      }
    });
    return;
  }

  updateNameDisplays();
  dashboardInit();
});
