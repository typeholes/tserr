(cd ../tserr-common && ./build.sh) &&
(cd ../tserr-watcher && ./build.sh) &&
(cd ../tserr-ts-morph && ./build.sh) &&
(quasar dev -m electron -- --trace-warnings  --tserrConfig `realpath tserr.conf.json` )

