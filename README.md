# PrivShare Web

**Share encrypted files securely, no server required.**

PrivShare Web is a browser-based, privacy-first file sharing application built on decentralized IPFS infrastructure. Files are encrypted client-side before upload and can be shared via a code, no central server or account required.

## Features

- **Client-side encryption**: AES‑GCM encryption in the browser ensures files are unreadable on IPFS.
- **Decentralized storage**: Encrypted files are pinned to IPFS via Pinata without trusting a central server.
- **Simple share codes**: Generate a Base64URL code (`cid:key`) for easy copy/paste
- **Large file support**: Chunked encryption and upload allow files up to \~1 GB. Limited only by Pinata’s storage allowances, not the web app.&#x20;

## Prerequisites

- Node.js v14+ and npm v6+
- Pinata account for IPFS pinning

## Quick Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/privshare-web.git
   cd privshare-web
   ```

2. **Create a Pinata JWT**

   - Sign in at [Pinata](https://pinata.cloud/) → **API Keys** → **Create New Key** → select **JWT** → copy the token.

3. **Configure environment & install dependencies**

   - Create and open the environment file:

     ```bash
     touch .env
     # open .env and add:
     VITE_PINATA_JWT=<your_pinata_jwt>
     ```

   - Install npm packages:

     ```bash
     npm install
     ```

## Development

- **Start dev server**:

  ```bash
  npm run dev
  ```

## Usage

1. **Upload**: Click **Upload**, select a file, wait for encryption and upload. Copy the generated code.
2. **Download**: Click **Download**, paste the share code, and retrieve your decrypted file with original name and extension.

**Troubleshooting**: If you encounter issues, ensure your `.env` file exists in the project root with the correct `VITE_` variables (see [Quick Setup](#quick-setup)).

## Architecture Overview

```
[Browser] --> (encrypt + blob) --> [Pinata IPFS]
              <-- share code -->
[Browser] --> (fetch + decrypt) --> file saved
```
