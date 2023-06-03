# Typeholes TSerr

Warning: This project is currently just a proof of concept and is in no way ready for actual use

The goal is to create a utility to simplify dealing with typescript errors.
Planned Features:

- Formatted and syntax highlighted errors for types in error messages
- Structural diffs for incompatible types
- Goto definition for types in error messages
- Supplemental information to help fix specific types of errors
  - Providing the reference path that makes a definition self referencing
  - Identifying calls that cause hoisting
- A utility to cast to aliases for "any" that specify a tsc error code that you are working around, with checks to very the code is correct

## Usage

npm install

npx nx affected:build

node dist/packages/tserr-server/main.js <project path>

open http://localhost:3000/ in your browser

## Current State

Only handles a few error types
layout is abysmal
formatting and syntax highlighting work
paths for self references work
error code casts work but aren't in the UI yet
