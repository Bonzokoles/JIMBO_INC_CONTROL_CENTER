# JIMBO INC Control Center
AI Business Automation Platform with integrated 3D Creator

## 🚀 Features
- **Dashboard**: Real-time system monitoring on port 6025
- **3D Creator**: Integrated 3D application on port 3050
- **AI Integration**: Built-in AI tools and automation
- **Business Libraries**: Organized file system for business data

## 📊 Ports
- **Main Dashboard**: http://localhost:6025
- **3D Creator App**: http://localhost:3050

## 🔧 Installation
1. Run `start_full_platform.bat` to launch both applications
2. Or run individually:
   - Dashboard: `python run.py`
   - 3D App: `cd 3D_APP && start.bat`

## 📁 Structure
```
JIMBO_INC_CONTROL_CENTER/
├── backend/           # Flask backend
├── frontend/          # Web interface
├── 3D_APP/           # Next.js 3D Creator
├── 3D_LIBRARY/       # 3D models storage
└── start_full_platform.bat  # Platform launcher
```

## ⚡ Quick Start
Double-click `start_full_platform.bat` or run from desktop shortcut.

Built with Flask, Next.js, Three.js, and Bootstrap.