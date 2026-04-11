import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from "react-native";
import type { Task } from "../../types";
import api from "../../services/api";

interface TaskSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (task: Task) => void;
  excludeTaskIds: string[];
  currentTaskId?: string;
}

export function TaskSearchModal({
  visible,
  onClose,
  onSelect,
  excludeTaskIds,
  currentTaskId,
}: TaskSearchModalProps): React.ReactElement {
  const [searchQuery, setSearchQuery] = useState("");
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  // Load all tasks when modal opens
  useEffect(() => {
    if (visible) {
      loadTasks();
    }
  }, [visible]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const response = await api.getTasks({ include_completed: false });
      // Filter out excluded tasks and current task
      const filtered = response.tasks.filter(
        (t) => !excludeTaskIds.includes(t.id) && t.id !== currentTaskId,
      );
      setAllTasks(filtered);
    } catch {
      setAllTasks([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter tasks based on search query
  const filteredTasks = searchQuery.trim()
    ? allTasks.filter((t) =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : allTasks;

  const handleSelect = (task: Task) => {
    onSelect(task);
    setSearchQuery("");
    onClose();
  };

  const handleClose = () => {
    setSearchQuery("");
    onClose();
  };

  const renderTaskItem = ({ item }: { item: Task }) => (
    <TouchableOpacity
      style={searchStyles.taskItem}
      onPress={() => handleSelect(item)}
      accessibilityRole="button"
      accessibilityLabel={`Select ${item.title}`}
    >
      <View style={searchStyles.taskInfo}>
        <Text style={searchStyles.taskTitle} numberOfLines={1}>
          {item.title}
        </Text>
        {item.is_recurring && (
          <Text style={searchStyles.taskRecurring}>🔄 Recurring</Text>
        )}
      </View>
      <Text style={searchStyles.selectIcon}>+</Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={searchStyles.overlay}>
        <View style={searchStyles.container}>
          <View style={searchStyles.header}>
            <Text style={searchStyles.title}>Add Prerequisite</Text>
            <TouchableOpacity
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Text style={searchStyles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={searchStyles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search tasks..."
            placeholderTextColor="#6B7280"
            autoFocus
            accessibilityLabel="Search tasks"
          />

          {loading && (
            <ActivityIndicator
              style={searchStyles.loader}
              size="small"
              color="#3B82F6"
            />
          )}

          {!loading && filteredTasks.length === 0 && (
            <Text style={searchStyles.noResults}>
              {searchQuery.trim() ? "No matching tasks" : "No tasks available"}
            </Text>
          )}

          <FlatList
            data={filteredTasks}
            renderItem={renderTaskItem}
            keyExtractor={(item) => item.id}
            style={searchStyles.resultsList}
          />
        </View>
      </View>
    </Modal>
  );
}

const searchStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#1F2937",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#F9FAFB",
  },
  closeButton: {
    fontSize: 20,
    color: "#9CA3AF",
    padding: 4,
  },
  searchInput: {
    backgroundColor: "#374151",
    borderRadius: 8,
    padding: 12,
    color: "#F9FAFB",
    fontSize: 16,
    marginBottom: 12,
  },
  loader: {
    marginVertical: 20,
  },
  noResults: {
    color: "#9CA3AF",
    textAlign: "center",
    marginVertical: 20,
  },
  resultsList: {
    maxHeight: 300,
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#374151",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    color: "#F9FAFB",
    fontSize: 16,
    fontWeight: "500",
  },
  taskRecurring: {
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 2,
  },
  selectIcon: {
    color: "#3B82F6",
    fontSize: 24,
    fontWeight: "bold",
    marginLeft: 12,
  },
});
