import { create } from 'zustand'
export const useApp = create((set, get) => {
  return {
    blenderProgram: ``,
    blenderFile: ``,
    blenderProgramOK: false,
    blenderFileOK: false,
    setProgram: (v) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('blenderProgram', v)
      }
      set({ blenderProgram: v })
      get().loadProgram()
    },

    setFile: (v) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('blenderFile', v)
      }
      set({ blenderFile: v })
      get().loadFile()
    },
    loadProgram: () => {
      if (typeof window !== 'undefined') {
        let blenderProgram = localStorage.getItem('blenderProgram')
        if (blenderProgram) {
          try {
            if (window.api.statSync(blenderProgram)) {
              set({ blenderProgram, blenderProgramOK: true })
            } else {
              set({ blenderProgram: false, blenderProgramOK: false })
            }
          } catch (e) {
            console.log(e)
          }
        }
      }
    },
    loadFile: () => {
      if (typeof window !== 'undefined') {
        let blenderFile = localStorage.getItem('blenderFile')
        if (blenderFile) {
          try {
            if (window.api.statSync(blenderFile)) {
              set({ blenderFile, blenderFileOK: true })
            } else {
              set({ blenderFile: false, blenderFileOK: false })
            }
          } catch (e) {
            console.log(e)
          }
        }
      }
    },
    onExit: () => {
      localStorage.removeItem('blenderFile')
      location.hash = '#/'
      set({ blenderFile: ``, blenderProgramOK: false, blenderFileOK: false })
    }
  }
})
