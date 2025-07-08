
# Konfiguracja ścieżek
BASE_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = BASE_DIR / "outputs"
LIBRARY_DIR = BASE_DIR / "library"
EDITOR_CONFIG = BASE_DIR / "editor_config.json"
GITHUB_CACHE = BASE_DIR / "github_cache"
EXTERNAL_LIBRARY_PATH = os.environ.get("EXTERNAL_LIBRARY_PATH", "U:\\i tutaj ptth do libraries")
PHOTOS_PATH = os.environ.get("PHOTOS_PATH", "G:/zdjecia nowe 2025/karlos")
EXTENSIONS_PATH = os.environ.get("EXTENSIONS_PATH", "U:/stable ext" jak uruchomimy stabledifusion na U:)
NICEPAGE_PATH = os.environ.get("NICEPAGE_PATH", r"U:\Nicepage,juz chuba nie mamy ale to program do robienia stron internetowych,tez cos zainstalujemy na U: do stron")


}

LIBRARIES = {
    'earth': {'name': 'Ziemia i Środowisko', 'emoji': '🌍'},
    'computers': {'name': 'Komputery i Technologia', 'emoji': '💻'},
    'humans': {'name': 'Ludzie i Społeczeństwo', 'emoji': '👥'},
    'education': {'name': 'Edukacja i Nauka', 'emoji': '📚'},
    'science': {'name': 'Nauka i Badania', 'emoji': '🔬'},
    'art': {'name': 'Sztuka i Design', 'emoji': '🎨'},
    'technology': {'name': 'Technologia i Innowacje', 'emoji': '⚡'},
    'nature': {'name': 'Przyroda i Dzikie Życie', 'emoji': '🌿'},
    'culture': {'name': 'Kultura i Tradycje', 'emoji': '🎭'},
    'space': {'name': 'Kosmos i Wszechświat', 'emoji': '🚀'},
    'jimbo': {'name': 'Jimbo Specjalne', 'emoji': '⚡'}
}

# Inicjalizacja mostów
#nicepage = NicepageBridge()
#extensions = ExtensionsBridge()

# Setup templates and static files
templates = Jinja2Templates(directory="templates")
app.mount("/outputs", StaticFiles(directory=OUTPUT_DIR), name="outputs")
app.mount("/library", StaticFiles(directory=LIBRARY_DIR), name="library")
app.mount("/photos", StaticFiles(directory=PHOTOS_PATH), name="photos")
app.mount("/extensions", StaticFiles(directory=EXTENSIONS_PATH), name="extensions")

# Modele danych
class ApiRequest(BaseModel):
    app_name: str
    endpoint: str
    method: str = "GET"
    data: Optional[dict] = None





# Funkcje pomocnicze
def ensure_external_libraries():
    try:
        libraries = {
            "earth": "Ziemia i Środowisko",
            "computers": "Komputery i Technologia",
            "humans": "Ludzie i Społeczeństwo",
            "education": "Edukacja i Nauka",
            "science": "Nauka i Badania",
            "art": "Sztuka i Design",
            "technology": "Technologia i Innowacje",
            "nature": "Przyroda i Dzikie Życie",
            "culture": "Kultura i Tradycje",
            "space": "Kosmos i Wszechświat",
            "jimbo": "Jimbo Specjalne"
        }
and plus some for personal andsome more:
# Konfiguracja ścieżek
BASE_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = BASE_DIR / "outputs"
LIBRARY_DIR = BASE_DIR / "library"
EDITOR_CONFIG = BASE_DIR / "editor_config.json"
GITHUB_CACHE = BASE_DIR / "github_cache"
EXTERNAL_LIBRARY_PATH = os.environ.get
PHOTOS_PATH = os.environ.get("PHOTOS_PATH", "U::/zdjecia nowe 2025/karlos")
EXTENSIONS_PATH = os.environ.get("EXTENSIONS_PATH", "F:/stable ext")
NICEPAGE_PATH = os.environ.get("NICEPAGE_PATH", r"C:\Users\Karol\AppData\Local\Programs\Nicepage")


}

LIBRARIES = {
    'earth': {'name': 'Ziemia i Środowisko', 'emoji': '🌍'},
    'computers': {'name': 'Komputery i Technologia', 'emoji': '💻'},
    'humans': {'name': 'Ludzie i Społeczeństwo', 'emoji': '👥'},
    'education': {'name': 'Edukacja i Nauka', 'emoji': '📚'},
    'science': {'name': 'Nauka i Badania', 'emoji': '🔬'},
    'art': {'name': 'Sztuka i Design', 'emoji': '🎨'},
    'technology': {'name': 'Technologia i Innowacje', 'emoji': '⚡'},
    'nature': {'name': 'Przyroda i Dzikie Życie', 'emoji': '🌿'},
    'culture': {'name': 'Kultura i Tradycje', 'emoji': '🎭'},
    'space': {'name': 'Kosmos i Wszechświat', 'emoji': '🚀'},
    'jimbo': {'name': 'Jimbo Specjalne', 'emoji': '⚡'}
}

# Inicjalizacja mostów
#nicepage = NicepageBridge()
#extensions = ExtensionsBridge()

# Setup templates and static files
templates = Jinja2Templates(directory="templates")
app.mount("/outputs", StaticFiles(directory=OUTPUT_DIR), name="outputs")
app.mount("/library", StaticFiles(directory=LIBRARY_DIR), name="library")
app.mount("/photos", StaticFiles(directory=PHOTOS_PATH), name="photos")
app.mount("/extensions", StaticFiles(directory=EXTENSIONS_PATH), name="extensions")

# Modele danych
class ApiRequest(BaseModel):
    app_name: str
    endpoint: str
    method: str = "GET"
    data: Optional[dict] = None

class PinokioTask(BaseModel):
class SaveToLibraryRequest(BaseModel):
    source_path: str
    library: str

class AdminRequest(BaseModel):
    app_name: str
    action: str
    template_path: str

class DesignRequest(BaseModel):
    design_path: Optional[str] = None

class EnvironmentRequest(BaseModel):
    path: str

class OperaRequest(BaseModel):
    url: str

class TaskRequest(BaseModel):
    app_name: str
    prompt: str
    parameters: Optional[dict] = None

class ButtonData(BaseModel):
    text: str
    emoji: Optional[str] = None
    path: str

class GitHubRepo(BaseModel):
    repo: str

class ExtensionAction(BaseModel):
    name: str
    action: str

# Funkcje pomocnicze
def ensure_external_libraries():
    try:
        libraries = {
            "earth": "Ziemia i Środowisko",
            "computers": "Komputery i Technologia",
            "humans": "Ludzie i Społeczeństwo",
            "education": "Edukacja i Nauka",
            "science": "Nauka i Badania",
            "art": "Sztuka i Design",
            "technology": "Technologia i Innowacje",
            "nature": "Przyroda i Dzikie Życie",
            "culture": "Kultura i Tradycje",
            "space": "Kosmos i Wszechświat",
            "jimbo": "Jimbo Specjalne"
        }