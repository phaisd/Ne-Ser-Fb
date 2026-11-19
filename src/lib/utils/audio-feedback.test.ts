import { describe, it, expect, vi } from 'vitest';
import { playBeep, triggerHaptic } from './audio-feedback';

describe('audio-feedback utility', () => {
  it('does not throw when playBeep is called in test environment', () => {
    expect(() => playBeep('SUCCESS')).not.toThrow();
    expect(() => playBeep('WARN')).not.toThrow();
    expect(() => playBeep('ERROR')).not.toThrow();
  });

  it('triggers navigator.vibrate when available', () => {
    const vibrateMock = vi.fn();
    Object.defineProperty(globalThis.navigator, 'vibrate', {
      value: vibrateMock,
      writable: true,
      configurable: true,
    });

    triggerHaptic('SUCCESS');
    expect(vibrateMock).toHaveBeenCalledWith(120);

    triggerHaptic('WARN');
    expect(vibrateMock).toHaveBeenCalledWith([100, 50, 100]);

    triggerHaptic('ERROR');
    expect(vibrateMock).toHaveBeenCalledWith([220, 80, 220]);
  });
});
