import {
  Diagnostic,
  DiagnosticMessageChain,
  Project,
  ScriptTarget,
  SourceFile,
  Node,
  VariableDeclaration,
  Type,
  TypeNode,
  SyntaxKind,
} from 'ts-morph';
import { FunctionDeclaration, TypeAliasDeclaration } from 'ts-morph';
import { MethodDeclaration } from 'ts-morph';
import { ClassDeclaration } from 'ts-morph';
import { group } from './util.js';
import {
  ErrLocation,
  ProjectDesc,
  parseTsErrorMessage,
  schema as origSchema,
  Schema,
} from '@typeholes/tserr-common';

let schema = origSchema;

export function setSchema(newSchema: Schema) {
  schema = newSchema;

  schema.Project.onMutate.push((_action, arg, existing, merged) => {
    const project = merged ?? arg;
    if (existing?.open === project.open) {
      return;
    }
    (project.open ? openProject : closeProject)(project);
  });
}

type Declaration =
  | VariableDeclaration
  | FunctionDeclaration
  | TypeAliasDeclaration
  | MethodDeclaration
  | ClassDeclaration;
const declarationKinds = [
  SyntaxKind.FunctionDeclaration,
  SyntaxKind.TypeAliasDeclaration,
  SyntaxKind.VariableDeclaration,
  SyntaxKind.MethodDeclaration,
  SyntaxKind.ClassDeclaration,
];

const projects: Record<string, Project> = {};

function closeProject(projectDesc: ProjectDesc) {
  const tsConfigFilePath = projectDesc.path + '/' + projectDesc.filename;
  if (tsConfigFilePath in projects) {
    delete projects[tsConfigFilePath];
  }
}
function openProject(projectDesc: ProjectDesc) {
  const tsConfigFilePath = projectDesc.path + '/' + projectDesc.filename;

  projects[tsConfigFilePath] = new Project({
    compilerOptions: {
      target: ScriptTarget.ESNext,
    },
    tsConfigFilePath,
  });
  console.log(
    'ts-morph opened project',
    projects[tsConfigFilePath].getCompilerOptions(),
  );
}

export function processFileEvents(
  events: { type: string; filePath: string }[],
) {
  for (const tsConfigFilePath in projects) {
    const project = projects[tsConfigFilePath];

    if (!project) {
      continue;
    }

    console.log('ts-morph processing file events');

    const promises = events.map(
      (e) =>
        project?.getSourceFile(e.filePath)?.refreshFromFileSystem() ??
        Promise.resolve(undefined),
    );
    Promise.all(promises).then(() => {
      if (!project) {
        return;
      }
      const diagnostics = group(
        project.getPreEmitDiagnostics(),
        (diagnostic) =>
          diagnostic.getSourceFile()?.getFilePath() ?? tsConfigFilePath,
      );

      if ('' in diagnostics) {
        diagnostics[tsConfigFilePath] = diagnostics[''];
        delete diagnostics[''];
      }

      for (const fileName in diagnostics) {
        for (const diagnostic of diagnostics[fileName]) {
          handleError(diagnostic, fileName, tsConfigFilePath);
        }
      }

      // project.getSourceFiles().forEach((file) => {
      //   file.getDescendants().forEach((node) => onNodeKind(kindHandlers, node));
      // });
    });
  }
}

function handleError(
  diagnostic: Diagnostic,
  _fileName: string,
  tsConfigFilePath: string,
): void {
  const sourceFile = diagnostic.getSourceFile();

  if (sourceFile === undefined) {
    const loc: ErrLocation = {
      fileName: tsConfigFilePath,
      span: { start: { line: 0, char: 0 }, end: { line: 0, char: 0 } },
    };
    const err = diagnosticToErr(diagnostic, loc);
    return;
  }

  const startPos = diagnostic.getStart();
  if (startPos === undefined) {
    return;
  }
  const endPos = diagnostic.getLength() ?? 0 + startPos;

  const loc = mkLoc(sourceFile, startPos, endPos);

  // const fromNode = getDeepestNode(sourceFile, startPos);
  // if (fromNode === undefined) {
  //   return ;
  // }

  // let lineNode = fromNode;
  // while (!lineNode.isFirstNodeOnLine() || lineNode.getChildCount() === 0) {
  //   const parent = lineNode.getParent();
  //   if (!parent) break;
  //   lineNode = parent;
  // }

  // const lineNodeSrc = lineNode.getText().trim();

  // const fromType = unaliasType(fromNode.getType());

  diagnosticToErr(diagnostic, loc);

  /*
  resolved.forEach((err) =>
    err.parsed.forEach((parsed) =>
      semanticErrorIdentifiers.forEach((identifier) => {
        const idenfied = identifier(parsed[2], fromNode);
        if (idenfied.isSemantic) {
          const fixes = idenfied.fixes.map((x) => mkFix(x.label, x.fn));
          tserrApi?.send.fixes({ [parsed[0]]: fixes });
        }
      })
    )
  );
  */

  // const childType = fromNode.getType();

  // const childText = fromNode.getText().slice(0, fromNode.getFullWidth());

  // if (childType.getText() === 'ZipTied') {
  //    childType.getAliasSymbol()?.getDeclarations()[0].getText();

  //    console.log(
  //       {
  //          pos,
  //          childText,
  //          childTypeText: childType.getText(),
  //          childType: childType.getTargetType(),
  //       },
  //       diagnostic.getMessageText()
  //    );
  // }
}

