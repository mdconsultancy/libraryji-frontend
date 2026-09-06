import type { Metadata } from "next";
import { Register } from "@/app/components/auth/register";

export const metadata: Metadata = {
    title: "Free Trial — Library Management Software",
    description:
        "Start your free trial of LibraryJi, a complete library management system and study room management software for libraries across India — seat booking, student enrollment, attendance, fees, and reports.",
};

const page = () => {
    return <Register/>
}

export default page;