import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QuickCloudsLogger } from '../../src/utilities/logger'

describe('QuickCloudsLogger', () => {
  let mockOutputChannel: any
  let logger: QuickCloudsLogger

  beforeEach(() => {
    // Reset the singleton instance
    ;(QuickCloudsLogger as any).instance = undefined

    // Create mock output channel
    mockOutputChannel = {
      appendLine: vi.fn(),
      show: vi.fn(),
      clear: vi.fn()
    }

    // Mock VSCode window.createOutputChannel
    vi.spyOn(global.vscode.window, 'createOutputChannel').mockReturnValue(mockOutputChannel)
  })

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = QuickCloudsLogger.getInstance()
      const instance2 = QuickCloudsLogger.getInstance()
      
      expect(instance1).toBe(instance2)
      expect(instance1).toBeInstanceOf(QuickCloudsLogger)
    })

    it('should create output channel on initialization', () => {
      QuickCloudsLogger.getInstance()
      
      expect(global.vscode.window.createOutputChannel).toHaveBeenCalledWith(
        'Quick Clouds for Salesforce'
      )
    })
  })

  describe('Logging Methods', () => {
    beforeEach(() => {
      logger = QuickCloudsLogger.getInstance()
    })

    it('should log info messages', () => {
      const consoleSpy = vi.spyOn(console, 'log')
      
      logger.info('Test info message')
      
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('[INFO] Test info message')
      )
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Quick Clouds:')
      )
    })

    it('should log warning messages', () => {
      const consoleSpy = vi.spyOn(console, 'log')
      
      logger.warn('Test warning message')
      
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('[WARN] Test warning message')
      )
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Quick Clouds:')
      )
    })

    it('should log error messages', () => {
      const consoleSpy = vi.spyOn(console, 'log')
      
      logger.error('Test error message')
      
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] Test error message')
      )
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Quick Clouds:')
      )
      expect(mockOutputChannel.show).toHaveBeenCalledWith(true)
    })

    it('should log error with Error object', () => {
      const consoleSpy = vi.spyOn(console, 'log')
      const testError = new Error('Test error message')
      
      logger.error('Operation failed', testError)
      
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] Operation failed: Test error message')
      )
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Quick Clouds:')
      )
    })

    it('should log error with custom object', () => {
      const consoleSpy = vi.spyOn(console, 'log')
      const customError = { code: 500, message: 'Server error' }
      
      logger.error('API call failed', customError)
      
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] API call failed: {"code":500,"message":"Server error"}')
      )
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Quick Clouds:')
      )
    })
  })

  describe('Utility Methods', () => {
    beforeEach(() => {
      logger = QuickCloudsLogger.getInstance()
    })

    it('should show output channel', () => {
      logger.show()
      
      expect(mockOutputChannel.show).toHaveBeenCalledWith(true)
    })

    it('should clear output channel', () => {
      logger.clear()
      
      expect(mockOutputChannel.clear).toHaveBeenCalled()
    })
  })

  describe('Timestamp Format', () => {
    beforeEach(() => {
      logger = QuickCloudsLogger.getInstance()
    })

    it('should include ISO timestamp in log messages', () => {
      const beforeTime = new Date().toISOString()
      
      logger.info('Test message')
      
      const afterTime = new Date().toISOString()
      
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[INFO\] Test message/)
      )
    })
  })
})
