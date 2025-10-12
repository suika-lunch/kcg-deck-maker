import type { CardKind, CardType } from "./card";

/**
 * フィルター条件を表す代数的データ型。
 * - `text`: テキスト検索条件。
 * - `kind`: カードの種類によるフィルタリング条件。
 * - `cardType`: カードのタイプ（色や属性）によるフィルタリング条件。
 * - `tags`: タグによるフィルタリング条件。
 * - `combined`: 複数のフィルター条件を組み合わせたもの。
 */
export type FilterCondition =
  | { readonly type: "text"; readonly value: string }
  | { readonly type: "kind"; readonly values: readonly CardKind[] }
  | { readonly type: "cardType"; readonly values: readonly CardType[] }
  | { readonly type: "tags"; readonly values: readonly string[] }
  | {
      readonly type: "combined";
      readonly conditions: readonly FilterCondition[];
    };

/**
 * タグ条件の演算子。
 * - OR: いずれかのタグを含むカードを抽出
 * - AND: すべてのタグを含むカードを抽出
 */
export type TagOperator = "OR" | "AND";

/**
 * 適用されるフィルターの基準を表すインターフェース。
 * @property text - カード名や効果テキストに対する自由なテキスト検索文字列。
 * @property kind - フィルタリング対象のカードの種類（例: "Artist", "Song"）。
 * @property type - フィルタリング対象のカードタイプ（例: "赤", "即時"）。
 * @property tags - フィルタリング対象のタグ。
 * @property hasEntryCondition - 【登場条件】を持つカードで絞り込むかどうかのフラグ。
 * @property onlyFavorites - お気に入りのカードで絞り込むかどうかのフラグ。
 */
export interface FilterCriteria {
  readonly text: string;
  readonly kind: readonly CardKind[];
  readonly type: readonly CardType[];
  readonly tags: readonly string[];
  /** タグ条件の論理演算子（既定: OR） */
  readonly tagOperator: TagOperator;
  /** ID頭文字フィルタ（大文字/小文字は区別） */
  readonly idInitials: readonly string[];
  readonly hasEntryCondition: boolean;
  readonly onlyFavorites: boolean;
}
