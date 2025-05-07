<template>
  <div class="page-content">
    <input type="file" @change="handleFile" :disabled="uploading" />

    <p v-if="uploading">{{ uploadMessage }}</p>

    <div v-else-if="shareCode" class="code-container">
      <textarea readonly rows="2" class="code-box">{{ shareCode }}</textarea>
      <button @click="copyCode" class="copy-button" title="Copy to clipboard">
        Copy
      </button>
      <transition name="fade">
        <div v-if="showCopied" class="copied-popup">Copied!</div>
      </transition>
    </div>

    <p v-else-if="error" class="text-red-600">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { generateKey, exportKey, encryptBuffer } from "../lib/crypto";
import { uploadEncryptedBlob } from "../lib/ipfsUploader";

const CHUNK_SIZE = 5 * 1024 * 1024; // 5 MiB
const uploading = ref(false);
const uploadMessage = ref("");
const shareCode = ref("");
const error = ref("");
const showCopied = ref(false);

async function handleFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  uploading.value = true;
  uploadMessage.value = "";
  shareCode.value = "";
  error.value = "";

  try {
    const buffer = await file.arrayBuffer();
    const totalChunks = Math.ceil(buffer.byteLength / CHUNK_SIZE);

    const key = await generateKey();
    const keyB64 = await exportKey(key);

    const ivs = [];
    const cipherChunks = [];
    for (let i = 0; i < totalChunks; i++) {
      uploadMessage.value = `Encrypting chunk ${i + 1}/${totalChunks}...`;
      const start = i * CHUNK_SIZE;
      const end = Math.min(buffer.byteLength, (i + 1) * CHUNK_SIZE);
      const slice = buffer.slice(start, end);
      const { iv, cipher } = await encryptBuffer(key, slice);
      ivs.push(iv);
      cipherChunks.push(cipher);
    }

    const header = JSON.stringify({
      name: file.name,
      type: file.type,
      size: buffer.byteLength,
      chunkSz: CHUNK_SIZE,
      ivs,
    });
    const headerBytes = new TextEncoder().encode(header);
    const totalCipherBytes = cipherChunks.reduce((sum, c) => sum + c.length, 0);
    const container = new Uint8Array(4 + headerBytes.length + totalCipherBytes);
    new DataView(container.buffer).setUint32(0, headerBytes.length, true);
    container.set(headerBytes, 4);
    let offset = 4 + headerBytes.length;
    for (const cipher of cipherChunks) {
      container.set(cipher, offset);
      offset += cipher.length;
    }

    uploadMessage.value = "Uploading encrypted data...";
    const blob = new Blob([container], { type: "application/octet-stream" });
    const cid = await uploadEncryptedBlob(blob);

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

function copyCode() {
  if (!shareCode.value) return;
  navigator.clipboard
    .writeText(shareCode.value)
    .then(() => {
      showCopied.value = true;
      setTimeout(() => {
        showCopied.value = false;
      }, 2000);
    })
    .catch((err) => console.error("Copy failed", err));
}
</script>

<style scoped>
.code-container {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  max-width: 500px;
}

.code-box {
  flex: 1;
  background-color: #1e1e1e;
  color: var(--color-text);
  border: 1px solid #333;
  padding: 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-family: monospace;
  overflow-x: auto;
}

.copy-button {
  background-color: var(--color-primary);
  border: none;
  color: #fff;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
}

.copy-button:hover {
  background-color: var(--color-primary-hover);
}

.copied-popup {
  position: absolute;
  top: -1.5rem;
  right: 0;
  background-color: var(--color-primary);
  color: #fff;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  white-space: nowrap;
  z-index: 10;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
