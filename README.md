# Shine Globe shared data server

This project now uses `server.js` as the shared source of truth for products, categories, orders, customers, and settings. It replaces the old browser-only admin catalog storage.

## Run

1. Install a current Node.js LTS release.
2. From this folder, run `node server.js`.
3. Open `http://localhost:3000` (or use the server's network IP and port 3000 on another device).

On the first start, the server creates `data/store.json` from the files in `assets/data/`. The server log records API reads/writes and connected-client update broadcasts.

## Multi-device verification

Open the site through the same server address on two devices. Edit a product or category in the admin panel on one device. The save request writes to `data/store.json`; the second device receives a server-sent `update` event and refreshes its storefront/admin data automatically. Refreshing either page also fetches fresh data with `Cache-Control: no-store`.

Do not open the HTML files directly or use a separate server per device: that would create separate data stores and cannot synchronize changes.
