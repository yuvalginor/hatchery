// Example app: a list of entries saved in the browser, with export and import.
// Replace it with the project. Keep the data rules in src/data/schema.ts.
import './entries.css';
import { el } from './dom';
import type { AppData } from './data/schema';
import { loadData, saveData } from './data/store';
import { download, parse } from './data/transfer';

export async function mountEntries(root: HTMLElement, appName: string): Promise<void> {
  let data: AppData = await loadData();
  const list = el('ul', { class: 'entries', 'aria-label': 'Entries' });
  const status = el('p', { class: 'status', role: 'status' });

  const render = () => {
    list.replaceChildren(
      ...data.entries.map((entry) =>
        el('li', {}, el('span', {}, entry.text), el('button', { type: 'button', 'aria-label': `Delete ${entry.text}`, onclick: () => remove(entry.id) }, 'Delete')),
      ),
    );
    if (!data.entries.length) list.append(el('li', { class: 'empty' }, 'Nothing yet.'));
  };

  const commit = async (next: AppData, message: string) => {
    await saveData(next);
    data = next;
    status.textContent = message;
    render();
  };

  const remove = (id: string) => commit({ ...data, entries: data.entries.filter((e) => e.id !== id) }, 'Deleted.');

  const input = el('input', { name: 'text', required: true, maxlength: '200', autocomplete: 'off', 'aria-label': 'New entry' });
  const form = el('form', { class: 'add' }, input, el('button', { type: 'submit' }, 'Add'));
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const entry = { id: crypto.randomUUID(), text: input.value.trim(), createdAt: new Date().toISOString() };
    if (!entry.text) return;
    form.reset();
    void commit({ ...data, entries: [...data.entries, entry] }, 'Saved.');
  });

  const file = el('input', { type: 'file', accept: 'application/json,.json', hidden: true });
  file.addEventListener('change', async () => {
    const chosen = file.files?.[0];
    file.value = '';
    if (!chosen) return;
    try {
      const imported = parse(await chosen.text());
      if (!confirm(`Replace ${data.entries.length} entries with ${imported.entries.length} from the file?`)) return;
      await commit(imported, 'Imported.');
    } catch (error) {
      status.textContent = `Import failed: ${(error as Error).message}`;
    }
  });

  root.replaceChildren(
    form,
    list,
    el(
      'div',
      { class: 'tools' },
      el('button', { type: 'button', onclick: () => download(data, appName) }, 'Export'),
      el('button', { type: 'button', onclick: () => file.click() }, 'Import'),
      file,
    ),
    status,
    el('p', { class: 'lede' }, 'Data stays in this browser. Export it to keep a copy.'),
  );
  render();
}
