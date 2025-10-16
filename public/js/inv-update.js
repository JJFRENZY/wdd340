'use strict';

// Enables the Update button once the user changes any field.
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('updateForm');
  if (!form) return;

  const submits = Array.from(
    form.querySelectorAll('button[type="submit"], input[type="submit"]')
  );
  if (!submits.length) return;

  const setEnabled = (on) => {
    submits.forEach((btn) => {
      if (on) btn.removeAttribute('disabled');
      else btn.setAttribute('disabled', 'disabled');
    });
  };

  // Enable on first input or change, then stop listening
  const enableOnce = () => setEnabled(true);
  form.addEventListener('input', enableOnce, { once: true });
  form.addEventListener('change', enableOnce, { once: true });

  // Re-disable after successful submit (prevents double clicks)
  form.addEventListener('submit', () => setEnabled(false));

  // Re-disable if the form is reset
  form.addEventListener('reset', () => {
    // Wait for field values to actually reset
    setTimeout(() => setEnabled(false), 0);
  });
});
