# 🔧 API CONTRACTS & DATA MODELS
## Technical Implementation Specifications

---

## 📋 DETAILED API CONTRACTS

### **Business Intelligence API**
```typescript
// GET /api/v1/business-intelligence/dashboards
interface DashboardListResponse {
  dashboards: Dashboard[];
  pagination: PaginationMeta;
}

interface Dashboard {
  id: string;
  name: string;
  description: string;
  widgets: Widget[];
  layout: LayoutConfig;
  permissions: Permission[];
  createdAt: Date;
  updatedAt: Date;
}

interface Widget {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'custom';
  title: string;
  dataSource: string;
  config: WidgetConfig;
  position: Position;
  size: Size;
}

// POST /api/v1/business-intelligence/widgets
interface CreateWidgetRequest {
  dashboardId: string;
  type: WidgetType;
  title: string;
  dataSource: string;
  config: WidgetConfig;
  position: Position;
  size: Size;
}
```

### **Digital Assets API**
```typescript
// GET /api/v1/digital-assets/libraries/{libraryId}/assets
interface AssetListResponse {
  assets: Asset3D[];
  filters: FilterOptions;
  pagination: PaginationMeta;
}

interface Asset3D {
  id: string;
  name: string;
  description: string;
  fileUrl: string;
  thumbnailUrl: string;
  format: AssetFormat;
  metadata: AssetMetadata;
  tags: string[];
  category: string;
  uploadedAt: Date;
  fileSize: number;
}

interface AssetMetadata {
  dimensions: Vector3;
  polygonCount: number;
  materials: Material[];
  animations: Animation[];
  textureCount: number;
  compressionLevel: number;
}

// POST /api/v1/digital-assets/upload
interface UploadAssetRequest {
  libraryId: string;
  file: File;
  metadata: Partial<AssetMetadata>;
  tags: string[];
  category: string;
}
```

### **AI Automation API**
```typescript
// GET /api/v1/ai-automation/agents
interface AgentListResponse {
  agents: AIAgent[];
  categories: AgentCategory[];
  pagination: PaginationMeta;
}

interface AIAgent {
  id: string;
  name: string;
  description: string;
  category: string;
  capabilities: Capability[];
  status: AgentStatus;
  performance: PerformanceMetrics;
  configuration: AgentConfig;
  version: string;
  createdAt: Date;
}

interface Capability {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  outputSchema: JSONSchema;
  executionTime: number;
  accuracy: number;
}

// POST /api/v1/ai-automation/workflows/execute
interface ExecuteWorkflowRequest {
  workflowId: string;
  agentId: string;
  input: any;
  context: ExecutionContext;
  priority: Priority;
}

interface ExecuteWorkflowResponse {
  executionId: string;
  status: ExecutionStatus;
  estimatedDuration: number;
  result?: any;
  error?: Error;
}
```

### **Voice Control API**
```typescript
// POST /api/v1/user-experience/voice-commands/execute
interface VoiceCommandRequest {
  transcript: string;
  confidence: number;
  audioData?: string; // base64 encoded
  context: VoiceContext;
  userId: string;
}

interface VoiceCommandResponse {
  understood: boolean;
  intent: Intent;
  action: Action;
  parameters: Record<string, any>;
  response: VoiceResponse;
  executionResult: ExecutionResult;
}

interface VoiceContext {
  currentView: string;
  selectedItems: string[];
  recentActions: Action[];
  userPreferences: UserPreferences;
}

interface VoiceResponse {
  text: string;
  audioUrl?: string;
  visualFeedback?: VisualFeedback;
}
```

---

## 🗄️ DATA MODELS

