import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
} from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import WeightAdjustmentModal from "../components/WeightAdjustmentModal";
import AffectedPrioritiesModal from "../components/AffectedPrioritiesModal";
import ValueListCard from "../components/values/ValueListCard";
import CreateValueForm from "../components/values/CreateValueForm";
import ExamplesModal from "../components/values/ExamplesModal";
import EditValueModal from "../components/values/EditValueModal";
import useValuesManagement, {
  getActiveRevision,
} from "../hooks/useValuesManagement";
import { styles } from "./styles/valuesManagementStyles";
import type { User, RootStackParamList } from "../types";

interface ValuesManagementProps {
  user: User;
  onLogout: () => void;
  navigation: NativeStackNavigationProp<RootStackParamList>;
}

export default function ValuesManagement({
  user,
  onLogout,
  navigation,
}: ValuesManagementProps): React.ReactElement {
  const vm = useValuesManagement(navigation);

  useFocusEffect(
    React.useCallback(() => {
      vm.loadValues();
    }, []),
  );

  const hasMinimumValues = vm.values.length >= 3;

  if (vm.loading) {
    return (
      <View style={styles.loadingContainer} accessibilityLabel="Loading values">
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Footer with Back to Dashboard */}
      <View style={styles.footerFullWidth}>
        <TouchableOpacity
          style={styles.backButtonFull}
          onPress={() => navigation.navigate("Dashboard")}
          accessibilityRole="button"
          accessibilityLabel="Back to dashboard"
        >
          <Text style={styles.backButtonFullText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Your Values</Text>
        <TouchableOpacity
          onPress={onLogout}
          style={styles.logoutButton}
          accessibilityRole="button"
          accessibilityLabel="Logout"
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Adjust Weights Button */}
      {hasMinimumValues && (
        <View style={styles.weightsButtonContainer}>
          <TouchableOpacity
            style={styles.weightsButton}
            onPress={() => vm.setShowWeightsModal(true)}
            accessibilityRole="button"
            accessibilityLabel="Adjust value weights"
          >
            <Text style={styles.weightsButtonIcon}>⚖️</Text>
            <Text style={styles.weightsButtonText}>Adjust Weights</Text>
            <Text style={styles.weightsButtonIcon}>⚖️</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Info Section */}
      {vm.values.length === 0 && (
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Why values?</Text>
          <Text style={styles.infoText}>
            Values help you understand what matters right now. They're not
            labels or ideals — they're commitments that guide your priorities.
          </Text>
        </View>
      )}

      <ScrollView
        ref={vm.scrollViewRef}
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Values List */}
        {vm.values.length > 0 && (
          <View style={styles.valuesList}>
            <Text style={styles.sectionTitle}>
              Your Values ({vm.values.length}/6)
            </Text>
            {vm.values.map((value) => (
              <ValueListCard
                key={value.id}
                value={value}
                activeRevision={getActiveRevision(value)}
                insight={vm.valueInsights[value.id]}
                isHighlighted={value.id === vm.highlightValueId}
                canDelete={vm.values.length > 3}
                onEdit={vm.handleStartEdit}
                onDelete={vm.handleDeleteValue}
                onReviewInsight={vm.handleReviewInsight}
                onKeepBoth={vm.handleKeepBoth}
                onLayout={(e) => {
                  vm.valuePositions.current[value.id] = e.nativeEvent.layout.y;
                }}
              />
            ))}
          </View>
        )}

        {/* Create New Value */}
        {vm.values.length < 6 && (
          <CreateValueForm
            valuesCount={vm.values.length}
            newStatement={vm.newStatement}
            onChangeText={vm.setNewStatement}
            onCreate={vm.handleCreateValue}
            onShowExamples={() => vm.setShowExamples(true)}
            onNavigateToDashboard={() => navigation.navigate("Dashboard")}
            isCreating={vm.creating}
          />
        )}

        {/* Guidance */}
        {vm.values.length > 0 && vm.values.length < 3 && (
          <View style={styles.guidanceBox}>
            <Text style={styles.guidanceText}>
              Add at least {3 - vm.values.length} more{" "}
              {3 - vm.values.length === 1 ? "value" : "values"} to continue.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Examples Modal */}
      <ExamplesModal
        visible={vm.showExamples}
        onClose={() => vm.setShowExamples(false)}
        onSelectExample={vm.handleSelectExample}
      />

      {/* Weight Adjustment Modal */}
      <Modal
        visible={vm.showWeightsModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => vm.setShowWeightsModal(false)}
      >
        <WeightAdjustmentModal
          values={vm.values}
          onSave={vm.handleSaveWeights}
          onCancel={() => vm.setShowWeightsModal(false)}
        />
      </Modal>

      {/* Affected Priorities Modal */}
      <AffectedPrioritiesModal
        visible={vm.showAffectedPrioritiesModal}
        priorities={vm.affectedPriorities}
        onContinue={vm.handleAffectedPrioritiesContinue}
        onReviewLinks={vm.handleAffectedPrioritiesReviewLinks}
        onClose={() => {
          vm.setShowAffectedPrioritiesModal(false);
          vm.setAffectedPriorities([]);
          vm.setPendingImpactInfo();
          vm.setLastEditedValueId();
        }}
      />

      {/* Edit Value Modal */}
      <EditValueModal
        visible={vm.editingValueId !== null}
        statement={vm.editingStatement}
        onChangeStatement={vm.setEditingStatement}
        onSave={vm.handleSaveEdit}
        onCancel={vm.handleCancelEdit}
        isSaving={vm.saving}
      />
    </View>
  );
}
