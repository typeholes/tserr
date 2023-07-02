npx nx run-many --target=build

mv dist/packages/tserr-vscode-app/main.js main.bak.js
cp -r packages/tserr-vscode-app/out/* dist/packages/tserr-vscode-app/
mv main.bak.js dist/packages/tserr-vscode-app/main.js
