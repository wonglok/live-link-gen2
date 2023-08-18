
import json
import sys
import bpy
import threading
import time
from mathutils import Euler, Matrix, Quaternion, Vector
from math import cos, pi, sin, tan
from random import TWOPI, randint, uniform

argv = sys.argv
argv = argv[argv.index("--") + 1:]  # get all args after "--"

payload = json.loads(argv[0])


# import sys
# import json
# import bpy
# # import bpy, pip

# pip.main(['install', '--upgrad-e', 'pip', '--user'])
# # pip.main(['install', 'websockets', '--user'])
# pip.main(['install', 'asyncio', '--user'])

# os.system('echo testyyyyy')

def toSmall (v):
  return float("{:.3f}".format(v))

def getObject (objectGN):
  import bmesh
  # computedGeoHash = []

  geoHash = 'G' + str(hash(objectGN.data))

  myPLYStr = ''

  bm = bmesh.new()
  depsgraph = bpy.context.evaluated_depsgraph_get()

  ob = objectGN
  ob_eval = ob.evaluated_get(depsgraph)
  bm.from_mesh(ob_eval.data)

  try:
    mesh = ob_eval.to_mesh()
    bm.from_mesh(mesh)
  except RuntimeError:
    return

  myPLYStr = save_mesh(
      '',
      bm,
      True,
      True,
      True,
      False
  )

  sendPLY(metadata={
    'type': 'geometry',
    'geoHash': geoHash
  }, content=myPLYStr)

  sendJSON({
    'type': 'glb',
    'geoHash': geoHash,
    'name': objectGN.name.replace('.', '_'),
    'position': [toSmall(objectGN.location.x),toSmall(objectGN.location.y),toSmall(objectGN.location.z)],
    'scale': [toSmall(objectGN.scale.x),toSmall(objectGN.scale.y),toSmall(objectGN.scale.z)],
    'quaternion': [toSmall(objectGN.rotation_quaternion.x),toSmall(objectGN.rotation_quaternion.y), toSmall(objectGN.rotation_quaternion.z), toSmall(objectGN.rotation_quaternion.w)],
    'euler': [toSmall(objectGN.rotation_euler.x),toSmall(objectGN.rotation_euler.y), toSmall(objectGN.rotation_euler.z)],
  })

  for mat in objectGN.data.materials:
    if mat is not None:
      myMat = bpy.data.materials[mat.name_full]

      matHash = 'M' + str(hash(myMat))

      bpy.ops.mesh.primitive_cube_add()
      cube = bpy.context.selected_objects[0]
      cube.name = "myMatCube"
      bpy.context.view_layer.objects.active = cube

      if len(cube.material_slots) == 0:
        bpy.ops.object.material_slot_add()

      cube.material_slots[0].link = 'OBJECT'
      cube.material_slots[0].material = myMat

      filePath = bpy.app.tempdir + 'temp.gltf'

      bpy.ops.export_scene.gltf(
        filepath=filePath,
        export_format='GLTF_EMBEDDED',
        use_selection=True,
        export_draco_mesh_compression_enable=False
      )

      with open(filePath) as f:
        lines = f.readlines()
        sendJSON({
          'type': 'material',
          'name': mat.name_full,
          'geoHash': geoHash,
          'matHash': matHash,
          'gltf': lines
        })


