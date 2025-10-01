const fs = require('fs');
const path = require('path');

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
  const monacoSrcDir = path.join(rootDir, 'node_modules', 'monaco-editor', 'min');
  const monacoDestDir = path.join(distDir, 'monaco');

  await fs.promises.rm(distDir, { recursive: true, force: true });
  await fs.promises.mkdir(distDir, { recursive: true });

  await copyFile(path.join(srcDir, 'contentScript.js'), path.join(distDir, 'contentScript.js'));
  await copyDirectory(extensionDir, distDir);
  await copyDirectory(monacoSrcDir, monacoDestDir);

  console.log('Build complete. Load the dist/ folder as the extension root.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
