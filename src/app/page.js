import AuthGuard from "../components/auth-guard";
import RoutineBoard from "../components/routine-board";

export default function Home() {
  return (
    <AuthGuard>
      <RoutineBoard />
    </AuthGuard>
  );
}
