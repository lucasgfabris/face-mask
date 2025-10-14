import * as faceapi from 'face-api.js';

export interface FaceQualityResult {
  isGood: boolean;
  message: string;
}

export interface FaceDetectionCallbacks {
  onFeedback: (message: string) => void;
  onSuccess: (descriptor: number[]) => Promise<void>;
  onError: (error: string) => void;
}

export class FaceDetectionService {
  private detectionInterval: number | null = null;
  private isCapturing = false;
  private modelsLoaded = false;
  private previousLandmarks: faceapi.FaceLandmarks68 | null = null;
  private movementDetected = false;
  private blinkDetected = false;
  private previousEyeAspectRatio = 0;

  async loadModels(): Promise<void> {
    if (this.modelsLoaded) return;

    try {
      const MODEL_URL = '/models';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      this.modelsLoaded = true;
    } catch (error) {
      console.error('Erro ao carregar modelos:', error);
      throw new Error('Erro ao carregar modelos de IA. Verifique a pasta /public/models');
    }
  }

  isModelsLoaded(): boolean {
    return this.modelsLoaded;
  }

  async startCamera(videoElement: HTMLVideoElement): Promise<MediaStream> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
      });

      videoElement.srcObject = stream;

      // Aguardar o vídeo carregar
      await new Promise<void>((resolve) => {
        videoElement.onloadedmetadata = () => {
          videoElement
            .play()
            .then(() => {
              resolve();
            })
            .catch(() => {
              resolve();
            });
        };
      });

      return stream;
    } catch (error) {
      console.error('Erro ao acessar câmera:', error);
      throw new Error('Não foi possível acessar a câmera. Verifique as permissões.');
    }
  }

  stopCamera(stream: MediaStream | null, videoElement: HTMLVideoElement | null): void {
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
      this.detectionInterval = null;
    }

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    if (videoElement) {
      videoElement.srcObject = null;
    }
  }

  analyzeFaceQuality(
    detection: faceapi.WithFaceDescriptor<
      faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }>
    >,
    videoWidth: number,
    videoHeight: number
  ): FaceQualityResult {
    const box = detection.detection.box;

    // Calcular área do rosto em relação ao frame
    const faceArea = box.width * box.height;
    const frameArea = videoWidth * videoHeight;
    const faceRatio = faceArea / frameArea;

    // Verificar se o rosto está muito pequeno (longe)
    if (faceRatio < 0.08) {
      return { isGood: false, message: 'Aproxime-se mais da câmera' };
    }

    // Verificar se o rosto está muito grande (perto)
    if (faceRatio > 0.5) {
      return { isGood: false, message: 'Afaste-se um pouco da câmera' };
    }

    // Verificar centralização horizontal
    const faceCenterX = box.x + box.width / 2;
    const frameCenterX = videoWidth / 2;
    const horizontalOffset = Math.abs(faceCenterX - frameCenterX);

    if (horizontalOffset > videoWidth * 0.25) {
      if (faceCenterX < frameCenterX) {
        return { isGood: false, message: 'Mova-se para a direita' };
      } else {
        return { isGood: false, message: 'Mova-se para a esquerda' };
      }
    }

    // Verificar centralização vertical
    const faceCenterY = box.y + box.height / 2;
    const frameCenterY = videoHeight / 2;
    const verticalOffset = Math.abs(faceCenterY - frameCenterY);

    if (verticalOffset > videoHeight * 0.2) {
      if (faceCenterY < frameCenterY) {
        return { isGood: false, message: 'Mova-se para baixo' };
      } else {
        return { isGood: false, message: 'Mova-se para cima' };
      }
    }

    // Verificar se o rosto está de frente usando landmarks
    const landmarks = detection.landmarks;
    const nose = landmarks.getNose();
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();

    // Calcular distâncias dos olhos ao nariz para verificar rotação
    const noseCenter = nose[3]; // Ponta do nariz
    const leftEyeCenter = leftEye[0];
    const rightEyeCenter = rightEye[3];

    const leftDistance = Math.abs(noseCenter.x - leftEyeCenter.x);
    const rightDistance = Math.abs(noseCenter.x - rightEyeCenter.x);
    const distanceRatio =
      Math.abs(leftDistance - rightDistance) / Math.max(leftDistance, rightDistance);

    if (distanceRatio > 0.4) {
      return { isGood: false, message: 'Olhe diretamente para a câmera' };
    }

    // Verificar confiança da detecção
    if (detection.detection.score < 0.65) {
      return { isGood: false, message: 'Melhore a iluminação' };
    }

    // Verificar qualidade dos landmarks - usar as variáveis já declaradas acima
    const mouth = landmarks.getMouth();

    // Verificar se os pontos estão claramente visíveis (distância mínima)
    const eyeDistance = Math.sqrt(
      Math.pow(rightEye[0].x - leftEye[0].x, 2) + Math.pow(rightEye[0].y - leftEye[0].y, 2)
    );

    if (eyeDistance < 30) {
      return { isGood: false, message: 'Aproxime-se mais da câmera' };
    }

    // Verificar que o rosto não está muito inclinado verticalmente
    const eyeCenterY = (leftEye[0].y + rightEye[0].y) / 2;
    const noseY = nose[3].y;
    const mouthCenterY = (mouth[0].y + mouth[6].y) / 2;

    const eyeNoseDistance = Math.abs(noseY - eyeCenterY);
    const noseMouthDistance = Math.abs(mouthCenterY - noseY);
    const verticalRatio =
      Math.abs(eyeNoseDistance - noseMouthDistance) / Math.max(eyeNoseDistance, noseMouthDistance);

    if (verticalRatio > 0.5) {
      return { isGood: false, message: 'Mantenha o rosto reto (não incline)' };
    }

    // Anti-spoofing: Detectar movimento e piscada (apenas avisar, não bloquear)
    this.detectMovement(landmarks);
    this.detectBlink(landmarks);

    return { isGood: true, message: 'Posição perfeita! Processando...' };
  }

  startContinuousDetection(
    videoElement: HTMLVideoElement,
    callbacks: FaceDetectionCallbacks
  ): void {
    this.isCapturing = false;

    this.detectionInterval = window.setInterval(async () => {
      if (!videoElement || this.isCapturing) return;

      try {
        const detection = await faceapi
          .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (!detection) {
          callbacks.onFeedback('Nenhum rosto detectado');
          return;
        }

        const quality = this.analyzeFaceQuality(
          detection,
          videoElement.videoWidth || 640,
          videoElement.videoHeight || 480
        );

        callbacks.onFeedback(quality.message);

        if (quality.isGood && !this.isCapturing) {
          this.isCapturing = true;
          const faceDescriptor = Array.from(detection.descriptor);
          await callbacks.onSuccess(faceDescriptor);
        }
      } catch (error) {
        console.error('Erro na detecção contínua:', error);
        callbacks.onError('Erro ao processar detecção facial');
      }
    }, 500);
  }

  stopDetection(): void {
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
      this.detectionInterval = null;
    }
    this.isCapturing = false;
    this.previousLandmarks = null;
    this.movementDetected = false;
    this.blinkDetected = false;
    this.previousEyeAspectRatio = 0;
  }

  /**
   * Calcula o Eye Aspect Ratio (EAR) para detectar piscadas
   */
  private calculateEyeAspectRatio(eye: faceapi.Point[]): number {
    // Distâncias verticais
    const verticalDist1 = Math.sqrt(
      Math.pow(eye[1].x - eye[5].x, 2) + Math.pow(eye[1].y - eye[5].y, 2)
    );
    const verticalDist2 = Math.sqrt(
      Math.pow(eye[2].x - eye[4].x, 2) + Math.pow(eye[2].y - eye[4].y, 2)
    );

    // Distância horizontal
    const horizontalDist = Math.sqrt(
      Math.pow(eye[0].x - eye[3].x, 2) + Math.pow(eye[0].y - eye[3].y, 2)
    );

    return (verticalDist1 + verticalDist2) / (2.0 * horizontalDist);
  }

  /**
   * Detecta movimento comparando landmarks atuais com anteriores
   */
  private detectMovement(currentLandmarks: faceapi.FaceLandmarks68): boolean {
    if (!this.previousLandmarks) {
      this.previousLandmarks = currentLandmarks;
      return false;
    }

    const currentNose = currentLandmarks.getNose()[3];
    const previousNose = this.previousLandmarks.getNose()[3];

    const movement = Math.sqrt(
      Math.pow(currentNose.x - previousNose.x, 2) + Math.pow(currentNose.y - previousNose.y, 2)
    );

    this.previousLandmarks = currentLandmarks;

    // Movimento significativo detectado (mas não muito grande)
    if (movement > 5 && movement < 30) {
      this.movementDetected = true;
      return true;
    }

    return this.movementDetected;
  }

  /**
   * Detecta piscadas usando Eye Aspect Ratio
   */
  private detectBlink(landmarks: faceapi.FaceLandmarks68): boolean {
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();

    const leftEAR = this.calculateEyeAspectRatio(leftEye);
    const rightEAR = this.calculateEyeAspectRatio(rightEye);
    const avgEAR = (leftEAR + rightEAR) / 2.0;

    // Threshold para detectar olho fechado
    const EAR_THRESHOLD = 0.2;

    // Se o EAR caiu significativamente, detectou piscada
    if (this.previousEyeAspectRatio > EAR_THRESHOLD && avgEAR < EAR_THRESHOLD) {
      this.blinkDetected = true;
    }

    this.previousEyeAspectRatio = avgEAR;

    return this.blinkDetected;
  }
}

// Singleton instance
export const faceDetectionService = new FaceDetectionService();
