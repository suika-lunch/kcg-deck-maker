<!--
  仕様
  - 目的: 汎用ボタン。variant/size/loading/disabled に応じた見た目と状態を提供する。
  - 入力(Props):
    - variant: "primary" | "success" | "danger" | "secondary" | "ghost" (既定: "secondary")
    - size: "xs" | "sm" | "md" | "lg" (既定: "sm")
    - type: "button" | "submit" | "reset" (既定: "button")
    - disabled: boolean (既定: false)
    - loading: boolean (既定: false)
  - 出力(Emits): なし
  - スロット: default（ボタン内容）
  - アクセシビリティ: type 属性/aria-disabled を付与。loading 中はスピナーを先頭に表示。
  - 副作用: なし（表示専用）
-->
<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :aria-disabled="disabled || loading"
    class="inline-flex items-center justify-center rounded font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:outline-none"
    :class="[
      variantClass,
      sizeClass,
      (disabled || loading) && 'disabled:cursor-not-allowed',
    ]"
  >
    <span v-if="loading" class="mr-1 inline-flex">
      <svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        ></circle>
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        ></path>
      </svg>
    </span>
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from "vue";

type Variant = "primary" | "success" | "danger" | "secondary" | "ghost";
type Size = "xs" | "sm" | "md" | "lg";

interface Props {
  variant?: Variant;
  size?: Size;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: "secondary",
  size: "sm",
  type: "button",
  disabled: false,
  loading: false,
});

const variantClass = computed(() => {
  switch (props.variant) {
    case "primary":
      return "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 disabled:from-slate-600 disabled:to-slate-700";
    case "success":
      return "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800 disabled:from-slate-600 disabled:to-slate-700";
    case "danger":
      return "bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 disabled:from-slate-600 disabled:to-slate-700";
    case "ghost":
      return "bg-transparent text-slate-300 hover:bg-slate-700/70 border border-slate-500";
    default:
      return "bg-gray-600 border border-gray-500 text-gray-100 hover:bg-gray-500 hover:border-gray-400 disabled:opacity-60";
  }
});

const sizeClass = computed(() => {
  switch (props.size) {
    case "xs":
      return "px-1 py-0.5 text-xs";
    case "sm":
      return "px-2 py-1 text-sm";
    case "md":
      return "px-3 py-2 text-sm";
    case "lg":
      return "px-4 py-2 text-base";
    default:
      return "px-2 py-1 text-sm";
  }
});
</script>
