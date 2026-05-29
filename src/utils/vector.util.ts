export const euclideanDistance = (a: number[], b: number[]) => {
  return Math.sqrt(
    a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0)
  );
};

export const isMatch = (input: number[], stored: number[][], threshold = 0.6) => {
  return stored.some(vec => euclideanDistance(input, vec) < threshold);
};
