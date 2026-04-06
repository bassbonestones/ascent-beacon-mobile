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
} from "react-native";
import TermsModal from "../components/TermsModal";
import VerifyCodeScreen from "../components/login/VerifyCodeScreen";
import AuthOptions from "../components/login/AuthOptions";
import useKiteAnimation from "../hooks/useKiteAnimation";
import useLoginAuth from "../hooks/useLoginAuth";
import { styles } from "./styles/loginScreenStyles";

const AnimatedImage = Animated.createAnimatedComponent(Image);

const kiteSprites = {
  vertical: require("../../assets/kite_vertical.png"),
  slightLeft: require("../../assets/kite_slight_left.png"),
  fullLeft: require("../../assets/kite_full_left.png"),
  slightRight: require("../../assets/kite_slight_right.png"),
  fullRight: require("../../assets/kite_full_right.png"),
};

export default function LoginScreen({ onLoginSuccess }) {
  const kite = useKiteAnimation();
  const auth = useLoginAuth(onLoginSuccess);

  return (
    <ImageBackground
      source={require("../../assets/login-background.png")}
      style={styles.background}
      resizeMode="cover"
    >
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
          source={kiteSprites[kite.kiteSprite]}
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
        <View style={styles.content}>
          {/* Logo/Title Area */}
          <View style={styles.header}>
            <TouchableOpacity onPress={auth.handleTitleTap} activeOpacity={0.8}>
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
    </ImageBackground>
  );
}
