import path from 'path'
import { app, ipcMain } from 'electron'
import serve from 'electron-serve'
import { createWindow } from './helpers'
import { startExpressServer, connectMqtt, cleanupMqtt } from '../backend/server.js'
import { getSensorData, getSensorData1 } from '../backend/database.js'

const isProd = process.env.NODE_ENV === 'production'

if (isProd) {
  serve({ directory: 'app' })
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`)
}

(async () => {
  await app.whenReady()

   const {server} = startExpressServer(5000);

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
  });

  if (isProd) {
    await mainWindow.loadURL('app://./home')
  } else {
    const port = process.argv[2]
    await mainWindow.loadURL(`http://localhost:${port}/home`)
    mainWindow.webContents.openDevTools()
  }

  ipcMain.handle('get-data', async () => {
    try {
      console.log('Fetching data from database...');
      const data = await getSensorData();
      console.log('Data fetched from database:', data);
      console.log(Array.isArray(data), data);
      return data;
    } catch (error) {
      console.error('Error fetching data:', error);
      return [];
    }
  });

  ipcMain.handle('get-data1', async () => {
    try {
      console.log('Fetching data1 from database...');
      const data = await getSensorData1();
      console.log('Data1 fetched from database:', data);
      console.log(Array.isArray(data), data);
      return data;
    } catch (error) {
      console.error('Error fetching data1:', error);
      return [];
    }
  });

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