### **Core Domain Models**
```typescript
// Business Intelligence Domain
class DashboardAggregate {
  constructor(
    public readonly id: DashboardId,
    public readonly name: string,
    public readonly ownerId: UserId,
    private widgets: Map<WidgetId, Widget>,
    private layout: LayoutConfig,
    private permissions: Permission[]
  ) {}

  addWidget(widget: Widget): DomainEvent[] {
    this.widgets.set(widget.id, widget);
    return [new WidgetAddedEvent(this.id, widget.id)];
  }

  updateLayout(layout: LayoutConfig): DomainEvent[] {
    this.layout = layout;
    return [new LayoutUpdatedEvent(this.id, layout)];
  }

  canUserAccess(userId: UserId, action: Action): boolean {
    return this.permissions.some(p => 
      p.userId === userId && p.actions.includes(action)
    );
  }
}

// Digital Assets Domain  
class AssetLibraryAggregate {
  constructor(
    public readonly id: LibraryId,
    public readonly name: string,
    private assets: Map<AssetId, Asset3D>,
    private categories: Category[],
    private accessControl: AccessControl
  ) {}

  uploadAsset(asset: Asset3D, uploader: UserId): DomainEvent[] {
    if (!this.accessControl.canUpload(uploader)) {
      throw new AccessDeniedError();
    }
    
    this.assets.set(asset.id, asset);
    return [new AssetUploadedEvent(this.id, asset.id, uploader)];
  }

  categorizeAsset(assetId: AssetId, categoryId: CategoryId): DomainEvent[] {
    const asset = this.assets.get(assetId);
    if (!asset) throw new AssetNotFoundError();
    
    asset.setCategoryId(categoryId);
    return [new AssetCategorizedEvent(assetId, categoryId)];
  }
}

// AI Automation Domain
class AgentAggregate {
  constructor(
    public readonly id: AgentId,
    public readonly name: string,
    private capabilities: Map<string, Capability>,
    private trainingData: TrainingData[],
    private performance: PerformanceMetrics
  ) {}

  train(data: TrainingData): DomainEvent[] {
    this.trainingData.push(data);
    return [new AgentTrainingStartedEvent(this.id, data.id)];
  }

  execute(task: Task): Promise<ExecutionResult> {
    const capability = this.capabilities.get(task.type);
    if (!capability) {
      throw new CapabilityNotSupportedError(task.type);
    }
    
    return capability.execute(task);
  }

  updatePerformance(metrics: PerformanceMetrics): DomainEvent[] {
    this.performance = metrics;
    return [new AgentPerformanceUpdatedEvent(this.id, metrics)];
  }
}
```

### **Value Objects**
```typescript
// Shared Value Objects
class Vector3 {
  constructor(
    public readonly x: number,
    public readonly y: number,
    public readonly z: number
  ) {
    if (x < 0 || y < 0 || z < 0) {
      throw new InvalidDimensionsError();
    }
  }

  static zero(): Vector3 {
    return new Vector3(0, 0, 0);
  }

  magnitude(): number {
    return Math.sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2);
  }
}

class MetricValue {
  constructor(
    public readonly value: number,
    public readonly unit: string,
    public readonly timestamp: Date,
    public readonly source: string
  ) {
    if (value < 0) throw new InvalidMetricValueError();
  }

  isStale(maxAge: number): boolean {
    return Date.now() - this.timestamp.getTime() > maxAge;
  }
}

class AssetFormat {
  private static readonly SUPPORTED_FORMATS = [
    'glb', 'gltf', 'obj', 'fbx', 'stl', '3ds'
  ];

  constructor(public readonly extension: string) {
    if (!AssetFormat.SUPPORTED_FORMATS.includes(extension.toLowerCase())) {
      throw new UnsupportedFormatError(extension);
    }
  }

  isAnimationSupported(): boolean {
    return ['glb', 'gltf', 'fbx'].includes(this.extension.toLowerCase());
  }
}
```

