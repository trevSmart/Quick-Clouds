import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
    // Configuration for main extension TypeScript files
    {
        files: ['src/**/*.{js,ts}', 'eslint.config.js'],
        languageOptions: {
            parser: tsparser,
            parserOptions: {
                ecmaVersion: 6,
                sourceType: 'module'
            }
        },
        plugins: {
            '@typescript-eslint': tseslint
        },
        rules: {
            // TypeScript ESLint rules
            '@typescript-eslint/naming-convention': [
                'warn',
                {
                    selector: 'import',
                    format: ['camelCase', 'PascalCase']
                }
            ],
            '@/semi': 'warn',

            // General ESLint rules
            'curly': ['error', 'all'],
            'eqeqeq': 'warn',
            'no-throw-literal': 'warn',
            'semi': 'off'
        }
    },

    // Configuration for webview-ui React files
    {
        files: ['webview-ui/src/**/*.{js,jsx}', 'media/**/*.js'],
        languageOptions: {
            ecmaVersion: 2020,
            sourceType: 'module',
            parserOptions: {
                ecmaFeatures: {
                    jsx: true
                }
            },
            globals: {
                'acquireVsCodeApi': 'readonly'
            }
        },
        rules: {
            // Relaxed rules for React/webview files
            'curly': ['error', 'all'],
            'eqeqeq': 'warn',
            'no-throw-literal': 'warn',
            'semi': 'off'
        }
    },

    // Ignore patterns
    {
        ignores: [
            'out/**',
            'dist/**',
            '**/*.d.ts',
            'node_modules/**',
            'webview-ui/node_modules/**',
            'webview-ui/build/**'
        ]
    }
];
