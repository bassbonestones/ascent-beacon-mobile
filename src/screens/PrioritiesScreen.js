import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  Picker,
  FlatList,
  Image,
  Platform,
} from "react-native";
import api from "../services/api";

const SCOPES = [
  { label: "Ongoing (no end point)", value: "ongoing" },
  { label: "In Progress (working toward completion)", value: "in_progress" },
  { label: "Habitual (repeated, sustained)", value: "habitual" },
  { label: "Seasonal (activated during specific windows)", value: "seasonal" },
];

const SCORE_OPTIONS = [
  { label: "1 - Minor", value: 1 },
  { label: "2 - Somewhat Important", value: 2 },
  { label: "3 - Important", value: 3 },
  { label: "4 - Very Important", value: 4 },
  { label: "5 - Critical", value: 5 },
];

export default function PrioritiesScreen({ user, navigation }) {
  const [step, setStep] = useState("view_list"); // view_list, detail, create, step1_name, step2_why, step3_values, step4_scope, review
  const [priorities, setPriorities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [values, setValues] = useState([]);
  const [selectedValues, setSelectedValues] = useState(new Set());

  // Track current priority being viewed/edited
  const [currentPriority, setCurrentPriority] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [linkedValuesInDetail, setLinkedValuesInDetail] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    why_matters: "",
    score: 3,
    scope: "ongoing",
    cadence: "",
    constraints: "",
    value_ids: [],
  });

  const [validationFeedback, setValidationFeedback] = useState({
    name: [],
    why: [],
  });
  const [validationRules, setValidationRules] = useState({});
  const [ruleExamples, setRuleExamples] = useState({});
  const [validating, setValidating] = useState(false);
  const [showValuesModal, setShowValuesModal] = useState(false);
  const [showScopeModal, setShowScopeModal] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [showExamplesModal, setShowExamplesModal] = useState(false);
  const [selectedRuleName, setSelectedRuleName] = useState(null);

  // Debounce timer for validation
  const validationTimeoutRef = useRef(null);

  useEffect(() => {
    loadData();

    // Cleanup debounce timer on unmount
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, []);

  const blurActiveElement = () => {
    if (Platform.OS !== "web" || typeof document === "undefined") {
      return;
    }

    const activeElement = document.activeElement;
    if (activeElement && typeof activeElement.blur === "function") {
      activeElement.blur();
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [prioritiesData, valuesData] = await Promise.all([
        api.getPriorities(),
        api.getValues(),
      ]);

      setPriorities(prioritiesData.priorities || []);
      setValues(valuesData.values || []);
    } catch (error) {
      console.error("Failed to load data:", error);
      Alert.alert("Error", "Failed to load priorities");
    } finally {
      setLoading(false);
    }
  };

  const validateField = async (field, value, title) => {
    if (field === "title" && !value.trim()) {
      setValidationFeedback((prev) => ({
        ...prev,
        name: ["Priority name is required"],
      }));
      return false;
    }

    if (field === "why_matters" && !value.trim()) {
      setValidationFeedback((prev) => ({
        ...prev,
        why: ["Please tell us why this matters"],
      }));
      return false;
    }

    // Server-side validation for title when it's specific enough
    if (field === "title" && value.trim().length >= 10) {
      try {
        setValidating(true);
        const response = await api.validatePriority({
          name: value,
          why_statement:
            formData.why_matters ||
            "placeholder text to meet minimum length requirement for validation", // Use long placeholder for name-only validation
        });

        setValidationFeedback({
          name: response.name_feedback || [],
          why: validationFeedback.why, // Keep existing why feedback
        });

        return response.name_valid;
      } catch (error) {
        // Only fail if it's a name-related error, ignore why_statement errors during title validation
        if (
          error.message.includes("why_statement") ||
          error.message.includes("why_feedback")
        ) {
          console.log("Skipping why_statement error during title validation");
          return true; // Assume name is valid if only why_statement is failing
        }
        console.error("Validation error:", error);
        return false;
      } finally {
        setValidating(false);
      }
    }

    // Server-side validation only when both fields are filled
    if (field === "why_matters" && title && value.length >= 20) {
      try {
        setValidating(true);
        const response = await api.validatePriority({
          name: title,
          why_statement: value,
        });

        setValidationFeedback({
          name: response.name_feedback || [],
          why: response.why_feedback || [],
        });
        setValidationRules(response.why_passed_rules || {});
        setRuleExamples(response.rule_examples || {});

        return response.overall_valid;
      } catch (error) {
        console.error("Validation error:", error);
        return false;
      } finally {
        setValidating(false);
      }
    }

    return true;
  };

  const handleNameChange = (text) => {
    setFormData((prev) => ({ ...prev, title: text }));

    // Clear previous debounce timer
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    // Set new debounce timer - validate after user stops typing for 500ms
    if (text.trim().length > 5) {
      validationTimeoutRef.current = setTimeout(async () => {
        try {
          await validateField("title", text);
        } catch (error) {
          // Suppress validation errors during typing, they'll be caught on submit
          console.log("Name validation skipped:", error.message);
        }
      }, 500);
    } else if (text.trim().length > 0) {
      // Show feedback for short names
      setValidationFeedback((prev) => ({
        ...prev,
        name: [
          "Add a detail: instead of 'Health', say 'Fitness', 'Sleep', or 'Mental health'",
        ],
      }));
    } else {
      // If text is empty, clear feedback
      setValidationFeedback((prev) => ({ ...prev, name: [] }));
    }
  };

  const handleWhyChange = (text) => {
    setFormData((prev) => ({ ...prev, why_matters: text }));

    // Clear previous debounce timer
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    // Set new debounce timer - only validate after user stops typing for 500ms
    if (text.length >= 20) {
      validationTimeoutRef.current = setTimeout(() => {
        validateField("why_matters", text, formData.title);
      }, 500);
    } else {
      // If text is too short, clear feedback immediately
      setValidationFeedback((prev) => ({
        ...prev,
        why: ["Please tell us why this matters"],
      }));
      setValidationRules({});
    }
  };

  const toggleValue = (valueId) => {
    setSelectedValues((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(valueId)) {
        newSet.delete(valueId);
      } else {
        newSet.add(valueId);
      }
      return newSet;
    });
  };

  const handleCreatePriority = async () => {
    // Clear any pending validation
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }
    // Final validation
    const isValid = await validateField("why_matters", formData.why_matters);
    if (!isValid || validationFeedback.why.length > 0) {
      Alert.alert(
        "Validation Failed",
        "Please address the feedback and try again",
      );
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...formData,
        // Convert empty strings to null for optional fields
        cadence: formData.cadence?.trim() || null,
        constraints: formData.constraints?.trim() || null,
        value_ids: Array.from(selectedValues),
      };

      let successMessage = "Priority created!";
      if (isEditMode) {
        await api.createPriorityRevision(currentPriority.id, payload);
        successMessage = "Priority updated!";
      } else {
        await api.createPriority(payload);
      }

      Alert.alert("Success", successMessage);

      // Reset form
      setFormData({
        title: "",
        why_matters: "",
        score: 3,
        scope: "ongoing",
        cadence: "",
        constraints: "",
        value_ids: [],
      });
      setSelectedValues(new Set());
      setValidationFeedback({ name: [], why: [] });
      setRuleExamples({});
      setIsEditMode(false);
      setCurrentPriority(null);

      // Reload and go back to list
      await loadData();
      setStep("view_list");
    } catch (error) {
      console.error("Failed to save priority:", error.message);
      let errorMessage = isEditMode
        ? "Failed to update priority"
        : "Failed to create priority";

      // Check if error has validation data attached
      if (error.validationData) {
        const { name_feedback, why_feedback } = error.validationData;
        if (Array.isArray(name_feedback) && name_feedback.length > 0) {
          errorMessage = "Priority Name: " + name_feedback.join(" ");
        } else if (Array.isArray(why_feedback) && why_feedback.length > 0) {
          errorMessage = "Why This Matters: " + why_feedback.join(" ");
        }
      } else {
        // Try to parse validation error details from message
        try {
          const errorData =
            typeof error.message === "string"
              ? JSON.parse(error.message)
              : error.message;
          if (
            errorData.name_feedback &&
            Array.isArray(errorData.name_feedback) &&
            errorData.name_feedback.length > 0
          ) {
            errorMessage =
              "Priority Name: " + errorData.name_feedback.join(" ");
          } else if (
            errorData.why_feedback &&
            Array.isArray(errorData.why_feedback) &&
            errorData.why_feedback.length > 0
          ) {
            errorMessage =
              "Why This Matters: " + errorData.why_feedback.join(" ");
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (parseError) {
          // If we can't parse, use original message
          errorMessage = error.message || errorMessage;
        }
      }

      Alert.alert("Validation Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case "view_list":
        return renderPriorityList();
      case "detail":
        return renderPriorityDetail();
      case "create":
      case "step1_name":
        return renderStep1Name();
      case "step2_why":
        return renderStep2Why();
      case "step3_values":
        return renderStep3Values();
      case "step4_scope":
        return renderStep4Scope();
      case "review":
        return renderReview();
      default:
        return renderPriorityList();
    }
  };

  const renderPriorityList = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerMainRow}>
          <View style={styles.headerIconContainer}>
            <Image
              source={require("../../assets/AnchorIcon_Priorities.png")}
              style={styles.headerMainIcon}
              resizeMode="contain"
            />
          </View>
          <View style={styles.headerTextBlock}>
            <Text style={styles.title}>Priorities</Text>
            <Text style={styles.subtitle}>Lock what's important</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {priorities.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No priorities yet</Text>
            <Text style={styles.emptySubText}>
              Create your first priority to get started
            </Text>
          </View>
        ) : (
          <View style={styles.prioritiesList}>
            {priorities
              .filter((priority) => priority.active_revision)
              .map((priority) => {
                const activeRev = priority.active_revision;
                const isAnchored = Boolean(activeRev?.is_anchored);
                const scoreValue =
                  typeof activeRev?.score === "number" ||
                  typeof activeRev?.score === "string"
                    ? activeRev.score
                    : 3;

                return (
                  <TouchableOpacity
                    key={priority.id}
                    style={[
                      styles.priorityCard,
                      isAnchored ? styles.priorityCardAnchored : null,
                    ]}
                    onPress={async () => {
                      setCurrentPriority(priority);
                      setIsEditMode(false);

                      // Extract linked values from the active revision
                      if (
                        activeRev?.value_links &&
                        activeRev.value_links.length > 0
                      ) {
                        const linkedValueIds = activeRev.value_links
                          .map((link) => link.value_id)
                          .filter(
                            (vid) => vid && values.find((v) => v.id === vid),
                          );
                        setLinkedValuesInDetail(linkedValueIds);
                      } else {
                        setLinkedValuesInDetail([]);
                      }

                      setStep("detail");
                    }}
                  >
                    <View style={styles.priorityCardContent}>
                      <View style={styles.priorityHeader}>
                        <Text style={styles.priorityTitle}>
                          {activeRev.title || "Untitled"}
                        </Text>
                        {isAnchored ? (
                          <Text style={styles.anchoredBadge}>🔒 Anchored</Text>
                        ) : null}
                      </View>
                      <Text style={styles.priorityWhy}>
                        {activeRev.why_matters?.trim()
                          ? activeRev.why_matters.trim()
                          : "No description provided"}
                      </Text>
                      <View style={styles.priorityMeta}>
                        <Text style={styles.priorityScope}>
                          {activeRev.scope || "ongoing"}
                        </Text>
                        <Text style={styles.priorityScore}>
                          Importance: {scoreValue}/5
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            blurActiveElement();
            navigation.navigate("Dashboard");
          }}
        >
          <Text style={styles.backButtonText}>Back to Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => setStep("step1_name")}
        >
          <Text style={styles.continueButtonText}>+ Create Priority</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPriorityDetail = () => {
    const activeRev = currentPriority?.active_revision;
    if (!activeRev) return null;
    const isAnchored = Boolean(activeRev?.is_anchored);
    const scoreValue =
      typeof activeRev?.score === "number" ||
      typeof activeRev?.score === "string"
        ? activeRev.score
        : 3;

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Priority Details</Text>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Priority Name</Text>
            <Text style={styles.detailValue}>{activeRev.title}</Text>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Why This Matters</Text>
            <Text style={styles.detailValue}>
              {activeRev.why_matters?.trim()
                ? activeRev.why_matters.trim()
                : "No description provided"}
            </Text>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Scope</Text>
            <Text style={styles.detailValue}>{activeRev.scope}</Text>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Importance</Text>
            <Text style={styles.detailValue}>{scoreValue}/5</Text>
          </View>

          {activeRev.cadence && activeRev.cadence !== "null" ? (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Cadence</Text>
              <Text style={styles.detailValue}>{activeRev.cadence}</Text>
            </View>
          ) : null}

          {activeRev.constraints && activeRev.constraints !== "null" ? (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Constraints</Text>
              <Text style={styles.detailValue}>{activeRev.constraints}</Text>
            </View>
          ) : null}

          {linkedValuesInDetail.length > 0 ? (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Linked Values</Text>
              <View style={styles.linkedValuesContainer}>
                {linkedValuesInDetail.map((valueId) => {
                  const value = values.find((v) => v.id === valueId);
                  const activeValueRev = value?.revisions?.[0];
                  return (
                    <View key={valueId} style={styles.linkedValueTag}>
                      <Text style={styles.linkedValueText}>
                        {activeValueRev?.statement || "Unknown Value"}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : null}

          {isAnchored ? (
            <View style={styles.detailSection}>
              <Text style={styles.anchoredBadge}>
                🔒 This priority is anchored
              </Text>
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.formButtons}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setStep("view_list")}
          >
            <Text style={styles.cancelButtonText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.nextButton}
            onPress={async () => {
              // Load the priority data into the form for editing
              const activeRev = currentPriority?.active_revision;
              if (!activeRev) return;

              setFormData({
                title: activeRev.title || "",
                why_matters: activeRev.why_matters || "",
                score: activeRev.score || 3,
                scope: activeRev.scope || "ongoing",
                cadence:
                  activeRev.cadence && activeRev.cadence !== "null"
                    ? activeRev.cadence
                    : "",
                constraints:
                  activeRev.constraints && activeRev.constraints !== "null"
                    ? activeRev.constraints
                    : "",
                value_ids: [],
              });

              // Extract linked values from the active revision
              if (activeRev?.value_links && activeRev.value_links.length > 0) {
                const valueIds = new Set(
                  activeRev.value_links.map((link) => link.value_id),
                );
                setSelectedValues(valueIds);
              } else {
                setSelectedValues(new Set());
              }

              // Set validation to all passed since this is already a saved priority
              setValidationFeedback({ name: [], why: [] });
              setValidationRules({
                personal: true,
                meaning_based: true,
                implies_protection: true,
                concrete: true,
              });

              setIsEditMode(true);
              setStep("step1_name");
            }}
          >
            <Text style={styles.nextButtonText}>Edit Priority</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderStep1Name = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.stepNumber}>Step 1 of 4</Text>
        <Text style={styles.title}>Priority Name</Text>
        <Text style={styles.subtitle}>Be specific, not generic</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.formSection}>
          <Text style={styles.label}>What is this priority?</Text>
          <Text style={styles.helperText}>
            Be specific about WHAT (not why it matters yet):
          </Text>
          <Text style={styles.example}>
            ✓ Restoring physical health after burnout
          </Text>
          <Text style={styles.example}>
            ✓ Being emotionally present for my child
          </Text>
          <Text style={styles.example}>
            ✓ Quality time with family and close friends
          </Text>
          <Text style={styles.badExample}>✗ Health</Text>
          <Text style={styles.badExample}>✗ Family</Text>
          <Text style={styles.badExample}>✗ Work</Text>

          <TextInput
            style={styles.input}
            placeholder="Enter priority name..."
            value={formData.title}
            onChangeText={handleNameChange}
            multiline
            placeholderTextColor="#999"
          />

          {validating && <ActivityIndicator size="large" color="#B3D9F2" />}

          {validationFeedback.name.length > 0 && (
            <View style={styles.feedbackBox}>
              {validationFeedback.name.map((msg, idx) => (
                <Text key={idx} style={styles.feedbackText}>
                  • {msg}
                </Text>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.formButtons}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => setStep("view_list")}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.nextButton,
            (!formData.title.trim() || validationFeedback.name.length > 0) &&
              styles.nextButtonDisabled,
          ]}
          onPress={() => setStep("step2_why")}
          disabled={
            !formData.title.trim() || validationFeedback.name.length > 0
          }
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep2Why = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.stepNumber}>Step 2 of 4</Text>
        <Text style={styles.title}>Why This Matters</Text>
        <Text style={styles.subtitle}>Explain the meaning, not obligation</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.formSection}>
          <Text style={styles.label}>
            Why does this deserve to be protected?
          </Text>

          <View style={styles.rulesBox}>
            <Text style={styles.rulesTitle}>Your answer should be:</Text>
            <View
              style={[
                styles.ruleItem,
                validationRules.personal && styles.ruleItemPassed,
              ]}
            >
              <Text style={styles.ruleCheck}>
                {validationRules.personal ? "✓" : "○"}
              </Text>
              <Text style={styles.ruleText}>
                Personal - about you, not abstract ideas
              </Text>
            </View>
            <View
              style={[
                styles.ruleItem,
                validationRules.meaning_based && styles.ruleItemPassed,
              ]}
            >
              <Text style={styles.ruleCheck}>
                {validationRules.meaning_based ? "✓" : "○"}
              </Text>
              <Text style={styles.ruleText}>
                Meaning-based - not obligation or guilt
              </Text>
            </View>
            <View
              style={[
                styles.ruleItem,
                validationRules.implies_protection && styles.ruleItemPassed,
              ]}
            >
              <Text style={styles.ruleCheck}>
                {validationRules.implies_protection ? "✓" : "○"}
              </Text>
              <Text style={styles.ruleText}>
                Implies protection - why it needs protecting
              </Text>
            </View>
            <View
              style={[
                styles.ruleItem,
                validationRules.concrete && styles.ruleItemPassed,
              ]}
            >
              <Text style={styles.ruleCheck}>
                {validationRules.concrete ? "✓" : "○"}
              </Text>
              <Text style={styles.ruleText}>
                Concrete - guides your decisions
              </Text>
            </View>
          </View>

          <TextInput
            style={[styles.input, styles.largeInput]}
            placeholder="Because I..."
            value={formData.why_matters}
            onChangeText={handleWhyChange}
            multiline
            placeholderTextColor="#999"
          />

          {validating && <ActivityIndicator size="large" color="#B3D9F2" />}

          {validationFeedback.why.length > 0 && (
            <View style={styles.feedbackBox}>
              {validationFeedback.why.map((msg, idx) => (
                <Text key={idx} style={styles.feedbackText}>
                  • {msg}
                </Text>
              ))}
              {Object.keys(ruleExamples).length > 0 && (
                <TouchableOpacity
                  style={styles.examplesButton}
                  onPress={() => setShowExamplesModal(true)}
                >
                  <Text style={styles.examplesButtonText}>💡 See examples</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.formButtons}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => setStep("step1_name")}
        >
          <Text style={styles.cancelButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.nextButton,
            (!formData.why_matters.trim() ||
              validationFeedback.why.length > 0) &&
              styles.nextButtonDisabled,
          ]}
          onPress={() => setStep("step3_values")}
          disabled={
            !formData.why_matters.trim() || validationFeedback.why.length > 0
          }
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep3Values = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.stepNumber}>Step 3 of 4</Text>
        <Text style={styles.title}>Link Values</Text>
        <Text style={styles.subtitle}>Which values does this support?</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.formSection}>
          <View style={styles.labelRow}>
            <Image
              source={require("../../assets/NorthStarIcon_values.png")}
              style={styles.labelIcon}
              resizeMode="contain"
            />
            <Text style={styles.label}>
              Select at least one value (required)
            </Text>
          </View>

          {values.length === 0 ? (
            <Text style={styles.emptyText}>
              Create some values first in the Values module
            </Text>
          ) : (
            <View style={styles.valuesList}>
              {values.map((value) => {
                const activeRev = value.revisions?.[0];
                const isSelected = selectedValues.has(value.id);

                return (
                  <TouchableOpacity
                    key={value.id}
                    style={[
                      styles.valueItem,
                      isSelected && styles.valueItemSelected,
                    ]}
                    onPress={() => toggleValue(value.id)}
                  >
                    <View style={styles.valueCheckbox}>
                      {isSelected && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <View style={styles.valueContent}>
                      <Text style={styles.valueStatement}>
                        {activeRev?.statement}
                      </Text>
                      {activeRev?.weight_normalized ? (
                        <Text style={styles.valueWeight}>
                          Weight:{" "}
                          {typeof activeRev.weight_normalized === "number"
                            ? activeRev.weight_normalized.toFixed(1)
                            : parseFloat(activeRev.weight_normalized).toFixed(
                                1,
                              )}
                          %
                        </Text>
                      ) : (
                        <Text style={styles.valueWeight}>Weight: --</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.formButtons}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => setStep("step2_why")}
        >
          <Text style={styles.cancelButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.nextButton,
            selectedValues.size === 0 && styles.nextButtonDisabled,
          ]}
          onPress={() => setStep("step4_scope")}
          disabled={selectedValues.size === 0}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep4Scope = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.stepNumber}>Step 4 of 4</Text>
        <Text style={styles.title}>Scope & Details</Text>
        <Text style={styles.subtitle}>
          Optional: Add context about this priority
        </Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.formSection}>
          <Text style={styles.label}>What kind of priority is this?</Text>

          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowScopeModal(true)}
          >
            <Text style={styles.pickerButtonText}>
              {SCOPES.find((s) => s.value === formData.scope)?.label}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Importance Score</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowScoreModal(true)}
          >
            <Text style={styles.pickerButtonText}>
              {SCORE_OPTIONS.find((s) => s.value === formData.score)?.label}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Cadence (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Weekly, 2-3 times per week"
            value={formData.cadence || ""}
            onChangeText={(text) =>
              setFormData((prev) => ({ ...prev, cadence: text }))
            }
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Constraints (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 2-3 hours per week, dependent on availability"
            value={formData.constraints || ""}
            onChangeText={(text) =>
              setFormData((prev) => ({ ...prev, constraints: text }))
            }
            placeholderTextColor="#999"
            multiline
          />
        </View>
      </ScrollView>

      <View style={styles.formButtons}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => setStep("step3_values")}
        >
          <Text style={styles.cancelButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={() => setStep("review")}
        >
          <Text style={styles.nextButtonText}>Review</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showScopeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Scope</Text>
            {SCOPES.map((scope) => (
              <TouchableOpacity
                key={scope.value}
                style={styles.modalOption}
                onPress={() => {
                  setFormData((prev) => ({ ...prev, scope: scope.value }));
                  blurActiveElement();
                  setShowScopeModal(false);
                }}
              >
                <Text style={styles.modalOptionText}>{scope.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => {
                blurActiveElement();
                setShowScopeModal(false);
              }}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showScoreModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Importance</Text>
            {SCORE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.modalOption}
                onPress={() => {
                  setFormData((prev) => ({ ...prev, score: option.value }));
                  blurActiveElement();
                  setShowScoreModal(false);
                }}
              >
                <Text style={styles.modalOptionText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => {
                blurActiveElement();
                setShowScoreModal(false);
              }}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );

  const renderReview = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.stepNumber}>Review</Text>
        <Text style={styles.title}>Confirm Priority</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.reviewSection}>
          <Text style={styles.reviewLabel}>Name</Text>
          {formData.title?.trim() ? (
            <Text style={styles.reviewValue}>{formData.title}</Text>
          ) : (
            <Text style={styles.reviewValue}>(not set)</Text>
          )}
        </View>

        <View style={styles.reviewSection}>
          <Text style={styles.reviewLabel}>Why This Matters</Text>
          {formData.why_matters?.trim() ? (
            <Text style={styles.reviewValue}>{formData.why_matters}</Text>
          ) : (
            <Text style={styles.reviewValue}>(not set)</Text>
          )}
        </View>

        <View style={styles.reviewSection}>
          <Text style={styles.reviewLabel}>Scope</Text>
          {SCOPES.find((s) => s.value === formData.scope)?.label ? (
            <Text style={styles.reviewValue}>
              {SCOPES.find((s) => s.value === formData.scope).label}
            </Text>
          ) : formData.scope ? (
            <Text style={styles.reviewValue}>{String(formData.scope)}</Text>
          ) : (
            <Text style={styles.reviewValue}>(not set)</Text>
          )}
        </View>

        <View style={styles.reviewSection}>
          <Text style={styles.reviewLabel}>Importance</Text>
          {formData.score ? (
            <Text style={styles.reviewValue}>{formData.score}/5</Text>
          ) : (
            <Text style={styles.reviewValue}>(not set)</Text>
          )}
        </View>

        {formData.cadence ? (
          <View style={styles.reviewSection}>
            <Text style={styles.reviewLabel}>Cadence</Text>
            <Text style={styles.reviewValue}>{formData.cadence}</Text>
          </View>
        ) : null}

        {formData.constraints ? (
          <View style={styles.reviewSection}>
            <Text style={styles.reviewLabel}>Constraints</Text>
            <Text style={styles.reviewValue}>{formData.constraints}</Text>
          </View>
        ) : null}

        <View style={styles.reviewSection}>
          <Text style={styles.reviewLabel}>Linked Values</Text>
          <View style={styles.valuesList}>
            {selectedValues.size > 0 ? (
              values
                .filter((v) => selectedValues.has(v.id))
                .filter((v) => v?.revisions?.[0]?.statement?.trim())
                .map((value) => (
                  <View key={value.id} style={styles.reviewValueItem}>
                    <Text style={styles.reviewValueText}>
                      {`• ${value.revisions[0].statement}`}
                    </Text>
                  </View>
                ))
            ) : (
              <Text style={styles.reviewValueText}>No values selected</Text>
            )}
          </View>
        </View>
      </ScrollView>

      <View style={styles.formButtons}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => {
            if (isEditMode) {
              setStep("detail");
            } else {
              setStep("step4_scope");
            }
          }}
        >
          <Text style={styles.cancelButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.nextButton, loading && styles.nextButtonDisabled]}
          onPress={handleCreatePriority}
          disabled={loading}
        >
          <Text style={styles.nextButtonText}>
            {loading
              ? isEditMode
                ? "Updating..."
                : "Creating..."
              : isEditMode
                ? "Update Priority"
                : "Create Priority"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && step === "view_list") {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#B3D9F2" />
      </View>
    );
  }

  const renderExamplesModal = () => (
    <Modal
      visible={showExamplesModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => {
        blurActiveElement();
        setShowExamplesModal(false);
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Examples for Each Rule</Text>
            <TouchableOpacity
              onPress={() => {
                blurActiveElement();
                setShowExamplesModal(false);
              }}
            >
              <Text style={styles.modalCloseX}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.examplesContainer}>
            {Object.entries(ruleExamples).map(([ruleName, ruleData]) => (
              <View key={ruleName} style={styles.ruleExampleCard}>
                <Text style={styles.ruleExampleTitle}>
                  {ruleData.rule_title}
                </Text>

                {Array.isArray(ruleData.good_examples) &&
                  ruleData.good_examples.length > 0 && (
                    <View style={styles.exampleSection}>
                      <Text style={styles.exampleLabel}>✓ Good examples:</Text>
                      {ruleData.good_examples.map((example, idx) => (
                        <Text key={`good-${idx}`} style={styles.goodExample}>
                          "{example}"
                        </Text>
                      ))}
                    </View>
                  )}

                {Array.isArray(ruleData.bad_examples) &&
                  ruleData.bad_examples.length > 0 && (
                    <View style={styles.exampleSection}>
                      <Text style={styles.exampleLabel}>✗ Bad examples:</Text>
                      {ruleData.bad_examples.map((example, idx) => (
                        <Text key={`bad-${idx}`} style={styles.badExample}>
                          "{example}"
                        </Text>
                      ))}
                    </View>
                  )}
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => {
              blurActiveElement();
              setShowExamplesModal(false);
            }}
          >
            <Text style={styles.modalCloseButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {renderStep()}
      {renderExamplesModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F9F9",
  },
  header: {
    backgroundColor: "#F0F8FF",
    padding: 24,
    paddingTop: 40,
  },
  headerMainRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    minHeight: 120,
    gap: 0,
  },
  headerTextBlock: {
    flex: 1,
    paddingLeft: 0,
  },
  headerIconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  headerMainIcon: {
    width: 112,
    height: 112,
  },
  stepNumber: {
    fontSize: 14,
    color: "#2196F3",
    fontWeight: "600",
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  formSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  labelIcon: {
    width: 18,
    height: 18,
  },
  helperText: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
    marginTop: 4,
  },
  example: {
    fontSize: 13,
    color: "#4CAF50",
    marginLeft: 12,
    marginBottom: 4,
  },
  badExample: {
    fontSize: 13,
    color: "#F44336",
    marginLeft: 12,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#333",
    minHeight: 44,
  },
  largeInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  feedbackBox: {
    backgroundColor: "#FFF3CD",
    borderWidth: 1,
    borderColor: "#FFE082",
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  feedbackText: {
    fontSize: 13,
    color: "#856404",
    marginBottom: 4,
  },
  rulesBox: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  rulesTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  ruleItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  ruleItemPassed: {
    backgroundColor: "#F1F8E9",
    borderBottomColor: "#C5E1A5",
  },
  ruleCheck: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#999",
    marginRight: 8,
    marginTop: 2,
  },
  ruleItemPassed: {
    backgroundColor: "#F1F8E9",
  },
  ruleCheck: {
    color: "#4CAF50",
  },
  ruleText: {
    fontSize: 13,
    color: "#666",
    flex: 1,
  },
  prioritiesList: {
    gap: 12,
  },
  priorityCard: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  priorityCardAnchored: {
    borderWidth: 2,
    borderColor: "#2196F3",
    backgroundColor: "#F0F8FF",
  },
  priorityCardContent: {
    gap: 8,
  },
  priorityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priorityTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  anchoredBadge: {
    fontSize: 12,
    color: "#2196F3",
    fontWeight: "600",
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityWhy: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },
  priorityMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  priorityScope: {
    fontSize: 12,
    color: "#999",
    fontWeight: "500",
  },
  priorityScore: {
    fontSize: 12,
    color: "#2196F3",
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#999",
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: "#CCC",
  },
  createButton: {
    backgroundColor: "#2196F3",
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
  footer: {
    flexDirection: "row",
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    gap: 12,
    alignItems: "center",
  },
  continueButton: {
    flex: 1,
    backgroundColor: "#2196F3",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  backButton: {
    backgroundColor: "#E0E0E0",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  formButtons: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#CCC",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  nextButton: {
    flex: 1,
    backgroundColor: "#2196F3",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  nextButtonDisabled: {
    backgroundColor: "#CCC",
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
  pickerButton: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    justifyContent: "center",
  },
  pickerButtonText: {
    fontSize: 14,
    color: "#333",
  },
  valuesList: {
    gap: 8,
  },
  valueItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  valueItemSelected: {
    borderColor: "#4CAF50",
    backgroundColor: "#F1F8E9",
  },
  valueCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#CCC",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
    marginTop: 2,
  },
  checkmark: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "bold",
  },
  valueContent: {
    flex: 1,
  },
  valueStatement: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
    marginBottom: 4,
  },
  valueWeight: {
    fontSize: 12,
    color: "#999",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
    textAlign: "center",
  },
  modalOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  modalOptionText: {
    fontSize: 16,
    color: "#333",
  },
  modalCloseButton: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2196F3",
  },
  examplesButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#E8F5E9",
    borderRadius: 6,
    alignItems: "center",
  },
  examplesButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2E7D32",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    paddingBottom: 12,
  },
  modalCloseX: {
    fontSize: 24,
    color: "#666",
  },
  examplesContainer: {
    flex: 1,
    marginBottom: 16,
  },
  ruleExampleCard: {
    backgroundColor: "#F9F9F9",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  ruleExampleTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  exampleSection: {
    marginBottom: 12,
  },
  exampleLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
    marginBottom: 6,
  },
  goodExample: {
    fontSize: 13,
    color: "#2E7D32",
    marginLeft: 8,
    marginBottom: 4,
    fontStyle: "italic",
  },
  badExample: {
    fontSize: 13,
    color: "#C62828",
    marginLeft: 8,
    marginBottom: 4,
    fontStyle: "italic",
  },
  reviewSection: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  reviewLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#999",
    marginBottom: 4,
  },
  reviewValue: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  reviewValueItem: {
    marginTop: 8,
  },
  reviewValueText: {
    fontSize: 13,
    color: "#666",
  },
  detailSection: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#999",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  detailValue: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
  },
  linkedValuesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  linkedValueTag: {
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  linkedValueText: {
    fontSize: 14,
    color: "#1976D2",
    fontWeight: "500",
  },
});
