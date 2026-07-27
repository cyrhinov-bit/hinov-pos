const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('hardwareAPI', {
  printReceipt: (content) => ipcRenderer.invoke('print-receipt', content),
  openCashDrawer: () => ipcRenderer.invoke('open-cash-drawer')
});
