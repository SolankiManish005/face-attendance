import { logger } from "@/pkg/logger/logger";
import "@tensorflow/tfjs-backend-cpu";
import * as tf from "@tensorflow/tfjs-core";
import * as faceapi from "@vladmandic/face-api/dist/face-api.esm-nobundle.js";
import { Canvas, Image, ImageData, loadImage } from "canvas";

export type FaceApiDescriptor = {
  descriptor: Float32Array;
  toString: () => string;
};

export class FaceApi {
  private modelsPath: string;
  private booted = false;

  constructor(modelsPath: string) {
    this.modelsPath = modelsPath;
  }

  public async boot() {
    if (this.booted) {
      return;
    }

    this.booted = true;
    await tf.setBackend("cpu");
    await tf.ready();
    faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

    await faceapi.nets.faceRecognitionNet.loadFromDisk(this.modelsPath);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(this.modelsPath);
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(this.modelsPath);
  }

  public async transformToDescriptor(file: string | File): Promise<FaceApiDescriptor | null> {
    const image = await loadImage(
      typeof file === "string" ? file : Buffer.from(await file.arrayBuffer()),
    );
    const detections = await faceapi
      .detectAllFaces(image)
      .withFaceLandmarks()
      .withFaceDescriptors();

    if (!detections.length) {
      return null;
    }

    const descriptor = detections[0]?.descriptor!;

    return {
      descriptor,
      toString: () => JSON.stringify(descriptor),
    };
  }

  public loadFromString(descriptorString: string): FaceApiDescriptor {
    return {
      descriptor: Float32Array.from(Object.values(JSON.parse(descriptorString))),
      toString: () => descriptorString,
    };
  }

  public labelFaceDescriptors(
    label: string,
    descriptors: FaceApiDescriptor[],
  ): faceapi.LabeledFaceDescriptors {
    const labeledDescriptors = descriptors.map((descriptor) => descriptor.descriptor);

    return new faceapi.LabeledFaceDescriptors(label, labeledDescriptors);
  }

  public labelFaceDescriptorsToString(lfd: faceapi.LabeledFaceDescriptors): string {
    return JSON.stringify(lfd.toJSON());
  }

  public loadLabeledFaceDescriptorsFromString(
    string: string | null,
  ): faceapi.LabeledFaceDescriptors {
    return faceapi.LabeledFaceDescriptors.fromJSON(JSON.parse(string ?? ""));
  }

  private getFaceMatcher(
    labeledDescriptors: faceapi.LabeledFaceDescriptors[],
    distanceThreshold: number,
  ) {
    return new faceapi.FaceMatcher(labeledDescriptors, distanceThreshold);
  }

  public match({
    faceDescriptors,
    labeledDescriptors,
    distanceThreshold = 0.6,
  }: {
    faceDescriptors: Float32Array;
    labeledDescriptors: faceapi.LabeledFaceDescriptors[];
    distanceThreshold?: number;
  }) {
    const faceMatcher = this.getFaceMatcher(labeledDescriptors, distanceThreshold);

    return faceMatcher.findBestMatch(faceDescriptors);
  }
}

const faceApi = new FaceApi("./face-api/models");
try {
  await faceApi.boot();
  logger.info("Face api booted successfully");
} catch (error) {
  logger.error("Failed to boot face api", error);
  throw error;
}

export { faceApi };
