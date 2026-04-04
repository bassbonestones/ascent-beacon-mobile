import React from "react";
import PropTypes from "prop-types";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { styles } from "../../screens/styles/loginScreenStyles";

/**
 * Verification code entry screen for magic link login.
 */
export default function VerifyCodeScreen({
  email,
  countdown,
  verificationCode,
  onChangeCode,
  onVerify,
  onResend,
  onCancel,
  loading,
  formatTime,
}) {
  return (
    <View style={styles.authContainer}>
      <Text style={styles.verifyTitle}>Check Your Email</Text>
      <Text style={styles.verifySubtitle}>We sent a 6-digit code to:</Text>
      <Text style={styles.verifyEmail}>{email}</Text>
      <Text style={styles.verifyInstructions}>
        Enter the code below. It expires in:
      </Text>
      <Text style={styles.countdown}>{formatTime(countdown)}</Text>

      <TextInput
        style={styles.codeInput}
        placeholder="000000"
        placeholderTextColor="#999"
        value={verificationCode}
        onChangeText={onChangeCode}
        keyboardType="number-pad"
        maxLength={6}
        autoFocus
        editable={!loading}
        accessibilityLabel="Verification code"
        accessibilityHint="Enter the 6-digit code sent to your email"
      />

      <TouchableOpacity
        style={[styles.button, styles.emailButton]}
        onPress={onVerify}
        disabled={loading || verificationCode.length !== 6}
        accessibilityLabel="Verify code"
        accessibilityRole="button"
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.emailButtonText}>Verify Code</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.resendButton]}
        onPress={onResend}
        disabled={loading || countdown > 270}
        accessibilityLabel="Resend verification code"
        accessibilityRole="button"
      >
        {loading ? (
          <ActivityIndicator color="#007AFF" />
        ) : (
          <Text style={styles.resendButtonText}>
            Resend Code {countdown > 270 && `(in ${countdown - 270}s)`}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.cancelButton]}
        onPress={onCancel}
        disabled={loading}
        accessibilityLabel="Back to login"
        accessibilityRole="button"
      >
        <Text style={styles.cancelButtonText}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
}

VerifyCodeScreen.propTypes = {
  email: PropTypes.string.isRequired,
  countdown: PropTypes.number.isRequired,
  verificationCode: PropTypes.string.isRequired,
  onChangeCode: PropTypes.func.isRequired,
  onVerify: PropTypes.func.isRequired,
  onResend: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  formatTime: PropTypes.func.isRequired,
};
