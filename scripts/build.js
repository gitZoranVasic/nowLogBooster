const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function copyFile(src, dest) {
  await fs.promises.mkdir(path.dirname(dest), { recursive: true });
  await fs.promises.copyFile(src, dest);
}

async function copyDirectory(srcDir, destDir) {
  const entries = await fs.promises.readdir(srcDir, { withFileTypes: true });
  await fs.promises.mkdir(destDir, { recursive: true });

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else if (entry.isSymbolicLink()) {
      const link = await fs.promises.readlink(srcPath);
      await fs.promises.symlink(link, destPath);
    } else {
      await copyFile(srcPath, destPath);
    }
  }
}

async function main() {
  const rootDir = path.resolve(__dirname, '..');
  const distDir = path.join(rootDir, 'dist');
  const srcDir = path.join(rootDir, 'src');
  const extensionDir = path.join(rootDir, 'extension');
  const webpackBuildDir = path.join(rootDir, 'build');

  // Clean and create dist directory
  await fs.promises.rm(distDir, { recursive: true, force: true });
  await fs.promises.mkdir(distDir, { recursive: true });

  // 1) Run webpack to build Monaco page bundle
  console.log('Building webpack bundle...');
  execSync('npx webpack --config webpack.config.js', { stdio: 'inherit', cwd: rootDir });

  // 2) Copy all produced webpack assets into dist (bundle + workers + chunks)
  await copyDirectory(webpackBuildDir, distDir);

  // 3) Copy content script 
  await copyFile(path.join(srcDir, 'contentScript-simple.js'), path.join(distDir, 'contentScript-simple.js'));
  
  // 4) Copy extension files (manifest.json)
  await copyDirectory(extensionDir, distDir);

  console.log('Build complete. Load the dist/ folder as the extension root.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
