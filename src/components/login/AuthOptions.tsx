import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { styles } from "../../screens/styles/loginScreenStyles";

interface AuthOptionsProps {
  email: string;
  onChangeEmail: (email: string) => void;
  showEmailInput: boolean;
  onEmailRequest: () => void;
  onGooglePress: () => void;
  onShowTerms: () => void;
  loading: boolean;
  googleRequestReady: boolean;
}

/**
 * Auth options with Google sign-in and email magic link.
 */
export default function AuthOptions({
  email,
  onChangeEmail,
  showEmailInput,
  onEmailRequest,
  onGooglePress,
  onShowTerms,
  loading,
  googleRequestReady,
}: AuthOptionsProps): React.JSX.Element {
  return (
    <View style={styles.authContainer}>
      {/* Google Sign-In */}
      <TouchableOpacity
        style={[styles.button, styles.googleButton]}
        onPress={onGooglePress}
        disabled={!googleRequestReady || loading}
        accessibilityLabel="Continue with Google"
        accessibilityRole="button"
      >
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.googleButtonText}>Continue with Google</Text>
        )}
      </TouchableOpacity>

      {/* Divider */}
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Email Magic Link */}
      <View style={styles.emailContainer}>
        {showEmailInput && (
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={onChangeEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
            autoFocus
            accessibilityLabel="Email address"
            accessibilityHint="Enter your email to receive a login code"
          />
        )}

        <TouchableOpacity
          style={[styles.button, styles.emailButton]}
          onPress={onEmailRequest}
          disabled={loading}
          accessibilityLabel={
            showEmailInput ? "Send verification code" : "Log in with code"
          }
          accessibilityRole="button"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.emailButtonText}>
              {showEmailInput ? "Send Code" : "Log In with Code"}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Terms Disclaimer */}
      <View style={styles.disclaimerContainer}>
        <Text style={styles.disclaimerText}>
          By logging in, you agree to our{" "}
          <Text style={styles.disclaimerLink} onPress={onShowTerms}>
            Terms & Conditions
          </Text>
          .
        </Text>
      </View>
    </View>
  );
}
