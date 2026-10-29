// Feature module (web recipe, src/main.ts): asks to keep browser data and mounts the example list.
import project from '../../project.json';
import { requestPersistence } from '../data/store';
import { mountEntries } from '../entries';

void requestPersistence();

export const mount = (root: HTMLElement) => mountEntries(root, project.name);
