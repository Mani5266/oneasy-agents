import { NextResponse } from "next/server";
import { calculateSalary, breakdownToResponse } from "@/features/salary/lib/engine/salary-calculator";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { current_ctc, new_ctc, state = "default" } = body;

    if (!current_ctc || current_ctc <= 0 || !new_ctc || new_ctc <= 0) {
      return NextResponse.json(
        { detail: "Both current_ctc and new_ctc must be positive numbers" },
        { status: 400 },
      );
    }

    const current = calculateSalary(current_ctc, state);
    const proposed = calculateSalary(new_ctc, state);

    const currentResp = breakdownToResponse(current);
    const proposedResp = breakdownToResponse(proposed);

    const round2 = (n: number) => Math.round(n * 100) / 100;

    return NextResponse.json({
      current: currentResp,
      proposed: proposedResp,
      delta: {
        annual_ctc: round2(new_ctc - current_ctc),
        monthly_ctc: round2(proposed.monthly_ctc - current.monthly_ctc),
        net_salary_monthly: round2(proposed.net_salary_monthly - current.net_salary_monthly),
        net_salary_annual: round2(proposed.net_salary_annual - current.net_salary_annual),
        employer_cost_monthly: round2(
          (proposed.employer_contributions.employer_epf + proposed.employer_contributions.employer_esi) -
          (current.employer_contributions.employer_epf + current.employer_contributions.employer_esi)
        ),
        hike_percentage: round2(((new_ctc - current_ctc) / current_ctc) * 100),
      },
      flags: {
        esi_threshold_crossing: current.esi_eligible !== proposed.esi_eligible,
        esi_current: current.esi_eligible,
        esi_proposed: proposed.esi_eligible,
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Comparison failed";
    return NextResponse.json({ detail: msg }, { status: 400 });
  }
}
