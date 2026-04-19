"""
ModuServ — Realistic Job Seed Script
Inserts 100 realistic repair job records spread across all 3 sites.
Run from server-api/: python seed_jobs.py
"""

import os
import sys
import random
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///instance/moduserv_server.db")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
session = Session()

# ── Reference data ────────────────────────────────────────────────────────────

SITES = ["site-1", "site-2", "site-3"]

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

TECHNICIANS = ["technician", "admin"]

# ── Repair scenarios ──────────────────────────────────────────────────────────

SCENARIOS = [
    # (check_in_condition, category, priority, status, payment_range, part_required)
    ("Screen completely shattered, touch unresponsive in bottom half, crack running corner to corner.",
     "Display", "High", "In Progress", (80, 220), "Yes"),

    ("Phone won't turn on at all. Completely dead, no response to charging or hard reset.",
     "Power", "High", "In Diagnosis", (60, 150), "No"),

    ("Battery draining extremely fast, loses 50% in under two hours with minimal use.",
     "Battery", "Medium", "Awaiting Repair", (40, 90), "Yes"),

    ("Charging port damaged, charger only connects at a specific angle and cuts out frequently.",
     "Charging", "Medium", "Awaiting Parts", (35, 75), "Yes"),

    ("Device dropped in toilet, retrieved immediately. Powers on intermittently.",
     "Power", "High", "In Diagnosis", (100, 300), "No"),

    ("LCD screen showing vertical lines across the display, colours distorted.",
     "Display", "Medium", "Awaiting Repair", (70, 180), "Yes"),

    ("Back glass cracked from corner drop, no functional damage, fully operational.",
     "General", "Low", "Ready For Collection", (20, 60), "Yes"),

    ("Battery swollen pushing back glass off. Device still powers on but dangerous.",
     "Battery", "High", "In Progress", (50, 120), "Yes"),

    ("Touchscreen not registering input in the top third of the screen.",
     "Display", "Medium", "Post Repair Check", (60, 160), "Yes"),

    ("Charging port completely non-functional, device only charges with wireless pad.",
     "Charging", "Medium", "Ready For Collection", (40, 80), "Yes"),

    ("Device overheating significantly during normal use, gets very hot within minutes.",
     "Power", "High", "In Diagnosis", (80, 200), "No"),

    ("Speaker producing crackling distorted sound at all volume levels.",
     "General", "Medium", "Awaiting Repair", (30, 70), "No"),

    ("Phone fell off table, small crack on back glass, cosmetic damage only.",
     "General", "Low", "Completed", (15, 45), "Yes"),

    ("Won't charge via cable at all. Wireless charging works fine.",
     "Charging", "Medium", "Awaiting Parts", (40, 85), "Yes"),

    ("Boot loop — device restarts continuously and cannot complete startup.",
     "Power", "High", "In Diagnosis", (70, 180), "No"),

    ("Screen has a single dead pixel cluster in centre, rest of display fine.",
     "Display", "Low", "Awaiting Customer Reply", (50, 120), "No"),

    ("Battery replaced 6 months ago but draining fast again. Second battery issue.",
     "Battery", "Medium", "In Diagnosis", (40, 90), "Yes"),

    ("Front camera completely black, rear camera working perfectly.",
     "General", "Medium", "Awaiting Repair", (35, 80), "No"),

    ("USB-C port pins bent, charger cannot make contact.",
     "Charging", "Medium", "In Progress", (40, 90), "Yes"),

    ("Device submerged in pool for approximately 30 seconds. Stopped working after.",
     "Power", "High", "In Diagnosis", (120, 350), "No"),

    ("OLED screen has burn-in from navigation bar, visible as ghost image.",
     "Display", "Medium", "Awaiting Customer Reply", (80, 200), "Yes"),

    ("Home button / power button completely unresponsive to press.",
     "General", "Medium", "Awaiting Repair", (30, 70), "No"),

    ("Cosmetic scratches across screen from keys in pocket. Device fully functional.",
     "General", "Low", "Ready For Collection", (10, 30), "No"),

    ("Phone powers off randomly at 30-40% battery, even on full charge.",
     "Battery", "Medium", "Post Repair Check", (40, 90), "Yes"),

    ("Rear camera lens cracked from drop, photos blurry due to glass damage.",
     "General", "Medium", "In Progress", (30, 80), "Yes"),
]

