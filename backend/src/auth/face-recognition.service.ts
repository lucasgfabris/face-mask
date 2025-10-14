import { Injectable } from '@nestjs/common';

@Injectable()
export class FaceRecognitionService {
  private readonly MATCH_THRESHOLD = 0.45;

  euclideanDistance(descriptor1: number[], descriptor2: number[]): number {
    if (descriptor1.length !== descriptor2.length) {
      throw new Error('Descritores devem ter o mesmo tamanho');
    }

    let sum = 0;
    for (let i = 0; i < descriptor1.length; i++) {
      const diff = descriptor1[i] - descriptor2[i];
      sum += diff * diff;
    }

    return Math.sqrt(sum);
  }

  compareFaces(descriptor1: number[], descriptor2: number[]): boolean {
    const distance = this.euclideanDistance(descriptor1, descriptor2);
    return distance < this.MATCH_THRESHOLD;
  }

  findMatchingFace(targetDescriptor: number[], knownDescriptors: number[][]): number {
    let bestMatchIndex = -1;
    let bestDistance = Infinity;

    for (let i = 0; i < knownDescriptors.length; i++) {
      const distance = this.euclideanDistance(targetDescriptor, knownDescriptors[i]);

      if (distance < bestDistance && distance < this.MATCH_THRESHOLD) {
        bestDistance = distance;
        bestMatchIndex = i;
      }
    }

    return bestMatchIndex;
  }

  /**
   * Calcula a média de múltiplos descritores faciais
   * Isso melhora a precisão ao registrar várias poses da mesma pessoa
   */
  averageDescriptors(descriptors: number[][]): number[] {
    if (descriptors.length === 0) {
      throw new Error('Nenhum descritor fornecido');
    }

    const descriptorLength = descriptors[0].length;
    const avgDescriptor: number[] = new Array(descriptorLength).fill(0);

    // Soma todos os descritores
    for (const descriptor of descriptors) {
      if (descriptor.length !== descriptorLength) {
        throw new Error('Todos os descritores devem ter o mesmo tamanho');
      }
      for (let i = 0; i < descriptorLength; i++) {
        avgDescriptor[i] += descriptor[i];
      }
    }

    // Calcula a média
    for (let i = 0; i < descriptorLength; i++) {
      avgDescriptor[i] /= descriptors.length;
    }

    return avgDescriptor;
  }

  /**
   * Valida a consistência de múltiplos descritores
   * Verifica se todos pertencem à mesma pessoa
   */
  validateDescriptorConsistency(descriptors: number[][]): { isValid: boolean; message: string } {
    if (descriptors.length < 3) {
      return {
        isValid: false,
        message: 'São necessários pelo menos 3 capturas faciais',
      };
    }

    // Verificar se todos os descritores são similares entre si
    const maxInternalDistance = 0.4; // Threshold interno mais restritivo

    for (let i = 0; i < descriptors.length; i++) {
      for (let j = i + 1; j < descriptors.length; j++) {
        const distance = this.euclideanDistance(descriptors[i], descriptors[j]);
        
        if (distance > maxInternalDistance) {
          return {
            isValid: false,
            message: `Inconsistência detectada entre as capturas. Por favor, tente novamente em condições similares de iluminação e posição.`,
          };
        }
      }
    }

    return {
      isValid: true,
      message: 'Descritores validados com sucesso',
    };
  }
}
