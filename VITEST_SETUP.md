# Configuració de Vitest per Quick Clouds

## Resum de la Configuració

Vitest ha estat configurat correctament per al projecte Quick Clouds for Salesforce. La configuració inclou:

### ✅ Completat

1. **Instal·lació de dependències**
   - `vitest` - Framework de testing principal
   - `@vitest/ui` - Interfície web per tests
   - `@vitest/coverage-v8` - Cobertura de codi (temporalment desactivada)
   - `jsdom` - Entorn DOM per tests
   - `@types/jsdom` - Tipus TypeScript per jsdom

2. **Configuració de Vitest** (`vitest.config.ts`)
   - Entorn jsdom per simular DOM
   - Mock complet de l'API de VSCode
   - Configuració de setup automàtic
   - Exclusions adequades per fitxers no testejables
   - Timeout de 10 segons per tests

3. **Scripts de package.json**
   - `npm test` - Mode watch
   - `npm run test:run` - Execució única
   - `npm run test:ui` - Interfície web
   - `npm run test:coverage` - Mode verbose (cobertura temporalment desactivada)
   - `npm run test:watch` - Mode watch

4. **Estructura de tests**
   ```
   test/
   ├── setup.ts              # Configuració global
   ├── example.test.ts       # Test d'exemple
   ├── utils/
   │   └── test-helpers.ts   # Funcions d'utilitat
   ├── mocks/
   │   └── vscode-mock.ts   # Mock de VSCode
   └── README.md            # Documentació
   ```

5. **Configuració de VSCode**
   - `.vscode/settings.json` - Configuració de Vitest
   - `.vscode/launch.json` - Configuració de debugging

6. **Eliminació de Jest**
   - Eliminades dependències de Jest (`jest`, `ts-jest`, `@types/jest`)
   - Reemplaçat completament per Vitest

### ⚠️ Limitacions Actuals

1. **Cobertura de codi**
   - Temporalment desactivada per problemes amb source maps
   - Els fitxers `.js.map` no es troben correctament
   - Pot ser reactivada quan es resolgui el problema de compilació

2. **Tests de VSCode**
   - Els tests que depenen de l'API de VSCode necessiten configuració addicional
   - El mock funciona però pot requerir ajustos per tests més complexos

### 🚀 Comandos Disponibles

```bash
# Executar tests en mode watch
npm test

# Executar tests una sola vegada
npm run test:run

# Obrir interfície web de tests
npm run test:ui

# Executar tests amb reporter verbose
npm run test:coverage

# Executar tests en mode watch
npm run test:watch
```

### 📁 Fitxers Clau

- `vitest.config.ts` - Configuració principal de Vitest
- `test/setup.ts` - Configuració global dels tests
- `test/example.test.ts` - Test d'exemple funcional
- `test/utils/test-helpers.ts` - Funcions d'utilitat per tests
- `test/mocks/vscode-mock.ts` - Mock complet de VSCode API

### 🔧 Pròxims Passos

1. **Reactivar cobertura de codi** quan es resolgui el problema de source maps
2. **Afegir més tests** per components específics del projecte
3. **Configurar tests d'integració** per funcionalitats complexes
4. **Optimitzar mocks** segons necessitats específiques

### ✅ Verificació

Els tests bàsics funcionen correctament:
- ✅ 7 tests passen
- ✅ Entorn jsdom configurat
- ✅ Mocks funcionals
- ✅ Scripts de package.json operatius
- ✅ Configuració de VSCode per debugging

La configuració de Vitest està llesta per utilitzar-se en el desenvolupament del projecte Quick Clouds.
