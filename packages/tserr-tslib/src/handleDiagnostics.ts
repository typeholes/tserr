import { Err, ErrLocation, ErrDesc } from '@typeholes/tserr-common';
import * as ts from 'typescript';
import { getSchema } from './project';

export function diagnosticToErr(
  diagnostic: ts.DiagnosticWithLocation,
  defaultLoc: ErrLocation,
  lineNodeSrc: string,
): void {
  const schema = getSchema();
  const fileName = diagnostic.file?.fileName ?? defaultLoc.fileName;
  const code = diagnostic.code;
  let line = 0; // diagnostic.getLineNumber() ?? 0;
  let endLine = line;
  let start = diagnostic.start ?? 0;
  let end = start + (diagnostic.length ?? 0);
  const message = diagnostic.messageText;

  const sourceFile = diagnostic.file;
  const loc = sourceFile
    ? mkLoc(sourceFile, start, end, lineNodeSrc)
    : defaultLoc;
  schema.ErrLocation.add(loc);

  if (typeof message === 'string') {
    const lines = message.split('\n');
    for (const line of lines) {
      const err: Err<ErrDesc<'FakeError'>> = {
        name: 'FakeError',
        values: {
          msg: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n', 3),
          ...Object.fromEntries(
            (diagnostic.args ?? []).map((v, i) => [`${i}`, v]),
          ),
        },
      };
      schema.ErrLocation.$.At.Err.add([loc, err]);
    }
  } else {
    DiagnosticMessageChainToErr(message, loc);
  }
}

  function DiagnosticMessageChainToErr(
    chain: ts.DiagnosticMessageChain | undefined,
    loc: ErrLocation,
  ): void {
    if (chain === undefined) {
      return;
    }
    const code = chain.code;
    const line = chain.messageText
      const err: Err<ErrDesc<'FakeError'>> = {
        name: 'FakeError',
        values: {
          msg: line,
          ...Object.fromEntries(
            (chain.args ?? []).map((v, i) => [`${i}`, v]),
          ),
        },
      };
     const schema = getSchema();
      schema.ErrLocation.$.At.Err.add([loc, err]);

    chain.next?.forEach((c) => DiagnosticMessageChainToErr(c, loc));
  }

export function mkLoc(
  sourceFile: ts.SourceFile,
  startPos: number,
  endPos: number,
  lineSrc: string,
): ErrLocation {
  const fileName = sourceFile.fileName;
  // const start = sourceFile.getLineAndColumnAtPos(startPos);
  // const end = sourceFile.getLineAndColumnAtPos(endPos);

  const start = { line: 0, column: startPos };
  const end = { line: 0, column: endPos };

  return {
    fileName,
    span: {
      start: { line: start.line, char: start.column },
      end: { line: end.line, char: end.column },
    },
    lineSrc,
  };
}
