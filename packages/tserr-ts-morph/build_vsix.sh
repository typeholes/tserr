npx esbuild --bundle --outdir=out --platform=node --external:vscode src/index.ts
cp package.json out
sed -i 's/@typeholes\///' out/package.json
cd out
vsce package
cd ..

