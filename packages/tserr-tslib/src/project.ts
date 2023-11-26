import type { Schema, DiagnosticArgument } from '@typeholes/tserr-common';
// import * as fs from 'fs';
import * as ts from 'typescript';
import { diagnosticToErr, mkLoc } from './handleDiagnostics';

const printer = ts.createPrinter();

let schema: Schema;

export function setSchema(newSchema: Schema) {
  schema = newSchema;

  schema.Project.onMutate.push((_action, arg, existing, merged) => {
    const project = merged ?? arg;
    if (existing?.open === project.open) {
      return;
    }
    project.open ? watchMain(project.path + '/' + project.filename) : undefined; //closeProject)(project);
  });

  schema.ErrDesc.add({
    name: 'FakeError',
    keys: ['msg','0','1', '2', '3', '4', '5', '6'],
  });
}

export function getSchema() {
  return schema;
}



export function watchMain(configPath: string) {
  /**
   * Prints a diagnostic every time the watch status changes.
   * This is mainly for messages like "Starting compilation" or "Compilation completed".
   */
  function reportWatchStatusChanged(diagnostic: ts.Diagnostic) {
    console.info(diagnostic.messageText);
    if (
      typeof diagnostic.messageText === 'string' &&
      diagnostic.messageText.startsWith(
        'File change detected. Starting incremental compilation',
      )
    ) {
      schema.ErrLocation.$.At.Err.truncate();
      schema.ErrLocation.truncate();
    }
    //
  }

  function reportDiagnostic(diagnostic: ts.Diagnostic) {
    if (diagnostic.file) {
      diagnosticToErr(diagnostic as ts.DiagnosticWithLocation, mkLoc(diagnostic.file, 0, 0,''), '');
    }
    console.error(
      'Error',
      diagnostic.code,
      ':',
      ts.flattenDiagnosticMessageText(
        diagnostic.messageText,
        watchHost.getNewLine(),
      ),
      diagnostic.args?.map((arg) => {
        if (arg.cacheId !== undefined) {
          const argValue = ts.getDiagnosticArgValue(arg.cacheId);
          let result;
          if ('valueDeclaration' in argValue && argValue.valueDeclaration) {
            result = [
              argValue.valueDeclaration,
              ts.SyntaxKind[argValue.valueDeclaration.kind],
              ts.isTypeNode(argValue.valueDeclaration),
              printer.printNode(
                ts.EmitHint.Unspecified,
                argValue.valueDeclaration,
                argValue.valueDeclaration.getSourceFile(),
              ),
            ];
          } else {
            result = [argValue];
          }
          return [arg.text, ...result];
        } else {
          return arg;
        }
      }),
    );
  }

  const watchHost = ts.createWatchCompilerHost(
    configPath,
    {},
    ts.sys,
    ts.createSemanticDiagnosticsBuilderProgram,
    reportDiagnostic,
    reportWatchStatusChanged,
  );

  // const host: ts.server.ServerHost = {
  //   ...ts.sys,
  //   ...watchHost,
  //   setImmediate: (callback: (...args: any[]) => void, ...args: any[]) =>
  //     setImmediate(callback, args),
  //   clearImmediate,
  //   setTimeout,
  //   clearTimeout,
  //   useCaseSensitiveFileNames: ts.sys.useCaseSensitiveFileNames,
  // };

  // const service = new ts.server.ProjectService({
  //   host,
  //   logger: null!,
  //   cancellationToken: ts.server.nullCancellationToken,
  //   session: null!,
  //   useInferredProjectPerProjectRoot: false,
  //   useSingleInferredProject: false,
  // });

  return ts.createWatchProgram(watchHost);
}
