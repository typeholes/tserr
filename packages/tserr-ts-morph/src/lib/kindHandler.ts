import {
  KindToNodeMappings,
  SyntaxKind,
  Node,
  VariableDeclaration,
  FunctionDeclaration,
  TypeAliasDeclaration,
  AsExpression,
} from 'ts-morph';

type KindHandlers = {
  -readonly [K in keyof typeof SyntaxKind]: ((
    node: KindToNodeMappings[(typeof SyntaxKind)[K]]
  ) => void)[];
};

export function onNodeKind(handlers: KindHandlers, node: Node) {
  for (const kindName in handlers) {
    const id = SyntaxKind[kindName as keyof typeof SyntaxKind];
    if (Node.is(id)) {
      const fns = handlers[kindName];
      fns?.forEach((fn) => fn(node));
    }
  }
}

function checkEmptyObjectTypes(
  node: VariableDeclaration | FunctionDeclaration | TypeAliasDeclaration
) {
  const type = Node.isFunctionDeclaration(node)
    ? node.getReturnType()
    : node.getType();
  return (
    type.isObject() &&
    type.getApparentProperties().length === 0 &&
    node.getKind() !== SyntaxKind.MappedType
  );
}

const checkTscIgnore = (expr: AsExpression) => {
  const castText = expr.getTypeNode()?.getText() ?? 'no type node';
  const holdText = expr.getFullText();
  const exprText = expr.getExpression().getFullText();
  console.log(castText);
  const exprLineNumber = expr.getEndLineNumber();
  if (castText.match(/^ignore_TSC[0-9]+$/)) {
    const code = castText.slice(10);
    const replacedWith = expr.replaceWithText(`${exprText} /*${castText}*/`);

    const file = expr.getSourceFile();
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
};

export const kindHandlers: KindHandlers = Object.fromEntries(
  Object.keys(SyntaxKind).map((x) => [x, []])
) as never;

kindHandlers.FunctionDeclaration.push(checkEmptyObjectTypes);
kindHandlers.VariableDeclaration.push(checkEmptyObjectTypes);
kindHandlers.TypeAliasDeclaration.push(checkEmptyObjectTypes);
// kindHandlers.AsExpression.push(checkTscIgnore);
