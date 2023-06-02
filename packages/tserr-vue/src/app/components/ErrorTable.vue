<script setup lang="ts">
import { format } from 'prettier'
import parserTS from 'prettier/parser-typescript'
import type { Highlighter } from 'shiki'
import { inject } from 'vue'
import diff from 'html-diff-ts'

const props = defineProps<{
  errorText: string
  indent: number
  seperator: string
  whenSeperatorClicked: () => void
}>()

const highlighter = inject<Highlighter>('highlighter')

const parts = props.errorText.split("'")

const words: string[] = []
const types: string[] = []
const highlighted: string[] = []

for (let i = 0; i < parts.length; i++) {
  const part = parts[i].trim()
  if (part === '' || part === '.' || part === '?') {
    continue
  }

  if (i % 2 === 0) {
    words.push(part)
  } else {
    types.push(part)
    highlighted.push(highlight(formatCode(part)))
  }
}

if (highlighted.length === 2) {
  const [expected, actual] = highlighted
  const diffResult = diff(expected, actual)
  highlighted.push(diffResult)
}


function highlight(code: string) {
  if (highlighter) {
    return highlighter.codeToHtml(code, { lang: 'ts' })
  }
  return code
}

function formatCode(code: string) {
  try {
    return format(`declare const __TSE_STUB__: ${code}`, {
      parser: 'typescript',
      plugins: [parserTS]
    }).replace(/declare const __TSE_STUB__:\s+/, '')
  } catch (e) {
    return `${e}\n${code}`
  }
}
</script>

<template>
  <div class="row">
    <div
      v-if="indent > 0"
      :style="{ width: `${indent * 2}rem`, textAlign: 'right' }"
      @click="props.whenSeperatorClicked"
    >
      {{ props.seperator }}
    </div>

    <table>
      <tr>
        <template v-for="(text, index) in words" :key="index">
          <th>{{ text }}</th>
        </template>
      </tr>
      <tr>
        <template v-for="(html, index) in highlighted" :key="index">
          <td>
            <code>
              <div v-html="html" />
            </code>
          </td>
        </template>
      </tr>
    </table>
  </div>
</template>

<style scoped>
table,
th,
td {
  border: 1px solid rgb(105, 129, 0);
  border-collapse: collapse;
  padding-left: 0.3rem;
  padding-right: 0.3rem;
  align-content: top;
}

td {
  width: max-content;
  vertical-align: top;
}

table {
  width: max-content;
}

.row {
  display: flex;
  flex-direction: row;
  gap: 0.1rem;
}

code {
  white-space: pre-wrap;
  text-align: left;
  max-height: 30rem;
  overflow-y: auto;
  display: inline-block;
  scrollbar-width: none;
}

code::-webkit-scrollbar {
  /* WebKit */
  width: 0;
  height: 0;
}

</style>
