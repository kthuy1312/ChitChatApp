import { useAuthStore } from "@/stores/useAuthStore"
import { Navigate, Outlet } from "react-router"

const AuthRoute = () => {
    const { accessToken, loading } = useAuthStore()

    if (loading) return null

    if (accessToken) {
        return <Navigate to="/" replace />
    }

    return <Outlet />
}

export default AuthRoute
