"""
ModuServ — Realistic Appointment Seed Script
Inserts 100 realistic repair appointment records spread across all 4 sites.
Run from server-api/: python seed_appointments.py
"""

import os
import sys
import random
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///instance/moduserv_server.db")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
session = Session()

# ── Fetch real site IDs from DB ───────────────────────────────────────────────

def get_site_ids():
    rows = session.execute(text("SELECT id FROM location ORDER BY created_at")).fetchall()
    return [r[0] for r in rows] if rows else ["site-1", "site-2", "site-3"]

# ── Reference data ────────────────────────────────────────────────────────────

FIRST_NAMES = [
    "James", "Sarah", "Michael", "Emma", "Daniel", "Olivia", "Ryan", "Sophie",
    "Thomas", "Charlotte", "Aaron", "Megan", "Luke", "Hannah", "Adam", "Laura",
    "Nathan", "Amy", "Connor", "Rachel", "Jack", "Natalie", "David", "Rebecca",
    "Paul", "Jessica", "Sean", "Claire", "Kevin", "Fiona",
]

LAST_NAMES = [
    "Murphy", "Kelly", "O'Brien", "Walsh", "Smith", "O'Sullivan", "Connor",
    "McCarthy", "Ryan", "Byrne", "O'Neill", "Doyle", "Fitzgerald", "Quinn",
    "Hughes", "Moore", "Burke", "Collins", "Reilly", "Clarke", "Johnson",
    "Williams", "Brown", "Taylor", "Wilson", "Anderson", "Thompson", "White",
    "Harris", "Martin",
]

COUNTIES = [
    "Dublin", "Cork", "Galway", "Limerick", "Waterford",
    "Kilkenny", "Wexford", "Tipperary", "Kerry", "Wicklow",
]

STREETS = [
    "Main Street", "High Street", "Church Road", "Station Road", "Park Avenue",
    "Oak Drive", "Maple Close", "Elm Court", "Castle Street", "Bridge Road",
]

BRANDS = ["Apple", "Samsung", "Google", "OnePlus", "Huawei", "Sony", "Motorola", "Nokia"]

DEVICE_MODELS = {
    "Apple":    ["iPhone 15 Pro", "iPhone 14", "iPhone 13 Mini", "iPhone 12", "iPhone SE (2022)", "iPad Pro 11"],
    "Samsung":  ["Galaxy S24 Ultra", "Galaxy S23", "Galaxy A54", "Galaxy Z Fold 5", "Galaxy A14", "Galaxy Tab S9"],
    "Google":   ["Pixel 8 Pro", "Pixel 7a", "Pixel 6"],
    "OnePlus":  ["OnePlus 12", "OnePlus Nord CE 3", "OnePlus 10T"],
    "Huawei":   ["P60 Pro", "Mate 50", "Nova 11"],
    "Sony":     ["Xperia 1 V", "Xperia 5 IV", "Xperia 10 V"],
    "Motorola": ["Edge 40 Pro", "Moto G84", "Razr 40 Ultra"],
    "Nokia":    ["Nokia G42", "Nokia X30", "Nokia C32"],
}

DEVICE_TYPES = {
    "Apple":    "iPhone",
    "Samsung":  "Android Phone",
    "Google":   "Android Phone",
    "OnePlus":  "Android Phone",
    "Huawei":   "Android Phone",
    "Sony":     "Android Phone",
    "Motorola": "Android Phone",
    "Nokia":    "Android Phone",
}

COLOURS = ["Black", "White", "Silver", "Gold", "Blue", "Green", "Purple", "Red", "Pink", "Graphite"]

PAYMENT_TYPES   = ["Cash", "Card", "Bank Transfer"]
PAYMENT_STATUSES = ["Paid", "Pending", "Partial", "Unpaid"]

