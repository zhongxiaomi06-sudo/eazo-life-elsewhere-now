import { describe, expect, it } from 'vitest';
import {
  addComment,
  commentsFor,
  exportComments,
  isInspectorEnabled,
  loadComments,
  removeComment,
  STORAGE_KEY,
  type CommentStore,
} from './preview-inspector';

function memoryStore(): CommentStore {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
  };
}

describe('preview inspector activation', () => {
  it('enables only with inspector=1', () => {
    expect(isInspectorEnabled('')).toBe(false);
    expect(isInspectorEnabled('?inspector=1')).toBe(true);
    expect(isInspectorEnabled('?from=share&inspector=1')).toBe(true);
    expect(isInspectorEnabled('?inspector=2')).toBe(false);
    expect(isInspectorEnabled('?inspector=1&foo=1')).toBe(true);
  });
});

describe('preview inspector comment store', () => {
  it('persists comments keyed by selector', () => {
    const store = memoryStore();
    const added = addComment('main > .scene-canvas', 'DIV.scene-canvas', '图片可以再大一点', store);
    expect(added.id).toBeTruthy();
    expect(added.selector).toBe('main > .scene-canvas');
    expect(commentsFor('main > .scene-canvas', store)).toHaveLength(1);
    expect(loadComments(store)[0]?.text).toBe('图片可以再大一点');
  });

  it('filters by selector and removes by id', () => {
    const store = memoryStore();
    addComment('a', 'X', 'one', store);
    const second = addComment('b', 'Y', 'two', store);
    addComment('a', 'X', 'three', store);
    expect(commentsFor('a', store)).toHaveLength(2);
    expect(commentsFor('b', store)).toHaveLength(1);
    removeComment(second.id, store);
    expect(commentsFor('b', store)).toHaveLength(0);
    expect(commentsFor('a', store)).toHaveLength(2);
  });

  it('exportComments produces stable JSON', () => {
    const store = memoryStore();
    addComment('x', 'X', 'hi', store);
    const parsed: unknown = JSON.parse(exportComments(store));
    expect(Array.isArray(parsed)).toBe(true);
    expect((parsed as Array<{ text: string }>)[0]?.text).toBe('hi');
  });

  it('survives corrupt or missing storage', () => {
    const store = memoryStore();
    expect(loadComments(store)).toEqual([]);
    store.setItem(STORAGE_KEY, '{broken');
    expect(loadComments(store)).toEqual([]);
    store.setItem(STORAGE_KEY, JSON.stringify({ not: 'an array' }));
    expect(loadComments(store)).toEqual([]);
  });
});