def getInstancsInGeoNode (objectGN, renderGeo):
  import bmesh
  computedGeoHash = []
  computedMatHash = []
  depsgraph = bpy.context.evaluated_depsgraph_get()

  for instance in depsgraph.object_instances:
    if instance.instance_object and instance.parent and instance.parent.original == objectGN:
      # sendTEXT(instance.object.type)
      if instance.object.type == 'MESH':
        mtx = instance.matrix_world.copy() * bpy.context.scene.unit_settings.scale_length

        geoHash = 'G' + str(hash(instance.object.data))

        loc, rot, scale = mtx.decompose()

        sendJSON({
          'type': 'instance',
          'geoHash': geoHash,
          'position': [toSmall(loc.x), toSmall(loc.y), toSmall(loc.z)],
          'quaternion': [toSmall(rot.x), toSmall(rot.y), toSmall(rot.z), toSmall(rot.w)],
          'scale': [toSmall(scale.x), toSmall(scale.y), toSmall(scale.z)],
        })

        if geoHash not in computedGeoHash:

          if renderGeo:
            myPLYStr = ''

            bm = bmesh.new()

            ob = instance.object
            ob_eval = ob.evaluated_get(depsgraph)
            bm.from_mesh(ob_eval.data)

            try:
              mesh = ob_eval.to_mesh()
              bm.from_mesh(mesh)
            except RuntimeError:
              continue

            myPLYStr = save_mesh(
                '',
                bm,
                True,
                True,
                True,
                False
            )

            sendPLY(metadata={
              'type': 'geometry',
              'geoHash': geoHash
            }, content=myPLYStr)

            for mat in instance.object.data.materials:
              if mat is not None:
                myMat = bpy.data.materials[mat.name_full]

                matHash = 'M' + str(hash(myMat))

                bpy.ops.mesh.primitive_cube_add()
                cube = bpy.context.selected_objects[0]
                cube.name = "myMatCube"
                bpy.context.view_layer.objects.active = cube

                if len(cube.material_slots) == 0:
                  bpy.ops.object.material_slot_add()

                cube.material_slots[0].link = 'OBJECT'
                cube.material_slots[0].material = myMat

                filePath = bpy.app.tempdir + 'temp.gltf'

                bpy.ops.export_scene.gltf(
                  filepath=filePath,
                  export_format='GLTF_EMBEDDED',
                  use_selection=True,
                  export_draco_mesh_compression_enable=False
                )

                with open(filePath) as f:
                  lines = f.readlines()
                  sendJSON({
                    'type': 'material',
                    'name': mat.name_full,
                    'geoHash': geoHash,
                    'matHash': matHash,
                    'gltf': lines
                  })

        computedGeoHash += [geoHash]

def sendGeoInstances (obj, renderGeo):
  try:
    getInstancsInGeoNode(obj, renderGeo)
  except Exception as e:
    sys.stderr.write('error from blender:: \n' + str(e))
    sys.stderr.flush()


    # else:
      # myPLYStr = save(context=bpy.context, filepath="",
      #   obs=[obj],
      #   use_ascii=True,
      #   use_selection=True,
      #   use_mesh_modifiers=False,
      #   use_normals=True,
      #   use_uv_coords=True,
      #   use_colors=False,
      #   global_matrix=False
      # )

      # metadata['type'] = 'mesh'
      # metadata['name'] = obj.name
      # sendPLY(metadata, myPLYStr)

      # bpy.data.materials["lok"]

def callbackYo ():
  sendJSON({
    'type': 'material',
    'name': 'lok',
  })

def main ():
  if payload['type'] == 'get_paramters':
    sendJSON(get_paramters())

  if payload['type'] == 'get_geo_instances':
    import bmesh

    objects = [ob for ob in bpy.context.view_layer.objects if ob.visible_get()]

    for obj in objects:
    # for obj in bpy.context.scene.objects:
      if obj.type == 'MESH':

        hasGeoNode = False
        for modifier in obj.modifiers:
          if modifier.type == 'NODES':
            hasGeoNode = True

            for par in payload['params']:
              modifier[par['_id']] = float(par['value'])

            obj.data.update()

        if obj.visible_get():
          if hasGeoNode:
            sendGeoInstances(obj, True)
          else:
            getObject(obj)

        # x = threading.Thread(target=sendGeoInstances, args=(obj,))
        # x.start()


