import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    // Test environment
    environment: 'jsdom',
    
    // Glob patterns for test files
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    
    // Exclude patterns
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*'
    ],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'coverage/**',
        'dist/**',
        'packages/*/test{,s}/**',
        '**/*.d.ts',
        'cypress/**',
        'test{,s}/**',
        'test{,-*}.{js,cjs,mjs,ts,tsx,jsx}',
        '**/*{.,-}test.{js,cjs,mjs,ts,tsx,jsx}',
        '**/*{.,-}spec.{js,cjs,mjs,ts,tsx,jsx}',
        '**/__tests__/**',
        '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
        '**/.{eslint,mocha,prettier}rc.{js,cjs,yml}',
        '**/out/**',
        '**/webview-ui/**',
        '**/media/**',
        '**/resources/**',
        '**/scripts/**',
        '**/tmp/**'
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    },
    
    // Test timeout
    testTimeout: 10000,
    
    // Setup files
    setupFiles: ['./test/setup.ts'],
    
    // Mock configuration
    deps: {
      inline: ['vscode']
    },
    
    // Global test configuration
    globals: true,
    
    // Reporter configuration
    reporter: ['verbose', 'html'],
    
    // Output directory for test results
    outputFile: {
      html: './test-results/index.html'
    }
  },
  
  // Resolve configuration
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@test': resolve(__dirname, './test'),
      'vscode': resolve(__dirname, './test/mocks/vscode-mock.ts')
    }
  },
  
  // Define global variables for tests
  define: {
    'process.env.NODE_ENV': '"test"'
  }
})
