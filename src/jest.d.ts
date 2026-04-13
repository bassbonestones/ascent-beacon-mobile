declare global {
  namespace jest {
    interface Matchers<R> {
      toBeOnTheScreen(): R;
    }
  }
}

export {};
