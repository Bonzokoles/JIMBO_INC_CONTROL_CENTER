# ZEN_on_3D_CreatoR - Quick Start Guide

## 🚀 Quick Start

### Windows
Double-click `start.bat` to launch the application

### Linux/Mac
1. Make the script executable: `chmod +x start.sh`
2. Run: `./start.sh`

### Manual Start
```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

## 📝 Application Features

### New Features (Latest Update)
- ✅ **Enhanced Tier Options**: "Detail" and "Smooth" tiers available
- ✅ **High Quality Defaults**: Quality set to "high", Hyper mode enabled
- ✅ **HighPack Support**: Advanced processing option
- ✅ **Memory Leak Protection**: Optimized resource management
- ✅ **API Rate Limiting**: Production-ready resilience
- ✅ **Keyboard Shortcuts**: Enhanced UX

### Default Settings
- **Tier**: Detail
- **Quality**: High
- **Hyper Mode**: Enabled
- **HighPack**: Enabled
- **Format**: GLB

### Keyboard Shortcuts
- `Enter`: Submit form (desktop)
- `Shift+Enter`: New line
- `Ctrl+N`: New generation
- `Ctrl+R`: Regenerate
- `Ctrl+D`: Download model
- `Esc`: Cancel generation

## 🔧 Technical Information

### Requirements
- Node.js 18+ 
- pnpm (auto-installed if missing)

### Ports
- Development: http://localhost:3004
- Production build available via `pnpm build`

### Environment Variables
Create `.env.local` file:
```env
RODIN_API_KEY=your_api_key_here
RODIN_API_URL=https://api.hyperhuman.deemos.com
```

## 🎨 UI Features

### Branding
- Custom "ZEN_on_3D_CreatoR" branding
- Background animated text
- Professional UI with blur effects
- Responsive design

### Model Generation
- Image upload (drag & drop support)
- Text prompts
- Advanced options dialog
- Real-time progress tracking
- Model preview and download

## 🔒 Security & Performance

- Rate limiting: 10 requests per minute per IP
- Retry logic with exponential backoff
- Memory leak prevention
- Resource cleanup on component unmount
- TypeScript for type safety

## 📱 Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari
- Mobile browsers supported

---

**Created by ZEN_on_3D_CreatoR Team**  
*Advanced 3D Model Generation Platform*
