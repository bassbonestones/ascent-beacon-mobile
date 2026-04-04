import React from "react";
import ValuesManagement from "./ValuesManagement";

// ValuesDiscovery component - uses ValuesManagement which has full editing capabilities
export default function ValuesDiscovery({ user, onLogout, navigation }) {
  // Adapt properties for ValuesManagement
  return <ValuesManagement user={user} onLogout={onLogout} navigation={navigation} />;
}
