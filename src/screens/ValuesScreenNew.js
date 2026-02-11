import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput,
} from "react-native";
import api from "../services/api";

const LENSES = [
  "How I show up for others",
  "How I treat myself",
  "What I protect",
  "What I'm moving toward",
  "How I make decisions",
  "How I relate to the world",
];

const SENTENCE_STARTERS = [
  "I choose to",
  "I commit to",
  "I value being someone who",
];

export default function ValuesScreen({ user, onLogout, navigation }) {
  const [step, setStep] = useState("select"); // select, bucket, review, narrow, create_statement, view_values, done
  const [prompts, setPrompts] = useState([]);
  const [selections, setSelections] = useState(new Set());
  const [buckets, setBuckets] = useState({
    core: [],
    important: [],
    not_now: [],
  });
  const [narrowedCore, setNarrowedCore] = useState(new Set()); // For selecting 3-6 when > 6
  const [loading, setLoading] = useState(true);
  const [currentLensIndex, setCurrentLensIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [moveModalVisible, setMoveModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [coreWarningModalVisible, setCoreWarningModalVisible] = useState(false);
  const [narrowingErrorModalVisible, setNarrowingErrorModalVisible] =
    useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [loadErrorModalVisible, setLoadErrorModalVisible] = useState(false);
  const [noSelectionModalVisible, setNoSelectionModalVisible] = useState(false);

  // Value statement creation state
  const [currentCoreIndex, setCurrentCoreIndex] = useState(0);
  const [statementStarter, setStatementStarter] = useState(
    SENTENCE_STARTERS[0],
  );
  const [statementText, setStatementText] = useState("");
  const [createdStatements, setCreatedStatements] = useState([]);
  const [existingValues, setExistingValues] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [promptsData, selectionsData, valuesData] = await Promise.all([
        api.getDiscoveryPrompts(),
        api.getUserSelections(),
        api.getValues(),
      ]);

      setPrompts(promptsData.prompts || []);

      // If user already has values, show them instead of discovery flow
      if (valuesData.values && valuesData.values.length > 0) {
        setExistingValues(valuesData.values);
        setStep("view_values");
        setLoading(false);
        return;
      }

      // If user has existing selections, restore them
      if (selectionsData.selections && selectionsData.selections.length > 0) {
        const selected = new Set(
          selectionsData.selections.map((s) => s.prompt_id),
        );
        setSelections(selected);

        const grouped = {
          core: selectionsData.selections.filter((s) => s.bucket === "core"),
          important: selectionsData.selections.filter(
            (s) => s.bucket === "important",
          ),
          not_now: selectionsData.selections.filter(
            (s) => s.bucket === "not_now",
          ),
        };
        setBuckets(grouped);

        // If they have buckets, start at review
        if (grouped.core.length > 0 || grouped.important.length > 0) {
          setStep("review");
        }
      }
    } catch (error) {
      console.error("Failed to load discovery data:", error);
      setLoadErrorModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (promptId) => {
    const newSelections = new Set(selections);
    if (newSelections.has(promptId)) {
      newSelections.delete(promptId);
    } else {
      newSelections.add(promptId);
    }
    setSelections(newSelections);
  };

  const handleContinueFromSelection = () => {
    const grouped = groupByLens();
    const currentLens = LENSES[currentLensIndex];
    const lensPrompts = grouped[currentLens] || [];
    const totalPages = Math.ceil(lensPrompts.length / 6);

    // If there are more pages in this lens, go to next page
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    } else if (currentLensIndex < LENSES.length - 1) {
      // Move to next lens
      setCurrentLensIndex(currentLensIndex + 1);
      setCurrentPage(0);
    } else {
      // All lenses done, initialize bucketing
      if (selections.size === 0) {
        setNoSelectionModalVisible(true);
        return;
      }

      // Initialize buckets - preserve existing bucket assignments
      const existingBucketMap = new Map();
      [...buckets.core, ...buckets.important, ...buckets.not_now].forEach(
        (item) => {
          existingBucketMap.set(item.prompt_id, item.bucket);
        },
      );

      const initialBuckets = Array.from(selections).map((promptId, idx) => {
        const prompt = prompts.find((p) => p.id === promptId);
        const existingBucket = existingBucketMap.get(promptId) || "important";
        return {
          prompt_id: promptId,
          prompt,
          bucket: existingBucket,
          display_order: idx,
        };
      });

      // Group by bucket
      const grouped = {
        core: initialBuckets.filter((b) => b.bucket === "core"),
        important: initialBuckets.filter((b) => b.bucket === "important"),
        not_now: initialBuckets.filter((b) => b.bucket === "not_now"),
      };

      setBuckets(grouped);
      setStep("bucket");
    }
  };

  const handleBackLens = () => {
    if (currentPage > 0) {
      // Go to previous page in same lens
      setCurrentPage(currentPage - 1);
    } else if (currentLensIndex > 0) {
      // Go to previous lens, last page
      const prevLensIndex = currentLensIndex - 1;
      const grouped = groupByLens();
      const prevLens = LENSES[prevLensIndex];
      const prevLensPrompts = grouped[prevLens] || [];
      const prevTotalPages = Math.ceil(prevLensPrompts.length / 6);
      setCurrentLensIndex(prevLensIndex);
      setCurrentPage(prevTotalPages - 1);
    }
  };

  const handleContinueFromBucketing = () => {
    const coreCount = buckets.core.length;

    if (coreCount < 3) {
      setCoreWarningModalVisible(true);
      return;
    }

    if (coreCount >= 4) {
      // Go to narrowing screen for 4+ items (lets user choose 3-6)
      setNarrowedCore(new Set());
      setStep("narrow");
      return;
    }

    // Core is exactly 3, perfect - go to review
    setStep("review");
  };

  const moveToBucket = (item, targetBucket) => {
    const newBuckets = { ...buckets };

    // Remove from all buckets
    Object.keys(newBuckets).forEach((key) => {
      newBuckets[key] = newBuckets[key].filter(
        (i) => i.prompt_id !== item.prompt_id,
      );
    });

    // Add to target bucket with updated bucket property
    const updatedItem = { ...item, bucket: targetBucket };
    newBuckets[targetBucket].push(updatedItem);
    setBuckets(newBuckets);
  };

  const handleSaveAndContinue = async () => {
    try {
      setLoading(true);

      // Build selections array for bulk update
      const allSelections = [
        ...buckets.core.map((s, idx) => ({
          prompt_id: s.prompt_id,
          bucket: "core",
          display_order: idx,
          custom_text: s.custom_text || null,
        })),
        ...buckets.important.map((s, idx) => ({
          prompt_id: s.prompt_id,
          bucket: "important",
          display_order: idx,
          custom_text: s.custom_text || null,
        })),
        ...buckets.not_now.map((s, idx) => ({
          prompt_id: s.prompt_id,
          bucket: "not_now",
          display_order: idx,
          custom_text: s.custom_text || null,
        })),
      ];

      await api.bulkUpdateSelections(allSelections);

      setSuccessModalVisible(true);
    } catch (error) {
      console.error("Failed to save selections:", error);
      setErrorModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const groupByLens = () => {
    const grouped = {};
    prompts.forEach((p) => {
      if (!grouped[p.primary_lens]) {
        grouped[p.primary_lens] = [];
      }
      grouped[p.primary_lens].push(p);
    });
    return grouped;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // STEP 1: Selection
  if (step === "select") {
    const grouped = groupByLens();
    const currentLens = LENSES[currentLensIndex];
    const lensPrompts = grouped[currentLens] || [];
    const totalPages = Math.ceil(lensPrompts.length / 6);
    const startIdx = currentPage * 6;
    const endIdx = Math.min(startIdx + 6, lensPrompts.length);
    const visiblePrompts = lensPrompts.slice(startIdx, endIdx);

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{currentLens}</Text>
          <Text style={styles.subtitle}>
            Tap anything that resonates. No limit.
          </Text>
          <View style={styles.progressDots}>
            {LENSES.map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.progressDot,
                  idx === currentLensIndex && styles.progressDotActive,
                  idx < currentLensIndex && styles.progressDotComplete,
                ]}
              />
            ))}
          </View>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.gridContent}
        >
          <View style={styles.grid}>
            {visiblePrompts.map((prompt) => (
              <TouchableOpacity
                key={prompt.id}
                style={[
                  styles.gridItem,
                  selections.has(prompt.id) && styles.gridItemSelected,
                ]}
                onPress={() => toggleSelection(prompt.id)}
              >
                <Text
                  style={[
                    styles.gridItemText,
                    selections.has(prompt.id) && styles.gridItemTextSelected,
                  ]}
                >
                  {prompt.prompt_text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          {(currentLensIndex > 0 || currentPage > 0) && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBackLens}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
          )}
          <View style={styles.footerRight}>
            <Text style={styles.selectionCount}>
              Selected: {selections.size}
            </Text>
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleContinueFromSelection}
            >
              <Text style={styles.continueButtonText}>
                {currentLensIndex === LENSES.length - 1 &&
                currentPage === totalPages - 1
                  ? "Continue"
                  : "Next"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // STEP 2: Bucketing
  if (step === "bucket") {
    const coreCount = buckets.core.length;
    const showCoreWarning = coreCount >= 4;
    const maxCoreSelectable = Math.min(coreCount, 6);
    const warningText =
      coreCount > 6
        ? "You've marked quite a few as Core. You'll choose 3–6 to anchor next."
        : `You'll choose your final 3–${maxCoreSelectable} next.`;

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>These all matter in some way.</Text>
          <Text style={styles.subtitle}>
            Let's organize them by how they feel right now.
          </Text>
          <Text style={styles.subsubtitle}>
            You can move things freely. Nothing is permanent.
          </Text>
        </View>

        <ScrollView style={styles.content}>
          {/* Core Bucket */}
          <View style={styles.bucketSection}>
            <Text style={styles.bucketTitle}>Core (right now)</Text>
            <Text style={styles.bucketDescription}>
              Feels central to how I want to live.
            </Text>
            {showCoreWarning && (
              <View style={styles.warningBox}>
                <Text style={styles.warningText}>{warningText}</Text>
              </View>
            )}
            {buckets.core.length === 0 ? (
              <View style={styles.emptyBucket}>
                <Text style={styles.emptyBucketText}>
                  Tap items below to add to Core
                </Text>
              </View>
            ) : (
              <ScrollView
                style={styles.bucketItemsContainer}
                nestedScrollEnabled={true}
              >
                {buckets.core.map((item) => (
                  <TouchableOpacity
                    key={item.prompt_id}
                    style={styles.bucketItem}
                    onPress={() => {
                      console.log(
                        "Core item tapped:",
                        item.prompt?.prompt_text,
                      );
                      setSelectedItem(item);
                      setMoveModalVisible(true);
                    }}
                  >
                    <Text style={styles.bucketItemText}>
                      {item.prompt?.prompt_text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Important Bucket */}
          <View style={styles.bucketSection}>
            <Text style={styles.bucketTitle}>Important</Text>
            <Text style={styles.bucketDescription}>
              Matters, but not central right now.
            </Text>
            {buckets.important.length === 0 ? (
              <View style={styles.emptyBucket}>
                <Text style={styles.emptyBucketText}>Empty</Text>
              </View>
            ) : (
              <ScrollView
                style={styles.bucketItemsContainer}
                nestedScrollEnabled={true}
              >
                {buckets.important.map((item) => (
                  <TouchableOpacity
                    key={item.prompt_id}
                    style={styles.bucketItem}
                    onPress={() => {
                      console.log(
                        "Important item tapped:",
                        item.prompt?.prompt_text,
                      );
                      setSelectedItem(item);
                      setMoveModalVisible(true);
                    }}
                  >
                    <Text style={styles.bucketItemText}>
                      {item.prompt?.prompt_text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Not Right Now Bucket */}
          <View style={styles.bucketSection}>
            <Text style={styles.bucketTitle}>Not right now</Text>
            <Text style={styles.bucketDescription}>
              Resonates, but not a focus currently.
            </Text>
            {buckets.not_now.length === 0 ? (
              <View style={styles.emptyBucket}>
                <Text style={styles.emptyBucketText}>Empty</Text>
              </View>
            ) : (
              <ScrollView
                style={styles.bucketItemsContainer}
                nestedScrollEnabled={true}
              >
                {buckets.not_now.map((item) => (
                  <TouchableOpacity
                    key={item.prompt_id}
                    style={styles.bucketItem}
                    onPress={() => {
                      console.log(
                        "Not right now item tapped:",
                        item.prompt?.prompt_text,
                      );
                      setSelectedItem(item);
                      setMoveModalVisible(true);
                    }}
                  >
                    <Text style={styles.bucketItemText}>
                      {item.prompt?.prompt_text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setCurrentLensIndex(LENSES.length - 1);
              const grouped = groupByLens();
              const lastLens = LENSES[LENSES.length - 1];
              const lastLensPrompts = grouped[lastLens] || [];
              const lastPage = Math.ceil(lastLensPrompts.length / 6) - 1;
              setCurrentPage(lastPage);
              setStep("select");
            }}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinueFromBucketing}
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
                {selectedItem?.prompt?.prompt_text}
              </Text>

              <View style={styles.modalButtons}>
                {selectedItem && buckets.core.includes(selectedItem) ? (
                  <>
                    <TouchableOpacity
                      style={styles.modalButton}
                      onPress={() => {
                        moveToBucket(selectedItem, "important");
                        setMoveModalVisible(false);
                      }}
                    >
                      <Text style={styles.modalButtonText}>
                        Move to Important
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.modalButton}
                      onPress={() => {
                        moveToBucket(selectedItem, "not_now");
                        setMoveModalVisible(false);
                      }}
                    >
                      <Text style={styles.modalButtonText}>
                        Move to Not right now
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : selectedItem && buckets.important.includes(selectedItem) ? (
                  <>
                    <TouchableOpacity
                      style={styles.modalButton}
                      onPress={() => {
                        moveToBucket(selectedItem, "core");
                        setMoveModalVisible(false);
                      }}
                    >
                      <Text style={styles.modalButtonText}>Make Core</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.modalButton}
                      onPress={() => {
                        moveToBucket(selectedItem, "not_now");
                        setMoveModalVisible(false);
                      }}
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
                      onPress={() => {
                        moveToBucket(selectedItem, "core");
                        setMoveModalVisible(false);
                      }}
                    >
                      <Text style={styles.modalButtonText}>Make Core</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.modalButton}
                      onPress={() => {
                        moveToBucket(selectedItem, "important");
                        setMoveModalVisible(false);
                      }}
                    >
                      <Text style={styles.modalButtonText}>
                        Move to Important
                      </Text>
                    </TouchableOpacity>
                  </>
                )}

                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => setMoveModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Core < 3 Warning Modal */}
        <Modal
          visible={coreWarningModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setCoreWarningModalVisible(false)}
        >
          <View style={styles.coreWarningOverlay}>
            <View style={styles.coreWarningContent}>
              <Text style={styles.coreWarningText}>
                You've marked fewer than 3 as Core.{"\n"}
                Would you like to promote a couple?
              </Text>

              <View style={styles.coreWarningButtons}>
                <TouchableOpacity
                  style={[
                    styles.coreWarningButton,
                    styles.coreWarningButtonPrimary,
                  ]}
                  onPress={() => setCoreWarningModalVisible(false)}
                >
                  <Text style={styles.coreWarningButtonTextPrimary}>
                    Review
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.coreWarningButton}
                  onPress={() => {
                    setCoreWarningModalVisible(false);
                    setStep("review");
                  }}
                >
                  <Text style={styles.coreWarningButtonText}>
                    Continue anyway
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // STEP 2.5: Narrow (when Core >= 4)
  if (step === "narrow") {
    const toggleNarrowed = (promptId) => {
      const newNarrowed = new Set(narrowedCore);
      if (newNarrowed.has(promptId)) {
        newNarrowed.delete(promptId);
      } else {
        newNarrowed.add(promptId);
      }
      setNarrowedCore(newNarrowed);
    };

    const maxSelectable = Math.min(buckets.core.length, 6);

    const handleContinueFromNarrowing = () => {
      const selectedCount = narrowedCore.size;

      if (selectedCount < 3 || selectedCount > maxSelectable) {
        setNarrowingErrorModalVisible(true);
        return;
      }

      // Update buckets - move non-selected core items to important
      const newCore = buckets.core.filter((item) =>
        narrowedCore.has(item.prompt_id),
      );
      const movedToImportant = buckets.core.filter(
        (item) => !narrowedCore.has(item.prompt_id),
      );

      setBuckets({
        ...buckets,
        core: newCore,
        important: [...buckets.important, ...movedToImportant],
      });

      setStep("review");
    };

    const titleText = `Choose 3–${maxSelectable} to anchor`;

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{titleText}</Text>
          <Text style={styles.subtitle}>
            Select the values most central to you right now
          </Text>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.gridContent}
        >
          <View style={styles.grid}>
            {buckets.core.map((item) => (
              <TouchableOpacity
                key={item.prompt_id}
                style={[
                  styles.gridItem,
                  narrowedCore.has(item.prompt_id) && styles.gridItemSelected,
                ]}
                onPress={() => toggleNarrowed(item.prompt_id)}
              >
                <Text
                  style={[
                    styles.gridItemText,
                    narrowedCore.has(item.prompt_id) &&
                      styles.gridItemTextSelected,
                  ]}
                >
                  {item.prompt?.prompt_text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setStep("bucket")}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.footerRight}>
            <Text style={styles.selectionCount}>
              Selected: {narrowedCore.size} of 3-{maxSelectable}
            </Text>
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleContinueFromNarrowing}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Narrowing Error Modal */}
        <Modal
          visible={narrowingErrorModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setNarrowingErrorModalVisible(false)}
        >
          <View style={styles.coreWarningOverlay}>
            <View style={styles.coreWarningContent}>
              <Text style={styles.coreWarningText}>
                Please select 3–{maxSelectable} values to anchor.
              </Text>

              <TouchableOpacity
                style={[
                  styles.coreWarningButton,
                  styles.coreWarningButtonPrimary,
                ]}
                onPress={() => setNarrowingErrorModalVisible(false)}
              >
                <Text style={styles.coreWarningButtonTextPrimary}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // STEP 3: Review
  if (step === "review") {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Review your core values</Text>
          <Text style={styles.subtitle}>
            These {buckets.core.length} values will guide your priorities
          </Text>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.reviewContent}
        >
          {buckets.core.map((item, idx) => (
            <View key={item.prompt_id} style={styles.reviewItem}>
              <Text style={styles.reviewNumber}>{idx + 1}</Text>
              <Text style={styles.reviewText}>{item.prompt?.prompt_text}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setStep("bucket")}
          >
            <Text style={styles.backButtonText}>← Adjust</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleSaveAndContinue}
          >
            <Text style={styles.continueButtonText}>Save & Continue</Text>
          </TouchableOpacity>
        </View>

        {/* Success Modal */}
        <Modal
          visible={successModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => {
            setSuccessModalVisible(false);
            setCurrentCoreIndex(0);
            setStatementStarter(SENTENCE_STARTERS[0]);
            setStatementText("");
            setCreatedStatements([]);
            setStep("create_statement");
          }}
        >
          <View style={styles.coreWarningOverlay}>
            <View style={styles.coreWarningContent}>
              <Text style={styles.coreWarningText}>
                Your value selections are saved. Next, you'll create specific
                value statements from your core values.
              </Text>

              <TouchableOpacity
                style={[
                  styles.coreWarningButton,
                  styles.coreWarningButtonPrimary,
                ]}
                onPress={() => {
                  setSuccessModalVisible(false);
                  setCurrentCoreIndex(0);
                  setStatementStarter(SENTENCE_STARTERS[0]);
                  setStatementText("");
                  setCreatedStatements([]);
                  setStep("create_statement");
                }}
              >
                <Text style={styles.coreWarningButtonTextPrimary}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Error Modal */}
        <Modal
          visible={errorModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setErrorModalVisible(false)}
        >
          <View style={styles.coreWarningOverlay}>
            <View style={styles.coreWarningContent}>
              <Text style={styles.coreWarningText}>
                Failed to save your selections. Please try again.
              </Text>

              <TouchableOpacity
                style={[
                  styles.coreWarningButton,
                  styles.coreWarningButtonPrimary,
                ]}
                onPress={() => setErrorModalVisible(false)}
              >
                <Text style={styles.coreWarningButtonTextPrimary}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // STEP 4: Create Value Statements
  if (step === "create_statement") {
    const currentCoreItem = buckets.core[currentCoreIndex];
    const totalCore = buckets.core.length;

    if (!currentCoreItem) {
      // All statements created, go to done
      setStep("done");
      return null;
    }

    const handleSaveStatement = async () => {
      try {
        const fullStatement = `${statementStarter} ${statementText}`.trim();

        // Calculate equal weight for all values
        const totalValues = createdStatements.length + 1;
        const equalWeight = 100 / totalValues;

        // Save to backend
        await api.createValue({
          statement: fullStatement,
          weight_raw: equalWeight,
          origin: "declared",
        });

        // Store the created statement locally
        const newStatement = {
          prompt_id: currentCoreItem.prompt_id,
          prompt_text: currentCoreItem.prompt?.prompt_text,
          statement: fullStatement,
          starter: statementStarter,
        };

        setCreatedStatements([...createdStatements, newStatement]);

        // Move to next item or finish
        if (currentCoreIndex < totalCore - 1) {
          setCurrentCoreIndex(currentCoreIndex + 1);
          setStatementText("");
          setStatementStarter(SENTENCE_STARTERS[0]);
        } else {
          // All done, reload values and show them
          const valuesData = await api.getValues();
          setExistingValues(valuesData.values || []);
          setStep("view_values");
        }
      } catch (error) {
        console.error("Failed to save value:", error);
        setErrorModalVisible(true);
      }
    };

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.progressText}>
            {currentCoreIndex + 1} of {totalCore}
          </Text>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.statementContent}
        >
          {/* Title from prompt */}
          <Text style={styles.statementPrompt}>
            {currentCoreItem.prompt?.prompt_text}
          </Text>

          {/* Lens reminder */}
          <Text style={styles.statementLens}>
            {currentCoreItem.prompt?.primary_lens}
          </Text>

          {/* Sentence starters */}
          <Text style={styles.statementLabelStandalone}>
            Choose a way to begin:
          </Text>
          <View style={styles.startersContainer}>
            {SENTENCE_STARTERS.map((starter) => (
              <TouchableOpacity
                key={starter}
                style={[
                  styles.starterButton,
                  statementStarter === starter && styles.starterButtonSelected,
                ]}
                onPress={() => setStatementStarter(starter)}
              >
                <Text
                  style={[
                    styles.starterButtonText,
                    statementStarter === starter &&
                      styles.starterButtonTextSelected,
                  ]}
                >
                  {starter}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Text input */}
          <View style={styles.statementLabelContainer}>
            <Text style={styles.statementLabel}>
              Complete your statement about{" "}
            </Text>
            <Text style={styles.statementLabelPrompt}>
              {currentCoreItem.prompt?.prompt_text}
            </Text>
          </View>
          <View style={styles.statementInputContainer}>
            <Text style={styles.statementStarter}>{statementStarter}</Text>
            <TextInput
              style={styles.statementInput}
              value={statementText}
              onChangeText={setStatementText}
              placeholder="write your value statement..."
              placeholderTextColor="#A0A0A0"
              multiline={true}
              numberOfLines={2}
              maxLength={200}
              autoFocus={true}
            />
          </View>

          {/* Preview */}
          {statementText.length > 0 && (
            <View style={styles.statementPreview}>
              <Text style={styles.statementPreviewLabel}>Preview:</Text>
              <Text style={styles.statementPreviewText}>
                {statementStarter} {statementText}
              </Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          {currentCoreIndex > 0 && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                // Restore previous statement if it exists
                if (createdStatements[currentCoreIndex - 1]) {
                  const prevStatement = createdStatements[currentCoreIndex - 1];
                  setStatementStarter(prevStatement.starter);
                  setStatementText(
                    prevStatement.statement.replace(
                      prevStatement.starter + " ",
                      "",
                    ),
                  );
                  // Remove the last statement from the array since we're going back to edit it
                  setCreatedStatements(createdStatements.slice(0, -1));
                }
                setCurrentCoreIndex(currentCoreIndex - 1);
              }}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.continueButton,
              !statementText.trim() && styles.continueButtonDisabled,
            ]}
            onPress={handleSaveStatement}
            disabled={!statementText.trim()}
          >
            <Text style={styles.continueButtonText}>
              {currentCoreIndex < totalCore - 1 ? "Next" : "Finish"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // STEP 5: View Existing Values
  if (step === "view_values") {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Core Values</Text>
          <Text style={styles.subtitle}>
            {existingValues.length}{" "}
            {existingValues.length === 1 ? "value" : "values"} guiding your
            priorities
          </Text>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.reviewContent}
        >
          {existingValues.map((value, idx) => (
            <View key={value.id} style={styles.reviewItem}>
              <Text style={styles.reviewNumber}>{idx + 1}</Text>
              <Text style={styles.reviewText}>
                {value.active_revision?.statement || value.statement}
              </Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => navigation.navigate("Dashboard")}
          >
            <Text style={styles.continueButtonText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // STEP 6: Done
  return (
    <>
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.doneTitle}>✓ Discovery Complete</Text>
          <Text style={styles.doneText}>
            You've identified your core values. Next, you can create specific
            value statements and link them to your daily priorities.
          </Text>
          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => navigation.navigate("Dashboard")}
          >
            <Text style={styles.doneButtonText}>Go to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Load Error Modal */}
      <Modal
        visible={loadErrorModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setLoadErrorModalVisible(false)}
      >
        <View style={styles.coreWarningOverlay}>
          <View style={styles.coreWarningContent}>
            <Text style={styles.coreWarningText}>
              Failed to load value prompts. Please try again.
            </Text>

            <TouchableOpacity
              style={[
                styles.coreWarningButton,
                styles.coreWarningButtonPrimary,
              ]}
              onPress={() => {
                setLoadErrorModalVisible(false);
                loadData();
              }}
            >
              <Text style={styles.coreWarningButtonTextPrimary}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* No Selection Modal */}
      <Modal
        visible={noSelectionModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setNoSelectionModalVisible(false)}
      >
        <View style={styles.coreWarningOverlay}>
          <View style={styles.coreWarningContent}>
            <Text style={styles.coreWarningText}>
              Please select at least one value that resonates with you.
            </Text>

            <TouchableOpacity
              style={[
                styles.coreWarningButton,
                styles.coreWarningButtonPrimary,
              ]}
              onPress={() => setNoSelectionModalVisible(false)}
            >
              <Text style={styles.coreWarningButtonTextPrimary}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F7",
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#8E8E93",
  },
  subsubtitle: {
    fontSize: 14,
    color: "#8E8E93",
    marginTop: 4,
    fontStyle: "italic",
  },
  content: {
    flex: 1,
  },
  gridContent: {
    padding: 20,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
  },
  gridItem: {
    width: "48%",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E5EA",
    minHeight: 80,
    justifyContent: "center",
  },
  gridItemSelected: {
    borderColor: "#007AFF",
    backgroundColor: "#F0F7FF",
  },
  gridItemText: {
    fontSize: 14,
    color: "#000",
    textAlign: "center",
  },
  gridItemTextSelected: {
    color: "#007AFF",
    fontWeight: "500",
  },
  progressDots: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
    justifyContent: "center",
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E5E5EA",
  },
  progressDotActive: {
    backgroundColor: "#007AFF",
    width: 24,
  },
  progressDotComplete: {
    backgroundColor: "#34C759",
  },
  bucketSection: {
    padding: 20,
    paddingBottom: 10,
  },
  bucketItemsContainer: {
    maxHeight: 280, // Show ~4-5 items at a time (each item ~55px with margin)
  },
  bucketTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  bucketDescription: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 12,
  },
  emptyBucket: {
    padding: 24,
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderStyle: "dashed",
  },
  emptyBucketText: {
    fontSize: 14,
    color: "#B0B0B0",
    fontStyle: "italic",
  },
  warningBox: {
    backgroundColor: "#FFF9E6",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#FFB84D",
  },
  warningText: {
    fontSize: 13,
    color: "#8B7236",
  },
  bucketItem: {
    padding: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    marginBottom: 8,
  },
  bucketItemText: {
    fontSize: 15,
    color: "#000",
  },
  reviewContent: {
    paddingTop: 20,
  },
  reviewItem: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 12,
    alignItems: "center",
  },
  reviewNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: "#007AFF",
    marginRight: 16,
    width: 30,
  },
  reviewText: {
    flex: 1,
    fontSize: 15,
    color: "#000",
  },
  footer: {
    flexDirection: "row",
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
    gap: 12,
    alignItems: "center",
  },
  footerRight: {
    flex: 1,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  selectionCount: {
    fontSize: 15,
    color: "#8E8E93",
    fontWeight: "500",
  },
  continueButton: {
    flex: 1,
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
  },
  backButton: {
    backgroundColor: "#E5E5EA",
    padding: 16,
    borderRadius: 12,
    minWidth: 80,
    alignItems: "center",
  },
  backButtonText: {
    color: "#000",
    fontSize: 17,
    fontWeight: "600",
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  doneTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#34C759",
    marginBottom: 16,
  },
  doneText: {
    fontSize: 16,
    color: "#8E8E93",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  doneButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  doneButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
  },
  // Move Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
    color: "#1C1C1E",
  },
  modalText: {
    fontSize: 16,
    color: "#3A3A3C",
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtons: {
    gap: 12,
  },
  modalButton: {
    backgroundColor: "#F2F2F7",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  modalButtonCancel: {
    backgroundColor: "#E5E5EA",
    marginTop: 8,
  },
  modalButtonText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#007AFF",
  },
  // Core Warning Modal Styles
  coreWarningOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  coreWarningContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 340,
  },
  coreWarningText: {
    fontSize: 17,
    color: "#1C1C1E",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  coreWarningButtons: {
    gap: 12,
  },
  coreWarningButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#F2F2F7",
  },
  coreWarningButtonPrimary: {
    backgroundColor: "#007AFF",
  },
  coreWarningButtonText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#007AFF",
  },
  coreWarningButtonTextPrimary: {
    fontSize: 17,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  // Statement Creation Styles
  progressText: {
    fontSize: 14,
    color: "#8E8E93",
    textAlign: "center",
    marginTop: 8,
  },
  statementContent: {
    padding: 20,
  },
  statementPrompt: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 12,
    lineHeight: 32,
  },
  statementLens: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 32,
  },
  statementLabelContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 24,
  },
  statementLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: "#3A3A3C",
  },
  statementLabelStandalone: {
    fontSize: 15,
    fontWeight: "500",
    color: "#3A3A3C",
    marginBottom: 12,
    marginTop: 0,
  },
  statementLabelPrompt: {
    fontSize: 15,
    fontWeight: "600",
    color: "#007AFF",
    flexShrink: 1,
  },
  startersContainer: {
    gap: 12,
    marginBottom: 8,
  },
  starterButton: {
    padding: 16,
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  starterButtonSelected: {
    backgroundColor: "#E8F4FF",
    borderColor: "#007AFF",
  },
  starterButtonText: {
    fontSize: 16,
    color: "#3A3A3C",
  },
  starterButtonTextSelected: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
  },
  statementInputContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    minHeight: 100,
  },
  statementStarter: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
    marginRight: 6,
    marginTop: 2,
  },
  statementInput: {
    flex: 1,
    fontSize: 16,
    color: "#1C1C1E",
    lineHeight: 22,
    padding: 0,
    margin: 0,
  },
  statementPreview: {
    marginTop: 24,
    padding: 16,
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
  },
  statementPreviewLabel: {
    fontSize: 12,
    color: "#8E8E93",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statementPreviewText: {
    fontSize: 16,
    color: "#1C1C1E",
    lineHeight: 24,
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
});
