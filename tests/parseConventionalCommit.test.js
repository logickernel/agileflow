'use strict';

const { parseConventionalCommit } = require('../src/utils');

describe('parseConventionalCommit', () => {
  describe('valid commits without scope', () => {
    test('feat: description', () => {
      expect(parseConventionalCommit('feat: add login button')).toEqual({
        type: 'feat',
        breaking: false,
        scope: '',
        description: 'add login button',
      });
    });

    test('fix: description', () => {
      expect(parseConventionalCommit('fix: handle null pointer')).toEqual({
        type: 'fix',
        breaking: false,
        scope: '',
        description: 'handle null pointer',
      });
    });

    test('type is lowercased', () => {
      expect(parseConventionalCommit('FEAT: something')).toMatchObject({ type: 'feat' });
    });
  });

  describe('valid commits with scope', () => {
    test('fix(logger): description', () => {
      expect(parseConventionalCommit('fix(logger): handle null pointer')).toEqual({
        type: 'fix',
        breaking: false,
        scope: 'logger',
        description: 'handle null pointer',
      });
    });

    test('feat(auth): description', () => {
      expect(parseConventionalCommit('feat(auth): add OAuth2 support')).toEqual({
        type: 'feat',
        breaking: false,
        scope: 'auth',
        description: 'add OAuth2 support',
      });
    });

    test('scope with hyphens', () => {
      expect(parseConventionalCommit('fix(my-module): something')).toMatchObject({
        scope: 'my-module',
      });
    });
  });

  describe('breaking changes', () => {
    test('feat!: breaking without scope', () => {
      expect(parseConventionalCommit('feat!: remove deprecated API')).toEqual({
        type: 'feat',
        breaking: true,
        scope: '',
        description: 'remove deprecated API',
      });
    });

    test('fix(logger)!: breaking with scope', () => {
      expect(parseConventionalCommit('fix(logger)!: change log format')).toEqual({
        type: 'fix',
        breaking: true,
        scope: 'logger',
        description: 'change log format',
      });
    });

    test('feat(auth)!: breaking with scope', () => {
      expect(parseConventionalCommit('feat(auth)!: drop password auth')).toEqual({
        type: 'feat',
        breaking: true,
        scope: 'auth',
        description: 'drop password auth',
      });
    });
  });

  describe('multiline messages', () => {
    test('only first line is parsed', () => {
      const message = 'fix: correct typo\n\nThis fixes the typo in the README.';
      expect(parseConventionalCommit(message)).toMatchObject({
        type: 'fix',
        description: 'correct typo',
      });
    });

    test('scoped breaking on first line with body', () => {
      const message = 'feat(api)!: new response shape\n\nBREAKING CHANGE: field renamed.';
      expect(parseConventionalCommit(message)).toMatchObject({
        type: 'feat',
        scope: 'api',
        breaking: true,
      });
    });
  });

  describe('invalid / non-conventional commits', () => {
    test('returns null for free-form message', () => {
      expect(parseConventionalCommit('Update readme')).toBeNull();
    });

    test('returns null for missing colon', () => {
      expect(parseConventionalCommit('feat add button')).toBeNull();
    });

    test('returns null for empty string', () => {
      expect(parseConventionalCommit('')).toBeNull();
    });

    test('returns null for null', () => {
      expect(parseConventionalCommit(null)).toBeNull();
    });

    test('returns null for missing description after colon', () => {
      expect(parseConventionalCommit('fix: ')).toBeNull();
    });
  });
});
