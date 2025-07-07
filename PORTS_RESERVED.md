# JIMBO INC CONTROL CENTER - RESERVED PORTS

## Port Allocation Table

**Range: 6020-6030 (Reserved for JIMBO INC business applications)**

| Port | Service | Status | Description |
|------|---------|--------|-------------|
| 6020 | MCP Server | Reserved | Model Context Protocol Server |
| 6021 | Reserved | Available | Future expansion |
| 6022 | Reserved | Available | Future expansion |
| 6023 | Reserved | Available | Future expansion |
| 6024 | Reserved | Available | Future expansion |
| 6025 | Main Dashboard | **ACTIVE** | JIMBO INC Control Center Flask App |
| 6026 | Reserved | Available | Future expansion |
| 6027 | Reserved | Available | Future expansion |
| 6028 | Reserved | Available | Future expansion |
| 6029 | Reserved | Available | Future expansion |
| 6030 | Reserved | Available | Future expansion |

## Usage Notes

- **Port 5000**: Heavily congested - AVOIDED
- **Range 6020-6030**: Clean slate for JIMBO INC applications
- **Current Active**: 6025 (Main Dashboard)
- **Available**: 6020-6024, 6026-6030 for future services

## Network Configuration

```bash
# Access URLs
Main Dashboard: http://127.0.0.1:6025
MCP Server: http://127.0.0.1:6020 (when activated)
```

**Status**: ✅ Port 6025 Active - JIMBO INC Control Center ready for business automation!
