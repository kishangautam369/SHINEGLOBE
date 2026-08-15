const fs = require('fs');
const path = require('path');

const DEFAULT_SUBCATEGORY_MAP = {
  'Disposable Items': ['Plates', 'Bowls', 'Cups', 'Cutlery', 'Napkins', 'Packaging'],
  'Hygiene Products': ['Soaps', 'Hand Sanitizers', 'Tissues', 'Toilet Rolls', 'Wipes', 'Accessories'],
  'Household': ['Laundry', 'Cleaning', 'Storage', 'Kitchen', 'Bathroom', 'Air Care'],
  'Packaging': ['Boxes', 'Bags', 'Wraps', 'Tape', 'Labels', 'Shipping'],
  'Office Supplies': ['Stationery', 'Paper', 'Pens', 'Desk Accessories', 'Files', 'Binders']
};

const productsPath = path.join(__dirname, 'assets', 'data', 'products.json');
const categoriesPath = path.join(__dirname, 'assets', 'data', 'categories.json');
const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));

const normalizedProducts = products.map((product, index) => {
  const category = String(product.category || 'Disposable Items').trim() || 'Disposable Items';
  const list = DEFAULT_SUBCATEGORY_MAP[category] || [];
  const raw = String(product.subcategory || product.subCategory || product.sub_category || '').trim();
  const subcategory = raw || (list.length ? list[index % list.length] : '');
  return { ...product, category, subcategory };
});

const roundRobinProducts = normalizedProducts.map((product, index) => {
  const category = String(product.category || 'Disposable Items').trim() || 'Disposable Items';
  const list = DEFAULT_SUBCATEGORY_MAP[category] || [];
  if (!list.length) return product;
  return { ...product, subcategory: list[index % list.length] };
});

fs.writeFileSync(productsPath, JSON.stringify(roundRobinProducts, null, 2));

const categories = [...new Set(roundRobinProducts.map((product) => product.category))].map((name, idx) => ({
  id: idx + 1,
  name,
  slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
  desc: `${name} collection at Shine Globe.`,
  icon: 'fa-tag',
  color: '#2563EB',
  banner: '',
  seoTitle: `${name} — Shine Globe`,
  seoDesc: `${name} collection at Shine Globe.`,
  keywords: name,
  active: true,
  featured: false,
  parent: '',
  subCategories: DEFAULT_SUBCATEGORY_MAP[name] || [],
  created: new Date().toISOString().slice(0, 10)
}));

fs.writeFileSync(categoriesPath, JSON.stringify(categories, null, 2));

console.log('products=' + normalizedProducts.length);
console.log('categories=' + categories.length);
console.log(JSON.stringify(normalizedProducts.slice(0, 3).map((p) => ({ id: p.id, category: p.category, subcategory: p.subcategory })), null, 2));
