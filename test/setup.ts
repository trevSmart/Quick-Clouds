import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest'
import { vscodeMock } from './mocks/vscode-mock'

// Mock VSCode module
vi.mock('vscode', () => vscodeMock)

// Mock global VSCode
global.vscode = vscodeMock

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
  // Initialize logger for tests
  QuickCloudsLogger.getInstance()
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
