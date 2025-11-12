"use client";

import { useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import { getUser, clearUser, User } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Users,
  Calendar,
  DollarSign,
  BookOpen,
  FileText,
  Bell,
  Settings,
  LogOut,
  Menu,
  GraduationCap,
  Clock,
  CalendarCheck,
} from 'lucide-react';
import Link from 'next/link';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface DashboardLayoutProps {
  children: ReactNode;
  role: 'admin' | 'teacher' | 'student' | 'parent';
}

export default function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const currentUser = getUser();
    if (!currentUser || currentUser.role !== role) {
      router.push('/login');
    } else {
      setUser(currentUser);
    }
  }, [role, router]);

  const handleLogout = () => {
    clearUser();
    router.push('/login');
  };

  if (!mounted || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getNavItems = () => {
    switch (role) {
      case 'admin':
        return [
          { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
          { href: '/admin/students', label: 'Students', icon: Users },
          { href: '/admin/attendance', label: 'Attendance', icon: Calendar },
          { href: '/admin/fees', label: 'Fees', icon: DollarSign },
          { href: '/admin/timetable', label: 'Timetable', icon: Clock },
          { href: '/admin/reports', label: 'Reports', icon: FileText },
        ];
      case 'teacher':
        return [
          { href: '/teacher', label: 'Dashboard', icon: LayoutDashboard },
          { href: '/teacher/students', label: 'Students', icon: Users },
          { href: '/teacher/attendance', label: 'Attendance', icon: Calendar },
          { href: '/teacher/marks', label: 'Marks Entry', icon: BookOpen },
          { href: '/teacher/timetable', label: 'Timetable', icon: Clock },
          { href: '/teacher/leaves', label: 'Leave Requests', icon: CalendarCheck },
        ];
      case 'student':
        return [
          { href: '/student', label: 'Dashboard', icon: LayoutDashboard },
          { href: '/student/timetable', label: 'Timetable', icon: Clock },
          { href: '/student/attendance', label: 'My Attendance', icon: Calendar },
          { href: '/student/marks', label: 'My Marks', icon: BookOpen },
          { href: '/student/fees', label: 'Fees', icon: DollarSign },
        ];
      case 'parent':
        return [
          { href: '/parent', label: 'Dashboard', icon: LayoutDashboard },
          { href: '/parent/children', label: 'My Children', icon: Users },
          { href: '/parent/attendance', label: 'Attendance', icon: Calendar },
          { href: '/parent/marks', label: 'Academic Performance', icon: BookOpen },
          { href: '/parent/fees', label: 'Fees', icon: DollarSign },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-card border-r">
      <div className="p-6 border-b">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-2 rounded-lg">
            <GraduationCap className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg">School ERP</h1>
            <p className="text-xs text-muted-foreground capitalize">{role} Portal</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Button
              variant="ghost"
              className="w-full justify-start"
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </Button>
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t space-y-2">
        <Link href={`/${role}/notifications`}>
          <Button variant="ghost" className="w-full justify-start">
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </Button>
        </Link>
        <Link href={`/${role}/settings`}>
          <Button variant="ghost" className="w-full justify-start">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </Link>
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b bg-card">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72">
            <Sidebar />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <GraduationCap className="h-6 w-6" />
          <span className="font-bold">School ERP</span>
        </div>
        <div className="w-10" />
      </div>

      <div className="lg:grid lg:grid-cols-[250px_1fr]">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block h-screen sticky top-0">
          <Sidebar />
        </aside>

        {/* Main Content */}
        <main className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">Welcome, {user.fullName}</h2>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}