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
import { parseError } from './parseError.js';
import { FunctionDeclaration } from 'ts-morph';
import { TypeAliasDeclaration } from 'ts-morph';
import { MethodDeclaration } from 'ts-morph';
import { ClassDeclaration } from 'ts-morph';
import { type ErrorServer } from './server.js';
import { group } from './util.js';
import { Err, FlatErr, flattenErr } from './Err.js';
import { kindHandlers, onNodeKind } from './kindHandler.js';

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

let project: Project | undefined;
let tsConfigFilePath: string | undefined = undefined;
let server: ErrorServer | undefined = undefined;

export function setProject(path: string, forServer: ErrorServer) {
  // console.log('path: ', path);
  server = forServer;
  if (project) {
    project === undefined;
  }
  tsConfigFilePath = path;
  return processFileEvents;
}

function openProject() {
  if (project !== undefined || tsConfigFilePath === undefined) {
    return;
  }
  project = new Project({
    compilerOptions: {
      target: ScriptTarget.ESNext,
    },
    tsConfigFilePath,
  });
}

function processFileEvents(events: [string, string][]) {
  if (!project) {
    openProject();
  }

  const promises = events.map(
    (e) =>
      project?.getSourceFile(e[1])?.refreshFromFileSystem() ??
      Promise.resolve(undefined)
  );
  Promise.all(promises).then(() => {
    if (!project) {
      return;
    }
    const diagnostics = group(
      project.getPreEmitDiagnostics(),
      (diagnostic) =>
        diagnostic.getSourceFile()?.getFilePath() ?? 'unknown file'
    );

    for (const fileName in diagnostics) {
      const payload: FlatErr[] = [];
      for (const diagnostic of diagnostics[fileName]) {
        const resolved = handleError(diagnostic, fileName);
        if (resolved) {
          // console.log(resolved);
          payload.push(...resolved);
        }
      }
      server?.sendResolvedError(fileName, payload);
    }

    project.getSourceFiles().forEach((file) => {
      file.getDescendants().forEach((node) => onNodeKind(kindHandlers, node));
    });
  });
}

