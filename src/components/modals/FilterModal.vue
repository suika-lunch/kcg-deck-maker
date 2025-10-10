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

const isKindSelected = (kind: CardKind): boolean =>
  filterCriteria.value.kind.includes(kind);
const isTypeSelected = (type: CardType): boolean =>
  filterCriteria.value.type.includes(type);
const isTagSelected = (tag: string): boolean =>
  filterCriteria.value.tags.includes(tag);

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
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click.self="emit('close')"
  >
    <div class="bg-gray-800 p-4 w-full h-full flex flex-col overflow-hidden">
      <div class="flex justify-between items-center mb-4 flex-shrink-0">
        <div>
          <h3 class="text-lg font-bold">検索・絞り込み</h3>
          <div class="text-sm text-gray-400 mt-1">
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

      <div class="flex-shrink-0">
        <div class="mb-4">
          <label for="searchText" class="block text-sm font-medium mb-1">
            テキスト検索 (名前, ID, タグ)
          </label>
          <div class="relative">
            <input
              id="searchText"
              type="text"
              v-model="inputText"
              class="w-full px-3 py-2 pr-10 text-sm sm:text-base rounded bg-gray-700 border border-gray-600 focus:outline-none focus:ring focus:border-blue-500"
              placeholder="カード名、ID、タグを入力"
            />
            <button
              v-if="inputText"
              @click="inputText = ''"
              class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <svg
                class="w-4 h-4"
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

        <div class="mb-4">
          <CheckboxRow
            :checked="filterCriteria.onlyFavorites"
            @change="filterStore.toggleOnlyFavoritesFilter()"
          >
            <span class="text-sm font-medium">お気に入りのみ</span>
          </CheckboxRow>
        </div>
      </div>

      <div class="mb-4">
        <label class="block text-sm font-medium mb-2">
          種類で絞り込み
          <span
            v-if="filterCriteria.kind.length > 0"
            class="text-blue-400 ml-1"
          >
            ({{ filterCriteria.kind.length }} 選択中)
          </span>
        </label>
        <div class="grid grid-cols-2 sm:grid-cols-4 text-sm">
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
        <label class="block text-sm font-medium mb-2">
          タイプで絞り込み
          <span
            v-if="filterCriteria.type.length > 0"
            class="text-blue-400 ml-1"
          >
            ({{ filterCriteria.type.length }} 選択中)
          </span>
        </label>
        <div class="grid grid-cols-3 sm:grid-cols-5 text-sm">
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

      <div class="mb-4">
        <CheckboxRow
          :checked="filterCriteria.hasEntryCondition"
          @change="filterStore.toggleEntryConditionFilter()"
        >
          <span class="text-sm font-medium">【登場条件】で絞り込み</span>
        </CheckboxRow>
      </div>

      <div class="min-h-0 flex-1 flex flex-col">
        <div
          class="flex items-center justify-between mb-2 flex-shrink-0 flex-wrap gap-2"
        >
          <label class="block text-sm font-medium">
            タグで絞り込み
            <span
              v-if="filterCriteria.tags.length > 0"
              class="text-blue-400 ml-1"
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
          class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 text-sm overflow-y-auto pr-2 flex-1"
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
