<!--
  仕様
  - 目的: デッキの編集/表示/エクスポート UI。デッキ名編集、コード生成、保存/管理、画像拡大表示を提供。
  - 入力(Props):
    - isGeneratingCode: boolean
    - isSaving: boolean
  - 出力(Emits):
    - generateDeckCode
    - resetDeck
    - openImageModal(cardId: string)
    - openDeckManagementModal
  - 依存(Stores): useDeckStore（deckCards, sortedDeckCards, totalDeckCards）, useAppStore（deckName の更新）
  - 制約: GAME_CONSTANTS.MAX_DECK_SIZE / MAX_CARD_COPIES を UI で示し、整合性はドメイン層でも保証。
-->
<script setup lang="ts">
import { GAME_CONSTANTS } from "../../constants";
import { getCardImageUrl, handleImageError } from "../../utils";
import { useAppStore, useDeckStore } from "../../stores";
import { storeToRefs } from "pinia";
import CountStepper from "../molecules/CountStepper.vue";
import BaseButton from "../atoms/BaseButton.vue";
import ProgressBar from "../atoms/ProgressBar.vue";
import EmptyState from "../molecules/EmptyState.vue";
import CardTile from "../molecules/CardTile.vue";

interface Props {
  isGeneratingCode: boolean;
  isSaving: boolean;
}

