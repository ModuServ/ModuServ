"""
ModuServ ML Training Script
Trains two models for repair assessment:
  1. Logistic Regression  — fast, interpretable, strong text baseline
  2. Random Forest        — ensemble tree method, handles non-linear feature interactions

Both models are trained on TF-IDF vectorized repair descriptions.
Priority and Category are predicted separately, then ensemble-averaged at inference time.
"""

import os
import joblib
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score

# ── Training data ────────────────────────────────────────────────────────────

PRIORITY_DATA = [
    # ── High ───────────────────────────────────────────────────────────────
    ("device completely dead won't turn on no power at all", "High"),
    ("phone not powering on completely dead black screen", "High"),
    ("won't turn on at all dead device no response", "High"),
    ("not turning on black screen completely unresponsive", "High"),
    ("boot loop stuck on logo won't complete boot", "High"),
    ("keeps restarting boot loop cannot get past logo", "High"),
    ("water damage dropped in toilet fell in pool", "High"),
    ("water damaged device stopped working immediately", "High"),
    ("dropped in water not turning on water ingress", "High"),
    ("fell in bath water damage not responding", "High"),
    ("phone got wet stopped working immediately water", "High"),
    ("got wet in rain water damage stopped working", "High"),
    ("swollen battery bulging pushing screen out", "High"),
    ("battery swollen phone bending bloated battery", "High"),
    ("bloated battery expanding dangerous swollen", "High"),
    ("overheating very hot burning smell from device", "High"),
    ("burning smell smoke coming from phone heat event", "High"),
    ("very hot to touch overheating smoke visible", "High"),
    ("device extremely hot thermal event burning", "High"),
    ("beyond economic repair ber total loss", "High"),
    ("completely smashed multiple critical issues dead", "High"),
    ("motherboard damage water ingress dead device", "High"),
    ("device in rice water damage still not working", "High"),
    ("charging and turning on intermittently after water", "High"),
    ("device keeps crashing rebooting boot loop power fault", "High"),
    ("phone dead after drop no power whatsoever", "High"),
    ("water got into charging port device dead", "High"),
    ("battery rupture swollen chemical hazard", "High"),
    ("device spontaneously turned off won't come back on", "High"),
    ("screen completely shattered device won't power on", "High"),

    # ── Medium ─────────────────────────────────────────────────────────────
    ("battery drains very fast poor battery life", "Medium"),
    ("battery doesn't last more than an hour drains fast", "Medium"),
    ("battery draining quickly needs replacement", "Medium"),
    ("poor battery life draining overnight", "Medium"),
    ("phone shuts off at thirty percent battery issue", "Medium"),
    ("battery health very low degraded replacement needed", "Medium"),
    ("battery not holding charge dies quickly", "Medium"),
    ("cracked screen still works but damaged", "Medium"),
    ("broken screen display cracked from corner", "Medium"),
    ("screen cracked from corner to corner", "Medium"),
    ("smashed screen cracked display still functional", "Medium"),
    ("screen cracked touchscreen partially unresponsive", "Medium"),
    ("charging slowly takes many hours to charge", "Medium"),
    ("not charging properly intermittent charging issue", "Medium"),
    ("charging port loose connection intermittent", "Medium"),
    ("won't charge properly slow charging usb c", "Medium"),
    ("lightning port not working intermittent charging", "Medium"),
    ("display issue horizontal lines on screen", "Medium"),
    ("screen flickering lines across display", "Medium"),
    ("touchscreen not responding properly dead spots", "Medium"),
    ("oled display damaged black spots on screen", "Medium"),
    ("lcd broken lines across screen digitizer", "Medium"),
    ("dead pixels on screen display damage", "Medium"),
    ("front camera not working broken lens", "Medium"),
    ("back camera blurry not focusing camera fault", "Medium"),
    ("speaker not working no audio output", "Medium"),
    ("microphone issue cannot be heard on calls", "Medium"),
    ("usb c port damaged bent charging intermittent", "Medium"),
    ("digitizer not working touch issues screen", "Medium"),
    ("screen pressure damage internal display broken", "Medium"),

    # ── Low ────────────────────────────────────────────────────────────────
    ("small scratch on back cosmetic damage only", "Low"),
    ("minor cosmetic damage scuff on corner", "Low"),
    ("back glass cracked still works completely fine", "Low"),
    ("small crack on back glass cosmetic", "Low"),
    ("housing damage dent on frame cosmetic", "Low"),
    ("scratched screen protector cosmetic damage", "Low"),
    ("scuff marks on body cosmetic wear", "Low"),
    ("frame slightly bent cosmetic issue", "Low"),
    ("back glass scratched worn cosmetic", "Low"),
    ("paint worn off cosmetic damage only", "Low"),
    ("small chip on corner cosmetic", "Low"),
    ("general wear and tear cosmetic", "Low"),
    ("minor scuffs scratches on body cosmetic", "Low"),
    ("cosmetic damage does not affect function", "Low"),
    ("back cover scratched cosmetic no functional issue", "Low"),
    ("screen protector cracked cosmetic", "Low"),
    ("minor dent on side frame cosmetic", "Low"),
    ("worn finish cosmetic no functional fault", "Low"),
    ("small crack on back housing cosmetic", "Low"),
    ("aesthetic damage only device fully functional", "Low"),
]

