<template>
  <div class="page-content">
    <div class="p-4">
      <input type="file" @change="handleFile" :disabled="uploading" />

      <p v-if="uploading">{{ uploadMessage }}</p>

      <div v-else-if="shareCode">
        <p>Here’s your share code (paste to download):</p>
        <textarea readonly rows="3" class="w-full border p-2">{{
          shareCode
        }}</textarea>
      </div>

      <p v-else-if="error" class="text-red-600">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { generateKey, exportKey, encryptBuffer } from "../lib/crypto";
import { uploadEncryptedBlob } from "../lib/ipfsUploader";

const CHUNK_SIZE = 5 * 1024 * 1024; // 5 MiB per chunk
const uploading = ref(false);
const uploadMessage = ref("");
const shareCode = ref("");
const error = ref("");

async function handleFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  // reset state
  uploading.value = true;
  uploadMessage.value = "";
  shareCode.value = "";
  error.value = "";

  try {
    // 1️ Read full file into memory
    const buffer = await file.arrayBuffer();
    const totalChunks = Math.ceil(buffer.byteLength / CHUNK_SIZE);

    // 2️ Generate & export AES key
    const key = await generateKey();
    const keyB64 = await exportKey(key);

    // 3️ Encrypt each chunk, collect IVs and ciphertexts
    const ivs = [];
    const cipherChunks = [];
    for (let i = 0; i < totalChunks; i++) {
      uploadMessage.value = `Encrypting chunk ${i + 1}/${totalChunks}…`;
      const start = i * CHUNK_SIZE;
      const end = Math.min(buffer.byteLength, (i + 1) * CHUNK_SIZE);
      const slice = buffer.slice(start, end);
      const { iv, cipher } = await encryptBuffer(key, slice);
      ivs.push(iv);
      cipherChunks.push(cipher);
    }

    // 4️ Build header JSON
    const header = JSON.stringify({
      name: file.name,
      type: file.type,
      size: buffer.byteLength,
      chunkSz: CHUNK_SIZE,
      ivs,
    });
    const headerBytes = new TextEncoder().encode(header);

    // 5️ Allocate a single container for header + all cipher bytes
    const totalCipherBytes = cipherChunks.reduce((sum, c) => sum + c.length, 0);
    const container = new Uint8Array(4 + headerBytes.length + totalCipherBytes);
    new DataView(container.buffer).setUint32(0, headerBytes.length, true);
    container.set(headerBytes, 4);
    let offset = 4 + headerBytes.length;
    for (const chunk of cipherChunks) {
      container.set(chunk, offset);
      offset += chunk.length;
    }

    // 6️ Upload the container blob
    uploadMessage.value = "Uploading encrypted data…";
    const blob = new Blob([container], { type: "application/octet-stream" });
    const cid = await uploadEncryptedBlob(blob);

    // 7️ Build and expose the share code (CID + key)
    const raw = `${cid}:${keyB64}`;
    shareCode.value = btoa(raw)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  } catch (err) {
    console.error(err);
    error.value = err.message || String(err);
  } finally {
    uploading.value = false;
    uploadMessage.value = "";
  }
}
</script>

<style scoped>
textarea {
  resize: none;
}
button[disabled] {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
