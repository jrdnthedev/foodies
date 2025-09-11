import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ProtectedRoutes } from './routes';
import Header from '../shared/components/header/header';
import VendorProfile from '../domains/vendor/ui/profile/profile';
import { Suspense } from 'react';
import LoadingStencil from '../shared/components/loading-stencil/loading-stencil';
import ErrorBoundary from '../shared/components/error-boundary/error-boundary';

function App() {
  return (
    <div className="flex flex-col h-screen p-4 gap-4">
      <ErrorBoundary>
        <Suspense fallback={<LoadingStencil />}>
          <Router>
            <Header />
            <main>
              <Routes>
                {ProtectedRoutes.map((route, index) => (
                  <Route key={index} path={route.path} element={route.element} />
                ))}
                <Route path="/vendor/:vendorId" element={<VendorProfile />} />
              </Routes>
            </main>
          </Router>
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

export default App;
