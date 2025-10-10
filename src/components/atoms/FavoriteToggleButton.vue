<!--
  仕様
  - 目的: お気に入り状態のトグルボタン。
  - 入力(Props): pressed: boolean（お気に入りかどうか）
  - 出力(Emits): toggle
  - スロット: なし
  - アクセシビリティ: aria-pressed/aria-label を付与。ボタンはキーボード操作可能。
  - 副作用: なし（表示専用）
-->
<template>
  <button
    type="button"
    class="absolute top-2 left-1 z-20 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 rounded"
    @click.stop="$emit('toggle')"
    :title="pressed ? 'お気に入り解除' : 'お気に入り登録'"
    :aria-pressed="pressed"
    :aria-label="pressed ? 'お気に入り解除' : 'お気に入り登録'"
  >
    <svg
      class="w-7 h-7 sm:w-8 sm:h-8 p-0.5 transition-transform duration-200 hover:scale-110"
      :class="pressed ? 'text-yellow-400' : 'text-gray-400/70'"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279L12 18.896l-7.416 3.817 1.48-8.279-6.064-5.828 8.332-1.151L12 .587z"
      />
    </svg>
  </button>
</template>

<script setup lang="ts">
defineProps<{ pressed: boolean }>();
defineEmits<{ (e: "toggle"): void }>();
</script>
