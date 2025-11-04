<template>
  <div ref="mapContainer" class="w-full h-full">
    <!-- Map will be rendered here -->
  </div>
  
  <!-- Map Controls Overlay -->
  <div class="absolute top-4 right-4 flex flex-col space-y-2">
    <!-- Zoom Controls -->
    <div class="flex flex-col bg-white rounded-lg shadow-lg overflow-hidden">
      <button
        @click="zoomIn"
        class="p-2 hover:bg-gray-50 transition-colors border-b border-gray-200"
        title="Zoom In"
      >
        <Plus class="w-5 h-5 text-gray-700" />
      </button>

      <button
        @click="zoomOut"
        class="p-2 hover:bg-gray-50 transition-colors border-b border-gray-200"
        title="Zoom Out"
      >
        <Minus class="w-5 h-5 text-gray-700" />
      </button>

      <button
        @click="resetView"
        class="p-2 hover:bg-gray-50 transition-colors"
        title="Reset View"
      >
        <Home class="w-5 h-5 text-gray-700" />
      </button>
    </div>

    <!-- Heat Map Toggle -->
    <button
      @click="toggleHeatMap"
      class="p-2 bg-white hover:bg-gray-50 transition-colors rounded-lg shadow-lg"
      :class="{ 'bg-amber-50 ring-2 ring-amber-400': heatMapEnabled }"
      :title="heatMapEnabled ? 'Switch to Markers' : 'Switch to Heat Map'"
    >
      <Flame class="w-5 h-5" :class="heatMapEnabled ? 'text-amber-600' : 'text-gray-700'" />
    </button>
  </div>

  <!-- Heat Map Legend -->
  <div
    v-if="heatMapEnabled"
    class="absolute bottom-56 right-4 bg-white rounded-lg shadow-lg p-4 z-10"
  >
    <h3 class="text-sm font-semibold text-gray-800 mb-2">Suitability Score</h3>
    <div class="flex items-center space-x-2">
      <div class="flex flex-col-reverse h-32 w-6 rounded" :style="{ background: 'linear-gradient(to top, #3b82f6, #10b981, #fbbf24, #ef4444)' }"></div>
      <div class="flex flex-col-reverse justify-between h-32 text-xs text-gray-600">
        <span>Low (0)</span>
        <span class="my-auto">Medium (50)</span>
        <span>High (100)</span>
      </div>
    </div>
  </div>

  <!-- Site Detail Popup -->
  <div
    v-if="siteStore.selectedSite && popupPosition"
    class="absolute bg-white rounded-lg shadow-xl p-4 w-72 z-10"
    :style="{
      left: `${popupPosition.x}px`,
      top: `${popupPosition.y}px`,
      transform: 'translate(-50%, -100%) translateY(-10px)'
    }"
  >
    <button
      @click="closePopup"
      class="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded"
    >
      <X class="w-4 h-4 text-gray-500" />
    </button>
    
    <SitePopup :site="siteStore.selectedSite" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import mapboxgl from 'mapbox-gl';
import { Plus, Minus, Home, X, Flame } from 'lucide-vue-next';
import { useSiteStore } from '@/stores/siteStore';
import { MAPBOX_TOKEN, DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, getScoreColor } from '@/config';
import SitePopup from '@/components/SitePopup.vue';
import type { Site } from '@/types';

const siteStore = useSiteStore();
const mapContainer = ref<HTMLDivElement>();
const map = ref<mapboxgl.Map>();
const markers = ref<Map<number, mapboxgl.Marker>>(new Map());
const popupPosition = ref<{ x: number; y: number } | null>(null);
const heatMapEnabled = ref(false);
let popupUpdateInterval: number | null = null;
const HEATMAP_SOURCE_ID = 'sites-heat';
const HEATMAP_LAYER_ID = 'sites-heatmap';

onMounted(() => {
  if (!MAPBOX_TOKEN) {
    console.error('Mapbox token is not configured. Please set VITE_MAPBOX_TOKEN in .env file');
    return;
  }

  mapboxgl.accessToken = MAPBOX_TOKEN;

  map.value = new mapboxgl.Map({
    container: mapContainer.value!,
    style: 'mapbox://styles/mapbox/dark-v11',
    center: DEFAULT_MAP_CENTER,
    zoom: DEFAULT_MAP_ZOOM,
  });

  // Wait for map to load before adding sources and layers
  map.value.on('load', () => {
    initializeHeatMap();
  });
  
  // Update popup position during map movement
  map.value.on('move', () => {
    if (siteStore.selectedSite) {
      updatePopupPosition(siteStore.selectedSite);
    }
  });
  
  // Update markers when sites change
  watch(() => siteStore.filteredSites, (sites) => {
    if (heatMapEnabled.value) {
      updateHeatMapData(sites);
    } else {
      updateMarkers(sites);
    }
  }, { immediate: true, deep: true });
  
  // Watch selected site to center map
  watch(() => siteStore.selectedSite, (site) => {
    if (site && map.value) {
      map.value.flyTo({
        center: [site.longitude, site.latitude],
        zoom: 12,
        duration: 1000,
      });
      updatePopupPosition(site);
    } else {
      popupPosition.value = null;
    }
  });
});

onUnmounted(() => {
  if (popupUpdateInterval) {
    clearInterval(popupUpdateInterval);
  }
  map.value?.remove();
});

