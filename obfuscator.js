const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

const sourceDir = __dirname;
const outputDir = path.join(sourceDir, 'obfuscated');

const normalizePath = (targetPath) => targetPath.split(path.sep).join('/');

const excludePaths = [
    'obfuscated',
    'node_modules',
    '.git',
    '.github',
    '.vscode',
    'dist',
    'backend',
    'awaremagnus',
    'package.json',
    'package-lock.json',
    '.gitignore',
    'obfuscator.js'
].map(normalizePath);

const obfuscatePaths = [
    'phishmagnus/services',
    'phishmagnus/controllers',
    'productsuite/services',
    'productsuite/controllers',
    'utility',
    'middleware',
    'routes'
].map(normalizePath);

const runtimeIgnorePaths = [
    'node_modules',
    '*.log',
    'logs/*',
    'temp/*',
    'tmp/*'
];

const shouldSkipPath = (relativePath) => {
    const rel = normalizePath(relativePath);
    return excludePaths.some((skipPath) => rel === skipPath || rel.startsWith(`${skipPath}/`));
};

const shouldObfuscate = (filePath) => {
    const fileName = path.basename(filePath);
    const relativePath = normalizePath(path.relative(sourceDir, filePath));

    if (!fileName.endsWith('.js')) return false;
    if (relativePath === 'server.js') return false;
    if (relativePath === 'obfuscator.js') return false;

    return obfuscatePaths.some((allowedPath) => relativePath === allowedPath || relativePath.startsWith(`${allowedPath}/`));
};

const cleanOutputDirectory = () => {
    fs.mkdirSync(outputDir, { recursive: true });

    for (const entry of fs.readdirSync(outputDir)) {
        fs.rmSync(path.join(outputDir, entry), { recursive: true, force: true });
    }

    console.log(`Cleaned output directory contents: ${outputDir}`);
};

const obfuscateFile = (filePath, outputFilePath) => {
    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const obfuscatedResult = JavaScriptObfuscator.obfuscate(fileContent, {
            compact: true,
            target: 'node',
            controlFlowFlattening: false,
            deadCodeInjection: false,
            debugProtection: false,
            disableConsoleOutput: false,
            identifierNamesGenerator: 'hexadecimal',
            ignoreRequireImports: true,
            log: false,
            numbersToExpressions: false,
            renameGlobals: false,
            selfDefending: false,
            simplify: true,
            splitStrings: false,
            stringArray: false,
            unicodeEscapeSequence: false
        });

        fs.mkdirSync(path.dirname(outputFilePath), { recursive: true });
        fs.writeFileSync(outputFilePath, obfuscatedResult.getObfuscatedCode());
    } catch (error) {
        console.error(`Error obfuscating ${filePath}: ${error.message}`);
        copyFile(filePath, outputFilePath);
    }
};

const copyFile = (source, destination) => {
    try {
        fs.mkdirSync(path.dirname(destination), { recursive: true });
        fs.copyFileSync(source, destination);
    } catch (error) {
        console.error(`Error copying ${source}: ${error.message}`);
    }
};

const traverseDirectory = (dir) => {
    const relativeDir = normalizePath(path.relative(sourceDir, dir));
    if (relativeDir && shouldSkipPath(relativeDir)) return;

    for (const file of fs.readdirSync(dir)) {
        const fullPath = path.join(dir, file);
        const relativePath = normalizePath(path.relative(sourceDir, fullPath));

        if (!relativePath || shouldSkipPath(relativePath)) continue;

        const outputFilePath = path.join(outputDir, relativePath);
        if (fs.statSync(fullPath).isDirectory()) {
            traverseDirectory(fullPath);
            continue;
        }

        if (shouldObfuscate(fullPath)) {
            obfuscateFile(fullPath, outputFilePath);
        } else {
            copyFile(fullPath, outputFilePath);
        }
    }
};

const createDeployPackage = () => {
    const sourcePackagePath = path.join(sourceDir, 'package.json');
    if (!fs.existsSync(sourcePackagePath)) return;

    const originalPkg = JSON.parse(fs.readFileSync(sourcePackagePath, 'utf8'));
    const originalScripts = originalPkg.scripts || {};

    const sanitizedScripts = {};
    for (const [name, cmd] of Object.entries(originalScripts)) {
        if (typeof cmd !== 'string') continue;
        if (/obfuscator\.js|javascript-obfuscator|build:obfuscate/.test(cmd) || name === 'build:obfuscate') continue;
        sanitizedScripts[name] = cmd;
    }

    if (!sanitizedScripts.start) {
        sanitizedScripts.start = 'node server.js';
    }

    const deployPkg = {
        name: originalPkg.name,
        version: originalPkg.version,
        description: originalPkg.description || '',
        main: originalPkg.main || 'server.js',
        scripts: sanitizedScripts,
        dependencies: originalPkg.dependencies || {}
    };

    if (originalPkg.bin) {
        deployPkg.bin = originalPkg.bin;
    }

    fs.writeFileSync(path.join(outputDir, 'package.json'), JSON.stringify(deployPkg, null, 2));

    const lockFile = path.join(sourceDir, 'package-lock.json');
    if (fs.existsSync(lockFile)) {
        fs.copyFileSync(lockFile, path.join(outputDir, 'package-lock.json'));
    }
};

const createNodemonConfig = () => {
    const nodemonConfig = {
        watch: ['*.*'],
        ext: 'js,mjs,cjs,json',
        ignore: runtimeIgnorePaths,
        delay: '2500'
    };

    fs.writeFileSync(path.join(outputDir, 'nodemon.json'), JSON.stringify(nodemonConfig, null, 2));
};

cleanOutputDirectory();
traverseDirectory(sourceDir);
createDeployPackage();
createNodemonConfig();
console.log('Obfuscation complete.');

