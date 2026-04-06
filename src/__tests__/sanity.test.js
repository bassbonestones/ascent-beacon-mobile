// Simple sanity test
describe("sanity", () => {
  it("should pass basic test", () => {
    expect(1 + 1).toBe(2);
  });

  it("should handle async", async () => {
    const result = await Promise.resolve("hello");
    expect(result).toBe("hello");
  });
});
