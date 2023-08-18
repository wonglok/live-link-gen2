import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js'
import { DoubleSide, InstancedMesh, Matrix4, Mesh, MeshPhysicalMaterial, Object3D } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { MeshStandardMaterial } from 'three'

function makeParser() {
  let plyLoader = new PLYLoader()
  let gltfLoader = new GLTFLoader()

  async function parseSignal(string) {
    if (string.indexOf('__PARSE__TEXT__') === 0) {
      string = string.replace('__PARSE__TEXT__', '')
      return string
    }
    if (string.indexOf('__PARSE__PLY__') === 0) {
      string = string.replace('__PARSE__PLY__', '')
      let arr = string.split('__META_SPLIT__')
      let metadata = JSON.parse(arr[0])
      let plyRaw = arr[1]
      let geometry = plyLoader.parse(plyRaw)
      geometry.name = metadata.name
      return {
        geoHash: metadata.geoHash || '',
        geometry,
        ...metadata
      }
    }
    if (string.indexOf('__PARSE__JSON__') === 0) {
      string = string.replace('__PARSE__JSON__', '')
      // console.log(string)

      try {
        let yo = JSON.parse(string)
        return yo
      } catch (e) {
        console.error(e)
        console.error(string)
        return null
      }
    }
  }

  return {
    parsePly: (plyRaw) => {
      return plyLoader.parse(plyRaw)
    },
    parseGltfAsync: (gltfRaw) => {
      let yo = JSON.parse(gltfRaw.join('\n'))
      return new Promise((resolve) => {
        gltfLoader.parse(yo, '/', (bv) => {
          resolve(bv)
        })
      })
    },
    parseSignal
  }
}

export let importItems = async (res) => {
  let parser = makeParser()

  let heap = await Promise.all(
    res
      .map((r) => {
        r = r.trim()
        if (r.indexOf(`__PARSE__`) === 0) {
          return parser.parseSignal(r)
        } else {
          return false
        }
      })
      .filter((r) => r)
  )

  let glbs = heap.filter((r) => r.type === 'glb')

  let mats = heap.filter((r) => r.type === 'material')

  let matsProms = mats.map((mat) => {
    mat.materialProm = parser.parseGltfAsync(mat.gltf)

    return mat.materialProm.then((r) => {
      let found = false
      let foundGeo = false
      r.scene.traverse((it) => {
        if (it.material && !found) {
          found = it.material
        }
        if (it.material && !foundGeo) {
          foundGeo = it.geometry
        }
      })

      mat.material = found
      mat.geo = foundGeo
    })
  })

  await Promise.all(matsProms)

  let meshes = await Promise.all(
    glbs.map((glb) => {
      return new Promise((resolve) => {
        let geoGLB = heap.find((r) => r.type === 'geometry' && r.geoHash === glb.geoHash)
        let materialGLB = heap.find((r) => r.type === 'material' && r.geoHash === glb.geoHash)

        if (geoGLB) {
          let mesh = new Mesh(geoGLB.geometry, new MeshStandardMaterial({ side: DoubleSide }))
          mesh.name = geoGLB.name

          mesh.position.fromArray(glb.position)
          mesh.quaternion.fromArray(glb.quaternion)
          mesh.scale.fromArray(glb.scale)

          if (materialGLB && geoGLB) {
            mesh.material = materialGLB.material
          } else {
            mesh.material = new MeshPhysicalMaterial({
              side: DoubleSide
            })
          }
          resolve(mesh)
        } else {
          resolve(null)
        }
      })
    })
  ).then((rr) => {
    return rr.filter((r) => r)
  })

  heap = heap.filter((r) => r)

  let instances = heap.filter((r) => r.type === 'instance')
  let geometries = heap.filter((r) => r.type === 'geometry')

  let instMeshes = geometries.map((r) => {
    let instancesOfGeo = instances.filter((i) => i.geoHash === r.geoHash)
    let instCount = instancesOfGeo.length

    let rightMaterial = mats.find((m) => m.geoHash === r.geoHash)

    // console.log(rightMaterial)

    let iMeshYo = new InstancedMesh(
      // rightMaterial.geometry, //
      r.geometry,
      rightMaterial?.material ||
        new MeshPhysicalMaterial({
          color: 0xffffff,
          side: DoubleSide,
          metalness: 0.0,
          roughness: 0.0,
          transmission: 1,
          thickness: 1.5
        }),
      instCount
    )

    iMeshYo.material.thickness += 1

    iMeshYo.name = r.geoHash

    let o3 = new Object3D()
    let matrix = new Matrix4()
    instancesOfGeo.forEach((info, idx) => {
      o3.position.fromArray(info.position)
      o3.quaternion.fromArray(info.quaternion)
      o3.scale.fromArray(info.scale)

      matrix.identity()
      matrix.compose(o3.position, o3.quaternion, o3.scale)
      iMeshYo.setMatrixAt(idx, matrix)
    })

    iMeshYo.instanceMatrix.needsUpdate = true
    iMeshYo.frustumCulled = false

    iMeshYo.name = r.geoHash
    return iMeshYo
  })

  return { meshes, instMeshes }
}
