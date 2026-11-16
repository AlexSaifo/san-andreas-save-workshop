'use strict';
// Fetch the shared 3D assets only when the dressing room opens. Save files
// still use the editor's local File API and are never sent to the server.
let wardrobePack;
window.loadCJAssets = () => wardrobePack ??= (async () => {
  const response = await fetch('assets/cj-wardrobe.pack');
  if (!response.ok || !response.body) throw Error('CJ’s 3D assets could not load. Reopen Dressing room to retry. You can still edit clothes.');
  return new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).json();
})().catch(error => {
  wardrobePack = undefined;
  throw error;
});

const wardrobeShortcut = document.querySelector('#open-wardrobe');
wardrobeShortcut.addEventListener('click', () => { if (save) navigate('appearance'); });

async function openDownload() {
  const button = document.querySelector('#open-sample');
  button.disabled = true;
  try {
    const response = await fetch('downloads/GTASAsf1.b');
    if (!response.ok) throw Error('Could not open Slot 1. Download it from the welcome page and open the file manually.');
    await loadFile(new File([await response.arrayBuffer()], 'GTASAsf1.b'));
  } catch (e) {
    notice(e.message, true);
  } finally {
    button.disabled = false;
  }
}
document.querySelector('#open-sample').addEventListener('click', openDownload);
if (new URLSearchParams(location.search).get('sample') === 'slot1') {
  // Load the sample once. Refreshing later should return to the file picker.
  history.replaceState(null, '', location.pathname + location.hash);
  openDownload();
}
