from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import logging
import uuid
import bcrypt
import jwt as pyjwt
import re
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Literal

from fastapi import (
    FastAPI,
    APIRouter,
    HTTPException,
    Depends,
    Request,
    UploadFile,
    File,
)
from fastapi.responses import Response
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict, field_validator


# --------- Config ---------
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGO = "HS256"
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@safesteps.app")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin123")
APP_NAME = os.environ.get("APP_NAME", "safesteps")
DEFAULT_PRODUCT_IMAGE = "/api/files/prod-pulsera-champion"
LEGACY_PRODUCT_PLACEHOLDER = "/images/products/safe-steps-product.svg"
APPWRITE_ENDPOINT = os.environ.get("APPWRITE_ENDPOINT", "https://cloud.appwrite.io/v1").strip()
APPWRITE_PROJECT_ID = os.environ.get("APPWRITE_PROJECT_ID", "").strip()
APPWRITE_BUCKET_ID = os.environ.get("APPWRITE_BUCKET_ID", "").strip()
APPWRITE_API_KEY = os.environ.get("APPWRITE_API_KEY", "").strip()

DEFAULT_WHATSAPP_NUMBER = "+18095551234"

app = FastAPI(title="Safe Steps API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# --------- Auth helpers ---------
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=12),
        "type": "access",
    }
    return pyjwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


async def get_current_admin(request: Request) -> dict:
    auth = request.headers.get("Authorization", "")
    token = auth[7:] if auth.startswith("Bearer ") else None
    if not token:
        raise HTTPException(status_code=401, detail="No autenticado")
    try:
        payload = pyjwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Sesión expirada")
    except pyjwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Acceso denegado")
    return user


# --------- Appwrite file storage ---------
appwrite_storage = None


def is_remote_url(value: Optional[str]) -> bool:
    return bool(value and value.lower().startswith(("http://", "https://")))


def normalize_image(value: Optional[str]) -> str:
    if not value or is_remote_url(value):
        return DEFAULT_PRODUCT_IMAGE
    return value


def reject_remote_image(value: Optional[str]) -> Optional[str]:
    if is_remote_url(value):
        raise ValueError("La imagen debe ser una ruta local o una subida interna.")
    return value


def require_appwrite_config() -> None:
    missing = [
        name
        for name, value in {
            "APPWRITE_ENDPOINT": APPWRITE_ENDPOINT,
            "APPWRITE_PROJECT_ID": APPWRITE_PROJECT_ID,
            "APPWRITE_BUCKET_ID": APPWRITE_BUCKET_ID,
            "APPWRITE_API_KEY": APPWRITE_API_KEY,
        }.items()
        if not value
    ]
    if missing:
        raise HTTPException(
            status_code=500,
            detail=f"Appwrite no configurado. Faltan: {', '.join(missing)}",
        )


def get_appwrite_storage():
    global appwrite_storage
    require_appwrite_config()
    if appwrite_storage:
        return appwrite_storage
    try:
        from appwrite.client import Client
        from appwrite.services.storage import Storage
    except ImportError:
        raise HTTPException(status_code=500, detail="SDK de Appwrite no instalado")

    client = Client()
    client.set_endpoint(APPWRITE_ENDPOINT)
    client.set_project(APPWRITE_PROJECT_ID)
    client.set_key(APPWRITE_API_KEY)
    appwrite_storage = Storage(client)
    return appwrite_storage


def make_file_id() -> str:
    return uuid.uuid4().hex


def safe_filename(filename: Optional[str], ext: str) -> str:
    raw = filename or f"upload.{ext}"
    cleaned = re.sub(r"[^A-Za-z0-9._-]+", "-", raw).strip(".-")
    return cleaned or f"upload.{ext}"


