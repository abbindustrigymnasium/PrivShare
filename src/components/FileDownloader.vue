<template>
  <div class="p-4">
    <input
      v-model="codeInput"
      placeholder="Paste share code here"
      class="w-full border p-2"
      :disabled="downloading"
    />
    <button
      @click="downloadFile"
      class="mt-2 px-4 py-2 bg-blue-600 text-white"
      :disabled="downloading || !codeInput"
    >
      {{ downloading ? downloadMessage : "Download" }}
    </button>
    <p v-if="error" class="text-red-600 mt-2">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { importKey, decryptBuffer } from "../lib/crypto";
import { deleteCid } from "../lib/ipfsManager";

const codeInput = ref("");
const downloading = ref(false);
const downloadMessage = ref("Downloading…");
const error = ref("");

function base64urlToBase64(str) {
  let s = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = (4 - (s.length % 4)) % 4;
  return s + "=".repeat(pad);
}

async function downloadFile() {
  if (!codeInput.value) return;
  downloading.value = true;
  downloadMessage.value = "Decoding code…";
  error.value = "";

  try {
    // 1. Decode share code into CID and key
    const raw = atob(base64urlToBase64(codeInput.value));
    const [cid, keyB64] = raw.split(":");

    // 2. Import AES key
    const key = await importKey(keyB64);

    // 3. Fetch the encrypted container from a CORS-friendly gateway
    downloadMessage.value = "Fetching encrypted data…";
    const resp = await fetch(`https://ipfs.io/ipfs/${cid}`);
    if (!resp.ok) throw new Error(`Fetch failed: ${resp.statusText}`);
    const data = new Uint8Array(await resp.arrayBuffer());

    // 4. Parse header
    downloadMessage.value = "Parsing metadata…";
    const dv = new DataView(data.buffer);
    const headerLen = dv.getUint32(0, true);
    const headerBytes = data.slice(4, 4 + headerLen);
    const header = JSON.parse(new TextDecoder().decode(headerBytes));
    const { name, type, size, chunkSz, ivs } = header;

    // 5. Decrypt each chunk
    const totalChunks = ivs.length;
    const plainChunks = [];
    let offset = 4 + headerLen;

    for (let i = 0; i < totalChunks; i++) {
      downloadMessage.value = `Decrypting chunk ${i + 1}/${totalChunks}…`;
      const isLast = i === totalChunks - 1;
      const plainLen = isLast ? size % chunkSz || chunkSz : chunkSz;
      const cipherLen = plainLen + 16; // AES-GCM tag
      const chunkData = data.slice(offset, offset + cipherLen);
      offset += cipherLen;

      const plain = await decryptBuffer(key, ivs[i], chunkData);
      plainChunks.push(plain);
    }

    // 6. Reassemble the original file bytes
    downloadMessage.value = "Reassembling file…";
    const fileBytes = new Uint8Array(size);
    let pos = 0;
    for (const chunk of plainChunks) {
      fileBytes.set(chunk, pos);
      pos += chunk.length;
    }

    // 7. Trigger browser download
    downloadMessage.value = "Triggering download…";
    const blob = new Blob([fileBytes], { type });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);

    // 8. Unpin the CID from Pinata
    downloadMessage.value = "Removing file from server…";
    await deleteCid(cid);
    downloadMessage.value =
      "Done! File downloaded and unpinned from the network.";
  } catch (err) {
    console.error(err);
    error.value = err.message || String(err);
  } finally {
    downloading.value = false;
  }
}
</script>

<style scoped>
button[disabled] {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
