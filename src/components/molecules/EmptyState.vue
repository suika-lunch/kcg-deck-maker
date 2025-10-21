<!--
  仕様
  - 目的: 空状態やエラー状態の簡易表示。
  - 入力(Props): tone?: "neutral" | "error"（既定: "neutral"）
  - 出力(Emits): なし
  - スロット: icon / title / description（いずれも任意）
  - アクセシビリティ: 視覚的情報のため、親側で適切な role を付与可能。
  - 副作用: なし（表示専用）
-->
<template>
  <div class="col-span-full mt-2 text-center sm:mt-4">
    <div class="flex flex-col items-center gap-1 p-2 sm:gap-2 sm:p-4">
      <div :class="iconWrapperClass">
        <slot name="icon">
          <svg
            class="h-4 w-4 text-slate-400 sm:h-5 sm:w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            ></path>
          </svg>
        </slot>
      </div>
      <div class="text-center" :class="messageColorClass">
        <p class="mb-1 text-sm font-medium sm:text-base">
          <slot name="title">データが見つかりません</slot>
        </p>
        <p class="text-xs">
          <slot name="description">条件を変更してお試しください</slot>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface Props {
  tone?: "neutral" | "error";
}

const props = withDefaults(defineProps<Props>(), {
  tone: "neutral",
});

const iconWrapperClass = computed(() =>
  props.tone === "error"
    ? "w-8 h-8 sm:w-10 sm:h-10 bg-red-500/20 rounded-full flex items-center justify-center"
    : "w-8 h-8 sm:w-10 sm:h-10 bg-slate-700/50 rounded-full flex items-center justify-center",
);

const messageColorClass = computed(() =>
  props.tone === "error" ? "text-red-400" : "text-slate-400",
);
</script>
