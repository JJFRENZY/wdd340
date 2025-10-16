'use strict';

// Enables the Update button once the user changes any field.
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('updateForm');
  if (!form) return;

  const btn = form.querySelector('button[type="submit"]');
  if (!btn) return;

  const enable = () => btn.removeAttribute('disabled');

  // Enable on first input or change, then stop listening
  form.addEventListener('input', enable, { once: true });
  form.addEventListener('change', enable, { once: true });
});