def sendTEXT (content):
  sys.__stdout__.flush()
  sys.__stdout__.write('__OBJECT_SPLIT__')
  sys.__stdout__.write('__OBJECT_START__')
  sys.__stdout__.write('__PARSE__TEXT__' + (content))
  sys.__stdout__.write('__OBJECT_END__')
  sys.__stdout__.write('__OBJECT_SPLIT__')
  sys.__stdout__.flush()

def sendPLY (metadata, content):
  sys.__stdout__.flush()
  sys.__stdout__.write('__OBJECT_SPLIT__')
  sys.__stdout__.write('__OBJECT_START__')
  sys.__stdout__.write('__PARSE__PLY__' + json.dumps(metadata) + '__META_SPLIT__' + (content))
  sys.__stdout__.write('__OBJECT_END__')
  sys.__stdout__.write('__OBJECT_SPLIT__')
  sys.__stdout__.flush()

def sendJSON (str):
  sys.__stdout__.flush()
  sys.__stdout__.write('__OBJECT_SPLIT__')
  sys.__stdout__.write('__OBJECT_START__')
  sys.__stdout__.write('__PARSE__JSON__' + json.dumps(str))
  sys.__stdout__.write('__OBJECT_END__')
  sys.__stdout__.write('__OBJECT_SPLIT__')
  sys.__stdout__.flush()

def get_paramters ():
  list = []

  for ng in bpy.data.node_groups:
    if ng.type == 'GEOMETRY':
      for val in ng.inputs:
        if val.type == 'GEOMETRY':
          continue
        if val.type == 'MATERIAL':
          continue

        new_settings = {}
        new_settings['_id'] = val.identifier
        new_settings['name'] = val.name
        new_settings['type'] = val.type
        new_settings['default_value'] = val.default_value
        new_settings['value'] = val.default_value

        list += [new_settings]

  return list


# def getNodesScene():
#   for obj in bpy.data.objects:
#     for modifier in obj.modifiers:
#       if modifier.type == 'NODES':
#         return obj


# def getGraphData (sceneNodeObj):
#   myResult = {}
#   # dependencyGraph = bpy.context.evaluated_depsgraph_get()
#   # evalGeoNodeData = sceneNodeObj.evaluated_get(dependencyGraph).data


#   if sceneNodeObj.type == 'MESH':
#     myResult['mesh'] = 123

#   return myResult



def _write_ascii(myStr, fw, ply_verts: list, ply_faces: list) -> None:
    # Vertex data
    # ---------------------------
    for v, normal, uv, color in ply_verts:
        myStr = fw(myStr, "%.4f %.4f %.4f" % v.co[:])
        if normal is not None:
            myStr = fw(myStr, " %.4f %.4f %.4f" % normal[:])
        if uv is not None:
            myStr = fw(myStr, " %.4f %.4f" % uv)
        if color is not None:
            myStr = fw(myStr, " %u %u %u %u" % color)
        myStr = fw(myStr, "\n")

    # Face data
    # ---------------------------
    for pf in ply_faces:
        myStr = fw(myStr, "%d" % len(pf))
        for index in pf:
            myStr = fw(myStr, " %d" % index)
        myStr = fw(myStr, "\n")


    return myStr


# def append_curve(scene=context.scene,
#                 name='BezierCurve',
#                 dimensions='3D',
#                 show_normal_face=True,
#                 close_loop=False,
#                 resolution=12,
#                 count=4,
#                 handle_type='FREE',
#                 scale=1.0):

#     # Types: ['CURVE', 'SURFACE', 'FONT']
#     curve_data = bpy.data.curves.new(name=name, type='CURVE')

#     # Dimensions: ['2D', '3D']
#     curve_data.dimensions = dimensions

#     # Displays the arrows on the curve.
#     curve_data.show_normal_face = show_normal_face

#     # Cache shortcut to splines.
#     splines = curve_data.splines

