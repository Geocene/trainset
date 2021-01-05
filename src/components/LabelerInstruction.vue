<template>
  <div id="legend" class="container">
    <div class="row">
      <div class="col" id="leftInstr">
        <strong>How to Label Points</strong><br/>
        <strong>Click</strong> a point to toggle it as labeled<br/>
        <strong>Click & Drag</strong> over a selection of points to label them<br/>
        <strong><kbd>SHIFT</kbd> + Click & Drag </strong> over a selection of points to unlabel them<br/>
      </div>
      <div class="col" id="rightInstr">
        <strong>How to Navigate the Graph</strong><br/>
        <kbd>→</kbd> or <kbd>←</kbd> : pan<br/>
        <kbd>SHIFT</kbd> + <kbd>→</kbd> or <kbd>←</kbd> : fast pan<br/>
        <kbd>↑</kbd> or <kbd>↓</kbd>: zoom<br/>
        <strong>Click & Drag</strong> the bottom context bar to adjust focus region<br/>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LabelerInstruction'
}
</script>
