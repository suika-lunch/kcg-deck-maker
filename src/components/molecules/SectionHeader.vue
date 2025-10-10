<!--
  仕様
  - 目的: セクション見出し。左にアイコン、右にアクション領域を配置可能。
  - 入力(Props): なし
  - 出力(Emits): なし
  - スロット: icon / default / actions
  - アクセシビリティ: 見出し要素 h2 を使用（親でレベル調整可）。
  - 副作用: なし（表示専用）
-->
<template>
  <div class="flex items-center justify-between mb-1 px-1">
    <h2
      class="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-1"
    >
      <slot name="icon" />
      <slot />
    </h2>
    <div class="flex items-center gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>
