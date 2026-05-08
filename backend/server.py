from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="Safe Steps API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# --------- Models ---------
class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: str  # collares, pulseras, ganchos, anillos
    price: float
    short_description: str
    description: str
    benefits: List[str] = []
    colors: List[str] = []  # hex strings
    image: str
    featured: bool = False


class ContactMessageCreate(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    phone: Optional[str] = None
    subject: Optional[str] = None
    message: str = Field(min_length=5, max_length=2000)


class ContactMessage(ContactMessageCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=now_iso)


class AdvisoryRequestCreate(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    phone: Optional[str] = None
    preferred_date: Optional[str] = None
    notes: Optional[str] = None


class AdvisoryRequest(AdvisoryRequestCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=now_iso)


# --------- Seed data ---------
SEED_PRODUCTS: List[dict] = [
    {
        "id": "prod-collar-aurora",
        "name": "Collar Aurora",
        "category": "collares",
        "price": 89.0,
        "short_description": "Collar minimalista con botón de pánico discreto.",
        "description": "Collar de acero inoxidable con dije inteligente. Activa una alerta silenciosa al instante con un doble toque. Conexión Bluetooth con la app Safe Steps.",
        "benefits": [
            "Botón de pánico oculto",
            "Hasta 7 días de batería",
            "Resistente al agua IP67",
            "Alerta silenciosa por doble toque",
        ],
        "colors": ["#0A0A0A", "#FFFFFF", "#0B1B3A", "#374151"],
        "image": "https://images.unsplash.com/photo-1680200256120-8ac04eb6f01d?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
        "featured": True,
    },
    {
        "id": "prod-pulsera-orion",
        "name": "Pulsera Orión",
        "category": "pulseras",
        "price": 79.0,
        "short_description": "Pulsera elegante con GPS de baja energía.",
        "description": "Diseño tejido con núcleo de seguridad. Comparte tu ubicación en tiempo real con tus contactos de confianza desde la app.",
        "benefits": [
            "GPS de bajo consumo",
            "Compartir ubicación en vivo",
            "Vibración háptica de aviso",
            "Ajuste universal",
        ],
        "colors": ["#0A0A0A", "#0B1B3A", "#1C1C1E"],
        "image": "https://images.unsplash.com/photo-1762539297259-2bb6eea568e4?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
        "featured": True,
    },
    {
        "id": "prod-anillo-nova",
        "name": "Anillo Nova",
        "category": "anillos",
        "price": 129.0,
        "short_description": "Anillo discreto con activación táctil.",
        "description": "Pieza minimalista con sensor capacitivo. Una pulsación prolongada envía la alerta SOS sin que nadie lo note.",
        "benefits": [
            "Sensor capacitivo",
            "Activación SOS de 3 segundos",
            "Acabado mate antimicrobiano",
            "Carga inalámbrica",
        ],
        "colors": ["#FFFFFF", "#0A0A0A", "#374151"],
        "image": "https://images.unsplash.com/photo-1611652022419-a9419f74343d?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
        "featured": False,
    },
    {
        "id": "prod-gancho-luna",
        "name": "Gancho Luna",
        "category": "ganchos",
        "price": 49.0,
        "short_description": "Gancho para cabello con micrófono ambiental.",
        "description": "Accesorio elegante que graba audio ambiental cifrado al detectar palabras clave configuradas en la app.",
        "benefits": [
            "Detección de palabras clave",
            "Audio cifrado en la nube",
            "Diseño ultra ligero",
            "Modo invitado",
        ],
        "colors": ["#0A0A0A", "#374151", "#FFFFFF"],
        "image": "https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
        "featured": False,
    },
    {
        "id": "prod-collar-eclipse",
        "name": "Collar Eclipse",
        "category": "collares",
        "price": 99.0,
        "short_description": "Collar largo con doble cápsula tecnológica.",
        "description": "Diseño en cadena de eslabones con cápsula central que aloja sensor de impacto y luz LED de emergencia.",
        "benefits": [
            "Sensor de caída",
            "LED de emergencia",
            "Cadena hipoalergénica",
            "App compatible iOS/Android",
        ],
        "colors": ["#0B1B3A", "#0A0A0A"],
        "image": "https://images.unsplash.com/photo-1599643477877-530eb83abc8e?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
        "featured": False,
    },
    {
        "id": "prod-pulsera-vega",
        "name": "Pulsera Vega",
        "category": "pulseras",
        "price": 69.0,
        "short_description": "Pulsera tejida con etiqueta NFC privada.",
        "description": "Pieza sutil y resistente con etiqueta NFC encriptada para compartir información médica de emergencia con un toque.",
        "benefits": [
            "Etiqueta NFC encriptada",
            "Información médica rápida",
            "Trenzado resistente",
            "Personalización por color",
        ],
        "colors": ["#374151", "#0A0A0A", "#FFFFFF"],
        "image": "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
        "featured": True,
    },
]


@app.on_event("startup")
async def seed_products():
    try:
        existing = await db.products.count_documents({})
        if existing == 0:
            await db.products.insert_many([{**p} for p in SEED_PRODUCTS])
            logging.getLogger(__name__).info(f"Seeded {len(SEED_PRODUCTS)} products")
    except Exception as e:
        logging.getLogger(__name__).exception(f"Seeding error: {e}")


# --------- Routes ---------
@api_router.get("/")
async def root():
    return {"message": "Safe Steps API", "status": "ok"}


@api_router.get("/products", response_model=List[Product])
async def list_products(category: Optional[str] = None):
    query: dict = {}
    if category and category != "todos":
        query["category"] = category
    docs = await db.products.find(query, {"_id": 0}).to_list(500)
    return docs


@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    doc = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return doc


@api_router.post("/contact", response_model=ContactMessage, status_code=201)
async def create_contact(payload: ContactMessageCreate):
    msg = ContactMessage(**payload.model_dump())
    await db.contact_messages.insert_one(msg.model_dump())
    return msg


@api_router.post("/advisory", response_model=AdvisoryRequest, status_code=201)
async def create_advisory(payload: AdvisoryRequestCreate):
    req = AdvisoryRequest(**payload.model_dump())
    await db.advisory_requests.insert_one(req.model_dump())
    return req


@api_router.get("/contact", response_model=List[ContactMessage])
async def list_contact_messages():
    docs = await db.contact_messages.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return docs


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