#     # Depending on request, append either a closed loop or open curve.
#     if close_loop is True:
#         append_spline_loop(splines=splines,
#                           resolution=resolution,
#                           count=count,
#                           handle_type=handle_type,
#                           radius=scale)
#     else:
#         append_spline_curve(splines=splines,
#                             resolution=resolution,
#                             count=count,
#                             handle_type=handle_type,
#                             origin=Vector((-scale, 0.0, 0.0)),
#                             destination=Vector((scale, 0.0, 0.0)))

#     # Create object from the data.
#     curve_object = bpy.data.objects.new(name=name, object_data=curve_data)

#     # Link object to the scene.
#     scene.objects.link(curve_object)

#     # Return object.
#     return curve_object



# def append_spline_curve(splines=None,
#                         resolution=12,
#                         count=2,
#                         handle_type='FREE',
#                         origin=Vector((-1.0, 0.0, 0.0)),
#                         destination=Vector((1.0, 0.0, 0.0))):
#     spline = splines.new(type='BEZIER')
#     spline.use_cyclic_u = False
#     spline.resolution_u = resolution
#     knots = spline.bezier_points
#     knots.add(count=count - 1)
#     knots_range = range(0, count, 1)

#     # Convert number of points in the array to a percent.
#     to_percent = 1.0 / (count - 1)
#     one_third = 1.0 / 3.0

#     # Loop through bezier points.
#     for i in knots_range:

#         # Cache shortcut to current bezier point.
#         knot = knots[i]

#         # Calculate bezier point coordinate.
#         step = i * to_percent
#         knot.co = origin.lerp(destination, step)

#         # Calculate left handle by subtracting 1/3 from step.
#         step = (i - one_third) * to_percent
#         knot.handle_left = origin.lerp(destination, step)

#         # Calculate right handle by adding 1/3 to step.
#         step = (i + one_third) * to_percent
#         knot.handle_right = origin.lerp(destination, step)

#         # Assign handle types: ['FREE', 'VECTOR', 'ALIGNED', 'AUTO']
#         knot.handle_left_type = handle_type
#         knot.handle_right_type = handle_type

#     return spline

# def append_spline_loop(splines=None,
#                       resolution=12,
#                       count=4,
#                       handle_type='FREE',
#                       center=Vector((0.0, 0.0, 0.0)),
#                       radius=1.0):
#     spline = splines.new(type='BEZIER')
#     spline.use_cyclic_u = True
#     spline.resolution_u = resolution
#     knots = spline.bezier_points
#     knots.add(count=count - 1)
#     knots_range = range(0, count, 1)

#     # Convert number of points in the array to an angle.
#     to_angle = TWOPI / count

#     # Forward direction.
#     forward = Vector((0.0, 0.0, 1.0))

#     # Scalar by which to multiply tangents.
#     magnitude = radius * 1.3333333333333333 * tan(pi / (2.0 * knot_count))

#     # Loop through bezier points.
#     for i in knots_range:

#         # Cache shortcut to current bezier point.
#         knot = knots[i]

#         # Create Cartesian coordinate from polar coordinate.
#         co_angle = i * to_angle
#         coord = Vector((cos(co_angle), sin(co_angle), 0.0))
#         coord *= radius

#         # Find local forward.
#         local_forward = forward.cross(coord)
#         local_forward.normalize()
#         local_forward *= magnitude

#         # Shift by center.
#         coord += center

#         # Assign to knot.
#         knot.co = coord
#         knot.handle_left = coord - local_forward
#         knot.handle_right = coord + local_forward

#         # Assign handle types: ['FREE', 'VECTOR', 'ALIGNED', 'AUTO']
#         knot.handle_left_type = handle_type
#         knot.handle_right_type = handle_type

#     return spline

