import { useState } from 'react';
import FaceLogin from './components/FaceLogin';
import FaceRegister from './components/FaceRegister';

type ViewMode = 'login' | 'register';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('login');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-lg shadow-custom p-6 md:p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">Face Mask Auth</h1>
            <p className="text-gray-600">Sistema de autenticação facial seguro e escalável</p>
          </div>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setViewMode('login')}
              className={`flex-1 h-12 rounded-md font-medium transition-all duration-200 ${
                viewMode === 'login'
                  ? 'bg-secondary text-accent shadow-button'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              aria-label="Modo de login"
            >
              Login
            </button>
            <button
              onClick={() => setViewMode('register')}
              className={`flex-1 h-12 rounded-md font-medium transition-all duration-200 ${
                viewMode === 'register'
                  ? 'bg-secondary text-accent shadow-button'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              aria-label="Modo de registro"
            >
              Registrar
            </button>
          </div>

          {viewMode === 'login' ? <FaceLogin /> : <FaceRegister />}
        </div>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Sistema desenvolvido com React, TypeScript, Tailwind CSS e NestJS</p>
        </div>
      </div>
    </div>
  );
}

export default App;
