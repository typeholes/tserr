npx nx run tserr-vscode-app:build
cp -r dist/packages/tserr-vue/assets dist/packages/tserr-vscode-app/assets
cp dist/packages/tserr-vue/index.html dist/packages/tserr-vscode-app/

cp packages/tserr-vscode-app/src/assets/package.json dist/packages/tserr-vscode-app

cd dist/packages/tserr-vscode-app
echo 'y' | vsce package --allow-star-activation

