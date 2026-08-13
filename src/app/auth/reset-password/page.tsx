import { Suspense } from "react"
import { ResetPassword } from "@/app/components/auth/reset-password"

const page = () => {
    return (
        <Suspense fallback={null}>
            <ResetPassword/>
        </Suspense>
    )
}

export default page;
