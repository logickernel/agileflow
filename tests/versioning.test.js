'use strict';

const { expandCommitInfo, calculateNextVersionAndChangelog } = require('../src/utils');

// Helpers
const commit = (message, tags = []) => ({ hash: 'abc1234', datetime: '', author: '', message, tags });

describe('expandCommitInfo', () => {
  test('returns empty when no commits', () => {
    expect(expandCommitInfo([])).toEqual({ latestVersion: null, commits: [] });
    expect(expandCommitInfo(null)).toEqual({ latestVersion: null, commits: [] });
  });

  test('returns all commits when no semver tag found', () => {
    const commits = [commit('feat: a'), commit('fix: b')];
    expect(expandCommitInfo(commits)).toEqual({ latestVersion: null, commits });
  });

  test('finds latest version tag and excludes the tagged commit', () => {
    const commits = [
      commit('feat: new thing'),
      commit('fix: old bug', ['v1.0.0']),
      commit('chore: init'),
    ];
    const result = expandCommitInfo(commits);
    expect(result.latestVersion).toBe('v1.0.0');
    expect(result.commits).toHaveLength(1);
    expect(result.commits[0].message).toBe('feat: new thing');
  });

  test('ignores non-semver tags', () => {
    const commits = [
      commit('feat: something'),
      commit('chore: setup', ['latest', 'stable']),
    ];
    const result = expandCommitInfo(commits);
    expect(result.latestVersion).toBeNull();
    expect(result.commits).toHaveLength(2);
  });

  test('picks highest semver when commit has multiple tags', () => {
    // v0.9.1 is alphabetically first but v1.0.0 is the higher version
    const commits = [
      commit('feat: new feature'),
      commit('chore: release', ['v0.9.1', 'v1.0.0']),
    ];
    const result = expandCommitInfo(commits);
    expect(result.latestVersion).toBe('v1.0.0');
  });

  test('picks highest semver across three tags on same commit', () => {
    const commits = [
      commit('fix: patch'),
      commit('release', ['v0.9.0', 'v1.2.0', 'v1.1.0']),
    ];
    expect(expandCommitInfo(commits).latestVersion).toBe('v1.2.0');
  });

  test('returns no commits since tag when tag is on the latest commit', () => {
    const commits = [commit('feat: init', ['v1.0.0'])];
    const result = expandCommitInfo(commits);
    expect(result.latestVersion).toBe('v1.0.0');
    expect(result.commits).toHaveLength(0);
  });
});

