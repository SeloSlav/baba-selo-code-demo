import { HomeClient } from './components/HomeClient';
import { ProtectedRoute } from "./components/ProtectedRoute";

export default function Page() {
  return (
    <ProtectedRoute>
      <HomeClient />
    </ProtectedRoute>
  );
}
