import './styles.css';

// Recipes add modules to src/features/. Each runs when the page loads.
// A module that exports mount() takes over #app. Keep it to one such module.
type Feature = { mount?: (root: HTMLElement) => Promise<void> | void };
const features = import.meta.glob<Feature>('./features/*.ts', { eager: true });

const root = document.querySelector<HTMLElement>('#app');
for (const feature of Object.values(features)) {
  if (root && feature.mount) {
    Promise.resolve(feature.mount(root)).catch((error: Error) => {
      root.textContent = `Could not start: ${error.message}`;
    });
  }
}
