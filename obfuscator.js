const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

const sourceDir = __dirname;
const outputDir = path.join(__dirname, 'frontend');

// Ensure the output directory exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`✅ Created output directory: ${outputDir}`);
}

// Excluded paths (folders & files that should NOT be obfuscated)
const excludePaths = [
    'node_modules',
    'public',
    'views',
    'package.json',
    'package-lock.json',
    '.env',
    'index.js',
];

// Function to check if a file should be excluded from obfuscation
// const shouldExclude = (filePath) => {
//     return excludePaths.includes(path.basename(filePath)); // Check exact match
// };
const shouldExclude = (filePath) => {
    const fileName = path.basename(filePath);
    return excludePaths.includes(fileName) || fileName === 'obfuscator.js'; // Exclude 'obfuscate.js'
};
// Function to obfuscate JavaScript files
const obfuscateFile = (filePath, outputFilePath) => {
    console.log(`🔹 Obfuscating: ${filePath}`);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const obfuscatedCode = JavaScriptObfuscator.obfuscate(fileContent).getObfuscatedCode();

    fs.mkdirSync(path.dirname(outputFilePath), { recursive: true });
    fs.writeFileSync(outputFilePath, obfuscatedCode);
    console.log(`✅ Obfuscated and saved: ${outputFilePath}`);
};

// Function to copy a file
const copyFile = (source, destination) => {
    fs.mkdirSync(path.dirname(destination), { recursive: true }); // Ensure parent directory exists
    fs.copyFileSync(source, destination);
    //console.log(`📄 Copied file: ${source} -> ${destination}`);
};

// Function to copy a directory recursively
const copyDirectory = (source, destination) => {
    if (!fs.existsSync(destination)) {
        fs.mkdirSync(destination, { recursive: true }); // Ensure destination exists
    }

    fs.readdirSync(source).forEach(file => {
        const srcPath = path.join(source, file);
        const destPath = path.join(destination, file);

        if (fs.statSync(srcPath).isDirectory()) {
            copyDirectory(srcPath, destPath); // Recursive copy
        } else {
            copyFile(srcPath, destPath);
        }
    });
};

// Function to traverse directories and process files
const traverseDirectory = (dir) => {
    console.log(`📁 Traversing: ${dir}`);

    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        const outputFilePath = path.join(outputDir, path.relative(sourceDir, fullPath));

        if (fs.statSync(fullPath).isDirectory()) {
            if (excludePaths.includes(file)) {
                console.log(`📂 Copying entire directory (excluded from obfuscation): ${fullPath}`);
                copyDirectory(fullPath, outputFilePath);
            } else {
                traverseDirectory(fullPath); // Continue traversal
            }
        } else if (file.endsWith('.js') && !shouldExclude(fullPath)) {
            obfuscateFile(fullPath, outputFilePath); // Obfuscate JS files
        } else {
            copyFile(fullPath, outputFilePath); // Copy other non-JS files
        }
    });
};

// Start the process
traverseDirectory(sourceDir);

console.log('🎉 Obfuscation and copying complete!');
