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
