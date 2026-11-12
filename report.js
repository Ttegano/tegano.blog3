/* Report form.
   Option A (recommended): connect a free form service so reports arrive in your inbox without the
   visitor needing an email app. Create a form at https://formspree.io, then paste its address below,
   for example 'https://formspree.io/f/abcdwxyz'.
   Option B (used while FORMSPREE_ENDPOINT is empty, and as a fallback if sending fails): the visitor's
   email app opens with the report filled in, and there is a Copy button. */
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mljbdlrz';
const CONTACT_EMAIL = 'support@softwarebreaks.online';

const LABELS = {
  audit: 'Emergency security audit', error: 'Error or blank screen', hacked: "I think I've been hacked",
  update: 'Broke after an update', slow: 'Very slow', login: "Can't log in",
  visibility: 'Not showing on google search or AI search',
  job: 'Job or contract enquiry', other: 'Something else'
};
const form = document.getElementById('form');
const card = document.getElementById('card');
const boxes = [...form.querySelectorAll('input[name=issue]')];
const $ = id => document.getElementById(id);

// Pre-select what the visitor picked on the home page: report.html?issues=error,hacked
const picked = (new URLSearchParams(location.search).get('issues') || '').split(',');
boxes.forEach(b => { b.checked = picked.includes(b.value); });

// Reminder for the site owner, only while testing on your own computer
if (!FORMSPREE_ENDPOINT && ['localhost', '127.0.0.1', ''].includes(location.hostname)) {
  card.insertAdjacentHTML('afterbegin', '<p class="dev-note"><b>Site owner:</b> reports currently open the visitor\'s email app. To receive them directly, set <code>FORMSPREE_ENDPOINT</code> at the top of report.js.</p>');
}

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

function done(html) {
  card.innerHTML = html;
  card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const h = card.querySelector('h2');
  h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true });
}
async function copy(text, btn) {
  try { await navigator.clipboard.writeText(text); } catch (_) {
    const t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select();
    try { document.execCommand('copy'); } catch (__) { } t.remove();
  }
  btn.textContent = 'Copied';
}
// Shown when the email-app route is used (no form service set up, or sending failed)
function emailView(text, subject, failed) {
  const mailto = 'mailto:' + CONTACT_EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(text);
  done('<div class="done"><span class="ico"><svg class="i"><use href="#i-check"/></svg></span>' +
    '<h2>' + (failed ? 'Almost there' : 'Your report is ready') + '</h2>' +
    '<p>' + (failed ? 'Sorry, the report could not be sent from this page. ' : '') +
    'Press the button to open your email app with everything filled in, then hit send. No email app? Copy the message and send it to <b></b>.</p>' +
    '<div class="summary" id="sum"></div>' +
    '<div class="actions" style="justify-content:center">' +
    '<a class="btn solid" id="mail" href="#">Open my email app</a>' +
    '<button class="btn line" type="button" id="copy">Copy message</button></div>' +
    '<p class="small"><a href="report.html">Start a new report</a></p></div>');
  card.querySelector('b').textContent = CONTACT_EMAIL;
  $('sum').textContent = text;
  $('mail').href = mailto;
  $('copy').addEventListener('click', ev => copy(text, ev.target));
}
function sentView(text, email) {
  done('<div class="done"><span class="ico"><svg class="i"><use href="#i-check"/></svg></span>' +
    '<h2>Thank you, your report was sent</h2>' +
    '<p>I\'ll read it and reply to <b></b> with what I think is wrong and the next step.</p>' +
    '<div class="summary" id="sum"></div>' +
    '<p class="small"><a href="index.html">Back to the home page</a></p></div>');
  card.querySelector('b').textContent = email;
  $('sum').textContent = text;
}

form.addEventListener('submit', async e => {
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
    'New issue report from softwarebreaks.online', '',
    'Problem(s): ' + issues.join('; '),
    'Website: ' + (v('site') || 'not given'),
    'Urgency: ' + urgency,
    'Name: ' + v('name'),
    'Email: ' + v('email'), '',
    'What I am seeing:', v('msg'),
    v('changed') ? '\nWhat changed just before: ' + v('changed') : ''
  ].join('\n').trim();
  const subject = 'Website help: ' + issues.join(', ');

  if (form.elements._gotcha.value) { sentView(text, v('email')); return; }   // a bot filled the hidden field
  if (!FORMSPREE_ENDPOINT) { emailView(text, subject, false); return; }

  //   const btn = form.querySelector('button[type=submit]');
  //   btn.disabled = true; btn.textContent = 'Sending...';
  //   try {
  //     const res = await fetch(FORMSPREE_ENDPOINT, {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
  //       body: JSON.stringify({
  //         _subject: subject, name: v('name'), email: v('email'), website: v('site'), problems: issues.join('; '),
  //         urgency, message: v('msg'), changed: v('changed')
  //       })
  //     });
  //     if (!res.ok) throw new Error('HTTP ' + res.status);
  //     sentView(text, v('email'));
  //   } catch (err) {
  //     emailView(text, subject, true);
  //   }



  const btn = form.querySelector('button[type=submit]');
  btn.disabled = true;
  btn.textContent = 'Sending...';

  // Abort the request if Formspree takes longer than 15 seconds.
  const controller = new AbortController();
  let timedOut = false;

  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, 15000);

  try {
    const res = await fetch(FORMSPREE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      signal: controller.signal,
      body: JSON.stringify({
        _subject: subject,
        name: v('name'),
        email: v('email'),
        website: v('site'),
        problems: issues.join('; '),
        urgency,
        message: v('msg'),
        changed: v('changed')
      })
    });

    if (!res.ok) {
      throw new Error('Form service returned HTTP ' + res.status);
    }

    sentView(text, v('email'));

  } catch (err) {
    console.error('Report submission failed:', err);

    emailView(text, subject, true);

    // Give the visitor a clear explanation of what happened.
    const notice = card.querySelector('.done > p');

    if (notice) {
      if (timedOut) {
        notice.textContent =
          'The request timed out after 15 seconds. Your report was not confirmed as sent. Please use the email button below to send it.';
      } else if (err.message.startsWith('Form service returned HTTP')) {
        notice.textContent =
          'The form service rejected the submission. Your report was not confirmed as sent. Please use the email button below.';
      } else {
        notice.textContent =
          'A network error prevented the submission. Check your internet connection and use the email button below to send your report.';
      }
    }

  } finally {
    clearTimeout(timeoutId);
  }

});
