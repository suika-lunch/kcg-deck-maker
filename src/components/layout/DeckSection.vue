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
    class="relative z-10 flex h-1/2 grow-0 flex-col border-b border-slate-700/50 p-1 backdrop-blur-sm sm:p-2"
  >
    <div class="mb-1 px-1">
      <div class="flex w-full items-center">
        <label
          for="deckName"
          class="mr-1 text-xs font-medium whitespace-nowrap text-slate-300 sm:mr-2"
          >デッキ名:</label
        >
        <input
          id="deckName"
          type="text"
          :value="deckName"
          @input="updateDeckName(($event.target as HTMLInputElement).value)"
          class="grow rounded border border-slate-600/50 bg-slate-800/80 px-1 py-0.5 text-xs placeholder-slate-400 backdrop-blur-sm transition-all duration-200 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 focus:outline-none sm:px-2 sm:py-1 sm:text-base"
          placeholder="デッキ名を入力"
        />
      </div>
    </div>

    <div class="mb-1 flex flex-wrap gap-1 px-1">
      <BaseButton
        variant="primary"
        size="xs"
        class="group relative min-w-0 flex-1"
        @click="emit('generateDeckCode')"
        :disabled="props.isGeneratingCode"
        :loading="props.isGeneratingCode"
        title="デッキコードの入出力"
      >
        <span class="flex items-center justify-center gap-1">
          <svg
            class="h-3 w-3"
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
        class="group relative min-w-0 flex-1"
        @click="emit('openDeckManagementModal')"
        title="デッキの保存・読み込み"
        :disabled="props.isSaving"
        :loading="props.isSaving"
      >
        <span class="flex items-center justify-center gap-1">
          <svg
            class="h-3 w-3"
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
        class="group relative min-w-0 flex-1"
        @click="resetDeck"
        :disabled="deckCards.length === 0"
        title="デッキをリセット"
      >
        <span class="flex items-center justify-center gap-1">
          <svg
            class="h-3 w-3"
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

    <div class="mb-1 text-center">
      <div
        class="inline-flex items-center gap-1 rounded border border-slate-600/50 bg-slate-800/60 px-1 py-0.5 backdrop-blur-sm sm:gap-2 sm:px-2 sm:py-1"
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

        <div class="w-12 overflow-hidden rounded-full bg-slate-700 sm:w-16">
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
      class="grid grow grid-cols-3 gap-2 overflow-y-auto rounded border border-slate-700/50 bg-slate-800/40 p-1 shadow-xl backdrop-blur-sm sm:p-2 md:grid-cols-4 md:gap-3 lg:grid-cols-5 lg:gap-4"
    >
      <div
        v-for="item in sortedDeckCards"
        :key="item.card.id"
        class="group relative flex h-fit flex-col items-center transition-all duration-200"
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
              class="pointer-events-none absolute inset-0 bg-linear-to-t from-slate-900/50 via-transparent to-transparent"
            ></div>
            <div
              class="absolute bottom-2 flex w-full items-center justify-center gap-1 px-1"
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