def put_object(file_id: str, filename: str, data: bytes, content_type: str) -> dict:
    try:
        from appwrite.input_file import InputFile
    except ImportError:
        raise HTTPException(status_code=500, detail="SDK de Appwrite no instalado")

    storage = get_appwrite_storage()
    result = storage.create_file(
        bucket_id=APPWRITE_BUCKET_ID,
        file_id=file_id,
        file=InputFile.from_bytes(data, filename=filename, mime_type=content_type),
    )
    payload = result.model_dump() if hasattr(result, "model_dump") else dict(result)
    return {
        "path": payload.get("$id") or payload.get("id") or file_id,
        "size": payload.get("sizeOriginal") or payload.get("sizeoriginal") or len(data),
        "content_type": payload.get("mimeType") or payload.get("mimetype") or content_type,
    }


# --------- Models ---------
class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: str
    price: float
    short_description: str
    description: str
    benefits: List[str] = []
    colors: List[str] = []
    image: str
    featured: bool = False
    active: bool = True
    stock: int = 99

    @field_validator("image", mode="before")
    @classmethod
    def normalize_product_image(cls, value: Optional[str]) -> str:
        return normalize_image(value)


class ProductCreate(BaseModel):
    name: str
    category: str
    price: float
    short_description: str = ""
    description: str = ""
    benefits: List[str] = []
    colors: List[str] = []
    image: str
    featured: bool = False
    active: bool = True
    stock: int = 99

    @field_validator("image")
    @classmethod
    def validate_product_image(cls, value: str) -> str:
        return reject_remote_image(value) or DEFAULT_PRODUCT_IMAGE


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    short_description: Optional[str] = None
    description: Optional[str] = None
    benefits: Optional[List[str]] = None
    colors: Optional[List[str]] = None
    image: Optional[str] = None
    featured: Optional[bool] = None
    active: Optional[bool] = None
    stock: Optional[int] = None

    @field_validator("image")
    @classmethod
    def validate_product_image(cls, value: Optional[str]) -> Optional[str]:
        return reject_remote_image(value)


