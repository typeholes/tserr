import {  ParsedError } from "@typeholes/tserr-common";
import { FileTextChanges, Node, SyntaxKind } from 'ts-morph';

const notSemantic = { isSemantic: false, fixes: [] satisfies {label: string, fn: ()=> void }[] };
export const tsErrPlugin = {
  semanticErrorIdentifiers: [
   (err: ParsedError, fromNode: Node) => {
      if ( ! (err.type === 'unknownError' && err.parts[5] === 'is unresolvable"')) { return notSemantic; }

      const alias = err.parts[4];
      const callNode = fromNode.getFirstAncestorByKind(SyntaxKind.CallExpression);
      if (!callNode) { return notSemantic; }

      const fnName = callNode.getFirstChild()?.getSymbol()?.getName();
      if (! (fnName  === 'scope')) { return notSemantic; }

      const arg = callNode.getArguments()[0];

      if ( Node.is(SyntaxKind.ObjectLiteralExpression)(arg) ) {
        const fix = { label: `add scope alias ${alias}`, fn: () => {
          arg.addProperty(`${alias}: 'unknown' `);
          fromNode.getSourceFile().save();
        }
      }

        err.parts[0] = 'Type or scope alias not found';
        err.parts[1] = alias;
        err.parts.length = 2;

        return { isSemantic: true, fixes: [fix]};

      }


      return notSemantic;
  }
]
};