interface Emits {
  (e: "generateDeckCode"): void;
  (e: "resetDeck"): void;
  (e: "openImageModal", cardId: string): void;
  (e: "openDeckManagementModal"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const deckStore = useDeckStore();
const appStore = useAppStore();

const handleIncrementCard = (cardId: string) => {
  deckStore.incrementCardCount(cardId);
};
const handleDecrementCard = (cardId: string) => {
  deckStore.decrementCardCount(cardId);
};

const { deckCards, deckName, sortedDeckCards, totalDeckCards } =
  storeToRefs(deckStore);

const updateDeckName = (value: string) => {
  appStore.setDeckName(value);
};

const openImageModal = (cardId: string) => {
  emit("openImageModal", cardId);
};

const resetDeck = () => {
  emit("resetDeck");
};

const getDeckCountColor = (count: number) => {
  if (count === GAME_CONSTANTS.MAX_DECK_SIZE) return "text-green-400";
  if (count > GAME_CONSTANTS.MAX_DECK_SIZE) return "text-red-400";
  if (count > (GAME_CONSTANTS.MAX_DECK_SIZE * 5) / 6) return "text-yellow-400";
  return "text-slate-100";
};

defineExpose({
  resetDeck,
  updateDeckName,
});

const onDeckImageError = (e: Event) => {
  try {
    handleImageError(e);
  } catch (error) {
    console.error("Error handling image error:", error);
  }
};
</script>

<template>
  <div
    class="flex flex-col flex-grow-0 h-1/2 p-1 sm:p-2 border-b border-slate-700/50 relative z-10 backdrop-blur-sm"
  >
    <div class="mb-1 px-1">
      <div class="flex items-center w-full">
        <label
          for="deckName"
          class="mr-1 sm:mr-2 text-xs font-medium text-slate-300 whitespace-nowrap"
          >デッキ名:</label
        >
        <input
          id="deckName"
          type="text"
          :value="deckName"
          @input="updateDeckName(($event.target as HTMLInputElement).value)"
          class="flex-grow px-1 sm:px-2 py-0.5 sm:py-1 text-xs sm:text-base rounded bg-slate-800/80 border border-slate-600/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 backdrop-blur-sm placeholder-slate-400"
          placeholder="デッキ名を入力"
        />
      </div>
    </div>

    <div class="flex flex-wrap gap-1 mb-1 px-1">
      <BaseButton
        variant="primary"
        size="xs"
        class="group relative flex-1 min-w-0"
        @click="emit('generateDeckCode')"
        :disabled="props.isGeneratingCode"
        :loading="props.isGeneratingCode"
        title="デッキコードの入出力"
      >
        <span class="flex items-center justify-center gap-1">
          <svg
            class="w-3 h-3"
            fill="white"
            stroke="currentColor"
            viewBox="0 -960 960 960"
          >
            <path
              d="M360-240q-33 0-56.5-23.5T280-320v-480q0-33 23.5-56.5T360-880h360q33 0 56.5 23.5T800-800v480q0 33-23.5 56.5T720-240H360Zm0-80h360v-480H360v480ZM200-80q-33 0-56.5-23.5T120-160v-560h80v560h440v80H200Zm160-240v-480 480Z"
            ></path>
          </svg>
          <span class="hidden sm:inline">デッキコード</span>
          <span class="sm:hidden">コード</span>
        </span>
      </BaseButton>

      <BaseButton
        variant="success"
        size="xs"
        class="group relative flex-1 min-w-0"
        @click="emit('openDeckManagementModal')"
        title="デッキの保存・読み込み"
        :disabled="props.isSaving"
        :loading="props.isSaving"
      >
        <span class="flex items-center justify-center gap-1">
          <svg
            class="w-3 h-3"
            fill="white"
            stroke="currentColor"
            viewBox="0 -960 960 960"
          >
            <path
              d="M840-680v480q0 33-23.5 56.5T760-120H200q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h480l160 160Zm-80 34L646-760H200v560h560v-446ZM480-240q50 0 85-35t35-85q0-50-35-85t-85-35q-50 0-85 35t-35 85q0 50 35 85t85 35ZM240-560h360v-160H240v160Zm-40-86v446-560 114Z"
            ></path>
          </svg>
          <span class="hidden sm:inline">デッキ保存</span>
          <span class="sm:hidden">保存</span>
        </span>
      </BaseButton>

      <BaseButton
        variant="danger"
        size="xs"
        class="group relative flex-1 min-w-0"
        @click="resetDeck"
        :disabled="deckCards.length === 0"
        title="デッキをリセット"
      >
        <span class="flex items-center justify-center gap-1">
          <svg
            class="w-3 h-3"
            fill="white"
            stroke="currentColor"
            viewBox="0 -960 960 960"
          >
            <path
              d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"
            ></path>
          </svg>
          <span class="hidden sm:inline">リセット</span>
          <span class="sm:hidden">リセット</span>
        </span>
      </BaseButton>
    </div>

    <div class="text-center mb-1">
      <div
        class="inline-flex items-center gap-1 sm:gap-2 px-1 sm:px-2 py-0.5 sm:py-1 bg-slate-800/60 backdrop-blur-sm rounded border border-slate-600/50"
      >
        <span class="text-xs font-medium text-slate-300">合計枚数:</span>
        <span
          class="text-xs font-bold"
          :class="getDeckCountColor(totalDeckCards)"
        >
          {{ totalDeckCards }}
        </span>
        <span class="text-xs text-slate-400"
          >/ {{ GAME_CONSTANTS.MAX_DECK_SIZE }}</span
        >

        <div class="w-12 sm:w-16 bg-slate-700 rounded-full overflow-hidden">
          <ProgressBar
            :value="totalDeckCards"
            :max="GAME_CONSTANTS.MAX_DECK_SIZE"
            class="h-1"
          />
        </div>
      </div>
    </div>

    <div
      id="chosen-deck-grid"
      class="flex-grow overflow-y-auto grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-3 lg:gap-4 p-1 sm:p-2 bg-slate-800/40 backdrop-blur-sm rounded border border-slate-700/50 shadow-xl"
    >
      <div
        v-for="item in sortedDeckCards"
        :key="item.card.id"
        class="group flex flex-col items-center relative h-fit transition-all duration-200"
      >
        <CardTile
          :img-src="getCardImageUrl(item.card.id)"
          :alt="item.card.name"
          overlay
          title="長押し: 拡大表示"
          @longpress="openImageModal(item.card.id)"
          @error="onDeckImageError"
        >
          <template #overlay>
            <div
              class="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent pointer-events-none"
            ></div>
            <div
              class="absolute bottom-2 w-full px-1 flex items-center justify-center gap-1"
            >
              <CountStepper
                :count="item.count"
                :is-increment-disabled="
                  item.count >= GAME_CONSTANTS.MAX_CARD_COPIES
                "
                @decrement="handleDecrementCard(item.card.id)"
                @increment="handleIncrementCard(item.card.id)"
              />
            </div>
          </template>
        </CardTile>
      </div>

      <EmptyState v-if="sortedDeckCards.length === 0" class="mt-2 sm:mt-4">
        <template #title>デッキが空です</template>
        <template #description>カードをタップして追加してください</template>
      </EmptyState>
    </div>
  </div>
</template>
