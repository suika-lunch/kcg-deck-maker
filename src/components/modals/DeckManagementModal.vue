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
          class="mb-2 block text-sm font-bold text-slate-300"
          >現在のデッキ名:</label
        >
        <input
          id="deckNameInput"
          type="text"
          v-model="newDeckName"
          :placeholder="currentDeckName || 'デッキ名を入力'"
          class="w-full rounded border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-slate-200 placeholder-slate-400 focus-visible:border-blue-500 focus-visible:ring focus-visible:outline-none"
        />
      </div>
      <div class="mb-4">
        <label class="mb-2 block text-sm font-bold text-slate-300"
          >現在のデッキコード:</label
        >
        <textarea
          :value="currentDeckCode || ''"
          readonly
          @contextmenu.stop
          @focus="($event.target as HTMLInputElement).select()"
          class="h-24 w-full resize-none rounded border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-slate-200 placeholder-slate-400"
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
        class="mt-2 w-full bg-emerald-600 hover:bg-emerald-700"
        @click="saveDeckAsJpeg"
      >
        デッキ画像を保存
      </BaseButton>
    </div>

    <div v-else>
      <div v-if="deckManagementStore.savedDecks.length > 0">
        <ul
          class="mb-4 max-h-60 overflow-y-auto rounded border border-slate-700"
        >
          <li
            v-for="deck in deckManagementStore.savedDecks"
            :key="deck.name"
            class="flex items-center justify-between border-b border-slate-700 p-3 transition-colors last:border-b-0 hover:bg-slate-700"
          >
            <span class="font-medium text-slate-200">{{ deck.name }}</span>
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
      <div v-else class="py-8 text-center text-slate-400">
        保存されたデッキはありません。
      </div>
    </div>
  </BaseModal>
</template>
