const { execSync } = require('node:child_process');
const { readFileSync, rmSync, existsSync } = require('node:fs');
const { join } = require('node:path');

const REPORT_DIR = join(process.cwd(), 'doc-coverage');
const REPORT_FILE = join(REPORT_DIR, 'docCoverageReport.json');
const THRESHOLD = Number(process.env.DOC_COVERAGE_THRESHOLD ?? 80);

rmSync(REPORT_DIR, { recursive: true, force: true });

execSync('npx doc-coverage', { stdio: 'inherit' });

if (!existsSync(REPORT_FILE)) {
  throw new Error('Doc coverage report not found after running doc-coverage.');
}

const report = JSON.parse(readFileSync(REPORT_FILE, 'utf8'));
const coverage = Number(report?.jsdocCoverage?.coveragePercent ?? 0);

if (Number.isNaN(coverage)) {
  throw new Error('Doc coverage percentage is not a number.');
}

if (coverage < THRESHOLD) {
  console.error(`Documentation coverage ${coverage}% is below required threshold ${THRESHOLD}%.`);
  process.exit(1);
}

console.warn(
  `Documentation coverage ${coverage}% meets or exceeds required threshold ${THRESHOLD}%.`
);
