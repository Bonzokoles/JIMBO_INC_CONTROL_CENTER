import * as z from "zod"

export const formSchema = z
  .object({
    images: z.array(z.instanceof(File)).optional(),
    prompt: z.string().optional(),
    condition_mode: z.enum(["concat", "fuse"]).default("concat"),
    quality: z.enum(["high", "medium", "low", "extra-low"]).default("high"),
    geometry_file_format: z.enum(["glb", "usdz", "fbx", "obj", "stl", "svg"]).default("glb"),
    use_hyper: z.boolean().default(true),
    tier: z.enum(["Regular", "Sketch", "Detail", "Smooth"]).default("Detail"),
    TAPose: z.boolean().default(false),
    material: z.enum(["PBR", "Shaded"]).default("PBR"),
    use_colors: z.boolean().default(false),
    auto_detect_colors: z.boolean().default(true),
    highpack: z.boolean().default(true),
  })
  .refine(
    (data) => {
      // Require at least one of images or prompt
      return (data.images && data.images.length > 0) || (data.prompt && data.prompt.length > 0)
    },
    {
      message: "You must provide either images or a prompt",
      path: ["prompt"],
    },
  )

export type FormValues = z.infer<typeof formSchema>
