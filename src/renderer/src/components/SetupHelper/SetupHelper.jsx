// import { useEffect, useState } from 'react'
import { useEffect } from 'react'
import { SelectBlenderFile } from './SelectBlenderFile'
import { SelectBlenderProgram } from './SelectBlenderProgram'
import { useApp } from '../App/useApp'

export function SetupHelper() {
  useEffect(() => {
    useApp.getState().loadProgram()
    useApp.getState().loadFile()
  }, [])

  return (
    <>
      {/*  */}

      <div className="mb-2">
        <SelectBlenderProgram></SelectBlenderProgram>
      </div>

      <div className="mb-2">
        <SelectBlenderFile></SelectBlenderFile>
      </div>

      {/*  */}
    </>
  )
}
