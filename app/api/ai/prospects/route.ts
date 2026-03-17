import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase
    .from("prospects")
    .select("*")

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const total = data.length
  const active = data.filter(p => p.is_active).length
  const pipelineValue = data.reduce(
    (sum, p) => sum + (p.estimated_value || 0),
    0
  )

  return NextResponse.json({
    total_prospects: total,
    active_prospects: active,
    pipeline_value: pipelineValue
  })
}
