/**
 * @param {string} cid
 */
export async function deleteCid(cid) {
  const jwt = import.meta.env.VITE_PINATA_JWT;
  const url = `https://api.pinata.cloud/pinning/unpin/${cid}`;
  const resp = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${jwt}`,
    },
  });
  if (!resp.ok) {
    throw new Error(`Unpin failed: ${resp.status} ${resp.statusText}`);
  }
}
