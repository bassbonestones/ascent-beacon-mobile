// Re-export all styles from split files
import {
  baseStyles,
  headerStyles,
  cardStyles,
  infoStyles,
  buttonStyles,
} from "./valuesBaseStyles";
import { formStyles, modalStyles, editStyles } from "./valuesFormStyles";

// Combine all styles into single styles object for backward compatibility
export const styles = {
  ...baseStyles,
  ...headerStyles,
  ...cardStyles,
  ...infoStyles,
  ...buttonStyles,
  ...formStyles,
  ...modalStyles,
  ...editStyles,
};
