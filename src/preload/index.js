import { contextBridge, clipboard } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { ipcRenderer } from 'electron'
import { unwatchFile, watchFile } from 'node:fs'
import fs from 'fs'
import { getData } from './opts/getData'

// Custom APIs for renderer
const api = {
  getData: getData,

  pickFile: () => {
    return ipcRenderer.invoke('open-file-dialog-for-file')
  },
  watchFile: (filePath, fnc) => {
    watchFile(filePath, fnc)
    return () => {
      unwatchFile(filePath, fnc)
    }
  },
  statSync: (filePath) => {
    return fs.statSync(filePath)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('yoclipboard', (v) => {
      clipboard.writeText(v)
    })

    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
  window.yoclipboard = (v) => {
    clipboard.writeText(v)
  }
}
