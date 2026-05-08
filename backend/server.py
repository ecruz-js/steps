from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import logging
import uuid
import bcrypt
import jwt as pyjwt
import requests
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
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict


# --------- Config ---------
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGO = "HS256"
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@safesteps.app")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin123")
APP_NAME = os.environ.get("APP_NAME", "safesteps")

STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")

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


# --------- Object storage ---------
storage_key: Optional[str] = None


def init_storage() -> Optional[str]:
    global storage_key
    if storage_key:
        return storage_key
    if not EMERGENT_KEY:
        logger.warning("EMERGENT_LLM_KEY missing; storage disabled")
        return None
    try:
        r = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
        r.raise_for_status()
        storage_key = r.json()["storage_key"]
        logger.info("Storage initialized")
        return storage_key
    except Exception as e:
        logger.exception(f"Storage init failed: {e}")
        return None


def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Storage no disponible")
    r = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data,
        timeout=120,
    )
    if r.status_code == 403:
        # storage_key expired — refresh and retry once
        globals()["storage_key"] = None
        key = init_storage()
        r = requests.put(
            f"{STORAGE_URL}/objects/{path}",
            headers={"X-Storage-Key": key, "Content-Type": content_type},
            data=data,
            timeout=120,
        )
    r.raise_for_status()
    return r.json()


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
        "image": "https://customer-assets.emergentagent.com/job_safesteps-app/artifacts/w2d8t7pr_6e0b5fe8-6d48-43b4-8dbd-f990ed6e5537.jpeg",
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
        "image": "https://customer-assets.emergentagent.com/job_safesteps-app/artifacts/g9lsqo60_0b0eea54-100c-4826-ac85-7732eece2478.jpeg",
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
        "image": "https://customer-assets.emergentagent.com/job_safesteps-app/artifacts/rh9nuhvh_ed1e9674-eb32-449a-afbb-59e084565d04.jpeg",
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
        "image": "https://customer-assets.emergentagent.com/job_safesteps-app/artifacts/20n8tdsw_d0d51ac7-b60a-4d2e-a07a-1620ce338a5e.jpeg",
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
        "image": "https://customer-assets.emergentagent.com/job_safesteps-app/artifacts/0ja1rnmy_f699890b-ff19-41d4-b755-0a80b848fb2a.jpeg",
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
        "image": "https://customer-assets.emergentagent.com/job_safesteps-app/artifacts/nwo3mm6n_46718b04-e1a8-4208-b5ca-53187a120ebc.jpeg",
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
        "image": "https://customer-assets.emergentagent.com/job_safesteps-app/artifacts/e1zrdjy9_8a078bee-1e87-4199-9356-03ddf55cc37a.jpeg",
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
        # do NOT delete — admin may have created custom products
        logger.info(f"Ensured {len(SEED_PRODUCTS)} seed products exist")
    except Exception as e:
        logger.exception(f"Seed error: {e}")

    # Seed default settings if missing
    if not await db.settings.find_one({"id": "global"}):
        await db.settings.insert_one({"id": "global", **Settings().model_dump()})

    # Init storage (non-blocking)
    init_storage()


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
    request: Request,
    file: UploadFile = File(...),
    admin: dict = Depends(get_current_admin),
):
    if file.content_type not in ALLOWED_MIMES:
        raise HTTPException(status_code=400, detail="Tipo de archivo no permitido")
    data = await file.read()
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Archivo demasiado grande (máx. 5 MB)")
    ext = file.filename.split(".")[-1].lower() if file.filename and "." in file.filename else "bin"
    path = f"{APP_NAME}/products/{uuid.uuid4().hex}.{ext}"
    result = put_object(path, data, file.content_type)
    await db.uploads.insert_one({
        "id": str(uuid.uuid4()),
        "storage_path": result["path"],
        "size": result.get("size", len(data)),
        "content_type": file.content_type,
        "uploaded_by": admin["id"],
        "created_at": now_iso(),
    })
    base = str(request.base_url).rstrip("/")
    public_url = f"{base}/api/files/{result['path']}"
    return {"url": public_url, "path": result["path"], "size": result.get("size", len(data))}


# --------- File serving (public, no auth — products must show on public site) ---------
@api_router.get("/files/{path:path}")
async def serve_file(path: str):
    from fastapi.responses import Response
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Storage no disponible")
    r = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    if r.status_code == 404:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    r.raise_for_status()
    return Response(content=r.content, media_type=r.headers.get("Content-Type", "application/octet-stream"))


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
