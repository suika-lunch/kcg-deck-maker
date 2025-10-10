/**
 * useImageModal: 画像モーダルの状態管理とナビゲーションを提供するコンポーザブル
 * 仕様:
 * - 呼び出し時に渡された navIds（カードID配列）をナビゲーション順序として固定
 * - 呼び出し元（カード一覧 or デッキ）に応じて順序を切替可能
 * - 外部I/O: 画像URL取得のみ／例外は発生させない
 */
import { shallowRef, computed, triggerRef } from "vue";
import type { Card } from "../types";
import { getCardImageUrl } from "../utils";
import { useCardsStore } from "../stores";

/**
 * 画像モーダル状態の型定義
 */
interface ImageModalState {
  isVisible: boolean;
  selectedCard: Card | null;
  selectedImage: string | null;
  selectedIndex: number | null;
  navigationIds: readonly string[];
  source: "cardList" | "deck" | null;
}

/**
 * 画像モーダル関連の状態管理とロジックを提供するコンポーザブル
 */
export function useImageModal() {
  // Vue 3.5の新機能: shallowRef を使用したパフォーマンス最適化
  const imageModalState = shallowRef<ImageModalState>({
    isVisible: false,
    selectedCard: null,
    selectedImage: null,
    selectedIndex: null,
    navigationIds: [],
    source: null,
  });

  // ストアはコンポーザブル初期化時に1度だけ取得
  const cardsStore = useCardsStore();

  /**
   * Vue 3.5の新機能: より効率的な状態更新
   */
  const updateImageModalState = (updates: Partial<ImageModalState>) => {
    Object.assign(imageModalState.value, updates);
    triggerRef(imageModalState); // 手動でリアクティブ更新をトリガー
  };

  /**
   * カード画像を拡大表示
   */
  const openImageModal = (payload: {
    cardId: string;
    navIds: readonly string[];
    source: "cardList" | "deck";
  }) => {
    const { cardId, navIds, source } = payload;
    const card = cardsStore.getCardById(cardId);

    if (!card) return;

    const idx = navIds.findIndex((id) => id === cardId);

    updateImageModalState({
      selectedCard: card,
      selectedIndex: idx >= 0 ? idx : null,
      selectedImage: getCardImageUrl(cardId),
      isVisible: true,
      navigationIds: navIds,
      source,
    });
  };

  /**
   * モーダルを閉じる
   */
  const closeImageModal = () => {
    updateImageModalState({
      isVisible: false,
      selectedImage: null,
      selectedCard: null,
      selectedIndex: null,
    });
  };

  /**
   * カードナビゲーション
   */
  const handleCardNavigation = (direction: "previous" | "next") => {
    const navIds = imageModalState.value.navigationIds;
    const currentIndex = imageModalState.value.selectedIndex;
    if (currentIndex === null || navIds.length === 0) return;

    const newIndex =
      direction === "previous" ? currentIndex - 1 : currentIndex + 1;

    // 境界チェック
    if (newIndex < 0 || newIndex >= navIds.length) return;

    const newCardId = navIds.at(newIndex);
    if (!newCardId) return;
    const newCard = cardsStore.getCardById(newCardId);
    if (!newCard) return;

    // Vue 3.5の新機能を使用した状態更新
    updateImageModalState({
      selectedCard: newCard,
      selectedIndex: newIndex,
      selectedImage: getCardImageUrl(newCardId),
    });
  };

  // 計算プロパティ
  const isVisible = computed(() => imageModalState.value.isVisible);
  const selectedCard = computed(() => imageModalState.value.selectedCard);
  const selectedImage = computed(() => imageModalState.value.selectedImage);
  const selectedIndex = computed(() => imageModalState.value.selectedIndex);
  const navigationLength = computed(
    () => imageModalState.value.navigationIds.length,
  );

  // 動的なデッキやフィルター変更には追従せず、開いた時点の順序で固定

  return {
    // 状態
    isVisible,
    selectedCard,
    selectedImage,
    selectedIndex,
    navigationLength,

    // アクション
    openImageModal,
    closeImageModal,
    handleCardNavigation,
  };
}
