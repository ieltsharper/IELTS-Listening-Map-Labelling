// Map-labelling exercise: reads the page's <script id="exercise" type="application/json">, draws the audio,
// the answer rows and the transcript, checks the answers and keeps them in this browser (localStorage).
(function () {
  const data = JSON.parse(document.getElementById('exercise').textContent);
  const storeKey = 'ih-listening-map:' + data.id;
  const $ = (id) => document.getElementById(id);
  const esc = (s) =>
    s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  // ---- Audio: a Google Drive file (shared "Anyone with the link") played in Drive's own player.
  const audio = $('audio');
  if (data.audio) {
    const frame = document.createElement('iframe');
    frame.src = 'https://drive.google.com/file/d/' + data.audio + '/preview';
    frame.title = 'Audio: ' + data.title;
    frame.allow = 'autoplay';
    audio.appendChild(frame);
    const link = document.createElement('a');
    link.className = 'audio-link';
    link.href = 'https://drive.google.com/file/d/' + data.audio + '/view';
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = 'Audio not playing? Open it in Google Drive';
    audio.appendChild(link);
  } else {
    audio.innerHTML = '<p class="audio-missing">The audio for this exercise is being added. Please check back soon.</p>';
  }
  if (data.cue) {
    const cue = document.createElement('p');
    cue.className = 'cue';
    cue.innerHTML = data.cue;
    audio.appendChild(cue);
  }

  // ---- Answer rows
  const letters = data.letters.split('');
  const list = $('questions');
  for (const q of data.questions) {
    const li = document.createElement('li');
    li.id = 'row-' + q.n;
    li.innerHTML =
      '<span class="num">' + q.n + '</span>' +
      '<label for="q-' + q.n + '">' + esc(q.label) + '</label>' +
      '<select id="q-' + q.n + '"><option value="">–</option>' +
      letters.map((l) => '<option>' + l + '</option>').join('') +
      '</select><span class="feedback" aria-live="polite"></span>';
    list.appendChild(li);
  }
  const select = (n) => $('q-' + n);

  // ---- Saved answers
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(storeKey) || '{}');
  } catch (e) {
    saved = {};
  }
  for (const q of data.questions) if (saved[q.n]) select(q.n).value = saved[q.n];
  const save = () => {
    const out = {};
    for (const q of data.questions) out[q.n] = select(q.n).value;
    try {
      localStorage.setItem(storeKey, JSON.stringify(out));
    } catch (e) {
      /* private mode: answers just are not kept */
    }
  };
  list.addEventListener('change', (e) => {
    save();
    const li = e.target.closest('li');
    if (li) {
      li.classList.remove('correct', 'incorrect');
      li.querySelector('.feedback').textContent = '';
    }
  });

  // ---- Transcript: "{16:words}" marks the words that give the answer to Question 16.
  const transcript = $('transcript-body');
  transcript.innerHTML = data.transcript
    .map(
      (p) =>
        '<p>' +
        esc(p).replace(/\{(\d+):([^}]*)\}/g, (_, n, t) => '<mark>' + t + '<b>Q' + n + '</b></mark>') +
        '</p>',
    )
    .join('');
  const unlockTranscript = () => {
    $('transcript-locked').hidden = true;
    $('btn-transcript').hidden = false;
  };
  $('btn-transcript').addEventListener('click', () => {
    const show = transcript.hidden;
    transcript.hidden = !show;
    $('btn-transcript').textContent = show ? 'Hide transcript' : 'Show transcript';
  });

  // ---- Saving the result. A signed-in student is saved under their portal account (the portal and these
  // pages share one website, so the sign-in is readable here). Anyone else types a name before starting (the
  // same name as on the Reading and Listening test pages: one name for the whole website). The teacher
  // sees the results on the portal (Bài tập → Bài nghe). Only the score is sent, never the answers.
  const API_URL = 'https://script.google.com/macros/s/AKfycbwKm1zvqca2-WO20f49M4mNW2qn9Aq4uxJZ3_bnQrErWPL5TN4jHycXZUQBDJ1W7wWg/exec';
  const PORTAL = 'https://ieltsharper.github.io/portal/';
  const NAME_KEY = 'ih-reading:name';
  const actions = $('score').parentNode;
  const note = document.createElement('p');
  note.className = 'plain portal-note';
  note.setAttribute('aria-live', 'polite');
  note.hidden = true;
  actions.parentNode.insertBefore(note, actions.nextSibling);
  const portalToken = () => {
    try {
      return localStorage.getItem('portal.session');
    } catch (e) {
      return null;
    }
  };
  const storedName = () => {
    try {
      return localStorage.getItem(NAME_KEY) || '';
    } catch (e) {
      return '';
    }
  };
  const cleanName = (s) => String(s || '').normalize('NFC').replace(/\s+/g, ' ').trim();
  const nameProblem = (n) =>
    n.length < 2 || n.length > 40 || !/\p{L}/u.test(n) || /[<>]/.test(n) ? 'Please type your name (2–40 letters).' : '';
  const say = (html) => {
    note.hidden = !html;
    note.innerHTML = html || '';
  };

  // A visitor's name, under the buttons, with a way to change it
  const whoLine = document.createElement('p');
  whoLine.className = 'plain visitor-name';
  whoLine.hidden = true;
  note.parentNode.insertBefore(whoLine, note);
  const drawWho = () => {
    const n = portalToken() ? '' : storedName();
    whoLine.hidden = !n;
    whoLine.innerHTML = n
      ? 'Your results are saved for your teacher under the name <strong>' + esc(n) + '</strong> ' +
        '<button type="button" class="link-btn" id="change-name">Change</button>'
      : '';
    if (n) $('change-name').addEventListener('click', () => askName(true));
  };

  // The name box: before starting (cannot be closed), or to change the name
  let overlay = null;
  let afterName = null; // a score waiting for the name
  const setInert = (on) =>
    document.querySelectorAll('nav.topbar, main').forEach((el) => (on ? el.setAttribute('inert', '') : el.removeAttribute('inert')));
  const askName = (change, problem) => {
    if (overlay) overlay.remove();
    overlay = document.createElement('div');
    overlay.className = 'name-overlay';
    overlay.innerHTML =
      '<form class="name-box" role="dialog" aria-modal="true" aria-labelledby="name-title" novalidate>' +
      '<h2 id="name-title">' + (change ? 'Change your name' : 'Before you start: what is your name?') + '</h2>' +
      '<p>When you check your answers, your score is saved online under this name so your teacher can see it.</p>' +
      '<p class="name-rule"><strong>Please use only one name on this website</strong>, spelt the same way every time ' +
      '(for example, your full name), the same name as on the Reading and Listening pages.</p>' +
      '<label for="name-input">Your name</label>' +
      '<input id="name-input" type="text" autocomplete="name" maxlength="40" spellcheck="false">' +
      '<p class="name-error" id="name-error" role="alert"></p>' +
      '<div class="name-actions"><button type="submit" class="btn-check">' + (change ? 'Save name' : 'Start') + '</button>' +
      (change ? '<button type="button" id="name-cancel">Cancel</button>' : '') + '</div>' +
      '<p class="name-alt">Have an IELTS Harper Portal account? <a href="' + PORTAL + '" target="_blank" rel="noopener">Sign in to the portal</a>, then reload this page.</p>' +
      '</form>';
    document.body.appendChild(overlay);
    setInert(true);
    const input = $('name-input');
    const error = $('name-error');
    if (change) input.value = storedName();
    if (problem) error.textContent = problem;
    input.focus();
    const close = () => {
      overlay.remove();
      overlay = null;
      setInert(false);
    };
    if (change) {
      $('name-cancel').addEventListener('click', close);
      overlay.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') close();
      });
    }
    overlay.querySelector('form').addEventListener('submit', (e) => {
      e.preventDefault();
      const n = cleanName(input.value);
      const bad = nameProblem(n);
      if (bad) {
        error.textContent = bad;
        input.focus();
        return;
      }
      try {
        localStorage.setItem(NAME_KEY, n);
      } catch (err) {}
      close();
      drawWho();
      if (afterName !== null) {
        const s = afterName;
        afterName = null;
        logToPortal(s);
      }
    });
  };

  let sending = false;
  let again = null;
  const logToPortal = (score) => {
    if (sending) {
      again = score;
      return;
    }
    const tok = portalToken();
    const name = tok ? '' : storedName();
    if (!tok && !name) {
      afterName = score;
      askName(false);
      return;
    }
    const payload = { exercise: data.id, correct: score };
    if (!tok) payload.name = name;
    sending = true;
    say(tok ? 'Saving to your portal…' : 'Saving your result for your teacher…');
    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'listening.map.result', token: tok, payload }),
      redirect: 'follow',
      credentials: 'omit',
    })
      .then((r) => r.json())
      .then((env) => {
        if (env.ok) say('✓ Result saved for your teacher under the name <strong>' + esc(env.data.name) + '</strong> (' + score + ' / ' + data.questions.length + ').');
        else if (!tok && env.error.code === 'invalid' && /name/i.test(env.error.message)) {
          try {
            localStorage.removeItem(NAME_KEY);
          } catch (e) {}
          drawWho();
          say('');
          afterName = score;
          askName(false, env.error.message);
        } else if (env.error.code === 'unauthorized') say('Your portal sign-in has ended. <a href="' + PORTAL + '" target="_blank" rel="noopener">Sign in again</a>, then check your answers again.');
        else say('Could not save your result: ' + esc(env.error.message));
      })
      .catch(() => say('Could not reach the server, so this result was not saved for your teacher. Check your answers again later.'))
      .then(() => {
        sending = false;
        if (again !== null) {
          const s = again;
          again = null;
          logToPortal(s);
        }
      });
  };
  drawWho();
  if (!portalToken() && !storedName()) askName(false);

  // ---- Check / show answers / reset
  const check = (reveal) => {
    let score = 0;
    for (const q of data.questions) {
      const li = $('row-' + q.n);
      const value = select(q.n).value;
      const ok = value === q.answer;
      if (ok) score++;
      li.classList.toggle('correct', ok);
      li.classList.toggle('incorrect', !ok);
      li.querySelector('.feedback').textContent = ok
        ? 'Correct'
        : reveal
          ? 'Answer: ' + q.answer
          : value
            ? 'Not quite. Listen again.'
            : 'No answer yet.';
    }
    $('score').textContent = 'Score: ' + score + ' / ' + data.questions.length;
    unlockTranscript();
    if (data.questions.some((q) => select(q.n).value)) logToPortal(score);
  };
  $('btn-check').addEventListener('click', () => check(false));
  $('btn-answers').addEventListener('click', () => check(true));
  $('btn-reset').addEventListener('click', () => {
    for (const q of data.questions) {
      select(q.n).value = '';
      const li = $('row-' + q.n);
      li.classList.remove('correct', 'incorrect');
      li.querySelector('.feedback').textContent = '';
    }
    $('score').textContent = '';
    save();
  });
})();
