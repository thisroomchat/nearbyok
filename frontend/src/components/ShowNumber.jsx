import { useState } from "react";
import { Phone, Loader2 } from "lucide-react";
import { postLead } from "@/lib/nbk";

export const ShowNumber = ({ businessId, size = "md", testId = "show-number-button" }) => {
  const [state, setState] = useState("idle"); // idle | loading | revealed
  const [phone, setPhone] = useState("");

  const reveal = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (state === "revealed") {
      window.location.href = `tel:${phone.replace(/[^0-9+]/g, "")}`;
      return;
    }
    setState("loading");
    try {
      const res = await postLead({ business_id: businessId, type: "call" });
      setPhone(res.phone);
      setState("revealed");
    } catch {
      setState("idle");
    }
  };

  const pad = size === "lg" ? "px-6 py-3.5 text-base" : "px-4 py-2.5 text-sm";

  return (
    <button
      data-testid={testId}
      onClick={reveal}
      className={`bg-orange-600 hover:bg-orange-700 text-white font-bold ${pad} rounded-lg flex items-center justify-center gap-2 shadow-sm transition-colors w-full`}
    >
      {state === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
      {state === "revealed" ? phone : "Show Number"}
    </button>
  );
};
