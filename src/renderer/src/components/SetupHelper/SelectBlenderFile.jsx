import { useApp } from '../App/useApp'

export function SelectBlenderFile() {
  /*
  'aix'
'darwin'
'freebsd'
'linux'
'openbsd'
'sunos'
'win32'
//status
  */

  // let blenderFile = useApp((r) => r.blenderFile)
  let blenderFileOK = useApp((r) => r.blenderFileOK)
  let setFile = (v) => useApp.getState().setFile(v)

  let onSelBlender = async () => {
    let res = await window.api.pickFile()

    let first = res.filePaths[0]

    if (first) {
      let filePath = first

      console.log(filePath)

      setFile(filePath)
    }
  }

  return (
    <div>
      {blenderFileOK && (
        <div>
          <button className="p-2 px-4 bg-green-200 mr-2 rounded-2xl ">Blender File is OK ✅</button>
          <button className="p-2 px-4 bg-blue-200 mr-2 rounded-2xl " onClick={onSelBlender}>
            Change File
          </button>
        </div>
      )}

      {!blenderFileOK && (
        <>
          <button className="p-2 px-4 bg-blue-200 mr-2 rounded-2xl" onClick={onSelBlender}>
            Please Select Blender File
          </button>
        </>
      )}
    </div>
  )
}