CATEGORY_DATA = [
    # ── Power ──────────────────────────────────────────────────────────────
    ("device won't turn on no power completely dead", "Power"),
    ("phone not powering on dead device no response", "Power"),
    ("won't boot stuck on logo power issue", "Power"),
    ("boot loop keeps restarting power problem", "Power"),
    ("power button not working can't turn on", "Power"),
    ("device powers off randomly power fault", "Power"),
    ("won't turn on after charging power issue", "Power"),
    ("no power at all phone dead", "Power"),
    ("overheating power issue heat event", "Power"),
    ("burning smell power fault thermal", "Power"),
    ("smoke from device power issue dangerous", "Power"),
    ("motherboard issue no power dead", "Power"),
    ("device dead after water ingress power fault", "Power"),
    ("completely unresponsive no power whatsoever", "Power"),
    ("spontaneous shutdown won't restart power", "Power"),
    ("boot loop continuous restart power", "Power"),

    # ── Battery ────────────────────────────────────────────────────────────
    ("battery draining quickly poor battery life", "Battery"),
    ("battery doesn't last long drains fast", "Battery"),
    ("swollen battery bulging dangerous", "Battery"),
    ("battery health degraded low capacity", "Battery"),
    ("phone shuts off at thirty percent battery", "Battery"),
    ("battery replacement needed drains overnight", "Battery"),
    ("battery swollen pushing screen out", "Battery"),
    ("poor battery performance draining fast", "Battery"),
    ("battery dead needs replacement", "Battery"),
    ("bloated battery dangerous expanding", "Battery"),
    ("battery not holding charge dies quickly", "Battery"),
    ("phone dies quickly battery issue degraded", "Battery"),
    ("battery capacity very low replacement", "Battery"),
    ("battery health poor draining fast", "Battery"),

    # ── Display ────────────────────────────────────────────────────────────
    ("cracked screen broken display damage", "Display"),
    ("smashed screen needs replacement display", "Display"),
    ("lines on screen display damage horizontal", "Display"),
    ("touchscreen not responding display issue", "Display"),
    ("screen flickering display fault", "Display"),
    ("oled broken black spots on screen", "Display"),
    ("lcd damaged lines across display", "Display"),
    ("digitizer not working touch issue", "Display"),
    ("screen cracked from drop display", "Display"),
    ("display not working black screen", "Display"),
    ("dead pixels on screen display", "Display"),
    ("screen damage cracked glass", "Display"),
    ("broken display needs screen replacement", "Display"),
    ("screen pressure damage display broken", "Display"),
    ("display flickering touch unresponsive", "Display"),

    # ── Charging ───────────────────────────────────────────────────────────
    ("not charging won't charge at all", "Charging"),
    ("charging port damaged loose connection", "Charging"),
    ("charges very slowly slow charging", "Charging"),
    ("usb c port broken won't charge", "Charging"),
    ("lightning port not working charging issue", "Charging"),
    ("charger not connecting port damaged", "Charging"),
    ("intermittent charging port issue", "Charging"),
    ("won't charge at all charging fault", "Charging"),
    ("slow charging takes too long", "Charging"),
    ("charging port loose connection issue", "Charging"),
    ("wireless charging not working", "Charging"),
    ("charger port bent damaged", "Charging"),
    ("charging intermittently port loose", "Charging"),
    ("device not accepting charge port", "Charging"),

    # ── General ────────────────────────────────────────────────────────────
    ("cosmetic damage scratch on back", "General"),
    ("back glass cracked cosmetic", "General"),
    ("housing damage frame dent cosmetic", "General"),
    ("water damage assessment needed", "General"),
    ("general wear tear cosmetic", "General"),
    ("ber assessment beyond economic repair", "General"),
    ("scuffs scratches cosmetic damage", "General"),
    ("minor damage cosmetic only", "General"),
    ("frame bent cosmetic issue", "General"),
    ("speaker not working general fault", "General"),
    ("microphone issue general repair", "General"),
    ("camera not working general issue", "General"),
    ("button not working general fault", "General"),
    ("headphone jack not working general", "General"),
]

