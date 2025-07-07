import bpy
import os
import shutil
import tempfile

# Blender Addon Auto-installer for 3D Model Generator Bridge

def install_addon():
    """Install the 3D Model Generator Bridge addon"""
    
    addon_code = '''bl_info = {
    "name": "3D Model Generator Bridge",
    "author": "3D Model Generator",
    "version": (1, 0, 0),
    "blender": (4, 4, 0),
    "location": "View3D > Sidebar > 3D Gen",
    "description": "Bridge for importing models from 3D Model Generator",
    "category": "Import-Export",
}

import bpy
import requests
import tempfile
import os
from bpy.props import StringProperty, BoolProperty, FloatProperty, EnumProperty
from bpy.types import Panel, Operator

class MESH_OT_import_from_generator(Operator):
    """Import model from 3D Model Generator"""
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
    
    setup_materials: BoolProperty(
        name="Setup Materials",
        description="Setup PBR materials",
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
            
            # Determine file extension
            if '.glb' in self.url:
                suffix = '.glb'
            elif '.gltf' in self.url:
                suffix = '.gltf'
            elif '.fbx' in self.url:
                suffix = '.fbx'
            elif '.obj' in self.url:
                suffix = '.obj'
            else:
                suffix = '.glb'  # Default
            
            # Create temp file
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
                temp_file.write(response.content)
                temp_path = temp_file.name
            
            # Clear existing selection
            bpy.ops.object.select_all(action='DESELECT')
            
            # Import the model
            if suffix in ['.glb', '.gltf']:
                bpy.ops.import_scene.gltf(filepath=temp_path)
            elif suffix == '.fbx':
                bpy.ops.import_scene.fbx(filepath=temp_path)
            elif suffix == '.obj':
                bpy.ops.import_scene.obj(filepath=temp_path)
            
            # Apply settings to imported objects
            for obj in context.selected_objects:
                if obj.type == 'MESH':
                    obj.scale = (self.scale, self.scale, self.scale)
                    
                    if self.apply_transforms:
                        context.view_layer.objects.active = obj
                        bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
                    
                    if self.setup_materials:
                        self.setup_pbr_material(obj)
            
            # Clean up temp file
            os.unlink(temp_path)
            
            self.report({'INFO'}, f"Model imported successfully from {self.url}")
            return {'FINISHED'}
            
        except Exception as e:
            self.report({'ERROR'}, f"Import failed: {str(e)}")
            return {'CANCELLED'}
    
    def setup_pbr_material(self, obj):
        """Setup PBR material for object"""
        if not obj.data.materials:
            mat = bpy.data.materials.new(name=f"{obj.name}_Material")
            obj.data.materials.append(mat)
        
        for mat in obj.data.materials:
            if mat and not mat.use_nodes:
                mat.use_nodes = True
            
            if mat and mat.use_nodes:
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

class MESH_OT_optimize_imported(Operator):
    """Optimize imported mesh"""
    bl_idname = "mesh.optimize_imported"
    bl_label = "Optimize Mesh"
    bl_options = {'REGISTER', 'UNDO'}
    
    def execute(self, context):
        for obj in context.selected_objects:
            if obj.type == 'MESH':
                context.view_layer.objects.active = obj
                bpy.ops.object.mode_set(mode='EDIT')
                bpy.ops.mesh.select_all(action='SELECT')
                bpy.ops.mesh.remove_doubles(threshold=0.001)
                bpy.ops.mesh.normals_make_consistent(inside=False)
                bpy.ops.object.mode_set(mode='OBJECT')
                bpy.ops.object.shade_smooth()
        
        self.report({'INFO'}, "Mesh optimization complete")
        return {'FINISHED'}

class VIEW3D_PT_model_generator_panel(Panel):
    """Panel for 3D Model Generator tools"""
    bl_label = "3D Model Generator"
    bl_idname = "VIEW3D_PT_model_generator"
    bl_space_type = 'VIEW_3D'
    bl_region_type = 'UI'
    bl_category = "3D Gen"
    
    def draw(self, context):
        layout = self.layout
        
        # Import section
        box = layout.box()
        box.label(text="Import Model", icon='IMPORT')
        
        # URL input
        row = box.row()
        row.prop(context.scene, "model_generator_url", text="URL")
        
        # Import settings
        col = box.column()
        col.prop(context.scene, "model_generator_scale", text="Scale")
        col.prop(context.scene, "model_generator_apply_transforms", text="Apply Transforms")
        col.prop(context.scene, "model_generator_setup_materials", text="Setup Materials")
        
        # Import button
        op = box.operator("mesh.import_from_generator", text="Import Model", icon='IMPORT')
        op.url = context.scene.model_generator_url
        op.scale = context.scene.model_generator_scale
        op.apply_transforms = context.scene.model_generator_apply_transforms
        op.setup_materials = context.scene.model_generator_setup_materials
        
        # Quick tools
        box = layout.box()
        box.label(text="Quick Tools", icon='TOOL_SETTINGS')
        box.operator("mesh.optimize_imported", text="Optimize Selected", icon='MOD_REMESH')
        box.operator("object.shade_smooth", text="Smooth Shading", icon='MOD_SMOOTH')

def register():
    bpy.utils.register_class(MESH_OT_import_from_generator)
    bpy.utils.register_class(MESH_OT_optimize_imported)
    bpy.utils.register_class(VIEW3D_PT_model_generator_panel)
    
    # Add scene properties
    bpy.types.Scene.model_generator_url = bpy.props.StringProperty(
        name="Model URL",
        description="URL of the generated model",
        default=""
    )
    bpy.types.Scene.model_generator_scale = bpy.props.FloatProperty(
        name="Scale",
        description="Import scale",
        default=1.0,
        min=0.1,
        max=10.0
    )
    bpy.types.Scene.model_generator_apply_transforms = bpy.props.BoolProperty(
        name="Apply Transforms",
        description="Apply scale, rotation, and location",
        default=True
    )
    bpy.types.Scene.model_generator_setup_materials = bpy.props.BoolProperty(
        name="Setup Materials",
        description="Setup PBR materials",
        default=True
    )

def unregister():
    bpy.utils.unregister_class(MESH_OT_import_from_generator)
    bpy.utils.unregister_class(MESH_OT_optimize_imported)
    bpy.utils.unregister_class(VIEW3D_PT_model_generator_panel)
    
    # Remove scene properties
    del bpy.types.Scene.model_generator_url
    del bpy.types.Scene.model_generator_scale
    del bpy.types.Scene.model_generator_apply_transforms
    del bpy.types.Scene.model_generator_setup_materials

if __name__ == "__main__":
    register()
'''
    
    # Get Blender's addon directory
    addon_dir = bpy.utils.user_resource('SCRIPTS', "addons")
    addon_path = os.path.join(addon_dir, "3d_model_generator_bridge.py")
    
    try:
        # Write addon file
        with open(addon_path, 'w') as f:
            f.write(addon_code)
        
        print(f"Addon installed to: {addon_path}")
        
        # Try to enable the addon
        bpy.ops.preferences.addon_enable(module="3d_model_generator_bridge")
        print("Addon enabled successfully!")
        
        return True
        
    except Exception as e:
        print(f"Failed to install addon: {e}")
        return False

def check_addon_installed():
    """Check if the addon is already installed"""
    addon_dir = bpy.utils.user_resource('SCRIPTS', "addons")
    addon_path = os.path.join(addon_dir, "3d_model_generator_bridge.py")
    return os.path.exists(addon_path)

# Main execution
if __name__ == "__main__":
    if check_addon_installed():
        print("3D Model Generator Bridge addon is already installed!")
        try:
            bpy.ops.preferences.addon_enable(module="3d_model_generator_bridge")
            print("Addon enabled!")
        except:
            print("Addon found but couldn't enable. Try manually enabling in Preferences > Add-ons")
    else:
        print("Installing 3D Model Generator Bridge addon...")
        if install_addon():
            print("Installation complete! Check the 3D Viewport sidebar for the '3D Gen' tab.")
        else:
            print("Installation failed. Please install manually.")
