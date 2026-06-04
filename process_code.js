const fs = require('fs');
const path = require('path');

const jsDir = path.join(__dirname, 'assets', 'js');
const indexHtmlPath = path.join(__dirname, 'index.html');

// Function to replace extensions in file content
function updateReferences(content) {
    // Replace .jpg, .jpeg, .png with .webp (case insensitive)
    content = content.replace(/\.(jpg|jpeg|png)/gi, '.webp');
    // Replace .mov with .mp4 (case insensitive)
    content = content.replace(/\.mov/gi, '.mp4');
    
    // Also we moved js/ to assets/js/, so we should update import paths in index.html
    return content;
}

// Function to generate a header based on filename
function getHeader(filename) {
    const name = path.basename(filename, '.js');
    return `/**
 * ============================================================================
 * Módulo: ${name.toUpperCase()}
 * ============================================================================
 * Responsabilidade: Gerencia funcionalidades relacionadas a ${name}.
 * Este arquivo faz parte do sistema modular do DVC App.
 * Todos os códigos principais aqui agrupados seguem as diretrizes do projeto.
 * ============================================================================
 */\n\n`;
}

// Process all JS files
if (fs.existsSync(jsDir)) {
    const files = fs.readdirSync(jsDir);
    files.forEach(file => {
        if (file.endsWith('.js')) {
            const filePath = path.join(jsDir, file);
            let content = fs.readFileSync(filePath, 'utf8');
            
            // Add header if not present
            if (!content.includes('Módulo:')) {
                content = getHeader(file) + content;
            }
            
            // Update image/video references
            content = updateReferences(content);
            
            fs.writeFileSync(filePath, content);
            console.log(`Updated ${file}`);
        }
    });
}

// Process index.html
if (fs.existsSync(indexHtmlPath)) {
    let htmlContent = fs.readFileSync(indexHtmlPath, 'utf8');
    
    // Update image/video references
    htmlContent = updateReferences(htmlContent);
    
    // Update js paths from js/ to assets/js/
    htmlContent = htmlContent.replace(/import ".\/js\//g, 'import "./assets/js/');
    htmlContent = htmlContent.replace(/src="js\//g, 'src="assets/js/');
    
    // Update css path (we will remove CDN and add local CSS)
    if (!htmlContent.includes('assets/css/output.css')) {
        htmlContent = htmlContent.replace(
            /<script src="https:\/\/cdn\.tailwindcss\.com"><\/script>/i,
            '<link rel="stylesheet" href="assets/css/output.css">'
        );
    }
    
    // Also add a header to index.html if not present
    if (!htmlContent.includes('DVC App - Main Entry')) {
        htmlContent = htmlContent.replace('<head>', '<head>\n    <!-- \n    ========================================================\n    DVC App - Main Entry\n    ========================================================\n    This is the main HTML file that loads styles and modules.\n    ========================================================\n    -->');
    }
    
    fs.writeFileSync(indexHtmlPath, htmlContent);
    console.log(`Updated index.html`);
}