# ── Helpers ──────────────────────────────────────────────────────────────────

MODEL_DIR = os.path.join(os.path.dirname(__file__), "saved")


def get_model_paths():
    return {
        "priority_lr":  os.path.join(MODEL_DIR, "priority_lr.pkl"),
        "priority_rf":  os.path.join(MODEL_DIR, "priority_rf.pkl"),
        "priority_vec": os.path.join(MODEL_DIR, "priority_vec.pkl"),
        "category_lr":  os.path.join(MODEL_DIR, "category_lr.pkl"),
        "category_rf":  os.path.join(MODEL_DIR, "category_rf.pkl"),
        "category_vec": os.path.join(MODEL_DIR, "category_vec.pkl"),
    }


def models_exist():
    return all(os.path.exists(p) for p in get_model_paths().values())


# ── Training ─────────────────────────────────────────────────────────────────

def train_and_save():
    os.makedirs(MODEL_DIR, exist_ok=True)
    paths = get_model_paths()

    # ── Priority models ──────────────────────────────────────────────────
    p_texts  = [t for t, _ in PRIORITY_DATA]
    p_labels = [l for _, l in PRIORITY_DATA]

    p_vec = TfidfVectorizer(ngram_range=(1, 2), max_features=3000, sublinear_tf=True)
    p_X   = p_vec.fit_transform(p_texts)

    p_X_train, p_X_test, p_y_train, p_y_test = train_test_split(
        p_X, p_labels, test_size=0.2, random_state=42, stratify=p_labels
    )

    p_lr = LogisticRegression(max_iter=1000, C=1.0, solver="lbfgs", multi_class="auto")
    p_lr.fit(p_X_train, p_y_train)

    p_rf = RandomForestClassifier(n_estimators=200, max_depth=12, random_state=42)
    p_rf.fit(p_X_train, p_y_train)

    print("\n── Priority — Logistic Regression ──────────────────────────")
    print(classification_report(p_y_test, p_lr.predict(p_X_test)))
    print(f"LR accuracy: {accuracy_score(p_y_test, p_lr.predict(p_X_test)):.2%}")
    print("\n── Priority — Random Forest ────────────────────────────────")
    print(classification_report(p_y_test, p_rf.predict(p_X_test)))
    print(f"RF accuracy: {accuracy_score(p_y_test, p_rf.predict(p_X_test)):.2%}")

    joblib.dump(p_vec, paths["priority_vec"])
    joblib.dump(p_lr,  paths["priority_lr"])
    joblib.dump(p_rf,  paths["priority_rf"])

    # ── Category models ──────────────────────────────────────────────────
    c_texts  = [t for t, _ in CATEGORY_DATA]
    c_labels = [l for _, l in CATEGORY_DATA]

    c_vec = TfidfVectorizer(ngram_range=(1, 2), max_features=3000, sublinear_tf=True)
    c_X   = c_vec.fit_transform(c_texts)

    c_X_train, c_X_test, c_y_train, c_y_test = train_test_split(
        c_X, c_labels, test_size=0.2, random_state=42, stratify=c_labels
    )

    c_lr = LogisticRegression(max_iter=1000, C=1.0, solver="lbfgs", multi_class="auto")
    c_lr.fit(c_X_train, c_y_train)

    c_rf = RandomForestClassifier(n_estimators=200, max_depth=12, random_state=42)
    c_rf.fit(c_X_train, c_y_train)

    print("\n── Category — Logistic Regression ──────────────────────────")
    print(classification_report(c_y_test, c_lr.predict(c_X_test)))
    print(f"LR accuracy: {accuracy_score(c_y_test, c_lr.predict(c_X_test)):.2%}")
    print("\n── Category — Random Forest ────────────────────────────────")
    print(classification_report(c_y_test, c_rf.predict(c_X_test)))
    print(f"RF accuracy: {accuracy_score(c_y_test, c_rf.predict(c_X_test)):.2%}")

    joblib.dump(c_vec, paths["category_vec"])
    joblib.dump(c_lr,  paths["category_lr"])
    joblib.dump(c_rf,  paths["category_rf"])

    print("\n[ML] All models trained and saved to", MODEL_DIR)


if __name__ == "__main__":
    train_and_save()
