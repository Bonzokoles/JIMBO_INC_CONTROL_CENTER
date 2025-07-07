"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Download, Layers, Copy } from "lucide-react"

interface BlenderBridgeProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  modelUrl?: string | null
}

export default function BlenderBridge({ open, onOpenChange, modelUrl }: BlenderBridgeProps) {
  const [activeTab, setActiveTab] = useState("import")
  const [blenderVersion, setBlenderVersion] = useState("4.4")
  const [importSettings, setImportSettings] = useState({
    scale: "1.0",
    applyTransforms: true,
    importMaterials: true,
    importTextures: true,
    smoothShading: true,
  })
  const [exportSettings, setExportSettings] = useState({
    format: "glb",
    includeAnimations: false,
    optimizeGeometry: true,
    bakeLighting: false,
  })
  const isDesktop = useMediaQuery("(min-width: 768px)")

  // Generuj skrypt Pythona dla Blendera
  const generateBlenderScript = () => {
    return `import bpy
import bmesh
import os
from mathutils import Vector

# Blender 4.4 Import Script for ZEN_on_3D_CreatoR
# Generated automatically - paste into Blender's Text Editor and run

def import_model_from_url():
    """Import model from generated URL"""
    model_url = "${modelUrl || "YOUR_MODEL_URL_HERE"}"
    
    # Clear existing mesh objects
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False, confirm=False)
    
    # Import GLB/GLTF file
    if model_url.endswith('.glb') or model_url.endswith('.gltf'):
        bpy.ops.import_scene.gltf(filepath=model_url)
    elif model_url.endswith('.obj'):
        bpy.ops.import_scene.obj(filepath=model_url)
    elif model_url.endswith('.fbx'):
        bpy.ops.import_scene.fbx(filepath=model_url)
    
    # Apply import settings
    for obj in bpy.context.selected_objects:
        if obj.type == 'MESH':
            # Scale object
            obj.scale = (${importSettings.scale}, ${importSettings.scale}, ${importSettings.scale})
            
            # Apply transforms if enabled
            ${
              importSettings.applyTransforms
                ? `
            bpy.context.view_layer.objects.active = obj
            bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
            `
                : ""
            }
            
            # Apply smooth shading if enabled
            ${
              importSettings.smoothShading
                ? `
            bpy.context.view_layer.objects.active = obj
            bpy.ops.object.shade_smooth()
            `
                : ""
            }
    
    print("Model imported successfully!")

def setup_materials():
    """Setup PBR materials for imported model"""
    for obj in bpy.context.scene.objects:
        if obj.type == 'MESH' and obj.data.materials:
            for mat in obj.data.materials:
                if mat and mat.use_nodes:
                    # Setup basic PBR node tree
                    nodes = mat.node_tree.nodes
                    links = mat.node_tree.links
                    
                    # Clear existing nodes
                    nodes.clear()
                    
                    # Add Principled BSDF
                    bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
                    bsdf.location = (0, 0)
                    
                    # Add Material Output
                    output = nodes.new(type='ShaderNodeOutputMaterial')
                    output.location = (300, 0)
                    
                    # Link BSDF to output
                    links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])
                    
                    print(f"Material {mat.name} setup complete")

def optimize_mesh():
    """Optimize mesh for better performance"""
    for obj in bpy.context.selected_objects:
        if obj.type == 'MESH':
            bpy.context.view_layer.objects.active = obj
            bpy.ops.object.mode_set(mode='EDIT')
            
            # Remove doubles
            bpy.ops.mesh.remove_doubles(threshold=0.001)
            
            # Recalculate normals
            bpy.ops.mesh.normals_make_consistent(inside=False)
            
            bpy.ops.object.mode_set(mode='OBJECT')
            print(f"Mesh {obj.name} optimized")

def export_model(filepath, format='glb'):
    """Export model in specified format"""
    if format == 'glb':
        bpy.ops.export_scene.gltf(
            filepath=filepath,
            export_format='GLB',
            export_animations=${exportSettings.includeAnimations},
            export_apply=${exportSettings.optimizeGeometry}
        )
    elif format == 'obj':
        bpy.ops.export_scene.obj(filepath=filepath)
    elif format == 'fbx':
        bpy.ops.export_scene.fbx(filepath=filepath)
    
    print(f"Model exported to {filepath}")

# Main execution
if __name__ == "__main__":
    import_model_from_url()
    ${importSettings.importMaterials ? "setup_materials()" : ""}
    optimize_mesh()
    print("Import complete! Ready for editing in Blender 4.4")
`
  }

  // Generuj addon dla Blendera
  const generateBlenderAddon = () => {
    return `bl_info = {
    "name": "ZEN_on_3D_CreatoR Bridge",
    "author": "ZEN_on_3D_CreatoR",
    "version": (1, 0, 0),
    "blender": (4, 4, 0),
    "location": "View3D > Sidebar > 3D Gen",
    "description": "Bridge for importing models from ZEN_on_3D_CreatoR",
    "category": "Import-Export",
}

import bpy
import requests
import tempfile
import os
from bpy.props import StringProperty, BoolProperty, FloatProperty
from bpy.types import Panel, Operator

class MESH_OT_import_from_generator(Operator):
    """Import model from ZEN_on_3D_CreatoR"""
    bl_idname = "mesh.import_from_generator"
    bl_label = "Import from Generator"
    bl_options = {'REGISTER', 'UNDO'}
    
    url: StringProperty(
        name="Model URL",
        description="URL of the generated model",
        default=""
    )
    
    scale: FloatProperty(
        name="Scale",
        description="Import scale",
        default=1.0,
        min=0.1,
        max=10.0
    )
    
    apply_transforms: BoolProperty(
        name="Apply Transforms",
        description="Apply scale, rotation, and location",
        default=True
    )
    
    def execute(self, context):
        if not self.url:
            self.report({'ERROR'}, "Please provide a model URL")
            return {'CANCELLED'}
        
        try:
            # Download model to temp file
            response = requests.get(self.url)
            response.raise_for_status()
            
            # Create temp file
            with tempfile.NamedTemporaryFile(delete=False, suffix='.glb') as temp_file:
                temp_file.write(response.content)
                temp_path = temp_file.name
            
            # Import the model
            bpy.ops.import_scene.gltf(filepath=temp_path)
            
            # Apply settings
            for obj in context.selected_objects:
                if obj.type == 'MESH':
                    obj.scale = (self.scale, self.scale, self.scale)
                    
                    if self.apply_transforms:
                        context.view_layer.objects.active = obj
                        bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
            
            # Clean up temp file
            os.unlink(temp_path)
            
            self.report({'INFO'}, "Model imported successfully")
            return {'FINISHED'}
            
        except Exception as e:
            self.report({'ERROR'}, f"Import failed: {str(e)}")
            return {'CANCELLED'}

class VIEW3D_PT_model_generator_panel(Panel):
    """Panel for ZEN_on_3D_CreatoR tools"""
    bl_label = "ZEN_on_3D_CreatoR"
    bl_idname = "VIEW3D_PT_model_generator"
    bl_space_type = 'VIEW_3D'
    bl_region_type = 'UI'
    bl_category = "3D Gen"
    
    def draw(self, context):
        layout = self.layout
        
        # Import section
        box = layout.box()
        box.label(text="Import Model", icon='IMPORT')
        box.operator("mesh.import_from_generator")
        
        # Quick tools
        box = layout.box()
        box.label(text="Quick Tools", icon='TOOL_SETTINGS')
        box.operator("object.shade_smooth", text="Smooth Shading")
        box.operator("mesh.remove_doubles", text="Remove Doubles")

def register():
    bpy.utils.register_class(MESH_OT_import_from_generator)
    bpy.utils.register_class(VIEW3D_PT_model_generator_panel)

def unregister():
    bpy.utils.unregister_class(MESH_OT_import_from_generator)
    bpy.utils.unregister_class(VIEW3D_PT_model_generator_panel)

if __name__ == "__main__":
    register()
`
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const content = (
    <div className="py-2">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="import" className="tracking-normal">
            Import
          </TabsTrigger>
          <TabsTrigger value="script" className="tracking-normal">
            Script
          </TabsTrigger>
          <TabsTrigger value="addon" className="tracking-normal">
            Addon
          </TabsTrigger>
          <TabsTrigger value="export" className="tracking-normal">
            Export
          </TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-white font-mono tracking-normal">Blender Version</Label>
              <Select value={blenderVersion} onValueChange={setBlenderVersion}>
                <SelectTrigger className="w-32 bg-black border-[rgba(255,255,255,0.12)] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black border-[rgba(255,255,255,0.12)] text-white">
                  <SelectItem value="4.4">4.4 LTS</SelectItem>
                  <SelectItem value="4.3">4.3</SelectItem>
                  <SelectItem value="4.2">4.2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-white font-mono tracking-normal">Import Settings</Label>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-400">Scale</Label>
                  <Select
                    value={importSettings.scale}
                    onValueChange={(value) => setImportSettings((prev) => ({ ...prev, scale: value }))}
                  >
                    <SelectTrigger className="bg-black border-[rgba(255,255,255,0.12)] text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-[rgba(255,255,255,0.12)] text-white">
                      <SelectItem value="0.1">0.1x</SelectItem>
                      <SelectItem value="0.5">0.5x</SelectItem>
                      <SelectItem value="1.0">1.0x</SelectItem>
                      <SelectItem value="2.0">2.0x</SelectItem>
                      <SelectItem value="10.0">10.0x</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-gray-400">Apply Transforms</Label>
                  <Switch
                    checked={importSettings.applyTransforms}
                    onCheckedChange={(checked) => setImportSettings((prev) => ({ ...prev, applyTransforms: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-sm text-gray-400">Import Materials</Label>
                  <Switch
                    checked={importSettings.importMaterials}
                    onCheckedChange={(checked) => setImportSettings((prev) => ({ ...prev, importMaterials: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-sm text-gray-400">Smooth Shading</Label>
                  <Switch
                    checked={importSettings.smoothShading}
                    onCheckedChange={(checked) => setImportSettings((prev) => ({ ...prev, smoothShading: checked }))}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => downloadFile(generateBlenderScript(), "import_model.py")}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Script
              </Button>

              <Button
                onClick={() => copyToClipboard(modelUrl || "")}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy URL
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="script" className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-white font-mono tracking-normal">Python Script for Blender</Label>
              <Button
                onClick={() => copyToClipboard(generateBlenderScript())}
                size="sm"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </div>

            <Textarea
              value={generateBlenderScript()}
              readOnly
              className="h-64 bg-black border-[rgba(255,255,255,0.12)] text-white font-mono text-xs"
            />

            <div className="bg-gray-900/50 p-3 rounded-lg">
              <Label className="text-sm text-yellow-400 font-mono">Instructions:</Label>
              <ol className="text-xs text-gray-300 mt-2 space-y-1 list-decimal list-inside">
                <li>Open Blender 4.4</li>
                <li>Go to Scripting workspace</li>
                <li>Create new text file</li>
                <li>Paste the script above</li>
                <li>Click "Run Script" or press Alt+P</li>
              </ol>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="addon" className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-white font-mono tracking-normal">Blender Addon</Label>
              <Button
                onClick={() => downloadFile(generateBlenderAddon(), "3d_model_generator_bridge.py")}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Addon
              </Button>
            </div>

            <div className="bg-gray-900/50 p-4 rounded-lg space-y-3">
              <Label className="text-sm text-green-400 font-mono">Installation Steps:</Label>
              <ol className="text-xs text-gray-300 space-y-2 list-decimal list-inside">
                <li>Download the addon file above</li>
                <li>Open Blender 4.4</li>
                <li>Go to Edit → Preferences → Add-ons</li>
                <li>Click "Install..." and select the downloaded file</li>
                <li>Enable "ZEN_on_3D_CreatoR Bridge" addon</li>
                <li>Find the panel in 3D Viewport → Sidebar → 3D Gen tab</li>
              </ol>
            </div>

            <div className="bg-blue-900/30 p-3 rounded-lg">
              <Label className="text-sm text-blue-400 font-mono">Features:</Label>
              <ul className="text-xs text-gray-300 mt-2 space-y-1 list-disc list-inside">
                <li>Direct import from URL</li>
                <li>Automatic scaling and transforms</li>
                <li>Material setup tools</li>
                <li>Quick optimization functions</li>
              </ul>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <div className="space-y-4">
            <Label className="text-white font-mono tracking-normal">Export from Blender</Label>

            <div className="space-y-3">
              <div>
                <Label className="text-sm text-gray-400">Export Format</Label>
                <Select
                  value={exportSettings.format}
                  onValueChange={(value) => setExportSettings((prev) => ({ ...prev, format: value }))}
                >
                  <SelectTrigger className="bg-black border-[rgba(255,255,255,0.12)] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-[rgba(255,255,255,0.12)] text-white">
                    <SelectItem value="glb">GLB (Recommended)</SelectItem>
                    <SelectItem value="gltf">GLTF</SelectItem>
                    <SelectItem value="fbx">FBX</SelectItem>
                    <SelectItem value="obj">OBJ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-gray-400">Include Animations</Label>
                  <Switch
                    checked={exportSettings.includeAnimations}
                    onCheckedChange={(checked) =>
                      setExportSettings((prev) => ({ ...prev, includeAnimations: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-sm text-gray-400">Optimize Geometry</Label>
                  <Switch
                    checked={exportSettings.optimizeGeometry}
                    onCheckedChange={(checked) => setExportSettings((prev) => ({ ...prev, optimizeGeometry: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-sm text-gray-400">Bake Lighting</Label>
                  <Switch
                    checked={exportSettings.bakeLighting}
                    onCheckedChange={(checked) => setExportSettings((prev) => ({ ...prev, bakeLighting: checked }))}
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-900/50 p-3 rounded-lg">
              <Label className="text-sm text-purple-400 font-mono">Export Steps:</Label>
              <ol className="text-xs text-gray-300 mt-2 space-y-1 list-decimal list-inside">
                <li>Select objects to export</li>
                <li>File → Export → {exportSettings.format.toUpperCase()}</li>
                <li>Apply settings above</li>
                <li>Choose export location</li>
                <li>Click "Export {exportSettings.format.toUpperCase()}"</li>
              </ol>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-black border-[rgba(255,255,255,0.12)] text-white max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl text-white font-mono tracking-normal flex items-center">
              <Layers className="h-5 w-5 mr-2" />
              Blender 4.4 Bridge
            </DialogTitle>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-black border-t border-[rgba(255,255,255,0.12)] text-white max-h-[90vh]">
        <div className="mx-auto w-full max-w-md">
          <DrawerHeader>
            <DrawerTitle className="text-xl text-white font-mono tracking-normal flex items-center justify-center">
              <Layers className="h-5 w-5 mr-2" />
              Blender 4.4 Bridge
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 overflow-y-auto max-h-[60vh]">{content}</div>
          <DrawerFooter>
            <Button
              onClick={() => onOpenChange(false)}
              className="bg-gray-800 hover:bg-gray-700 text-white tracking-normal"
            >
              Close
            </Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
