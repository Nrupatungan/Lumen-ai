import { UsageDashboard } from "@/components/dashboard/UsageDashboard";
import { Container } from "@mui/material";

export default function DashboardPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 10 }}>
      <UsageDashboard />
    </Container>
  );
}
