import { useApp } from '../App/useApp'

export function SelectBlenderProgram() {
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

  let blenderProgramOK = useApp((r) => r.blenderProgramOK)
  let setSelBlender = (v) => useApp.getState().setProgram(v)

  let onSelBlender = async () => {
    let res = await window.api.pickFile()
    //
    let first = res.filePaths[0]

    if (first) {
      console.log(first)
      let filePath = `${first}${`/Contents/MacOS/Blender`}`

      if (window.electron.process.platform.includes('darwin')) {
        if (filePath.includes(`.app/Contents/MacOS/Blender`)) {
          setSelBlender(filePath)
        }
      } else {
        setSelBlender(filePath)
      }
    }
  }

  return (
    <div>
      {blenderProgramOK && (
        <div>
          <button className="p-2 px-4 bg-green-200 mr-2 rounded-2xl ">
            Blender Program is Selected ✅
          </button>
          <button className="p-2 px-4 bg-blue-200 mr-2 rounded-2xl " onClick={onSelBlender}>
            Change Program
          </button>
        </div>
      )}

      {!blenderProgramOK && (
        <>
          <button className="p-2 px-4 bg-blue-200 mr-2 rounded-2xl" onClick={onSelBlender}>
            Please Select Blender Binary / Exec on Your device
          </button>
        </>
      )}
    </div>
  )
}
