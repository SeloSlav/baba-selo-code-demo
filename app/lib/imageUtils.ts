export async function generateImageHash(file: File): Promise<string> {
  // Convert file to array buffer
  const buffer = await file.arrayBuffer();
  // Convert buffer to byte array
  const byteArray = new Uint8Array(buffer);
  // Use SubtleCrypto to create SHA-256 hash
  const hashBuffer = await crypto.subtle.digest('SHA-256', byteArray);
  // Convert hash to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
} 