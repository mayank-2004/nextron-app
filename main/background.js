import path from 'path'
import { app, ipcMain } from 'electron'
import serve from 'electron-serve'
import { createWindow } from './helpers'
import { startExpressServer, connectMqtt, cleanupMqtt } from '../backend/server'

const isProd = process.env.NODE_ENV === 'production'

if (isProd) {
  serve({ directory: 'app' })
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`)
}

(async () => {
  await app.whenReady()

  // start express server
  const {server} = startExpressServer(5000);

  // connect to MQTT broker
  const MQTT_BROKER = "mqtt://192.168.1.200:1883";
  connectMqtt(MQTT_BROKER, {
    username: "Swajahome",
    password: "12345678",
  });

  const mainWindow = createWindow('main', {
    width: 900,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  if (isProd) {
    await mainWindow.loadURL('app://./home')
  } else {
    const port = process.argv[2]
    await mainWindow.loadURL(`http://localhost:${port}/home`)
    mainWindow.webContents.openDevTools()
  }

  app.on('before-quit', () => {
    cleanupMqtt();
    server.close();
  });
})();

app.on('window-all-closed', () => {
  app.quit()
})

ipcMain.on('message', async (event, arg) => {
  event.reply('message', `${arg} World!`)
})
