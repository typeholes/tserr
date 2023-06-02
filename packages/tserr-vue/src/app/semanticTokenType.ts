// adapted from https://github.com/microsoft/vscode/blob/0acd2722684e02649a30cd7e4ef0f5c4772e5ab2/extensions/typescript-language-features/src/languageFeatures/semanticTokens.ts

// typescript encodes type and modifiers in the classification:
// TSClassification = (TokenType + 1) << 8 + TokenModifier

const enum TokenType {
  class = 0,
  enum = 1,
  interface = 2,
  namespace = 3,
  typeParameter = 4,
  type = 5,
  parameter = 6,
  variable = 7,
  enumMember = 8,
  property = 9,
  function = 10,
  method = 11,
  _ = 12
}

const enum TokenModifier {
  declaration = 0,
  static = 1,
  async = 2,
  readonly = 3,
  defaultLibrary = 4,
  local = 5,
  _ = 6
}

const enum TokenEncodingConsts {
  typeOffset = 8,
  modifierMask = 255
}

export function getTokenTypeFromClassification(tsClassification: number): string | undefined {
  if (tsClassification > TokenEncodingConsts.modifierMask) {
    const idx = (tsClassification >> TokenEncodingConsts.typeOffset) - 1
    return tokenTypes[idx]
  }
  return undefined
}

export function getTokenModifierFromClassification(tsClassification: number) {
  const idx = tsClassification & TokenEncodingConsts.modifierMask
  return tokenModifiers[idx]
}

const tokenTypes: string[] = []
tokenTypes[TokenType.class] = 'class'
tokenTypes[TokenType.enum] = 'enum'
tokenTypes[TokenType.interface] = 'interface'
tokenTypes[TokenType.namespace] = 'namespace'
tokenTypes[TokenType.typeParameter] = 'typeParameter'
tokenTypes[TokenType.type] = 'type'
tokenTypes[TokenType.parameter] = 'parameter'
tokenTypes[TokenType.variable] = 'variable'
tokenTypes[TokenType.enumMember] = 'enumMember'
tokenTypes[TokenType.property] = 'property'
tokenTypes[TokenType.function] = 'function'
tokenTypes[TokenType.method] = 'method'

const tokenModifiers: string[] = []
tokenModifiers[TokenModifier.async] = 'async'
tokenModifiers[TokenModifier.declaration] = 'declaration'
tokenModifiers[TokenModifier.readonly] = 'readonly'
tokenModifiers[TokenModifier.static] = 'static'
tokenModifiers[TokenModifier.local] = 'local'
tokenModifiers[TokenModifier.defaultLibrary] = 'defaultLibrary'
