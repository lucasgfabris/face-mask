import { useState, useRef, useEffect } from 'react';
import { registerUser } from '../services/api';
import { faceDetectionService } from '../services/face-detection.service';
import LoadingSpinner from './LoadingSpinner';

type RegisterStatus = 'idle' | 'loading' | 'detecting' | 'success' | 'error';

function FaceRegister() {
  const [registerStatus, setRegisterStatus] = useState<RegisterStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [modelsLoaded, setModelsLoaded] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
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
      setRegisterStatus('error');
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
      setRegisterStatus('error');
    }
  };

  const stopCamera = () => {
    faceDetectionService.stopDetection();
    faceDetectionService.stopCamera(streamRef.current, videoRef.current);
    streamRef.current = null;
  };

  const handleRegister = async () => {
    if (!faceDetectionService.isModelsLoaded()) {
      setErrorMessage('Modelos ainda não foram carregados. Aguarde...');
      return;
    }

    if (!userName.trim()) {
      setErrorMessage('Por favor, digite seu nome de usuário');
      return;
    }

    if (!userEmail.trim()) {
      setErrorMessage('Por favor, digite seu e-mail');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      setErrorMessage('Por favor, digite um e-mail válido');
      return;
    }

    setRegisterStatus('loading');
    setErrorMessage('');

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

    setRegisterStatus('detecting');

    faceDetectionService.startContinuousDetection(videoRef.current, {
      onFeedback: (message: string) => {
        setFeedbackMessage(message);
      },
      onSuccess: async (faceDescriptor: number[]) => {
        await captureFace(faceDescriptor);
      },
      onError: (error: string) => {
        setErrorMessage(error);
        setRegisterStatus('error');
        stopCamera();
      },
    });
  };

  const captureFace = async (faceDescriptor: number[]) => {
    try {
      const response = await registerUser(userName, userEmail, faceDescriptor);

      if (response.success) {
        setRegisterStatus('success');
        stopCamera();
      } else {
        setErrorMessage(response.message || 'Falha no registro');
        setRegisterStatus('error');
        stopCamera();
      }
    } catch (error) {
      console.error('Erro na captura:', error);
      setErrorMessage('Erro ao processar imagem facial');
      setRegisterStatus('error');
      stopCamera();
    }
  };

  const resetRegister = () => {
    setRegisterStatus('idle');
    setErrorMessage('');
    stopCamera();
  };

  const clearForm = () => {
    setRegisterStatus('idle');
    setErrorMessage('');
    setUserName('');
    setUserEmail('');
    stopCamera();
  };

  return (
    <div className="space-y-6">
      {registerStatus === 'idle' && (
        <div className="space-y-4">
          <div>
            <label
              htmlFor="registerUserName"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Nome de Usuário
            </label>
            <input
              id="registerUserName"
              type="text"
              value={userName}
              onChange={(event) => setUserName(event.target.value)}
              className="w-full h-12 px-4 border border-gray-200 rounded-md focus:border-primary focus:outline-none transition-all duration-200"
              placeholder="Digite seu nome de usuário"
            />
          </div>

          <div>
            <label htmlFor="userEmail" className="block text-sm font-medium text-gray-700 mb-2">
              E-mail
            </label>
            <input
              id="userEmail"
              type="email"
              value={userEmail}
              onChange={(event) => setUserEmail(event.target.value)}
              className="w-full h-12 px-4 border border-gray-200 rounded-md focus:border-primary focus:outline-none transition-all duration-200"
              placeholder="Digite seu e-mail"
            />
          </div>

          <button
            onClick={handleRegister}
            disabled={!modelsLoaded}
            className="w-full h-12 bg-secondary text-accent font-medium rounded-md shadow-button transition-all duration-200 hover:bg-primary hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {modelsLoaded ? 'Registrar com Face' : 'Carregando modelos...'}
          </button>
        </div>
      )}

      {(registerStatus === 'loading' || registerStatus === 'detecting') && (
        <div className="space-y-4">
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              muted
              width="640"
              height="480"
              className="w-full h-auto scale-x-[-1] blur-md"
            />
            <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-center gap-3 text-primary">
              <LoadingSpinner />
              <span className="font-medium">
                {registerStatus === 'loading' ? 'Iniciando câmera...' : 'Analisando posição...'}
              </span>
            </div>
            {feedbackMessage && registerStatus === 'detecting' && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-center">
                <p className="text-blue-900 font-medium text-lg">{feedbackMessage}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {registerStatus === 'success' && (
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
          <h3 className="text-2xl font-bold text-success">Registro Concluído!</h3>
          <p className="text-gray-600">
            Usuário <span className="font-semibold">{userName}</span> registrado com sucesso!
          </p>
          <button
            onClick={clearForm}
            className="w-full h-12 bg-gray-100 text-gray-700 font-medium rounded-md transition-all duration-200 hover:bg-gray-200"
          >
            Registrar Novo Usuário
          </button>
        </div>
      )}

      {registerStatus === 'error' && (
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
                <h4 className="font-semibold text-error mb-1">Erro no Registro</h4>
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            </div>
          </div>

          <button
            onClick={resetRegister}
            className="w-full h-12 bg-secondary text-accent font-medium rounded-md shadow-button transition-all duration-200 hover:bg-primary hover:text-white"
          >
            Tentar Novamente
          </button>
        </div>
      )}
    </div>
  );
}

export default FaceRegister;
