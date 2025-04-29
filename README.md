# PrivShare

File sharing website without a central server, encrypted.&#x20;

## Prerequisites

- Node.js (v14 or newer)
- npm (v6 or newer)

## Setup

1. **Create a Pinata account**\
   Visit [Pinata](https://pinata.cloud/) and sign up (or log in).\
   Navigate to **API Keys** and generate a new **JWT**.

2. **Add your JWT to the environment file**\
   In the project root, create a file named `.env` (if it doesn’t exist) and add:

   ```env
   VITE_PINATA_JWT=YOUR_PINATA_JWT_HERE
   ```

   Replace `YOUR_PINATA_JWT_HERE` with the token you generated in Pinata.

3. **Install dependencies**

   ```bash
   npm install
   ```

## Development

Start the development server:

```bash
npm run dev
```

When prompted in the console, type:

```
o
```

and press **Enter** to open the app in your browser.

---