class ContactMessageCreate(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    phone: Optional[str] = None
    subject: Optional[str] = None
    message: str = Field(min_length=5, max_length=2000)


class ContactMessage(ContactMessageCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=now_iso)


class OrderItem(BaseModel):
    product_id: str
    name: str
    price: float
    quantity: int
    color: Optional[str] = None
    image: Optional[str] = None

    @field_validator("image", mode="before")
    @classmethod
    def normalize_order_image(cls, value: Optional[str]) -> str:
        return normalize_image(value)


class OrderCreate(BaseModel):
    customer_name: str = Field(min_length=2, max_length=80)
    customer_phone: str = Field(min_length=6, max_length=30)
    customer_email: Optional[EmailStr] = None
    address: Optional[str] = None
    city: Optional[str] = None
    notes: Optional[str] = None
    items: List[OrderItem]


class Order(OrderCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_number: str
    subtotal: float
    total: float
    status: Literal["pendiente", "confirmado", "enviado", "entregado", "cancelado"] = "pendiente"
    created_at: str = Field(default_factory=now_iso)


class OrderStatusUpdate(BaseModel):
    status: Literal["pendiente", "confirmado", "enviado", "entregado", "cancelado"]


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class Settings(BaseModel):
    whatsapp_number: str = DEFAULT_WHATSAPP_NUMBER
    contact_email: str = "hola@safesteps.app"
    contact_phone: str = DEFAULT_WHATSAPP_NUMBER
    instagram: str = "@safesteps.app"
    currency: str = "DOP"
    currency_symbol: str = "RD$"
    free_shipping_threshold: float = 3000.0


class SettingsUpdate(BaseModel):
    whatsapp_number: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    instagram: Optional[str] = None
    free_shipping_threshold: Optional[float] = None


# --------- Seed ---------
SEED_PRODUCTS: List[dict] = [
    {
        "id": "prod-pulsera-champion",
        "name": "Pulsera Champion",
        "category": "pulseras",
        "price": 2300.0,
        "short_description": "Pulsera trenzada con dije balón y chip oculto.",
        "description": "Pulsera de estilo moderno con doble banda trenzada en negro intenso y detalles metálicos en plateado brillante, protagonizada por un dije de balón en tonos blanco y negro. Perfecta para amantes del deporte que quieren llevar su pasión con estilo. El chip Safe Steps va oculto dentro del dije en forma de balón de fútbol.",
        "benefits": [
            "Chip Safe Steps oculto en el dije",
            "Doble banda trenzada resistente",
            "Disponible en negro intenso o marrón oscuro",
            "Detalles metálicos plateados",
        ],
        "colors": ["#0A0A0A", "#3E2A1A", "#C0C0C0"],
        "image": "/api/files/prod-pulsera-champion",
        "featured": True,
        "active": True,
        "stock": 50,
    },
    {
        "id": "prod-clips-cherry-crystal",
        "name": "Clips Cherry Crystal",
        "category": "ganchos",
        "price": 1100.0,
        "short_description": "Clips con cerezas facetadas y hojas esmeralda.",
        "description": "Clips decorativos con cerezas facetadas en rojo cristalino y hojas en verde esmeralda, montados sobre una base metálica en plateado. Ideales para looks frescos, juveniles y llenos de vida. El chip Safe Steps va oculto dentro de una de las cerezas.",
        "benefits": [
            "Chip Safe Steps oculto en cereza",
            "Cristales facetados de alto brillo",
            "Base metálica plateada",
            "Diseño juvenil y fresco",
        ],
        "colors": ["#B8002A", "#0F5132", "#C0C0C0"],
        "image": "/api/files/prod-clips-cherry-crystal",
        "featured": False,
        "active": True,
        "stock": 80,
    },
    {
        "id": "prod-collar-sweet-letter",
        "name": "Collar Sweet Letter",
        "category": "collares",
        "price": 2600.0,
        "short_description": "Collar con dije personalizable y lazo rosa.",
        "description": "Collar elegante con cadena de oro acompañado de un dije de lazo en rosa suave y una inicial personalizable en tono dorado sobre fondo rosado. Un regalo perfecto con significado. El chip Safe Steps va oculto dentro del dije con la inicial. Disponible también en plateado.",
        "benefits": [
            "Chip Safe Steps en el dije personalizado",
            "Inicial personalizable A-Z",
            "Disponible en dorado o plateado",
            "Cadena hipoalergénica",
        ],
        "colors": ["#D4AF37", "#C0C0C0", "#F4C2C2"],
        "image": "/api/files/prod-collar-sweet-letter",
        "featured": True,
        "active": True,
        "stock": 40,
    },
    {
        "id": "prod-pinza-lily-bloom",
        "name": "Pinza Lily Bloom",
        "category": "ganchos",
        "price": 1400.0,
        "short_description": "Pinza dorada con flor blanca perlada.",
        "description": "Pinza para el cabello en acabado dorado, decorada con una flor en blanco perlado y hojas en verde suave. Su diseño sofisticado la convierte en una pieza única. Ideal para recogidos elegantes o looks delicados del día a día. El chip Safe Steps va oculto dentro de la flor blanca.",
        "benefits": [
            "Chip Safe Steps oculto en la flor",
            "Acabado dorado de larga duración",
            "Detalles en esmalte resistente",
            "Cierre firme para todo tipo de cabello",
        ],
        "colors": ["#D4AF37", "#FFFFFF", "#0F5132"],
        "image": "/api/files/prod-pinza-lily-bloom",
        "featured": False,
        "active": True,
        "stock": 60,
    },
    {
        "id": "prod-collar-year-tag",
        "name": "Collar Year Tag",
        "category": "collares",
        "price": 2800.0,
        "short_description": "Collar urbano con placa grabada y cadena de esferas.",
        "description": "Collar de estilo urbano con placa metálica alargada en acabado cepillado y un grabado vertical de cuatro dígitos en tipografía digital, ideal para conmemorar un año especial. El diseño se complementa con una cadena de esferas plateada que le aporta un toque moderno y minimalista. El chip Safe Steps va oculto dentro de la placa metálica.",
        "benefits": [
            "Chip Safe Steps en la placa",
            "Año personalizable (4 dígitos)",
            "Acabado cepillado mate",
            "Cadena de esferas resistente",
        ],
        "colors": ["#C0C0C0", "#374151", "#0A0A0A"],
        "image": "/api/files/prod-collar-year-tag",
        "featured": False,
        "active": True,
        "stock": 35,
    },
    {
        "id": "prod-pulsera-little-bloom",
        "name": "Pulsera Little Bloom",
        "category": "pulseras",
        "price": 1700.0,
        "short_description": "Pulsera infantil con dije flor y inicial.",
        "description": "Delicada pulsera infantil en tono dorado que destaca por sus detalles de esferas intercaladas y sus dijes colgantes de esmalte rosa. Incluye una pequeña flor de cinco pétalos y un dije circular con una inicial personalizada, convirtiéndola en un accesorio tierno y ligero para las más pequeñas. El chip Safe Steps va oculto dentro del dije en forma de flor.",
        "benefits": [
            "Chip Safe Steps oculto en la flor",
            "Inicial personalizable",
            "Tamaño infantil ajustable",
            "Materiales hipoalergénicos",
        ],
        "colors": ["#D4AF37", "#F4C2C2", "#FFFFFF"],
        "image": "/api/files/prod-pulsera-little-bloom",
        "featured": True,
        "active": True,
        "stock": 45,
    },
    {
        "id": "prod-clips-velvet-cherry",
        "name": "Clips Velvet Cherry",
        "category": "ganchos",
        "price": 1300.0,
        "short_description": "Clips con lazos de terciopelo y cerezas brillantes.",
        "description": "Clips delicados con lazos en terciopelo rojo vino y cerezas en acabado brillante rojo translúcido, acompañadas de tallos en verde oscuro. Un diseño femenino, dulce y moderno que destaca sin esfuerzo. El chip Safe Steps va oculto dentro de una de las cerezas o dentro de la tela del lazo.",
        "benefits": [
            "Chip Safe Steps en cereza o lazo",
            "Terciopelo de alta calidad",
            "Cerezas en acabado translúcido brillante",
            "Hecho a mano",
        ],
        "colors": ["#7B1F2E", "#1F4D2A"],
        "image": "/api/files/prod-clips-velvet-cherry",
        "featured": True,
        "active": True,
        "stock": 70,
    },
]


@app.on_event("startup")
async def startup():
    # Indexes
    try:
        await db.users.create_index("email", unique=True)
        await db.products.create_index("id", unique=True)
        await db.orders.create_index("id", unique=True)
        await db.orders.create_index("order_number", unique=True)
    except Exception as e:
        logger.warning(f"Index creation: {e}")

    # Seed admin
    existing = await db.users.find_one({"email": ADMIN_EMAIL})
    if not existing:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": ADMIN_EMAIL,
            "password_hash": hash_password(ADMIN_PASSWORD),
            "name": "Admin",
            "role": "admin",
            "created_at": now_iso(),
        })
        logger.info(f"Admin seeded: {ADMIN_EMAIL}")
    elif not verify_password(ADMIN_PASSWORD, existing["password_hash"]):
        await db.users.update_one(
            {"email": ADMIN_EMAIL},
            {"$set": {"password_hash": hash_password(ADMIN_PASSWORD)}},
        )
        logger.info(f"Admin password rotated: {ADMIN_EMAIL}")

    # Seed/upsert products (idempotent, removes stale)
    try:
        for p in SEED_PRODUCTS:
            await db.products.update_one(
                {"id": p["id"]},
                {"$setOnInsert": {**p}},
                upsert=True,
            )
            await db.products.update_one(
                {
                    "id": p["id"],
                    "$or": [
                        {"image": {"$regex": r"^https?://", "$options": "i"}},
                        {"image": {"$exists": False}},
                        {"image": ""},
                        {"image": DEFAULT_PRODUCT_IMAGE},
                        {"image": LEGACY_PRODUCT_PLACEHOLDER},
                        {"image": {"$regex": r"^/images/", "$options": "i"}},
                    ],
                },
                {"$set": {"image": p["image"]}},
            )
        await db.orders.update_many(
            {"items.image": {"$regex": r"^https?://", "$options": "i"}},
            {"$set": {"items.$[item].image": DEFAULT_PRODUCT_IMAGE}},
            array_filters=[{"item.image": {"$regex": r"^https?://", "$options": "i"}}],
        )
        await db.orders.update_many(
            {"items.image": LEGACY_PRODUCT_PLACEHOLDER},
            {"$set": {"items.$[item].image": DEFAULT_PRODUCT_IMAGE}},
            array_filters=[{"item.image": LEGACY_PRODUCT_PLACEHOLDER}],
        )
        # do NOT delete — admin may have created custom products
        logger.info(f"Ensured {len(SEED_PRODUCTS)} seed products exist")
    except Exception as e:
        logger.exception(f"Seed error: {e}")

    # Seed default settings if missing
    if not await db.settings.find_one({"id": "global"}):
        await db.settings.insert_one({"id": "global", **Settings().model_dump()})


