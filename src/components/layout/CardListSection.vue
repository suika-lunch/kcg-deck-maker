<!--
  仕様
  - 目的: カード一覧の表示と操作（追加/増減/画像拡大）。
  - 入力(Props):
    - availableCards: readonly Card[]
    - sortedAndFilteredCards: readonly Card[]
    - deckCards: readonly DeckCard[]
    - isLoading: boolean
    - error: string | null
  - 出力(Emits): openFilter / addCard(card) / incrementCard(cardId) / decrementCard(cardId) / openImageModal(cardId)
  - 依存(Stores): favorites（お気に入り状態の参照/切替）
  - 制約: GAME_CONSTANTS.MAX_CARD_COPIES に準拠（最終判定は親/ドメイン層）
-->
<script setup lang="ts">
import { computed, ref } from "vue";
import { GAME_CONSTANTS } from "../../constants";
import type { Card, DeckCard } from "../../types";
import { handleImageError, getCardImageUrl } from "../../utils";
import { useFavoritesStore } from "../../stores/favorites";
import SectionHeader from "../molecules/SectionHeader.vue";
import CountStepper from "../molecules/CountStepper.vue";
import BaseButton from "../atoms/BaseButton.vue";
import BaseSpinner from "../atoms/BaseSpinner.vue";
import EmptyState from "../molecules/EmptyState.vue";
import FavoriteToggleButton from "../atoms/FavoriteToggleButton.vue";
import CardTile from "../molecules/CardTile.vue";

interface Props {
  availableCards: readonly Card[];
  sortedAndFilteredCards: readonly Card[];
  deckCards: readonly DeckCard[];
  isLoading: boolean;
  error: string | null;
}

interface Emits {
  (e: "openFilter"): void;
  (e: "addCard", card: Card): void;
  (e: "incrementCard", cardId: string): void;
  (e: "decrementCard", cardId: string): void;
  (e: "openImageModal", cardId: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const favoritesStore = useFavoritesStore();
const isFavorite = (cardId: string) => favoritesStore.isFavorite(cardId);
const toggleFavorite = (cardId: string) =>
  favoritesStore.toggleFavorite(cardId);

const deckCardMap = computed(() => {
  const map = new Map<string, number>();
  props.deckCards.forEach((deckCard) => {
    map.set(deckCard.card.id, deckCard.count);
  });
  return map;
});

const getCardInDeck = (cardId: string) => {
  return deckCardMap.value.get(cardId) || 0;
};

const openImageModal = (cardId: string) => {
  emit("openImageModal", cardId);
};

const handleLongPress = (cardId: string) => {
  suppressNextClick.value = true;
  openImageModal(cardId);
};

const handleCardClick = (card: Card) => {
  if (suppressNextClick.value) {
    suppressNextClick.value = false;
    return;
  }
  const currentCount = getCardInDeck(card.id);
  if (currentCount === 0) {
    emit("addCard", card);
  } else if (currentCount < GAME_CONSTANTS.MAX_CARD_COPIES) {
    emit("incrementCard", card.id);
  }
};

const suppressNextClick = ref<boolean>(false);

const onListImageError = (e: Event) => {
  try {
    handleImageError(e);
  } catch (error) {
    console.error("Error handling image error:", error);
  }
};
</script>

<template>
  <div
    class="relative z-10 flex h-1/2 grow flex-col overflow-hidden p-1 sm:p-2"
  >
    <SectionHeader>
      <template #icon>
        <svg
          class="h-4 w-4"
          fill="oklch(70.7% 0.165 254.624)"
          stroke="currentColor"
          viewBox="0 -960 960 960"
        >
          <path
            d="M120-520v-320h320v320H120Zm0 400v-320h320v320H120Zm400-400v-320h320v320H520Zm0 400v-320h320v320H520ZM200-600h160v-160H200v160Zm400 0h160v-160H600v160Zm0 400h160v-160H600v160Zm-400 0h160v-160H200v160Zm400-400Zm0 240Zm-240 0Zm0-240Z"
          ></path>
        </svg>
      </template>
      カード一覧
      <template #actions>
        <BaseButton
          variant="primary"
          size="xs"
          class="group"
          @click="emit('openFilter')"
          title="フィルター・検索"
        >
          <span class="flex items-center gap-1">
            <svg
              class="h-3 w-3"
              fill="white"
              stroke="currentColor"
              viewBox="0 -960 960 960"
            >
              <path
                d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"
              ></path>
            </svg>
            <span class="hidden sm:inline">検索/絞り込み</span>
            <span class="sm:hidden">検索</span>
          </span>
        </BaseButton>
      </template>
    </SectionHeader>

    <div
      class="grid grow grid-cols-3 gap-2 overflow-y-auto rounded border border-slate-700/50 bg-slate-800/40 p-1 shadow-xl backdrop-blur-sm sm:p-2 md:grid-cols-4 md:gap-3 lg:grid-cols-5 lg:gap-4"
    >
      <div v-if="isLoading" class="col-span-full mt-2 text-center sm:mt-4">
        <div class="flex flex-col items-center gap-1 p-2 sm:gap-2 sm:p-4">
          <BaseSpinner size="md">読み込み中...</BaseSpinner>
          <div class="text-center text-slate-400">
            <p class="mb-1 text-sm font-medium sm:text-base">読み込み中...</p>
            <p class="text-xs">カードデータを取得しています</p>
          </div>
        </div>
      </div>

      <EmptyState v-else-if="error" tone="error">
        <template #title>エラーが発生しました</template>
        <template #description>{{ error }}</template>
        <template #icon>
          <svg
            class="h-4 w-4 text-red-400 sm:h-5 sm:w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
        </template>
      </EmptyState>

      <EmptyState v-else-if="props.sortedAndFilteredCards.length === 0">
        <template #title>カードが見つかりません</template>
        <template #description>検索条件を変更してみてください</template>
      </EmptyState>

      <div
        v-else
        v-for="card in props.sortedAndFilteredCards"
        :key="card.id"
        class="group relative flex flex-col items-center transition-all duration-200"
        :title="
          getCardInDeck(card.id) > 0
            ? '長押し: 拡大表示'
            : 'クリック: デッキに追加 / 長押し: 拡大表示'
        "
      >
        <CardTile
          :img-src="getCardImageUrl(card.id)"
          :alt="card.name"
          :overlay="getCardInDeck(card.id) > 0"
          @longpress="handleLongPress(card.id)"
          @error="onListImageError"
          class="cursor-pointer active:scale-95"
          @click="handleCardClick(card)"
        >
          <template #overlay>
            <FavoriteToggleButton
              :pressed="isFavorite(card.id)"
              @toggle="toggleFavorite(card.id)"
            />

            <template v-if="getCardInDeck(card.id) > 0">
              <div
                class="pointer-events-none absolute inset-0 bg-linear-to-t from-slate-900/50 via-transparent to-transparent"
              ></div>

              <div
                class="absolute bottom-2 flex w-full items-center justify-center px-1"
                @click.stop
              >
                <CountStepper
                  :count="getCardInDeck(card.id)"
                  :is-increment-disabled="
                    getCardInDeck(card.id) >= GAME_CONSTANTS.MAX_CARD_COPIES
                  "
                  @decrement="emit('decrementCard', card.id)"
                  @increment="emit('incrementCard', card.id)"
                />
              </div>
            </template>
          </template>
        </CardTile>
      </div>
    </div>
  </div>
</template>