### **Repository Interfaces**
```typescript
interface DashboardRepository {
  findById(id: DashboardId): Promise<DashboardAggregate | null>;
  findByOwnerId(ownerId: UserId): Promise<DashboardAggregate[]>;
  save(dashboard: DashboardAggregate): Promise<void>;
  delete(id: DashboardId): Promise<void>;
}

interface AssetRepository {
  findById(id: AssetId): Promise<Asset3D | null>;
  findByLibraryId(libraryId: LibraryId): Promise<Asset3D[]>;
  searchByTags(tags: string[]): Promise<Asset3D[]>;
  save(asset: Asset3D): Promise<void>;
  updateMetadata(id: AssetId, metadata: AssetMetadata): Promise<void>;
}

interface AgentRepository {
  findById(id: AgentId): Promise<AgentAggregate | null>;
  findByCapability(capability: string): Promise<AgentAggregate[]>;
  findAvailable(): Promise<AgentAggregate[]>;
  save(agent: AgentAggregate): Promise<void>;
  updatePerformance(id: AgentId, metrics: PerformanceMetrics): Promise<void>;
}
```

---

## 🔄 EVENT SCHEMAS

### **Domain Events**
```typescript
interface DomainEvent {
  id: string;
  type: string;
  aggregateId: string;
  aggregateType: string;
  version: number;
  timestamp: Date;
  data: any;
  metadata: EventMetadata;
}

// Business Intelligence Events
interface DashboardCreatedEvent extends DomainEvent {
  type: 'DashboardCreated';
  data: {
    dashboardId: string;
    name: string;
    ownerId: string;
    initialWidgets: string[];
  };
}

interface WidgetAddedEvent extends DomainEvent {
  type: 'WidgetAdded';
  data: {
    dashboardId: string;
    widgetId: string;
    widgetType: string;
    position: Position;
  };
}

// Digital Assets Events
interface AssetUploadedEvent extends DomainEvent {
  type: 'AssetUploaded';
  data: {
    assetId: string;
    libraryId: string;
    uploaderId: string;
    fileSize: number;
    format: string;
  };
}

// AI Automation Events
interface AgentExecutionStartedEvent extends DomainEvent {
  type: 'AgentExecutionStarted';
  data: {
    executionId: string;
    agentId: string;
    taskType: string;
    inputData: any;
    priority: string;
  };
}

interface AgentExecutionCompletedEvent extends DomainEvent {
  type: 'AgentExecutionCompleted';
  data: {
    executionId: string;
    agentId: string;
    result: any;
    duration: number;
    success: boolean;
  };
}
```

---

## 🔧 SERVICE INTERFACES

### **Application Services**
```typescript
interface DashboardService {
  createDashboard(command: CreateDashboardCommand): Promise<DashboardId>;
  addWidget(command: AddWidgetCommand): Promise<WidgetId>;
  updateLayout(command: UpdateLayoutCommand): Promise<void>;
  getDashboard(query: GetDashboardQuery): Promise<DashboardView>;
  deleteDashboard(command: DeleteDashboardCommand): Promise<void>;
}

interface AssetManagementService {
  uploadAsset(command: UploadAssetCommand): Promise<AssetId>;
  searchAssets(query: SearchAssetsQuery): Promise<AssetSearchResult>;
  categorizeAsset(command: CategorizeAssetCommand): Promise<void>;
  getAssetMetadata(query: GetAssetMetadataQuery): Promise<AssetMetadata>;
  deleteAsset(command: DeleteAssetCommand): Promise<void>;
}

interface AIAutomationService {
  registerAgent(command: RegisterAgentCommand): Promise<AgentId>;
  executeWorkflow(command: ExecuteWorkflowCommand): Promise<ExecutionId>;
  trainAgent(command: TrainAgentCommand): Promise<TrainingId>;
  getAgentPerformance(query: GetAgentPerformanceQuery): Promise<PerformanceReport>;
  listAvailableAgents(query: ListAgentsQuery): Promise<AgentSummary[]>;
}

interface VoiceControlService {
  processVoiceCommand(command: ProcessVoiceCommand): Promise<VoiceCommandResult>;
  registerVoiceIntents(command: RegisterIntentsCommand): Promise<void>;
  getVoiceHistory(query: GetVoiceHistoryQuery): Promise<VoiceInteraction[]>;
  updateVoiceSettings(command: UpdateVoiceSettingsCommand): Promise<void>;
}
```

---

**🏗️ TECHNICAL FOUNDATION: COMPLETE & PRODUCTION-READY**