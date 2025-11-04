<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="closeModal"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>

        <!-- Modal Content -->
        <div
          class="relative bg-gray-800 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-700"
        >
          <!-- Header -->
          <div class="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <BarChart3 class="w-6 h-6 text-primary-500" />
              <h2 class="text-xl font-bold text-white">Site Analysis Statistics</h2>
            </div>
            <button
              @click="closeModal"
              class="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X class="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-y-auto p-6">
            <div v-if="loading" class="flex items-center justify-center h-64">
              <div class="text-center">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                <p class="text-gray-400">Loading statistics...</p>
              </div>
            </div>

            <div v-else-if="stats" class="space-y-6">
              <!-- Overall Metrics -->
              <section>
                <h3 class="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                  <TrendingUp class="w-5 h-5 text-green-400" />
                  <span>Overall Metrics</span>
                </h3>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div class="bg-gray-700 rounded-lg p-4">
                    <div class="text-sm text-gray-400 mb-1">Total Sites</div>
                    <div class="text-2xl font-bold text-white">{{ stats.total_sites }}</div>
                  </div>
                  <div class="bg-gray-700 rounded-lg p-4">
                    <div class="text-sm text-gray-400 mb-1">Analyzed</div>
                    <div class="text-2xl font-bold text-white">{{ stats.sites_analyzed }}</div>
                  </div>
                  <div class="bg-gray-700 rounded-lg p-4">
                    <div class="text-sm text-gray-400 mb-1">Average Score</div>
                    <div class="text-2xl font-bold text-white">{{ stats.average_score.toFixed(1) }}</div>
                  </div>
                  <div class="bg-gray-700 rounded-lg p-4">
                    <div class="text-sm text-gray-400 mb-1">Median Score</div>
                    <div class="text-2xl font-bold text-white">{{ stats.median_score.toFixed(1) }}</div>
                  </div>
                  <div class="bg-gray-700 rounded-lg p-4">
                    <div class="text-sm text-gray-400 mb-1">Min Score</div>
                    <div class="text-2xl font-bold text-white">{{ stats.min_score.toFixed(1) }}</div>
                  </div>
                  <div class="bg-gray-700 rounded-lg p-4">
                    <div class="text-sm text-gray-400 mb-1">Max Score</div>
                    <div class="text-2xl font-bold text-white">{{ stats.max_score.toFixed(1) }}</div>
                  </div>
                  <div class="bg-gray-700 rounded-lg p-4 md:col-span-2">
                    <div class="text-sm text-gray-400 mb-1">Std Deviation</div>
                    <div class="text-2xl font-bold text-white">{{ stats.std_deviation.toFixed(2) }}</div>
                  </div>
                </div>
              </section>

              <!-- Charts Grid -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Score Distribution Chart -->
                <section class="bg-gray-700 rounded-lg p-4">
                  <h3 class="text-md font-semibold text-white mb-4 flex items-center space-x-2">
                    <PieChart class="w-4 h-4 text-blue-400" />
                    <span>Score Distribution</span>
                  </h3>
                  <div class="h-64">
                    <canvas ref="scoreDistChart"></canvas>
                  </div>
                </section>

                <!-- Regional Statistics Chart -->
                <section class="bg-gray-700 rounded-lg p-4">
                  <h3 class="text-md font-semibold text-white mb-4 flex items-center space-x-2">
                    <MapPin class="w-4 h-4 text-green-400" />
                    <span>Regional Averages</span>
                  </h3>
                  <div class="h-64">
                    <canvas ref="regionalChart"></canvas>
                  </div>
                </section>

                <!-- Land Type Statistics Chart -->
                <section class="bg-gray-700 rounded-lg p-4">
                  <h3 class="text-md font-semibold text-white mb-4 flex items-center space-x-2">
                    <Layers class="w-4 h-4 text-purple-400" />
                    <span>Land Type Performance</span>
                  </h3>
                  <div class="h-64">
                    <canvas ref="landTypeChart"></canvas>
                  </div>
                </section>

                <!-- Top Performing Sites -->
                <section class="bg-gray-700 rounded-lg p-4">
                  <h3 class="text-md font-semibold text-white mb-4 flex items-center space-x-2">
                    <Award class="w-4 h-4 text-yellow-400" />
                    <span>Top 10 Sites</span>
                  </h3>
                  <div class="h-64 overflow-y-auto">
                    <div class="space-y-2">
                      <div
                        v-for="(site, index) in stats.top_performing_sites"
                        :key="site.site_id"
                        class="flex items-center justify-between p-2 bg-gray-600 rounded hover:bg-gray-500 transition-colors"
                      >
                        <div class="flex items-center space-x-3">
                          <div
                            class="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
                            :class="
                              index === 0
                                ? 'bg-yellow-500 text-gray-900'
                                : index === 1
                                ? 'bg-gray-400 text-gray-900'
                                : index === 2
                                ? 'bg-orange-600 text-white'
                                : 'bg-gray-700 text-gray-300'
                            "
                          >
                            {{ index + 1 }}
                          </div>
                          <div>
                            <div class="text-sm font-medium text-white">{{ site.site_name }}</div>
                            <div class="text-xs text-gray-400">{{ site.region }}</div>
                          </div>
                        </div>
                        <div class="text-right">
                          <div class="text-sm font-bold text-white">
                            {{ site.total_suitability_score?.toFixed(1) || 'N/A' }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>

            <div v-else class="flex items-center justify-center h-64">
              <div class="text-center">
                <AlertCircle class="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p class="text-gray-400">Failed to load statistics</p>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-6 py-4 border-t border-gray-700 flex justify-end">
            <button
              @click="closeModal"
              class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted, nextTick } from 'vue';
