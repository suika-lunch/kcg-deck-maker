<!--
  仕様
  - 目的: モーダルの土台。開閉制御・フォーカストラップ・スクロール抑止を担う。
  - 入力(Props):
    - modelValue: boolean（表示/非表示）
    - ariaLabelledby?: string | null（アクセシブル名称参照）
    - closable?: boolean（閉じるボタン表示、既定: true）
  - 出力(Emits):
    - update:modelValue(boolean)
  - スロット: header / default / footer
  - アクセシビリティ: role="dialog" aria-modal。Esc/背景クリックで閉じる。初回表示時に内部へフォーカス移動。
  - 副作用: 表示中は document.body.style.overflow を hidden に設定し、閉じると復元。直前のフォーカスを復帰。
-->
<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4"
    role="dialog"
    aria-modal="true"
    :aria-labelledby="ariaLabelledby || undefined"
    @click.self="emitClose"
  >
    <div
      ref="container"
      class="relative w-full max-w-md max-h-[90vh] overflow-auto rounded-lg bg-slate-800 border border-slate-700 shadow-2xl outline-none"
      tabindex="-1"
      @keydown.esc.prevent.stop="emitClose"
      @click.stop
    >
      <header v-if="$slots['header']" class="border-b border-slate-700 p-4">
        <slot name="header" />
      </header>
      <section class="p-4">
        <slot />
      </section>
      <footer
        v-if="$slots['footer']"
        class="border-t border-slate-700 p-4 bg-slate-700/50"
      >
        <slot name="footer" />
      </footer>

      <button
        v-if="closable"
        type="button"
        class="absolute top-3 right-3 text-slate-400 hover:text-slate-100 transition-colors"
        aria-label="閉じる"
        @click="emitClose"
      >
        ×
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onUnmounted } from "vue";

interface Props {
  modelValue: boolean;
  ariaLabelledby?: string | null;
  closable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  closable: true,
  ariaLabelledby: null,
});

const emit = defineEmits<{ (e: "update:modelValue", value: boolean): void }>();

const container = ref<HTMLElement | null>(null);
let prevFocused: HTMLElement | null = null;

const emitClose = () => emit("update:modelValue", false);

const saveFocus = () => {
  prevFocused = document.activeElement as HTMLElement | null;
};

const restoreFocus = () => {
  if (prevFocused && document.body.contains(prevFocused)) {
    try {
      prevFocused.focus();
    } catch (e) {
      console.warn("Failed to restore focus:", e);
    }
  }
  prevFocused = null;
};

const focusTrap = async () => {
  await nextTick();
  container.value?.focus();
};

watch(
  () => props.modelValue,
  async (v) => {
    if (v) {
      saveFocus();
      await focusTrap();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      restoreFocus();
    }
  },
  { immediate: true },
);

onUnmounted(() => {
  document.body.style.overflow = "";
  restoreFocus();
});
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
