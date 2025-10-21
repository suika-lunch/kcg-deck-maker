<!--
  仕様
  - 目的: カード画像の拡大表示モーダル。左右スワイプ/矢印キーで前後移動。
  - 入力(Props):
    - isVisible: boolean
    - imageSrc: string | null
    - currentCard?: Card | null
    - cardIndex?: number | null
    - totalCards?: number | null
  - 出力(Emits): close / navigate(direction: "previous" | "next")
  - スロット: なし
  - アクセシビリティ: role="dialog"、フォーカストラップ、sr-only 見出しを付与。
  - 副作用: なし（フォーカス復帰のみ）
-->
<template>
  <div
    v-if="isVisible"
    class="fixed inset-0 z-9999 flex items-center justify-center bg-black/80 p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
    @click="closeModal"
    @keydown="handleKeydown"
  >
    <div
      ref="modalContent"
      class="relative max-h-[98vh] max-w-[98vw] outline-none"
      @click.stop
      tabindex="-1"
    >
      <div
        v-if="isImageLoading && imageSrc"
        class="absolute inset-0 flex items-center justify-center"
      >
        <BaseSpinner size="lg">読み込み中...</BaseSpinner>
      </div>

      <div ref="imageContainer" class="relative" style="touch-action: none">
        <img
          v-if="imageSrc"
          :src="imageSrc"
          :alt="imageAltText"
          crossorigin="anonymous"
          class="max-h-[98vh] max-w-[98vw] object-contain shadow-2xl"
          @error="onModalImageError"
          @load="isImageLoading = false"
        />
        <h2 id="modal-title" class="sr-only">{{ imageAltText }}</h2>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";
import { useSwipe } from "@vueuse/core";
import { handleImageError } from "../../utils";
import type { Card } from "../../types";
import BaseSpinner from "../atoms/BaseSpinner.vue";

interface Props {
  isVisible: boolean;
  imageSrc: string | null;
  currentCard?: Card | null;
  cardIndex?: number | null;
  totalCards?: number | null;
}

interface Emits {
  (e: "close"): void;
  (e: "navigate", direction: "previous" | "next"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const imageContainer = ref<HTMLElement | null>(null);
const modalContent = ref<HTMLElement | null>(null);
const isImageLoading = ref(false);
let previousFocusElement: HTMLElement | null = null;

// 画像の読み込み開始時
watch(
  () => props.imageSrc,
  (newSrc) => {
    if (newSrc) {
      isImageLoading.value = true;
    }
  },
);

// ナビゲーション可能性を計算
const hasPreviousCard = computed(() => {
  if (props.cardIndex === null || props.cardIndex === undefined) return false;
  return props.cardIndex > 0;
});

const hasNextCard = computed(() => {
  if (
    props.cardIndex === null ||
    props.cardIndex === undefined ||
    props.totalCards === null ||
    props.totalCards === undefined
  )
    return false;
  return props.cardIndex < props.totalCards - 1;
});

// useSwipeの適用
useSwipe(imageContainer, {
  threshold: 40,
  onSwipeEnd(_, direction) {
    if (direction === "left" && hasNextCard.value) {
      navigateToNext();
    } else if (direction === "right" && hasPreviousCard.value) {
      navigateToPrevious();
    }
  },
});

// ナビゲーション関数
const navigateToPrevious = () => {
  if (hasPreviousCard.value) {
    emit("navigate", "previous");
  }
};

const navigateToNext = () => {
  if (hasNextCard.value) {
    emit("navigate", "next");
  }
};

const closeModal = () => {
  restoreFocus();
  emit("close");
};

// アクセシビリティ関連の関数とコンピューテッドプロパティ
const imageAltText = computed(() => {
  if (!props.currentCard) {
    return "カードの詳細画像";
  }

  const cardInfo = props.currentCard.name;
  const positionInfo =
    props.cardIndex !== null &&
    props.cardIndex !== undefined &&
    props.totalCards
      ? ` (${props.cardIndex + 1}/${props.totalCards})`
      : "";

  return `${cardInfo}の詳細画像${positionInfo}`;
});

// キーボードイベントハンドラー
const handleKeydown = (event: KeyboardEvent) => {
  switch (event.key) {
    case "Escape":
      event.preventDefault();
      closeModal();
      break;
    case "ArrowLeft":
      event.preventDefault();
      if (hasPreviousCard.value) {
        navigateToPrevious();
      }
      break;
    case "ArrowRight":
      event.preventDefault();
      if (hasNextCard.value) {
        navigateToNext();
      }
      break;
  }
};

// フォーカス管理
const trapFocus = () => {
  if (modalContent.value) {
    modalContent.value.focus();
  }
};

const saveFocus = () => {
  previousFocusElement = document.activeElement as HTMLElement;
};

const restoreFocus = () => {
  if (previousFocusElement) {
    previousFocusElement.focus();
    previousFocusElement = null;
  }
};

// モーダル表示/非表示の監視
watch(
  () => props.isVisible,
  async (newVisible) => {
    if (newVisible) {
      saveFocus();
      await nextTick();
      trapFocus();
    } else {
      restoreFocus();
    }
  },
);

// ライフサイクルフック
onMounted(() => {
  if (props.isVisible) {
    saveFocus();
    trapFocus();
  }
});

onUnmounted(() => {
  restoreFocus();
});

const onModalImageError = (e: Event) => {
  try {
    handleImageError(e);
  } catch (error) {
    console.error("Error handling image error:", error);
  }
};
</script>

<style scoped>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
