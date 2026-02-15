import { Metadata } from "next";

export const metadata: Metadata = {
  alternates: {
    canonical: "https://www.babaselo.com/terms",
  },
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
