import { create } from 'zustand'

export const useGNLink = create((set, get) => {
  return {
    //
    params: [],
    instMeshes: [],
    meshes: []
  }
})
