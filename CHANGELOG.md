# Changelog

## v1.0.0 - 2025-10-25

### Initial Release

Complete industrial HMI application for Raspberry Pi 3 with OPC UA support.

#### Features
- Backend: Node.js + Express + WebSocket
- Frontend: React + Vite (SPA)
- OPC UA client with mock mode
- Real-time updates via WebSocket
- Historical data storage (SQLite)
- PIN authentication with JWT
- Role-based access control
- Touch-optimized UI
- Deployment automation scripts
- Comprehensive documentation

#### Bug Fixes (Initial Development)
- Fixed `historyStore.js`: Changed `await import('fs')` to direct import at module level
  - Added `existsSync` and `mkdirSync` to top-level imports
  - Removed async/await from `init()` method

#### Components
- **Backend**: 15 modules, ~2,500 lines
- **Frontend**: 12 components, ~2,000 lines
- **Documentation**: 5 comprehensive guides
- **Scripts**: 5 deployment/automation scripts

#### Testing
- Backend tested with mock OPC UA mode
- All API endpoints functional
- WebSocket real-time updates working
- Historical logging operational

#### Known Limitations
- Real OPC UA connection not tested with physical PLC
- Single language (English) support
- No email/SMS notifications yet

#### Next Steps
- Test with real PLC hardware
- Add multi-language support
- Implement notification system
- Add data export features
