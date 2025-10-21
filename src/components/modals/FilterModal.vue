<!--
  仕様
  - 目的: 検索テキスト/種類/タイプ/タグ/登場条件でカード一覧を絞り込む。
  - 入力(Props): isVisible: boolean
  - 出力(Emits): close
  - スロット: なし
  - 動作: 入力テキストを 200ms デバウンス（maxWait: 1000ms）でストアへ反映。
          ストア側の変更は双方向に同期。
  - アクセシビリティ: モーダル外クリックで閉じる。統計表示あり。
  - 副作用: なし（ストア更新のみ）
-->
<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { watchDebounced } from "@vueuse/core";
import { useFilterStore } from "../../stores";
import type { CardKind, CardType } from "../../types";
import BaseButton from "../atoms/BaseButton.vue";
import CheckboxRow from "../atoms/CheckboxRow.vue";
import TabSwitch from "../molecules/TabSwitch.vue";
import { ID_INITIAL_LABELS } from "../../constants";

interface Props {
  isVisible: boolean;
}

interface Emits {
  (e: "close"): void;
}

defineProps<Props>();
const emit = defineEmits<Emits>();

const filterStore = useFilterStore();

const filterCriteria = computed(() => filterStore.filterCriteria);
const allKinds = computed(() => filterStore.allKinds);
const allTypes = computed(() => filterStore.allTypes);
const allTags = computed(() => filterStore.allTags);
const filterStats = computed(() => filterStore.filterStats);
const allIdInitials = computed(() => filterStore.allIdInitials);

const isKindSelected = (kind: CardKind): boolean =>
  filterCriteria.value.kind.includes(kind);
const isTypeSelected = (type: CardType): boolean =>
  filterCriteria.value.type.includes(type);
const isTagSelected = (tag: string): boolean =>
  filterCriteria.value.tags.includes(tag);
const isIdInitialSelected = (ch: string): boolean =>
  filterCriteria.value.idInitials.includes(ch);

const tagOperatorModel = computed<string>({
  get: () => filterStore.filterCriteria.tagOperator,
  set: (v: string) => {
    const operator = v === "OR" || v === "AND" ? v : "OR";
    filterStore.setTagOperator(operator);
  },
});

const inputText = ref(filterStore.filterCriteria.text);
watchDebounced(
  inputText,
  (text) => {
    if (text !== filterStore.filterCriteria.text) {
      filterStore.setTextFilter(text);
    }
  },
  { debounce: 200, maxWait: 1000 },
);

watch(
  () => filterStore.filterCriteria.text,
  (text) => {
    if (text !== inputText.value) inputText.value = text;
  },
);

const toggleKind = (kind: CardKind) => {
  filterStore.toggleKindFilter(kind);
};

const toggleType = (type: CardType) => {
  filterStore.toggleTypeFilter(type);
};

const toggleTag = (tag: string) => {
  filterStore.toggleTagFilter(tag);
};

const resetFilters = () => {
  filterStore.resetFilterCriteria();
};
</script>

