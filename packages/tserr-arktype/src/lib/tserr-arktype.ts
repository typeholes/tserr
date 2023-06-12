import { ParsedError } from '@typeholes/tserr-common';
import { Node, SyntaxKind } from 'ts-morph';

const notSemantic = {
  isSemantic: false,
  fixes: [] satisfies { label: string; fn: () => void }[],
};
export const tsErrPlugin = {
  semanticErrorIdentifiers: [
    (err: ParsedError, fromNode: Node) => {
      if (
        !(err.type === 'notAssignable' && err.to.endsWith('is unresolvable"'))
      ) {
        return notSemantic;
      }

      const alias = err.to.slice(2).replace(/'[^']*$/, '');

      const callNode = fromNode.getFirstAncestorByKind(
        SyntaxKind.CallExpression
      );
      if (!callNode) {
        return notSemantic;
      }

      const fnName = callNode.getFirstChild()?.getSymbol()?.getName();
      if (!(fnName === 'scope')) {
        return notSemantic;
      }

      const arg = callNode.getArguments()[0];

      if (Node.is(SyntaxKind.ObjectLiteralExpression)(arg)) {
        const fix = {
          label: `add scope alias ${alias}`,
          fn: () => {
            arg.addProperty(`${alias}: 'unknown' `);
            fromNode.getSourceFile().save();
          },
        };

        Object.assign(err, {
          type: 'unknownError',
          parts: ['Type or scope alias not found', alias],
        });

        return { isSemantic: true, fixes: [fix] };
      }

      return notSemantic;
    },
  ],
};
