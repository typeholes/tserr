cd packages/tserr-server/ && ./build.sh && cd -

cd packages/tserr-standalone/ && ./build.sh && cd -

project=${1:-'/home/hw/projects/others/Particle-Incremental/'}

# pass '-brk' to wait for debugger on startup
node --inspect$2 packages/tserr-standalone/out/main.js "$project" 3100
