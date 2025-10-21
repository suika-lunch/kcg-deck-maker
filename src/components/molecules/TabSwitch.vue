<!--
  仕様
  - 目的: タブ式の単一選択スイッチ。選択中に合わせてスライドするサムを表示。
  - 入力(Props):
    - modelValue: string（選択中の値）
    - options: { label: string; value: string }[]（選択肢）
  - 出力(Emits): update:modelValue(value: string)
  - スロット: なし
  - アクセシビリティ: aria-pressed を各ボタンに付与。
  - 副作用: なし（表示・入出力のみ）
-->
<template>
  <div
    class="relative isolate flex items-center overflow-hidden rounded-lg bg-slate-700 p-1 select-none"
  >
    <div
      class="pointer-events-none absolute top-0 right-0 bottom-0 left-0 rounded-md bg-blue-600 transition-transform duration-200 ease-out"
      :style="{ width: thumbWidth, transform: `translateX(${translateX})` }"
      aria-hidden="true"
    />
    <button
      v-for="opt in options"
      :key="opt.value"
      @click="$emit('update:modelValue', opt.value)"
      :aria-pressed="opt.value === modelValue"
      type="button"
      class="relative z-10 inline-flex min-w-0 flex-1 items-center justify-center rounded-md px-3 py-1 text-center text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
      :class="[
        opt.value === modelValue
          ? 'text-white'
          : 'text-slate-300 hover:text-white',
      ]"
    >
      <span class="block whitespace-nowrap">{{ opt.label }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

export interface TabOption<T extends string> {
  label: string;
  value: T;
}

const props = defineProps<{
  modelValue: string;
  options: TabOption<string>[];
}>();

defineEmits<{ (e: "update:modelValue", v: string): void }>();

const selectedIndex = computed(() => {
  const index = props.options.findIndex((o) => o.value === props.modelValue);
  return index >= 0 ? index : 0;
});

const thumbWidth = computed(
  () => `${100 / Math.max(props.options.length, 1)}%`,
);
const translateX = computed(() => `${selectedIndex.value * 100}%`);
</script>
