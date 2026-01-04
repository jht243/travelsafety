#!/usr/bin/env node
/**
 * Update the HTML template with a dynamic import() to load the React bundle
 * from the server URL instead of inlining it (avoids ChatGPT sandbox issues)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const htmlPath = path.join(__dirname, '../assets/is_it_safe.html');
const jsPath = path.join(__dirname, '../assets/is_it_safe.js');

// Server URL - use environment variable or default to Render deployment
const SERVER_URL = process.env.SERVER_URL || 'https://travelsafety-un15.onrender.com';

console.log('[Inline Bundle] Reading files...');
const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

// Verify JS bundle exists
if (!fs.existsSync(jsPath)) {
  console.error(`[Inline Bundle] ERROR: JS bundle not found at ${jsPath}`);
  process.exit(1);
}

const jsContent = fs.readFileSync(jsPath, 'utf-8');
console.log(`[Inline Bundle] JS bundle size: ${(jsContent.length / 1024).toFixed(2)} KB`);

// Create a script that uses dynamic import() from the server URL
const inlineScript = `
    <script type="module">
      // Load React bundle via dynamic import from server
      import('${SERVER_URL}/assets/is_it_safe.js')
        .catch(err => {
          console.error('[Is It Safe] Failed to load:', err);
          const root = document.getElementById('is-it-safe-root');
          if (root) {
            root.innerHTML = '<div style="padding:20px;text-align:center;font-family:sans-serif;color:#DC2626"><h3>Failed to load</h3><p>Please refresh the page.</p></div>';
          }
        });
    </script>`;

// Replace the script tag
const updatedHtml = htmlContent.replace(
  /<script type="module">[\s\S]*?<\/script>\s*<\/body>/,
  inlineScript + '\n  </body>'
);

if (updatedHtml === htmlContent) {
  console.error('[Inline Bundle] ERROR: Script tag not found or not replaced!');
  process.exit(1);
}

fs.writeFileSync(htmlPath, updatedHtml, 'utf-8');
console.log(`[Inline Bundle] Successfully updated HTML with dynamic import from ${SERVER_URL}`);
console.log(`[Inline Bundle] Output: ${htmlPath}`);

