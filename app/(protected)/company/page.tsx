"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export default function CompanyPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/settings"); }, []);
  return null;
}
