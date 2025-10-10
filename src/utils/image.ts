/**
 * 仕様:
 * - 目的: 画像URLの構築・プレースホルダ・エラーハンドリング（img要素の安全な差し替え）
 * - 入出力: 入力= cardId or Event / 出力= URL文字列 or 画像差し替えの副作用
 * - 実装: BASE_URL の正規化、カード画像URLの生成、onerror 時のプレースホルダ差し替え
 */

export const getNormalizedBaseUrl = (): string => {
  const base = import.meta.env.BASE_URL || "/";
  return base.endsWith("/") ? base : `${base}/`;
};

/**
 * カード画像URLを取得
 */
export const getCardImageUrl = (cardId: string): string => {
  const safeId = String(cardId || "").trim();
  if (!safeId) {
    return getPlaceholderSrc();
  }
  return `${getNormalizedBaseUrl()}cards/${encodeURIComponent(safeId)}.webp`;
};

export const getPlaceholderSrc = (): string =>
  `${getNormalizedBaseUrl()}placeholder.webp`;

/**
 * 画像エラー時の処理
 */
export const handleImageError = (event: Event): void => {
  const t = (event && (event as any).target) as EventTarget | null;
  if (!t || !(t instanceof HTMLImageElement)) {
    return;
  }
  const img = t as HTMLImageElement;
  img.onerror = null;
  try {
    img.fetchPriority = "low";
    img.decoding = "async";
  } catch {}
  img.src = getPlaceholderSrc();
};