SCENARIOS = [
    ("Screen completely shattered, touch unresponsive in bottom half, crack running corner to corner.",
     "High", "In Progress", (80, 220), "Screen Replacement"),

    ("Phone won't turn on at all. Completely dead, no response to charging or hard reset.",
     "High", "Awaiting Diagnosis", (60, 150), "General Repair"),

    ("Battery draining extremely fast, loses 50% in under two hours with minimal use.",
     "Medium", "Awaiting Repair", (40, 90), "Battery Replacement"),

    ("Charging port damaged, charger only connects at a specific angle and cuts out frequently.",
     "Medium", "Awaiting Parts", (35, 75), "Charging Port Repair"),

    ("Device dropped in toilet, retrieved immediately. Powers on intermittently.",
     "High", "Awaiting Diagnosis", (100, 300), "Water Damage Repair"),

    ("LCD screen showing vertical lines across the display, colours distorted.",
     "Medium", "Awaiting Repair", (70, 180), "Screen Replacement"),

    ("Back glass cracked from corner drop, no functional damage, fully operational.",
     "Low", "Ready For Collection", (20, 60), "Cosmetic Repair"),

    ("Battery swollen pushing back glass off. Device still powers on but dangerous.",
     "High", "In Progress", (50, 120), "Battery Replacement"),

    ("Touchscreen not registering input in the top third of the screen.",
     "Medium", "Post Repair Check", (60, 160), "Screen Replacement"),

    ("Charging port completely non-functional, device only charges with wireless pad.",
     "Medium", "Ready For Collection", (40, 80), "Charging Port Repair"),

    ("Device overheating significantly during normal use, gets very hot within minutes.",
     "High", "Awaiting Diagnosis", (80, 200), "General Repair"),

    ("Speaker producing crackling distorted sound at all volume levels.",
     "Medium", "Awaiting Repair", (30, 70), "General Repair"),

    ("Phone fell off table, small crack on back glass, cosmetic damage only.",
     "Low", "Completed", (15, 45), "Cosmetic Repair"),

    ("Won't charge via cable at all. Wireless charging works fine.",
     "Medium", "Awaiting Parts", (40, 85), "Charging Port Repair"),

    ("Boot loop — device restarts continuously and cannot complete startup.",
     "High", "Awaiting Diagnosis", (70, 180), "General Repair"),

    ("Screen has a single dead pixel cluster in centre, rest of display fine.",
     "Low", "Awaiting Customer Reply", (50, 120), "Screen Replacement"),

    ("Battery replaced 6 months ago but draining fast again. Second battery issue.",
     "Medium", "Awaiting Diagnosis", (40, 90), "Battery Replacement"),

    ("Front camera completely black, rear camera working perfectly.",
     "Medium", "Awaiting Repair", (35, 80), "General Repair"),

    ("USB-C port pins bent, charger cannot make contact.",
     "Medium", "In Progress", (40, 90), "Charging Port Repair"),

    ("Device submerged in pool for approximately 30 seconds. Stopped working after.",
     "High", "Awaiting Diagnosis", (120, 350), "Water Damage Repair"),

    ("OLED screen has burn-in from navigation bar, visible as ghost image.",
     "Medium", "Awaiting Customer Reply", (80, 200), "Screen Replacement"),

    ("Home button / power button completely unresponsive to press.",
     "Medium", "Awaiting Repair", (30, 70), "General Repair"),

    ("Cosmetic scratches across screen from keys in pocket. Device fully functional.",
     "Low", "Ready For Collection", (10, 30), "Cosmetic Repair"),

    ("Phone powers off randomly at 30-40% battery, even on full charge.",
     "Medium", "Post Repair Check", (40, 90), "Battery Replacement"),

    ("Rear camera lens cracked from drop, photos blurry due to glass damage.",
     "Medium", "In Progress", (30, 80), "General Repair"),
]

STATUSES = [
    "Awaiting Diagnosis", "Awaiting Repair", "In Progress",
    "Post Repair Check", "Ready For Collection",
    "Awaiting Parts", "Awaiting Customer Reply", "Completed",
]

TECHNICIANS = ["technician", "admin"]

# ── Helpers ───────────────────────────────────────────────────────────────────

def rand_date_iso(days_back=120):
    dt = datetime.utcnow() - timedelta(days=random.randint(1, days_back))
    return dt.strftime("%Y-%m-%dT%H:%M:%S.000Z")

def rand_date_str(days_back=120):
    dt = datetime.utcnow() - timedelta(days=random.randint(1, days_back))
    return dt.strftime("%Y-%m-%d")

def rand_time_str():
    h = random.randint(9, 17)
    m = random.choice([0, 15, 30, 45])
    return f"{h:02d}:{m:02d}"

def rand_phone():
    return f"08{random.randint(1,9)}{random.randint(1000000,9999999)}"

def rand_postcode():
    return f"D{random.randint(1,24):02d}"

def rand_payment(lo, hi):
    return str(round(random.uniform(lo, hi) / 5) * 5)

def rand_imei():
    return "".join([str(random.randint(0, 9)) for _ in range(15)])

# ── Generate records ──────────────────────────────────────────────────────────

