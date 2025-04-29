<template>
  <div class="p-4">
    <input
      v-model="codeInput"
      placeholder="Paste share code here"
      class="w-full border p-2"
    />
    <button
      @click="downloadFile"
      class="mt-2 px-4 py-2 bg-blue-600 text-white"
      :disabled="downloading"
    >
      {{ downloading ? "Downloading…" : "Download" }}
    </button>
    <p v-if="error" class="text-red-600 mt-2">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { importKey, decryptBuffer } from "../lib/crypto";

const codeInput = ref("");
const downloading = ref(false);
const error = ref("");

function base64urlToBase64(str) {
  let s = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = (4 - (s.length % 4)) % 4;
  return s + "=".repeat(pad);
}

async function downloadFile() {
  if (!codeInput.value) return;
  downloading.value = true;
  error.value = "";

  try {
    const raw = atob(base64urlToBase64(codeInput.value));
    const [cid, keyB64, iv] = raw.split(":");

    const key = await importKey(keyB64);

    const resp = await fetch(`https://ipfs.io/ipfs/${cid}`);

    if (!resp.ok) throw new Error(`Fetch failed: ${resp.statusText}`);
    const data = new Uint8Array(await resp.arrayBuffer());

    const dv = new DataView(data.buffer);
    const headerLen = dv.getUint32(0, true);
    const headerBytes = data.slice(4, 4 + headerLen);
    const header = JSON.parse(new TextDecoder().decode(headerBytes));
    const cipherBytes = data.slice(4 + headerLen);

    const plainBytes = await decryptBuffer(key, iv, cipherBytes);

    const blob = new Blob([plainBytes], { type: header.type });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = header.name;
    link.click();
    URL.revokeObjectURL(link.href);
  } catch (err) {
    error.value = err.message || String(err);
  } finally {
    downloading.value = false;
  }
}
</script>
