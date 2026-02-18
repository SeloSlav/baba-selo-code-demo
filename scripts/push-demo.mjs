#!/usr/bin/env node
/**
 * Push current code to baba-selo-demo as a single clean commit (no history).
 * Run: npm run push-demo
 */
import { execSync } from 'child_process';

const run = (cmd, opts = {}) => {
  execSync(cmd, { stdio: 'inherit', ...opts });
};

let hadStash = false;
try {
  // Stash any uncommitted changes (restored at end)
  try {
    execSync('git stash push -u -m "push-demo temp"', { stdio: 'pipe' });
    hadStash = true;
  } catch (_) {}

  // Ensure we're on main (in case previous run left us on demo-clean)
  run('git checkout main');

  // Delete demo-clean branch if it exists from previous run
  try {
    run('git branch -D demo-clean');
  } catch (_) {}

  // Create orphan branch with no history
  run('git checkout --orphan demo-clean');

  // Stage everything
  run('git add -A');

  // Single commit
  run('git commit -m "Baba Selo - AI-powered recipe assistant"');

  // Strip co-authored-by if IDE added it
  run('git filter-branch -f --msg-filter "grep -v Co-authored-by || true" HEAD', {
    env: { ...process.env, FILTER_BRANCH_SQUELCH_WARNING: '1' },
  });

  // Force push to demo
  run('git push demo demo-clean:main --force');

  // Switch back to main
  run('git checkout main');

  // Delete orphan branch
  run('git branch -D demo-clean');

  // Restore stashed changes if any
  if (hadStash) {
    try {
      run('git stash pop');
    } catch (_) {}
  }

  console.log('Done. Demo repo updated with clean single commit.');
} catch (err) {
  console.error('Error:', err.message);
  if (hadStash) {
    try {
      run('git stash pop');
    } catch (_) {}
  }
  process.exit(1);
}