def generate_appointments(n, site_ids):
    records = []
    for i in range(1, n + 1):
        apt_id      = f"APT-{i:03d}"
        site_id     = site_ids[i % len(site_ids)]
        first       = random.choice(FIRST_NAMES)
        last        = random.choice(LAST_NAMES)
        brand       = random.choice(BRANDS)
        model       = random.choice(DEVICE_MODELS[brand])
        dtype       = DEVICE_TYPES[brand]
        colour      = random.choice(COLOURS)
        county      = random.choice(COUNTIES)
        street      = random.choice(STREETS)
        address     = f"{random.randint(1,120)} {street}"
        email       = f"{first.lower()}.{last.lower()}@example.com"
        phone       = rand_phone()
        postcode    = rand_postcode()
        imei        = rand_imei()
        serial      = f"SN{random.randint(100000,999999)}"
        technician  = random.choice(TECHNICIANS)
        created_at  = rand_date_iso(120)

        scenario    = SCENARIOS[(i - 1) % len(SCENARIOS)]
        condition, priority, base_status, pay_range, repair_type = scenario

        if random.random() < 0.12:
            base_status = random.choice(STATUSES)

        payment     = rand_payment(*pay_range)
        ptype       = random.choice(PAYMENT_TYPES)
        pstatus     = "Paid" if base_status in ("Completed", "Ready For Collection") else random.choice(PAYMENT_STATUSES)

        additional = " | ".join(filter(bool, [
            f"Email: {email}",
            f"Phone: {phone}",
            f"Address 1: {address}",
            f"County: {county}",
            f"Postcode: {postcode}",
            f"Colour: {colour}",
            f"IMEI: {imei}",
            f"Serial Number: {serial}",
            f"Payment Amount: {payment}",
            f"Payment Type: {ptype}",
            f"Payment Status: {pstatus}",
        ]))

        activity_log = [
            {
                "type": "SYSTEM",
                "message": f"Appointment created for {first} {last}.",
                "user": "admin",
                "role": "Admin",
                "timestamp": created_at,
            }
        ]

        if base_status not in ("Awaiting Diagnosis",):
            activity_log.append({
                "type": "STATUS",
                "message": f"Status updated to {base_status}.",
                "user": technician,
                "role": "Technician",
                "timestamp": rand_date_iso(60),
            })

        record = {
            "id":                   apt_id,
            "siteId":               site_id,
            "customer":             f"{first} {last}",
            "brand":                brand,
            "deviceType":           dtype,
            "deviceModel":          model,
            "device":               f"{brand} {model}",
            "repairType":           repair_type,
            "date":                 rand_date_str(90),
            "time":                 rand_time_str(),
            "status":               base_status,
            "checkInCondition":     condition,
            "additionalInformation": additional,
            "waterDamage":          "Yes" if "water" in condition.lower() or "pool" in condition.lower() or "toilet" in condition.lower() else "No",
            "backGlassCracked":     "Yes" if "back glass" in condition.lower() else "No",
            "isLocked":             False,
            "lockedAt":             None,
            "lockedBy":             None,
            "lockReason":           None,
            "technician":           technician,
            "technicianNotes":      "",
            "postRepairCheckNotes": "",
            "draftEmail":           "",
            "selectedTemplate":     "",
            "selectedSmsTemplate":  "",
            "draftSms":             "",
            "callAttempts":         [],
            "archived":             False,
            "activityLog":          activity_log,
            "createdAt":            created_at,
            "updatedAt":            created_at,
            "customerInfo": {
                "firstName":    first,
                "lastName":     last,
                "email":        email,
                "phoneNumber":  phone,
                "addressLine1": address,
                "addressLine2": "",
                "county":       county,
                "postcode":     postcode,
            },
            "deviceInfo": {
                "brand":            brand,
                "deviceType":       dtype,
                "deviceModel":      model,
                "colour":           colour,
                "imei":             imei,
                "serialNumber":     serial,
                "checkInCondition": condition,
                "waterDamage":      "Yes" if "water" in condition.lower() or "pool" in condition.lower() or "toilet" in condition.lower() else "No",
                "backGlassCracked": "Yes" if "back glass" in condition.lower() else "No",
            },
            "paymentInfo": {
                "amount":        payment,
                "paymentType":   ptype,
                "paymentStatus": pstatus,
            },
        }

        records.append({
            "id":             apt_id,
            "site_id":        site_id,
            "status":         base_status,
            "customer_name":  f"{first} {last}",
            "scheduled_date": record["date"],
            "is_deleted":     False,
            "created_at":     created_at,
            "updated_at":     created_at,
            "record":         record,
        })

    return records


def insert_appointments(records):
    inserted = 0
    skipped  = 0
    for r in records:
        exists = session.execute(
            text("SELECT 1 FROM appointment WHERE id = :id"),
            {"id": r["id"]}
        ).fetchone()

        if exists:
            skipped += 1
            continue

        session.execute(text("""
            INSERT INTO appointment (id, site_id, status, customer_name, scheduled_date, is_deleted, created_at, updated_at, record)
            VALUES (:id, :site_id, :status, :customer_name, :scheduled_date, :is_deleted, :created_at, :updated_at, :record)
        """), {**r, "record": json.dumps(r["record"])})
        inserted += 1

    session.commit()
    return inserted, skipped


if __name__ == "__main__":
    print("[Seed] Connecting to database...")
    try:
        session.execute(text("SELECT 1"))
        print("[Seed] Connected.")
    except Exception as e:
        print(f"[Seed] Connection failed: {e}")
        sys.exit(1)

    site_ids = get_site_ids()
    print(f"[Seed] Found {len(site_ids)} sites: {', '.join(site_ids)}")

    print("[Seed] Generating 100 realistic appointment records...")
    records = generate_appointments(100, site_ids)

    site_counts = {}
    for r in records:
        site_counts[r["site_id"]] = site_counts.get(r["site_id"], 0) + 1
    for s, c in sorted(site_counts.items()):
        print(f"  {s}: {c} appointments")

    print("[Seed] Inserting into database...")
    inserted, skipped = insert_appointments(records)
    print(f"[Seed] Done. {inserted} inserted, {skipped} skipped (already exist).")
