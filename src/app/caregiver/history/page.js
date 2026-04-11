import AuthGuard from "../../../components/auth-guard";
import CaregiverHistory from "../../../components/caregiver-history";

export const metadata = {
  title: "Caregiver History | WiseAnchor",
  description: "Review archived routine history, missed tasks, and progress trends.",
};

export default function CaregiverHistoryPage() {
  return (
    <AuthGuard requireCaregiver>
      <CaregiverHistory />
    </AuthGuard>
  );
}
