window.addEventListener("click", (e) => {
  if (e.target.tagName === "A") {
    e.preventDefault();
    window.parent.postMessage({ type: "navigate", href: e.target.href }, "*");
  }
});

window.addEventListener("submit", (e) => {
  if (e.target.tagName === "FORM") {
    e.preventDefault();
    const formData = new FormData(e.target);
    const queryParams = new URLSearchParams(formData).toString();
    const newHref = `${e.target.action}?${queryParams}`;
    window.parent.postMessage({ type: "navigate", href: newHref }, "*");
  }
});
