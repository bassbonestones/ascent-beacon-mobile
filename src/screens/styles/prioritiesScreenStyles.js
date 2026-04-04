// Re-export all styles from split files
import {
  baseStyles,
  headerStyles,
  cardStyles,
  buttonStyles,
} from "./prioritiesBaseStyles";
import {
  formStyles,
  valuesStyles,
  modalStyles,
  reviewStyles,
  SCOPES,
  SCORE_OPTIONS,
} from "./prioritiesFormStyles";

// Combine all styles into single styles object for backward compatibility
export const styles = {
  ...baseStyles,
  ...headerStyles,
  ...cardStyles,
  ...buttonStyles,
  ...formStyles,
  ...valuesStyles,
  ...modalStyles,
  ...reviewStyles,
};

export { SCOPES, SCORE_OPTIONS };
