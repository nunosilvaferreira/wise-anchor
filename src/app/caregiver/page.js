import AuthGuard from "../../components/auth-guard";
import CaregiverDashboard from "../../components/caregiver-dashboard";

export const metadata = {
  title: "Caregiver | WiseAnchor",
  description: "Manage dependent profiles, caregiver eligibility, and active routines.",
};

export default function CaregiverPage() {
  return (
    <AuthGuard requireCaregiver>
      <CaregiverDashboard />
    </AuthGuard>
  );
}
