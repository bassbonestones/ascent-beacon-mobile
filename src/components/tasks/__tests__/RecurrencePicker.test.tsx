import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { RecurrencePicker } from "../RecurrencePicker";

describe("RecurrencePicker", () => {
  const defaultProps = {
    visible: true,
    initialRRule: "",
    initialSchedulingMode: null as "floating" | "fixed" | null,
    initialStartDate: null as string | null,
    initialStartTime: null as string | null,
    onSave: jest.fn(),
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders when visible", () => {
      render(<RecurrencePicker {...defaultProps} />);
      expect(screen.getByText("Repeats Every")).toBeTruthy();
    });

    it("does not display content when not visible", () => {
      render(<RecurrencePicker {...defaultProps} visible={false} />);
      expect(screen.queryByText("Repeats Every")).toBeNull();
    });

    it("shows frequency options", () => {
      render(<RecurrencePicker {...defaultProps} />);
      expect(screen.getByLabelText("Day")).toBeTruthy();
      expect(screen.getByLabelText("Week")).toBeTruthy();
      expect(screen.getByLabelText("Month")).toBeTruthy();
      expect(screen.getByLabelText("Year")).toBeTruthy();
    });

    it("shows interval input", () => {
      render(<RecurrencePicker {...defaultProps} />);
      // "Repeats Every" title contains the interval input
      expect(screen.getByLabelText("Interval number")).toBeTruthy();
    });

    it("shows cancel and save buttons", () => {
      render(<RecurrencePicker {...defaultProps} />);
      expect(screen.getByText("Cancel")).toBeTruthy();
      expect(screen.getByText("Save")).toBeTruthy();
    });
  });

  describe("frequency selection", () => {
    it("selects Day frequency by default", () => {
      render(<RecurrencePicker {...defaultProps} />);
      // Day should be selected by default
      expect(screen.getByText("Day")).toBeTruthy();
    });

    it("changes frequency when Week pressed", () => {
      render(<RecurrencePicker {...defaultProps} />);
      fireEvent.press(screen.getByLabelText("Week"));
      // Should now show "On days" section
      expect(screen.getByText("On days")).toBeTruthy();
    });

    it("shows days of week for weekly frequency", () => {
      render(<RecurrencePicker {...defaultProps} />);
      fireEvent.press(screen.getByLabelText("Week"));
      expect(screen.getByLabelText("Mon")).toBeTruthy();
      expect(screen.getByLabelText("Tue")).toBeTruthy();
      expect(screen.getByLabelText("Wed")).toBeTruthy();
      expect(screen.getByLabelText("Thu")).toBeTruthy();
      expect(screen.getByLabelText("Fri")).toBeTruthy();
      expect(screen.getByLabelText("Sat")).toBeTruthy();
      expect(screen.getByLabelText("Sun")).toBeTruthy();
    });

    it("hides days of week for daily frequency", () => {
      render(<RecurrencePicker {...defaultProps} />);
      fireEvent.press(screen.getByLabelText("Day"));
      expect(screen.queryByText("On days")).toBeNull();
    });
  });

  describe("interval", () => {
    it("shows interval input field", () => {
      render(<RecurrencePicker {...defaultProps} />);
      expect(screen.getByLabelText("Interval number")).toBeTruthy();
    });

    it("updates interval when changed", () => {
      render(<RecurrencePicker {...defaultProps} />);
      const input = screen.getByLabelText("Interval number");
      fireEvent.changeText(input, "3");
      // Verify by saving and checking the rule
      fireEvent.press(screen.getByText("Save"));
      const [rule] = defaultProps.onSave.mock.calls[0];
      expect(rule).toContain("INTERVAL=3");
    });

    it("shows plural label on button when interval > 1", () => {
      render(<RecurrencePicker {...defaultProps} />);
      fireEvent.changeText(screen.getByLabelText("Interval number"), "2");
      // Buttons should now show plural form (capitalized)
      expect(screen.getByText("Days")).toBeTruthy();
    });
  });

  describe("scheduling mode", () => {
    it("shows scheduling mode options when time is set", () => {
      render(<RecurrencePicker {...defaultProps} initialStartTime="09:00" />);
      expect(screen.getByText("🌍 Time-of-day")).toBeTruthy();
      expect(screen.getByText("📍 Fixed time")).toBeTruthy();
    });

    it("hides scheduling mode when no time is set", () => {
      render(<RecurrencePicker {...defaultProps} />);
      expect(screen.queryByText("🌍 Time-of-day")).toBeNull();
      expect(screen.queryByText("📍 Fixed time")).toBeNull();
    });

    it("defaults to time-of-day (floating)", () => {
      render(<RecurrencePicker {...defaultProps} />);
      // Summary should show "Every day"
      expect(screen.getByText("Every day")).toBeTruthy();
    });
  });

  describe("end conditions", () => {
    it("shows end condition options", () => {
      render(<RecurrencePicker {...defaultProps} />);
      expect(screen.getByText("Ends")).toBeTruthy();
      expect(screen.getByText("Never")).toBeTruthy();
      expect(screen.getByText(/After.*times/)).toBeTruthy();
    });

    it("shows count input when After selected", () => {
      render(<RecurrencePicker {...defaultProps} />);
      fireEvent.press(screen.getByText(/After.*times/));
      expect(screen.getByLabelText("Number of occurrences")).toBeTruthy();
    });
  });

  describe("initialization from RRULE", () => {
    it("parses daily rule with interval correctly", () => {
      render(
        <RecurrencePicker
          {...defaultProps}
          initialRRule="FREQ=DAILY;INTERVAL=2"
        />,
      );
      // Verify by checking summary shows the interval
      expect(screen.getByText("Every 2 days")).toBeTruthy();
    });

    it("parses weekly rule and shows days section", () => {
      render(
        <RecurrencePicker
          {...defaultProps}
          initialRRule="FREQ=WEEKLY;BYDAY=MO,WE,FR"
        />,
      );
      // Should show "On days" section for weekly
      expect(screen.getByText("On days")).toBeTruthy();
    });

    it("parses rule with count", () => {
      render(
        <RecurrencePicker
          {...defaultProps}
          initialRRule="FREQ=DAILY;COUNT=10"
        />,
      );
      // After option should be reflected in summary
      expect(screen.getByText("Every day, 10 times total")).toBeTruthy();
    });
  });

  describe("save and cancel", () => {
    it("calls onClose when cancel pressed", () => {
      render(<RecurrencePicker {...defaultProps} />);
      fireEvent.press(screen.getByText("Cancel"));
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it("calls onSave with generated rule when save pressed", () => {
      render(<RecurrencePicker {...defaultProps} />);
      fireEvent.press(screen.getByText("Save"));
      expect(defaultProps.onSave).toHaveBeenCalled();
      const [rule, mode] = defaultProps.onSave.mock.calls[0];
      expect(rule).toContain("FREQ=DAILY");
      expect(mode).toBe("floating");
    });

    it("includes interval in saved rule when > 1", () => {
      render(<RecurrencePicker {...defaultProps} />);
      fireEvent.changeText(screen.getByLabelText("Interval number"), "3");
      fireEvent.press(screen.getByText("Save"));
      const [rule] = defaultProps.onSave.mock.calls[0];
      expect(rule).toContain("INTERVAL=3");
    });

    it("includes days in weekly rule", () => {
      render(<RecurrencePicker {...defaultProps} />);
      fireEvent.press(screen.getByLabelText("Week"));
      fireEvent.press(screen.getByLabelText("Mon"));
      fireEvent.press(screen.getByLabelText("Wed"));
      fireEvent.press(screen.getByText("Save"));
      const [rule] = defaultProps.onSave.mock.calls[0];
      expect(rule).toContain("FREQ=WEEKLY");
      expect(rule).toContain("BYDAY=");
    });
  });

  describe("preview", () => {
    it("shows summary text", () => {
      render(<RecurrencePicker {...defaultProps} />);
      expect(screen.getByText("Summary:")).toBeTruthy();
      expect(screen.getByText("Every day")).toBeTruthy();
    });

    it("updates summary when frequency changes", () => {
      render(<RecurrencePicker {...defaultProps} />);
      fireEvent.press(screen.getByLabelText("Week"));
      expect(screen.getByText("Every week")).toBeTruthy();
    });
  });

  describe("intraday modes", () => {
    it("shows intraday mode options", () => {
      render(<RecurrencePicker {...defaultProps} />);
      expect(screen.getByText("Times per day")).toBeTruthy();
      expect(screen.getByText("One time")).toBeTruthy();
      expect(screen.getByText("X times/day")).toBeTruthy();
      expect(screen.getByText("Multiple times")).toBeTruthy();
      expect(screen.getByText("Every X min")).toBeTruthy();
      expect(screen.getByText("Flexible")).toBeTruthy();
    });

    it("shows anytime config when X times/day selected", () => {
      render(<RecurrencePicker {...defaultProps} />);
      fireEvent.press(screen.getByText("X times/day"));
      expect(screen.getByText("How many times per day?")).toBeTruthy();
    });

    it("shows specific times config when Multiple times selected", () => {
      render(<RecurrencePicker {...defaultProps} />);
      fireEvent.press(screen.getByText("Multiple times"));
      expect(screen.getByText("At these times:")).toBeTruthy();
      expect(screen.getByText("+ Add time")).toBeTruthy();
    });

    it("shows interval config when Every X min selected", () => {
      render(<RecurrencePicker {...defaultProps} />);
      fireEvent.press(screen.getByText("Every X min"));
      expect(screen.getByText("Every how many minutes?")).toBeTruthy();
      expect(screen.getByText("Between:")).toBeTruthy();
    });

    it("shows window config when Flexible selected", () => {
      render(<RecurrencePicker {...defaultProps} />);
      fireEvent.press(screen.getByText("Flexible"));
      expect(screen.getByText("Complete anytime between:")).toBeTruthy();
    });

    it("parses anytime mode from RRULE", () => {
      render(
        <RecurrencePicker
          {...defaultProps}
          initialRRule="FREQ=DAILY;X-INTRADAY=anytime;X-DAILYOCC=8"
        />,
      );
      expect(screen.getByText(/8x per day/)).toBeTruthy();
    });

    it("parses interval mode from RRULE", () => {
      render(
        <RecurrencePicker
          {...defaultProps}
          initialRRule="FREQ=DAILY;X-INTRADAY=interval;X-INTERVALMIN=45;X-WINSTART=10:00;X-WINEND=22:00"
        />,
      );
      expect(screen.getByText(/every 45min/)).toBeTruthy();
    });

    it("parses window mode from RRULE", () => {
      render(
        <RecurrencePicker
          {...defaultProps}
          initialRRule="FREQ=DAILY;X-INTRADAY=window;X-WINSTART=16:00;X-WINEND=19:00"
        />,
      );
      // Window mode should show in summary
      expect(screen.getByText(/4:00pm/)).toBeTruthy();
    });
  });
});
