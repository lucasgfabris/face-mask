import { useState, useRef, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import { registerUser } from '../services/api';
import LoadingSpinner from './LoadingSpinner';

type RegisterStatus = 'idle' | 'loading' | 'detecting' | 'success' | 'error';

function FaceRegister() {
  const [registerStatus, setRegisterStatus] = useState<RegisterStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [modelsLoaded, setModelsLoaded] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  
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
      const MODEL_URL = '/models';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      setModelsLoaded(true);
    } catch (error) {
      console.error('Erro ao carregar modelos:', error);
      setErrorMessage('Erro ao carregar modelos de IA. Verifique a pasta /public/models');
      setRegisterStatus('error');
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (error) {
      console.error('Erro ao acessar câmera:', error);
      setErrorMessage('Não foi possível acessar a câmera. Verifique as permissões.');
      setRegisterStatus('error');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleRegister = async () => {
    if (!modelsLoaded) {
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

    await startCamera();

    setTimeout(() => {
      captureFace();
    }, 1000);
  };

  const captureFace = async () => {
    if (!videoRef.current) return;

    setRegisterStatus('detecting');

    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setErrorMessage('Nenhum rosto detectado. Posicione-se na frente da câmera.');
        setRegisterStatus('error');
        stopCamera();
        return;
      }

      if (canvasRef.current && videoRef.current) {
        const displaySize = {
          width: videoRef.current.width,
          height: videoRef.current.height,
        };
        faceapi.matchDimensions(canvasRef.current, displaySize);
        const resizedDetection = faceapi.resizeResults(detection, displaySize);
        
        const context = canvasRef.current.getContext('2d');
        if (context) {
          context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          faceapi.draw.drawDetections(canvasRef.current, resizedDetection);
          faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetection);
        }
      }

      const faceDescriptor = Array.from(detection.descriptor);

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
    setUserName('');
    setUserEmail('');
    stopCamera();
  };

  return (
    <div className="space-y-6">
      {registerStatus === 'idle' && (
        <div className="space-y-4">
          <div>
            <label htmlFor="registerUserName" className="block text-sm font-medium text-gray-700 mb-2">
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
              className="w-full h-auto"
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full"
            />
          </div>

          <div className="flex items-center justify-center gap-3 text-primary">
            <LoadingSpinner />
            <span className="font-medium">
              {registerStatus === 'loading' ? 'Iniciando câmera...' : 'Capturando rosto...'}
            </span>
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
            onClick={resetRegister}
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
