import { styles } from "../goalsScreenStyles";

describe("goalsScreenStyles", () => {
  it("exports styles object", () => {
    expect(styles).toBeDefined();
  });

  it("has required style properties", () => {
    expect(styles.container).toBeDefined();
    expect(styles.header).toBeDefined();
    expect(styles.headerTitle).toBeDefined();
  });
});
