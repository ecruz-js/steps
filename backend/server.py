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
# Imágenes pendientes (productos 3 y 5) usan placeholder estilizado del catálogo
PLACEHOLDER_IMG = "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200"

SEED_PRODUCTS: List[dict] = [
    {
        "id": "prod-pulsera-champion",
        "name": "Pulsera Champion",
        "category": "pulseras",
        "price": 39.0,
        "short_description": "Pulsera trenzada con dije balón y chip oculto.",
        "description": "Pulsera de estilo moderno con doble banda trenzada en negro intenso y detalles metálicos en plateado brillante, protagonizada por un dije de balón en tonos blanco y negro. Perfecta para amantes del deporte que quieren llevar su pasión con estilo. El chip Safe Steps va oculto dentro del dije en forma de balón de fútbol.",
        "benefits": [
            "Chip Safe Steps oculto en el dije",
            "Doble banda trenzada resistente",
            "Disponible en negro intenso o marrón oscuro",
            "Detalles metálicos plateados",
        ],
        "colors": ["#0A0A0A", "#3E2A1A", "#C0C0C0"],
        "image": "https://customer-assets.emergentagent.com/job_safesteps-app/artifacts/w2d8t7pr_6e0b5fe8-6d48-43b4-8dbd-f990ed6e5537.jpeg",
        "featured": True,
    },
    {
        "id": "prod-clips-cherry-crystal",
        "name": "Clips Cherry Crystal",
        "category": "ganchos",
        "price": 19.0,
        "short_description": "Clips con cerezas facetadas y hojas esmeralda.",
        "description": "Clips decorativos con cerezas facetadas en rojo cristalino y hojas en verde esmeralda, montados sobre una base metálica en plateado. Ideales para looks frescos, juveniles y llenos de vida. El chip Safe Steps va oculto dentro de una de las cerezas.",
        "benefits": [
            "Chip Safe Steps oculto en cereza",
            "Cristales facetados de alto brillo",
            "Base metálica plateada",
            "Diseño juvenil y fresco",
        ],
        "colors": ["#B8002A", "#0F5132", "#C0C0C0"],
        "image": "https://customer-assets.emergentagent.com/job_safesteps-app/artifacts/g9lsqo60_0b0eea54-100c-4826-ac85-7732eece2478.jpeg",
        "featured": False,
    },
    {
        "id": "prod-collar-sweet-letter",
        "name": "Collar Sweet Letter",
        "category": "collares",
        "price": 45.0,
        "short_description": "Collar con dije personalizable y lazo rosa.",
        "description": "Collar elegante con cadena de oro acompañado de un dije de lazo en rosa suave y una inicial personalizable en tono dorado sobre fondo rosado. Un regalo perfecto con significado. El chip Safe Steps va oculto dentro del dije con la inicial. Disponible también en plateado.",
        "benefits": [
            "Chip Safe Steps en el dije personalizado",
            "Inicial personalizable A-Z",
            "Disponible en dorado o plateado",
            "Cadena hipoalergénica",
        ],
        "colors": ["#D4AF37", "#C0C0C0", "#F4C2C2"],
        "image": PLACEHOLDER_IMG,
        "featured": True,
    },
    {
        "id": "prod-pinza-lily-bloom",
        "name": "Pinza Lily Bloom",
        "category": "ganchos",
        "price": 24.0,
        "short_description": "Pinza dorada con flor blanca perlada.",
        "description": "Pinza para el cabello en acabado dorado, decorada con una flor en blanco perlado y hojas en verde suave. Su diseño sofisticado la convierte en una pieza única. Ideal para recogidos elegantes o looks delicados del día a día. El chip Safe Steps va oculto dentro de la flor blanca.",
        "benefits": [
            "Chip Safe Steps oculto en la flor",
            "Acabado dorado de larga duración",
            "Detalles en esmalte resistente",
            "Cierre firme para todo tipo de cabello",
        ],
        "colors": ["#D4AF37", "#FFFFFF", "#0F5132"],
        "image": "https://customer-assets.emergentagent.com/job_safesteps-app/artifacts/20n8tdsw_d0d51ac7-b60a-4d2e-a07a-1620ce338a5e.jpeg",
        "featured": False,
    },
    {
        "id": "prod-collar-year-tag",
        "name": "Collar Year Tag",
        "category": "collares",
        "price": 49.0,
        "short_description": "Collar urbano con placa grabada y cadena de esferas.",
        "description": "Collar de estilo urbano con placa metálica alargada en acabado cepillado y un grabado vertical de cuatro dígitos en tipografía digital, ideal para conmemorar un año especial. El diseño se complementa con una cadena de esferas plateada que le aporta un toque moderno y minimalista. El chip Safe Steps va oculto dentro de la placa metálica.",
        "benefits": [
            "Chip Safe Steps en la placa",
            "Año personalizable (4 dígitos)",
            "Acabado cepillado mate",
            "Cadena de esferas resistente",
        ],
        "colors": ["#C0C0C0", "#374151", "#0A0A0A"],
        "image": PLACEHOLDER_IMG,
        "featured": False,
    },
    {
        "id": "prod-pulsera-little-bloom",
        "name": "Pulsera Little Bloom",
        "category": "pulseras",
        "price": 29.0,
        "short_description": "Pulsera infantil con dije flor y inicial.",
        "description": "Delicada pulsera infantil en tono dorado que destaca por sus detalles de esferas intercaladas y sus dijes colgantes de esmalte rosa. Incluye una pequeña flor de cinco pétalos y un dije circular con una inicial personalizada, convirtiéndola en un accesorio tierno y ligero para las más pequeñas. El chip Safe Steps va oculto dentro del dije en forma de flor.",
        "benefits": [
            "Chip Safe Steps oculto en la flor",
            "Inicial personalizable",
            "Tamaño infantil ajustable",
            "Materiales hipoalergénicos",
        ],
        "colors": ["#D4AF37", "#F4C2C2", "#FFFFFF"],
        "image": "https://customer-assets.emergentagent.com/job_safesteps-app/artifacts/nwo3mm6n_46718b04-e1a8-4208-b5ca-53187a120ebc.jpeg",
        "featured": True,
    },
    {
        "id": "prod-clips-velvet-cherry",
        "name": "Clips Velvet Cherry",
        "category": "ganchos",
        "price": 22.0,
        "short_description": "Clips con lazos de terciopelo y cerezas brillantes.",
        "description": "Clips delicados con lazos en terciopelo rojo vino y cerezas en acabado brillante rojo translúcido, acompañadas de tallos en verde oscuro. Un diseño femenino, dulce y moderno que destaca sin esfuerzo. El chip Safe Steps va oculto dentro de una de las cerezas o dentro de la tela del lazo.",
        "benefits": [
            "Chip Safe Steps en cereza o lazo",
            "Terciopelo de alta calidad",
            "Cerezas en acabado translúcido brillante",
            "Hecho a mano",
        ],
        "colors": ["#7B1F2E", "#1F4D2A"],
        "image": "https://customer-assets.emergentagent.com/job_safesteps-app/artifacts/e1zrdjy9_8a078bee-1e87-4199-9356-03ddf55cc37a.jpeg",
        "featured": True,
    },
]


@app.on_event("startup")
async def seed_products():
    """Upsert seed products. Removes any product no longer in the seed list."""
    try:
        for p in SEED_PRODUCTS:
            await db.products.replace_one({"id": p["id"]}, {**p}, upsert=True)
        seed_ids = [p["id"] for p in SEED_PRODUCTS]
        result = await db.products.delete_many({"id": {"$nin": seed_ids}})
        logging.getLogger(__name__).info(
            f"Seeded {len(SEED_PRODUCTS)} products; removed {result.deleted_count} stale"
        )
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
