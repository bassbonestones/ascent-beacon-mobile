import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  Platform,
} from "react-native";
import { styles } from "../../screens/styles/valuesDiscoveryStyles";
import type { SelectionBucket } from "../../types";
import type { BucketItem, Buckets } from "../../hooks/useValuesDiscovery";
import { MAX_CORE_VALUES } from "../../hooks/useValuesDiscovery";

interface BucketStepProps {
  buckets: Buckets;
  onMoveToBucket: (item: BucketItem, targetBucket: SelectionBucket) => void;
  onBack: () => void;
  onContinue: () => void;
  coreCount: number;
  canContinue: boolean;
  onShowCoreWarning: () => void;
}

/**
 * Step 2: Organize selected values into buckets (Core, Important, Not right now).
 */
export default function BucketStep({
  buckets,
  onMoveToBucket,
  onBack,
  onContinue,
  coreCount,
  canContinue,
  onShowCoreWarning,
}: BucketStepProps): React.ReactElement {
  const [moveModalVisible, setMoveModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<BucketItem | null>(null);
  const closeButtonRef = useRef<View>(null);

  useEffect(() => {
    if (moveModalVisible && Platform.OS === "web") {
      setTimeout(() => {
        (closeButtonRef.current as unknown as HTMLElement)?.focus?.();
      }, 100);
    }
  }, [moveModalVisible]);

  const showMoveOptions = coreCount > MAX_CORE_VALUES;
  const maxCoreSelectable = Math.min(coreCount, MAX_CORE_VALUES);
  const warningText =
    coreCount > MAX_CORE_VALUES
      ? "You've marked quite a few as Core. You'll choose 3–6 to anchor next."
      : `You'll choose your final 3–${maxCoreSelectable} next.`;

  const handleItemPress = (item: BucketItem) => {
    setSelectedItem(item);
    setMoveModalVisible(true);
  };

  const handleMove = (targetBucket: SelectionBucket) => {
    if (selectedItem) {
      onMoveToBucket(selectedItem, targetBucket);
    }
    setMoveModalVisible(false);
    setSelectedItem(null);
  };

  const handleContinue = () => {
    if (!canContinue) {
      onShowCoreWarning();
    } else {
      onContinue();
    }
  };

  const renderBucketSection = (
    title: string,
    description: string,
    items: BucketItem[],
    bucket: SelectionBucket,
  ) => (
    <View style={styles.bucketSection}>
      <Text style={styles.bucketTitle}>{title}</Text>
      <Text style={styles.bucketDescription}>{description}</Text>
      {bucket === "core" && showMoveOptions && (
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>{warningText}</Text>
        </View>
      )}
      {items.length === 0 ? (
        <View style={styles.emptyBucket}>
          <Text style={styles.emptyBucketText}>
            {bucket === "core" ? "Tap items below to add to Core" : "Empty"}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.bucketItemsContainer}
          nestedScrollEnabled={true}
        >
          {items.map((item) => (
            <TouchableOpacity
              key={item.prompt_id}
              style={styles.bucketItem}
              onPress={() => handleItemPress(item)}
              accessibilityRole="button"
              accessibilityLabel={`${item.prompt.prompt_text}, tap to move`}
            >
              <Text style={styles.bucketItemText}>
                {item.prompt.prompt_text}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          These all matter in some way.
        </Text>
        <Text style={styles.subtitle}>
          Let's organize them by how they feel right now.
        </Text>
        <Text style={styles.subsubtitle}>
          You can move things freely. Nothing is permanent.
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {renderBucketSection(
          "Core (right now)",
          "Feels central to how I want to live.",
          buckets.core,
          "core",
        )}
        {renderBucketSection(
          "Important",
          "Matters, but not central right now.",
          buckets.important,
          "important",
        )}
        {renderBucketSection(
          "Not right now",
          "Resonates, but not a focus currently.",
          buckets.not_now,
          "not_now",
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Go back to selection"
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          accessibilityRole="button"
          accessibilityLabel="Continue"
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>

      {/* Move Item Modal */}
      <Modal
        visible={moveModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setMoveModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Move this value?</Text>
            <Text style={styles.modalText}>
              {selectedItem?.prompt.prompt_text}
            </Text>

            <View style={styles.modalButtons}>
              {selectedItem && selectedItem.bucket === "core" ? (
                <>
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={() => handleMove("important")}
                    accessibilityRole="button"
                    accessibilityLabel="Move to Important"
                  >
                    <Text style={styles.modalButtonText}>
                      Move to Important
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={() => handleMove("not_now")}
                    accessibilityRole="button"
                    accessibilityLabel="Move to Not right now"
                  >
                    <Text style={styles.modalButtonText}>
                      Move to Not right now
                    </Text>
                  </TouchableOpacity>
                </>
              ) : selectedItem && selectedItem.bucket === "important" ? (
                <>
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={() => handleMove("core")}
                    accessibilityRole="button"
                    accessibilityLabel="Make Core"
                  >
                    <Text style={styles.modalButtonText}>Make Core</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={() => handleMove("not_now")}
                    accessibilityRole="button"
                    accessibilityLabel="Move to Not right now"
                  >
                    <Text style={styles.modalButtonText}>
                      Move to Not right now
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={() => handleMove("core")}
                    accessibilityRole="button"
                    accessibilityLabel="Make Core"
                  >
                    <Text style={styles.modalButtonText}>Make Core</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={() => handleMove("important")}
                    accessibilityRole="button"
                    accessibilityLabel="Move to Important"
                  >
                    <Text style={styles.modalButtonText}>
                      Move to Important
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity
                ref={closeButtonRef}
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setMoveModalVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
