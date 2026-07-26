require("dotenv").config();

const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ROOT = __dirname;
const PORT = process.env.PORT || 3000;

const EVENT_CLIENTS = new Set();
function sendJson(res, status, body) {
    res.writeHead(status, {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
    });

    res.end(JSON.stringify(body));
}

function readBody(req) {
    return new Promise((resolve, reject) => {

        let body = "";

        req.on("data", chunk => body += chunk);

        req.on("end", () => {
            try {
                resolve(JSON.parse(body || "{}"));
            } catch (err) {
                reject(err);
            }
        });

    });
}

function notify(resource) {

    const message =
        `event: update\ndata:${JSON.stringify({
            resource,
            updatedAt: new Date().toISOString()
        })}\n\n`;

    EVENT_CLIENTS.forEach(client => client.write(message));

}
function contentType(file) {

    const map = {

        ".html": "text/html",

        ".css": "text/css",

        ".js": "application/javascript",

        ".json": "application/json",

        ".png": "image/png",

        ".jpg": "image/jpeg",

        ".jpeg": "image/jpeg",

        ".svg": "image/svg+xml"

    };

    return map[path.extname(file)] || "application/octet-stream";

}
http.createServer(async (req, res) => {

    const url = new URL(req.url, `http://${req.headers.host}`);

    // Live Sync
    if (url.pathname === "/api/events") {

        res.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
        });

        res.write("retry:3000\n\n");

        EVENT_CLIENTS.add(res);

        req.on("close", () => {
            EVENT_CLIENTS.delete(res);
        });

        return;
    }

    // Products API
   if (url.pathname === "/api/products") {

    if (req.method === "GET") {

        const { data, error } = await supabase
            .from("products")
            .select("*")
            .order("id");

        if (error)
            return sendJson(res, 500, error);

        return sendJson(res, 200, data);

    }

    if (req.method === "PUT") {

        try {

            const products = await readBody(req);

            // Delete all existing products
            const { error: deleteError } = await supabase
                .from("products")
                .delete()
                .neq("id", 0);

            if (deleteError)
                return sendJson(res, 500, deleteError);

            // Insert updated products
            const { data, error } = await supabase
                .from("products")
                .insert(products)
                .select();

            if (error)
                return sendJson(res, 500, error);

            notify("products");

            return sendJson(res, 200, data);

        } catch (err) {

            return sendJson(res, 500, {
                error: err.message
            });

        }

    }

}

    // Static files

    const requested =
        url.pathname === "/"
            ? "/index.html"
            : url.pathname;

    const file =
        path.join(ROOT, requested);

    if (!fs.existsSync(file)) {

        return sendJson(res, 404, {
            error: "Not Found"
        });

    }

    res.writeHead(200, {
        "Content-Type": contentType(file)
    });

    fs.createReadStream(file).pipe(res);

}).listen(PORT, () => {

    console.log(`🚀 Shine Globe running on http://localhost:${PORT}`);

});