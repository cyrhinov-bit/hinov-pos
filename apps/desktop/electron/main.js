const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  if (app.isPackaged) {
    // En production, on charge les fichiers web compilés
    win.loadFile(path.join(__dirname, '../dist-web/index.html'));
  } else {
    // Force l'affichage de l'application Caisse Web en mode développement
    win.loadURL('http://localhost:3001');
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handler pour l'imprimante thermique et le tiroir-caisse
ipcMain.handle('print-receipt', async (_event, content) => {
  console.log("Printing receipt: ", content);
  // Ici nous ajouterons la logique escpos pour communiquer avec l'imprimante USB
  return true;
});

ipcMain.handle('open-cash-drawer', async (_event) => {
  console.log("Opening cash drawer");
  // Commande ESC/POS d'ouverture du tiroir
  return true;
});
