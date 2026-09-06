import type { Metadata } from "next";
import { Login } from "@/app/components/auth/login"

export const metadata: Metadata = {
    title: "Login",
    description: "Sign in to your LibraryJi library management dashboard.",
};

const page = () => {
    return <Login/>
}

export default page;