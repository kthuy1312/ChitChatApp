import { useAuthStore } from "@/stores/useAuthStore"
import { useEffect, useState } from "react"
import { Navigate, Outlet } from "react-router"

const ProtectedRoute = () => {
    const { accessToken, refresh, fetchMe, user, loading } = useAuthStore()
    const [starting, setStarting] = useState(true) //cho biet app da chay chua

    const init = async () => {
        //có thể xảy ra khi F5 trang
        if (!accessToken) {
            await refresh()
        }

        if (accessToken && !user) {
            await fetchMe()
        }
        setStarting(false)
    }

    useEffect(() => {
        init()
    }, [])

    if (starting || loading) {
        return <div className="flex h-screen items-center justify-center ">Đang tải trang...</div>
    }

    if (!accessToken) {
        return (
            <Navigate to="/signin" replace />
        )
    }

    return (
        <Outlet></Outlet>
    )
}

export default ProtectedRoute