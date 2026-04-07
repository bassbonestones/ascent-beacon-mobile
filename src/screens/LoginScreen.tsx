import React from "react";
import {
  View,
  Text,
  ImageBackground,
  Image,
  Animated,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ImageSourcePropType,
  useWindowDimensions,
} from "react-native";
import TermsModal from "../components/TermsModal";
import VerifyCodeScreen from "../components/login/VerifyCodeScreen";
import AuthOptions from "../components/login/AuthOptions";
import useKiteAnimation from "../hooks/useKiteAnimation";
import useLoginAuth from "../hooks/useLoginAuth";
import { styles } from "./styles/loginScreenStyles";
import type { User } from "../types";

const AnimatedImage = Animated.createAnimatedComponent(Image);

interface KiteSprites {
  vertical: ImageSourcePropType;
  slightLeft: ImageSourcePropType;
  fullLeft: ImageSourcePropType;
  slightRight: ImageSourcePropType;
  fullRight: ImageSourcePropType;
}

const kiteSprites: KiteSprites = {
  vertical: require("../../assets/kite_vertical.png") as ImageSourcePropType,
  slightLeft:
    require("../../assets/kite_slight_left.png") as ImageSourcePropType,
  fullLeft: require("../../assets/kite_full_left.png") as ImageSourcePropType,
  slightRight:
    require("../../assets/kite_slight_right.png") as ImageSourcePropType,
  fullRight: require("../../assets/kite_full_right.png") as ImageSourcePropType,
};

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

const IMAGE_ASPECT_RATIO = 1024 / 1536; // Actual image dimensions: 1024x1536 (2:3)

export default function LoginScreen({
  onLoginSuccess,
}: LoginScreenProps): React.ReactElement {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const kite = useKiteAnimation();
  const auth = useLoginAuth(onLoginSuccess);

  // Calculate image width based on screen height and aspect ratio
  const imageWidth = screenHeight * IMAGE_ASPECT_RATIO;
  // Content maxWidth = min(imageWidth, screenWidth)
  // The paddingHorizontal: 24 in styles.content handles the inset from edges
  const contentMaxWidth = Math.min(imageWidth, screenWidth);

  return (
    <View style={styles.background}>
      {/* Background image - stretched vertically, centered horizontally */}
      <View style={styles.backgroundImageContainer}>
        <Image
          source={
            require("../../assets/login-background.png") as ImageSourcePropType
          }
          style={[styles.backgroundImage, { width: imageWidth }]}
          resizeMode="stretch"
        />
      </View>
      <View style={styles.overlay} />

      {/* Kite animation zone */}
      <View
        style={styles.topZone}
        onStartShouldSetResponder={() => true}
        onResponderGrant={kite.handleTouchStart}
        onResponderMove={kite.handleTopZoneTouch}
        onResponderRelease={kite.handleTouchEnd}
        onResponderTerminate={kite.handleTouchEnd}
      >
        <AnimatedImage
          source={kiteSprites[kite.kiteSprite as keyof KiteSprites]}
          style={[
            styles.kiteImage,
            kite.kiteSprite === "slightLeft" ||
            kite.kiteSprite === "slightRight"
              ? { width: 51, height: 51 }
              : null,
            { transform: kite.kitePos.getTranslateTransform() },
          ]}
          resizeMode="contain"
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View
          style={[
            styles.content,
            { width: contentMaxWidth, alignSelf: "center" },
          ]}
        >
          {/* Logo/Title Area */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={auth.handleTitleTap}
              activeOpacity={0.8}
              accessibilityLabel="Ascent Beacon"
              accessibilityRole="button"
            >
              <Text style={styles.title}>Ascent Beacon</Text>
            </TouchableOpacity>
            <Text style={styles.subtitle}>
              Find your path. Lock your priorities.
            </Text>
          </View>

          {auth.showVerifyScreen ? (
            <VerifyCodeScreen
              email={auth.email}
              countdown={auth.countdown}
              verificationCode={auth.verificationCode}
              onChangeCode={auth.setVerificationCode}
              onVerify={auth.handleVerifyCode}
              onResend={auth.handleResendMagicLink}
              onCancel={auth.handleCancelVerify}
              loading={auth.loading}
              formatTime={auth.formatTime}
            />
          ) : (
            <AuthOptions
              email={auth.email}
              onChangeEmail={auth.setEmail}
              showEmailInput={auth.showEmailInput}
              onEmailRequest={auth.handleEmailRequest}
              onGooglePress={() => auth.promptAsync()}
              onShowTerms={() => auth.setShowTermsModal(true)}
              loading={auth.loading}
              googleRequestReady={!!auth.request}
            />
          )}
        </View>
      </KeyboardAvoidingView>

      <TermsModal
        visible={auth.showTermsModal}
        onClose={() => auth.setShowTermsModal(false)}
      />
    </View>
  );
}
