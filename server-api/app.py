# -*- coding: utf-8 -*-
import os
import re
import uuid
import bcrypt
import jwt
from functools import wraps
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load .env relative to this file so it works regardless of CWD
_HERE = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(_HERE, ".env"))

app = Flask(__name__)
_raw_origins = os.environ.get("ALLOWED_ORIGINS", "*")
_allowed_origins = [o.strip() for o in _raw_origins.split(",")] if _raw_origins != "*" else "*"
CORS(app, origins=_allowed_origins)

# ------------------------------------------------------------------
# Database — Neon PostgreSQL when reachable, SQLite fallback offline
# ------------------------------------------------------------------
def _resolve_db_url() -> str:
    """
    Attempt a real SQLAlchemy connection to Neon (SELECT 1, 5s timeout).
    If it succeeds → use DATABASE_URL (PostgreSQL).
    If it fails for any reason → fall back to local SQLite.
    A raw TCP check is unreliable for Neon because it requires SSL and
    some networks block port 5432; an actual query attempt is definitive.
    """
    raw = os.environ.get("DATABASE_URL", "")
    if raw.startswith("postgres://"):
        raw = raw.replace("postgres://", "postgresql://", 1)

    if not raw or not raw.startswith("postgresql"):
        print("[DB] DATABASE_URL not set or not a PostgreSQL URL — using local SQLite.")
        return "sqlite:///moduserv_server.db"

    # Show masked URL so we can confirm it was loaded
    masked = raw[:30] + "..." if len(raw) > 30 else raw
    print(f"[DB] DATABASE_URL found: {masked}")

    try:
        from sqlalchemy import create_engine, text as sa_text
        probe = create_engine(
            raw,
            connect_args={"connect_timeout": 5},
            pool_size=1,
            max_overflow=0,
        )
        with probe.connect() as conn:
            conn.execute(sa_text("SELECT 1"))
        probe.dispose()
        print("[DB] ✓ Neon PostgreSQL reachable — using cloud database.")
        return raw
    except Exception as e:
        print(f"[DB] ✗ Neon connection failed: {e}")
        print("[DB] Falling back to local SQLite.")
        return "sqlite:///moduserv_server.db"

_db_url = _resolve_db_url()
app.config["SQLALCHEMY_DATABASE_URI"] = _db_url
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["JSON_AS_ASCII"] = False  # serve non-ASCII chars as UTF-8, not \uXXXX escapes

# ------------------------------------------------------------------
# JWT configuration
# ------------------------------------------------------------------
JWT_SECRET = os.environ.get("JWT_SECRET", "moduserv-dev-secret-change-in-prod")
JWT_ALGORITHM = "HS256"
JWT_EXP_HOURS = 8

db = SQLAlchemy(app)

# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------

def now_iso():
    return datetime.utcnow().replace(microsecond=0).isoformat() + "Z"

def new_id(prefix=""):
    return f"{prefix}{uuid.uuid4().hex[:12]}"

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

def is_valid_email(email: str) -> bool:
    return bool(EMAIL_RE.match(email))

def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False

def is_bcrypt_hash(value: str) -> bool:
    return value.startswith("$2b$") or value.startswith("$2a$")

def issue_token(user) -> str:
    payload = {
        "sub": user.id,
        "username": user.username,
        "role": user.role,
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXP_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Authentication required."}), 401
        token = auth_header[7:]
        try:
            jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired. Please log in again."}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token."}), 401
        return f(*args, **kwargs)
    return decorated

