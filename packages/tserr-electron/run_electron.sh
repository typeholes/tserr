(cd ../tserr-common && ./build.sh) && npm install ../tserr-common/typeholes-tserr-common-0.0.1.tgz &&
(cd ../tserr-watcher && ./build.sh) &&
(cd ../tserr-ts-morph && ./build.sh) &&
(quasar dev -m electron -- --trace-warnings  --tserrConfig `realpath tserr.conf.json` )

