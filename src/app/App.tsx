import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ProtectedRoutes } from './routes';
import Header from '../shared/components/header/header';
function App() {
  return (
    <div className="flex flex-col h-screen p-4">
      <Header />
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
