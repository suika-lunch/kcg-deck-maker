<!--
  仕様
  - 目的: カード画像タイル。長押し検出とエラーハンドリングを提供。
  - 入力(Props):
    - imgSrc: string（画像 URL）
    - alt: string（代替テキスト）
    - overlay?: boolean（オーバーレイの有無、既定: false）
  - 出力(Emits):
    - longpress
    - error(event: Event)
  - スロット: overlay（画像上に重ねる任意コンテンツ）
  - アクセシビリティ: alt を必須化。contextmenu は抑止。
  - 副作用: なし（UI イベントのみ）
-->
<template>
  <div
    class="relative w-full overflow-hidden rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl"
    :ref="setRef"
    @contextmenu.prevent
  >
    <img
      :src="imgSrc"
      :alt="alt"
      loading="lazy"
      crossorigin="anonymous"
      class="block h-full w-full object-cover transition-transform duration-200 select-none"
      @error="(e) => $emit('error', e)"
    />
    <div
      v-if="overlay"
      class="pointer-events-none absolute inset-0 bg-linear-to-t from-slate-900/50 via-transparent to-transparent"
    ></div>
    <slot name="overlay" />
  </div>
</template>

<script setup lang="ts">
import { onLongPress } from "@vueuse/core";

interface Props {
  imgSrc: string;
  alt: string;
  overlay?: boolean;
}

withDefaults(defineProps<Props>(), {
  overlay: false,
});

const emit = defineEmits<{
  (e: "longpress"): void;
  (e: "error", ev: Event): void;
}>();

const setRef = (el: unknown) => {
  if (!(el instanceof HTMLElement)) {
    return;
  }
  onLongPress(el, () => emit("longpress"));
};
</script>