function getDeepestNode(file: SourceFile, pos: number): Node | undefined {
  let child = file.getChildAtPos(pos);
  if (child === undefined) {
    return undefined;
  }

  let newChild: typeof child | undefined;
  while ((newChild = child.getChildAtPos(pos))) {
    if (newChild !== undefined) {
      child = newChild;
    }
  }

  return child;
}

type TypeExpansion = Map<Type, string>;
function getExpansions(type: Type) {
  const symbol = type.getAliasSymbol() || type.getSymbol();
  if (symbol !== undefined) {
    const declarations = symbol.getDeclarations();
  }
}

function unaliasType(type: Type): Type | TypeNode {
  const symbol = type.getAliasSymbol() || type.getSymbol();
  if (symbol === undefined) {
    return type;
  }

  const declarations = symbol.getDeclarations();
  if (declarations.length > 1) {
    // debugger;
  }

  const decl = symbol.getDeclarations()[0];
  if (!Node.isTypeAliasDeclaration(decl)) {
    return type;
  }

  return decl.getTypeNode() ?? type;
}

function mkLoc(
  sourceFile: SourceFile,
  startPos: number,
  endPos: number,
): ErrLocation {
  const fileName = sourceFile.getFilePath().toString();
  const start = sourceFile.getLineAndColumnAtPos(startPos);
  const end = sourceFile.getLineAndColumnAtPos(endPos);

  return {
    fileName,
    span: {
      start: { line: start.line, char: start.column },
      end: { line: end.line, char: end.column },
    },
  };
}
function diagnosticToErr(
  diagnostic: Diagnostic,
  defaultLoc: ErrLocation,
): void {
  const fileName =
    diagnostic.getSourceFile()?.getFilePath().toString() ?? defaultLoc.fileName;
  const code = diagnostic.getCode();
  let line = diagnostic.getLineNumber() ?? 0;
  let endLine = line;
  let start = diagnostic.getStart() ?? 0;
  let end = start + (diagnostic.getLength() ?? 0);
  const message = diagnostic.getMessageText();

  const sourceFile = diagnostic.getSourceFile();
  const loc = sourceFile ? mkLoc(sourceFile, start, end) : defaultLoc;
  schema.ErrLocation.add(loc);

  if (typeof message === 'string') {
    const lines = message.split('\n');
    for (const line of lines) {
      const err = parseTsErrorMessage(schema, line);
      if (!err) {
        throw (
          'todo: handle undefined ( return when no parser succeeds )\n' + line
        );
      }
      schema.ErrLocation.$.At.Err.add([loc, err]);
    }
  } else {
    DiagnosticMessageChainToErr(message, loc);
  }

  function DiagnosticMessageChainToErr(
    chain: DiagnosticMessageChain | undefined,
    loc: ErrLocation,
  ): void {
    if (chain === undefined) {
      return;
    }
    const code = chain.getCode();
    const lines = chain.getMessageText().split('\n');
    for (const line of lines) {
      const err = parseTsErrorMessage(schema, line);
      if (!err) {
        throw (
          'todo: handle undefined ( return when no parser succeeds )\n' + line
        );
      }
      schema.ErrLocation.$.At.Err.add([loc, err]);
    }

    chain.getNext()?.forEach((c) => DiagnosticMessageChainToErr(c, loc));
  }

  function getDeclarationAncestor(n: Node | undefined) {
    if (n === undefined) {
      return undefined;
    }
    const decl = n
      .getAncestors()
      .find((a) => declarationKinds.includes(a.getKind()));
    if (decl === undefined) {
      return undefined;
    }
    return decl as Declaration;
  }

  function IndirectReferencePath(
    target: Node,
    check: (readonly [Node, Declaration | undefined])[],
  ): undefined | [Node, Declaration][] {
    const top = check[check.length - 1];
    const decl = top[1];
    if (decl === undefined) {
      return undefined;
    }
    const backRefs = decl.findReferencesAsNodes();
    if (backRefs.length === 0) {
      return undefined;
    }
    if (backRefs.some((b) => b.getAncestors().includes(target))) {
      return check as [Node, Declaration][];
    }
    for (const ref of backRefs) {
      const path: undefined | [Node, Declaration][] = IndirectReferencePath(
        target,
        [...check, [ref, getDeclarationAncestor(ref)]],
      );
      if (path !== undefined) {
        return path;
      }
    }
    return undefined;
  }

  function findSelfReferences(fromNode: Node) {
    const parent = getDeclarationAncestor(fromNode);
    if (parent === undefined) {
      return undefined;
    }
    const refs = parent
      .findReferencesAsNodes()
      .map((r) => [r, getDeclarationAncestor(r)] as const);

    // console.log(refs.map((x) => nodeToLineText(x[0])));

    for (const ref of refs) {
      const path = IndirectReferencePath(parent, [ref]);
      if (path !== undefined) {
        return path;
      }
    }
    return undefined;
  }

  function nodeToLineText(n: Node) {
    const line = n.getStartLineNumber();
    return `${line}: ${n.getSourceFile().getFullText().split('\n')[line - 1]}`;
  }

  function checkEmptyObject(project: Project) {
    const kinds = [
      SyntaxKind.VariableDeclaration,
      SyntaxKind.FunctionDeclaration,
      SyntaxKind.TypeAliasDeclaration,
    ];
    project.getSourceFiles().forEach((file) => {
      const typeEmptyObject = file.getDescendants().filter((node) => {
        if (!kinds.includes(node.getKind())) {
          return false;
        }
        const type = Node.isFunctionDeclaration(node)
          ? node.getReturnType()
          : node.getType();
        return (
          type.isObject() &&
          type.getApparentProperties().length === 0 &&
          node.getKind() !== SyntaxKind.MappedType
        );
      });
      console.log(typeEmptyObject.map(nodeToLineText));
    });
  }

  // potential workaround for not having code specific ts-expect-error
  // https://github.com/microsoft/TypeScript/issues/19139#issuecomment-689824823
  function checkIgnoreTSC(project: Project) {
    project.getSourceFiles().forEach((file) => {
      console.log(`checking ignore TSC for file ${file.getFilePath()}`);

      file.getDescendantsOfKind(SyntaxKind.AsExpression).forEach((expr) => {
        const castText = expr.getTypeNode()?.getText() ?? 'no type node';
        const holdText = expr.getFullText();
        const exprText = expr.getExpression().getFullText();
        console.log(castText);
        const exprLineNumber = expr.getEndLineNumber();
        if (castText.match(/^ignore_TSC[0-9]+$/)) {
          const code = castText.slice(10);
          const replacedWith = expr.replaceWithText(
            `${exprText} /*${castText}*/`,
          );

          const err = file
            .getPreEmitDiagnostics()
            .find(
              (diagnostic) => diagnostic.getLineNumber() === exprLineNumber,
            );
          if (err === undefined) {
            console.log(
              `No error found at line: ${exprLineNumber} ${castText})`,
            );
          } else {
            const errCode = err.getCode().toString();
            if (errCode !== code) {
              console.log(
                `Incorrect error ${errCode} vs ${code} at line: ${exprLineNumber} ${castText})`,
              );
            }
          }
          replacedWith.replaceWithText(holdText);
        }
      });
    });
  }

  // function refineErrror(err: FlatErr, fromNode: Node): FlatErr[] {
  // return [err];
  /*
  const ret: FlatErr[] = [{ ...err }];
  let supplement: string | undefined = undefined;
  while (err.parsed.length > 0) {
    const code = err.codes.shift() ?? 0;
    console.log('code: ', code);
    const line = err.lines.shift() ?? '';
    const parsed = err.parsed.shift()!;
    if (
      parsed[2].type === 'notAssignable' &&
      err.parsed.length > 0 &&
      err.parsed[0][2].type === 'excessProperty'
    ) {
      // prune the not assignable error
    } else if (code === 2769) {
      // prune no overloads match error
    } else if (code === 2772) {
      const call = Node.is(SyntaxKind.CallExpression)(fromNode)
        ? fromNode
        : fromNode.getFirstAncestorByKind(SyntaxKind.CallExpression);
      const functionName =
        call?.getChildAtIndex(0).getText() ?? 'unknownFunction';
      supplement = JSON.stringify({ ...parsed[2], functionName }, null, 2);
      ret.push({
        ...err,
        code: code.toString(),
        lines: [],
        parsed: [],
        codes: [],
      });
    } else {
      const top = ret[ret.length - 1];
      top.codes.push(code);
      top.lines.push(line);
      top.parsed.push(parsed);
      if (supplement !== undefined) {
        tserrApi?.send.supplement(parsed[0], supplement);
        supplement = undefined;
      }
    }
  }

  return ret;
  */
}
