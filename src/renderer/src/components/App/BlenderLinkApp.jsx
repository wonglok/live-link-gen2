// import Versions from './components/Versions'
// import icons from './assets/icons.svg'
import { useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, OrbitControls, PerspectiveCamera } from '@react-three/drei'
// import { create } from 'zustand'
import { PPSwitch } from './agape-pacakge/agape-sdk/src/Canvas/PPSwitch'

import { getData, useAgapeStore } from './agape-pacakge/useAgapeStore'
import { SetupPostProcessingArea } from './agape-pacakge/SetupPostProcessingArea/SetupPostProcessingArea'
import { useGNLink } from './state'
import * as nProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { Perf } from 'r3f-perf'
import { importItems } from './importItems'
import { useApp } from './compos/useApp'
import lake_pier_1k from '../src/assets/lake_pier_1k.hdr?url'
// lake_pier_1k //${location.origin}/assets/lake_pier_1k.hdr

function BlednerLinkApp() {
  // let params = useGNLink((r) => r.params)
  let instMeshes = useGNLink((r) => r.instMeshes)
  let meshes = useGNLink((r) => r.meshes)
  let blenderProgram = useApp((r) => r.blenderProgram)
  let blenderFile = useApp((r) => r.blenderFile)

  let onExit = () => {
    //
    useApp.getState().onExit()
  }
  let getGeo = async () => {
    nProgress.start()
    console.log(window.api.cwd())
    await window.api
      .getData({
        onSignal: async () => {
          // if (data.indexOf(`__PARSE__`) === 0) {
          //   try {
          //     // let res = await parser.parseSignal(data)
          //     // // if (res.type === 'geometry') {}
          //     // console.log(res)
          //   } catch (e) {
          //     console.error(e)
          //   }
          // }
        },
        payload: {
          params: useGNLink.getState().params,
          type: 'get_geo_instances'
        },
        binaryPath: blenderProgram, //`/Applications/Blender3p5.app/Contents/MacOS/Blender`,
        // scriptPath: `/Volumes/StableFiles/AutoBackup/AgapeLAB/Livelink-electron/livelink-app/src/preload/ops/getData.py`,
        blendPath: blenderFile // `/Volumes/StableFiles/AutoBackup/AgapeLAB/Livelink-electron/livelink-app/resources/blend/geo_inst.blend`
      })
      .then(async (res) => {
        // console.table(res)
        res = res.filter(
          (r) => r && r.indexOf('__OBJECT_START__') !== -1 && r.indexOf('__OBJECT_END__') !== -1
        )
        res = res.map((r) => {
          r = r.split('__OBJECT_START__').join('')
          r = r.split('__OBJECT_END__').join('')
          return r
        })

        res = res.filter((r) => r)

        useGNLink.setState({
          exportData: res
        })

        let { meshes, instMeshes } = await importItems(res)

        useGNLink.setState({
          meshes,
          instMeshes: instMeshes
        })

        nProgress.done()
      })
  }

  useEffect(() => {
    // onInit()
    getGeo().catch(() => {
      onExit()
    })
  }, [])

  useEffect(() => {
    if (!blenderFile) {
      return
    }
    return window.api.watchFile(blenderFile, () => {
      //
      getGeo()
      console.log('blender file changed')
    })
  }, [])

  // let tt = useRef(0)

  return (
    <div className="h-full w-full">
      {/* <button className="bg-green-500" onClick={onInit}>
        LiveLink
      </button> */}

      {/* {params.map((r) => {
        return (
          <div key={r._id}>
            <span className="mr-3">{r._id}</span>
            <span className="mr-3">{r.name}</span>
            <input
              type={'range'}
              min={1}
              max={100}
              onChange={(ev) => {
                //
                r.value = ev.target.value

                useGNLink.setState({ params: [...params] })

                // clearTimeout(tt.current)
                // tt.current = setTimeout(() => {
                //   getGeo()
                // }, 75)
              }}
              defaultValue={r.default_value}
            ></input>
          </div>
        )
      })} */}

      <div className="w-full h-full flex ">
        <Canvas className=" w-full h-full ">
          <Perf showGraph={false} position="bottom-left"></Perf>
          <color attach={'background'} args={['#0f0f0f']}></color>

          <OrbitControls makeDefault></OrbitControls>

          <PerspectiveCamera makeDefault position={[0, 15, 30]}></PerspectiveCamera>

          <Environment files={`${lake_pier_1k}`} background></Environment>

          <PPSwitch useStore={useAgapeStore}></PPSwitch>

          <group rotation={[Math.PI * -0.5, 0, 0]}>
            {instMeshes.map((rMesh) => {
              return (
                <group key={rMesh.uuid}>
                  <primitive object={rMesh}></primitive>
                </group>
              )
            })}
          </group>

          <group rotation={[Math.PI * -0.5, 0, 0]}>
            {meshes.map((rMesh) => {
              return (
                <group key={rMesh.uuid}>
                  <primitive object={rMesh}></primitive>
                </group>
              )
            })}
          </group>
        </Canvas>
        <div className="h-full overflow-scroll bg-gray-700" style={{ width: `380px` }}>
          <button className="bg-blue-300 p-2 px-4 m-3 rounded-xl" onClick={onExit}>
            Exit
          </button>

          <SetupPostProcessingArea></SetupPostProcessingArea>

          <button
            className="bg-green-500 text-white p-3"
            onClick={() => {
              getGeo()
            }}
          >
            Sync Instances
          </button>

          <button
            className="bg-blue-500 text-white p-3"
            onClick={() => {
              //
              let json = JSON.stringify(getData())

              window.yoclipboard(json)
              //
            }}
          >
            Save PostProcessing
          </button>

          <button
            className="bg-blue-500 text-white p-3"
            onClick={() => {
              //
              let json = JSON.stringify(useGNLink.getState().exportData, null, '  ')

              window.yoclipboard(json)
              //
            }}
          >
            Save Manifest
          </button>
        </div>
      </div>

      {/* <Versions></Versions> */}
    </div>
  )
}

export { BlednerLinkApp }

// let onInit = async () => {
//   let parser = makeParser()

//   await window.api
//     .getData({
//       onSignal: async (data) => {
//         if (data.indexOf(`__PARSE__`) === 0) {
//           // try {
//           //   let res = await parser.parseSignal(data)
//           //   // if (res.type === 'geometry') {}
//           //   console.log(res)
//           // } catch (e) {
//           //   console.error(e)
//           // }
//         }
//       },
//       payload: {
//         type: 'get_paramters'
//       },
//       binaryPath: `/Applications/Blender3p5.app/Contents/MacOS/Blender`,
//       scriptPath: `/Volumes/StableFiles/AutoBackup/AgapeLAB/Livelink-electron/livelink-app/src/preload/ops/getData.py`,
//       blendPath: `/Volumes/StableFiles/AutoBackup/AgapeLAB/Livelink-electron/livelink-app/resources/blend/geo_inst.blend`
//     })
//     .then(async (res) => {
//       let heap = await Promise.all(
//         res
//           .filter((r) => r)
//           .map((r) => {
//             return parser.parseSignal(r)
//           })
//       )

//       useGNLink.setState({
//         params: heap[0]
//       })

//       getGeo()

//       // get_virtual_instances
//     })
// }
