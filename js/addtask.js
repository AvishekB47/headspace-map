export function attachAddTask(apiToken, onSuccess) {
  const dialog    = document.getElementById("at-dialog");
  const openBtn   = document.getElementById("at-open-btn");
  const cancelBtn = document.getElementById("at-cancel");
  const submitBtn = document.getElementById("at-submit");
  const content   = document.getElementById("at-content");
  const category  = document.getElementById("at-category");
  const priority  = document.getElementById("at-priority");
  const due       = document.getElementById("at-due");
  const status    = document.getElementById("at-status");

  function open() {
    content.value = "";
    due.value = "";
    status.textContent = "";
    submitBtn.disabled = false;
    dialog.classList.remove("hidden");
    content.focus();
  }

  function close() {
    dialog.classList.add("hidden");
  }

  openBtn.addEventListener("click", open);
  cancelBtn.addEventListener("click", close);
  dialog.addEventListener("click", e => { if (e.target === dialog) close(); });

  content.addEventListener("keydown", e => {
    if (e.key === "Enter")  submitBtn.click();
    if (e.key === "Escape") close();
  });

  submitBtn.addEventListener("click", async () => {
    const text = content.value.trim();
    if (!text) { content.focus(); return; }

    submitBtn.disabled = true;
    status.textContent = "Adding…";

    const body = {
      content: text,
      priority: parseInt(priority.value),
      labels: [category.value]
    };
    if (due.value) body.due_date = due.value;

    try {
      const res = await fetch("/proxy/tasks", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error(`Todoist ${res.status}`);
      close();
      await onSuccess();
    } catch (e) {
      status.textContent = e.message;
      submitBtn.disabled = false;
    }
  });
}
