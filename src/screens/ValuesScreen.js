import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import api from "../services/api";
import WeightAdjustmentModal from "../components/WeightAdjustmentModal";

const VALUE_EXAMPLES = [
  "Being deeply present with family by listening attentively, creating rituals, and protecting shared time.",
  "Growing professionally by learning deliberately, seeking feedback, and taking calculated risks.",
  "Showing up for community through consistent service, advocacy, and creating space for others.",
  "Prioritizing health by moving daily, eating intentionally, and honoring rest.",
  "Creating meaningful work that serves others, challenges me, and reflects my values.",
  "Building financial stability through intentional saving, mindful spending, and long-term planning.",
];

export default function ValuesScreen({ user, onLogout }) {
  const [values, setValues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const [newStatement, setNewStatement] = useState("");
  const [showWeightsModal, setShowWeightsModal] = useState(false);
  const [editingValueId, setEditingValueId] = useState(null);
  const [editingStatement, setEditingStatement] = useState("");
  const [saving, setSaving] = useState(false);
  const [valueInsights, setValueInsights] = useState({});
  const [highlightValueId, setHighlightValueId] = useState(null);

  const scrollViewRef = useRef(null);
  const valuePositions = useRef({});

  useEffect(() => {
    loadValues();
  }, []);

  const loadValues = async () => {
    try {
      setLoading(true);
      const response = await api.getValues();
      const nextValues = response.values || [];
      setValues(nextValues);
      const nextInsights = {};
      nextValues.forEach((value) => {
        if (value.insights && value.insights.length > 0) {
          nextInsights[value.id] = value.insights[0];
        }
      });
      setValueInsights(nextInsights);
    } catch (error) {
      console.error("Failed to load values:", error);
      Alert.alert("Error", "Failed to load values");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateValue = async () => {
    if (!newStatement.trim()) {
      Alert.alert("Required", "Please enter a value statement");
      return;
    }

    if (values.length >= 6) {
      Alert.alert("Limit Reached", "You can have a maximum of 6 values");
      return;
    }

    try {
      setCreating(true);
      // Backend will handle equal weight distribution
      // Just send a placeholder; backend will recalculate all weights equally
      const created = await api.createValue({
        statement: newStatement.trim(),
        weight_raw: 1, // Placeholder - backend will override with equal distribution
        origin: "declared",
      });

      if (created?.insights?.length) {
        setValueInsights((prev) => ({
          ...prev,
          [created.id]: created.insights[0],
        }));
      }

      setNewStatement("");
      await loadValues();
    } catch (error) {
      console.error("Failed to create value:", error);
      Alert.alert("Error", "Failed to create value");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteValue = async (valueId) => {
    if (values.length <= 3) {
      Alert.alert("Minimum Required", "You must have at least 3 values");
      return;
    }

    Alert.alert(
      "Delete Value",
      "Are you sure? This will remove this value and rebalance your weights.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await api.deleteValue(valueId);
              await loadValues();
            } catch (error) {
              console.error("Failed to delete value:", error);
              Alert.alert("Error", "Failed to delete value");
            }
          },
        },
      ],
    );
  };

  const handleStartEdit = (value) => {
    const activeRev = getActiveRevision(value);
    if (activeRev) {
      setEditingValueId(value.id);
      setEditingStatement(activeRev.statement);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingStatement.trim()) {
      Alert.alert("Required", "Please enter a value statement");
      return;
    }

    try {
      setSaving(true);
      const value = values.find((v) => v.id === editingValueId);
      if (!value) return;

      const activeRev = getActiveRevision(value);
      if (!activeRev) return;

      // Update the value with new statement but keep same weight
      const updated = await api.updateValue(value.id, {
        statement: editingStatement.trim(),
        weight_raw: activeRev.weight_raw,
        origin: activeRev.origin,
      });

      if (updated?.insights?.length) {
        setValueInsights((prev) => ({
          ...prev,
          [updated.id]: updated.insights[0],
        }));
      }

      setEditingValueId(null);
      setEditingStatement("");
      await loadValues();
      Alert.alert("Success", "Value updated");
    } catch (error) {
      console.error("Failed to update value:", error);
      Alert.alert("Error", "Failed to update value");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingValueId(null);
    setEditingStatement("");
  };

  const handleSelectExample = (example) => {
    setNewStatement(example);
    setShowExamples(false);
  };

  const handleSaveWeights = async (weights) => {
    try {
      // Update each value with its new weight
      for (const item of weights) {
        const value = values.find((v) => v.id === item.valueId);
        if (!value) continue;

        const activeRev = getActiveRevision(value);
        if (!activeRev) continue;

        // Create new revision with updated weight
        await api.updateValue(value.id, {
          statement: activeRev.statement,
          weight_raw: item.weight,
          origin: activeRev.origin,
        });
      }

      // Reload values to get normalized weights
      await loadValues();
      setShowWeightsModal(false);
      Alert.alert("Success", "Weights updated successfully");
    } catch (error) {
      console.error("Failed to update weights:", error);
      throw error;
    }
  };

  const getActiveRevision = (value) => {
    if (!value.active_revision_id || !value.revisions) return null;
    return value.revisions.find((r) => r.id === value.active_revision_id);
  };

  const handleKeepBoth = async (valueId) => {
    try {
      await api.acknowledgeValueInsight(valueId);
    } catch (error) {
      console.error("Failed to acknowledge insight:", error);
    }

    setValueInsights((prev) => {
      const next = { ...prev };
      delete next[valueId];
      return next;
    });
  };

  const handleReviewInsight = (valueId) => {
    const insight = valueInsights[valueId];
    if (!insight?.similar_value_id) return;

    const targetY = valuePositions.current[insight.similar_value_id];
    if (typeof targetY === "number") {
      scrollViewRef.current?.scrollTo({
        y: Math.max(targetY - 12, 0),
        animated: true,
      });
    }

    setHighlightValueId(insight.similar_value_id);
    setTimeout(() => setHighlightValueId(null), 1200);
  };

  const hasMinimumValues = values.length >= 3;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Your Values</Text>
        <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Adjust Weights Button */}
      {hasMinimumValues && (
        <View style={styles.weightsButtonContainer}>
          <TouchableOpacity
            style={styles.weightsButton}
            onPress={() => setShowWeightsModal(true)}
          >
            <Text style={styles.weightsButtonIcon}>⚖️</Text>
            <Text style={styles.weightsButtonText}>Adjust Weights</Text>
            <Text style={styles.weightsButtonIcon}>⚖️</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Info Section */}
      {values.length === 0 && (
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Why values?</Text>
          <Text style={styles.infoText}>
            Values help you understand what matters right now. They're not
            labels or ideals — they're commitments that guide your priorities.
          </Text>
        </View>
      )}

      <ScrollView
        ref={scrollViewRef}
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Values List */}
        {values.length > 0 && (
          <View style={styles.valuesList}>
            <Text style={styles.sectionTitle}>
              Your Values ({values.length}/6)
            </Text>
            {values.map((value) => {
              const activeRev = getActiveRevision(value);
              if (!activeRev) return null;

              return (
                <View
                  key={value.id}
                  style={[
                    styles.valueCard,
                    value.id === highlightValueId && styles.similarHighlight,
                  ]}
                  onLayout={(event) => {
                    valuePositions.current[value.id] =
                      event.nativeEvent.layout.y;
                  }}
                >
                  <View style={styles.valueHeader}>
                    <Text style={styles.valueStatement}>
                      {activeRev.statement}
                    </Text>
                  </View>

                  {valueInsights[value.id] && (
                    <View style={styles.insightContainer}>
                      <Text style={styles.insightText}>
                        {valueInsights[value.id].message}
                      </Text>
                      <View style={styles.insightActions}>
                        {valueInsights[value.id].similar_value_id && (
                          <TouchableOpacity
                            style={styles.insightButton}
                            onPress={() => handleReviewInsight(value.id)}
                          >
                            <Text style={styles.insightButtonText}>Review</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          style={styles.insightButton}
                          onPress={() => handleKeepBoth(value.id)}
                        >
                          <Text style={styles.insightButtonText}>
                            Keep both
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                  {activeRev.weight_normalized != null && (
                    <Text style={styles.weightText}>
                      Weight:{" "}
                      {parseFloat(activeRev.weight_normalized).toFixed(1)}%
                    </Text>
                  )}
                  <View style={styles.valueActions}>
                    <TouchableOpacity
                      onPress={() => handleStartEdit(value)}
                      style={styles.editButton}
                    >
                      <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                    {values.length > 3 && (
                      <TouchableOpacity
                        onPress={() => handleDeleteValue(value.id)}
                        style={styles.deleteButton}
                      >
                        <Text style={styles.deleteButtonText}>Delete</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Create New Value */}
        {values.length < 6 && (
          <View style={styles.createSection}>
            <Text style={styles.sectionTitle}>
              {values.length === 0
                ? "Create Your First Value"
                : "Add Another Value"}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="I choose to..."
              placeholderTextColor="#999"
              value={newStatement}
              onChangeText={setNewStatement}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <TouchableOpacity
              onPress={() => setShowExamples(true)}
              style={styles.examplesLink}
            >
              <Text style={styles.examplesLinkText}>See examples</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.createButton,
                (!newStatement.trim() || creating) &&
                  styles.createButtonDisabled,
              ]}
              onPress={handleCreateValue}
              disabled={!newStatement.trim() || creating}
            >
              {creating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.createButtonText}>
                  {values.length === 0 ? "Create Value" : "Add Value"}
                </Text>
              )}
            </TouchableOpacity>

            {values.length >= 3 && values.length < 6 && (
              <Text style={styles.hint}>
                You have {values.length} values. You can add up to{" "}
                {6 - values.length} more.
              </Text>
            )}
          </View>
        )}

        {/* Guidance */}
        {values.length > 0 && values.length < 3 && (
          <View style={styles.guidanceBox}>
            <Text style={styles.guidanceText}>
              Add at least {3 - values.length} more{" "}
              {3 - values.length === 1 ? "value" : "values"} to continue.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Examples Modal */}
      <Modal
        visible={showExamples}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowExamples(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Value Examples</Text>
            <TouchableOpacity
              onPress={() => setShowExamples(false)}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseText}>Done</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalHint}>
              These are examples to inspire you. Tap one to use it as a starting
              point, then edit it to make it your own.
            </Text>
            {VALUE_EXAMPLES.map((example, index) => (
              <TouchableOpacity
                key={index}
                style={styles.exampleCard}
                onPress={() => handleSelectExample(example)}
              >
                <Text style={styles.exampleText}>{example}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Weight Adjustment Modal */}
      <Modal
        visible={showWeightsModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowWeightsModal(false)}
      >
        <WeightAdjustmentModal
          values={values}
          onSave={handleSaveWeights}
          onCancel={() => setShowWeightsModal(false)}
        />
      </Modal>

      {/* Edit Value Modal */}
      <Modal
        visible={editingValueId !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCancelEdit}
      >
        <View style={styles.editModalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Value</Text>
            <TouchableOpacity
              onPress={handleCancelEdit}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.editModalContent}>
              <TextInput
                style={styles.editInput}
                placeholder="Edit your value statement..."
                placeholderTextColor="#999"
                value={editingStatement}
                onChangeText={setEditingStatement}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
              <TouchableOpacity
                style={[
                  styles.editSaveButton,
                  saving && styles.editSaveButtonDisabled,
                ]}
                onPress={handleSaveEdit}
                disabled={saving || !editingStatement.trim()}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.editSaveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
  },
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  logoutText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
  },
  weightsButtonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  weightsButton: {
    backgroundColor: "#66BB6A",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 16,
  },
  weightsButtonIcon: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  weightsButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  infoBox: {
    backgroundColor: "#E8F5E9",
    margin: 20,
    padding: 16,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2E7D32",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#1B5E20",
  },
  valuesList: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginBottom: 12,
  },
  valueCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  similarHighlight: {
    borderWidth: 1,
    borderColor: "#D4AF37",
  },
  valueHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  valueStatement: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: "#000",
    marginRight: 8,
  },
  insightContainer: {
    marginTop: 10,
  },
  insightText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#8A8A8A",
  },
  insightActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 6,
  },
  insightButton: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  insightButtonText: {
    fontSize: 12,
    color: "#6B6B6B",
    fontWeight: "600",
  },
  weightText: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "600",
    marginTop: 8,
  },
  deleteButton: {
    backgroundColor: "#FFEBEE",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: "#C62828",
    fontSize: 14,
    fontWeight: "600",
  },
  valueActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    justifyContent: "flex-end",
  },
  editButton: {
    backgroundColor: "#E3F2FD",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  editButtonText: {
    color: "#1976D2",
    fontSize: 14,
    fontWeight: "600",
  },
  createSection: {
    marginBottom: 24,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    minHeight: 100,
    marginBottom: 12,
  },
  examplesLink: {
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  examplesLinkText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "600",
  },
  createButton: {
    backgroundColor: "#4CAF50",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  createButtonDisabled: {
    backgroundColor: "#C8E6C9",
  },
  createButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  hint: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    marginTop: 12,
  },
  guidanceBox: {
    backgroundColor: "#FFF3E0",
    padding: 16,
    borderRadius: 12,
  },
  guidanceText: {
    fontSize: 14,
    color: "#E65100",
    textAlign: "center",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  editModalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  editModalContent: {
    padding: 20,
  },
  editInput: {
    backgroundColor: "#F5F7FA",
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    minHeight: 120,
    marginBottom: 20,
    color: "#000",
  },
  editSaveButton: {
    backgroundColor: "#4CAF50",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  editSaveButtonDisabled: {
    backgroundColor: "#C8E6C9",
  },
  editSaveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  modalCloseButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  modalCloseText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalHint: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 20,
  },
  exampleCard: {
    backgroundColor: "#F5F7FA",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  exampleText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#000",
  },
});
