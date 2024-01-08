import ReactDOM from 'react-dom/client'

import './globals.css'
import typescriptLogo from '/typescript.svg'
import viteLogo from '/vite.svg'

const App = () => {
  return (
    <div>
      <a href="https://vitejs.dev" target="_blank">
        <img src={viteLogo} className="logo" alt="Vite logo" />
      </a>
      <a href="https://www.typescriptlang.org/" target="_blank">
        <img
          src={typescriptLogo}
          className="logo vanilla"
          alt="TypeScript logo"
        />
      </a>
      <h1>Vite + TypeScript</h1>
      <p className="read-the-docs">
        Click on the Vite and TypeScript logos to learn more
      </p>
    </div>
  )
}

ReactDOM.createRoot(document.querySelector<HTMLDivElement>('#app')!).render(
  <App />,
)