STATUSES = [
    "New", "In Diagnosis", "Awaiting Repair", "In Progress",
    "Post Repair Device Check", "Ready For Collection",
    "Awaiting Parts", "Awaiting Customer Reply", "Completed",
]

# ── Helpers ───────────────────────────────────────────────────────────────────

def rand_date(days_back=120):
    return (datetime.utcnow() - timedelta(days=random.randint(0, days_back))).isoformat() + "Z"

def rand_imei():
    return "".join([str(random.randint(0, 9)) for _ in range(15)])

def rand_phone():
    return f"08{random.randint(1,9)}{random.randint(1000000,9999999)}"

def rand_postcode():
    letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    return f"D{random.randint(1,24):02d}"

def rand_payment(lo, hi):
    return round(random.uniform(lo, hi) / 5) * 5  # nearest €5

# ── Generate and insert ───────────────────────────────────────────────────────

def generate_jobs(n=100):
    jobs = []
    for i in range(1, n + 1):
        first   = random.choice(FIRST_NAMES)
        last    = random.choice(LAST_NAMES)
        brand   = random.choice(BRANDS)
        model   = random.choice(DEVICE_MODELS[brand])
        dtype   = DEVICE_TYPES[brand]
        colour  = random.choice(COLOURS)
        county  = random.choice(COUNTIES)
        street  = random.choice(STREETS)
        site    = SITES[i % len(SITES)]  # evenly distribute across sites

        scenario = SCENARIOS[(i - 1) % len(SCENARIOS)]
        condition, category, priority, base_status, pay_range, part_req = scenario

        # Vary status slightly so not all jobs are at the same stage
        if random.random() < 0.15:
            base_status = random.choice(STATUSES)

        payment = rand_payment(*pay_range)
        ptype   = random.choice(PAYMENT_TYPES)
        pstatus = "Paid" if base_status in ("Completed", "Ready For Collection") else random.choice(PAYMENT_STATUSES)

        repair_start = None
        repair_end   = None
        duration     = None
        if base_status in ("In Progress", "Post Repair Device Check", "Ready For Collection", "Completed"):
            repair_start = rand_date(30)
            if base_status in ("Post Repair Device Check", "Ready For Collection", "Completed"):
                start_dt = datetime.fromisoformat(repair_start.replace("Z", ""))
                end_dt   = start_dt + timedelta(minutes=random.randint(20, 180))
                repair_end = end_dt.isoformat() + "Z"
                duration   = int((end_dt - start_dt).total_seconds() / 60)

        part_name     = ""
        part_supplier = ""
        part_status   = ""
        if part_req == "Yes":
            if category == "Display":
                part_name = f"{brand} {model} Screen Assembly"
            elif category == "Battery":
                part_name = f"{brand} {model} Battery"
            elif category == "Charging":
                part_name = f"{brand} {model} Charging Port"
            else:
                part_name = f"{brand} {model} Replacement Part"
            part_supplier = random.choice(["iFixit", "Mobile Sentrix", "MobileDefence", "GS Mobile Parts"])
            part_status   = random.choice(["Ordered", "In Stock", "Dispatched", "Delivered"])

        jobs.append({
            "id":                    f"job-{i:03d}",
            "site_id":               site,
            "customer_first_name":   first,
            "customer_last_name":    last,
            "customer_email":        f"{first.lower()}.{last.lower()}@example.com",
            "customer_phone":        rand_phone(),
            "address_line_1":        f"{random.randint(1,120)} {street}",
            "address_line_2":        "",
            "county":                county,
            "postcode":              rand_postcode(),
            "brand":                 brand,
            "device_type":           dtype,
            "device_model":          model,
            "colour":                colour,
            "imei":                  rand_imei(),
            "serial_number":         f"SN{random.randint(100000,999999)}",
            "check_in_condition":    condition,
            "part_required":         part_req,
            "part_allocated":        "Yes" if part_req == "Yes" and part_status in ("In Stock","Delivered") else "No",
            "part_name":             part_name,
            "part_type":             category,
            "part_supplier":         part_supplier,
            "part_status":           part_status,
            "payment_amount":        payment,
            "payment_type":          ptype,
            "payment_status":        pstatus,
            "qc_status":             "Pass" if base_status in ("Ready For Collection","Completed") else "",
            "backglass":             "Damaged" if "back glass" in condition.lower() else "Intact",
            "status":                base_status,
            "priority":              priority,
            "suggested_priority":    priority,
            "category":              category,
            "priority_was_overridden": False,
            "ber":                   False,
            "repair_start_time":     repair_start,
            "repair_end_time":       repair_end,
            "repair_duration_minutes": duration,
            "is_deleted":            False,
            "deleted_at":            None,
            "deleted_by":            None,
            "restored_at":           None,
            "restored_by":           None,
        })

    return jobs


