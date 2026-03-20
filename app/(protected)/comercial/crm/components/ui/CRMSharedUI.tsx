"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type {
  CrmAccount,
  CrmDocument,
  CrmActivity,
  CrmOpportunity,
  CrmQuote,
  CrmOrder,
  TimelineItem,
  CrmContact,
  AccountRevenue,
} from "../types/crm.types";
