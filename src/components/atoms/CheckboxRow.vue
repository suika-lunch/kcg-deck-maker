<!--
  仕様
  - 目的: 行内にチェックボックスとラベル/内容スロットを配置する簡易行。
  - 入力(Props): checked: boolean
  - 出力(Emits): change
  - スロット: default（ラベル/任意内容）
  - アクセシビリティ: label 要素で input を包含。クリック領域を拡張。
  - 副作用: なし（表示専用）
-->
<template>
  <label
    class="flex items-center cursor-pointer hover:bg-gray-700 p-1 rounded transition-colors"
  >
    <input
      type="checkbox"
      :checked="checked"
      @change="$emit('change')"
      class="form-checkbox h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded"
    />
    <span class="ml-2"><slot /></span>
  </label>
</template>

<script setup lang="ts">
defineProps<{ checked: boolean }>();
defineEmits<{ (e: "change"): void }>();
</script>
