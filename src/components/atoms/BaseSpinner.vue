<!--
  仕様
  - 目的: ローディング状態の視覚表示を行うスピナー。
  - 入力(Props): size?: "sm" | "md" | "lg"（既定: "md"）
  - 出力(Emits): なし
  - スロット: default（スクリーンリーダー向け文言、sr-only 内に描画）
  - アクセシビリティ: 親に role="status" / aria-live（polite）。視覚的アイコンと音声の両対応。
  - 副作用: なし（表示専用）
-->
<template>
  <div
    class="inline-flex items-center justify-center"
    role="status"
    aria-live="polite"
  >
    <div :class="spinnerClass"></div>
    <span class="sr-only"><slot>読み込み中...</slot></span>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface Props {
  size?: "sm" | "md" | "lg";
}

const props = withDefaults(defineProps<Props>(), {
  size: "md",
});

const spinnerClass = computed(() => {
  const base =
    "animate-spin rounded-full border-4 border-slate-600 border-t-blue-500";
  if (props.size === "sm") return `${base} h-6 w-6`;
  if (props.size === "lg") return `${base} h-10 w-10`;
  return `${base} h-8 w-8`;
});
</script>

<style scoped>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
