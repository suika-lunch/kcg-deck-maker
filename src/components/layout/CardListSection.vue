<!--
  CardListSection.vue
  目的: カード一覧の表示/クリック操作(追加・枚数増加)と画像の長押し拡大を提供する UI 中心の層
  付記: お気に入り状態の参照/切替のため favorites ストアを使用する
  入力: Props.availableCards, sortedAndFilteredCards, deckCards, isLoading, error
  出力: Emits(openFilter, addCard, incrementCard, decrementCard, openImageModal)
  留意: ドメイン制約(MAX_CARD_COPIES)は表示制御のみで、最終判定は親/ドメイン層に委譲
-->
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
    class="flex flex-col flex-grow h-1/2 p-1 sm:p-2 overflow-hidden relative z-10"
  >
    <SectionHeader>
      <template #icon>
        <svg
          class="w-4 h-4"
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
              class="w-3 h-3"
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
      class="flex-grow overflow-y-auto grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-3 lg:gap-4 p-1 sm:p-2 bg-slate-800/40 backdrop-blur-sm rounded border border-slate-700/50 shadow-xl"
    >
      <div v-if="isLoading" class="col-span-full text-center mt-2 sm:mt-4">
        <div class="flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-4">
          <BaseSpinner size="md">読み込み中...</BaseSpinner>
          <div class="text-slate-400 text-center">
            <p class="text-sm sm:text-base font-medium mb-1">読み込み中...</p>
            <p class="text-xs">カードデータを取得しています</p>
          </div>
        </div>
      </div>

      <EmptyState v-else-if="error" tone="error">
        <template #title>エラーが発生しました</template>
        <template #description>{{ error }}</template>
        <template #icon>
          <svg
            class="w-4 h-4 sm:w-5 sm:h-5 text-red-400"
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
        class="group flex flex-col items-center relative transition-all duration-200"
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
                class="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent pointer-events-none"
              ></div>

              <div
                class="absolute bottom-2 w-full px-1 flex items-center justify-center"
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
