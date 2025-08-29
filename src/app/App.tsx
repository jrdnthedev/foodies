import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ProtectedRoutes } from './routes';
function App() {
  return (
    <div className="flex flex-col h-screen p-4">
      <nav>
        <ul>
          <li>
            <a href="/">Home</a>
          </li>
          <li>
            <a href="/vendor-dashboard">Dashboard</a>
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
    </div>
  );
}

export default App;