import {
  BarChart3,
  X,
  TrendingUp,
  PieChart,
  MapPin,
  Layers,
  Award,
  AlertCircle,
} from 'lucide-vue-next';
import { useSiteStore } from '@/stores/siteStore';
import Chart from 'chart.js/auto';
import type { StatisticsResponse } from '@/types';

interface Props {
  isOpen: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
}>();

const siteStore = useSiteStore();
const loading = ref(false);
const stats = ref<StatisticsResponse | null>(null);

// Chart refs
const scoreDistChart = ref<HTMLCanvasElement>();
const regionalChart = ref<HTMLCanvasElement>();
const landTypeChart = ref<HTMLCanvasElement>();

let chartInstances: Chart[] = [];

function closeModal() {
  emit('close');
}

async function loadStatistics() {
  loading.value = true;
  try {
    // Pass current filter values to get filtered statistics
    const params = {
      min_score: siteStore.filters.minScore,
      max_score: siteStore.filters.maxScore,
    };
    
    await siteStore.fetchStatistics(params);
    stats.value = siteStore.statistics;
    
    // Wait for DOM to update before rendering charts
    await nextTick();
    
    // Use setTimeout to ensure charts render after DOM is fully ready
    setTimeout(() => {
      renderCharts();
    }, 100);
  } catch (error) {
    console.error('Failed to load statistics:', error);
  } finally {
    loading.value = false;
  }
}

function renderCharts() {
  console.log('Rendering charts...', {
    hasStats: !!stats.value,
    scoreDistRef: !!scoreDistChart.value,
    regionalRef: !!regionalChart.value,
    landTypeRef: !!landTypeChart.value,
    scoreDistData: stats.value?.score_distribution?.length || 0,
  });

  // Destroy existing charts
  chartInstances.forEach(chart => chart.destroy());
  chartInstances = [];

  if (!stats.value || !stats.value.score_distribution || stats.value.score_distribution.length === 0) {
    console.warn('No statistics data available for charts');
    return;
  }

  // Score Distribution Chart
  if (scoreDistChart.value) {
    const ctx = scoreDistChart.value.getContext('2d');
    if (ctx && stats.value.score_distribution.length > 0) {
      const chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: stats.value.score_distribution.map(d => d.range_label),
          datasets: [
            {
              data: stats.value.score_distribution.map(d => d.count),
              backgroundColor: [
                '#ef4444',
                '#f97316',
                '#eab308',
                '#84cc16',
                '#10b981',
              ],
              borderWidth: 2,
              borderColor: '#1f2937',
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: '#d1d5db',
                padding: 10,
                font: { size: 11 },
              },
            },
            tooltip: {
              callbacks: {
                label: (context: any) => {
                  const label = context.label || '';
                  const value = context.parsed || 0;
                  const percentage = stats.value?.score_distribution[context.dataIndex].percentage || 0;
                  return `${label}: ${value} sites (${percentage.toFixed(1)}%)`;
                },
              },
            },
          },
        },
      });
      chartInstances.push(chart);
    }
  }

  // Regional Chart
  if (regionalChart.value && stats.value.regional_stats && stats.value.regional_stats.length > 0) {
    const ctx = regionalChart.value.getContext('2d');
    if (ctx) {
      const chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: stats.value.regional_stats.map(r => r.region),
          datasets: [
            {
              label: 'Average Score',
              data: stats.value.regional_stats.map(r => r.avg_score),
              backgroundColor: '#10b981',
              borderWidth: 0,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false,
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              ticks: { color: '#d1d5db' },
              grid: { color: '#374151' },
            },
            x: {
              ticks: { color: '#d1d5db' },
              grid: { display: false },
            },
          },
        },
      });
      chartInstances.push(chart);
    }
  }

  // Land Type Chart
  if (landTypeChart.value && stats.value.land_type_stats && stats.value.land_type_stats.length > 0) {
    const ctx = landTypeChart.value.getContext('2d');
    if (ctx) {
      const chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: stats.value.land_type_stats.map(l => l.land_type),
          datasets: [
            {
              label: 'Average Score',
              data: stats.value.land_type_stats.map(l => l.avg_score),
              backgroundColor: '#8b5cf6',
              borderWidth: 0,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          plugins: {
            legend: {
              display: false,
            },
          },
          scales: {
            x: {
              beginAtZero: true,
              max: 100,
              ticks: { color: '#d1d5db' },
              grid: { color: '#374151' },
            },
            y: {
              ticks: { color: '#d1d5db' },
              grid: { display: false },
            },
          },
        },
      });
      chartInstances.push(chart);
    }
  }
}

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    loadStatistics();
  }
});

onUnmounted(() => {
  chartInstances.forEach(chart => chart.destroy());
});
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: transform 0.3s ease;
}

.modal-enter-from .relative,
.modal-leave-to .relative {
  transform: scale(0.95);
}
</style>
