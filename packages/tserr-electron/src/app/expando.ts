import type { Node, Type, ObjectType, UnionOrIntersectionType, PropertySignature } from 'typescript';
const ts = window.tserrFileApi.ts;

export type _Type = Type;

// const ts = window.tserrFileApi.ts;
const printer = ts.createPrinter();
const printNode = (n: Node) =>
  printer.printNode(ts.EmitHint.Unspecified, n, n.getSourceFile());

const TypeFlags = ts.TypeFlags;

export function expando(type: Type, depth: number = 1): string {
  let str = '';

  const checker = type.checker;

  if (depth < 0) return checker.typeToString(type);

  if (type.flags & TypeFlags.UnionOrIntersection) {
    const sep = type.flags & TypeFlags.Union ? ' | ' : ' & ';
    return (type as UnionOrIntersectionType).types.map(expando, depth-1) . join(sep);
  }

  if (
    type.flags &
    (TypeFlags.Primitive | TypeFlags.AnyOrUnknown | TypeFlags.Never)
  ) {
    return checker.typeToString(type);
  }

  const elementType = checker.getElementTypeOfArrayType(type);
  if (elementType) {
    return expando(elementType, depth-1) + '[]';
  }

  if (type.flags & ts.TypeFlags.Object) {
    const symbol = type.getSymbol();
    if (symbol && symbol.escapedName !== 'Array') {
      str += '{';
      const obj = type as ObjectType;
      for (const symbol of obj.getApparentProperties()) {
        if (symbol.valueDeclaration) {
          if ( ts.isPropertySignature(symbol.valueDeclaration)) {
          const decl = symbol.valueDeclaration;
          // printNode(decl.name) + ': ' + expando(decl.type?., depth-1)
          }

          str += printNode(symbol.valueDeclaration);
        }
      }
    }
  }

  return str;
}
