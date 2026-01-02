import { BrowserRouter, Route } from "react-router"
import SignInPage from "./pages/SignInPage"
import SignUpPage from "./pages/SignUpPage"
import ChatAppPage from "./pages/ChatAppPage"
import { Toaster } from "sonner"

function App() {

  return (
    <>
      <Toaster richColors />
      <BrowserRouter>

        {/* public routes */}
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />

        {/* private routes */}
        <Route path="/chat" element={<ChatAppPage />} />

      </BrowserRouter>
    </>
  )
}

export default App
