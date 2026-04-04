import React, { useState, useEffect } from "react";
import { View, ActivityIndicator, Alert, Platform } from "react-native";
import api from "../services/api";
import { styles } from "./styles/prioritiesScreenStyles";
import usePriorityForm from "../hooks/usePriorityForm";

// Components
import ExamplesModal from "../components/priorities/ExamplesModal";
import PriorityListView from "../components/priorities/PriorityListView";
import PriorityDetailView from "../components/priorities/PriorityDetailView";
import CreatePriorityStep1 from "../components/priorities/CreatePriorityStep1";
import CreatePriorityStep2 from "../components/priorities/CreatePriorityStep2";
import CreatePriorityStep3 from "../components/priorities/CreatePriorityStep3";
import CreatePriorityStep4 from "../components/priorities/CreatePriorityStep4";
import CreatePriorityReview from "../components/priorities/CreatePriorityReview";

export default function PrioritiesScreen({ user, navigation }) {
  const [step, setStep] = useState("view_list");
  const [priorities, setPriorities] = useState([]);
  const [stashedPriorities, setStashedPriorities] = useState([]);
  const [showStash, setShowStash] = useState(false);
  const [loading, setLoading] = useState(true);
  const [values, setValues] = useState([]);
  const [currentPriority, setCurrentPriority] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [linkedValuesInDetail, setLinkedValuesInDetail] = useState([]);
  const [showExamplesModal, setShowExamplesModal] = useState(false);

  const {
    formData,
    setFormData,
    validationFeedback,
    validationRules,
    ruleExamples,
    validating,
    selectedValues,
    handleNameChange,
    handleWhyChange,
    toggleValue,
    resetForm,
    loadFromPriority,
    clearValidationTimeout,
  } = usePriorityForm();

  useEffect(() => {
    loadData();
    return () => clearValidationTimeout();
  }, [clearValidationTimeout]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prioritiesData, valuesData, stashedData] = await Promise.all([
        api.getPriorities(),
        api.getValues(),
        api.getStashedPriorities().catch(() => ({ priorities: [] })),
      ]);
      setPriorities(prioritiesData.priorities || []);
      setValues(valuesData.values || []);
      setStashedPriorities(stashedData.priorities || []);
    } catch (error) {
      Alert.alert("Error", "Failed to load priorities");
    } finally {
      setLoading(false);
    }
  };

  const handlePriorityPress = (priority) => {
    setCurrentPriority(priority);
    setIsEditMode(false);
    const activeRev = priority.active_revision;
    setLinkedValuesInDetail(
      activeRev?.value_links
        ?.map((link) => link.value_id)
        .filter((vid) => values.find((v) => v.id === vid)) || [],
    );
    setStep("detail");
  };

  const handleEditPress = () => {
    loadFromPriority(currentPriority);
    setIsEditMode(true);
    setStep("step1_name");
  };

  const handleStashToggle = async () => {
    try {
      const isStashed = Boolean(currentPriority?.is_stashed);
      await api.stashPriority(currentPriority.id, !isStashed);
      await loadData();
      setStep("view_list");
      Alert.alert(
        isStashed ? "Unstashed" : "Stashed",
        isStashed
          ? "Priority moved back to active."
          : "Priority moved to Stash.",
      );
    } catch (e) {
      Alert.alert("Error", "Failed to update stash status");
    }
  };

  const handleToggleValue = (valueId) => {
    toggleValue(
      valueId,
      currentPriority?.active_revision?.is_anchored && isEditMode,
      () =>
        Alert.alert(
          "Cannot Remove Last Value",
          "An anchored priority needs at least one linked value.",
        ),
    );
  };

  const handleCreatePriority = async () => {
    if (
      !formData.title.trim() ||
      !formData.why_matters.trim() ||
      selectedValues.size === 0
    ) {
      Alert.alert("Missing Info", "Please complete all required fields.");
      return;
    }
    try {
      setLoading(true);
      const data = {
        title: formData.title.trim(),
        why_matters: formData.why_matters.trim(),
        score: formData.score,
        scope: formData.scope,
        cadence: formData.cadence || null,
        constraints: formData.constraints || null,
        value_ids: Array.from(selectedValues),
      };
      if (isEditMode && currentPriority) {
        await api.createPriorityRevision(currentPriority.id, data);
        Alert.alert("Success", "Priority updated successfully!");
      } else {
        await api.createPriority(data);
        Alert.alert("Success", "Priority created successfully!");
      }
      resetForm();
      setIsEditMode(false);
      setCurrentPriority(null);
      await loadData();
      setStep("view_list");
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to save priority");
    } finally {
      setLoading(false);
    }
  };

  const blurActiveElement = () => {
    if (Platform.OS === "web" && typeof document !== "undefined")
      document.activeElement?.blur?.();
  };

  if (loading && step === "view_list") {
    return (
      <View style={styles.container}>
        <ActivityIndicator
          size="large"
          color="#B3D9F2"
          accessibilityLabel="Loading"
        />
      </View>
    );
  }

  const renderStep = () => {
    switch (step) {
      case "view_list":
        return (
          <PriorityListView
            priorities={priorities}
            stashedPriorities={stashedPriorities}
            showStash={showStash}
            onToggleStash={() => setShowStash((p) => !p)}
            onPriorityPress={handlePriorityPress}
            onCreatePress={() => setStep("step1_name")}
            onBackPress={() => {
              blurActiveElement();
              navigation.navigate("Dashboard");
            }}
          />
        );
      case "detail":
        return (
          <PriorityDetailView
            priority={currentPriority}
            values={values}
            linkedValueIds={linkedValuesInDetail}
            onStashToggle={handleStashToggle}
            onBack={() => setStep("view_list")}
            onEdit={handleEditPress}
          />
        );
      case "step1_name":
        return (
          <CreatePriorityStep1
            formData={formData}
            onNameChange={handleNameChange}
            validating={validating}
            validationFeedback={validationFeedback}
            onCancel={() => setStep("view_list")}
            onNext={() => setStep("step2_why")}
          />
        );
      case "step2_why":
        return (
          <CreatePriorityStep2
            formData={formData}
            onWhyChange={handleWhyChange}
            validating={validating}
            validationFeedback={validationFeedback}
            validationRules={validationRules}
            ruleExamples={ruleExamples}
            onShowExamples={() => setShowExamplesModal(true)}
            onBack={() => setStep("step1_name")}
            onNext={() => setStep("step3_values")}
          />
        );
      case "step3_values":
        return (
          <CreatePriorityStep3
            values={values}
            selectedValues={selectedValues}
            onToggleValue={handleToggleValue}
            onBack={() => setStep("step2_why")}
            onNext={() => setStep("step4_scope")}
          />
        );
      case "step4_scope":
        return (
          <CreatePriorityStep4
            formData={formData}
            onFormDataChange={setFormData}
            onBack={() => setStep("step3_values")}
            onNext={() => setStep("review")}
          />
        );
      case "review":
        return (
          <CreatePriorityReview
            formData={formData}
            values={values}
            selectedValues={selectedValues}
            isEditMode={isEditMode}
            loading={loading}
            onBack={() => setStep(isEditMode ? "detail" : "step4_scope")}
            onSubmit={handleCreatePriority}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {renderStep()}
      <ExamplesModal
        visible={showExamplesModal}
        ruleExamples={ruleExamples}
        onClose={() => {
          blurActiveElement();
          setShowExamplesModal(false);
        }}
      />
    </View>
  );
}
