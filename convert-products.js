const fs = require("fs");

const products = JSON.parse(
  fs.readFileSync("assets/data/products.json", "utf8")
);

const headers = [
  "id",
  "name",
  "category",
  "brand",
  "price",
  "oldPrice",
  "rating",
  "reviews",
  "stock",
  "badge",
  "image",
  "desc"
];

const csv = [
  headers.join(","),
  ...products.map(product =>
    headers.map(key => {
      const value = product[key] ?? "";
      return `"${String(value).replace(/"/g, '""')}"`;
    }).join(",")
  )
].join("\n");

fs.writeFileSync("products.csv", csv);

console.log("✅ products.csv created successfully!");