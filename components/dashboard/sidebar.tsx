"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ImageIcon,
  Wand2Icon,
  FileTextIcon,
  ImagePlusIcon,
  LayoutDashboardIcon,
  LibraryIcon,
} from "lucide-react";

const routes = [
  {
    label: "Dashboard",
    icon: LayoutDashboardIcon,
    href: "/dashboard",
    color: "text-sky-500",
  },
  {
    label: "Library",
    icon: LibraryIcon,
    href: "/dashboard/library",
    color: "text-blue-500",
  },
  {
    label: "Generate",
    icon: Wand2Icon,
    href: "/dashboard/generate",
    color: "text-pink-700",
  },
  {
    label: "Enhance",
    icon: ImagePlusIcon,
    href: "/dashboard/enhance",
    color: "text-orange-700",
  },
  {
    label: "Metadata",
    icon: FileTextIcon,
    href: "/dashboard/metadata",
    color: "text-emerald-500",
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-card text-card-foreground w-[200px]">
      <div className="px-3 py-2 flex-1">
        <div className="space-y-1">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:bg-primary/10 rounded-lg transition",
                pathname === route.href ? "bg-primary/10" : "transparent",
                route.color
              )}
            >
              <div className="flex items-center flex-1">
                <route.icon className="h-5 w-5 mr-3" />
                {route.label}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}