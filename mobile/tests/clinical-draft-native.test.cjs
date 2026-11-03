const test = require('node:test');
const assert = require('node:assert/strict');
const { loadTs } = require('./load-ts.cjs');

// Mimics the Android native module: fromCombined accepts bytes, not a base64 string.
function nativeMocks() {
  const store = new Map();
  const SecureStore = {
    getItemAsync: async key => store.has(key) ? store.get(key) : null,
    setItemAsync: async (key, value) => { store.set(key, value); },
    deleteItemAsync: async key => { store.delete(key); },
  };
  const key = { encoded: async () => 'ab'.repeat(32) };
  const crypto = {
    randomUUID: () => Math.random().toString(16).slice(2),
    AESEncryptionKey: { generate: async () => key, import: async () => key },
    aesEncryptAsync: async plaintext => ({ combined: async () => Buffer.from(plaintext).toString('base64') }),
    AESSealedData: {
      fromCombined: combined => {
        if (typeof combined === 'string') throw new Error('Value is a string, expected an Object');
        return { bytes: combined };
      },
    },
    aesDecryptAsync: async sealed => sealed.bytes,
  };
  return { 'expo-crypto': crypto, 'expo-secure-store': SecureStore };
}

test('native drafts can be read back after saving (Android rejects base64 strings)', async () => {
  const { clinicalDraftStorage } = loadTs('src/services/clinicalDraftStorage.ts', nativeMocks(), {
    atob: value => Buffer.from(value, 'base64').toString('binary'),
    TextEncoder, TextDecoder, Uint8Array,
  });
  const drafts = JSON.stringify([{ id: '1', kind: 'SYMPTOMS', data: { symptoms: [{ symptomName: 'Fever', severity: 'MODERATE' }] } }]);
  await clinicalDraftStorage.write('nurse-1', drafts);
  assert.equal(await clinicalDraftStorage.read('nurse-1'), drafts);
});
