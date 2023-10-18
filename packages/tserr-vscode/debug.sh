npx esbuild --bundle --outdir=out --platform=node --external:vscode --sourcemap src/index.ts

#code /home/hw/projects/others/Particle-Incremental/ --extensionDevelopmentPath=/home/hw/projects/nx/typeholes/packages/tserr-vscode/out --inspect-brk-extensions 7306

code ${1:-/home/hw/projects/others/Particle-Incremental/} --extensionDevelopmentPath=/home/hw/projects/nx/typeholes/packages/tserr-vscode/out --inspect-extensions${2:-""} 7306
