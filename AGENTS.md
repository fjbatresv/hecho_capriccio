# Agent Instructions

Before pushing any branch, run the full local verification suite and report the result:

```sh
npm run lint
npm run prettier:check
npm run test:coverage
npm run doc:coverage
npm run html-validate
npm run check:links
```

If `node` or `npm` is not available in the shell, load the local nvm installation first:

```sh
source ~/.nvm/nvm.sh
nvm use 24
```

Do not push when any required check fails. Fix the issue, rerun the failing check, then rerun the
full suite before pushing. If a check cannot be run because of an environment problem, stop and
explain the blocker instead of pushing.
