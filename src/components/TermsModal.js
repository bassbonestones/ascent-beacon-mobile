import React from "react";
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

export default function TermsModal({ visible, onClose }) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Terms & Conditions</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Done</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
        >
          <Text style={styles.sectionTitle}>
            What Ascent Beacon: Priority Lock Is
          </Text>
          <Text style={styles.paragraph}>
            Ascent Beacon is a modular system that helps people understand,
            choose, and act on what matters — without forcing a single
            definition of success.
          </Text>
          <Text style={styles.paragraph}>
            We exist to help you remove clutter, slow down decision-making, and
            steer your life toward what matters most to you. Our goal is to help
            you feel like you are enough by aligning your goals and actions with
            your true values.
          </Text>

          <Text style={styles.sectionTitle}>What Problem This Solves</Text>
          <Text style={styles.paragraph}>
            Life is noisy, demanding, and full of competing expectations. The
            root problem is not a lack of effort — it is overcommitment and
            misalignment.
          </Text>
          <Text style={styles.paragraph}>
            We offer a different path forward: success defined not by hustle or
            performance, but by clarity, intention, and doing less of what
            doesn't matter.
          </Text>

          <Text style={styles.sectionTitle}>What We Promise</Text>
          <Text style={styles.paragraph}>
            Once you lock a priority, Ascent Beacon promises:
          </Text>
          <Text style={styles.bullet}>
            • Gentle, honest alignment feedback — never judgment
          </Text>
          <Text style={styles.bullet}>
            • Reflection that helps you see whether your priorities, values, and
            goals still make sense together
          </Text>
          <Text style={styles.bullet}>
            • Support for reassessment when friction, stress, or doubt arises
          </Text>
          <Text style={styles.bullet}>
            • A safe space to realign without guilt or shame
          </Text>

          <Text style={styles.sectionTitle}>What We Refuse to Do</Text>
          <Text style={styles.paragraph}>
            Ascent Beacon will never apply pressure through:
          </Text>
          <Text style={styles.bullet}>• Goal achievement enforcement</Text>
          <Text style={styles.bullet}>• Consistency or streak tracking</Text>
          <Text style={styles.bullet}>
            • Social comparison or public accountability
          </Text>
          <Text style={styles.bullet}>
            • Notifications, reminders, or nudges unless explicitly configured
            by you
          </Text>
          <Text style={styles.paragraph}>
            This app does not exist to push you harder. It exists to help you
            choose more honestly.
          </Text>

          <Text style={styles.sectionTitle}>Your Data & Privacy</Text>
          <Text style={styles.paragraph}>
            Your values, priorities, and reflections are personal. We do not
            sell your data, share it with third parties for advertising, or use
            it for any purpose other than providing you with the service you
            requested.
          </Text>

          <Text style={styles.sectionTitle}>Final Principle</Text>
          <Text style={styles.paragraph}>
            Hard work, discomfort, and sacrifice are part of life. They become
            less stressful and more meaningful when they are placed
            deliberately.
          </Text>
          <Text style={styles.paragraph}>
            Ascent Beacon exists to help you place your effort wisely — so that
            even hard things feel honest, intentional, and worth doing.
          </Text>

          <Text style={styles.sectionTitle}>Your Agreement</Text>
          <Text style={styles.paragraph}>
            By using Ascent Beacon, you acknowledge that you have read and agree
            to these terms. You understand that this app is a tool for
            reflection and alignment, not a replacement for professional mental
            health support.
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  closeButtonText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    marginTop: 20,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    color: "#333",
    marginBottom: 12,
  },
  bullet: {
    fontSize: 15,
    lineHeight: 22,
    color: "#333",
    marginBottom: 8,
    marginLeft: 8,
  },
});
