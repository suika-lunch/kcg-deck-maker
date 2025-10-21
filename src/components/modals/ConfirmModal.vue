<!--
  仕様
  - 目的: 確認ダイアログ。確認/キャンセルとローディング状態を表現。
  - 入力(Props):
    - isVisible: boolean
    - message: string
    - confirmText?: string（既定: "OK"）
    - loading?: boolean（既定: false）
  - 出力(Emits): confirm / cancel
  - スロット: なし
  - アクセシビリティ: Modal header を aria-labelledby と連携。操作ボタンに適切なラベル。
  - 副作用: なし
-->
<template>
  <BaseModal
    :model-value="isVisible"
    @update:modelValue="
      (v) => {
        if (!v) onCancel();
      }
    "
    :aria-labelledby="'confirm-title'"
  >
    <template #header>
      <h3 id="confirm-title" class="text-lg font-bold">デッキリセット</h3>
    </template>

    <p class="m-0 leading-relaxed text-gray-300">{{ message }}</p>

    <template #footer>
      <div class="flex justify-end gap-3 sm:flex-col">
        <BaseButton
          variant="secondary"
          size="md"
          @click="onCancel"
          :disabled="loading"
          class="sm:w-full"
        >
          キャンセル
        </BaseButton>
        <BaseButton
          variant="primary"
          size="md"
          @click="onConfirm"
          :disabled="loading"
          :loading="loading"
          class="sm:w-full"
        >
          {{ loading ? "処理中..." : confirmText }}
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import BaseModal from "../atoms/BaseModal.vue";
import BaseButton from "../atoms/BaseButton.vue";

interface Props {
  isVisible: boolean;
  message: string;
  confirmText?: string;
  loading?: boolean;
}

interface Emits {
  (e: "confirm"): void;
  (e: "cancel"): void;
}

const props = withDefaults(defineProps<Props>(), {
  confirmText: "OK",
  loading: false,
});

const emit = defineEmits<Emits>();

const onConfirm = () => {
  if (!props.loading) {
    emit("confirm");
  }
};

const onCancel = () => {
  if (!props.loading) {
    emit("cancel");
  }
};
</script>
