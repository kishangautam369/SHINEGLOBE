const fs = require("fs");

const customers = JSON.parse(
  fs.readFileSync("assets/data/customers.json", "utf8")
);

const headers = [
  "id",
  "name",
  "email",
  "orders",
  "spent",
  "status",
  "joined"
];

const csv = [
  headers.join(","),
  ...customers.map(customer =>
    headers.map(key => {
      const value = customer[key] ?? "";
      return `"${String(value).replace(/"/g, '""')}"`;
    }).join(",")
  )
].join("\n");

fs.writeFileSync("customers.csv", csv);

console.log("✅ customers.csv created successfully!");
