import React, { useState, useRef, useEffect } from "react";
import { View, Text, ActivityIndicator, Modal, Platform } from "react-native";
import { TouchableOpacity } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { User, RootStackParamList } from "../types";
import useValuesDiscovery, { LENSES } from "../hooks/useValuesDiscovery";
import { styles } from "./styles/valuesDiscoveryStyles";
import {
  SelectStep,
  BucketStep,
  NarrowStep,
  ReviewStep,
  CreateStatementStep,
  DoneStep,
} from "../components/discovery";
import ValuesManagement from "./ValuesManagement";

interface ValuesDiscoveryProps {
  user: User;
  onLogout: () => void;
  navigation: NativeStackNavigationProp<RootStackParamList>;
}

/**
 * Values Discovery Screen - guided flow for discovering core values.
 * Steps: select → bucket → narrow (if needed) → review → create_statement → view_values/done
 */
export default function ValuesDiscovery({
  user,
  onLogout,
  navigation,
}: ValuesDiscoveryProps): React.ReactElement {
  const discovery = useValuesDiscovery();

  // Modal states
  const [noSelectionModalVisible, setNoSelectionModalVisible] = useState(false);
  const [coreWarningModalVisible, setCoreWarningModalVisible] = useState(false);
  const [narrowingErrorModalVisible, setNarrowingErrorModalVisible] =
    useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);

  const modalCloseRef = useRef<View>(null);

  useEffect(() => {
    const modalsOpen =
      noSelectionModalVisible ||
      coreWarningModalVisible ||
      narrowingErrorModalVisible ||
      successModalVisible ||
      errorModalVisible;
    if (modalsOpen && Platform.OS === "web") {
      setTimeout(() => {
        (modalCloseRef.current as unknown as HTMLElement)?.focus?.();
      }, 100);
    }
  }, [
    noSelectionModalVisible,
    coreWarningModalVisible,
    narrowingErrorModalVisible,
    successModalVisible,
    errorModalVisible,
  ]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleContinueFromSelection = () => {
    // Check if we're at the last page of the last lens
    const isLastPage =
      discovery.currentLensIndex === LENSES.length - 1 &&
      discovery.currentPage >= discovery.totalPages - 1;

    if (isLastPage && discovery.selections.size === 0) {
      setNoSelectionModalVisible(true);
      return;
    }

    discovery.continueFromSelection();
  };

  const handleContinueFromBucketing = () => {
    const success = discovery.continueFromBucketing();
    if (!success) {
      setCoreWarningModalVisible(true);
    }
  };

  const handleContinueFromNarrowing = () => {
    const success = discovery.continueFromNarrowing();
    if (!success) {
      setNarrowingErrorModalVisible(true);
    }
  };

  const handleSaveAndContinue = async () => {
    const success = await discovery.saveSelections();
    if (success) {
      setSuccessModalVisible(true);
    } else {
      setErrorModalVisible(true);
    }
  };

  const handleSuccessModalClose = () => {
    setSuccessModalVisible(false);
    discovery.setStep("create_statement");
  };

  const handleSaveStatement = async () => {
    const success = await discovery.saveStatement();
    if (!success) {
      setErrorModalVisible(true);
    }
  };

  const blurActiveElement = (): void => {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      (document.activeElement as HTMLElement | null)?.blur?.();
    }
  };

  const handleGoToDashboard = () => {
    blurActiveElement();
    navigation.navigate("Dashboard");
  };

  const handleBackToSelection = () => {
    // Go back to last page of last lens
    discovery.setStep("select");
  };

  // ============================================================================
  // Render
  // ============================================================================

  // Loading state
  if (discovery.step === "loading" || discovery.loading) {
    return (
      <View style={styles.loadingContainer} accessibilityLabel="Loading">
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Step 1: Selection
  if (discovery.step === "select") {
    const isLastPage =
      discovery.currentLensIndex === LENSES.length - 1 &&
      discovery.currentPage >= discovery.totalPages - 1;
    const canGoBack =
      discovery.currentLensIndex > 0 || discovery.currentPage > 0;

    return (
      <>
        <SelectStep
          currentLensIndex={discovery.currentLensIndex}
          currentPage={discovery.currentPage}
          totalPages={discovery.totalPages}
          visiblePrompts={discovery.visiblePrompts}
          selections={discovery.selections}
          onToggle={discovery.toggleSelection}
          onBack={discovery.goToPreviousLens}
          onContinue={handleContinueFromSelection}
          onExit={handleGoToDashboard}
          canGoBack={canGoBack}
          isLastPage={isLastPage}
        />
        {renderNoSelectionModal()}
      </>
    );
  }

  // Step 2: Bucketing
  if (discovery.step === "bucket") {
    return (
      <>
        <BucketStep
          buckets={discovery.buckets}
          onMoveToBucket={discovery.moveToBucket}
          onBack={handleBackToSelection}
          onContinue={handleContinueFromBucketing}
          coreCount={discovery.coreCount}
          canContinue={discovery.canContinueFromBucket}
          onShowCoreWarning={() => setCoreWarningModalVisible(true)}
        />
        {renderCoreWarningModal()}
      </>
    );
  }

  // Step 2.5: Narrow (if >6 core)
  if (discovery.step === "narrow") {
    return (
      <>
        <NarrowStep
          coreItems={discovery.buckets.core}
          narrowedCore={discovery.narrowedCore}
          onToggle={discovery.toggleNarrowedCore}
          onBack={() => discovery.setStep("bucket")}
          onContinue={handleContinueFromNarrowing}
          maxSelectable={discovery.maxSelectableCore}
        />
        {renderNarrowingErrorModal()}
      </>
    );
  }

  // Step 3: Review
  if (discovery.step === "review") {
    return (
      <>
        <ReviewStep
          coreItems={discovery.buckets.core}
          onBack={() => discovery.setStep("bucket")}
          onSaveAndContinue={handleSaveAndContinue}
          saving={discovery.saving}
        />
        {renderSuccessModal()}
        {renderErrorModal()}
      </>
    );
  }

  // Step 4: Create statements
  if (discovery.step === "create_statement") {
    if (!discovery.currentCoreItem) {
      // This shouldn't happen, but fall through to done
      return <DoneStep onGoToDashboard={handleGoToDashboard} />;
    }

    return (
      <>
        <CreateStatementStep
          currentCoreItem={discovery.currentCoreItem}
          currentIndex={discovery.currentCoreIndex}
          totalCount={discovery.buckets.core.length}
          statementStarter={discovery.statementStarter}
          statementText={discovery.statementText}
          onSetStarter={discovery.setStatementStarter}
          onSetText={discovery.setStatementText}
          onSave={handleSaveStatement}
          onBack={discovery.goToPreviousStatement}
          canGoBack={discovery.currentCoreIndex > 0}
          saving={discovery.saving}
        />
        {renderErrorModal()}
      </>
    );
  }

  // Step 5: Manage values (edit, delete, add, weights)
  if (discovery.step === "view_values") {
    return (
      <ValuesManagement
        user={user}
        onLogout={onLogout}
        navigation={navigation}
        onExploreMore={discovery.startExploreMore}
      />
    );
  }

  // Step 6: Done
  return <DoneStep onGoToDashboard={handleGoToDashboard} />;

  // ============================================================================
  // Modal Renderers
  // ============================================================================

  function renderNoSelectionModal() {
    return (
      <Modal
        visible={noSelectionModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setNoSelectionModalVisible(false)}
      >
        <View style={styles.alertOverlay}>
          <View style={styles.alertContent}>
            <Text style={styles.alertText}>
              Please select at least one value that resonates with you.
            </Text>
            <TouchableOpacity
              ref={modalCloseRef}
              style={[styles.alertButton, styles.alertButtonPrimary]}
              onPress={() => setNoSelectionModalVisible(false)}
              accessibilityRole="button"
              accessibilityLabel="OK"
            >
              <Text style={styles.alertButtonTextPrimary}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  function renderCoreWarningModal() {
    return (
      <Modal
        visible={coreWarningModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCoreWarningModalVisible(false)}
      >
        <View style={styles.alertOverlay}>
          <View style={styles.alertContent}>
            <Text style={styles.alertText}>
              You've marked fewer than 3 as Core.{"\n"}
              Would you like to promote a couple?
            </Text>
            <View style={styles.alertButtons}>
              <TouchableOpacity
                ref={modalCloseRef}
                style={[styles.alertButton, styles.alertButtonPrimary]}
                onPress={() => setCoreWarningModalVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Review"
              >
                <Text style={styles.alertButtonTextPrimary}>Review</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.alertButton}
                onPress={() => {
                  setCoreWarningModalVisible(false);
                  discovery.setStep("review");
                }}
                accessibilityRole="button"
                accessibilityLabel="Continue anyway"
              >
                <Text style={styles.alertButtonText}>Continue anyway</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  function renderNarrowingErrorModal() {
    return (
      <Modal
        visible={narrowingErrorModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setNarrowingErrorModalVisible(false)}
      >
        <View style={styles.alertOverlay}>
          <View style={styles.alertContent}>
            <Text style={styles.alertText}>
              Please select 3–{discovery.maxSelectableCore} values to anchor.
            </Text>
            <TouchableOpacity
              ref={modalCloseRef}
              style={[styles.alertButton, styles.alertButtonPrimary]}
              onPress={() => setNarrowingErrorModalVisible(false)}
              accessibilityRole="button"
              accessibilityLabel="OK"
            >
              <Text style={styles.alertButtonTextPrimary}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  function renderSuccessModal() {
    return (
      <Modal
        visible={successModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleSuccessModalClose}
      >
        <View style={styles.alertOverlay}>
          <View style={styles.alertContent}>
            <Text style={styles.alertText}>
              Your value selections are saved. Next, you'll create specific
              value statements from your core values.
            </Text>
            <TouchableOpacity
              ref={modalCloseRef}
              style={[styles.alertButton, styles.alertButtonPrimary]}
              onPress={handleSuccessModalClose}
              accessibilityRole="button"
              accessibilityLabel="OK"
            >
              <Text style={styles.alertButtonTextPrimary}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  function renderErrorModal() {
    return (
      <Modal
        visible={errorModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setErrorModalVisible(false)}
      >
        <View style={styles.alertOverlay}>
          <View style={styles.alertContent}>
            <Text style={styles.alertText}>
              Something went wrong. Please try again.
            </Text>
            <TouchableOpacity
              ref={modalCloseRef}
              style={[styles.alertButton, styles.alertButtonPrimary]}
              onPress={() => setErrorModalVisible(false)}
              accessibilityRole="button"
              accessibilityLabel="OK"
            >
              <Text style={styles.alertButtonTextPrimary}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }
}
