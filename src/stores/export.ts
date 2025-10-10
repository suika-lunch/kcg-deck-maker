/**
 * 仕様:
 * - 目的: デッキのJPEG画像エクスポート（キャンバス描画/画像ロード/フォントロード/ダウンロード）
 * - 入出力: 入力= deckStore.sortedDeckCards, deckName / 出力= ファイルダウンロード（JPEG）
 * - 実装: Canvas API を用いて背景・カード画像・枚数・ヘッダテキストを描画
 * - フォント: Shippori Mincho を動的ロード（失敗は致命でない）
 * - エラー: ExportError を投げて呼び出し元でハンドリング（canvas/imageLoad/concurrency/unknown）
 */
import { defineStore } from "pinia";
import { ref, readonly } from "vue";
import {
  getCardImageUrl,
  getPlaceholderSrc,
  getNormalizedBaseUrl,
} from "../utils";
import { useDeckStore } from "./deck";

// エクスポートストア専用のエラー型（代数的データ型）
type ExportError =
  | {
      readonly tag: "canvas";
      readonly message: string;
      readonly originalError: unknown;
    }
  | {
      readonly tag: "imageLoad";
      readonly message: string;
      readonly originalError: unknown;
    }
  | {
      readonly tag: "concurrency";
      readonly message: string;
      readonly originalError: unknown;
    }
  | {
      readonly tag: "unknown";
      readonly message: string;
      readonly originalError: unknown;
    };

const createExportError = (params: {
  type: "canvas" | "imageLoad" | "concurrency" | "unknown";
  message: string;
  originalError: unknown;
}): ExportError => ({
  tag: params.type,
  message: params.message,
  originalError: params.originalError,
});

const isExportError = (e: unknown): e is ExportError => {
  return (
    typeof e === "object" &&
    e !== null &&
    "tag" in e &&
    "message" in e &&
    "originalError" in e &&
    typeof (e as { tag: unknown }).tag === "string" &&
    typeof (e as { message: unknown }).message === "string" &&
    ["canvas", "imageLoad", "concurrency", "unknown"].includes(
      (e as { tag: string }).tag,
    )
  );
};

