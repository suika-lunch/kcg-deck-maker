<!--
  仕様
  - 目的: 画面全体のレイアウトと各ストア/セクション/モーダルの配線を担うアプリケーションコンテナ。
  - 入力(Props): なし
  - 出力(Emits): なし
  - 構成: 左右 2 カラム（デッキ/一覧）+ 各種モーダル（フィルタ、コード、確認、画像、管理）
  - 初期化: onMounted でアプリ初期化（カード読込/デッキ生成）を実行。
  - 画像モーダル: 発火元（デッキ/一覧）に応じ navIds を組み立て、選択情報は computed 経由で供給。
  - アクセシビリティ: グローバルで contextmenu/selectstart を抑止。各モーダルは aria を適切に付与。
  - 副作用: ストア初期化/状態更新のみ。
-->
<script setup lang="ts">
import { onMounted, computed } from "vue";

import { useAppStore } from "./stores";
import {
  CardListSection,
  DeckSection,
  ConfirmModal,
  DeckCodeModal,
  FilterModal,
  CardImageModal,
  DeckManagementModal,
} from "./components";

// コンポーザブル
import { useImageModal } from "./composables/useImageModal";

// ストア初期化
const appStore = useAppStore();
const {
  cardsStore,
  deckStore,
  filterStore,
  deckCodeStore,
  deckManagementStore,
  exportStore,
} = appStore;

// コンポーザブルの初期化
const {
  isVisible: imageModalVisible,
  selectedCard,
  selectedImage,
  selectedIndex,
  navigationLength,
  openImageModal,
  closeImageModal,
  handleCardNavigation,
} = useImageModal();

// 画像モーダルを開く（デッキ発）
const openImageModalFromDeck = (cardId: string) => {
  const navIds = deckStore.sortedDeckCards.map((dc) => dc.card.id);
  openImageModal({ cardId, navIds, source: "deck" });
};

// 画像モーダルを開く（カード一覧発）
const openImageModalFromCardList = (cardId: string) => {
  const navIds = filterStore.sortedAndFilteredCards.map((c) => c.id);
  openImageModal({ cardId, navIds, source: "cardList" });
};

// アプリケーションの初期化
onMounted(appStore.initializeApp);

// モーダル表示の条件
const modalVisibility = computed(() => ({
  filter: filterStore.isFilterModalOpen,
  deckCode: deckCodeStore.showDeckCodeModal,
  resetConfirm: appStore.showResetConfirmModal,
  deckManagement: deckManagementStore.isDeckManagementModalOpen,
}));

// デッキセクションのプロパティ
const deckSectionProps = computed(() => ({
  isGeneratingCode: deckCodeStore.isGeneratingCode,
  isSaving: exportStore.isSaving,
}));

// カード一覧セクションのプロパティ
const cardListSectionProps = computed(() => ({
  availableCards: cardsStore.availableCards,
  sortedAndFilteredCards: filterStore.sortedAndFilteredCards,
  deckCards: deckStore.deckCards,
  isLoading: cardsStore.isLoading,
  error: cardsStore.error?.message || null,
}));

// デッキコードモーダルのプロパティ
const deckCodeModalProps = computed(() => ({
  isVisible: deckCodeStore.showDeckCodeModal,
  slashDeckCode: deckCodeStore.slashDeckCode,
  kcgDeckCode: deckCodeStore.kcgDeckCode,
  importDeckCode: deckCodeStore.importDeckCode,
  error: deckCodeStore.error?.message || null,
}));

// カード画像モーダルのプロパティを計算
const cardImageModalProps = computed(() => ({
  isVisible: imageModalVisible.value,
  imageSrc: selectedImage.value,
  currentCard: selectedCard.value,
  cardIndex: selectedIndex.value,
  totalCards: navigationLength.value,
}));
</script>

<template>
  <div
    class="flex flex-col lg:flex-row h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 font-sans relative overflow-hidden"
    @contextmenu.prevent
    @selectstart.prevent
  >
    <div class="flex flex-col lg:flex-row flex-1 overflow-hidden">
      <DeckSection
        v-bind="deckSectionProps"
        @generate-deck-code="deckCodeStore.generateAndShowDeckCode"
        @reset-deck="appStore.resetDeck"
        @open-image-modal="openImageModalFromDeck"
        @open-deck-management-modal="
          deckManagementStore.openDeckManagementModal
        "
        class="lg:w-1/2 lg:h-full overflow-y-auto"
      />

      <CardListSection
        v-bind="cardListSectionProps"
        @open-filter="filterStore.openFilterModal"
        @add-card="deckStore.addCardToDeck"
        @increment-card="deckStore.incrementCardCount"
        @decrement-card="deckStore.decrementCardCount"
        @open-image-modal="openImageModalFromCardList"
        class="lg:w-1/2 lg:h-full overflow-y-auto"
      />
    </div>

    <FilterModal
      :is-visible="modalVisibility.filter"
      @close="filterStore.closeFilterModal"
    />

    <DeckCodeModal
      v-bind="deckCodeModalProps"
      @close="deckCodeStore.showDeckCodeModal = false"
      @update-import-code="deckCodeStore.setImportDeckCode"
      @copy-slash-code="deckCodeStore.copyDeckCode('slash')"
      @copy-kcg-code="deckCodeStore.copyDeckCode('kcg')"
      @import-code="appStore.importDeckFromCode"
    />

    <ConfirmModal
      :is-visible="modalVisibility.resetConfirm"
      message="デッキ内容を全てリセットしてもよろしいですか？"
      confirm-text="リセットする"
      @confirm="appStore.confirmResetDeck"
      @cancel="appStore.cancelResetDeck"
    />

    <CardImageModal
      v-bind="cardImageModalProps"
      @close="closeImageModal"
      @navigate="handleCardNavigation"
    />

    <DeckManagementModal v-if="modalVisibility.deckManagement" />
  </div>
</template>

<style scoped>
/* Tailwindで対応できない特殊なスタイルのみ残す */

/* デフォルトのスクロールバーを隠す */
::-webkit-scrollbar {
  display: none;
}
* {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* タッチデバイス向けのタップハイライト除去 */
@media (hover: none) {
  button {
    -webkit-tap-highlight-color: transparent;
  }
}
</style>
