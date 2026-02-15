import { Metadata } from "next";

export const metadata: Metadata = {
  alternates: {
    canonical: "https://www.babaselo.com/privacy",
  },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
