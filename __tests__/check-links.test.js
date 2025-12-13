jest.mock('linkinator', () => {
  const check = jest.fn();
  const instance = { check };
  const LinkChecker = jest.fn(() => instance);
  return { LinkChecker, __esModule: true, __check: check };
});

describe('scripts/check-links.js', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('sale sin errores cuando no hay enlaces rotos', async () => {
    const { __check: checkMock, LinkChecker } = require('linkinator');
    checkMock.mockResolvedValue({ passed: true });
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    require('../scripts/check-links');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(LinkChecker).toHaveBeenCalledTimes(1);
    expect(exitSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  test('avisa y sale con 0 cuando el servidor embebido falla', async () => {
    const { __check: checkMock } = require('linkinator');
    checkMock.mockRejectedValue(new Error('port unavailable'));
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});

    require('../scripts/check-links');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(warnSpy).toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('falla cuando hay enlaces rotos', async () => {
    const { __check: checkMock, LinkChecker } = require('linkinator');
    checkMock.mockResolvedValue({ passed: false });
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});

    require('../scripts/check-links');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(LinkChecker).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  test('lanza error cuando no es por puerto', async () => {
    const { __check: checkMock } = require('linkinator');
    checkMock.mockRejectedValue(new Error('unexpected failure'));
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});

    require('../scripts/check-links');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(errorSpy).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
