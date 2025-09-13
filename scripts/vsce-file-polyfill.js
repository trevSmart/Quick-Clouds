// Polyfill global File for Node.js environments that lack it (e.g. Node 18)
try {
  if (typeof globalThis.File === 'undefined') {
    const { File } = require('@vscode/vsce/node_modules/undici');
    globalThis.File = File;
  }
} catch (err) {
  // Fallback minimal polyfill
  if (typeof globalThis.File === 'undefined') {
    globalThis.File = class File {};
  }
}
