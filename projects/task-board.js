(() => {
  const storageKey = 'swikar-task-board-v1';
  const form = document.querySelector('#task-form');
  const input = document.querySelector('#task-input');
  const list = document.querySelector('#task-list');
  const empty = document.querySelector('#task-empty');
  const count = document.querySelector('#task-count');
  const status = document.querySelector('#task-status');
  const filters = document.querySelectorAll('[data-filter]');
  let activeFilter = 'all';
  let storageAvailable = true;
  let tasks = [];

  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed) || parsed.some(task =>
        !task || typeof task.id !== 'string' || typeof task.text !== 'string' || typeof task.done !== 'boolean'
      )) throw new Error('Saved task data has an unexpected format.');
      tasks = parsed;
    }
  } catch (error) {
    status.textContent = 'Saved tasks could not be read. This session will work, but tasks may not persist.';
    status.dataset.kind = 'error';
    console.error('Could not load saved tasks.', error);
    tasks = [];
  }

  function saveTasks() {
    if (!storageAvailable) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(tasks));
    } catch (error) {
      storageAvailable = false;
      status.textContent = 'Browser storage is unavailable. Tasks will remain only until this page is closed.';
      status.dataset.kind = 'error';
      console.error('Could not save tasks.', error);
    }
  }

  function makeId() {
    return typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  }

  function render() {
    list.replaceChildren();
    const visibleTasks = tasks.filter(task => activeFilter === 'all' ||
      (activeFilter === 'active' ? !task.done : task.done));
    for (const task of visibleTasks) {
      const item = document.createElement('li');
      item.className = `task-item${task.done ? ' is-done' : ''}`;
      item.dataset.id = task.id;

      const checkbox = document.createElement('input');
      checkbox.className = 'task-checkbox';
      checkbox.type = 'checkbox';
      checkbox.checked = task.done;
      checkbox.setAttribute('aria-label', `Mark "${task.text}" ${task.done ? 'to do' : 'done'}`);

      const text = document.createElement('span');
      text.className = 'task-text';
      text.textContent = task.text;

      const remove = document.createElement('button');
      remove.className = 'demo-button delete-task';
      remove.type = 'button';
      remove.dataset.delete = '';
      remove.textContent = 'Delete';
      remove.setAttribute('aria-label', `Delete "${task.text}"`);

      item.append(checkbox, text, remove);
      list.append(item);
    }
    const remaining = tasks.filter(task => !task.done).length;
    count.textContent = `${remaining} to do · ${tasks.length} total`;
    empty.hidden = visibleTasks.length > 0;
    if (visibleTasks.length === 0 && tasks.length > 0) {
      empty.querySelector('strong').textContent = activeFilter === 'done' ? 'No completed tasks yet.' : 'All caught up.';
      empty.querySelector('span').textContent = activeFilter === 'done'
        ? 'Completed tasks will show up here.' : 'There are no tasks left in this view.';
    } else {
      empty.querySelector('strong').textContent = 'Your next win starts here.';
      empty.querySelector('span').textContent = 'Add a task above and it will appear in your list.';
    }
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) {
      input.setCustomValidity('Enter a task before adding it.');
      input.reportValidity();
      input.setCustomValidity('');
      return;
    }
    tasks.unshift({ id: makeId(), text, done: false });
    saveTasks();
    activeFilter = 'all';
    filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === 'all')));
    form.reset();
    input.focus();
    render();
  });

  filters.forEach(button => button.addEventListener('click', () => {
    activeFilter = button.dataset.filter;
    filters.forEach(filter => filter.setAttribute('aria-pressed', String(filter === button)));
    render();
  }));

  list.addEventListener('change', event => {
    const checkbox = event.target.closest('.task-checkbox');
    const item = checkbox?.closest('.task-item');
    if (!item) return;
    tasks = tasks.map(task => task.id === item.dataset.id ? { ...task, done: checkbox.checked } : task);
    saveTasks();
    render();
  });

  list.addEventListener('click', event => {
    const button = event.target.closest('[data-delete]');
    const item = button?.closest('.task-item');
    if (!item) return;
    tasks = tasks.filter(task => task.id !== item.dataset.id);
    saveTasks();
    render();
  });

  render();
})();
