import { vi } from 'vitest'

/**
 * Creates a mock VSCode workspace folder
 */
export function createMockWorkspaceFolder(path: string) {
  return {
    uri: {
      fsPath: path
    },
    name: path.split('/').pop() || 'workspace',
    index: 0
  }
}

/**
 * Creates a mock VSCode configuration
 */
export function createMockConfiguration(config: Record<string, any> = {}) {
  return {
    get: vi.fn((key: string, defaultValue?: any) => {
      return config[key] !== undefined ? config[key] : defaultValue
    }),
    update: vi.fn(),
    inspect: vi.fn(),
    has: vi.fn((key: string) => key in config)
  }
}

/**
 * Creates a mock VSCode output channel
 */
export function createMockOutputChannel() {
  return {
    appendLine: vi.fn(),
    append: vi.fn(),
    show: vi.fn(),
    hide: vi.fn(),
    clear: vi.fn(),
    dispose: vi.fn()
  }
}

/**
 * Creates a mock issue for testing
 */
export function createMockIssue(overrides: Partial<any> = {}) {
  return {
    id: 'test-issue-1',
    ruleId: 'test-rule',
    message: 'Test issue message',
    severity: 'error',
    line: 10,
    column: 5,
    fileName: 'TestClass.cls',
    filePath: '/workspace/src/TestClass.cls',
    elementName: 'testMethod',
    ...overrides
  }
}

/**
 * Creates a mock API response
 */
export function createMockApiResponse(data: any = {}, status: number = 200) {
  return {
    data,
    status,
    statusText: 'OK',
    headers: {},
    config: {}
  }
}

/**
 * Waits for a specified amount of time
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Creates a mock file system structure
 */
export function createMockFileSystem(files: Record<string, string>) {
  const mockFs = {
    readFileSync: vi.fn((path: string) => {
      if (files[path]) {
        return files[path]
      }
      throw new Error(`File not found: ${path}`)
    }),
    writeFileSync: vi.fn(),
    existsSync: vi.fn((path: string) => path in files),
    mkdirSync: vi.fn(),
    readdirSync: vi.fn((path: string) => {
      const dirFiles = Object.keys(files).filter(file => 
        file.startsWith(path) && file !== path
      )
      return dirFiles.map(file => file.split('/').pop() || '')
    })
  }
  
  return mockFs
}
