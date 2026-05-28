import { describe, it, expect } from 'vitest';
import { validateSessionVersion, getCurrentVersion, migrateStateIfNeeded } from '../stateSerializer';
import type { SerializableViewerState } from '../../types/session';

describe('validateSessionVersion', () => {
  it('accepts matching major version', () => {
    expect(validateSessionVersion('1.0.0')).toBe(true);
  });

  it('accepts same major with different minor/patch', () => {
    expect(validateSessionVersion('1.5.3')).toBe(true);
  });

  it('rejects a higher major version', () => {
    expect(validateSessionVersion('2.0.0')).toBe(false);
  });

  it('rejects a lower major version', () => {
    expect(validateSessionVersion('0.9.0')).toBe(false);
  });
});

describe('getCurrentVersion', () => {
  it('returns a semver string', () => {
    expect(getCurrentVersion()).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('returns 1.0.0', () => {
    expect(getCurrentVersion()).toBe('1.0.0');
  });
});

describe('migrateStateIfNeeded', () => {
  it('returns the state object unchanged', () => {
    const state = { timeStep: 0 } as unknown as SerializableViewerState;
    expect(migrateStateIfNeeded(state)).toBe(state);
  });
});