# --------- Public routes ---------
@api_router.get("/")
async def root():
    return {"message": "Safe Steps API", "status": "ok"}


@api_router.get("/products", response_model=List[Product])
async def list_products(category: Optional[str] = None, include_inactive: bool = False):
    query: dict = {}
    if not include_inactive:
        query["active"] = True
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


@api_router.get("/settings", response_model=Settings)
async def get_settings():
    doc = await db.settings.find_one({"id": "global"}, {"_id": 0, "id": 0})
    return doc or Settings().model_dump()


@api_router.post("/contact", response_model=ContactMessage, status_code=201)
async def create_contact(payload: ContactMessageCreate):
    msg = ContactMessage(**payload.model_dump())
    await db.contact_messages.insert_one(msg.model_dump())
    return msg


@api_router.post("/orders", response_model=Order, status_code=201)
async def create_order(payload: OrderCreate):
    if not payload.items:
        raise HTTPException(status_code=400, detail="El carrito está vacío")
    subtotal = sum(it.price * it.quantity for it in payload.items)
    # short order number e.g. SS-2A4F9
    order_number = f"SS-{uuid.uuid4().hex[:5].upper()}"
    order = Order(
        order_number=order_number,
        subtotal=round(subtotal, 2),
        total=round(subtotal, 2),
        **payload.model_dump(),
    )
    await db.orders.insert_one(order.model_dump())
    return order


