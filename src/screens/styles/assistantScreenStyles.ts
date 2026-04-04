// Re-export all styles from split files
import {
  baseStyles,
  symbolStyles,
  modelStyles,
  cardStyles,
  buttonStyles,
} from "./assistantBaseStyles";
import { proposedStyles, chatStyles, inputStyles } from "./assistantChatStyles";

// Combine all styles into single styles object for backward compatibility
export const styles = {
  ...baseStyles,
  ...symbolStyles,
  ...modelStyles,
  ...cardStyles,
  ...buttonStyles,
  ...proposedStyles,
  ...chatStyles,
  ...inputStyles,
};
