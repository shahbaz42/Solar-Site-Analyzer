```vue
<template>
  <aside
    class="w-80 lg:relative fixed inset-y-0 left-0 z-30 bg-gray-800 border-r border-gray-700 flex flex-col overflow-hidden transition-transform duration-300 lg:translate-x-0"
    :class="isOpen ? 'translate-x-0' : '-translate-x-full'"
  >
    <!-- Sidebar Header -->
    <div
      class="px-6 py-4 h-20 border-b border-gray-700 flex items-center justify-between"
    >
      <h2 class="text-md font-semibold text-white flex items-center space-x-2">
        <Sliders class="w-5 h-5" />
        <span>Analysis Controls</span>
      </h2>
      <!-- Close button (mobile only) -->
      <button
        @click="closeSidebar"
        class="lg:hidden p-2 hover:bg-gray-700 rounded transition-colors"
      >
        <X class="w-5 h-5 text-gray-400" />
      </button>
    </div>

    <!-- Scrollable Content -->
    <div class="flex-1 overflow-y-auto px-6 py-1 space-y-6">
      <!-- Filters Section -->
      <section class="pt-6">
        <h3
          class="text-md font-semibold text-white flex items-center space-x-2"
        >
          <Filter class="w-4 h-4" />
          <span>Score Filters</span>
        </h3>

        <div class="space-y-6 py-6">
          <RangeSlider
            label="Score Range"
            :icon="Target"
            :min="0"
            :max="100"
            :step="1"
            v-model="scoreRange"
            color="text-blue-400"
          />

          <button
            v-if="hasFiltersApplied"
            @click="resetFilters"
            class="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <X class="w-4 h-4" />
            <span>Clear Filters</span>
          </button>

          <!-- Export Dropdown -->
          <div class="relative">
            <button
              @click="toggleExportDropdown"
              :disabled="exporting"
              class="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <Download class="w-4 h-4" />
              <span>{{ exporting ? "Exporting..." : "Export Results" }}</span>
              <ChevronDown
                class="w-4 h-4"
                :class="{ 'rotate-180': showExportDropdown }"
              />
            </button>

            <!-- Dropdown Menu -->
            <div
              v-if="showExportDropdown"
              class="absolute bottom-full left-0 right-0 mb-2 bg-gray-700 rounded-lg shadow-xl border border-gray-600 overflow-hidden z-50"
            >
              <button
                @click="exportAs('csv')"
                class="w-full px-4 py-3 text-left text-gray-200 hover:bg-gray-600 transition-colors flex items-center space-x-3"
              >
                <FileText class="w-4 h-4 text-green-400" />
                <div>
                  <div class="font-medium">Export as CSV</div>
                  <div class="text-xs text-gray-400">Spreadsheet format</div>
                </div>
              </button>
              <button
                @click="exportAs('json')"
                class="w-full px-4 py-3 text-left text-gray-200 hover:bg-gray-600 transition-colors flex items-center space-x-3"
              >
                <Code class="w-4 h-4 text-blue-400" />
                <div>
                  <div class="font-medium">Export as JSON</div>
                  <div class="text-xs text-gray-400">
                    Structured data format
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Weights Section -->
      <section class="py-4">
        <h3
          class="text-md font-semibold text-white flex items-center space-x-2"
        >
          <Weight class="w-4 h-4" />
          <span>Factor Weights</span>
        </h3>

        <div class="space-y-4 py-6">
          <WeightSlider
            label="Solar Irradiance"
            :icon="Sun"
            v-model="localWeights.solar"
            color="text-yellow-500"
          />
          <WeightSlider
            label="Available Area"
            :icon="Maximize"
            v-model="localWeights.area"
            color="text-blue-500"
          />
          <WeightSlider
            label="Grid Distance"
            :icon="Zap"
            v-model="localWeights.grid_distance"
            color="text-green-500"
          />
          <WeightSlider
            label="Terrain Slope"
            :icon="Mountain"
            v-model="localWeights.slope"
            color="text-purple-500"
          />
          <WeightSlider
            label="Infrastructure"
            :icon="Building"
            v-model="localWeights.infrastructure"
            color="text-orange-500"
          />
        </div>

        <!-- Weight Sum Validation -->
        <div class="mt-4 p-3 rounded-lg" :class="weightSumClass">
          <div class="flex items-center justify-between text-sm">
            <span class="font-medium">Total Weight:</span>
            <span class="font-bold">{{ weightSum.toFixed(2) }}</span>
          </div>
          <div v-if="!isWeightSumValid" class="mt-1 text-xs">
            Weights must sum to 1.00
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="mt-4 space-y-2">
          <button
            @click="applyWeights"
            :disabled="!isWeightSumValid || siteStore.analyzing"
            class="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <RefreshCw
              class="w-4 h-4"
              :class="{ 'animate-spin': siteStore.analyzing }"
            />
            <span>{{
              siteStore.analyzing ? "Analyzing..." : "Recalculate Scores"
            }}</span>
          </button>

          <button
            @click="resetToDefaults"
            class="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <RotateCcw class="w-4 h-4" />
            <span>Reset to Defaults</span>
          </button>
        </div>
      </section>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import {
  Sliders,
  Weight,
  Sun,
  Maximize,
  Zap,
  Mountain,
  Building,
  RefreshCw,
  RotateCcw,
  Filter,
  X,
  Target,
  Download,
  ChevronDown,
  FileText,
  Code,
} from "lucide-vue-next";
import { useSiteStore } from "@/stores/siteStore";
import { DEFAULT_WEIGHTS } from "@/config";
import WeightSlider from "@/components/WeightSlider.vue";
import RangeSlider from "@/components/RangeSlider.vue";
import apiService from "@/services/api";
import type { AnalysisWeights } from "@/types";

// Props
interface Props {
  isOpen?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: true,
});

// Emits
const emit = defineEmits<{
  close: [];
}>();

const siteStore = useSiteStore();

const localWeights = ref<AnalysisWeights>({ ...siteStore.weights });
const showExportDropdown = ref(false);
const exporting = ref(false);

// Use the store filters to keep the dual range in sync
const scoreRange = ref<[number, number]>([
  siteStore.filters.minScore,
  siteStore.filters.maxScore,
]);

const hasFiltersApplied = computed(
  () => scoreRange.value[0] > 0 || scoreRange.value[1] < 100
);

// Watch all filter ranges and update store
watch(scoreRange, (newVal) => {
  siteStore.filters.minScore = newVal[0];
  siteStore.filters.maxScore = newVal[1];
});

function resetFilters() {
  siteStore.resetFilters();
  scoreRange.value = [siteStore.filters.minScore, siteStore.filters.maxScore];
}

function closeSidebar() {
  emit("close");
}

function toggleExportDropdown() {
  showExportDropdown.value = !showExportDropdown.value;
}

async function exportAs(format: "csv" | "json") {
  exporting.value = true;
  showExportDropdown.value = false;

  try {
    const params = {
      min_score: siteStore.filters.minScore,
      max_score: siteStore.filters.maxScore,
    };

    if (format === "csv") {
      await apiService.exportCSV(params);
    } else {
      await apiService.exportJSON(params);
    }
  } catch (error) {
    console.error("Export failed:", error);
    siteStore.error = "Failed to export data. Please try again.";
  } finally {
    exporting.value = false;
  }
}

// Close dropdown when clicking outside
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement;
  if (showExportDropdown.value && !target.closest(".relative")) {
    showExportDropdown.value = false;
  }
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});

// Watch store filters and update sliders when reset externally
watch(
  () => [siteStore.filters.minScore, siteStore.filters.maxScore],
  ([min, max]) => {
    scoreRange.value = [min, max];
  }
);

// Sync weights
watch(
  () => siteStore.weights,
  (newWeights) => {
    localWeights.value = { ...newWeights };
  },
  { deep: true }
);

const weightSum = computed(() =>
  Object.values(localWeights.value).reduce((sum, val) => sum + val, 0)
);

const isWeightSumValid = computed(() => Math.abs(weightSum.value - 1.0) < 0.01);

const weightSumClass = computed(() =>
  isWeightSumValid.value
    ? "bg-green-900/30 border border-green-700 text-green-300"
    : "bg-red-900/30 border border-red-700 text-red-300"
);

async function applyWeights() {
  try {
    await siteStore.analyzeSitesWithWeights(localWeights.value);
  } catch (error) {
    console.error("Failed to apply weights:", error);
  }
}

function resetToDefaults() {
  localWeights.value = { ...DEFAULT_WEIGHTS };
  siteStore.resetWeights();
}
</script>
```