def get_current_user_id() -> str | None:
    """Extract user ID from the Bearer JWT in the current request."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    try:
        payload = jwt.decode(auth_header[7:], JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload.get("sub")
    except Exception:
        return None

# ------------------------------------------------------------------
# Models
# ------------------------------------------------------------------

class User(db.Model):
    id = db.Column(db.String(50), primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(20), nullable=False, default="Active")
    created_at = db.Column(db.String(100), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "role": self.role,
            "status": self.status,
            "createdAt": self.created_at,
        }


class Job(db.Model):
    id = db.Column(db.String(50), primary_key=True)
    site_id = db.Column(db.String(50), nullable=False, default="site-1")

    customer_first_name = db.Column(db.String(100))
    customer_last_name = db.Column(db.String(100))
    customer_email = db.Column(db.String(255))
    customer_phone = db.Column(db.String(100))
    address_line_1 = db.Column(db.String(255))
    address_line_2 = db.Column(db.String(255))
    county = db.Column(db.String(100))
    postcode = db.Column(db.String(50))

    brand = db.Column(db.String(100))
    device_type = db.Column(db.String(100))
    device_model = db.Column(db.String(255))
    colour = db.Column(db.String(100))
    imei = db.Column(db.String(50))
    serial_number = db.Column(db.String(100))
    check_in_condition = db.Column(db.Text)

    part_required = db.Column(db.String(20))
    part_allocated = db.Column(db.String(20))
    part_name = db.Column(db.String(255))
    part_type = db.Column(db.String(100))
    part_supplier = db.Column(db.String(255))
    part_status = db.Column(db.String(100))

    payment_amount = db.Column(db.Float)
    payment_type = db.Column(db.String(100))
    payment_status = db.Column(db.String(100))

    qc_status = db.Column(db.String(50))
    backglass = db.Column(db.String(50))
    status = db.Column(db.String(100), nullable=False, default="New")
    priority = db.Column(db.String(50), nullable=False, default="Medium")
    suggested_priority = db.Column(db.String(50), nullable=False, default="Medium")
    category = db.Column(db.String(100), nullable=False, default="General")
    priority_was_overridden = db.Column(db.Boolean, nullable=False, default=False)
    ber = db.Column(db.Boolean, nullable=False, default=False)

    repair_start_time = db.Column(db.String(100))
    repair_end_time = db.Column(db.String(100))
    repair_duration_minutes = db.Column(db.Integer)

    is_deleted = db.Column(db.Boolean, nullable=False, default=False)
    deleted_at = db.Column(db.String(100))
    deleted_by = db.Column(db.String(100))
    restored_at = db.Column(db.String(100))
    restored_by = db.Column(db.String(100))

    def to_dict(self):
        return {
            "id": self.id,
            "siteId": self.site_id or "site-1",
            "customerFirstName": self.customer_first_name or "",
            "customerLastName": self.customer_last_name or "",
            "customerEmail": self.customer_email or "",
            "customerPhone": self.customer_phone or "",
            "addressLine1": self.address_line_1 or "",
            "addressLine2": self.address_line_2 or "",
            "county": self.county or "",
            "postcode": self.postcode or "",
            "brand": self.brand or "",
            "deviceType": self.device_type or "",
            "deviceModel": self.device_model or "",
            "colour": self.colour or "",
            "imei": self.imei or "",
            "serialNumber": self.serial_number or "",
            "checkInCondition": self.check_in_condition or "",
            "partRequired": self.part_required or "",
            "partAllocated": self.part_allocated or "",
            "partName": self.part_name or "",
            "partType": self.part_type or "",
            "partSupplier": self.part_supplier or "",
            "partStatus": self.part_status or "",
            "paymentAmount": self.payment_amount if self.payment_amount is not None else "",
            "paymentType": self.payment_type or "",
            "paymentStatus": self.payment_status or "",
            "qcStatus": self.qc_status or "",
            "backglass": self.backglass or "",
            "status": self.status,
            "priority": self.priority,
            "suggestedPriority": self.suggested_priority,
            "category": self.category,
            "priorityWasOverridden": self.priority_was_overridden,
            "ber": self.ber,
            "repairStartTime": self.repair_start_time or "",
            "repairEndTime": self.repair_end_time or "",
            "repairDurationMinutes": self.repair_duration_minutes if self.repair_duration_minutes is not None else "",
            "isDeleted": self.is_deleted,
            "deletedAt": self.deleted_at or "",
            "deletedBy": self.deleted_by or "",
            "restoredAt": self.restored_at or "",
            "restoredBy": self.restored_by or "",
        }


class JobStatusHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    job_id = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(100), nullable=False)
    changed_at = db.Column(db.String(100), nullable=False)
    changed_by = db.Column(db.String(100), nullable=False)

    def to_dict(self):
        return {"id": self.id, "jobId": self.job_id, "status": self.status,
                "changedAt": self.changed_at, "changedBy": self.changed_by}


class JobNote(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    job_id = db.Column(db.String(50), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.String(100), nullable=False)
    created_by = db.Column(db.String(100), nullable=False)

    def to_dict(self):
        return {"id": self.id, "jobId": self.job_id, "content": self.content,
                "createdAt": self.created_at, "createdBy": self.created_by}


class JobActivity(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    job_id = db.Column(db.String(50), nullable=False)
    action = db.Column(db.String(255), nullable=False)
    details = db.Column(db.Text)
    created_at = db.Column(db.String(100), nullable=False)
    created_by = db.Column(db.String(100), nullable=False)

    def to_dict(self):
        return {"id": self.id, "jobId": self.job_id, "action": self.action,
                "details": self.details or "", "createdAt": self.created_at,
                "createdBy": self.created_by}


class DeviceOption(db.Model):
    id = db.Column(db.String(50), primary_key=True)
    category = db.Column(db.String(50), nullable=False)
    label = db.Column(db.String(255), nullable=False)

    def to_dict(self):
        return {"id": self.id, "category": self.category, "label": self.label}


# ------------------------------------------------------------------
# Appointment — full record stored as JSON + indexed columns for queries
# ------------------------------------------------------------------
class Appointment(db.Model):
    id = db.Column(db.String(50), primary_key=True)
    site_id = db.Column(db.String(50), nullable=False, index=True)
    status = db.Column(db.String(100), nullable=False, default="Awaiting Diagnosis")
    customer_name = db.Column(db.String(255))   # for list display / search
    scheduled_date = db.Column(db.String(100))  # for calendar queries
    is_deleted = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.String(100), nullable=False)
    updated_at = db.Column(db.String(100))
    record = db.Column(db.JSON, nullable=False)  # full AppointmentRecord

    def to_dict(self):
        data = self.record or {}
        # Keep indexed fields authoritative
        data["id"] = self.id
        data["siteId"] = self.site_id
        data["status"] = self.status
        data["createdAt"] = self.created_at
        data["updatedAt"] = self.updated_at or self.created_at
        return data


# ------------------------------------------------------------------
# Customer — key columns + full record JSON
# ------------------------------------------------------------------
class Customer(db.Model):
    id = db.Column(db.String(50), primary_key=True)
    site_id = db.Column(db.String(50), nullable=False, index=True)
    first_name = db.Column(db.String(100))
    last_name = db.Column(db.String(100))
    email = db.Column(db.String(255))
    phone = db.Column(db.String(100))
    created_at = db.Column(db.String(100), nullable=False)
    updated_at = db.Column(db.String(100))
    record = db.Column(db.JSON, nullable=False)

    def to_dict(self):
        data = self.record or {}
        data["id"] = self.id
        data["siteId"] = self.site_id
        data["createdAt"] = self.created_at
        data["updatedAt"] = self.updated_at or self.created_at
        return data


# ------------------------------------------------------------------
# Form / FormResponse
# ------------------------------------------------------------------
class Form(db.Model):
    id = db.Column(db.String(50), primary_key=True)
    site_id = db.Column(db.String(50), nullable=False, index=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    status = db.Column(db.String(50), nullable=False, default="Draft")
    location = db.Column(db.String(50), nullable=False, default="system")
    fields = db.Column(db.JSON, nullable=False, default=list)
    created_at = db.Column(db.String(100), nullable=False)
    updated_at = db.Column(db.String(100))

    def to_dict(self):
        return {
            "id": self.id,
            "siteId": self.site_id,
            "name": self.name,
            "description": self.description or "",
            "status": self.status,
            "location": self.location,
            "fields": self.fields or [],
            "createdAt": self.created_at,
            "updatedAt": self.updated_at or self.created_at,
        }


class FormResponse(db.Model):
    id = db.Column(db.String(50), primary_key=True)
    form_id = db.Column(db.String(50), nullable=False, index=True)
    submitted_by = db.Column(db.String(100))
    submitted_at = db.Column(db.String(100), nullable=False)
    values = db.Column(db.JSON, nullable=False, default=dict)

    def to_dict(self):
        return {
            "id": self.id,
            "formId": self.form_id,
            "submittedBy": self.submitted_by or "",
            "submittedAt": self.submitted_at,
            "values": self.values or {},
        }


# ------------------------------------------------------------------
# Role registry + permissions
# ------------------------------------------------------------------
class Role(db.Model):
    name       = db.Column(db.String(100), primary_key=True)
    kind       = db.Column(db.String(20), nullable=False, default="custom")  # system | custom
    created_at = db.Column(db.String(100), nullable=False)

    def to_dict(self):
        return {"name": self.name, "kind": self.kind, "createdAt": self.created_at}


class RolePermissions(db.Model):
    role_name   = db.Column(db.String(100), primary_key=True)
    permissions = db.Column(db.JSON, nullable=False)
    updated_at  = db.Column(db.String(100), nullable=False)

    def to_dict(self):
        return {"roleName": self.role_name, "permissions": self.permissions, "updatedAt": self.updated_at}


# ------------------------------------------------------------------
# User settings (per-user preferences)
# ------------------------------------------------------------------
class UserSettings(db.Model):
    user_id    = db.Column(db.String(50), primary_key=True)
    settings   = db.Column(db.JSON, nullable=False)
    updated_at = db.Column(db.String(100), nullable=False)

    def to_dict(self):
        return {"userId": self.user_id, "settings": self.settings, "updatedAt": self.updated_at}


# ------------------------------------------------------------------
# Location + LocationAccess
# ------------------------------------------------------------------
class Location(db.Model):
    id         = db.Column(db.String(50), primary_key=True)
    name       = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.String(100), nullable=False)

    def to_dict(self):
        return {"id": self.id, "name": self.name, "createdAt": self.created_at}


class LocationAccess(db.Model):
    id          = db.Column(db.String(50), primary_key=True)
    location_id = db.Column(db.String(50), db.ForeignKey("location.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id     = db.Column(db.String(50), nullable=False)
    __table_args__ = (db.UniqueConstraint("location_id", "user_id", name="uq_loc_user"),)


# ------------------------------------------------------------------
# IntakeSiteOptions — one row per site, stores full options blob
# ------------------------------------------------------------------
class IntakeSiteOptions(db.Model):
    site_id = db.Column(db.String(50), primary_key=True)
    data = db.Column(db.JSON, nullable=False)
    updated_at = db.Column(db.String(100))

    def to_dict(self):
        return {"siteId": self.site_id, "data": self.data, "updatedAt": self.updated_at}


# ------------------------------------------------------------------
# AuditEntry
# ------------------------------------------------------------------
class AuditEntry(db.Model):
    id = db.Column(db.String(50), primary_key=True)
    job_id = db.Column(db.String(100))
    action = db.Column(db.String(100), nullable=False)
    message = db.Column(db.Text)
    site_id = db.Column(db.String(50), index=True)
    created_at = db.Column(db.String(100), nullable=False)
    created_by = db.Column(db.String(100))
    entity_type = db.Column(db.String(50))

    def to_dict(self):
        return {
            "id": self.id,
            "jobId": self.job_id or "",
            "action": self.action,
            "message": self.message or "",
            "siteId": self.site_id or "",
            "createdAt": self.created_at,
            "createdBy": self.created_by or "",
            "entityType": self.entity_type or "",
        }


# ------------------------------------------------------------------
# Activity / history helpers (jobs)
# ------------------------------------------------------------------

def add_activity(job_id, action, details, performed_by="System"):
    db.session.add(JobActivity(job_id=job_id, action=action, details=details,
                               created_at=now_iso(), created_by=performed_by))

def add_status_history(job_id, status, changed_by="System"):
    db.session.add(JobStatusHistory(job_id=job_id, status=status,
                                    changed_at=now_iso(), changed_by=changed_by))

# ------------------------------------------------------------------
# Seed + migration
# ------------------------------------------------------------------

def seed_default_users():
    if User.query.count() == 0:
        db.session.add(User(id="USR-001", username="admin",
                            password=hash_password("admin123"),
                            role="Primary Admin", status="Active", created_at=now_iso()))
        db.session.commit()

def migrate_passwords():
    changed = False
    for user in User.query.all():
        if not is_bcrypt_hash(user.password):
            user.password = hash_password(user.password)
            changed = True
    if changed:
        db.session.commit()

def seed_device_options():
    if DeviceOption.query.count() == 0:
        seed_items = [
            ("opt-001", "brand", "Apple"), ("opt-002", "brand", "Samsung"),
            ("opt-003", "brand", "Google"), ("opt-004", "brand", "Huawei"),
            ("opt-005", "brand", "Xiaomi"),
            ("opt-006", "deviceType", "Phone"), ("opt-007", "deviceType", "Tablet"),
            ("opt-008", "deviceType", "Laptop"), ("opt-009", "deviceType", "Smartwatch"),
            ("opt-010", "deviceModel", "iPhone 13"), ("opt-011", "deviceModel", "iPhone 14 Pro"),
            ("opt-012", "deviceModel", "Samsung S22"), ("opt-013", "deviceModel", "Pixel 7"),
            ("opt-014", "deviceModel", "iPad Air 5"),
            ("opt-015", "colour", "Black"), ("opt-016", "colour", "White"),
            ("opt-017", "colour", "Blue"), ("opt-018", "colour", "Red"),
            ("opt-019", "colour", "Gold"), ("opt-020", "colour", "Silver"),
        ]
        for option_id, category, label in seed_items:
            db.session.add(DeviceOption(id=option_id, category=category, label=label))
        db.session.commit()

SYSTEM_ROLES = ["Primary Admin", "Administrator", "Technician", "Sales Assistant", "Receptionist"]

def seed_default_roles():
    for name in SYSTEM_ROLES:
        if not db.session.get(Role, name):
            db.session.add(Role(name=name, kind="system", created_at=now_iso()))
    db.session.commit()

def seed_default_locations():
    if Location.query.count() == 0:
        defaults = [
            ("site-1", "Downtown Store"),
            ("site-2", "North Branch"),
            ("site-3", "East Location"),
        ]
        for loc_id, loc_name in defaults:
            db.session.add(Location(id=loc_id, name=loc_name, created_at=now_iso()))
        db.session.commit()

def migrate_schema():
    """Add columns that were not present in older DB versions."""
    from sqlalchemy import text
    migrations = [
        "ALTER TABLE audit_entry ADD COLUMN entity_type VARCHAR(50)",
    ]
    with db.engine.connect() as conn:
        for sql in migrations:
            try:
                conn.execute(text(sql))
                conn.commit()
            except Exception:
                pass  # column already exists

with app.app_context():
    db.create_all()
    seed_default_users()
    migrate_passwords()
    seed_device_options()
    seed_default_roles()
    seed_default_locations()
    migrate_schema()

# ==================================================================
# Routes — public
# ==================================================================

@app.get("/health")
def health():
    try:
        db.session.execute(db.text("SELECT 1"))
        db_type = "postgresql" if "postgresql" in app.config["SQLALCHEMY_DATABASE_URI"] else "sqlite"
        return jsonify({"status": "ok", "db": db_type})
    except Exception as e:
        return jsonify({"status": "error", "detail": str(e)}), 503

@app.post("/auth/login")
def auth_login():
    body = request.get_json(silent=True) or {}
    username = (body.get("username") or "").strip()
    password = body.get("password") or ""
    if not username or not password:
        return jsonify({"error": "username and password are required"}), 400
    user = User.query.filter(db.func.lower(User.username) == username.lower()).first()
    if user is None or user.status == "Disabled" or not verify_password(password, user.password):
        return jsonify({"error": "Invalid username or password."}), 401
    token = issue_token(user)
    return jsonify({"success": True, "token": token, "user": user.to_dict()})

@app.get("/device-options")
def get_device_options():
    options = DeviceOption.query.order_by(DeviceOption.category.asc(), DeviceOption.label.asc()).all()
    return jsonify([o.to_dict() for o in options])

# ==================================================================
# Routes — protected
# ==================================================================

# ── Users ──────────────────────────────────────────────────────────

@app.get("/users")
@require_auth
def get_users():
    users = User.query.order_by(User.created_at.asc()).all()
    return jsonify([u.to_dict() for u in users])

@app.post("/users")
@require_auth
def create_user():
    body = request.get_json(silent=True) or {}
    username = (body.get("username") or "").strip()
    password = body.get("password") or ""
    role = (body.get("role") or "Technician").strip()
    if not username:
        return jsonify({"error": "Username is required."}), 400
    if len(password.strip()) < 6:
        return jsonify({"error": "Password must be at least 6 characters long."}), 400
    if User.query.filter(db.func.lower(User.username) == username.lower()).first():
        return jsonify({"error": "A user with that username already exists."}), 400
    count = User.query.count()
    new_user = User(id=f"user-{str(count + 1).zfill(3)}", username=username,
                    password=hash_password(password), role=role, status="Active",
                    created_at=now_iso())
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"success": True, "user": new_user.to_dict()}), 201

@app.put("/users/<user_id>")
@require_auth
def update_user(user_id):
    user = db.session.get(User, user_id)
    if user is None:
        return jsonify({"error": "User not found."}), 404
    body = request.get_json(silent=True) or {}
    username = (body.get("username") or "").strip()
    password = body.get("password") or ""
    role = body.get("role") or user.role
    status = body.get("status") or user.status
    if not username:
        return jsonify({"error": "Username is required."}), 400
    if password.strip():
        if len(password.strip()) < 6:
            return jsonify({"error": "Password must be at least 6 characters long."}), 400
        user.password = hash_password(password)
    if User.query.filter(db.func.lower(User.username) == username.lower(),
                         User.id != user_id).first():
        return jsonify({"error": "A user with that username already exists."}), 400
    user.username = username
    user.role = role
    user.status = status
    db.session.commit()
    return jsonify({"success": True, "user": user.to_dict()})

@app.delete("/users/<user_id>")
@require_auth
def delete_user(user_id):
    user = db.session.get(User, user_id)
    if user is None:
        return jsonify({"error": "User not found."}), 404
    if user.username.lower() == "admin":
        return jsonify({"error": "The default admin account cannot be deleted."}), 400
    db.session.delete(user)
    db.session.commit()
    return jsonify({"success": True})

# ── Jobs ───────────────────────────────────────────────────────────

@app.get("/jobs")
@require_auth
def get_jobs():
    site_id = request.args.get("site_id")
    include_deleted = request.args.get("includeDeleted", "false").lower() == "true"
    query = Job.query.order_by(Job.id.asc())
    if site_id:
        query = query.filter_by(site_id=site_id)
    if not include_deleted:
        query = query.filter_by(is_deleted=False)
    return jsonify([j.to_dict() for j in query.all()])

@app.post("/jobs/<job_id>/soft-delete")
@require_auth
def soft_delete_job(job_id):
    body = request.get_json(silent=True) or {}
    performed_by = (body.get("performedBy") or "System").strip()
    job = db.session.get(Job, job_id)
    if job is None:
        return jsonify({"error": "Job not found."}), 404
    if job.is_deleted:
        return jsonify({"error": "Job is already archived."}), 400
    job.is_deleted = True
    job.deleted_at = now_iso()
    job.deleted_by = performed_by
    add_activity(job_id, "Job Archived", f"Job archived by {performed_by}.", performed_by)
    db.session.commit()
    return jsonify({"success": True, "job": job.to_dict()})

@app.post("/jobs/<job_id>/restore")
@require_auth
def restore_job(job_id):
    body = request.get_json(silent=True) or {}
    performed_by = (body.get("performedBy") or "System").strip()
    job = db.session.get(Job, job_id)
    if job is None:
        return jsonify({"error": "Job not found."}), 404
    if not job.is_deleted:
        return jsonify({"error": "Job is not archived."}), 400
    job.is_deleted = False
    job.restored_at = now_iso()
    job.restored_by = performed_by
    add_activity(job_id, "Job Restored", f"Job restored by {performed_by}.", performed_by)
    db.session.commit()
    return jsonify({"success": True, "job": job.to_dict()})

@app.get("/jobs/<job_id>/status-history")
@require_auth
def get_status_history(job_id):
    items = JobStatusHistory.query.filter_by(job_id=job_id).order_by(JobStatusHistory.id.asc()).all()
    return jsonify([i.to_dict() for i in items])

@app.get("/jobs/<job_id>/notes")
@require_auth
def get_job_notes(job_id):
    items = JobNote.query.filter_by(job_id=job_id).order_by(JobNote.id.desc()).all()
    return jsonify([i.to_dict() for i in items])

@app.post("/jobs/<job_id>/notes")
@require_auth
def create_job_note(job_id):
    body = request.get_json(silent=True) or {}
    content = (body.get("content") or "").strip()
    created_by = (body.get("createdBy") or "System").strip()
    if not content:
        return jsonify({"error": "Note content is required."}), 400
    if len(content) > 5000:
        return jsonify({"error": "Note content must be 5000 characters or fewer."}), 400
    note = JobNote(job_id=job_id, content=content, created_at=now_iso(), created_by=created_by)
    db.session.add(note)
    add_activity(job_id, "Note Added", content[:200], created_by)
    db.session.commit()
    return jsonify({"success": True, "note": note.to_dict()}), 201

@app.get("/jobs/<job_id>/activity")
@require_auth
def get_job_activity(job_id):
    items = JobActivity.query.filter_by(job_id=job_id).order_by(JobActivity.id.desc()).all()
    return jsonify([i.to_dict() for i in items])

@app.post("/sync/jobs")
@require_auth
def sync_jobs():
    body = request.get_json(silent=True) or {}
    operation = body.get("operation")
    payload = body.get("payload") or {}
    performed_by = payload.get("updatedBy") or payload.get("createdBy") or "System"

    if not operation:
        return jsonify({"error": "operation is required"}), 400

    job_id = payload.get("id")
    if not job_id:
        return jsonify({"error": "payload.id is required"}), 400

    customer_email = (payload.get("customerEmail") or "").strip()
    if customer_email and not is_valid_email(customer_email):
        return jsonify({"error": "Invalid email address format."}), 400

    valid_statuses = {
        "New", "In Diagnosis", "Awaiting Repair", "In Progress",
        "Post Repair Device Check", "Pending Postage", "Ready For Collection",
        "Ready For Collection Unsuccessful", "Awaiting Customer Reply", "Awaiting Parts",
    }
    incoming_status = payload.get("status", "New")
    if incoming_status not in valid_statuses:
        return jsonify({"error": f"Invalid status value: {incoming_status}"}), 400

    valid_priorities = {"Low", "Medium", "High"}
    incoming_priority = payload.get("priority", "Medium")
    if incoming_priority not in valid_priorities:
        return jsonify({"error": f"Invalid priority value: {incoming_priority}"}), 400

    job = db.session.get(Job, job_id)
    is_new = job is None
    previous_status = None if is_new else job.status
    previous_ber = None if is_new else job.ber

    if job is None:
        job = Job(id=job_id)
        db.session.add(job)

    job.site_id = payload.get("siteId") or payload.get("site_id") or "site-1"
    job.customer_first_name = payload.get("customerFirstName", "")
    job.customer_last_name = payload.get("customerLastName", "")
    job.customer_email = customer_email
    job.customer_phone = payload.get("customerPhone", "")
    job.address_line_1 = payload.get("addressLine1", "")
    job.address_line_2 = payload.get("addressLine2", "")
    job.county = payload.get("county", "")
    job.postcode = payload.get("postcode", "")
    job.brand = payload.get("brand", "")
    job.device_type = payload.get("deviceType", "")
    job.device_model = payload.get("deviceModel", "")
    job.colour = payload.get("colour", "")
    job.imei = payload.get("imei", "")
    job.serial_number = payload.get("serialNumber", "")
    job.check_in_condition = payload.get("checkInCondition", "")
    job.part_required = payload.get("partRequired", "")
    job.part_allocated = payload.get("partAllocated", "")
    job.part_name = payload.get("partName", "")
    job.part_type = payload.get("partType", "")
    job.part_supplier = payload.get("partSupplier", "")
    job.part_status = payload.get("partStatus", "")

    try:
        pa = payload.get("paymentAmount", "")
        job.payment_amount = float(pa) if str(pa).strip() != "" else None
    except Exception:
        job.payment_amount = None

    job.payment_type = payload.get("paymentType", "")
    job.payment_status = payload.get("paymentStatus", "")
    job.qc_status = payload.get("qcStatus", "")
    job.backglass = payload.get("backglass", "")
    job.status = incoming_status
    job.priority = incoming_priority
    job.suggested_priority = payload.get("suggestedPriority", "Medium")
    job.category = payload.get("category", "General")
    job.priority_was_overridden = bool(payload.get("priorityWasOverridden", False))
    job.ber = bool(payload.get("ber", False))
    job.is_deleted = bool(payload.get("isDeleted", False))
    job.deleted_at = payload.get("deletedAt") or job.deleted_at
    job.deleted_by = payload.get("deletedBy") or job.deleted_by
    job.restored_at = payload.get("restoredAt") or job.restored_at
    job.restored_by = payload.get("restoredBy") or job.restored_by

    if job.status == "In Progress" and not job.repair_start_time:
        job.repair_start_time = now_iso()
        add_activity(job_id, "Repair Timer Started", "Timer started when job moved to In Progress.", performed_by)

    if job.status == "Post Repair Device Check" and job.repair_start_time and not job.repair_end_time:
        end_time = datetime.utcnow()
        start_time = datetime.fromisoformat(job.repair_start_time.replace("Z", ""))
        duration = int((end_time - start_time).total_seconds() / 60)
        job.repair_end_time = end_time.replace(microsecond=0).isoformat() + "Z"
        job.repair_duration_minutes = duration
        add_activity(job_id, "Repair Timer Stopped", f"Repair duration recorded as {duration} minutes.", performed_by)

    if is_new:
        add_status_history(job_id, job.status, performed_by)
        add_activity(job_id, "Job Created", f"Job created with status {job.status}.", performed_by)
    else:
        if previous_status != job.status:
            add_status_history(job_id, job.status, performed_by)
            add_activity(job_id, "Status Changed", f"{previous_status} → {job.status}", performed_by)
        if previous_ber is False and job.ber is True:
            add_activity(job_id, "BER Flagged", "Device marked Beyond Economic Repair.", performed_by)

    db.session.commit()
    return jsonify({"success": True, "job": job.to_dict()})

# ── Device options ─────────────────────────────────────────────────

@app.post("/device-options")
@require_auth
def create_device_option():
    body = request.get_json(silent=True) or {}
    category = (body.get("category") or "").strip()
    label = (body.get("label") or "").strip()
    if category not in ["brand", "deviceType", "deviceModel", "colour"]:
        return jsonify({"error": "Invalid category."}), 400
    if not label:
        return jsonify({"error": "Label is required."}), 400
    if len(label) > 100:
        return jsonify({"error": "Label must be 100 characters or fewer."}), 400
    if DeviceOption.query.filter(db.func.lower(DeviceOption.category) == category.lower(),
                                  db.func.lower(DeviceOption.label) == label.lower()).first():
        return jsonify({"error": "That option already exists."}), 400
    count = DeviceOption.query.count()
    option = DeviceOption(id=f"opt-{str(count + 1).zfill(3)}", category=category, label=label)
    db.session.add(option)
    db.session.commit()
    return jsonify({"success": True, "option": option.to_dict()}), 201

# ── Appointments ───────────────────────────────────────────────────

@app.get("/appointments")
@require_auth
def get_appointments():
    site_id = request.args.get("site_id", "site-1")
    rows = (Appointment.query
            .filter_by(site_id=site_id, is_deleted=False)
            .order_by(Appointment.created_at.desc())
            .all())
    return jsonify([r.to_dict() for r in rows])

@app.post("/appointments")
@require_auth
def create_appointment():
    body = request.get_json(silent=True) or {}
    appt_id = body.get("id") or f"APT-{new_id()}"
    site_id = body.get("siteId") or body.get("site_id") or "site-1"
    now = now_iso()

    existing = db.session.get(Appointment, appt_id)
    if existing:
        # Upsert — treat as update
        existing.status = body.get("status", existing.status)
        existing.customer_name = body.get("customer", existing.customer_name)
        existing.scheduled_date = body.get("date", existing.scheduled_date)
        existing.updated_at = now
        existing.record = {**existing.record, **body, "updatedAt": now}
        db.session.commit()
        return jsonify({"success": True, "appointment": existing.to_dict()})

    row = Appointment(
        id=appt_id,
        site_id=site_id,
        status=body.get("status", "Awaiting Diagnosis"),
        customer_name=body.get("customer", ""),
        scheduled_date=body.get("date", ""),
        created_at=body.get("createdAt", now),
        updated_at=now,
        record={**body, "id": appt_id, "siteId": site_id, "createdAt": body.get("createdAt", now), "updatedAt": now},
    )
    db.session.add(row)
    db.session.commit()
    return jsonify({"success": True, "appointment": row.to_dict()}), 201

@app.put("/appointments/<appt_id>")
@require_auth
def update_appointment(appt_id):
    row = db.session.get(Appointment, appt_id)
    if row is None:
        return jsonify({"error": "Appointment not found."}), 404
    body = request.get_json(silent=True) or {}
    now = now_iso()
    row.status = body.get("status", row.status)
    row.customer_name = body.get("customer", row.customer_name)
    row.scheduled_date = body.get("date", row.scheduled_date)
    row.updated_at = now
    row.record = {**row.record, **body, "id": appt_id, "updatedAt": now}
    db.session.commit()
    return jsonify({"success": True, "appointment": row.to_dict()})

@app.delete("/appointments/<appt_id>")
@require_auth
def delete_appointment(appt_id):
    row = db.session.get(Appointment, appt_id)
    if row is None:
        return jsonify({"error": "Appointment not found."}), 404
    db.session.delete(row)
    db.session.commit()
    return jsonify({"success": True})

# ── Customers ──────────────────────────────────────────────────────

@app.get("/customers")
@require_auth
def get_customers():
    site_id = request.args.get("site_id", "site-1")
    rows = Customer.query.filter_by(site_id=site_id).order_by(Customer.created_at.desc()).all()
    return jsonify([r.to_dict() for r in rows])

@app.post("/customers")
@require_auth
def upsert_customer():
    """Create or update a customer by email or phone (dedup logic mirrors frontend)."""
    body = request.get_json(silent=True) or {}
    site_id = body.get("siteId") or body.get("site_id") or "site-1"
    email = (body.get("email") or "").strip().lower()
    phone = (body.get("phoneNumber") or body.get("phone") or "").strip()
    now = now_iso()

    existing = None
    if email:
        existing = Customer.query.filter_by(site_id=site_id).filter(
            db.func.lower(Customer.email) == email).first()
    if not existing and phone:
        existing = Customer.query.filter_by(site_id=site_id, phone=phone).first()

    if existing:
        existing.first_name = body.get("firstName", existing.first_name)
        existing.last_name = body.get("lastName", existing.last_name)
        existing.email = email or existing.email
        existing.phone = phone or existing.phone
        existing.updated_at = now
        existing.record = {**existing.record, **body, "id": existing.id, "updatedAt": now}
        db.session.commit()
        return jsonify({"success": True, "customer": existing.to_dict()})

    customer_id = body.get("id") or f"CUS-{new_id()}"
    row = Customer(
        id=customer_id,
        site_id=site_id,
        first_name=body.get("firstName", ""),
        last_name=body.get("lastName", ""),
        email=email,
        phone=phone,
        created_at=now,
        updated_at=now,
        record={**body, "id": customer_id, "siteId": site_id, "createdAt": now, "updatedAt": now},
    )
    db.session.add(row)
    db.session.commit()
    return jsonify({"success": True, "customer": row.to_dict()}), 201

@app.put("/customers/<customer_id>")
@require_auth
def update_customer(customer_id):
    row = db.session.get(Customer, customer_id)
    if row is None:
        return jsonify({"error": "Customer not found."}), 404
    body = request.get_json(silent=True) or {}
    now = now_iso()
    row.first_name = body.get("firstName", row.first_name)
    row.last_name = body.get("lastName", row.last_name)
    row.email = (body.get("email") or row.email or "").strip().lower()
    row.phone = body.get("phoneNumber") or body.get("phone") or row.phone
    row.updated_at = now
    row.record = {**row.record, **body, "id": customer_id, "updatedAt": now}
    db.session.commit()
    return jsonify({"success": True, "customer": row.to_dict()})

@app.delete("/customers/<customer_id>")
@require_auth
def delete_customer(customer_id):
    row = db.session.get(Customer, customer_id)
    if row is None:
        return jsonify({"error": "Customer not found."}), 404
    db.session.delete(row)
    db.session.commit()
    return jsonify({"success": True})

# ── Forms ──────────────────────────────────────────────────────────

@app.get("/forms")
@require_auth
def get_forms():
    site_id = request.args.get("site_id", "site-1")
    rows = Form.query.filter_by(site_id=site_id).order_by(Form.created_at.desc()).all()
    return jsonify([r.to_dict() for r in rows])

@app.post("/forms")
@require_auth
def create_form():
    body = request.get_json(silent=True) or {}
    site_id = body.get("siteId") or body.get("site_id") or "site-1"
    name = (body.get("name") or "").strip()
    if not name:
        return jsonify({"error": "Form name is required."}), 400
    now = now_iso()
    form_id = body.get("id") or f"FRM-{new_id()}"
    row = Form(
        id=form_id,
        site_id=site_id,
        name=name,
        description=body.get("description", ""),
        status=body.get("status", "Draft"),
        location=body.get("location", "system"),
        fields=body.get("fields", []),
        created_at=body.get("createdAt", now),
        updated_at=now,
    )
    db.session.add(row)
    db.session.commit()
    return jsonify({"success": True, "form": row.to_dict()}), 201

@app.put("/forms/<form_id>")
@require_auth
def update_form(form_id):
    row = db.session.get(Form, form_id)
    if row is None:
        return jsonify({"error": "Form not found."}), 404
    body = request.get_json(silent=True) or {}
    if "name" in body:
        row.name = (body["name"] or "").strip() or row.name
    if "description" in body:
        row.description = body["description"]
    if "status" in body:
        row.status = body["status"]
    if "location" in body:
        row.location = body["location"]
    if "fields" in body:
        row.fields = body["fields"]
    row.updated_at = now_iso()
    db.session.commit()
    return jsonify({"success": True, "form": row.to_dict()})

@app.delete("/forms/<form_id>")
@require_auth
def delete_form(form_id):
    row = db.session.get(Form, form_id)
    if row is None:
        return jsonify({"error": "Form not found."}), 404
    FormResponse.query.filter_by(form_id=form_id).delete()
    db.session.delete(row)
    db.session.commit()
    return jsonify({"success": True})

@app.get("/forms/<form_id>/responses")
@require_auth
def get_form_responses(form_id):
    rows = FormResponse.query.filter_by(form_id=form_id).order_by(FormResponse.submitted_at.desc()).all()
    return jsonify([r.to_dict() for r in rows])

@app.post("/forms/<form_id>/responses")
@require_auth
def create_form_response(form_id):
    body = request.get_json(silent=True) or {}
    resp_id = body.get("id") or f"RES-{new_id()}"
    row = FormResponse(
        id=resp_id,
        form_id=form_id,
        submitted_by=body.get("submittedBy", ""),
        submitted_at=body.get("submittedAt", now_iso()),
        values=body.get("values", {}),
    )
    db.session.add(row)
    db.session.commit()
    return jsonify({"success": True, "response": row.to_dict()}), 201

@app.delete("/form-responses/<resp_id>")
@require_auth
def delete_form_response(resp_id):
    row = db.session.get(FormResponse, resp_id)
    if row is None:
        return jsonify({"error": "Response not found."}), 404
    db.session.delete(row)
    db.session.commit()
    return jsonify({"success": True})

# ── Intake options ─────────────────────────────────────────────────

@app.get("/intake-options")
@require_auth
def get_intake_options():
    site_id = request.args.get("site_id", "site-1")
    row = db.session.get(IntakeSiteOptions, site_id)
    if row is None:
        return jsonify(None)
    return jsonify(row.data)

@app.put("/intake-options/<site_id>")
@require_auth
def update_intake_options(site_id):
    body = request.get_json(silent=True) or {}
    row = db.session.get(IntakeSiteOptions, site_id)
    if row is None:
        row = IntakeSiteOptions(site_id=site_id, data=body, updated_at=now_iso())
        db.session.add(row)
    else:
        row.data = body
        row.updated_at = now_iso()
    db.session.commit()
    return jsonify({"success": True})

# ── Roles ─────────────────────────────────────────────────────────

@app.get("/roles")
@require_auth
def list_roles():
    rows = Role.query.order_by(Role.created_at).all()
    return jsonify([r.to_dict() for r in rows])


@app.post("/roles")
@require_auth
def create_role():
    body = request.get_json(silent=True) or {}
    name = (body.get("name") or "").strip()
    if not name:
        return jsonify({"error": "name is required"}), 400
    if db.session.get(Role, name):
        return jsonify({"error": "Role already exists"}), 409
    row = Role(name=name, kind="custom", created_at=now_iso())
    db.session.add(row)
    db.session.commit()
    return jsonify(row.to_dict()), 201


@app.delete("/roles/<path:role_name>")
@require_auth
def delete_role(role_name):
    row = db.session.get(Role, role_name)
    if row is None:
        return jsonify({"error": "Role not found"}), 404
    if row.kind == "system":
        return jsonify({"error": "System roles cannot be deleted"}), 403
    db.session.delete(row)
    db.session.commit()
    return jsonify({"success": True})


# ── Role permissions ───────────────────────────────────────────────

@app.get("/role-permissions")
@require_auth
def get_all_role_permissions():
    rows = RolePermissions.query.all()
    return jsonify({r.role_name: r.permissions for r in rows})


@app.put("/role-permissions/<path:role_name>")
@require_auth
def set_role_permissions(role_name):
    body = request.get_json(silent=True) or {}
    permissions = body.get("permissions") or body  # accept either {permissions:{}} or flat blob
    now = now_iso()
    row = db.session.get(RolePermissions, role_name)
    if row:
        row.permissions = permissions
        row.updated_at = now
    else:
        row = RolePermissions(role_name=role_name, permissions=permissions, updated_at=now)
        db.session.add(row)
    db.session.commit()
    return jsonify(row.to_dict())


# ── User settings ──────────────────────────────────────────────────

@app.get("/settings")
@require_auth
def get_settings():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"error": "Could not identify user"}), 401
    row = db.session.get(UserSettings, user_id)
    if row is None:
        return jsonify({"userId": user_id, "settings": {"autoSync": True, "aiSuggestions": True}})
    return jsonify(row.to_dict())


@app.put("/settings")
@require_auth
def save_settings():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"error": "Could not identify user"}), 401
    body = request.get_json(silent=True) or {}
    settings = body.get("settings") or body
    now = now_iso()
    row = db.session.get(UserSettings, user_id)
    if row:
        row.settings = settings
        row.updated_at = now
    else:
        row = UserSettings(user_id=user_id, settings=settings, updated_at=now)
        db.session.add(row)
    db.session.commit()
    return jsonify(row.to_dict())


# ── Locations ─────────────────────────────────────────────────────

@app.get("/locations")
@require_auth
def list_locations():
    rows = Location.query.order_by(Location.created_at).all()
    return jsonify([r.to_dict() for r in rows])


@app.post("/locations")
@require_auth
def create_location():
    body = request.get_json(silent=True) or {}
    name = (body.get("name") or "").strip()
    if not name:
        return jsonify({"error": "name is required"}), 400
    loc_id = body.get("id") or f"site-{new_id()}"
    row = Location(id=loc_id, name=name, created_at=now_iso())
    db.session.add(row)
    db.session.commit()
    return jsonify(row.to_dict()), 201


@app.put("/locations/<loc_id>")
@require_auth
def update_location(loc_id):
    row = db.session.get(Location, loc_id)
    if row is None:
        return jsonify({"error": "Location not found"}), 404
    body = request.get_json(silent=True) or {}
    name = (body.get("name") or "").strip()
    if not name:
        return jsonify({"error": "name is required"}), 400
    row.name = name
    db.session.commit()
    return jsonify(row.to_dict())


@app.delete("/locations/<loc_id>")
@require_auth
def delete_location(loc_id):
    row = db.session.get(Location, loc_id)
    if row is None:
        return jsonify({"error": "Location not found"}), 404
    LocationAccess.query.filter_by(location_id=loc_id).delete()
    db.session.delete(row)
    db.session.commit()
    return jsonify({"success": True})


@app.get("/locations/<loc_id>/access")
@require_auth
def get_location_access(loc_id):
    rows = LocationAccess.query.filter_by(location_id=loc_id).all()
    return jsonify({"locationId": loc_id, "userIds": [r.user_id for r in rows]})


@app.put("/locations/<loc_id>/access")
@require_auth
def set_location_access(loc_id):
    body = request.get_json(silent=True) or {}
    user_ids = body.get("userIds") or []
    LocationAccess.query.filter_by(location_id=loc_id).delete()
    for uid in user_ids:
        db.session.add(LocationAccess(
            id=f"lac-{new_id()}",
            location_id=loc_id,
            user_id=uid,
        ))
    db.session.commit()
    return jsonify({"locationId": loc_id, "userIds": user_ids})


# ── Audit ──────────────────────────────────────────────────────────

@app.get("/audit")
@require_auth
def get_audit():
    site_id = request.args.get("site_id")
    query = AuditEntry.query.order_by(AuditEntry.created_at.desc())
    if site_id:
        query = query.filter_by(site_id=site_id)
    rows = query.limit(500).all()
    return jsonify([r.to_dict() for r in rows])

@app.post("/audit")
@require_auth
def create_audit_entry():
    body = request.get_json(silent=True) or {}
    entry = AuditEntry(
        id=body.get("id") or f"AUD-{new_id()}",
        job_id=body.get("jobId", ""),
        action=body.get("action", ""),
        message=body.get("message", ""),
        site_id=body.get("siteId", ""),
        created_at=body.get("createdAt", now_iso()),
        created_by=body.get("createdBy", ""),
        entity_type=body.get("entityType", ""),
    )
    db.session.add(entry)
    db.session.commit()
    return jsonify({"success": True, "entry": entry.to_dict()}), 201

@app.delete("/audit")
@require_auth
def clear_audit_log():
    AuditEntry.query.delete()
    db.session.commit()
    return jsonify({"success": True}), 200

# ── ML model loader (lazy, loaded once per process) ───────────────────────

_ml_models = {}

def _load_ml_models():
    """Load trained LR + RF models from disk. Trains them first if missing."""
    global _ml_models
    if _ml_models:
        return _ml_models
    import sys
    sys.path.insert(0, os.path.dirname(__file__))
    from ml.train import train_and_save, models_exist, get_model_paths
    import joblib

    if not models_exist():
        print("[ML] Models not found — training now (first run only)...")
        train_and_save()

    paths = get_model_paths()
    _ml_models = {k: joblib.load(v) for k, v in paths.items()}
    print("[ML] Models loaded successfully.")
    return _ml_models


def _fetch_ifixit_context(brand: str, device_type: str) -> dict | None:
    """
    Live internet lookup: calls the iFixit public API to retrieve repair guide
    data for the device. Returns repairability context to enrich the assessment.
    No API key required — iFixit provides a free public REST API.
    """
    import urllib.request as _req
    import urllib.parse as _parse
    import json as _json

    query = f"{brand} {device_type}".strip()
    if not query or query == "Unknown Device":
        return None

    try:
        encoded = _parse.quote(query)
        url = f"https://www.ifixit.com/api/2.0/search/{encoded}?doctypes=guide&limit=5"
        req = _req.Request(url, headers={"User-Agent": "ModuServ/1.0 (repair management system)"})
        with _req.urlopen(req, timeout=4) as resp:
            data = _json.loads(resp.read().decode("utf-8"))

        results = data.get("results", [])
        if not results:
            return {"guideCount": 0, "repairability": "No public guides found", "source": "iFixit"}

        difficulties = [r.get("difficulty") for r in results if r.get("difficulty")]
        top_guide    = results[0].get("title", "")

        if difficulties:
            difficulty_map = {"Very Easy": 1, "Easy": 2, "Moderate": 3, "Difficult": 4, "Very Difficult": 5}
            avg = sum(difficulty_map.get(d, 3) for d in difficulties) / len(difficulties)
            repairability = (
                "Easy to repair (community-supported)"       if avg <= 2 else
                "Moderate repair difficulty"                 if avg <= 3 else
                "Difficult repair — specialist recommended"
            )
        else:
            repairability = "Repair guides available" if results else "Limited repair data"

        return {
            "guideCount":    len(results),
            "topGuide":      top_guide,
            "repairability": repairability,
            "source":        "iFixit"
        }
    except Exception:
        return None  # Non-fatal — assessment proceeds without live context


def _urgency_from_priority(priority: str) -> str:
    return {"High": "High", "Medium": "Medium", "Low": "Low"}.get(priority, "Medium")


def _risk_from_priority(priority: str, water: bool) -> str:
    if water or priority == "High":
        return "High"
    if priority == "Medium":
        return "Medium"
    return "Low"


# ── AI Assessment (ML Engine — LR + Random Forest ensemble) ──────────────────

@app.post("/ai/assess")
@require_auth
def ai_assess():
    import numpy as np

    body         = request.get_json(silent=True) or {}
    check_in     = (body.get("checkInCondition") or "").strip()
    water_damage = (body.get("waterDamage") or "No") == "Yes"
    ber          = bool(body.get("ber"))
    brand        = (body.get("brand") or "Unknown").strip()
    device_type  = (body.get("deviceType") or "Device").strip()

    if not check_in:
        return jsonify({"error": "checkInCondition is required"}), 400

    # Build the text feature: condition + device context
    feature_text = f"{check_in} {brand} {device_type}".lower()
    if water_damage:
        feature_text += " water damage"
    if ber:
        feature_text += " beyond economic repair"

    try:
        m = _load_ml_models()

        # ── Priority: LR + RF ensemble (averaged probabilities) ──────────
        p_vec  = m["priority_vec"]
        p_X    = p_vec.transform([feature_text])
        p_classes = m["priority_lr"].classes_

        lr_p_proba = m["priority_lr"].predict_proba(p_X)[0]
        rf_p_proba = m["priority_rf"].predict_proba(p_X)[0]

        # Align RF class order to LR class order
        rf_p_classes = m["priority_rf"].classes_
        rf_p_aligned = np.array([
            rf_p_proba[list(rf_p_classes).index(c)] if c in rf_p_classes else 0.0
            for c in p_classes
        ])

        ensemble_p  = (lr_p_proba + rf_p_aligned) / 2.0
        priority    = p_classes[int(np.argmax(ensemble_p))]
        p_confidence = float(np.max(ensemble_p))

        lr_priority = p_classes[int(np.argmax(lr_p_proba))]
        rf_priority = p_classes[int(np.argmax(rf_p_aligned))]

        # ── Category: LR + RF ensemble ────────────────────────────────────
        c_vec     = m["category_vec"]
        c_X       = c_vec.transform([feature_text])
        c_classes = m["category_lr"].classes_

        lr_c_proba = m["category_lr"].predict_proba(c_X)[0]
        rf_c_proba = m["category_rf"].predict_proba(c_X)[0]

        rf_c_classes = m["category_rf"].classes_
        rf_c_aligned = np.array([
            rf_c_proba[list(rf_c_classes).index(c)] if c in rf_c_classes else 0.0
            for c in c_classes
        ])

        ensemble_c   = (lr_c_proba + rf_c_aligned) / 2.0
        category     = c_classes[int(np.argmax(ensemble_c))]
        c_confidence = float(np.max(ensemble_c))

        # Top-2 categories for suggestedCategories
        top2_idx    = np.argsort(ensemble_c)[::-1][:2]
        categories  = [c_classes[i] for i in top2_idx if ensemble_c[i] > 0.1]

        overall_confidence = round((p_confidence + c_confidence) / 2.0, 2)

    except Exception as exc:
        return jsonify({"error": f"Model error: {exc}", "code": "model_error"}), 500

    # ── Live internet context (iFixit) ────────────────────────────────────
    ifixit = _fetch_ifixit_context(brand, device_type)

    # ── Build assessment response ─────────────────────────────────────────
    urgency = _urgency_from_priority(priority)
    if water_damage and urgency == "High":
        urgency = "Critical"

    risk = _risk_from_priority(priority, water_damage)

    complexity = (
        "Complex"  if water_damage and priority == "High" else
        "Multiple" if len(categories) > 1 else
        "Single"
    )

    flags = []
    if water_damage:
        flags.append("Water damage detected — elevated risk to internal components")
    if ber:
        flags.append("Device marked as Beyond Economic Repair")
    if priority == "High" and not water_damage:
        flags.append("High priority — book in for immediate diagnosis")
    if ifixit and ifixit.get("guideCount", 0) == 0:
        flags.append("No public repair guides found — may require specialist assessment")

    explanation_parts = [
        f"ML ensemble (Logistic Regression + Random Forest) assessed this as {priority} priority, "
        f"category: {category} (confidence {overall_confidence:.0%}).",
        f"LR predicted {lr_priority} priority; RF predicted {rf_priority} priority — ensemble: {priority}.",
    ]
    if ifixit:
        explanation_parts.append(
            f"Live iFixit lookup found {ifixit['guideCount']} repair guide(s) for {brand} {device_type}: "
            f"{ifixit['repairability']}."
        )
    if water_damage:
        explanation_parts.append("Water damage significantly escalates repair risk and urgency.")

    assessment = {
        "suggestedPriority":     priority,
        "suggestedUrgency":      urgency,
        "suggestedCategory":     category,
        "suggestedCategories":   categories if categories else [category],
        "suggestedRisk":         risk,
        "repairComplexity":      complexity,
        "recommendedNextStatus": "In Diagnosis",
        "flags":                 flags,
        "confidenceScore":       overall_confidence,
        "explanation":           " ".join(explanation_parts),
        "detectedIssues":        [{"issueId": category.lower(), "label": category, "category": category, "urgencyContribution": urgency}],
        "liveContext":           ifixit,
        "modelDetails": {
            "lr_priority":       lr_priority,
            "rf_priority":       rf_priority,
            "ensemble_priority": priority,
            "lr_category":       m["category_lr"].classes_[int(np.argmax(lr_c_proba))],
            "rf_category":       m["category_rf"].classes_[int(np.argmax(rf_c_aligned))],
            "ensemble_category": category,
        },
    }

    return jsonify({"success": True, "assessment": assessment, "source": "ml"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=False)
