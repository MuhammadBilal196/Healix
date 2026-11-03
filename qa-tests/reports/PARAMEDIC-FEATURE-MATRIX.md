# Paramedic Module Feature Matrix

*Updated: 2026-11-03. See [PARAMEDIC-MODULE-REPORT.md](PARAMEDIC-MODULE-REPORT.md).*

| Feature | Status | Notes |
| :--- | :--- | :--- |
| Login and routing | IMPLEMENTED | Routes to `/(paramedic)` |
| Dashboard | PARTIAL | Shared `EmergencyWorkspace` screen, no dedicated design |
| Availability | NOT_IMPLEMENTED | Selection uses verified status and current workload only |
| Emergency Assignment | IMPLEMENTED (backend) | Workload-balanced automatic assignment; admin reassignment |
| Dispatch | IMPLEMENTED | Dispatch list for the assigned paramedic |
| Patient Information | PARTIAL | Patient name on the dispatch card |
| Hospital Information | PARTIAL | Destination stored on the dispatch |
| Status Updates | IMPLEMENTED | En route / arrived / completed / cancelled buttons |
| Completion | IMPLEMENTED | Completion releases the ambulance |
| Emergency Communication | PARTIAL | Chat threads auto-created; no paramedic chat screen |
| Notifications | NOT_IMPLEMENTED | Push/SMS are console placeholders platform-wide |
| Chat/Calls | NOT_IMPLEMENTED | See Emergency Communication |
| Profile | NOT_IMPLEMENTED | |
| Settings | NOT_IMPLEMENTED | |
