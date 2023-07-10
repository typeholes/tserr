npx esbuild --bundle --outdir=out --platform=node --external:vscode src/index.ts
cp -r ../tserr-vue/dist out/
cp package.json out
cd out
vsce package
cd ..

