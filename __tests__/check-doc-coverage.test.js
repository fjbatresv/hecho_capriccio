const originalArgv = process.argv;
const originalEnv = process.env;

const setupMocks = ({ coveragePercent = 100, exists = true } = {}) => {
  const fsMocks = {
    readFileSync: jest.fn().mockReturnValue(
      JSON.stringify({
        jsdocCoverage: { coveragePercent },
      })
    ),
    rmSync: jest.fn(),
    existsSync: jest.fn().mockReturnValue(exists),
    mkdirSync: jest.fn(),
    copyFileSync: jest.fn(),
  };
  jest.doMock('node:fs', () => fsMocks);
  jest.doMock('node:child_process', () => ({ execSync: jest.fn() }));
  return fsMocks;
};

describe('scripts/check-doc-coverage.js', () => {
  let exitSpy;
  let errorSpy;
  let warnSpy;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.argv = [...originalArgv.slice(0, 2)];
    process.env = { ...originalEnv };
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    process.argv = originalArgv;
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  test('sale con error cuando la cobertura está por debajo del umbral', () => {
    setupMocks({ coveragePercent: 50 });
    jest.isolateModules(() => {
      require('../scripts/check-doc-coverage');
    });
    expect(errorSpy).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  test('no falla cuando está en modo reporte aun con cobertura baja', () => {
    setupMocks({ coveragePercent: 60 });
    process.argv = [...process.argv, '--report-only'];
    jest.isolateModules(() => {
      require('../scripts/check-doc-coverage');
    });
    expect(exitSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
  });

  test('avisa cuando la cobertura cumple el umbral', () => {
    setupMocks({ coveragePercent: 95 });
    jest.isolateModules(() => {
      require('../scripts/check-doc-coverage');
    });
    expect(exitSpy).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(
      'Documentation coverage 95% meets or exceeds required threshold 80%.'
    );
  });
});
