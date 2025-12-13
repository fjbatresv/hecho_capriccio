const { execSync } = require('node:child_process');
const { readFileSync, rmSync, existsSync, mkdirSync, copyFileSync } = require('node:fs');
const { join, dirname } = require('node:path');

const ROOT = process.cwd();
const SOURCE_DIR = join(ROOT, '.doccov-src');
const REPORT_DIR = join(ROOT, 'doc-coverage');
const REPORT_FILE = join(REPORT_DIR, 'docCoverageReport.json');
const THRESHOLD = Number(process.env.DOC_COVERAGE_THRESHOLD ?? 80);
const REPORT_ONLY = process.argv.includes('--report-only');
const FILES_TO_CHECK = ['script.js', 'cart-utils.js', 'scripts/check-links.js'];

rmSync(REPORT_DIR, { recursive: true, force: true });
rmSync(SOURCE_DIR, { recursive: true, force: true });
mkdirSync(SOURCE_DIR, { recursive: true });

FILES_TO_CHECK.forEach((relativePath) => {
  const from = join(ROOT, relativePath);
  const to = join(SOURCE_DIR, relativePath);
  mkdirSync(dirname(to), { recursive: true });
  copyFileSync(from, to);
});

execSync('npx doc-coverage', { stdio: 'inherit' });

if (!existsSync(REPORT_FILE)) {
  throw new TypeError('Doc coverage report not found after running doc-coverage.');
}

const report = JSON.parse(readFileSync(REPORT_FILE, 'utf8'));
const coverage = Number(report?.jsdocCoverage?.coveragePercent ?? 0);

if (Number.isNaN(coverage)) {
  throw new TypeError('Doc coverage percentage is not a number.');
}

if (!REPORT_ONLY && coverage < THRESHOLD) {
  console.error(`Documentation coverage ${coverage}% is below required threshold ${THRESHOLD}%.`);
  process.exit(1);
}

console.warn(
  `Documentation coverage ${coverage}% meets or exceeds required threshold ${THRESHOLD}%.`
);
