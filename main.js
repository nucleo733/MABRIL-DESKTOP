'use strict'

const { app, BrowserWindow, shell, Menu } = require('electron')
const path = require('node:path')

// La app de escritorio de MABRIL es una ventana nativa que carga la
// red real ya publicada en producción (mabril.app) — no duplica
// código, así que queda igual de actualizada que la web.
const MABRIL_URL = 'https://mabril.app/'

process.on('uncaughtException', (err) => {
  console.error('[MABRIL] error no manejado:', err)
})

let mainWindow = null

function buildMenu(win) {
  const isMac = process.platform === 'darwin'
  const template = [
    ...(isMac ? [{ role: 'appMenu' }] : []),
    { role: 'editMenu' },
    {
      label: 'Navegar',
      submenu: [
        {
          label: 'Atrás',
          accelerator: isMac ? 'Cmd+[' : 'Alt+Left',
          click: () => {
            if (win.webContents.canGoBack()) win.webContents.goBack()
          },
        },
        {
          label: 'Adelante',
          accelerator: isMac ? 'Cmd+]' : 'Alt+Right',
          click: () => {
            if (win.webContents.canGoForward()) win.webContents.goForward()
          },
        },
        { type: 'separator' },
        {
          label: 'Recargar',
          accelerator: isMac ? 'Cmd+R' : 'Ctrl+R',
          click: () => win.webContents.reloadIgnoringCache(),
        },
      ],
    },
    { role: 'windowMenu' },
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#04050d',
    title: 'MABRIL',
    icon: path.join(__dirname, 'build', 'icon.icns'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  buildMenu(mainWindow)
  // Siempre la versión más nueva al abrir — sin esto, una ventana que
  // se dejó abierta días podía seguir mostrando un MABRIL viejo aunque
  // la web ya estuviera actualizada (mismo hallazgo real que en CIELO).
  mainWindow.webContents.session.clearCache().finally(() => mainWindow.loadURL(MABRIL_URL))

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.webContents.on('app-command', (_event, cmd) => {
    if (cmd === 'browser-backward' && mainWindow.webContents.canGoBack()) mainWindow.webContents.goBack()
    if (cmd === 'browser-forward' && mainWindow.webContents.canGoForward()) mainWindow.webContents.goForward()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
