/* Report form.
   There is no server behind this static site, so "sending" opens the visitor's
   email app with the report filled in, and also offers a Copy button.
   */
const CONTACT_EMAIL = 'vikkmkunzzy@gmail.com';

const LABELS = {
  error: 'Error or blank screen', hacked: "I think I've been hacked", update: 'Broke after an update',
  slow: 'Very slow', login: "Can't log in", visibility: 'Not showing on google search or AI search',
  job: 'Job or contract enquiry', other: 'Something else'
};
const form = document.getElementById('form');
const card = document.getElementById('card');
const boxes = [...form.querySelectorAll('input[name=issue]')];

// Pre-select what the visitor picked on the home page: report.html?issues=error,hacked
const picked = (new URLSearchParams(location.search).get('issues') || '').split(',');
boxes.forEach(b => { b.checked = picked.includes(b.value); });

// Reminder for the site owner until a real address is set
if (CONTACT_EMAIL.includes('YOUR_EMAIL')) {
  card.insertAdjacentHTML('afterbegin', '<p class="dev-note"><b>Site owner:</b> set <code>CONTACT_EMAIL</code> at the top of report.js. This note disappears once you do.</p>');
  console.warn('report.js: CONTACT_EMAIL is still the placeholder.');
}

const $ = id => document.getElementById(id);
function setErr(field, errId, msg) {
  const box = $(field), err = $(errId);
  if (box) box.classList.toggle('bad', !!msg);
  if (err) err.textContent = msg || '';
  return !msg;
}
// Clear an error as soon as the visitor fixes it
form.addEventListener('input', () => {
  if (boxes.some(b => b.checked)) $('e-issue').textContent = '';
  [['msg', 'f-msg', 'e-msg'], ['name', 'f-name', 'e-name'], ['email', 'f-email', 'e-email']].forEach(([i, f, e]) => {
    if ($(i).value.trim()) setErr(f, e, '');
  });
});

form.addEventListener('submit', e => {
  e.preventDefault();
  const issues = boxes.filter(b => b.checked).map(b => LABELS[b.value]);
  const v = n => form.elements[n].value.trim();
  const checks = [
    [issues.length > 0, null, 'e-issue', 'Pick at least one option so I know where to start.', boxes[0]],
    [!!v('msg'), 'f-msg', 'e-msg', 'Please tell me a little about what you are seeing.', $('msg')],
    [!!v('name'), 'f-name', 'e-name', 'Please add your name.', $('name')],
    [/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v('email')), 'f-email', 'e-email', 'Please enter a valid email address.', $('email')]
  ];
  let firstBad = null;
  checks.forEach(([ok, f, er, msg, el]) => {
    setErr(f, er, ok ? '' : msg);
    if (!ok && !firstBad) firstBad = el;
  });
  if (firstBad) { firstBad.focus(); return; }

  const urgency = form.elements.urgency.value;
  const text = [
    'New issue report from teganomasinde.blog', '',
    'Problem(s): ' + issues.join('; '),
    'Website: ' + (v('site') || 'not given'),
    'Urgency: ' + urgency,
    'Name: ' + v('name'),
    'Email: ' + v('email'), '',
    'What I am seeing:', v('msg'),
    v('changed') ? '\nWhat changed just before: ' + v('changed') : ''
  ].join('\n').trim();

  const subject = 'Website help: ' + issues.join(', ');
  const mailto = 'mailto:' + CONTACT_EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(text);

  card.innerHTML =
    '<div class="done"><span class="ico"><svg class="i"><use href="#i-check"/></svg></span>' +
    '<h2>Your report is ready</h2>' +
    '<p>Press the button to open your email app with everything filled in, then hit send. No email app? Copy the message and send it to <b></b>.</p>' +
    '<div class="summary" id="sum"></div>' +
    '<div class="actions" style="justify-content:center">' +
    '<a class="btn solid" id="mail" href="#">Open my email app</a>' +
    '<button class="btn line" type="button" id="copy">Copy message</button></div>' +
    '<p class="small"><a href="report.html">Start a new report</a></p></div>';
  card.querySelector('b').textContent = CONTACT_EMAIL;
  $('sum').textContent = text;
  $('mail').href = mailto;
  $('copy').addEventListener('click', async ev => {
    try { await navigator.clipboard.writeText(text); } catch (_) {
      const t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select();
      try { document.execCommand('copy'); } catch (__) { } t.remove();
    }
    ev.target.textContent = 'Copied';
  });
  card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  card.querySelector('h2').setAttribute('tabindex', '-1');
  card.querySelector('h2').focus({ preventScroll: true });
});