def insert_jobs(jobs):
    inserted = 0
    skipped  = 0
    for job in jobs:
        exists = session.execute(
            text("SELECT 1 FROM job WHERE id = :id"),
            {"id": job["id"]}
        ).fetchone()

        if exists:
            skipped += 1
            continue

        session.execute(text("""
            INSERT INTO job (
                id, site_id,
                customer_first_name, customer_last_name, customer_email, customer_phone,
                address_line_1, address_line_2, county, postcode,
                brand, device_type, device_model, colour, imei, serial_number,
                check_in_condition,
                part_required, part_allocated, part_name, part_type, part_supplier, part_status,
                payment_amount, payment_type, payment_status,
                qc_status, backglass, status, priority, suggested_priority,
                category, priority_was_overridden, ber,
                repair_start_time, repair_end_time, repair_duration_minutes,
                is_deleted, deleted_at, deleted_by, restored_at, restored_by
            ) VALUES (
                :id, :site_id,
                :customer_first_name, :customer_last_name, :customer_email, :customer_phone,
                :address_line_1, :address_line_2, :county, :postcode,
                :brand, :device_type, :device_model, :colour, :imei, :serial_number,
                :check_in_condition,
                :part_required, :part_allocated, :part_name, :part_type, :part_supplier, :part_status,
                :payment_amount, :payment_type, :payment_status,
                :qc_status, :backglass, :status, :priority, :suggested_priority,
                :category, :priority_was_overridden, :ber,
                :repair_start_time, :repair_end_time, :repair_duration_minutes,
                :is_deleted, :deleted_at, :deleted_by, :restored_at, :restored_by
            )
        """), job)
        inserted += 1

    session.commit()
    return inserted, skipped


if __name__ == "__main__":
    print(f"[Seed] Connecting to database...")
    try:
        session.execute(text("SELECT 1"))
        print("[Seed] Connected.")
    except Exception as e:
        print(f"[Seed] Connection failed: {e}")
        sys.exit(1)

    print("[Seed] Generating 100 realistic job records...")
    jobs = generate_jobs(100)

    site_counts = {}
    for j in jobs:
        site_counts[j["site_id"]] = site_counts.get(j["site_id"], 0) + 1
    for s, c in sorted(site_counts.items()):
        print(f"  {s}: {c} jobs")

    print("[Seed] Inserting into database...")
    inserted, skipped = insert_jobs(jobs)
    print(f"[Seed] Done. {inserted} inserted, {skipped} skipped (already exist).")
