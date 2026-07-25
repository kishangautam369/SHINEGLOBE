const fs = require("fs");

const input = "assets/data/products.json";
const output = "products.csv";

const data = JSON.parse(fs.readFileSync(input, "utf8"));

if (!Array.isArray(data) || data.length === 0) {
    console.log("No data found.");
    process.exit();
}

const headers = Object.keys(data[0]);

const csv = [
    headers.join(","),
    ...data.map(row =>
        headers.map(h => {
            const value = row[h] ?? "";
            return `"${String(value).replace(/"/g, '""')}"`;
        }).join(",")
    )
].join("\n");

fs.writeFileSync(output, csv);

console.log("products.csv created successfully!");  