export function fibonacciSphere(index: number, count: number) {
  const phi = Math.PI * (Math.sqrt(5) - 1);
  const y = 1 - (index / Math.max(count - 1, 1)) * 2;
  const radius = Math.sqrt(1 - y * y);
  const theta = phi * index;

  return {
    lat: Math.asin(y) * (180 / Math.PI),
    lng: Math.atan2(Math.sin(theta) * radius, Math.cos(theta) * radius) * (180 / Math.PI)
  };
}
