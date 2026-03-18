"use client";

import { Suspense } from "react";
import AcceptInvitationClient from "./AcceptInvitationClient";

export const dynamic = "force-dynamic";

// ===== INICIO página pública =====
export default function Page() {
  return (
    <Suspense fallback={<div>Cargando invitación...</div>}>
      <AcceptInvitationClient />
    </Suspense>
  );
}
// ===== FIN página pública =====
