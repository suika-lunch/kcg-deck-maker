<!--
  仕様
  - 目的: 進捗を幅指定つきのバーで表示する。
  - 入力(Props):
    - value: number（現在値）
    - max: number（最大値）
    - width?: string（外側コンテナ幅、既定: "100%"）
  - 出力(Emits): なし
  - スロット: なし
  - アクセシビリティ: 視覚表示のみ（必要なら親側で aria-* を付与）
  - 副作用: なし（表示専用）
-->
<template>
  <div class="rounded-full overflow-hidden" :style="{ width: props.width }">
    <div
      class="h-full transition-all duration-300 rounded-full"
      :class="barColor"
      :style="{ width: percent + '%' }"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface Props {
  value: number;
  max: number;
  width?: string;
}

const props = withDefaults(defineProps<Props>(), {
  width: "100%",
});

const percent = computed(() => Math.min((props.value / props.max) * 100, 100));

const barColor = computed(() => {
  if (props.value === props.max) return "bg-green-500";
  if (props.value > props.max) return "bg-red-500";
  if (props.value > (props.max * 5) / 6) return "bg-yellow-500";
  return "bg-blue-500";
});
</script>
