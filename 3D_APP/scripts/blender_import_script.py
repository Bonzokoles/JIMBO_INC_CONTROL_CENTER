import bpy
import bmesh
import os
from mathutils import Vector

# Blender 4.4 Import Script for 3D Model Generator
# This script can be run directly in Blender's Python console

def clear_scene():
    """Clear all mesh objects from the scene"""
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False, confirm=False)
    print("Scene cleared")

def import_model_from_file(filepath):
    """Import model from file path"""
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return False
    
    file_ext = os.path.splitext(filepath)[1].lower()
    
    try:
        if file_ext in ['.glb', '.gltf']:
            bpy.ops.import_scene.gltf(filepath=filepath)
        elif file_ext == '.obj':
            bpy.ops.import_scene.obj(filepath=filepath)
        elif file_ext == '.fbx':
            bpy.ops.import_scene.fbx(filepath=filepath)
        else:
            print(f"Unsupported file format: {file_ext}")
            return False
        
        print(f"Successfully imported: {filepath}")
        return True
    except Exception as e:
        print(f"Import failed: {e}")
        return False

def setup_pbr_materials():
    """Setup PBR materials for all objects"""
    for obj in bpy.context.scene.objects:
        if obj.type == 'MESH':
            # Create new material if none exists
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
                    
                    print(f"Material {mat.name} setup complete")

def optimize_mesh():
    """Optimize all mesh objects"""
    for obj in bpy.context.scene.objects:
        if obj.type == 'MESH':
            # Select and make active
            bpy.context.view_layer.objects.active = obj
            obj.select_set(True)
            
            # Enter edit mode
            bpy.ops.object.mode_set(mode='EDIT')
            
            # Select all vertices
            bpy.ops.mesh.select_all(action='SELECT')
            
            # Remove doubles
            bpy.ops.mesh.remove_doubles(threshold=0.001)
            
            # Recalculate normals
            bpy.ops.mesh.normals_make_consistent(inside=False)
            
            # Exit edit mode
            bpy.ops.object.mode_set(mode='OBJECT')
            
            # Apply smooth shading
            bpy.ops.object.shade_smooth()
            
            print(f"Optimized mesh: {obj.name}")

def scale_objects(scale_factor=1.0):
    """Scale all selected objects"""
    for obj in bpy.context.selected_objects:
        if obj.type == 'MESH':
            obj.scale = (scale_factor, scale_factor, scale_factor)
    print(f"Scaled objects by factor: {scale_factor}")

def apply_transforms():
    """Apply scale, rotation, and location transforms"""
    for obj in bpy.context.selected_objects:
        if obj.type == 'MESH':
            bpy.context.view_layer.objects.active = obj
            bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    print("Transforms applied")

def setup_lighting():
    """Setup basic lighting for the scene"""
    # Remove default light
    if 'Light' in bpy.data.objects:
        bpy.data.objects.remove(bpy.data.objects['Light'], do_unlink=True)
    
    # Add key light
    bpy.ops.object.light_add(type='SUN', location=(5, 5, 10))
    key_light = bpy.context.object
    key_light.name = "Key_Light"
    key_light.data.energy = 3
    
    # Add fill light
    bpy.ops.object.light_add(type='AREA', location=(-5, 5, 5))
    fill_light = bpy.context.object
    fill_light.name = "Fill_Light"
    fill_light.data.energy = 1
    
    print("Lighting setup complete")

def setup_camera():
    """Position camera for optimal viewing"""
    if 'Camera' in bpy.data.objects:
        camera = bpy.data.objects['Camera']
        camera.location = (7, -7, 5)
        camera.rotation_euler = (1.1, 0, 0.785)
        print("Camera positioned")

# Main execution function
def main_import_workflow(filepath, scale=1.0, apply_trans=True, setup_mats=True):
    """Main workflow for importing and setting up a model"""
    print("Starting import workflow...")
    
    # Clear scene
    clear_scene()
    
    # Import model
    if not import_model_from_file(filepath):
        return False
    
    # Select all imported objects
    bpy.ops.object.select_all(action='SELECT')
    
    # Scale objects
    if scale != 1.0:
        scale_objects(scale)
    
    # Apply transforms
    if apply_trans:
        apply_transforms()
    
    # Setup materials
    if setup_mats:
        setup_pbr_materials()
    
    # Optimize meshes
    optimize_mesh()
    
    # Setup lighting and camera
    setup_lighting()
    setup_camera()
    
    print("Import workflow complete!")
    return True

# Example usage:
# main_import_workflow("/path/to/your/model.glb", scale=1.0, apply_trans=True, setup_mats=True)

print("Blender 4.4 import script loaded successfully!")
print("Use main_import_workflow('/path/to/model.glb') to import a model")
