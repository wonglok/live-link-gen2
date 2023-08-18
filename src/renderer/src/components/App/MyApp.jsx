import { HashRouter as Router, Switch, Route } from 'react-router-dom'
import { useApp } from './useApp'
import { Redirect } from 'react-router-dom/cjs/react-router-dom.min'
import { SetupHelper } from '../SetupHelper/SetupHelper'
import { App3D } from './App3D'

export function MyApp() {
  let blenderFileOK = useApp((r) => r.blenderFileOK)
  let blenderProgramOK = useApp((r) => r.blenderProgramOK)

  return (
    <Router>
      {/*  */}
      <div className="w-full h-full">
        <Switch>
          <Route path="/app">
            {!(blenderProgramOK && blenderFileOK) ? <Redirect to="/" /> : <App3D></App3D>}
          </Route>
          <Route path="/">
            {blenderProgramOK && blenderFileOK ? <Redirect to="/app" /> : <Home />}
          </Route>
        </Switch>
      </div>
      {/*  */}
    </Router>
  )
}

function Home() {
  return (
    <>
      <div className="text-2xl">Welcome to blender livelink</div>

      <SetupHelper></SetupHelper>
    </>
  )
}
