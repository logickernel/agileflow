'use strict';

jest.mock('child_process', () => ({ execSync: jest.fn() }));
jest.mock('fs', () => ({ writeFileSync: jest.fn(), unlinkSync: jest.fn() }));
jest.mock('os', () => ({ tmpdir: () => '/tmp' }));
jest.mock('crypto', () => ({ randomBytes: () => ({ toString: () => 'deadbeef' }) }));

const { execSync } = require('child_process');
const { getAllBranchCommits, getCurrentBranch, fetchTags, ensureGitRepo } = require('../src/utils');
const { pushTag } = require('../src/git-push');

// Record separator and commit separator matching utils.js
const RS = '\x1E';
const CS = `${RS}${RS}`;

/** Build a git log block the way git would output it for one commit. */
function logBlock(hash, datetime, author, message) {
  return `${hash}${RS}${datetime}${RS}${author}${RS}${message}`;
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// pushTag (git-push.js)
// ---------------------------------------------------------------------------
describe('pushTag', () => {
  test('pushes to origin by default', async () => {
    execSync.mockReturnValue('');
    await pushTag('v1.2.3', 'changelog');
    const pushCall = execSync.mock.calls.find(c => c[0].includes('git push'));
    expect(pushCall[0]).toContain('"origin"');
    expect(pushCall[0]).toContain('"v1.2.3"');
  });

  test('pushes to custom remote when specified', async () => {
    execSync.mockReturnValue('');
    await pushTag('v1.2.3', 'changelog', false, 'upstream');
    const pushCall = execSync.mock.calls.find(c => c[0].includes('git push'));
    expect(pushCall[0]).toContain('"upstream"');
    expect(pushCall[0]).toContain('"v1.2.3"');
  });
});

// ---------------------------------------------------------------------------
// ensureGitRepo
// ---------------------------------------------------------------------------
describe('ensureGitRepo', () => {
  test('does not throw when inside a git repo', () => {
    execSync.mockReturnValueOnce('true\n');
    expect(() => ensureGitRepo()).not.toThrow();
  });

  test('throws when not inside a git repo', () => {
    execSync.mockImplementationOnce(() => { throw new Error('not a git repo'); });
    expect(() => ensureGitRepo()).toThrow('not a git repository');
  });
});

// ---------------------------------------------------------------------------
// getCurrentBranch
// ---------------------------------------------------------------------------
describe('getCurrentBranch', () => {
  test('returns branch name from git', () => {
    execSync.mockReturnValueOnce('main\n');
    expect(getCurrentBranch()).toBe('main');
  });

  test('falls back to CI_COMMIT_BRANCH when in detached HEAD state', () => {
    execSync.mockReturnValueOnce('\n'); // git branch --show-current returns empty
    process.env.CI_COMMIT_BRANCH = 'release/1.0';
    expect(getCurrentBranch()).toBe('release/1.0');
    delete process.env.CI_COMMIT_BRANCH;
  });

  test('falls back to GITHUB_REF_NAME when in detached HEAD state', () => {
    execSync.mockReturnValueOnce('\n');
    process.env.GITHUB_REF_NAME = 'main';
    expect(getCurrentBranch()).toBe('main');
    delete process.env.GITHUB_REF_NAME;
  });

  test('throws when detached HEAD and no CI env var', () => {
    delete process.env.CI_COMMIT_BRANCH;
    delete process.env.CI_COMMIT_REF_NAME;
    delete process.env.GITHUB_REF_NAME;
    execSync.mockReturnValueOnce('\n');
    expect(() => getCurrentBranch()).toThrow('detached HEAD');
  });
});

// ---------------------------------------------------------------------------
// fetchTags
// ---------------------------------------------------------------------------
describe('fetchTags', () => {
  test('returns true when fetch succeeds', () => {
    execSync.mockReturnValueOnce('origin\n'); // git remote
    execSync.mockReturnValueOnce('');          // git fetch
    expect(fetchTags()).toBe(true);
  });

  test('returns false when no remotes configured', () => {
    execSync.mockReturnValueOnce(''); // git remote returns empty
    expect(fetchTags()).toBe(false);
  });

  test('returns false when fetch throws', () => {
    execSync.mockReturnValueOnce('origin\n');
    execSync.mockImplementationOnce(() => { throw new Error('network error'); });
    expect(fetchTags()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getAllBranchCommits
// ---------------------------------------------------------------------------
describe('getAllBranchCommits', () => {
  test('returns empty array when branch cannot be resolved', () => {
    execSync.mockImplementation(() => { throw new Error('unknown ref'); });
    expect(getAllBranchCommits('nonexistent')).toEqual([]);
  });

  test('returns empty array when log output is empty', () => {
    execSync.mockReturnValueOnce('abc1234\n');  // git rev-parse (resolve branch)
    execSync.mockReturnValueOnce('');            // git tag --format (buildTagMap)
    execSync.mockReturnValueOnce('');            // git log
    expect(getAllBranchCommits('main')).toEqual([]);
  });

  test('parses a single commit correctly', () => {
    const sha = 'a'.repeat(40);
    execSync.mockReturnValueOnce(`${sha}\n`);   // git rev-parse
    execSync.mockReturnValueOnce('');            // git tag --format (no tags)
    execSync.mockReturnValueOnce(logBlock(sha, '2024-01-01', 'Alice', 'feat: add button') + CS);

    const commits = getAllBranchCommits('main');
    expect(commits).toHaveLength(1);
    expect(commits[0]).toMatchObject({
      hash: sha,
      datetime: '2024-01-01',
      author: 'Alice',
      message: 'feat: add button',
      tags: [],
    });
  });

  test('parses multiple commits in order', () => {
    const sha1 = 'a'.repeat(40);
    const sha2 = 'b'.repeat(40);
    execSync.mockReturnValueOnce(`${sha1}\n`);
    execSync.mockReturnValueOnce('');
    const log = logBlock(sha1, '2024-02-01', 'Alice', 'feat: new') + CS +
                logBlock(sha2, '2024-01-01', 'Bob', 'fix: old') + CS;
    execSync.mockReturnValueOnce(log);

    const commits = getAllBranchCommits('main');
    expect(commits).toHaveLength(2);
    expect(commits[0].message).toBe('feat: new');
    expect(commits[1].message).toBe('fix: old');
  });

  test('attaches tags to commits from tag map', () => {
    const sha = 'c'.repeat(40);
    execSync.mockReturnValueOnce(`${sha}\n`);
    // buildTagMap: lightweight tag pointing to sha
    execSync.mockReturnValueOnce(`v1.0.0||${sha}\n`);
    execSync.mockReturnValueOnce(logBlock(sha, '2024-01-01', 'Alice', 'chore: release') + CS);

    const commits = getAllBranchCommits('main');
    expect(commits[0].tags).toContain('v1.0.0');
  });

  test('resolves via origin/ prefix when local branch not found', () => {
    const sha = 'd'.repeat(40);
    execSync
      .mockImplementationOnce(() => { throw new Error('unknown ref'); }) // local fails
      .mockReturnValueOnce(`${sha}\n`)   // origin/ succeeds
      .mockReturnValueOnce('')            // buildTagMap
      .mockReturnValueOnce(logBlock(sha, '2024-01-01', 'Alice', 'fix: thing') + CS);

    const commits = getAllBranchCommits('main');
    expect(commits).toHaveLength(1);
  });

  test('resolves via HEAD when local and origin/ both fail (detached HEAD in CI)', () => {
    const sha = 'e'.repeat(40);
    execSync
      .mockImplementationOnce(() => { throw new Error('no local'); })  // local fails
      .mockImplementationOnce(() => { throw new Error('no origin'); }) // origin/ fails
      .mockReturnValueOnce(`${sha}\n`)   // HEAD succeeds
      .mockReturnValueOnce('')            // buildTagMap
      .mockReturnValueOnce(logBlock(sha, '2024-01-01', 'Alice', 'fix: ci') + CS);

    const commits = getAllBranchCommits('main');
    expect(commits).toHaveLength(1);
  });

  test('returns empty array when local, origin, and HEAD resolution all fail', () => {
    execSync
      .mockImplementationOnce(() => { throw new Error('no local'); })
      .mockImplementationOnce(() => { throw new Error('no origin'); })
      .mockImplementationOnce(() => { throw new Error('no HEAD'); });
    expect(getAllBranchCommits('main')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// buildTagMap (tested via getAllBranchCommits)
// ---------------------------------------------------------------------------
describe('buildTagMap (via getAllBranchCommits)', () => {
  test('handles annotated tags (deref SHA takes priority)', () => {
    const commitSha = 'e'.repeat(40);
    const tagObjSha = 'f'.repeat(40);
    execSync.mockReturnValueOnce(`${commitSha}\n`);
    // Annotated: deref = commitSha, obj = tagObjSha
    execSync.mockReturnValueOnce(`v2.0.0|${commitSha}|${tagObjSha}\n`);
    execSync.mockReturnValueOnce(logBlock(commitSha, '2024-01-01', 'Alice', 'feat!: v2') + CS);

    const commits = getAllBranchCommits('main');
    expect(commits[0].tags).toContain('v2.0.0');
  });

  test('handles multiple tags on the same commit', () => {
    const sha = 'a1b2'.repeat(10);
    execSync.mockReturnValueOnce(`${sha}\n`);
    execSync.mockReturnValueOnce(`v1.0.0||${sha}\nv1.0.0-hotfix||${sha}\n`);
    execSync.mockReturnValueOnce(logBlock(sha, '2024-01-01', 'Alice', 'fix: patch') + CS);

    const commits = getAllBranchCommits('main');
    expect(commits[0].tags).toEqual(expect.arrayContaining(['v1.0.0', 'v1.0.0-hotfix']));
  });

  test('returns empty tags for commits with no matching tag', () => {
    const sha = '0'.repeat(40);
    const otherSha = '1'.repeat(40);
    execSync.mockReturnValueOnce(`${sha}\n`);
    execSync.mockReturnValueOnce(`v1.0.0||${otherSha}\n`); // tag on a different commit
    execSync.mockReturnValueOnce(logBlock(sha, '2024-01-01', 'Alice', 'fix: thing') + CS);

    const commits = getAllBranchCommits('main');
    expect(commits[0].tags).toEqual([]);
  });
});
