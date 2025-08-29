import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ProtectedRoutes } from './routes';
function App() {
  return (
    <>
      <nav>
        <ul>
          <li>
            <a href="/">Home</a>
          </li>
          <li>
            <a href="/about">About</a>
          </li>
        </ul>
      </nav>
      <main>
        <Router>
          <Routes>
            {ProtectedRoutes.map((route, index) => (
              <Route key={index} path={route.path} element={route.element} />
            ))}
          </Routes>
        </Router>
      </main>
    </>
  );
}

export default App;
