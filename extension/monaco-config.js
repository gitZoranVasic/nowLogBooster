// Configure Monaco environment BEFORE loading Monaco
// This must be loaded before monaco/vs/loader.js
self.MonacoEnvironment = {
  getWorker: function(workerId, label) {
    // Create a worker from a blob that handles messages properly
    const workerCode = `
      self.onmessage = function(e) {
        // Echo back empty responses to keep Monaco happy
        self.postMessage({ id: e.data.id, result: null });
      };
    `;
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const blobURL = URL.createObjectURL(blob);
    return new Worker(blobURL);
  }
};
