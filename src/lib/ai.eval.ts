/**
 * AI Decision Support Engine — Evaluation Dataset
 *
 * 30 labelled repair descriptions with expected priority and primary category.
 * Run: npx tsx src/lib/ai.eval.ts
 *
 * This measures rule-based classifier accuracy against ground-truth labels
 * assigned by an expert reviewer (Muhammod A Muizz, April 2026).
 */

import { suggestPriority, suggestCategory } from "./ai.js";

type EvalCase = {
  description: string;
  expectedPriority: "Low" | "Medium" | "High";
  expectedCategory: "Power" | "Battery" | "Display" | "Charging" | "General";
};

const EVAL_CASES: EvalCase[] = [
  // High priority — power failures
  { description: "Device won't turn on at all", expectedPriority: "High", expectedCategory: "Power" },
  { description: "Phone completely dead, no response to charging", expectedPriority: "High", expectedCategory: "Power" },
  { description: "Stuck in boot loop, won't load", expectedPriority: "High", expectedCategory: "Power" },
  { description: "Device not powering on after drop", expectedPriority: "High", expectedCategory: "Power" },
  { description: "Gets extremely hot and shuts down — overheating", expectedPriority: "High", expectedCategory: "Power" },

  // High priority — battery safety
  { description: "Swollen battery, back of phone is lifting", expectedPriority: "High", expectedCategory: "Battery" },
  { description: "Bulging battery visible through the back panel", expectedPriority: "High", expectedCategory: "Battery" },

  // Medium priority — battery drain
  { description: "Battery drains very quickly, lasts only 2 hours", expectedPriority: "Medium", expectedCategory: "Battery" },
  { description: "Poor battery life, draining fast", expectedPriority: "Medium", expectedCategory: "Battery" },
  { description: "Battery health seems low", expectedPriority: "Medium", expectedCategory: "Battery" },

  // Medium priority — screen/display
  { description: "Cracked screen, touch still working", expectedPriority: "Medium", expectedCategory: "Display" },
  { description: "Smashed display — can't see anything", expectedPriority: "Medium", expectedCategory: "Display" },
  { description: "Lines across the screen", expectedPriority: "Medium", expectedCategory: "Display" },
  { description: "Touch screen not responding", expectedPriority: "Medium", expectedCategory: "Display" },
  { description: "Dead pixels on LCD", expectedPriority: "Medium", expectedCategory: "Display" },

  // Medium priority — charging
  { description: "Phone not charging when plugged in", expectedPriority: "Medium", expectedCategory: "Charging" },
  { description: "Charging port damaged, cable falls out", expectedPriority: "Medium", expectedCategory: "Charging" },
  { description: "Charges very slowly", expectedPriority: "Medium", expectedCategory: "Charging" },
  { description: "USB-C port not working", expectedPriority: "Medium", expectedCategory: "Charging" },
  { description: "Lightning port appears damaged", expectedPriority: "Medium", expectedCategory: "Charging" },

  // Low priority — cosmetic
  { description: "Small scratch on the back of the phone", expectedPriority: "Low", expectedCategory: "General" },
  { description: "Scuff marks on frame, phone works fine", expectedPriority: "Low", expectedCategory: "General" },
  { description: "Dent on the corner, no functional issues", expectedPriority: "Low", expectedCategory: "General" },
  { description: "Housing damage from drop, screen intact", expectedPriority: "Low", expectedCategory: "General" },
  { description: "Back glass cracked but device fully functional", expectedPriority: "Low", expectedCategory: "General" },

  // Edge cases
  { description: "Screen crack and battery draining fast", expectedPriority: "Medium", expectedCategory: "Battery" },
  { description: "Won't turn on and water damage", expectedPriority: "High", expectedCategory: "Power" },
  { description: "Phone overheating and screen lines", expectedPriority: "High", expectedCategory: "Power" },
  { description: "General service request", expectedPriority: "Medium", expectedCategory: "General" },
  { description: "Back glass cracked and not charging", expectedPriority: "Medium", expectedCategory: "Charging" },
];

function evaluate() {
  let priorityCorrect = 0;
  let categoryCorrect = 0;
  const failures: string[] = [];

  for (const c of EVAL_CASES) {
    const gotPriority = suggestPriority(c.description);
    const gotCategory = suggestCategory(c.description);

    const pOk = gotPriority === c.expectedPriority;
    const cOk = gotCategory === c.expectedCategory;

    if (pOk) priorityCorrect++;
    if (cOk) categoryCorrect++;

    if (!pOk || !cOk) {
      failures.push(
        `  FAIL: "${c.description}"\n` +
        (!pOk ? `    priority: got ${gotPriority}, expected ${c.expectedPriority}\n` : "") +
        (!cOk ? `    category: got ${gotCategory}, expected ${c.expectedCategory}\n` : "")
      );
    }
  }

  const n = EVAL_CASES.length;
  const pAcc = ((priorityCorrect / n) * 100).toFixed(1);
  const cAcc = ((categoryCorrect / n) * 100).toFixed(1);

  console.log("\nModuServ AI Engine — Evaluation Results");
  console.log("========================================");
  console.log(`Total cases:        ${n}`);
  console.log(`Priority accuracy:  ${priorityCorrect}/${n}  (${pAcc}%)`);
  console.log(`Category accuracy:  ${categoryCorrect}/${n}  (${cAcc}%)`);
  console.log("");

  if (failures.length > 0) {
    console.log(`Failures (${failures.length}):`);
    failures.forEach((f) => console.log(f));
  } else {
    console.log("All cases passed.");
  }
}

evaluate();
