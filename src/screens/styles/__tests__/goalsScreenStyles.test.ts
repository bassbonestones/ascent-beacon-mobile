import { styles } from "../goalsScreenStyles";

describe("goalsScreenStyles", () => {
  it("defines container with expected background and flex layout", () => {
    expect(styles.container).toMatchObject({
      flex: 1,
      backgroundColor: "#111827",
    });
  });

  it("defines header with centered row layout and divider", () => {
    expect(styles.header).toMatchObject({
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottomWidth: 1,
      borderBottomColor: "#1F2937",
    });
  });

  it("defines header title typography contract", () => {
    expect(styles.headerTitle).toMatchObject({
      fontSize: 18,
      fontWeight: "600",
      color: "#F9FAFB",
      textAlign: "center",
    });
  });
});
