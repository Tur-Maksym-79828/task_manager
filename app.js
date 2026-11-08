let config;
let editingId = null;
let tasks = [];

const form = document.getElementById('task-form');
const titleInput = document.getElementById('task-title');
const descInput = document.getElementById('task-description');
const submitBtn = document.getElementById('task-submit');
const cancelBtn = document.getElementById('task-cancel');
const listEl = document.getElementById('task-list');
const statusEl = document.getElementById('status-message');

function setStatus(msg, type) {
  statusEl.textContent = msg;
  statusEl.className = type || '';
}

async function api(path, options = {}) {
  const res = await fetch(`${config.supabaseUrl}/rest/v1/${config.tableName}${path}`, {
    ...options,
    headers: {
      apikey: config.supabasePublishableKey,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  if (!res.ok) {
    let detail = '';
    try { detail = (await res.json()).message || ''; } catch (e) {}
    throw new Error(`${res.status} ${res.statusText} ${detail}`.trim());
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function loadTasks() {
  try {
    tasks = await api('?select=*&order=id.asc');
    render();
    setStatus('');
  } catch (e) {
    setStatus('Failed to load tasks: ' + e.message, 'error');
  }
}

function render() {
  listEl.innerHTML = '';
  if (!tasks.length) {
    const p = document.createElement('p');
    p.textContent = 'No tasks yet.';
    listEl.appendChild(p);
    return;
  }
  for (const t of tasks) {
    const item = document.createElement('div');
    item.className = 'task-item' + (t.completed ? ' done' : '');
    item.dataset.id = t.id;

    const title = document.createElement('span');
    title.className = 'task-title';
    title.textContent = t.title;

    const desc = document.createElement('span');
    desc.className = 'task-description';
    desc.textContent = t.description || '';

    const status = document.createElement('span');
    status.className = 'task-status';
    status.textContent = t.completed ? 'Completed' : 'Incomplete';

    const actions = document.createElement('div');
    actions.className = 'actions';
    actions.append(
      button('toggle-task', t.completed ? 'Mark incomplete' : 'Mark complete'),
      button('edit-task', 'Edit'),
      button('delete-task', 'Delete')
    );

    item.append(title, desc, status, actions);
    listEl.appendChild(item);
  }
}

function button(cls, text) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = cls;
  b.textContent = text;
  return b;
}

function resetForm() {
  editingId = null;
  form.reset();
  submitBtn.textContent = 'Add task';
  cancelBtn.hidden = true;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = titleInput.value.trim();
  const description = descInput.value.trim();
  if (!title) return;
  try {
    if (editingId === null) {
      await api('', { method: 'POST', body: JSON.stringify({ title, description, completed: false }) });
      setStatus('Task added.', 'ok');
    } else {
      await api(`?id=eq.${editingId}`, { method: 'PATCH', body: JSON.stringify({ title, description }) });
      setStatus('Task updated.', 'ok');
    }
    resetForm();
    await loadTasks();
    if (statusEl.textContent === '') setStatus('Saved.', 'ok');
  } catch (err) {
    setStatus('Operation failed: ' + err.message, 'error');
  }
});

cancelBtn.addEventListener('click', resetForm);

listEl.addEventListener('click', async (e) => {
  const btn = e.target.closest('button');
  const item = e.target.closest('.task-item');
  if (!btn || !item) return;
  const id = Number(item.dataset.id);
  const task = tasks.find(t => t.id === id);
  try {
    if (btn.classList.contains('delete-task')) {
      await api(`?id=eq.${id}`, { method: 'DELETE' });
      if (editingId === id) resetForm();
      await loadTasks();
      setStatus('Task deleted.', 'ok');
    } else if (btn.classList.contains('toggle-task')) {
      await api(`?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify({ completed: !task.completed }) });
      await loadTasks();
      setStatus('Status changed.', 'ok');
    } else if (btn.classList.contains('edit-task')) {
      editingId = id;
      titleInput.value = task.title;
      descInput.value = task.description || '';
      submitBtn.textContent = 'Save changes';
      cancelBtn.hidden = false;
      titleInput.focus();
    }
  } catch (err) {
    setStatus('Operation failed: ' + err.message, 'error');
  }
});

(async function init() {
  try {
    const res = await fetch('config.json');
    if (!res.ok) throw new Error('config.json not found');
    config = await res.json();
  } catch (e) {
    setStatus('Could not load config.json: ' + e.message, 'error');
    return;
  }
  loadTasks();
})();
