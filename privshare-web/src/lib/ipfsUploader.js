import { PinataSDK } from "pinata-web3";

const pinata = new PinataSDK({
  pinataJwt: import.meta.env.VITE_PINATA_JWT,
  pinataGateway: import.meta.env.VITE_PINATA_GATEWAY,
});

export async function uploadEncryptedBlob(blob) {
  const result = await pinata.upload.file(blob);
  return result.IpfsHash;
}
