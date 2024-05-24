window.addEventListener("click", (e) => {
  if (e.target.tagName === "A") {
    e.preventDefault();
    window.parent.postMessage({ type: "linkClick", href: e.target.href }, "*");
  }
});
