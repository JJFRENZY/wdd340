// public/js/inv-update.js
(function () {
  const form = document.querySelector("#updateForm");
  if (!form) return;
  const btn = form.querySelector("button[type='submit']");
  if (!btn) return;

  // Start disabled (view sets disabled attribute)
  form.addEventListener("change", function () {
    btn.removeAttribute("disabled");
  });
})();
