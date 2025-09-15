import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  // Use specific tsconfig for Vitest
  configFile: './tsconfig.vitest.json',
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
      '**/tests/**', // Exclude Playwright tests directory
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*'
    ],

    // Coverage configuration (disabled for now due to source map issues)
    // coverage: {
    //   provider: 'v8',
    //   reporter: ['text', 'json', 'html'],
    //   exclude: [
    //     'coverage/**',
    //     'dist/**',
    //     'packages/*/test{,s}/**',
    //     '**/*.d.ts',
    //     'cypress/**',
    //     'test{,s}/**',
    //     'test{,-*}.{js,cjs,mjs,ts,tsx,jsx}',
    //     '**/*{.,-}test.{js,cjs,mjs,ts,tsx,jsx}',
    //     '**/*{.,-}spec.{js,cjs,mjs,ts,tsx,jsx}',
    //     '**/__tests__/**',
    //     '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
    //     '**/.{eslint,mocha,prettier}rc.{js,cjs,yml}',
    //     '**/out/**',
    //     '**/webview-ui/**',
    //     '**/media/**',
    //     '**/resources/**',
    //     '**/scripts/**',
    //     '**/tmp/**',
    //     '**/*.map'
    //   ],
    //   thresholds: {
    //     global: {
    //       branches: 50,
    //       functions: 50,
    //       lines: 50,
    //       statements: 50
    //     }
    //   }
    // },

    // Test timeout
    testTimeout: 10000,

    // Setup files
    setupFiles: ['./test/setup.ts'],

    // Mock configuration
    server: {
      deps: {
        inline: ['vscode']
      }
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
      '@test': resolve(__dirname, './test')
    }
  },

  // Define global variables for tests
  define: {
    'process.env.NODE_ENV': '"test"'
  },

  // ESBuild configuration to handle CommonJS modules
  esbuild: {
    target: 'node18'
  }
})
