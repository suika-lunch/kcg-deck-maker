<!--
  仕様
  - 目的: デッキコードの表示/コピーと、コード文字列の入力インポートを提供。
  - 入力(Props):
    - isVisible: boolean
    - slashDeckCode: string
    - kcgDeckCode: string
    - importDeckCode: string
    - error?: string | null
  - 出力(Emits): close / updateImportCode(code: string) / copySlashCode / copyKcgCode / importCode
  - スロット: なし
  - アクセシビリティ: Modal の header に見出しと aria-labelledby を連携。
  - 副作用: なし（イベントを親に通知）
-->
<script setup lang="ts">
import BaseModal from "../atoms/BaseModal.vue";
import BaseButton from "../atoms/BaseButton.vue";

interface Props {
  isVisible: boolean;
  slashDeckCode: string;
  kcgDeckCode: string;
  importDeckCode: string;
  error?: string | null;
}

interface Emits {
  (e: "close"): void;
  (e: "updateImportCode", code: string): void;
  (e: "copySlashCode"): void;
  (e: "copyKcgCode"): void;
  (e: "importCode"): void;
}

defineProps<Props>();
const emit = defineEmits<Emits>();
</script>

<template>
  <BaseModal
    :model-value="isVisible"
    @update:modelValue="
      (v) => {
        if (!v) emit('close');
      }
    "
    :aria-labelledby="'deck-code-title'"
  >
    <template #header>
      <h3 id="deck-code-title" class="text-lg font-bold">デッキコード</h3>
    </template>

    <div class="mb-4">
      <h4 class="mb-2 text-sm font-medium">スラッシュ区切りデッキコード</h4>
      <div
        class="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center"
      >
        <input
          type="text"
          :value="slashDeckCode"
          readonly
          class="grow rounded border border-gray-600 bg-gray-700 px-3 py-2 text-sm"
        />
        <BaseButton
          variant="primary"
          size="md"
          @click="emit('copySlashCode')"
          class="min-w-24 whitespace-nowrap"
        >
          コピー
        </BaseButton>
      </div>
    </div>

    <div class="mb-4">
      <h4 class="mb-2 text-sm font-medium">KCG形式デッキコード</h4>
      <div
        class="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center"
      >
        <input
          type="text"
          :value="kcgDeckCode"
          readonly
          class="grow rounded border border-gray-600 bg-gray-700 px-3 py-2 text-sm"
        />
        <BaseButton
          variant="primary"
          size="md"
          @click="emit('copyKcgCode')"
          class="min-w-24 whitespace-nowrap"
        >
          コピー
        </BaseButton>
      </div>
    </div>

    <div class="mb-4">
      <h4 class="mb-2 text-sm font-medium">デッキコードをインポート</h4>
      <div
        class="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center"
      >
        <input
          type="text"
          :value="importDeckCode"
          @input="
            emit('updateImportCode', ($event.target as HTMLInputElement).value)
          "
          @contextmenu.stop
          autocapitalize="off"
          autocomplete="off"
          spellcheck="false"
          inputmode="text"
          class="grow rounded border border-gray-600 bg-gray-700 px-3 py-2 text-sm focus-visible:border-blue-500 focus-visible:ring focus-visible:outline-none"
          placeholder="デッキコードを入力"
        />
        <BaseButton
          variant="success"
          size="md"
          @click="emit('importCode')"
          class="min-w-24 whitespace-nowrap"
        >
          インポート
        </BaseButton>
      </div>
    </div>

    <div
      v-if="error"
      role="alert"
      aria-live="assertive"
      class="mb-1 rounded border border-red-700 bg-red-900/50 p-3 text-sm text-red-300"
    >
      {{ error }}
    </div>
  </BaseModal>
</template>
