import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
    // Base configuration for all files
    {
        files: ['**/*.{js,ts}'],
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
            'curly': 'warn',
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
