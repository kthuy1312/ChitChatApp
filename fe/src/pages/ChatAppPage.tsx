import { useAuthStore } from "@/stores/useAuthStore"

const ChatAppPage = () => {
    const user = useAuthStore((s) => s.user)
    console.log(user)
    return (
        <div>{user?.username} </div>
    )
}

export default ChatAppPage