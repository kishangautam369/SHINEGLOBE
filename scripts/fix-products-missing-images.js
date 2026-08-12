#!/usr/bin/env node
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'assets', 'data');
const UPLOAD_DIR = path.join(ROOT, 'assets', 'images', 'uploads');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const PLACEHOLDER = '/assets/images/uploads/img-1786197125051-488.jpeg';
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'];

function findLocalUpload(imagePath) {
  if (!imagePath) return false;
  const normalized = imagePath.replace(/\\/g, '/').replace(/^\/*/, '');
  const basename = path.basename(normalized, path.extname(normalized));
  for (const ext of IMAGE_EXTENSIONS) {
    const candidate = path.join(UPLOAD_DIR, basename + ext);
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return true;
  }
  const exact = path.join(UPLOAD_DIR, path.basename(normalized));
  return fs.existsSync(exact) && fs.statSync(exact).isFile();
}

function main() {
  if (!fs.existsSync(PRODUCTS_FILE)) {
    console.error('Missing products.json at', PRODUCTS_FILE);
    process.exit(1);
  }
  const raw = fs.readFileSync(PRODUCTS_FILE, 'utf8');
  let products;
  try {
    products = JSON.parse(raw);
  } catch (err) {
    console.error('Could not parse products.json:', err.message);
    process.exit(1);
  }

  const backupPath = `${PRODUCTS_FILE}.repair.${Date.now()}`;
  fs.copyFileSync(PRODUCTS_FILE, backupPath);
  console.log('Backup created at', backupPath);

  let fixed = 0, leftIntact = 0;
  for (const product of products) {
    const imagePath = String(product.image || '').trim();
    if (!imagePath) continue;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      leftIntact++;
      continue;
    }
    if (!findLocalUpload(imagePath)) {
      product.image = PLACEHOLDER;
      fixed++;
    } else {
      leftIntact++;
    }
  }

  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf8');
  console.log(`Fixed ${fixed} products; left ${leftIntact} intact.`);
}

main();
