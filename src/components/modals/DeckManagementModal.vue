<!--
  仕様
  - 目的: デッキの保存/読み込み/削除と、JPEG 画像としての保存を行う管理モーダル。
  - 入力(Props): なし（ストアから状態取得）
  - 出力(Emits): なし（内部でストア操作）
  - スロット: なし
  - 動作: タブで保存/読み込みを切替。保存時は名称とコードを用いて保存。
          読み込み/削除操作は confirm/alert を伴う。
  - アクセシビリティ: Modal header を aria-labelledby と連携。
  - 副作用: ローカルストレージ更新、JPEG 保存操作。
-->
<script setup lang="ts">
import { ref, computed } from "vue";
import {
  useAppStore,
  useDeckCodeStore,
  useDeckManagementStore,
  useDeckStore,
} from "../../stores";
import BaseModal from "../atoms/BaseModal.vue";
import BaseButton from "../atoms/BaseButton.vue";
import TabSwitch from "../molecules/TabSwitch.vue";

const deckManagementStore = useDeckManagementStore();
const deckStore = useDeckStore();
const deckCodeStore = useDeckCodeStore();
const appStore = useAppStore();

const newDeckName = computed({
  get: () => deckStore.deckName,
  set: (v: string) => appStore.setDeckName(v),
});

const isSaveMode = ref(true); // true: 保存モード, false: 読み込みモード
const modeModel = computed<string>({
  get: () => (isSaveMode.value ? "save" : "load"),
  set: (v) => (isSaveMode.value = v === "save"),
});

const currentDeckName = computed<string>(() => deckStore.deckName);
const currentDeckCode = computed(() => deckCodeStore.kcgDeckCode);

const saveDeck = () => {
  if (newDeckName.value && currentDeckCode.value) {
    deckManagementStore.saveDeck(newDeckName.value, currentDeckCode.value);
  }
};

const loadDeck = (deckName: string, deckCode: string) => {
  appStore.loadSavedDeck(deckName, deckCode);
  if (deckCodeStore.error) {
    alert("デッキコードの読み込みに失敗しました。内容をご確認ください。");
    return;
  }
  deckManagementStore.closeDeckManagementModal();
};

const deleteDeck = (deckName: string) => {
  if (confirm(`デッキ「${deckName}」を削除してもよろしいですか？`)) {
    deckManagementStore.deleteDeck(deckName);
  }
};

const saveDeckAsJpeg = async () => {
  try {
    await appStore.exportStore.saveDeckAsJpeg(deckStore.deckName);
    deckManagementStore.closeDeckManagementModal();
  } catch (e) {
    alert("デッキ画像の保存に失敗しました。時間をおいて再度お試しください。");
    console.error(e);
  }
};

const closeModal = () => {
  deckManagementStore.closeDeckManagementModal();
};
</script>

<template>
  <BaseModal
    :model-value="deckManagementStore.isDeckManagementModalOpen"
    @update:modelValue="
      (v) => {
        if (!v) closeModal();
      }
    "
    :aria-labelledby="'deck-mgmt-title'"
  >
    <template #header>
      <h3 id="deck-mgmt-title" class="text-lg font-bold">デッキ管理</h3>
    </template>

    <div class="mb-4">
      <TabSwitch
        v-model="modeModel"
        :options="[
          { label: 'デッキ保存', value: 'save' },
          { label: 'デッキ読み込み・削除', value: 'load' },
        ]"
      />
    </div>

    <div v-if="isSaveMode">
      <div class="mb-4">
        <label
          for="deckNameInput"
          class="block text-slate-300 text-sm font-bold mb-2"
          >現在のデッキ名:</label
        >
        <input
          id="deckNameInput"
          type="text"
          v-model="newDeckName"
          :placeholder="currentDeckName || 'デッキ名を入力'"
          class="w-full px-3 py-2 text-sm rounded bg-gray-700 border border-gray-600 focus:outline-none focus:ring focus:border-blue-500 text-slate-200 placeholder-slate-400"
        />
      </div>
      <div class="mb-4">
        <label class="block text-slate-300 text-sm font-bold mb-2"
          >現在のデッキコード:</label
        >
        <textarea
          :value="currentDeckCode || ''"
          readonly
          class="w-full px-3 py-2 text-sm rounded bg-gray-700 border border-gray-600 text-slate-200 placeholder-slate-400 h-24 resize-none"
        ></textarea>
      </div>
      <BaseButton
        variant="success"
        size="md"
        class="w-full"
        :disabled="!newDeckName || !currentDeckCode"
        @click="saveDeck"
      >
        保存
      </BaseButton>
      <BaseButton
        variant="success"
        size="md"
        class="w-full mt-2 bg-emerald-600 hover:bg-emerald-700"
        @click="saveDeckAsJpeg"
      >
        デッキ画像を保存
      </BaseButton>
    </div>

    <div v-else>
      <div v-if="deckManagementStore.savedDecks.length > 0">
        <ul
          class="max-h-60 overflow-y-auto mb-4 border border-slate-700 rounded"
        >
          <li
            v-for="deck in deckManagementStore.savedDecks"
            :key="deck.name"
            class="flex justify-between items-center p-3 border-b border-slate-700 last:border-b-0 hover:bg-slate-700 transition-colors"
          >
            <span class="text-slate-200 font-medium">{{ deck.name }}</span>
            <div class="flex space-x-2">
              <BaseButton
                variant="primary"
                size="xs"
                @click="loadDeck(deck.name, deck.code)"
              >
                読み込み
              </BaseButton>
              <BaseButton
                variant="danger"
                size="xs"
                @click="deleteDeck(deck.name)"
              >
                削除
              </BaseButton>
            </div>
          </li>
        </ul>
      </div>
      <div v-else class="text-center text-slate-400 py-8">
        保存されたデッキはありません。
      </div>
    </div>
  </BaseModal>
</template>
