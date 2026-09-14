(() => {
  if (document.querySelector(".site-triangle-field")) return;

  const field = document.createElement("div");
  field.className = "site-triangle-field";
  field.setAttribute("aria-hidden", "true");
  field.innerHTML = "<i></i>".repeat(14);
  document.body.prepend(field);
})();