describe('calculateNextVersionAndChangelog', () => {
  describe('version bumping — post 1.0', () => {
    test('no commits → no bump', () => {
      const { newVersion } = calculateNextVersionAndChangelog({ latestVersion: 'v1.0.0', commits: [] });
      expect(newVersion).toBeNull();
    });

    test('fix commit → patch bump', () => {
      const { newVersion } = calculateNextVersionAndChangelog({
        latestVersion: 'v1.0.0',
        commits: [commit('fix: correct something')],
      });
      expect(newVersion).toBe('v1.0.1');
    });

    test('feat commit → minor bump', () => {
      const { newVersion } = calculateNextVersionAndChangelog({
        latestVersion: 'v1.0.0',
        commits: [commit('feat: add something')],
      });
      expect(newVersion).toBe('v1.1.0');
    });

    test('breaking change → major bump', () => {
      const { newVersion } = calculateNextVersionAndChangelog({
        latestVersion: 'v1.0.0',
        commits: [commit('feat!: remove API')],
      });
      expect(newVersion).toBe('v2.0.0');
    });

    test('breaking change with scope → major bump', () => {
      const { newVersion } = calculateNextVersionAndChangelog({
        latestVersion: 'v1.2.3',
        commits: [commit('fix(auth)!: drop session cookies')],
      });
      expect(newVersion).toBe('v2.0.0');
    });

    test('chore only → no bump', () => {
      const { newVersion } = calculateNextVersionAndChangelog({
        latestVersion: 'v1.0.0',
        commits: [commit('chore: update dependencies')],
      });
      expect(newVersion).toBeNull();
    });

    test('breaking beats feat beats fix', () => {
      const { newVersion } = calculateNextVersionAndChangelog({
        latestVersion: 'v1.0.0',
        commits: [
          commit('fix: small fix'),
          commit('feat: new thing'),
          commit('feat!: remove old API'),
        ],
      });
      expect(newVersion).toBe('v2.0.0');
    });
  });

  describe('version bumping — pre 1.0 (0.x.x)', () => {
    test('fix commit → patch bump', () => {
      const { newVersion } = calculateNextVersionAndChangelog({
        latestVersion: 'v0.5.3',
        commits: [commit('fix: small fix')],
      });
      expect(newVersion).toBe('v0.5.4');
    });

    test('feat commit → minor bump', () => {
      const { newVersion } = calculateNextVersionAndChangelog({
        latestVersion: 'v0.5.3',
        commits: [commit('feat: new feature')],
      });
      expect(newVersion).toBe('v0.6.0');
    });

    test('breaking change → minor bump (not major)', () => {
      const { newVersion } = calculateNextVersionAndChangelog({
        latestVersion: 'v0.5.3',
        commits: [commit('feat!: breaking')],
      });
      expect(newVersion).toBe('v0.6.0');
    });
  });

  describe('first version (no existing tag)', () => {
    test('feat commits → v0.1.0', () => {
      const { newVersion } = calculateNextVersionAndChangelog({
        latestVersion: null,
        commits: [commit('feat: initial feature')],
      });
      expect(newVersion).toBe('v0.1.0');
    });

    test('fix commits → v0.0.1', () => {
      const { newVersion } = calculateNextVersionAndChangelog({
        latestVersion: null,
        commits: [commit('fix: initial fix')],
      });
      expect(newVersion).toBe('v0.0.1');
    });
  });

  describe('changelog content', () => {
    test('groups commits under correct headers', () => {
      const { changelog } = calculateNextVersionAndChangelog({
        latestVersion: 'v1.0.0',
        commits: [
          commit('feat: add dark mode'),
          commit('fix: fix login bug'),
        ],
      });
      expect(changelog).toContain('Features:');
      expect(changelog).toContain('- Add dark mode');
      expect(changelog).toContain('Fixes:');
      expect(changelog).toContain('- Fix login bug');
    });

    test('breaking changes appear in a dedicated section', () => {
      const { changelog } = calculateNextVersionAndChangelog({
        latestVersion: 'v1.0.0',
        commits: [commit('feat!: remove legacy API')],
      });
      expect(changelog).toContain('BREAKING CHANGES:');
      expect(changelog).toContain('Remove legacy API');
    });

    test('scoped commit appears with scope prefix', () => {
      const { changelog } = calculateNextVersionAndChangelog({
        latestVersion: 'v1.0.0',
        commits: [commit('fix(logger): handle null')],
      });
      expect(changelog).toContain('logger: Handle null');
    });

    test('scoped breaking change with ! appears in BREAKING CHANGES', () => {
      const { changelog } = calculateNextVersionAndChangelog({
        latestVersion: 'v1.0.0',
        commits: [commit('fix(auth)!: drop basic auth')],
      });
      expect(changelog).toContain('BREAKING CHANGES:');
      expect(changelog).toContain('auth: Drop basic auth');
    });

    test('chore commits are excluded from changelog', () => {
      const { changelog } = calculateNextVersionAndChangelog({
        latestVersion: 'v1.0.0',
        commits: [
          commit('chore: update deps'),
          commit('fix: real fix'),
        ],
      });
      expect(changelog).not.toContain('update deps');
      expect(changelog).toContain('Real fix');
    });

    test('issue references are included', () => {
      const { changelog } = calculateNextVersionAndChangelog({
        latestVersion: 'v1.0.0',
        commits: [commit('fix: resolve crash (#42)')],
      });
      expect(changelog).toContain('(#42)');
    });

    test('non-conventional commits are excluded from changelog', () => {
      const { changelog } = calculateNextVersionAndChangelog({
        latestVersion: 'v1.0.0',
        commits: [
          commit('Merge branch main'),
          commit('fix: real fix'),
        ],
      });
      expect(changelog).not.toContain('Merge branch');
      expect(changelog).toContain('Real fix');
    });
  });
});
