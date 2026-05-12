import { DATA, CATEGORY_MAP } from "./data.js";

export async function loadTodoistTasks(apiToken) {
  const res = await fetch("/proxy/tasks", {
    headers: { Authorization: `Bearer ${apiToken}` }
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Todoist API error: ${res.status}${detail ? " — " + detail : ""}`);
  }
  const payload = await res.json();
  const tasks = Array.isArray(payload) ? payload : (payload.results ?? payload.items ?? []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() + 28);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const parentIds = new Set(tasks.map(t => t.parent_id).filter(Boolean));

  DATA.length = 0;
  for (const task of tasks) {
    if (parentIds.has(task.id)) continue;
    if (task.due && task.due.date.slice(0, 10) > cutoffStr) continue;

    const categoryKey = task.labels
      .map(l => l.toLowerCase())
      .find(l => CATEGORY_MAP[l]);
    if (!categoryKey) continue;
    const cat = CATEGORY_MAP[categoryKey];
    DATA.push({
      id: task.id,
      label: task.content,
      color: cat.color,
      volume: task.priority,  // Todoist: 4=P1 (biggest), 1=P4 (smallest)
      mass: cat.mass,
      category: categoryKey
    });
  }
}
