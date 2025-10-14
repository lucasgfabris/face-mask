import { useState, useRef, useEffect } from 'react';
import { authenticateUser, checkUserExists } from '../services/api';
import { faceDetectionService } from '../services/face-detection.service';
import LoadingSpinner from './LoadingSpinner';

type LoginStatus = 'idle' | 'validating' | 'loading' | 'detecting' | 'success' | 'error';

function FaceLogin() {
  const [loginStatus, setLoginStatus] = useState<LoginStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [modelsLoaded, setModelsLoaded] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>('');
  const [authenticatedUser, setAuthenticatedUser] = useState<string>('');
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    loadModels();
    return () => {
      stopCamera();
    };
  }, []);

  const loadModels = async () => {
    try {
      await faceDetectionService.loadModels();
      setModelsLoaded(true);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro ao carregar modelos';
      setErrorMessage(errorMsg);
      setLoginStatus('error');
    }
  };

  const startCamera = async () => {
    if (!videoRef.current) return;

    try {
      const stream = await faceDetectionService.startCamera(videoRef.current);
      streamRef.current = stream;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro ao acessar câmera';
      setErrorMessage(errorMsg);
      setLoginStatus('error');
    }
  };

  const stopCamera = () => {
    faceDetectionService.stopDetection();
    faceDetectionService.stopCamera(streamRef.current, videoRef.current);
    streamRef.current = null;
  };

  const handleLogin = async () => {
    if (!faceDetectionService.isModelsLoaded()) {
      setErrorMessage('Modelos ainda não foram carregados. Aguarde...');
      return;
    }

    if (!userName.trim()) {
      setErrorMessage('Por favor, digite seu nome de usuário');
      return;
    }

    setLoginStatus('validating');
    setErrorMessage('');

    // Validar se o usuário existe antes de iniciar a câmera
    const userCheck = await checkUserExists(userName);

    if (!userCheck.exists) {
      setErrorMessage(
        userCheck.message ||
          'Usuário não encontrado. Verifique o nome de usuário e tente novamente.'
      );
      setLoginStatus('error');
      return;
    }

    setLoginStatus('loading');

    // Aguardar o React renderizar o elemento de vídeo
    setTimeout(async () => {
      try {
        await startCamera();

        setTimeout(() => {
          startContinuousDetection();
        }, 1000);
      } catch (error) {
        console.error('Erro ao iniciar câmera:', error);
      }
    }, 100);
  };

  const startContinuousDetection = () => {
    if (!videoRef.current) return;

    setLoginStatus('detecting');

    faceDetectionService.startContinuousDetection(videoRef.current, {
      onFeedback: (message: string) => {
        setFeedbackMessage(message);
      },
      onSuccess: async (faceDescriptor: number[]) => {
        await detectFace(faceDescriptor);
      },
      onError: (error: string) => {
        setErrorMessage(error);
        setLoginStatus('error');
        stopCamera();
      },
    });
  };

  const detectFace = async (faceDescriptor: number[]) => {
    try {
      const response = await authenticateUser(userName, faceDescriptor);

      if (response.success) {
        setLoginStatus('success');
        setAuthenticatedUser(response.userName || '');
        stopCamera();
      } else {
        setErrorMessage(response.message || 'Falha na autenticação');
        setLoginStatus('error');
        stopCamera();
      }
    } catch (error) {
      console.error('Erro na detecção:', error);
      setErrorMessage('Erro ao processar imagem facial');
      setLoginStatus('error');
      stopCamera();
    }
  };

  const resetLogin = () => {
    setLoginStatus('idle');
    setErrorMessage('');
    setAuthenticatedUser('');
    stopCamera();
  };

  return (
    <div className="space-y-6">
      {loginStatus === 'idle' && (
        <div className="space-y-4">
          <div>
            <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-2">
              Nome de Usuário
            </label>
            <input
              id="userName"
              type="text"
              value={userName}
              onChange={(event) => setUserName(event.target.value)}
              className="w-full h-12 px-4 border border-gray-200 rounded-md focus:border-primary focus:outline-none transition-all duration-200"
              placeholder="Digite seu nome de usuário"
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={!modelsLoaded}
            className="w-full h-12 bg-secondary text-accent font-medium rounded-md shadow-button transition-all duration-200 hover:bg-primary hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {modelsLoaded ? 'Iniciar Login Facial' : 'Carregando modelos...'}
          </button>
        </div>
      )}

      {loginStatus === 'validating' && (
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-3 text-primary py-8">
            <LoadingSpinner />
            <span className="font-medium">Validando usuário...</span>
          </div>
        </div>
      )}

      {(loginStatus === 'loading' || loginStatus === 'detecting') && (
        <div className="space-y-4">
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              muted
              width="640"
              height="480"
              className="w-full h-auto scale-x-[-1] blur-none"
            />
            <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-center gap-3 text-primary">
              <LoadingSpinner />
              <span className="font-medium">
                {loginStatus === 'loading' ? 'Iniciando câmera...' : 'Analisando posição...'}
              </span>
            </div>
            {feedbackMessage && loginStatus === 'detecting' && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-center">
                <p className="text-blue-900 font-medium text-lg">{feedbackMessage}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {loginStatus === 'success' && (
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-success">Login Realizado!</h3>
          <p className="text-gray-600">
            Bem-vindo de volta, <span className="font-semibold">{authenticatedUser}</span>!
          </p>
          <button
            onClick={resetLogin}
            className="w-full h-12 bg-gray-100 text-gray-700 font-medium rounded-md transition-all duration-200 hover:bg-gray-200"
          >
            Fazer Novo Login
          </button>
        </div>
      )}

      {loginStatus === 'error' && (
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex items-start gap-3">
              <svg
                className="w-6 h-6 text-error flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h4 className="font-semibold text-error mb-1">Erro no Login</h4>
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            </div>
          </div>

          <button
            onClick={resetLogin}
            className="w-full h-12 bg-secondary text-accent font-medium rounded-md shadow-button transition-all duration-200 hover:bg-primary hover:text-white"
          >
            Tentar Novamente
          </button>
        </div>
      )}
    </div>
  );
}

export default FaceLogin;