<template>
  <div
    v-if="isVisible"
    class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black"
    @click.self="emit('close')"
  >
    <div class="flex h-full w-full flex-col overflow-hidden bg-gray-800 p-4">
      <div class="mb-4 flex shrink-0 items-center justify-between">
        <div>
          <h3 class="text-lg font-bold">検索・絞り込み</h3>
          <div class="mt-1 text-sm text-gray-400">
            {{ filterStats.filteredCount }} /
            {{ filterStats.totalCount }} 件表示
            <span class="text-blue-400">
              ({{ Math.round(filterStats.filterRate * 100) }}%)
            </span>
          </div>
        </div>
        <div class="flex gap-2">
          <BaseButton
            variant="secondary"
            size="sm"
            @click="resetFilters"
            :disabled="!filterStats.hasFilter"
            title="フィルターをリセット"
          >
            リセット
          </BaseButton>
          <BaseButton
            variant="ghost"
            size="sm"
            @click="emit('close')"
            aria-label="閉じる"
            title="閉じる"
          >
            閉じる
          </BaseButton>
        </div>
      </div>

      <div class="shrink-0">
        <div class="mb-4">
          <label for="searchText" class="mb-1 block text-sm font-medium">
            テキスト検索 (名前, ID, タグ)
          </label>
          <div class="relative">
            <input
              id="searchText"
              type="text"
              v-model="inputText"
              class="w-full rounded border border-gray-600 bg-gray-700 px-3 py-2 pr-10 text-sm focus:border-blue-500 focus:ring focus:outline-none sm:text-base"
              placeholder="カード名、ID、タグを入力"
            />
            <button
              v-if="inputText"
              @click="inputText = ''"
              class="absolute top-1/2 right-2 -translate-y-1/2 transform text-gray-400 hover:text-white"
            >
              <svg
                class="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </button>
          </div>
        </div>

        <div class="mb-4 flex flex-wrap gap-4">
          <CheckboxRow
            :checked="filterCriteria.onlyFavorites"
            @change="filterStore.toggleOnlyFavoritesFilter()"
          >
            <span class="text-sm font-medium">お気に入りのみ</span>
          </CheckboxRow>
          <CheckboxRow
            :checked="filterCriteria.hasEntryCondition"
            @change="filterStore.toggleEntryConditionFilter()"
          >
            <span class="text-sm font-medium">【登場条件】で絞り込み</span>
          </CheckboxRow>
        </div>
      </div>

      <div class="mb-4">
        <label class="mb-2 block text-sm font-medium">
          収録弾で絞り込み
          <span
            v-if="filterCriteria.idInitials.length > 0"
            class="ml-1 text-blue-400"
          >
            ({{ filterCriteria.idInitials.length }} 選択中)
          </span>
        </label>
        <div
          class="grid grid-cols-3 text-sm sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-10 xl:grid-cols-12"
        >
          <CheckboxRow
            v-for="ch in allIdInitials"
            :key="ch"
            :checked="isIdInitialSelected(ch)"
            @change="filterStore.toggleIdInitialFilter(ch)"
          >
            {{ ID_INITIAL_LABELS[ch] ?? ch }}
          </CheckboxRow>
        </div>
      </div>

      <div class="mb-4">
        <label class="mb-2 block text-sm font-medium">
          種類で絞り込み
          <span
            v-if="filterCriteria.kind.length > 0"
            class="ml-1 text-blue-400"
          >
            ({{ filterCriteria.kind.length }} 選択中)
          </span>
        </label>
        <div class="grid grid-cols-4 text-sm">
          <CheckboxRow
            v-for="kind in allKinds"
            :key="kind"
            :checked="isKindSelected(kind)"
            @change="toggleKind(kind)"
          >
            {{ kind }}
          </CheckboxRow>
        </div>
      </div>

      <div class="mb-4">
        <label class="mb-2 block text-sm font-medium">
          タイプで絞り込み
          <span
            v-if="filterCriteria.type.length > 0"
            class="ml-1 text-blue-400"
          >
            ({{ filterCriteria.type.length }} 選択中)
          </span>
        </label>
        <div class="grid grid-cols-5 text-sm md:grid-cols-9">
          <CheckboxRow
            v-for="type in allTypes"
            :key="type"
            :checked="isTypeSelected(type)"
            @change="toggleType(type)"
          >
            {{ type }}
          </CheckboxRow>
        </div>
      </div>

      <div class="flex min-h-0 flex-1 flex-col">
        <div
          class="mb-2 flex shrink-0 flex-wrap items-center justify-between gap-2"
        >
          <label class="block text-sm font-medium">
            タグで絞り込み
            <span
              v-if="filterCriteria.tags.length > 0"
              class="ml-1 text-blue-400"
            >
              ({{ filterCriteria.tags.length }} 選択中)
            </span>
          </label>
          <TabSwitch
            v-model="tagOperatorModel"
            :options="[
              { label: 'OR', value: 'OR' },
              { label: 'AND', value: 'AND' },
            ]"
          />
        </div>
        <div
          class="grid flex-1 grid-cols-2 overflow-y-auto pr-2 text-sm sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
        >
          <CheckboxRow
            v-for="tag in allTags"
            :key="tag"
            :checked="isTagSelected(tag)"
            @change="toggleTag(tag)"
          >
            <span class="text-xs">{{ tag }}</span>
          </CheckboxRow>
        </div>
      </div>
    </div>
  </div>
</template>
