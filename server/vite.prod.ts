import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export function serveStatic(app: Express) {
  // Use __dirname equivalent for production
  const currentDir = process.cwd();
  const distPath = path.resolve(currentDir, "dist", "public");

  if (!fs.existsSync(distPath)) {
    log(`Build directory not found: ${distPath}, creating fallback`);
    // Create a basic index.html if dist doesn't exist
    fs.mkdirSync(distPath, { recursive: true });
    const fallbackHtml = `<!DOCTYPE html>
<html>
<head>
  <title>Vibe LMS</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <div id="root">Loading...</div>
  <script>window.location.reload();</script>
</body>
</html>`;
    fs.writeFileSync(path.join(distPath, "index.html"), fallbackHtml);
  }

  // Serve static files with proper headers
  app.use(express.static(distPath, {
    maxAge: '1d',
    etag: true,
    setHeaders: (res, path) => {
      if (path.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache');
      }
    }
  }));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    const indexPath = path.resolve(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Application not built yet');
    }
  });
}