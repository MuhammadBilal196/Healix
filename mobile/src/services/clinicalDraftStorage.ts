import { AESEncryptionKey, AESSealedData, aesEncryptAsync, aesDecryptAsync, randomUUID } from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

function base64ToBytes(base64: string): Uint8Array {
 const binary = atob(base64);
 const bytes = new Uint8Array(binary.length);
 for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
 return bytes;
}

// Immutable encrypted chunks are committed by changing one small manifest.
export const clinicalDraftStorage = {
 async read(userId: string): Promise<string | null> {
  const prefix = `clinical.${userId}`;
  const manifest = await SecureStore.getItemAsync(prefix);
  if (!manifest) return null;
  const { revision, chunks } = JSON.parse(manifest);
  const keyHex = await SecureStore.getItemAsync(prefix + '.key');
  if (!keyHex) throw new Error('Offline encryption key is unavailable. Drafts were preserved.');
  const parts = await Promise.all(Array.from({ length: chunks }, (_, i) => SecureStore.getItemAsync(`${prefix}.${revision}.${i}`)));
  if (parts.some(part => !part)) throw new Error('Offline draft storage is incomplete. Drafts were preserved.');
  // Pass raw bytes: on Android the native fromCombined rejects a base64 string ("expected an Object").
  const bytes = await aesDecryptAsync(AESSealedData.fromCombined(base64ToBytes(parts.join(''))), await AESEncryptionKey.import(keyHex, 'hex'));
  return new TextDecoder().decode(bytes);
 },
 async write(userId: string, value: string): Promise<void> {
  const prefix = `clinical.${userId}`;
  const previous = await SecureStore.getItemAsync(prefix);
  let keyHex = await SecureStore.getItemAsync(prefix + '.key');
  if (!keyHex) { const key = await AESEncryptionKey.generate(); keyHex = await key.encoded('hex'); await SecureStore.setItemAsync(prefix + '.key', keyHex); }
  const sealed = await aesEncryptAsync(new TextEncoder().encode(value), await AESEncryptionKey.import(keyHex, 'hex'));
  const ciphertext = await sealed.combined('base64');
  const revision = randomUUID(); const chunks = Math.ceil(ciphertext.length / 1800);
  for (let i = 0; i < chunks; i++) await SecureStore.setItemAsync(`${prefix}.${revision}.${i}`, ciphertext.slice(i * 1800, (i + 1) * 1800));
  await SecureStore.setItemAsync(prefix, JSON.stringify({ revision, chunks }));
  if (previous) { const old = JSON.parse(previous); await Promise.all(Array.from({ length: old.chunks }, (_, i) => SecureStore.deleteItemAsync(`${prefix}.${old.revision}.${i}`))); }
 }
};
