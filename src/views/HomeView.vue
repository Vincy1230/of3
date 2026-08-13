<!--
  Author: Vincy SHI
  Email: vincy@vincy1230.net
-->
<script setup lang="ts">
import AppHeader from '@/components/AppHeader.vue'
import PresetSelector from '@/components/PresetSelector.vue'
import QueryManager from '@/components/QueryManager.vue'
import ChainList from '@/components/ChainList.vue'
import PocketConstraintPanel from '@/components/PocketConstraintPanel.vue'
import GlobalOptionsPanel from '@/components/GlobalOptionsPanel.vue'
import ValidationSummary from '@/components/ValidationSummary.vue'
import JsonPreviewPanel from '@/components/JsonPreviewPanel.vue'
import SiteFooter from '@/components/SiteFooter.vue'
</script>

<template>
  <div class="app-shell">
    <AppHeader />
    <main class="layout">
      <aside class="col controls">
        <PresetSelector />
        <QueryManager />
        <ChainList />
        <PocketConstraintPanel />
        <GlobalOptionsPanel />
      </aside>
      <section class="col workspace-col">
        <ValidationSummary />
        <JsonPreviewPanel class="json-flex" />
      </section>
    </main>
    <SiteFooter />
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.layout {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(300px, 360px) minmax(0, 1fr);
  gap: 1rem;
  padding: 1rem clamp(1rem, 3vw, 2rem) 1rem;
  max-width: 1680px;
  width: 100%;
  margin: 0 auto;
}

.col {
  min-height: 0;
  overflow-y: auto;
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.workspace-col {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow: hidden;
}

.json-flex {
  flex: 1;
  min-height: 0;
}

@media (max-width: 1100px) {
  .app-shell {
    height: auto;
    min-height: 100vh;
  }

  .layout {
    grid-template-columns: 1fr;
    height: auto;
  }

  .col {
    overflow-y: visible;
  }

  .workspace-col {
    overflow: visible;
  }

  .json-flex {
    min-height: 480px;
  }
}
</style>
