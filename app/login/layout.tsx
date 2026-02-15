import { Metadata } from "next";

export const metadata: Metadata = {
  alternates: {
    canonical: "https://www.babaselo.com/login",
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
