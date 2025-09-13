# Quick Clouds Test Suite

Aquest directori conté els tests per a l'extensió Quick Clouds for Salesforce utilitzant Vitest.

## Estructura

```
test/
├── setup.ts              # Configuració global dels tests
├── example.test.ts       # Test d'exemple per verificar configuració
├── utils/
│   └── test-helpers.ts   # Funcions d'utilitat per als tests
├── mocks/
│   └── vscode-mock.ts   # Mock de l'API de VSCode
├── fixtures/             # Dades de prova estàtiques
└── README.md            # Aquest fitxer
```

## Comandos Disponibles

- `npm test` - Executa els tests en mode watch
- `npm run test:run` - Executa els tests una sola vegada
- `npm run test:ui` - Obre la interfície web de Vitest
- `npm run test:coverage` - Executa tests amb cobertura
- `npm run test:watch` - Executa tests en mode watch

## Configuració

Els tests estan configurats amb:

- **Entorn**: jsdom (per simular DOM)
- **Cobertura**: v8 provider
- **Mocks**: VSCode API completament mockejada
- **Setup**: Configuració global automàtica

## Escriure Tests

### Test Bàsic

```typescript
import { describe, it, expect } from 'vitest'

describe('MyComponent', () => {
  it('should work correctly', () => {
    expect(true).toBe(true)
  })
})
```

### Test amb Mocks

```typescript
import { describe, it, expect, vi } from 'vitest'
import { createMockIssue } from './utils/test-helpers'

describe('Issue Service', () => {
  it('should process issues', () => {
    const mockIssue = createMockIssue({
      id: 'test-1',
      message: 'Test message'
    })

    expect(mockIssue.id).toBe('test-1')
  })
})
```

### Test amb VSCode API

```typescript
import { describe, it, expect, vi } from 'vitest'

describe('VSCode Integration', () => {
  it('should create output channel', () => {
    const channel = global.vscode.window.createOutputChannel('test')
    expect(channel).toBeDefined()
  })
})
```

## Utilitats Disponibles

### Test Helpers

- `createMockIssue()` - Crea un issue de prova
- `createMockApiResponse()` - Crea una resposta d'API de prova
- `createMockWorkspaceFolder()` - Crea una carpeta de workspace de prova
- `createMockConfiguration()` - Crea una configuració de prova
- `wait()` - Funció d'espera per tests asíncrons

### Mocks

- `vscodeMock` - Mock complet de l'API de VSCode
- Mocks automàtics per `fs`, `path`, i altres mòduls de Node.js

## Cobertura

Els tests generen informes de cobertura amb:

- **Llindar mínim**: 70% per branches, functions, lines i statements
- **Format**: HTML, JSON i text
- **Exclusions**: Carpetes de build, node_modules, tests, etc.

## Debugging

Per debuggar tests:

1. Utilitza `console.log()` dins dels tests
2. Executa `npm run test:ui` per la interfície web
3. Utilitza `debugger` statements amb el debugger de VSCode
4. Revisa els logs en la consola de desenvolupament

## Convencions

- Noms de fitxers: `*.test.ts` o `*.spec.ts`
- Estructura: Un fitxer de test per cada fitxer de codi
- Ubicació: Tests propers al codi que testegen
- Noms descriptius: `describe` i `it` amb descripcions clares
