import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "タスク管理",
  description: "日々のタスクを記録・管理",
};

export default function TasksLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}