function updateMarkers(sites: Site[]) {
  if (!map.value) return;

  // Remove old markers
  markers.value.forEach((marker) => marker.remove());
  markers.value.clear();

  // Add new markers
  sites.forEach((site) => {
    const score = site.total_suitability_score ?? 0;
    const color = getScoreColor(score);
    const isSelected = siteStore.selectedSite?.site_id === site.site_id;

    // Create wrapper for proper positioning
    const wrapper = document.createElement('div');
    wrapper.className = 'marker-wrapper';
    wrapper.style.position = 'relative';
    
    // Create inner marker element that can scale
    const el = document.createElement('div');
    el.className = 'custom-marker';
    el.style.width = isSelected ? '36px' : '24px';
    el.style.height = isSelected ? '36px' : '24px';
    el.style.borderRadius = '50%';
    el.style.backgroundColor = color;
    el.style.border = isSelected ? '3px solid #fbbf24' : '2px solid white';
    el.style.cursor = 'pointer';
    el.style.boxShadow = isSelected ? '0 0 20px rgba(251, 191, 36, 0.6)' : '0 2px 4px rgba(0,0,0,0.3)';
    el.style.transition = 'width 0.2s, height 0.2s, border 0.2s, box-shadow 0.2s';
    el.style.position = 'absolute';
    el.style.top = '50%';
    el.style.left = '50%';
    el.style.transform = 'translate(-50%, -50%)';
    el.style.willChange = 'width, height';

    // Add hover effect - only change size, not transform
    el.addEventListener('mouseenter', () => {
      if (!isSelected) {
        el.style.width = '28px';
        el.style.height = '28px';
      }
    });
    el.addEventListener('mouseleave', () => {
      if (!isSelected) {
        el.style.width = '24px';
        el.style.height = '24px';
      }
    });

    wrapper.appendChild(el);

    const marker = new mapboxgl.Marker({
      element: wrapper,
      anchor: 'center'
    })
      .setLngLat([site.longitude, site.latitude])
      .addTo(map.value!);

    el.addEventListener('click', () => {
      siteStore.selectSite(site);
    });

    markers.value.set(site.site_id, marker);
  });
}

function updatePopupPosition(site: Site) {
  if (!map.value) return;
  
  const point = map.value.project([site.longitude, site.latitude]);
  popupPosition.value = {
    x: point.x,
    y: point.y,
  };
}

function zoomIn() {
  map.value?.zoomIn();
}

function zoomOut() {
  map.value?.zoomOut();
}

function resetView() {
  map.value?.flyTo({
    center: DEFAULT_MAP_CENTER,
    zoom: DEFAULT_MAP_ZOOM,
    duration: 1000,
  });
  siteStore.selectSite(null);
}

function closePopup() {
  siteStore.selectSite(null);
  popupPosition.value = null;
}

function initializeHeatMap() {
  if (!map.value) return;

  // Add heat map source
  map.value.addSource(HEATMAP_SOURCE_ID, {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: [],
    },
  });

  // Add heat map layer
  map.value.addLayer({
    id: HEATMAP_LAYER_ID,
    type: 'heatmap',
    source: HEATMAP_SOURCE_ID,
    paint: {
      // Increase weight as score increases
      'heatmap-weight': [
        'interpolate',
        ['linear'],
        ['get', 'score'],
        0, 0,
        100, 1
      ],
      // Increase intensity as zoom level increases
      'heatmap-intensity': [
        'interpolate',
        ['linear'],
        ['zoom'],
        0, 1,
        9, 3
      ],
      // Color ramp for heatmap - blue (low) to red (high)
      'heatmap-color': [
        'interpolate',
        ['linear'],
        ['heatmap-density'],
        0, 'rgba(33, 102, 172, 0)',
        0.2, 'rgb(59, 130, 246)',
        0.4, 'rgb(16, 185, 129)',
        0.6, 'rgb(251, 191, 36)',
        0.8, 'rgb(245, 158, 11)',
        1, 'rgb(239, 68, 68)'
      ],
      // Adjust radius by zoom level
      'heatmap-radius': [
        'interpolate',
        ['linear'],
        ['zoom'],
        0, 2,
        4, 15,
        9, 40
      ],
      // Transition from heatmap to circle layer by zoom level
      'heatmap-opacity': [
        'interpolate',
        ['linear'],
        ['zoom'],
        7, 1,
        9, 0.5
      ],
    },
  });

  // Initially hide the heat map
  map.value.setLayoutProperty(HEATMAP_LAYER_ID, 'visibility', 'none');

  // Update heat map data when sites change
  updateHeatMapData(siteStore.filteredSites);
}

function updateHeatMapData(sites: Site[]) {
  if (!map.value || !map.value.getSource(HEATMAP_SOURCE_ID)) return;

  const features = sites
    .filter((site) => site.total_suitability_score !== null)
    .map((site) => ({
      type: 'Feature' as const,
      properties: {
        score: site.total_suitability_score,
        name: site.site_name,
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [site.longitude, site.latitude],
      },
    }));

  const source = map.value.getSource(HEATMAP_SOURCE_ID) as mapboxgl.GeoJSONSource;
  source.setData({
    type: 'FeatureCollection',
    features,
  });
}

function toggleHeatMap() {
  if (!map.value) return;

  heatMapEnabled.value = !heatMapEnabled.value;

  if (heatMapEnabled.value) {
    // Show heat map, hide markers
    map.value.setLayoutProperty(HEATMAP_LAYER_ID, 'visibility', 'visible');
    markers.value.forEach((marker) => marker.remove());
    // Close any open popup
    siteStore.selectSite(null);
  } else {
    // Hide heat map, show markers
    map.value.setLayoutProperty(HEATMAP_LAYER_ID, 'visibility', 'none');
    updateMarkers(siteStore.filteredSites);
  }
}
</script>

<style scoped>
:deep(.mapboxgl-ctrl-logo) {
  display: none !important;
}
</style>
