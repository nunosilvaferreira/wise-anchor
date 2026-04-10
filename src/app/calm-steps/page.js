import AuthGuard from "../../components/auth-guard";
import CalmSteps from "../../components/calm-steps";

export const metadata = {
  title: "CalmSteps | WiseAnchor",
  description: "A calming support page with simple emotional check-ins.",
};

export default function CalmStepsPage() {
  return (
    <AuthGuard>
      <CalmSteps />
    </AuthGuard>
  );
}
