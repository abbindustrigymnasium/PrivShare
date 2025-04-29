<template>
  <div class="p-4">
    <input type="file" @change="handleFile" />
    <p v-if="uploading">Encrypting & uploading…</p>
    <div v-else-if="shareCode">
      <p>Here’s your code (paste it to download):</p>
      <textarea readonly rows="3" class="w-full border p-2">{{
        shareCode
      }}</textarea>
    </div>
    <p v-else-if="error" class="text-red-600">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { generateKey, exportKey, encryptBuffer } from "../lib/crypto";
import { uploadEncryptedBlob } from "../lib/ipfsUploader";

const uploading = ref(false);
const shareCode = ref("");
const error = ref("");

async function handleFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  uploading.value = true;
  shareCode.value = "";
  error.value = "";

  try {
    const buffer = await file.arrayBuffer();

    const key = await generateKey();
    const keyB64 = await exportKey(key);

    const { iv, cipher } = await encryptBuffer(key, buffer);

    const header = JSON.stringify({ name: file.name, type: file.type });
    const headerBytes = new TextEncoder().encode(header);
    const container = new Uint8Array(4 + headerBytes.length + cipher.length);
    new DataView(container.buffer).setUint32(0, headerBytes.length, true);
    container.set(headerBytes, 4);
    container.set(cipher, 4 + headerBytes.length);

    const blob = new Blob([container], { type: "application/octet-stream" });
    const cid = await uploadEncryptedBlob(blob);

    const raw = `${cid}:${keyB64}:${iv}`;
    shareCode.value = btoa(raw)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  } catch (err) {
    error.value = err.message || String(err);
  } finally {
    uploading.value = false;
  }
}
</script>

<style scoped>
textarea {
  resize: none;
}
</style>
