import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createMockIssue, createMockApiResponse } from './utils/test-helpers'

describe('Quick Clouds Test Setup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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

  describe('Environment', () => {
    it('should have test environment variables', () => {
      expect(process.env.NODE_ENV).toBe('test')
    })

    it('should have jsdom environment', () => {
      expect(typeof window).toBe('object')
      expect(typeof document).toBe('object')
    })
  })

  describe('Basic Functionality', () => {
    it('should perform basic math operations', () => {
      expect(2 + 2).toBe(4)
      expect(10 - 5).toBe(5)
      expect(3 * 4).toBe(12)
      expect(8 / 2).toBe(4)
    })

    it('should handle string operations', () => {
      const str = 'Hello World'
      expect(str.length).toBe(11)
      expect(str.toUpperCase()).toBe('HELLO WORLD')
      expect(str.toLowerCase()).toBe('hello world')
    })

    it('should work with arrays', () => {
      const arr = [1, 2, 3, 4, 5]
      expect(arr.length).toBe(5)
      expect(arr.includes(3)).toBe(true)
      expect(arr.filter(n => n > 3)).toEqual([4, 5])
    })
  })
})
