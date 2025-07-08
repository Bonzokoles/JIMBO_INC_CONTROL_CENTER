# AUTO-UPDATE SYSTEM for TRAINING_DATA.md

import os
import json
import datetime
from pathlib import Path

class TrainingDataUpdater:
    """
    Automatic updater for TRAINING_DATA.md based on dashboard changes
    Monitors file changes and updates training data for AI models
    """
    
    def __init__(self, project_root: str = None):
        self.project_root = project_root or os.path.dirname(os.path.abspath(__file__))
        self.training_file = os.path.join(self.project_root, 'TRAINING_DATA.md')
        self.last_update = datetime.datetime.now()
        self.version = "1.0.0"
        
        # Files to monitor for changes
        self.monitored_files = [
            'backend/server.py',
            'backend/assistant_routes.py',
            'backend/dashboard_assistant.py',
            'frontend/templates/dashboard.html',
            'frontend/static/js/assistant.js',
            'frontend/static/js/dashboard.js'
        ]
        
        # Track features and capabilities
        self.features_tracker = {
            'api_endpoints': set(),
            'dashboard_sections': set(),
            'ai_models': set(),
            'libraries': set(),
            'tools': set()
        }
    
    def detect_changes(self) -> dict:
        """Detect changes in monitored files"""
        changes = {
            'modified_files': [],
            'new_features': [],
            'api_changes': [],
            'ui_changes': []
        }
        
        for file_path in self.monitored_files:
            full_path = os.path.join(self.project_root, file_path)
            if os.path.exists(full_path):
                mod_time = os.path.getmtime(full_path)
                if mod_time > self.last_update.timestamp():
                    changes['modified_files'].append(file_path)
                    
                    # Analyze specific changes
                    if 'server.py' in file_path or 'assistant_routes.py' in file_path:
                        changes['api_changes'].extend(self._extract_api_endpoints(full_path))
                    
                    if 'dashboard.html' in file_path or '.js' in file_path:
                        changes['ui_changes'].extend(self._extract_ui_features(full_path))
        
        return changes
    
    def _extract_api_endpoints(self, file_path: str) -> list:
        """Extract API endpoints from Python files"""
        endpoints = []
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
                # Find Flask routes
                import re
                route_pattern = r"@app\.route\(['\"]([^'\"]+)['\"].*?methods=\[([^\]]+)\]"
                matches = re.findall(route_pattern, content)
                
                for route, methods in matches:
                    endpoints.append({
                        'endpoint': route,
                        'methods': methods.replace("'", "").replace('"', ''),
                        'file': file_path
                    })
        
        except Exception as e:
            print(f"Error extracting endpoints from {file_path}: {e}")
        
        return endpoints
    
    def _extract_ui_features(self, file_path: str) -> list:
        """Extract UI features from HTML/JS files"""
        features = []
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
                # Find data-section attributes (dashboard sections)
                import re
                if '.html' in file_path:
                    section_pattern = r'data-section=["\']([^"\']+)["\']'
                    sections = re.findall(section_pattern, content)
                    features.extend([{'type': 'section', 'name': s} for s in sections])
                
                # Find function definitions in JS
                if '.js' in file_path:
                    function_pattern = r'function\s+(\w+)\s*\('
                    functions = re.findall(function_pattern, content)
                    features.extend([{'type': 'function', 'name': f} for f in functions])
        
        except Exception as e:
            print(f"Error extracting UI features from {file_path}: {e}")
        
        return features
    
    def update_training_data(self, changes: dict):
        """Update TRAINING_DATA.md with detected changes"""
        
        # Read current training data
        current_content = ""
        if os.path.exists(self.training_file):
            with open(self.training_file, 'r', encoding='utf-8') as f:
                current_content = f.read()
        
        # Update header with new timestamp and version
        updated_content = self._update_header(current_content)
        
        # Add new API endpoints if found
        if changes['api_changes']:
            updated_content = self._update_api_section(updated_content, changes['api_changes'])
        
        # Add new UI features if found
        if changes['ui_changes']:
            updated_content = self._update_ui_section(updated_content, changes['ui_changes'])
        
        # Add changelog entry
        updated_content = self._add_changelog_entry(updated_content, changes)
        
        # Write updated content
        with open(self.training_file, 'w', encoding='utf-8') as f:
            f.write(updated_content)
        
        print(f"TRAINING_DATA.md updated with {len(changes['modified_files'])} file changes")
    
    def _update_header(self, content: str) -> str:
        """Update document header with new timestamp and version"""
        import re
        
        # Update timestamp
        timestamp_pattern = r'\*\*Last Updated:\*\* \d{4}-\d{2}-\d{2}'
        new_timestamp = f"**Last Updated:** {datetime.datetime.now().strftime('%Y-%m-%d')}"
        content = re.sub(timestamp_pattern, new_timestamp, content)
        
        # Increment version (simple increment for now)
        version_pattern = r'\*\*Version:\*\* (\d+)\.(\d+)\.(\d+)'
        
        def increment_version(match):
            major, minor, patch = map(int, match.groups())
            patch += 1
            return f"**Version:** {major}.{minor}.{patch}"
        
        content = re.sub(version_pattern, increment_version, content)
        
        return content
    
    def _update_api_section(self, content: str, new_endpoints: list) -> str:
        """Update API endpoints section"""
        
        # Find API section
        api_section_start = content.find("## 🔧 API ENDPOINTS")
        if api_section_start == -1:
            return content
        
        # Add new endpoints to the section
        new_endpoints_text = "\n// Newly detected endpoints\n"
        for endpoint in new_endpoints:
            new_endpoints_text += f"{endpoint['methods']} {endpoint['endpoint']}\n"
        
        # Insert before the next section
        next_section = content.find("\n---", api_section_start)
        if next_section != -1:
            content = content[:next_section] + new_endpoints_text + content[next_section:]
        
        return content
    
    def _update_ui_section(self, content: str, new_features: list) -> str:
        """Update UI features section"""
        
        # Add new sections if found
        sections = [f for f in new_features if f['type'] == 'section']
        if sections:
            section_text = "\n### Newly Detected Sections\n"
            for section in sections:
                section_text += f"- **{section['name']}:** Auto-detected dashboard section\n"
            
            # Find appropriate place to insert
            dashboard_section = content.find("## 📊 DASHBOARD SECTIONS & CAPABILITIES")
            if dashboard_section != -1:
                next_section = content.find("\n---", dashboard_section)
                if next_section != -1:
                    content = content[:next_section] + section_text + content[next_section:]
        
        return content
    
    def _add_changelog_entry(self, content: str, changes: dict) -> str:
        """Add changelog entry at the end"""
        
        changelog_entry = f"""

---

## 📝 RECENT CHANGES - {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

### Modified Files:
{chr(10).join([f"- {file}" for file in changes['modified_files']])}

### API Changes:
{chr(10).join([f"- {ep['methods']} {ep['endpoint']}" for ep in changes['api_changes']])}

### UI Changes:
{chr(10).join([f"- {change['type']}: {change['name']}" for change in changes['ui_changes']])}

*Auto-generated by TrainingDataUpdater*
"""
        
        return content + changelog_entry
    
    def run_update_check(self):
        """Main method to check for changes and update training data"""
        print("Checking for dashboard changes...")
        
        changes = self.detect_changes()
        
        if changes['modified_files']:
            print(f"Detected changes in {len(changes['modified_files'])} files")
            self.update_training_data(changes)
            self.last_update = datetime.datetime.now()
        else:
            print("No changes detected")
    
    def monitor_continuous(self, interval_seconds: int = 300):
        """Continuously monitor for changes every interval_seconds"""
        import time
        
        print(f"Starting continuous monitoring (every {interval_seconds} seconds)")
        
        while True:
            try:
                self.run_update_check()
                time.sleep(interval_seconds)
            except KeyboardInterrupt:
                print("Monitoring stopped by user")
                break
            except Exception as e:
                print(f"Error during monitoring: {e}")
                time.sleep(interval_seconds)

def main():
    """Main function for command line usage"""
    import sys
    
    updater = TrainingDataUpdater()
    
    if len(sys.argv) > 1:
        if sys.argv[1] == "monitor":
            # Continuous monitoring mode
            interval = int(sys.argv[2]) if len(sys.argv) > 2 else 300
            updater.monitor_continuous(interval)
        elif sys.argv[1] == "check":
            # Single check mode
            updater.run_update_check()
        else:
            print("Usage: python training_data_updater.py [check|monitor] [interval_seconds]")
    else:
        # Default: single check
        updater.run_update_check()

if __name__ == "__main__":
    main()
