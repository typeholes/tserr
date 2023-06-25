npx esbuild --bundle --outdir=out --platform=node --external:vscode src/main.ts
cp -r ../../dist/packages/tserr-vue/assets ../../dist/packages/tserr-vue/dist ../../dist/packages/tserr-vue/favicon.ico ../../dist/packages/tserr-vue/index.html ../../dist/packages/tserr-vue/languages ../../dist/packages/tserr-vue/themes out
cd out
vsce package
cd ..

