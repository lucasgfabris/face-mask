import { Injectable } from '@nestjs/common';

@Injectable()
export class FaceRecognitionService {
  private readonly MATCH_THRESHOLD = 0.6;

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

  findMatchingFace(
    targetDescriptor: number[],
    knownDescriptors: number[][],
  ): number {
    let bestMatchIndex = -1;
    let bestDistance = Infinity;

    for (let i = 0; i < knownDescriptors.length; i++) {
      const distance = this.euclideanDistance(
        targetDescriptor,
        knownDescriptors[i],
      );

      if (distance < bestDistance && distance < this.MATCH_THRESHOLD) {
        bestDistance = distance;
        bestMatchIndex = i;
      }
    }

    return bestMatchIndex;
  }
}
