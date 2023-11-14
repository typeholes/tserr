(cd ../tserr-common && ./build.sh) &&
(cd ../tserr-watcher && ./build.sh) &&
(cd ../tserr-ts-morph && ./build.sh) &&
(quasar dev -m electron -- --tserrPlugins \
	/home/hw/projects/nx/typeholes/packages/tserr-watcher/out/index.js \
	/home/hw/projects/nx/typeholes/packages/tserr-ts-morph/out/index.js \
)

