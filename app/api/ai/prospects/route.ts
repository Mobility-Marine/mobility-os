export const dynamic = "force-dynamic";

import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "Supabase env variables missing" },
      { status: 500 }
    )
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data, error } = await supabase
    .from("prospects")
    .select("id, is_active, estimated_value")

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows = data ?? []

  const total = rows.length
  const active = rows.filter(p => p.is_active).length
  const pipelineValue = rows.reduce(
    (sum, p) => sum + (p.estimated_value || 0),
    0
  )

  return NextResponse.json({
    total_prospects: total,
    active_prospects: active,
    pipeline_value: pipelineValue
  })
}
