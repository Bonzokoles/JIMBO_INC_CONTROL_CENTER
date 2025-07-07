"use client"

import { useState, useEffect, useRef } from "react"
import { ExternalLink, Download, ArrowLeft, Layers } from "lucide-react"
import type { FormValues } from "@/lib/form-schema"
import { submitRodinJob, checkJobStatus, downloadModel } from "@/lib/api-service"
import ModelViewer from "./model-viewer"
import Form from "./form"
import StatusIndicator from "./status-indicator"
import OptionsDialog from "./options-dialog"
import BlenderBridge from "./blender-bridge"
import { Button } from "@/components/ui/button"
import { useMediaQuery } from "@/hooks/use-media-query"

export default function Rodin() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)
  const [isPolling, setIsPolling] = useState(false)
  const [modelUrl, setModelUrl] = useState<string | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [jobStatuses, setJobStatuses] = useState<Array<{ uuid: string; status: string }>>([])
  const [showOptions, setShowOptions] = useState(false)
  const [showBlenderBridge, setShowBlenderBridge] = useState(false)
  const [showPromptContainer, setShowPromptContainer] = useState(true)
  const isMobile = useMediaQuery("(max-width: 768px)")
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSubmittedValuesRef = useRef<FormValues | null>(null)
  const [options, setOptions] = useState({
    condition_mode: "concat" as const,
    quality: "high" as const,
    geometry_file_format: "glb" as const,
    use_hyper: true,
    tier: "Detail" as const,
    TAPose: false,
    material: "PBR" as const,
    use_colors: false,
    auto_detect_colors: true,
    highpack: true,
  })

  // Prevent body scroll on mobile
  useEffect(() => {
    if (isMobile) {
      document.body.style.overflow = "hidden"
      document.documentElement.style.overflow = "hidden"

      return () => {
        document.body.style.overflow = ""
        document.documentElement.style.overflow = ""
      }
    }
  }, [isMobile])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current)
      }
    }
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'n':
            event.preventDefault()
            // New model - reset to initial state
            handleBack()
            break
          case 'r':
            event.preventDefault()
            // Regenerate current model
            if (!isLoading && lastSubmittedValuesRef.current) {
              // Re-submit with same parameters
              setIsLoading(true)
              setError(null)
              handleSubmit(lastSubmittedValuesRef.current)
            }
            break
          case 'd':
            event.preventDefault()
            // Download model
            if (downloadUrl) {
              window.open(downloadUrl, '_blank')
            }
            break
          case 'Escape':
            // Cancel current operation
            if (isPolling && pollingTimeoutRef.current) {
              clearTimeout(pollingTimeoutRef.current)
              setIsPolling(false)
              setIsLoading(false)
            }
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyboard)
    return () => window.removeEventListener('keydown', handleKeyboard)
  }, [isLoading, isPolling, downloadUrl])

  const handleOptionsChange = (newOptions: any) => {
    setOptions(newOptions)
  }

  async function handleStatusCheck(subscriptionKey: string, taskUuid: string) {
    try {
      setIsPolling(true)

      const data = await checkJobStatus(subscriptionKey)
      console.log("Status response:", data)

      // Check if jobs array exists
      if (!data.jobs || !Array.isArray(data.jobs) || data.jobs.length === 0) {
        throw new Error("No jobs found in status response")
      }

      // Update job statuses
      setJobStatuses(data.jobs)

      // Check status of all jobs
      const allJobsDone = data.jobs.every((job: any) => job.status === "Done")
      const anyJobFailed = data.jobs.some((job: any) => job.status === "Failed")

      if (allJobsDone) {
        setIsPolling(false)

        // Get the download URL using the task UUID
        try {
          const downloadData = await downloadModel(taskUuid)
          console.log("Download response:", downloadData)

          // Check if there's an error in the download response
          if (downloadData.error && downloadData.error !== "OK") {
            throw new Error(`Download error: ${downloadData.error}`)
          }

          // Find the first GLB file to display in the 3D viewer
          if (downloadData.list && downloadData.list.length > 0) {
            const glbFile = downloadData.list.find((file: { name: string }) => file.name.toLowerCase().endsWith(".glb"))

            if (glbFile) {
              const proxyUrl = `/api/proxy-download?url=${encodeURIComponent(glbFile.url)}`
              setModelUrl(proxyUrl)
              setDownloadUrl(glbFile.url)
              setIsLoading(false)
              setShowPromptContainer(false)
            } else {
              setError("No GLB file found in the results")
              setIsLoading(false)
            }
          } else {
            setError("No files available for download")
            setIsLoading(false)
          }
        } catch (downloadErr) {
          setError(`Failed to download model: ${downloadErr instanceof Error ? downloadErr.message : "Unknown error"}`)
          setIsLoading(false)
        }
      } else if (anyJobFailed) {
        setIsPolling(false)
        setError("Generation task failed")
        setIsLoading(false)
      } else {
        // Still processing, poll again after a delay
        pollingTimeoutRef.current = setTimeout(() => handleStatusCheck(subscriptionKey, taskUuid), 3000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check status")
      setIsPolling(false)
      setIsLoading(false)
    }
  }

  // Dodaj funkcję wykrywania kolorów
  const detectImageColors = async (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      const img = new Image()

      img.crossOrigin = "anonymous"
      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        ctx?.drawImage(img, 0, 0)

        const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height)
        if (!imageData) {
          resolve(false)
          return
        }

        const data = imageData.data
        let hasColor = false

        // Sprawdź próbki pikseli
        for (let i = 0; i < data.length; i += 16) {
          // Co 4 piksele
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]

          // Sprawdź czy wartości RGB są różne (wskazuje na kolor)
          if (Math.abs(r - g) > 10 || Math.abs(g - b) > 10 || Math.abs(r - b) > 10) {
            hasColor = true
            break
          }
        }

        resolve(hasColor)
      }

      img.onerror = () => resolve(false)
      img.src = URL.createObjectURL(file)
    })
  }

  async function handleSubmit(values: FormValues) {
    setIsLoading(true)
    setError(null)
    setResult(null)
    setModelUrl(null)
    setDownloadUrl(null)
    setJobStatuses([])
    
    // Store values for potential regeneration
    lastSubmittedValuesRef.current = values

    try {
      const formData = new FormData()

      let shouldUseColors = options.use_colors

      if (values.images && values.images.length > 0) {
        values.images.forEach((image) => {
          formData.append("images", image)
        })

        // Auto-wykrywanie kolorów jeśli włączone
        if (options.auto_detect_colors && !options.use_colors) {
          try {
            const hasColors = await Promise.all(values.images.map((image) => detectImageColors(image)))
            shouldUseColors = hasColors.some((hasColor) => hasColor)
          } catch (err) {
            console.warn("Color detection failed, using default settings")
          }
        }
      }

      if (values.prompt) {
        formData.append("prompt", values.prompt)
      }

      // Add all the advanced options
      formData.append("condition_mode", options.condition_mode)
      formData.append("geometry_file_format", options.geometry_file_format)
      formData.append("material", options.material)
      formData.append("quality", options.quality)
      formData.append("use_hyper", options.use_hyper.toString())
      formData.append("tier", options.tier)
      formData.append("TAPose", options.TAPose.toString())
      formData.append("mesh_mode", "Quad")
      formData.append("mesh_simplify", "true")
      formData.append("mesh_smooth", "true")
      formData.append("highpack", options.highpack.toString())

      // Dodaj parametry kolorów
      formData.append("use_colors", shouldUseColors.toString())
      if (shouldUseColors) {
        formData.append("color_mode", "full")
        formData.append("preserve_colors", "true")
      }

      // Make the API call through our server route
      const data = await submitRodinJob(formData)
      console.log("Generation response:", data)

      setResult(data)

      // Start polling for status
      if (data.jobs && data.jobs.subscription_key && data.uuid) {
        handleStatusCheck(data.jobs.subscription_key, data.uuid)
      } else {
        setError("Missing required data for status checking")
        setIsLoading(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
      setIsLoading(false)
    }
  }

  const handleDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl, "_blank")
    }
  }

  const handleBack = () => {
    setShowPromptContainer(true)
  }

  const ExternalLinks = () => (
    <div className="flex items-center space-x-6">
      <a
        href="https://hyper3d.ai"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center text-white hover:text-gray-300 transition-colors tracking-normal"
      >
        <span className="mr-1">Website</span>
        <ExternalLink className="h-4 w-4" />
      </a>
      <a
        href="https://developer.hyper3d.ai"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center text-white hover:text-gray-300 transition-colors tracking-normal"
      >
        <span className="mr-1">API Docs</span>
        <ExternalLink className="h-4 w-4" />
      </a>
    </div>
  )

  return (
    <div className="relative h-[100dvh] w-full">
      {/* Full-screen canvas */}
      <div className="absolute inset-0 z-0">
        <ModelViewer modelUrl={isLoading ? null : modelUrl} />
      </div>

      {/* Overlay UI */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {/* Background Quote */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
          <p className="text-white text-6xl md:text-8xl font-bold transform rotate-12" style={{ fontFamily: 'Ebrima, sans-serif' }}>
            "To the people of the lie, your empty words are glorified"
          </p>
        </div>

        {/* Logo in top left */}
        <div className="absolute top-6 left-6 pointer-events-auto">
          <div className="relative">
            {/* Main title with glow effect */}
            <h1 
              className="text-4xl text-white font-normal tracking-normal relative z-10" 
              style={{ 
                fontFamily: 'ShurikenStd, sans-serif',
                textShadow: '0 0 20px rgba(255, 255, 255, 0.3), 0 0 40px rgba(255, 255, 255, 0.1)'
              }}
            >
              ZEN_on_3D_CreatoR
            </h1>
            {/* Glow background */}
            <div 
              className="absolute inset-0 text-4xl font-normal tracking-normal opacity-30 blur-sm"
              style={{ fontFamily: 'ShurikenStd, sans-serif' }}
            >
              ZEN_on_3D_CreatoR
            </div>
          </div>
          
          {/* Quote */}
          <p 
            className="text-gray-300 text-sm mt-2 tracking-normal italic" 
            style={{ fontFamily: 'ShurikenStd, sans-serif' }}
          >
            "The only way to find equality is a violent revolution"
          </p>
          
          {/* Signature */}
          <p 
            className="text-gray-400 text-xs mt-1 tracking-normal" 
            style={{ fontFamily: 'Allura, cursive' }}
          >
            Violent Revolution KREATOR
          </p>
          
          <p className="text-gray-400 text-sm mt-2 tracking-normal">Powered by Hyper3D Rodin</p>
        </div>

        {/* Links in top right - desktop only */}
        {!isMobile && (
          <div className="absolute top-6 right-6 pointer-events-auto">
            <ExternalLinks />
          </div>
        )}

        {/* Loading indicator */}
        <StatusIndicator isLoading={isLoading} jobStatuses={jobStatuses} />

        {/* Error message */}
        {error && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-gray-900/80 text-white px-4 py-2 rounded-md tracking-normal">
            {error}
          </div>
        )}

        {/* Model controls when model is loaded */}
        {!isLoading && modelUrl && !showPromptContainer && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4 pointer-events-auto">
            <Button
              onClick={handleBack}
              className="bg-black hover:bg-gray-900 text-white border border-white/20 rounded-full px-4 py-2 flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="tracking-normal">Back</span>
            </Button>

            <Button
              onClick={() => setShowBlenderBridge(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white rounded-full px-4 py-2 flex items-center gap-2"
            >
              <Layers className="h-4 w-4" />
              <span className="tracking-normal">Blender</span>
            </Button>

            <Button
              onClick={handleDownload}
              className="bg-white hover:bg-gray-200 text-black rounded-full px-4 py-2 flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              <span className="tracking-normal">Download</span>
            </Button>
          </div>
        )}

        {/* Input field at bottom */}
        {showPromptContainer && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-3xl px-4 sm:px-0 pointer-events-auto">
            <Form isLoading={isLoading} onSubmit={handleSubmit} onOpenOptions={() => setShowOptions(true)} />

            {/* Links below prompt on mobile */}
            {isMobile && (
              <div className="mt-4 flex justify-center pointer-events-auto">
                <ExternalLinks />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Options Dialog/Drawer */}
      <OptionsDialog
        open={showOptions}
        onOpenChange={setShowOptions}
        options={options}
        onOptionsChange={handleOptionsChange}
      />

      {/* Blender Bridge Dialog/Drawer */}
      <BlenderBridge open={showBlenderBridge} onOpenChange={setShowBlenderBridge} modelUrl={modelUrl} />
    </div>
  )
}
