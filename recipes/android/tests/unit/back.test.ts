import { describe, expect, it } from 'vitest';
import { back, handleBack, setBackLayers, type Layer } from '../../src/back';

// A fake screen: what is open, in the order mountApp lists it, and a log of what back closed.
function screen(open: string[]) {
  const closed: string[] = [];
  const layer = (name: string): Layer => ({
    open: () => open.includes(name),
    close: () => {
      closed.push(name);
      open.splice(open.indexOf(name), 1);
    },
  });
  const layers = ['menu', 'reward', 'sheet', 'month'].map(layer);
  return { press: () => back(layers), closed };
}

describe('the back gesture', () => {
  it('closes one thing per press, the topmost first, then leaves', () => {
    const s = screen(['month', 'sheet', 'menu']);
    expect([s.press(), s.press(), s.press(), s.press()]).toEqual([true, true, true, false]);
    expect(s.closed).toEqual(['menu', 'sheet', 'month']);
  });

  it('closes the reward popup before the open month', () => {
    const s = screen(['month', 'reward']);
    s.press();
    expect(s.closed).toEqual(['reward']);
  });

  it('leaves at once when nothing is open', () => {
    const s = screen([]);
    expect(s.press()).toBe(false);
    expect(s.closed).toEqual([]);
  });
});

describe('the layers an app registers', () => {
  it('asks for the list on every press, and reports that nothing was open', () => {
    const open = ['sheet'];
    setBackLayers(() => [{ open: () => open.includes('sheet'), close: () => open.splice(0) }]);
    expect(handleBack()).toBe(true);
    expect(handleBack()).toBe(false);
  });
});
