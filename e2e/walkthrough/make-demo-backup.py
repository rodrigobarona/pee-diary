"""Write a realistic Eleva Diary backup for screenshots and walkthroughs.

Four full days before today plus this morning, made-up data only. Times are
written as UTC; run the simulators in a UTC+0 zone (Europe/Lisbon in winter)
for the times to read as written.

    python3 e2e/walkthrough/make-demo-backup.py OUT.json [en|pt|es]

The language is the app language the backup restores, and the language of
the notes.
"""
import json
import random
import sys
import uuid
from datetime import datetime, timedelta, timezone

rng = random.Random(11)
LANGUAGE = sys.argv[2] if len(sys.argv) > 2 else "en"
NOTES = {
    "en": ("Measured with the jug", "Cold this week"),
    "pt": ("Medido com o jarro", "Constipação esta semana"),
    "es": ("Medido con la jarra", "Resfriado esta semana"),
}[LANGUAGE]
# The urination with a measured volume and a note, opened by the flows
MEASURED_ID = "5a9a4b54-727a-4aa2-9c15-b854019f5d5a"

today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
DAYS = [today - timedelta(days=n) for n in (4, 3, 2, 1, 0)]
entries = []


def iso(dt):
    return dt.strftime("%Y-%m-%dT%H:%M:%S.000Z")


def add(entry, at, entry_id=None):
    entry.update({
        "id": entry_id or str(uuid.UUID(int=rng.getrandbits(128), version=4)),
        "timestamp": iso(at),
        "createdAt": iso(at),
    })
    entries.append(entry)


for i, day in enumerate(DAYS):
    last_day = i == len(DAYS) - 1
    # Urination: sometimes a night visit, then every ~2.5 hours while awake
    times = [(3, rng.randint(5, 40))] if rng.random() < 0.6 else []
    times += [(h, rng.randint(0, 50)) for h in (7, 9, 12, 14, 17, 19, 22)]
    if last_day:
        times = [t for t in times if t[0] < 10]
    for h, m in times:
        e = {
            "type": "urination",
            "volume": rng.choice(["small", "medium", "medium", "large"]) if h != 7 else "large",
            "urgency": rng.choice([1, 2, 2, 3, 3, 4]) if h != 3 else 3,
            "hadLeak": False,
            "hadPain": False,
        }
        special = h == 7 and i == 1
        if special:
            e["volumeMl"] = 420
            e["notes"] = NOTES[0]
        add(e, day + timedelta(hours=h, minutes=m), MEASURED_ID if special else None)

    # Fluids
    drinks = [(7, 40, "water", 250), (8, 15, "coffee", 150), (10, 30, "water", 300),
              (13, 0, "water", 330), (16, 10, "tea", 250), (19, 30, "water", 300), (21, 0, "juice", 200)]
    if last_day:
        drinks = [d for d in drinks if d[0] < 10]
    for h, m, kind, ml in drinks:
        add({"type": "fluid", "drinkType": kind, "amount": ml},
            day + timedelta(hours=h, minutes=m + rng.randint(0, 9)))

    # Two leaks
    if i == 1:
        add({"type": "leak", "severity": "drops", "urgency": 3, "activity": "coughing",
             "notes": NOTES[1]}, day + timedelta(hours=11, minutes=20))
    if i == 3:
        add({"type": "leak", "severity": "moderate", "urgency": 4, "activity": "exercise"},
            day + timedelta(hours=18, minutes=5))

entries.sort(key=lambda e: e["timestamp"])
backup = {
    "version": 1,
    "entries": entries,
    "goals": {"fluidTarget": 1750},
    "goalHistory": [],
    "language": LANGUAGE,
    "streak": {"currentStreak": 5, "lastActiveDate": today.strftime("%Y-%m-%d")},
    "exportedAt": iso(today + timedelta(hours=9, minutes=30)),
}
with open(sys.argv[1], "w") as f:
    json.dump(backup, f, indent=2)
print(len(entries), "entries;", "open day", DAYS[1].strftime("%Y-%m-%d"), "->", sys.argv[1])
