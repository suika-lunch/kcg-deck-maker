<!--
  仕様
  - 目的: 数量のインクリメント/デクリメントを行うステッパー UI。
  - 入力(Props):
    - count: number（現在値）
    - isIncrementDisabled?: boolean（増加禁止、既定: false）
    - incrementAriaLabel?: string（既定: "増やす"）
    - decrementAriaLabel?: string（既定: "減らす"）
    - ariaLive?: "polite" | "assertive" | "off"（既定: "polite"）
  - 出力(Emits): increment / decrement
  - スロット: minusIcon / plusIcon
  - アクセシビリティ: ライブリージョンで count 変化を通知。
  - 副作用: なし（表示・イベントのみ）
-->
<template>
  <div class="w-full px-1 flex items-center justify-center gap-1">
    <button
      type="button"
      class="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-full flex items-center justify-center leading-none transition-all duration-200 shadow-lg hover:shadow-red-500/25"
      :aria-label="decrementAriaLabel"
      @click="$emit('decrement')"
    >
      <slot name="minusIcon">
        <svg
          class="w-3 h-3 sm:w-4 sm:h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M20 12H4"
          ></path>
        </svg>
      </slot>
    </button>

    <div
      class="w-7 h-6 sm:w-9 sm:h-8 font-bold text-center flex items-center justify-center bg-slate-900/80 backdrop-blur-sm rounded-lg border border-slate-600/50 text-white text-sm sm:text-base"
      :aria-live="ariaLive"
    >
      {{ count }}
    </div>

    <button
      type="button"
      class="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-full flex items-center justify-center leading-none transition-all duration-200 shadow-lg hover:shadow-emerald-500/25 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed"
      :disabled="isIncrementDisabled"
      :aria-disabled="isIncrementDisabled"
      :aria-label="incrementAriaLabel"
      @click="$emit('increment')"
    >
      <slot name="plusIcon">
        <svg
          class="w-3 h-3 sm:w-4 sm:h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          ></path>
        </svg>
      </slot>
    </button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  count: number;
  isIncrementDisabled?: boolean;
  incrementAriaLabel?: string;
  decrementAriaLabel?: string;
  ariaLive?: "polite" | "assertive" | "off";
}

withDefaults(defineProps<Props>(), {
  isIncrementDisabled: false,
  incrementAriaLabel: "増やす",
  decrementAriaLabel: "減らす",
  ariaLive: "polite",
});

defineEmits<{ (e: "increment"): void; (e: "decrement"): void }>();
</script>