# --------- Auth ---------
@api_router.post("/auth/login")
async def login(payload: LoginRequest):
    user = await db.users.find_one({"email": payload.email.lower()})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    token = create_access_token(user["id"], user["email"])
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user.get("name", "Admin"),
            "role": user.get("role", "admin"),
        },
    }


@api_router.get("/auth/me")
async def me(admin: dict = Depends(get_current_admin)):
    return admin


# --------- Admin: contact ---------
@api_router.get("/admin/contact-messages", response_model=List[ContactMessage])
async def list_contact_messages(_: dict = Depends(get_current_admin)):
    docs = await db.contact_messages.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return docs


# --------- Admin: products CRUD ---------
@api_router.post("/admin/products", response_model=Product, status_code=201)
async def admin_create_product(payload: ProductCreate, _: dict = Depends(get_current_admin)):
    p = Product(**payload.model_dump())
    await db.products.insert_one(p.model_dump())
    return p


@api_router.put("/admin/products/{product_id}", response_model=Product)
async def admin_update_product(
    product_id: str, payload: ProductUpdate, _: dict = Depends(get_current_admin)
):
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update:
        raise HTTPException(status_code=400, detail="Sin cambios")
    res = await db.products.update_one({"id": product_id}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    doc = await db.products.find_one({"id": product_id}, {"_id": 0})
    return doc


@api_router.delete("/admin/products/{product_id}", status_code=204)
async def admin_delete_product(product_id: str, _: dict = Depends(get_current_admin)):
    res = await db.products.delete_one({"id": product_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Producto no encontrado")


# --------- Admin: orders ---------
@api_router.get("/admin/orders", response_model=List[Order])
async def admin_list_orders(_: dict = Depends(get_current_admin)):
    docs = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return docs


@api_router.patch("/admin/orders/{order_id}/status", response_model=Order)
async def admin_update_order_status(
    order_id: str, payload: OrderStatusUpdate, _: dict = Depends(get_current_admin)
):
    res = await db.orders.update_one({"id": order_id}, {"$set": {"status": payload.status}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    doc = await db.orders.find_one({"id": order_id}, {"_id": 0})
    return doc


@api_router.delete("/admin/orders/{order_id}", status_code=204)
async def admin_delete_order(order_id: str, _: dict = Depends(get_current_admin)):
    res = await db.orders.delete_one({"id": order_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")


@api_router.get("/admin/stats")
async def admin_stats(_: dict = Depends(get_current_admin)):
    total_orders = await db.orders.count_documents({})
    pending = await db.orders.count_documents({"status": "pendiente"})
    completed = await db.orders.count_documents({"status": "entregado"})
    total_products = await db.products.count_documents({})
    active_products = await db.products.count_documents({"active": True})
    revenue_cursor = db.orders.aggregate(
        [{"$match": {"status": {"$ne": "cancelado"}}}, {"$group": {"_id": None, "sum": {"$sum": "$total"}}}]
    )
    revenue_doc = await revenue_cursor.to_list(1)
    revenue = revenue_doc[0]["sum"] if revenue_doc else 0
    contact_count = await db.contact_messages.count_documents({})
    return {
        "total_orders": total_orders,
        "pending_orders": pending,
        "completed_orders": completed,
        "total_products": total_products,
        "active_products": active_products,
        "revenue": round(revenue, 2),
        "contact_messages": contact_count,
    }


# --------- Admin: settings ---------
@api_router.put("/admin/settings", response_model=Settings)
async def admin_update_settings(payload: SettingsUpdate, _: dict = Depends(get_current_admin)):
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    if update:
        await db.settings.update_one({"id": "global"}, {"$set": update}, upsert=True)
    doc = await db.settings.find_one({"id": "global"}, {"_id": 0, "id": 0})
    return doc or Settings().model_dump()


# --------- Admin: image upload ---------
ALLOWED_MIMES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_UPLOAD_BYTES = 5 * 1024 * 1024  # 5 MB


@api_router.post("/admin/upload")
async def admin_upload(
    file: UploadFile = File(...),
    admin: dict = Depends(get_current_admin),
):
    if file.content_type not in ALLOWED_MIMES:
        raise HTTPException(status_code=400, detail="Tipo de archivo no permitido")
    data = await file.read()
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Archivo demasiado grande (máx. 5 MB)")
    ext = file.filename.split(".")[-1].lower() if file.filename and "." in file.filename else "bin"
    file_id = make_file_id()
    filename = safe_filename(file.filename, ext)
    result = put_object(file_id, filename, data, file.content_type)
    await db.uploads.insert_one({
        "id": str(uuid.uuid4()),
        "storage_path": result["path"],
        "filename": filename,
        "size": result.get("size", len(data)),
        "content_type": file.content_type,
        "uploaded_by": admin["id"],
        "created_at": now_iso(),
    })
    public_url = f"/api/files/{result['path']}"
    return {"url": public_url, "path": result["path"], "size": result.get("size", len(data))}


# --------- File serving (public, no auth — products must show on public site) ---------
@api_router.get("/files/{path:path}")
async def serve_file(path: str):
    storage = get_appwrite_storage()
    upload = await db.uploads.find_one({"storage_path": path}, {"_id": 0})
    media_type = (upload or {}).get("content_type")
    if not media_type:
        try:
            metadata = storage.get_file(
                bucket_id=APPWRITE_BUCKET_ID,
                file_id=path,
            )
            payload = metadata.model_dump() if hasattr(metadata, "model_dump") else dict(metadata)
            media_type = payload.get("mimeType") or payload.get("mimetype")
        except Exception:
            media_type = None

    try:
        content = storage.get_file_view(
            bucket_id=APPWRITE_BUCKET_ID,
            file_id=path,
        )
    except Exception as e:
        logger.exception(f"Appwrite file fetch failed: {e}")
        raise HTTPException(status_code=404, detail="Archivo no encontrado")

    return Response(content=content, media_type=media_type or "application/octet-stream")


# --------- Wire up ---------
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown():
    client.close()
