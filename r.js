/*
import { readdirSync, statSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

function replaceInFiles(dir, replacements) {
    readdirSync(dir).forEach(file => {
        const filePath = join(dir, file);
        if (statSync(filePath).isDirectory()) {
            replaceInFiles(filePath, replacements);
        } else if (file.endsWith('.handlebars')) {
            let content = readFileSync(filePath, 'utf8');

            // Apply all replacements sequentially
            replacements.forEach(replacement => {
                content = content.replace(replacement.regex, replacement.replaceValue);
            });

            writeFileSync(filePath, content, 'utf8');
            console.log(`Updated ${filePath}`);
        }
    });
}

// Define the replacements
const replacements = [
    {
        regex: /<body[^>]*>/g,
        replaceValue: '<body class="gradient-body">'
    },
    {
        regex: /<div class="heading-pages">[\s\S]*?<\/div>/g,
        replaceValue: '<div class="content-wrapper">'
    },
    {
        regex: /<\/div>\s*<div class="site-footer">/g,
        replaceValue: '</div>\n<div class="site-footer">'
    }
];

// Run the replacements on the target directory
replaceInFiles('./Templates/Pages', replacements);
*/
import { readdirSync, statSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

function replaceInFiles(dir, replacements) {
  readdirSync(dir).forEach(file => {
    const filePath = join(dir, file);
    if (statSync(filePath).isDirectory()) {
      // Recursively process subdirectories
      replaceInFiles(filePath, replacements);
    } else if (file.endsWith('.handlebars') || file.endsWith('.html')) {
      // Read the file content
      let content = readFileSync(filePath, 'utf8');

      // Apply all replacements sequentially
      replacements.forEach(replacement => {
        content = content.replace(replacement.regex, replacement.replaceValue);
      });

      // Write the updated content back to the file
      writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${filePath}`);
    }
  });
}

// Define the replacements
const replacements = [
  {
    // Remove the specific <script> block
    regex: /<script>\s*\/\/ Select the navbar, logo[\s\S]*?window\.addEventListener\("scroll", handleScroll\);\s*<\/script>/g,
    replaceValue: '' // Replace with nothing (remove it)
  }
];

// Run the replacements on the target directory
replaceInFiles('./Templates/Pages', replacements);
