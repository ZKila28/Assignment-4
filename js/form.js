/* ==========================================================================
   form.js — Booking & registration form (contact.html)
   Vanilla ES6, IIFE-scoped, no globals.

   STRATEGY
   - HTML validation attributes (required/pattern/min/max/…) remain in the
     markup as the first line of defence and keep protecting the form if
     JavaScript never runs (native bubble messages).
   - When JS runs we set novalidate and take over messaging, so every error
     is a plain-English sentence beside its field, programmatically linked
     via aria-describedby + aria-invalid — no colour-only signalling (each
     message starts with "Error:" and is repeated in the summary).
   - When validation runs:
       · submit  → all fields; failures build a focusable error summary
       · change  → always (user just acted on that control)
       · input   → only fields ALREADY in error, so messages clear the
                   moment they are fixed without nagging while typing
       · blur    → filled fields, or any field after a failed submit
   - Business rules beyond HTML: date not in the past, date must fall on an
     open day (Thu/Sat/Sun), phone shape, participants 1–6.
   - Success: the form is replaced by a focused confirmation panel that
     echoes the request back. (No backend in this assessment — see README.)
   ========================================================================== */
(function () {
  'use strict';

  const form = document.getElementById('booking-request');
  if (!form) return; // guard: this file only works on contact.html

  // JS owns error UI from here on. Added via JS so non-JS users keep native validation.
  form.setAttribute('novalidate', '');

  const summary = document.getElementById('error-summary');
  const summaryList = document.getElementById('error-list');
  const successPanel = document.getElementById('form-success');
  const successDetail = document.getElementById('form-success-detail');
  const resetButton = document.getElementById('reset-form');

  const OPEN_WEEKDAYS = [0, 4, 6]; // Date.getDay(): 0 Sun, 4 Thu, 6 Sat
  let submitAttempted = false;     // blur-validation is gentler before first submit

  /* ---- field registry -------------------------------------------------- */
  const FIELDS = [
    { id: 'full-name',      label: 'Full name' },
    { id: 'email',          label: 'Email address' },
    { id: 'phone',          label: 'Phone number' },
    { id: 'booking-type',   label: 'Booking type', group: true, focusId: 'book-repair' },
    { id: 'time-slot',      label: 'Preferred time slot or course intake' },
    { id: 'preferred-date', label: 'Preferred date' },
    { id: 'participants',   label: 'Number of people' },
    { id: 'safety',         label: 'Safety rules confirmation', focusId: 'safety' },
  ];

  /* ---- validators: return '' when valid, otherwise an error message ----- */
  const validators = {
    'full-name': (v) => v.trim().length >= 2
      ? '' : 'Error: enter your full name (at least 2 characters).',

    'email': (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())
      ? '' : 'Error: enter an email address in the standard format, like name@example.com.',

    'phone': (v) => /^[0-9()+ -]{8,15}$/.test(v.trim())
      ? '' : 'Error: enter a phone number with 8 to 15 digits. Spaces, brackets, + and hyphens are allowed.',

    'booking-type': () => form.querySelector('input[name="booking-type"]:checked')
      ? '' : 'Error: choose what you would like to book.',

    'time-slot': (v) => v !== ''
      ? '' : 'Error: choose a session or course intake.',

    'preferred-date': (v) => {
      if (v === '') return 'Error: choose your preferred date.';
      const chosen = new Date(`${v}T00:00:00`); // local midnight — avoids UTC off-by-one
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (chosen < today) return 'Error: the date cannot be in the past.';
      if (!OPEN_WEEKDAYS.includes(chosen.getDay())) {
        return 'Error: the workshop is only open Thursday, Saturday and Sunday. Please choose one of those days.';
      }
      return '';
    },

    'participants': (v) => {
      const n = Number(v);
      return (Number.isInteger(n) && n >= 1 && n <= 6)
        ? '' : 'Error: enter a number of people between 1 and 6 (call us for group bookings).';
    },

    'safety': () => document.getElementById('safety').checked
      ? '' : 'Error: tick the box to confirm you have read the safety rules.',
  };

  /* ---- error display helpers -------------------------------------------- */

  // A "field" may be one input or a radio group — normalise to an element list.
  function controlsFor(field) {
    return field.group
      ? Array.from(form.querySelectorAll('input[name="booking-type"]'))
      : [document.getElementById(field.id)];
  }

  // Remember each control's original aria-describedby (some fields have
  // hints) so it can be restored byte-for-byte when the error clears.
  function rememberDescribedBy(field) {
    controlsFor(field).forEach((el) => {
      if (el && el.dataset.originalDescribedby === undefined) {
        el.dataset.originalDescribedby = el.getAttribute('aria-describedby') || '';
      }
    });
  }

  function setError(field, message) {
    const box = document.getElementById(`${field.id}-error`);
    controlsFor(field).forEach((el) => {
      if (!el) return;
      el.setAttribute('aria-invalid', 'true');
      const base = el.dataset.originalDescribedby || '';
      el.setAttribute('aria-describedby', `${base} ${box.id}`.trim());
    });
    box.textContent = message;
    box.hidden = false;
  }

  function clearError(field) {
    const box = document.getElementById(`${field.id}-error`);
    controlsFor(field).forEach((el) => {
      if (!el) return;
      el.removeAttribute('aria-invalid');
      const base = el.dataset.originalDescribedby || '';
      if (base) el.setAttribute('aria-describedby', base);
      else el.removeAttribute('aria-describedby');
    });
    box.textContent = '';
    box.hidden = true;
  }

  function validateField(field) {
    const control = document.getElementById(field.id);
    const message = validators[field.id](control ? control.value : '');
    if (message) setError(field, message);
    else clearError(field);
    return message;
  }

  /* ---- wire up per-field events ------------------------------------------ */
  FIELDS.forEach((field) => {
    rememberDescribedBy(field);

    if (field.group) {
      controlsFor(field).forEach((el) => {
        el.addEventListener('change', () => validateField(field));
      });
      return;
    }

    const el = document.getElementById(field.id);

    el.addEventListener('change', () => validateField(field));

    el.addEventListener('input', () => {
      // Live re-check ONLY while the field is in error (clear-as-you-fix).
      if (el.getAttribute('aria-invalid') === 'true') validateField(field);
    });

    el.addEventListener('blur', () => {
      // Don't scold people for tabbing through untouched fields — but after
      // a failed submit, every blur re-checks so guidance stays current.
      if (el.value !== '' || submitAttempted) validateField(field);
    });
  });

  /* ---- error summary ------------------------------------------------------ */
  function renderSummary(failures) {
    summaryList.innerHTML = '';
    failures.forEach(({ field, message }) => {
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.href = `#${field.focusId || field.id}`;
      link.textContent = message.replace(/^Error: /, '');
      link.addEventListener('click', (event) => {
        event.preventDefault();
        document.getElementById(field.focusId || field.id).focus();
      });
      li.appendChild(link);
      summaryList.appendChild(li);
    });
  }

  /* ---- dynamic constraints & character counter ----------------------------- */
  const dateInput = document.getElementById('preferred-date');
  const now = new Date();
  // Local YYYY-MM-DD (toISOString() is UTC and could set "today" to yesterday
  // for users west of Greenwich). Native min + JS rule together.
  const isoToday = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString().slice(0, 10);
  dateInput.min = isoToday;

  const messageField = document.getElementById('message');
  const charCount = document.getElementById('message-count');   // visual, aria-hidden
  const charLive = document.getElementById('message-limit');    // polite live region
  const MAX_MESSAGE = Number(messageField.getAttribute('maxlength')) || 600;

  messageField.addEventListener('input', () => {
    const remaining = MAX_MESSAGE - messageField.value.length;
    charCount.textContent = `${messageField.value.length} of ${MAX_MESSAGE} characters used`;

    // The live region only speaks at meaningful thresholds — announcing every
    // keystroke would make the form unbearable with a screen reader.
    if (remaining === 0) {
      charLive.textContent = 'Character limit reached.';
    } else if (remaining <= 50 && charLive.textContent === '') {
      charLive.textContent = `${remaining} characters remaining.`;
    } else if (remaining > 50) {
      charLive.textContent = '';
    }
  });

  /* ---- submit & success ----------------------------------------------------- */
  form.addEventListener('submit', (event) => {
    event.preventDefault(); // no backend in this assessment — see README

    submitAttempted = true;
    const failures = [];
    FIELDS.forEach((field) => {
      const msg = validateField(field);
      if (msg) failures.push({ field, message: msg });
    });

    if (failures.length > 0) {
      renderSummary(failures);
      summary.hidden = false;
      summary.focus(); // keyboard + screen reader users land on the fix-it list
      return;
    }

    summary.hidden = true;
    successDetail.textContent = buildConfirmation();
    form.hidden = true;
    successPanel.hidden = false;
    successPanel.focus();
  });

  function buildConfirmation() {
    const name = document.getElementById('full-name').value.trim();
    const radio = form.querySelector('input[name="booking-type"]:checked');
    const typeLabel = radio
      ? radio.parentElement.querySelector('label').textContent.toLowerCase()
      : 'booking';
    const select = document.getElementById('time-slot');
    const slotLabel = select.options[select.selectedIndex].text;
    const people = document.getElementById('participants').value;
    const dateValue = document.getElementById('preferred-date').value;
    const dateLabel = new Date(`${dateValue}T00:00:00`)
      .toLocaleDateString('en-AU', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      });

    return `Thanks ${name} — we have logged your request for a ${typeLabel} ` +
      `(${slotLabel}) on ${dateLabel} for ${people} ` +
      `${people === '1' ? 'person' : 'people'}. ` +
      'We will confirm by phone or email within two working days.';
  }

  if (resetButton) {
    resetButton.addEventListener('click', () => {
      form.reset();
      FIELDS.forEach(clearError);
      summary.hidden = true;
      successPanel.hidden = true;
      form.hidden = false;
      submitAttempted = false;
      charCount.textContent = `0 of ${MAX_MESSAGE} characters used`;
      charLive.textContent = '';
      document.getElementById('full-name').focus();
    });
  }
})();