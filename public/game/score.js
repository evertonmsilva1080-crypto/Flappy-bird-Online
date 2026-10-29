export function createScore() {
  return {
    value: 0,
    addPoint() {
      this.value += 1;
    },
  };
}
