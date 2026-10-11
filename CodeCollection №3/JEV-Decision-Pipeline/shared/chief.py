# jev decides. code acts.
import json
from pathlib import Path
from uuid import uuid4
from typesafe_sdk import Choice, TypeSafeClient

state = {"goal": goal, "completed_work": notes}
with TypeSafeClient(model="jev-1.13.0") as client:
    result = client.system_one(
        state=state,
        questions={
            "next_worker": Choice(
                instructions="Choose the next step.",
                criteria={
                    "research": "Collect evidence first.",
                    "write": "Draft from evidence.",
                    "review": "Unclear or done.",
                },
            )
        },
    )
answer = result.choices["next_worker"]
destination = "review"
if answer.confidence >= 0.85:
    destination = answer.choice
job = folder / f"{uuid4().hex}.json"
job.write_text(json.dumps(payload))
