
echo ### TODO pickup version numbers ###

NPM_CONFIG_REGISTRY=http://localhost:4873

libraries="$( grep -l '"projectType": "library"' packages/*/project.json | cut -d '/' -f 2 )"
for library in $libraries; do
   npx nx run "$library":build:development
#	echo "skipping builds"
done

echo "publishing"
for library in $libraries; do
   node tools/scripts/publish.mjs $library 0.0.1
done

echo installing
for library in $libraries; do
   npm i @typeholes/$library 0.0.1
done
