import { Box } from "@mui/material";
import PricingHero from "@/components/pricing/PricingHero";
import Tiers from "@/components/pricing/Tiers";
import ComparisonTable from "@/components/pricing/ComparisonTable";
import FaqSection from "@/components/pricing/FaqSection";

export default function PricingPage() {
  return (
    <Box>
      {/* ================= HERO ================= */}
      <PricingHero />

      {/* ================= TIERS ================= */}
      <Tiers />

      {/* ================= COMPARISON ================= */}
      <ComparisonTable />

      {/* ================= FAQ ================= */}
      <FaqSection />
    </Box>
  );
}