def save_mesh(filepath, bm, use_ascii, use_normals, use_uv, use_color):
    uv_lay = bm.loops.layers.uv.active
    col_lay = bm.loops.layers.color.active

    use_uv = use_uv and uv_lay is not None
    use_color = use_color and col_lay is not None
    normal = uv = color = None

    ply_faces = []
    ply_verts = []
    ply_vert_map = {}
    ply_vert_id = 0

    for f in bm.faces:
        pf = []
        ply_faces.append(pf)

        for loop in f.loops:
            v = map_id = loop.vert

            if use_uv:
                # uv = loop[uv_lay].uv[:]
                uv = (loop[uv_lay].uv[0], 1.0 - loop[uv_lay].uv[1])
                map_id = v, uv

            # Identify vertex by pointer unless exporting UVs,
            # in which case id by UV coordinate (will split edges by seams).
            if (_id := ply_vert_map.get(map_id)) is not None:
                pf.append(_id)
                continue

            if use_normals:
                normal = v.normal
            if use_color:
                color = tuple(int(x * 255.0) for x in loop[col_lay])

            ply_verts.append((v, normal, uv, color))
            ply_vert_map[map_id] = ply_vert_id
            pf.append(ply_vert_id)
            ply_vert_id += 1

    # with open(filepath, "w") as file:

        # fw = file.write
    file_format = "ascii" if use_ascii else "binary_little_endian"

    myStr = ''
    def fw (myStr, myString):
        myStr += str(myString);
        return myStr;

    # Header
    # ---------------------------

    myStr = fw(myStr, "ply\n")
    myStr = fw(myStr, "format %s 1.0\n" % file_format)
    myStr = fw(myStr, "comment Created by Blender %s - www.blender.org\n" % bpy.app.version_string.encode("utf-8"))

    myStr = fw(myStr, "element vertex %d\n" % len(ply_verts))
    myStr = fw(myStr,
        "property float x\n"
        "property float y\n"
        "property float z\n"
    )
    if use_normals:
        myStr = fw(myStr,
            "property float nx\n"
            "property float ny\n"
            "property float nz\n"
        )
    if use_uv:
        myStr = fw(myStr,
            "property float s\n"
            "property float t\n"
        )
    if use_color:
        myStr = fw(myStr,
            "property uchar red\n"
            "property uchar green\n"
            "property uchar blue\n"
            "property uchar alpha\n"
        )

    myStr = fw(myStr, "element face %d\n" % len(ply_faces))
    myStr = fw(myStr, "property list uchar uint vertex_indices\n")
    myStr = fw(myStr, "end_header\n")

    # Geometry
    # ---------------------------

    return _write_ascii(myStr, fw, ply_verts, ply_faces)


def save(
    context,
    obs=[],
    filepath="",
    use_ascii=True,
    use_selection=False,
    use_mesh_modifiers=True,
    use_normals=True,
    use_uv_coords=True,
    use_colors=False,
    global_matrix=False,
):
    import time
    import bmesh

    t = time.time()

    if bpy.ops.object.mode_set.poll():
        bpy.ops.object.mode_set(mode='OBJECT')

    # if use_selection:
    #     obs = context.selected_objects
    # else:
    #     obs = context.scene.objects

    depsgraph = context.evaluated_depsgraph_get()
    bm = bmesh.new()

    for ob in obs:
        if use_mesh_modifiers:
            ob_eval = ob.evaluated_get(depsgraph)
        else:
            ob_eval = ob

        try:
            me = ob_eval.to_mesh()
        except RuntimeError:
            continue

        # me.transform(ob.matrix_world)
        bm.from_mesh(me)
        ob_eval.to_mesh_clear()

    # Workaround for hardcoded unsigned char limit in other DCCs PLY importers
    if (ngons := [f for f in bm.faces if len(f.verts) > 255]):
        bmesh.ops.triangulate(bm, faces=ngons)

    if global_matrix is not None:
        bm.transform(global_matrix)

    if use_normals:
        bm.normal_update()

    result = save_mesh(
        filepath,
        bm,
        use_ascii,
        use_normals,
        use_uv_coords,
        use_colors,
    )

    # print(result);

    bm.free()

    t_delta = time.time() - t
    # print(f"Export completed in {t_delta:.3f}")

    return result

main()
