// const path = require('path')
import { spawn } from 'child_process'
import getDataScript from './getData.py?asset'

export async function getData({
  payload = {},
  onSignal = () => {},
  scriptPath = ``,
  blendPath = ``,
  binaryPath = '/Applications/Blender3p5.app/Contents/MacOS/Blender'
}) {
  return new Promise((resolve) => {
    // let path = require('path')

    // console.log(scriptNew)
    const live = spawn(
      binaryPath,
      [
        '--factory-startup',
        '--background',
        blendPath,
        '--python',
        getDataScript,
        '--',
        JSON.stringify({ ...payload })
      ],
      {}
    )

    let signalStore = []
    let raw = ''
    live.stdout.on('data', (data) => {
      raw = `${raw}${data}`
    })

    live.on('close', () => {
      console.log('closed')

      if (
        raw.indexOf('__OBJECT_SPLIT__') !== -1 &&
        raw.indexOf('__OBJECT_START__') !== -1 &&
        raw.indexOf('__OBJECT_END__') !== -1
      ) {
        // raw = raw.split('__OBJECT_START__').join('')
        // raw = raw.split('__OBJECT_END__').join('')

        // console.log(raw)
        raw
          .split('__OBJECT_SPLIT__')
          .filter((r) => r)
          .map((item) => {
            // console.log(item)

            onSignal(item)
            signalStore.push(item)

            return item
          })

        // let arr2 = arr.slice()
        // raw = arr2.pop()
      }

      resolve(signalStore)
    })

    live.stderr.on('data', (data) => {
      console.log(`ERR: ${data}`)
    })

    ///
  })
}

//
