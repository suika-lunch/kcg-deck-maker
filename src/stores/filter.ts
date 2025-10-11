/**
 * [spec] フィルタ条件の状態管理（Pinia）。カード一覧の抽出/並び替え/統計を提供するストア。
 */
import { defineStore } from "pinia";
import { ref, readonly, computed, shallowRef, type ComputedRef } from "vue";
import type {
  Card,
  CardKind,
  CardType,
  FilterCriteria,
  TagOperator,
} from "../types";
import { CARD_KINDS, CARD_TYPES, PRIORITY_TAGS } from "../constants";
import { useCardsStore } from "./cards";
import { searchCardsByName, sortCards } from "../domain";
import { useFavoritesStore } from "./favorites";

export const useFilterStore = defineStore("filter", () => {
  // ストアの公開APIの型定義
  type FilterStore = {
    isFilterModalOpen: typeof isFilterModalOpen;
    filterCriteria: typeof filterCriteria;
    allTags: typeof allTags;
    sortedAndFilteredCards: typeof sortedAndFilteredCards;
    filterStats: typeof filterStats;
    allKinds: typeof CARD_KINDS;
    allTypes: typeof CARD_TYPES;
    openFilterModal: typeof openFilterModal;
    closeFilterModal: typeof closeFilterModal;
    updateFilterCriteria: typeof updateFilterCriteria;
    resetFilterCriteria: typeof resetFilterCriteria;
    setTextFilter: typeof setTextFilter;
    toggleKindFilter: typeof toggleKindFilter;
    toggleTypeFilter: typeof toggleTypeFilter;
    toggleTagFilter: typeof toggleTagFilter;
    toggleEntryConditionFilter: typeof toggleEntryConditionFilter;
    toggleOnlyFavoritesFilter: typeof toggleOnlyFavoritesFilter;
    setTagOperator: typeof setTagOperator;
    isEmptyFilter: ComputedRef<boolean>;
  };

  const isFilterModalOpen = ref<boolean>(false);
  const filterCriteria = shallowRef<FilterCriteria>({
    text: "",
    kind: [],
    type: [],
    tags: [],
    tagOperator: "OR",
    hasEntryCondition: false,
    onlyFavorites: false,
  });

  // シンプルなソート関数
  const sortCardsSimple = (cards: readonly Card[]) => {
    if (cards.length === 0) return cards;
    return readonly(sortCards(cards));
  };

  // シンプルなフィルタリング
  const applyFilters = (cards: readonly Card[], criteria: FilterCriteria) => {
    if (isEmptyFilter(criteria)) return cards;
    return applyAllFiltersOptimized(cards, criteria);
  };

  // タグ抽出の最適化（Set操作を効率化）
  const extractTagsFromCards = (cards: readonly Card[]): Set<string> => {
    if (cards.length === 0) return new Set<string>();

    const tags = new Set<string>();
    for (const card of cards) {
      for (const t of card.tags) {
        tags.add(t);
      }
    }

    return tags;
  };

  // タグ抽出は都度実行

  /**
   * 全タグリスト（優先タグを先頭に配置）- 最適化版
   */
  const allTags = computed(() => {
    const cardsStore = useCardsStore();

    const tags = extractTagsFromCards(cardsStore.availableCards);

    if (tags.size === 0) {
      return readonly([]);
    }

    const priorityTagSet = new Set(PRIORITY_TAGS);
    const priorityTags = new Set<string>();
    const otherTags: string[] = [];

    // 一度のループで分類
    for (const tag of tags) {
      if (priorityTagSet.has(tag)) {
        priorityTags.add(tag);
      } else {
        otherTags.push(tag);
      }
    }

    // 優先タグは元の順序を保持、その他のタグはソート
    const orderedPriorityTags = PRIORITY_TAGS.filter((tag) =>
      priorityTags.has(tag),
    );
    otherTags.sort();

    return readonly([...orderedPriorityTags, ...otherTags]);
  });

  /**
   * 最適化されたテキストフィルタリング
   */
  const applyTextFilter = (
    cards: readonly Card[],
    text: string,
  ): readonly Card[] => {
    if (!text || text.trim().length === 0) {
      return cards;
    }

    return searchCardsByName(cards, text);
  };

  /**
   * 最適化された種別フィルタリング（高速Set使用）
   */
  const applyKindFilter = (
    cards: readonly Card[],
    kinds: readonly CardKind[],
  ): readonly Card[] => {
    if (kinds.length === 0) {
      return cards;
    }

    // 高速なSet を使用した効率的なルックアップ
    const kindSet = new Set<CardKind>(kinds);
    const result: Card[] = [];
    for (const card of cards) {
      if (!card) continue;
      if (kindSet.has(card.kind)) {
        result.push(card);
      }
    }

    return readonly(result);
  };

  /**
   * 最適化されたタイプフィルタリング（高速Set使用）
   */
  const applyTypeFilter = (
    cards: readonly Card[],
    types: readonly CardType[],
  ): readonly Card[] => {
    if (types.length === 0) {
      return cards;
    }

    const typeSet = new Set<CardType>(types);
    const result: Card[] = [];
    for (const card of cards) {
      if (!card) continue;
      if (card.type.some((t) => typeSet.has(t))) {
        result.push(card);
      }
    }

    return readonly(result);
  };

  /**
   * 最適化されたタグフィルタリング
   */
  const applyTagFilter = (
    cards: readonly Card[],
    tags: readonly string[],
    operator: TagOperator,
  ): readonly Card[] => {
    if (tags.length === 0) {
      return cards;
    }

    const tagSet = new Set(tags);
    const result: Card[] = [];
    for (const card of cards) {
      if (operator === "AND") {
        // 選択された全タグを含むか
        const cardTagSet = new Set(card.tags);
        let includesAll = true;
        for (const t of tagSet) {
          if (!cardTagSet.has(t)) {
            includesAll = false;
            break;
          }
        }
        if (includesAll) result.push(card);
      } else {
        // OR: いずれかのタグを含む
        if (card.tags.some((t) => tagSet.has(t))) {
          result.push(card);
        }
      }
    }

    return readonly(result);
  };

  /**
   * 最適化された複合フィルタリング
   */
  const applyAllFiltersOptimized = (
    cards: readonly Card[],
    criteria: FilterCriteria,
  ): readonly Card[] => {
    let filteredCards = cards;

    // フィルターの効果を推定し、最も絞り込み効果の高いものから適用
    const hasTextFilter = criteria.text && criteria.text.trim().length > 0;
    const hasKindFilter = criteria.kind.length > 0;
    const hasTypeFilter = criteria.type.length > 0;
    const hasTagFilter = criteria.tags.length > 0;
    const hasEntryConditionFilter = criteria.hasEntryCondition === true;
    const hasOnlyFavoritesFilter = criteria.onlyFavorites === true;

    // 早期リターンによる最適化
    if (
      !hasTextFilter &&
      !hasKindFilter &&
      !hasTypeFilter &&
      !hasTagFilter &&
      !hasEntryConditionFilter &&
      !hasOnlyFavoritesFilter
    ) {
      return filteredCards;
    }

    // フィルターを選択性の高い順に適用（一般的に最も絞り込み効果が高いと思われる順）
    if (hasTextFilter) {
      filteredCards = applyTextFilter(filteredCards, criteria.text);
      if (filteredCards.length === 0) return filteredCards; // 早期リターン
    }

    if (hasTagFilter) {
      filteredCards = applyTagFilter(
        filteredCards,
        criteria.tags,
        criteria.tagOperator,
      );
      if (filteredCards.length === 0) return filteredCards; // 早期リターン
    }

    if (hasKindFilter) {
      filteredCards = applyKindFilter(filteredCards, criteria.kind);
      if (filteredCards.length === 0) return filteredCards; // 早期リターン
    }

    if (hasTypeFilter) {
      filteredCards = applyTypeFilter(filteredCards, criteria.type);
      if (filteredCards.length === 0) return filteredCards; // 早期リターン
    }

    if (hasEntryConditionFilter) {
      filteredCards = filteredCards.filter((card) => card.hasEntryCondition);
    }

    if (hasOnlyFavoritesFilter) {
      const favoritesStore = useFavoritesStore();
      const favs = favoritesStore.favoriteIdSet;
      filteredCards = filteredCards.filter((c) => favs.has(c.id));
    }

    return filteredCards;
  };

  /**
   * ソート・フィルター済みカード一覧 - 最適化版（早期リターン強化）
   */
  const sortedAndFilteredCards = computed<readonly Card[]>(() => {
    const cardsStore = useCardsStore();
    const cards = cardsStore.availableCards;

    // 空の場合は早期リターン
    if (cards.length === 0) {
      return readonly([]);
    }

    // フィルターが空の場合はソートのみ実行
    const currentCriteria = filterCriteria.value;
    if (isEmptyFilter(currentCriteria)) {
      return sortCardsSimple(cards);
    }

    let result: readonly Card[] = cards;

    // フィルタリングの適用
    result = applyFilters(cards, currentCriteria);

    // 結果が空の場合は早期リターン
    if (result.length === 0) {
      return readonly([]);
    }

    // ソートの適用
    return sortCardsSimple(result);
  });

  /**
   * フィルター結果の統計情報 - 最適化版
   */
  const filterStats = computed<{
    totalCount: number;
    filteredCount: number;
    hasFilter: boolean;
    filterRate: number;
  }>(() => {
    const cardsStore = useCardsStore();
    const total = cardsStore.availableCards.length;
    const filtered = sortedAndFilteredCards.value.length;

    return {
      totalCount: total,
      filteredCount: filtered,
      hasFilter: !isEmptyFilter(filterCriteria.value),
      filterRate: total > 0 ? filtered / total : 0,
    };
  });

  /**
   * フィルターが空かどうか判定 - 最適化版
   */
  const isEmptyFilter = (criteria: FilterCriteria): boolean => {
    if (criteria.text && criteria.text.trim().length > 0) return false;
    if (criteria.kind.length > 0) return false;
    if (criteria.type.length > 0) return false;
    if (criteria.tags.length > 0) return false;
    if (criteria.hasEntryCondition) return false;
    if (criteria.onlyFavorites) return false;
    return true;
  };

  /**
   * フィルターモーダルを開く
   */
  const openFilterModal = (): void => {
    isFilterModalOpen.value = true;
  };

  /**
   * フィルターモーダルを閉じる
   */
  const closeFilterModal = (): void => {
    isFilterModalOpen.value = false;
  };

  /**
   * フィルター条件を更新
   */
  const updateFilterCriteria = (criteria: FilterCriteria): void => {
    filterCriteria.value = { ...criteria };
  };

  /**
   * フィルター条件をリセット
   */
  const resetFilterCriteria = (): void => {
    filterCriteria.value = {
      text: "",
      kind: [],
      type: [],
      tags: [],
      tagOperator: "OR",
      hasEntryCondition: false,
      onlyFavorites: false,
    };
  };

  /**
   * テキストフィルターのみ設定
   */
  const setTextFilter = (text: string): void => {
    filterCriteria.value = {
      ...filterCriteria.value,
      text: text.trim(),
    };
  };

  /**
   * 種別フィルターを切り替え
   */
  const toggleKindFilter = (kind: CardKind): void => {
    const currentKinds: CardKind[] = [...filterCriteria.value.kind];
    const index = currentKinds.indexOf(kind);

    if (index > -1) {
      currentKinds.splice(index, 1);
    } else {
      currentKinds.push(kind);
    }

    filterCriteria.value = {
      ...filterCriteria.value,
      kind: currentKinds,
    };
  };

  /**
   * タイプフィルターを切り替え
   */
  const toggleTypeFilter = (type: CardType): void => {
    const currentTypes: CardType[] = [...filterCriteria.value.type];
    const index = currentTypes.indexOf(type);

    if (index > -1) {
      currentTypes.splice(index, 1);
    } else {
      currentTypes.push(type);
    }

    filterCriteria.value = {
      ...filterCriteria.value,
      type: currentTypes,
    };
  };

  /**
   * タグフィルターを切り替え
   */
  const toggleTagFilter = (tag: string): void => {
    const currentTags = [...filterCriteria.value.tags];
    const index = currentTags.indexOf(tag);

    if (index > -1) {
      currentTags.splice(index, 1);
    } else {
      currentTags.push(tag);
    }

    filterCriteria.value = {
      ...filterCriteria.value,
      tags: currentTags,
    };
  };

  /**
   * 【登場条件】フィルターを切り替え
   */
  const toggleEntryConditionFilter = (): void => {
    filterCriteria.value = {
      ...filterCriteria.value,
      hasEntryCondition: !filterCriteria.value.hasEntryCondition,
    };
  };

  const toggleOnlyFavoritesFilter = (): void => {
    filterCriteria.value = {
      ...filterCriteria.value,
      onlyFavorites: !filterCriteria.value.onlyFavorites,
    };
  };

  const setTagOperator = (operator: TagOperator): void => {
    if (operator !== "AND" && operator !== "OR") return;
    filterCriteria.value = {
      ...filterCriteria.value,
      tagOperator: operator,
    };
  };

  return {
    // リアクティブな状態
    isFilterModalOpen,
    filterCriteria,
    allTags,
    sortedAndFilteredCards,
    filterStats,

    // 定数
    allKinds: CARD_KINDS,
    allTypes: CARD_TYPES,

    // アクション
    openFilterModal,
    closeFilterModal,
    updateFilterCriteria,
    resetFilterCriteria,
    setTextFilter,
    toggleKindFilter,
    toggleTypeFilter,
    toggleTagFilter,
    toggleEntryConditionFilter, // 追加
    toggleOnlyFavoritesFilter,
    setTagOperator,

    // ユーティリティ
    isEmptyFilter: computed(() => isEmptyFilter(filterCriteria.value)),
  } as FilterStore;
});
