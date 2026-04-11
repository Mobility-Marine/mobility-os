"use client";

import React from "react";
import { getModuleFromEventType } from "@/services/agenda/module-events.service";

interface ModuleEventBadgeProps {
  eventType: string;
  size?: "sm" | "md";
}

export default function ModuleEventBadge({ eventType, size = "sm" }: ModuleEventBadgeProps) {
  const module = getModuleFromEventType(eventType);
  if (!module) return null;

  const fontSize = size === "sm" ? "9px" : "11px";
  const padding  = size === "sm" ? "1px 4px" : "2px 8px";

  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      padding,
      borderRadius: "3px",
      background: module.color + "30",
      color: module.color,
      fontSize,
      fontWeight: 700,
      letterSpacing: "0.3px",
      lineHeight: 1.4,
      flexShrink: 0,
    }}>
      {module.label}
    </span>
  );
}