export const useExportStore = defineStore("export", () => {
  const isSaving = ref<boolean>(false);

  // --- レイアウト用定数 ---
  const CANVAS_WIDTH = 3840 as const;
  const CANVAS_PADDING_X = 241 as const;
  const CANVAS_PADDING_Y = 298 as const;
  const GRID_GAP_X = 13 as const;
  const GRID_GAP_Y = 72 as const;
  const TWO_ROWS_THRESHOLD = 20 as const; // sheet2を使う上限
  const THREE_ROWS_THRESHOLD = 30 as const; // sheetを使う上限
  const CANVAS_HEIGHT_TWO_ROWS = 1636 as const;
  const CANVAS_HEIGHT_THREE_ROWS = 2160 as const;
  const CARD_WIDTH_SMALL = 212 as const; // 30種を超える場合
  const CARD_WIDTH_LARGE = 324 as const; // 30種以下
  const CARD_HEIGHT_SMALL = 296 as const; // 30種を超える場合
  const CARD_HEIGHT_LARGE = 452 as const; // 30種以下
  const CARDS_PER_ROW_SMALL = 15 as const; // 30種を超える場合
  const CARDS_PER_ROW_LARGE = 10 as const; // 30種以下

  const calculateCanvasHeight = (cardCount: number): number => {
    if (cardCount <= TWO_ROWS_THRESHOLD) return CANVAS_HEIGHT_TWO_ROWS;
    return CANVAS_HEIGHT_THREE_ROWS;
  };

  const calculateCardWidth = (cardCount: number): number => {
    if (cardCount <= THREE_ROWS_THRESHOLD) return CARD_WIDTH_LARGE;
    return CARD_WIDTH_SMALL;
  };

  const calculateCardHeight = (cardCount: number): number => {
    if (cardCount <= THREE_ROWS_THRESHOLD) return CARD_HEIGHT_LARGE;
    return CARD_HEIGHT_SMALL;
  };

  const cardsPerRow = (cardCount: number): number => {
    if (cardCount <= THREE_ROWS_THRESHOLD) return CARDS_PER_ROW_LARGE;
    return CARDS_PER_ROW_SMALL;
  };

  const getBackgroundImageUrl = (cardCount: number): string => {
    const normalized = getNormalizedBaseUrl();
    if (cardCount <= TWO_ROWS_THRESHOLD)
      return `${normalized}sheet_two_rows.webp`;
    if (cardCount <= THREE_ROWS_THRESHOLD)
      return `${normalized}sheet_three_rows.webp`;
    return `${normalized}sheet_no_grid.webp`;
  };

  const loadImageElement = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.decoding = "async";
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = src;
    });
  };

  const ensureShipporiMinchoLoaded = async (): Promise<void> => {
    try {
      const normalized = getNormalizedBaseUrl();
      const url = `${normalized}ShipporiMincho-Bold.ttf`;
      const font = new FontFace("Shippori Mincho", `url(${url})`, {
        style: "normal",
        weight: "700",
        display: "swap",
      });
      // 既に登録済みかどうかの簡易チェック
      // Note: 同一family/weightは重複追加されてもブラウザが内側で扱うため問題になりづらい
      const loaded = await font.load();
      document.fonts?.add(loaded);
      // 使用サイズのプリロード
      await document.fonts?.load('700 128px "Shippori Mincho"');
      await document.fonts?.load('700 36px "Shippori Mincho"');
    } catch {
      // フォントロード失敗は致命ではないため継続
    }
  };

  /**
   * デッキをJPEG画像として保存
   */
  const saveDeckAsJpeg = async (deckName: string): Promise<void> => {
    if (isSaving.value) {
      throw createExportError({
        type: "concurrency",
        message: "現在エクスポート処理中です。完了後に再度お試しください。",
        originalError: null,
      });
    }

    isSaving.value = true;

    try {
      const deckStore = useDeckStore();
      const deckCards = deckStore.sortedDeckCards;

      // --- Canvas 準備 ---
      const distinctCount = deckCards.length;
      const canvas = document.createElement("canvas");
      const height = calculateCanvasHeight(distinctCount);
      canvas.width = CANVAS_WIDTH;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw createExportError({
          type: "canvas",
          message: "Canvas コンテキストの取得に失敗しました",
          originalError: null,
        });
      }

      // 背景描画
      const bg = await loadImageElement(getBackgroundImageUrl(distinctCount));
      ctx.drawImage(bg, 0, 0, CANVAS_WIDTH, height);

      // ヘッダテキスト（デッキ名 + 合計枚数）
      await ensureShipporiMinchoLoaded();
      ctx.textAlign = "center";
      ctx.fillStyle = "#353100";
      ctx.font = '700 128px "Shippori Mincho"';
      if (deckName) {
        ctx.fillText(`「${deckName}」`, canvas.width / 2, 240);
      }

      // カード群描画
      const cardW = calculateCardWidth(distinctCount);
      const cardH = calculateCardHeight(distinctCount);
      const perRow = cardsPerRow(distinctCount);

      // 座標計算を純粋関数として分離
      const calculatePosition = (index: number, perRow: number) => {
        const row = Math.floor(index / perRow);
        const col = index % perRow;
        return {
          x: CANVAS_PADDING_X + col * (cardW + GRID_GAP_X),
          y: CANVAS_PADDING_Y + row * (cardH + GRID_GAP_Y),
        };
      };

      // 事前に画像を読み込み（失敗許容: allSettled + プレースホルダ代替）
      const placeholderImg = await loadImageElement(getPlaceholderSrc());
      const results = await Promise.allSettled(
        deckCards.map((dc) => loadImageElement(getCardImageUrl(dc.card.id))),
      );
      const entries = results.map((res, i) => ({
        count: deckCards[i]?.count ?? 0,
        img:
          res.status === "fulfilled"
            ? res.value
            : (placeholderImg as HTMLImageElement | null),
      }));

      ctx.font = '700 36px "Shippori Mincho"';
      entries.forEach(({ img, count }, index) => {
        const { x, y } = calculatePosition(index, perRow);
        if (img) {
          ctx.drawImage(img, x, y, cardW, cardH);
        } else {
          // フォールバック: 何も描かれていないフレーム相当（背景のみ）
        }
        ctx.fillText(`${count}`, x + cardW / 2, y + cardH + 50);
      });

      const canvasToBlob = (
        canvas: HTMLCanvasElement,
        type: string,
      ): Promise<Blob> =>
        new Promise((resolve, reject) =>
          canvas.toBlob(
            (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
            type,
          ),
        );

      // ファイル名を生成（予約文字と制御文字を除去）
      const timestamp = new Date()
        .toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })
        .replace(/\//g, "-");
      const filename = `${deckName || "デッキ"}_${timestamp}.jpg`;
      // キャンバスをBlob化してダウンロード（メモリ効率）
      const blob = await canvasToBlob(canvas, "image/jpeg");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = filename;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      const errorMessage = "デッキ画像の保存に失敗しました";
      if (isExportError(e)) {
        throw e;
      }
      throw createExportError({
        type: "unknown",
        message: errorMessage,
        originalError: e,
      });
    } finally {
      isSaving.value = false;
    }
  };

  return {
    isSaving: readonly(isSaving),
    saveDeckAsJpeg,
  };
});
