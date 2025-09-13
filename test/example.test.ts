import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QuickCloudsLogger } from '../src/utilities/logger'
import { createMockIssue, createMockApiResponse } from './utils/test-helpers'

describe('Quick Clouds Test Setup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Logger', () => {
    it('should create logger instance', () => {
      const logger = QuickCloudsLogger.getInstance()
      expect(logger).toBeDefined()
      expect(logger).toBeInstanceOf(QuickCloudsLogger)
    })

    it('should log info messages', () => {
      const logger = QuickCloudsLogger.getInstance()
      const consoleSpy = vi.spyOn(console, 'log')
      
      logger.info('Test info message')
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Test info message')
      )
    })

    it('should log error messages', () => {
      const logger = QuickCloudsLogger.getInstance()
      const consoleSpy = vi.spyOn(console, 'error')
      
      logger.error('Test error message', new Error('Test error'))
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Test error message')
      )
    })
  })

  describe('Test Helpers', () => {
    it('should create mock issue', () => {
      const issue = createMockIssue({
        id: 'custom-issue',
        message: 'Custom message'
      })

      expect(issue).toEqual({
        id: 'custom-issue',
        ruleId: 'test-rule',
        message: 'Custom message',
        severity: 'error',
        line: 10,
        column: 5,
        fileName: 'TestClass.cls',
        filePath: '/workspace/src/TestClass.cls',
        elementName: 'testMethod'
      })
    })

    it('should create mock API response', () => {
      const response = createMockApiResponse({ data: 'test' }, 200)

      expect(response).toEqual({
        data: { data: 'test' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {}
      })
    })
  })

  describe('VSCode Mock', () => {
    it('should have VSCode API available', () => {
      expect(global.vscode).toBeDefined()
      expect(global.vscode.window).toBeDefined()
      expect(global.vscode.workspace).toBeDefined()
      expect(global.vscode.commands).toBeDefined()
    })

    it('should create output channel', () => {
      const channel = global.vscode.window.createOutputChannel('test')
      expect(channel).toBeDefined()
      expect(channel.appendLine).toBeDefined()
      expect(channel.show).toBeDefined()
    })

    it('should get configuration', () => {
      const config = global.vscode.workspace.getConfiguration()
      const apiKey = config.get('QuickClouds.API-key')
      expect(apiKey).toBe('mock-api-key')
    })
  })

  describe('Environment', () => {
    it('should have test environment variables', () => {
      expect(process.env.NODE_ENV).toBe('test')
    })

    it('should have jsdom environment', () => {
      expect(typeof window).toBe('object')
      expect(typeof document).toBe('object')
    })
  })
})
