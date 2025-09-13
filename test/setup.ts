import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest'

// Mock VSCode module inline
vi.mock('vscode', () => ({
  window: {
    createOutputChannel: vi.fn(() => ({
      appendLine: vi.fn(),
      append: vi.fn(),
      show: vi.fn(),
      hide: vi.fn(),
      clear: vi.fn(),
      dispose: vi.fn()
    })),
    showErrorMessage: vi.fn(),
    showInformationMessage: vi.fn(),
    showWarningMessage: vi.fn(),
    showQuickPick: vi.fn(),
    showInputBox: vi.fn(),
    createWebviewPanel: vi.fn(() => ({
      webview: {
        html: '',
        onDidReceiveMessage: vi.fn(),
        postMessage: vi.fn()
      },
      onDidDispose: vi.fn(),
      reveal: vi.fn(),
      dispose: vi.fn()
    }))
  },
  
  workspace: {
    workspaceFolders: [
      {
        uri: {
          fsPath: '/mock/workspace'
        },
        name: 'mock-workspace',
        index: 0
      }
    ],
    getConfiguration: vi.fn(() => ({
      get: vi.fn((key: string, defaultValue?: any) => {
        const config: Record<string, any> = {
          'QuickClouds.API-key': 'mock-api-key',
          'QuickClouds.showSettingsButton': true,
          'QuickClouds.showQualityCenterButton': true,
          'QuickClouds.debugMode': false
        }
        return config[key] !== undefined ? config[key] : defaultValue
      }),
      update: vi.fn(),
      inspect: vi.fn(),
      has: vi.fn()
    })),
    openTextDocument: vi.fn(),
    save: vi.fn(),
    applyEdit: vi.fn()
  },
  
  commands: {
    registerCommand: vi.fn(),
    executeCommand: vi.fn(),
    getCommands: vi.fn(() => Promise.resolve([]))
  },
  
  Uri: {
    file: vi.fn((path: string) => ({ fsPath: path })),
    parse: vi.fn((uri: string) => ({ fsPath: uri }))
  },
  
  Range: vi.fn((start: any, end: any) => ({ start, end })),
  Position: vi.fn((line: number, character: number) => ({ line, character })),
  
  DiagnosticSeverity: {
    Error: 0,
    Warning: 1,
    Information: 2,
    Hint: 3
  },
  
  Diagnostic: vi.fn(),
  
  languages: {
    registerCodeActionsProvider: vi.fn(),
    createDiagnosticCollection: vi.fn(() => ({
      set: vi.fn(),
      clear: vi.fn(),
      dispose: vi.fn()
    }))
  },
  
  extensions: {
    getExtension: vi.fn(),
    all: []
  },
  
  env: {
    machineId: 'mock-machine-id',
    sessionId: 'mock-session-id',
    language: 'en'
  }
}))

// Mock global VSCode - will be available through the mocked module

// Mock Node.js modules that might be used in tests
vi.mock('fs', () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  existsSync: vi.fn(() => true),
  mkdirSync: vi.fn(),
  readdirSync: vi.fn(() => [])
}))

vi.mock('path', () => ({
  join: vi.fn((...args: string[]) => args.join('/')),
  resolve: vi.fn((...args: string[]) => args.join('/')),
  basename: vi.fn((path: string) => path.split('/').pop() || ''),
  dirname: vi.fn((path: string) => path.split('/').slice(0, -1).join('/'))
}))

// Setup and teardown
beforeAll(() => {
  // Setup complete
})

beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks()
})

afterEach(() => {
  // Clean up after each test
})

afterAll(() => {
  // Final cleanup
})
