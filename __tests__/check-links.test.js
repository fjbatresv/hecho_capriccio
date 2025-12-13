const { TextEncoder, TextDecoder } = require('node:util');
const { ReadableStream } = require('node:stream/web');
const { MessagePort, MessageChannel } = require('node:worker_threads');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
global.ReadableStream = ReadableStream;
global.MessagePort = MessagePort;
global.MessageChannel = MessageChannel;

const createMockLinkinator = () => {
  const check = jest.fn();
  const instance = { check };
  const LinkChecker = jest.fn(() => instance);
  return { LinkChecker, check };
};

describe('scripts/check-links.js', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('sale sin errores cuando no hay enlaces rotos', async () => {
    const { LinkChecker, check } = createMockLinkinator();
    check.mockResolvedValue({ passed: true });
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    global.__MOCK_LINKINATOR__ = { LinkChecker };

    await import('../scripts/check-links.mjs');

    expect(LinkChecker).toHaveBeenCalledTimes(1);
    expect(exitSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  test('avisa y sale con 0 cuando el servidor embebido falla', async () => {
    const { LinkChecker, check } = createMockLinkinator();
    check.mockRejectedValue(new Error('port unavailable'));
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    global.__MOCK_LINKINATOR__ = { LinkChecker };

    await import('../scripts/check-links.mjs');

    expect(warnSpy).toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('falla cuando hay enlaces rotos', async () => {
    const { LinkChecker, check } = createMockLinkinator();
    check.mockResolvedValue({ passed: false });
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    global.__MOCK_LINKINATOR__ = { LinkChecker };

    await import('../scripts/check-links.mjs');

    expect(LinkChecker).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  test('lanza error cuando no es por puerto', async () => {
    const { LinkChecker, check } = createMockLinkinator();
    check.mockRejectedValue(new Error('unexpected failure'));
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    global.__MOCK_LINKINATOR__ = { LinkChecker };

    await import('../scripts/check-links.mjs');

    expect(errorSpy).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
