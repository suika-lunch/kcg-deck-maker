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
      <h4 class="text-sm font-medium mb-2">スラッシュ区切りデッキコード</h4>
      <div
        class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
      >
        <input
          type="text"
          :value="slashDeckCode"
          readonly
          class="flex-grow px-3 py-2 text-sm rounded bg-gray-700 border border-gray-600"
        />
        <BaseButton
          variant="primary"
          size="md"
          @click="emit('copySlashCode')"
          class="whitespace-nowrap min-w-24"
        >
          コピー
        </BaseButton>
      </div>
    </div>

    <div class="mb-4">
      <h4 class="text-sm font-medium mb-2">KCG形式デッキコード</h4>
      <div
        class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
      >
        <input
          type="text"
          :value="kcgDeckCode"
          readonly
          class="flex-grow px-3 py-2 text-sm rounded bg-gray-700 border border-gray-600"
        />
        <BaseButton
          variant="primary"
          size="md"
          @click="emit('copyKcgCode')"
          class="whitespace-nowrap min-w-24"
        >
          コピー
        </BaseButton>
      </div>
    </div>

    <div class="mb-4">
      <h4 class="text-sm font-medium mb-2">デッキコードをインポート</h4>
      <div
        class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
      >
        <input
          type="text"
          :value="importDeckCode"
          @input="
            emit('updateImportCode', ($event.target as HTMLInputElement).value)
          "
          @contextmenu.stop
          class="flex-grow px-3 py-2 text-sm rounded bg-gray-700 border border-gray-600 focus:outline-none focus:ring focus:border-blue-500"
          placeholder="デッキコードを入力"
        />
        <BaseButton
          variant="success"
          size="md"
          @click="emit('importCode')"
          class="whitespace-nowrap min-w-24"
        >
          インポート
        </BaseButton>
      </div>
    </div>

    <div
      v-if="error"
      class="mb-1 p-3 bg-red-900/50 border border-red-700 rounded text-red-300 text-sm"
    >
      {{ error }}
    </div>
  </BaseModal>
</template>