function handleError(diagnostic: Diagnostic, fileName: string): FlatErr[] {
  const sourceFile = diagnostic.getSourceFile();
  if (sourceFile === undefined) {
    return [];
  }

  const pos = diagnostic.getStart();
  if (pos === undefined) {
    return [];
  }

  const fromNode = getDeepestNode(sourceFile, pos);
  if (fromNode === undefined) {
    return [];
  }

  const fromType = unaliasType(fromNode.getType());

  const err = diagnosticToErr(diagnostic);

  const resolved = resolveError(fromNode, err);

  return resolved;

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

function resolveError(fromNode: Node, err: Err): FlatErr[] {
  const flattened = flattenErr(err);
  const refined = refineErrror(flattened, fromNode);
  refined.forEach((flat) =>
    flat.parsed.forEach((p) => {
      createSupplement(p, fromNode);
      createFixes(p, fromNode);
    })
  );
  return refined;
}

let maxFixId = 0;
function createFixes(e: FlatErr['parsed'][number], fromNode: Node) {
  const fixes: [fixId: number, fixDescription: string, fixFn: () => void][] =
    [];
  const id = e[0];
  const parsed = e[2];

  const sourceFile = fromNode.getSourceFile();

  if (parsed.type === 'excessProperty') {
    if (fromNode.getText() === parsed.key) {
      const parent = fromNode.getParentIfKind(SyntaxKind.PropertyAssignment);
      if (parent) {
        const fixNode = parent;
        fixes.push([
          maxFixId++,
          `remove property ${parsed.key}`,
          () => {
            console.log('removing property assignment ${parsed.key}');
            fixNode.remove();
            sourceFile.saveSync();
          },
        ]);
        const objectLiteral = parent.getParentIfKind(
          SyntaxKind.ObjectLiteralExpression
        );
        if (objectLiteral) {
          const fixNode = objectLiteral;
          fixes.push([
            maxFixId++,
            'add cast',
            () => {
              fixNode.replaceWithText(
                objectLiteral.getFullText() + ' as ' + parsed.to
              );
              sourceFile.save();
            },
          ]);
        }
      }
    }
  }
  server?.sendFixes({ [id]: fixes });
}

function createSupplement(e: FlatErr['parsed'][number], fromNode: Node) {
  const id = e[0];
  const parsed = e[2];
  if (parsed.type === 'aliasSelfReference' || parsed.type === 'selfReference') {
    const path = findSelfReferences(fromNode);
    if (path) {
      const pathText = path
        .reverse()
        .map(([x]) => nodeToLineText(x))
        .join('\n');
      // console.log('self ref: \n', pathText);
      server?.sendSupplement(id, pathText);
      // debugger;
    }
  }
  /*
   const parsed = traverseErr((e) => {
      return e.parsed.map((error, i) => {
         console.log(e.lines[i]);
         if (
            errorTypes.selfReference.allows(error) ||
            errorTypes.aliasSelfReference.allows(error)
         ) {
            const path = findSelfReferences(fromNode);
            if (path) {
               const pathText = path
                  .reverse()
                  .map(([x, _]) => nodeToLineText(x))
                  .join('\n');
               console.log('self ref: \n', pathText);
               // debugger;
            }
            return { error, path: path?.map((x) => x.map((y) => y.getText())) };
         }
         if (errorTypes.notAssignable.allows(error)) {
            const parent = fromNode.getFirstAncestorByKind(
               SyntaxKind.VariableDeclaration
            );
            if (parent === undefined) {
               return { error };
            }

            // const initializer = parent.getInitializer();
            const expr = parent.getInitializer();

            const exprType = unaliasType(expr?.getType()!);
            const parentType = unaliasType(parent.getType());
            if (exprType === undefined) {
               return { error };
            }
            console.log(parentType.getText(), exprType.getText());
            if (
               parentType instanceof TypeNode &&
               exprType instanceof TypeNode
            ) {
               // const d = diff(parentType.getStructure(), exprType);
               // console.log(d);
            }
            // debugger;
            return { error };
         } else {
            return { error };
         }
      });
   })(err);
   */
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

function diagnosticToErr(diagnostic: Diagnostic): Err {
  const code = diagnostic.getCode();
  const line = diagnostic.getLineNumber() ?? 0;

  const start = diagnostic.getStart() ?? 0;
  const message = diagnostic.getMessageText();

  if (typeof message === 'string') {
    const lines = message.split('\n');
    const parsed = lines.map(parseError);
    return [{ code, line, start, lines, parsed, children: [] }];
  }

  return DiagnosticMessageChainToErr(message, line, start);
}

function DiagnosticMessageChainToErr(
  chain: DiagnosticMessageChain | undefined,
  line: number,
  start: number
): Err {
  if (chain === undefined) {
    return [];
  }
  const code = chain.getCode();
  const lines = chain.getMessageText().split('\n');
  const parsed = lines.map(parseError);
  const next = chain.getNext() ?? [];
  const children = next
    .map((c) => DiagnosticMessageChainToErr(c, line, start))
    .flat();
  return [{ code, line, start, lines, parsed, children }];
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
  check: (readonly [Node, Declaration | undefined])[]
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
      [...check, [ref, getDeclarationAncestor(ref)]]
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
          `${exprText} /*${castText}*/`
        );

        const err = file
          .getPreEmitDiagnostics()
          .find((diagnostic) => diagnostic.getLineNumber() === exprLineNumber);
        if (err === undefined) {
          console.log(`No error found at line: ${exprLineNumber} ${castText})`);
        } else {
          const errCode = err.getCode().toString();
          if (errCode !== code) {
            console.log(
              `Incorrect error ${errCode} vs ${code} at line: ${exprLineNumber} ${castText})`
            );
          }
        }
        replacedWith.replaceWithText(holdText);
      }
    });
  });
}

function refineErrror(err: FlatErr, fromNode: Node): FlatErr[] {
  const ret: FlatErr[] = [{ ...err, lines: [], parsed: [], codes: [] }];
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
      /* prune the not assignable error */
    } else if (code === 2769) {
      /* prune no overloads match error */
    } else if (code === 2772) {
      const call = Node.is(SyntaxKind.CallExpression)(fromNode)
        ? fromNode
        : fromNode.getFirstAncestorByKind(SyntaxKind.CallExpression);
      const functionName = call?.getChildAtIndex(0).getText() ?? 'unknownFunction';
      supplement = JSON.stringify({ ...parsed[2], functionName }, null, 2);
      ret.push({
        ...err,
        code: code,
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
        server?.sendSupplement(parsed[0], supplement);
        supplement = undefined;
      }
    }
  }

  return ret;
}
