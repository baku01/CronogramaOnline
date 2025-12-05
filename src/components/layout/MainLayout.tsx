import React, { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Menu } from "lucide-react";

interface MainLayoutProps {
    children: React.ReactNode;
    headerActions?: React.ReactNode;
    toolbar?: React.ReactNode;
    statusBar?: React.ReactNode;
    activeTab: string;
    onTabChange: (tab: string) => void;
    projectName?: string;
    projectDescription?: string;
    projectSwitcher?: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
    children,
    headerActions,
    toolbar,
    statusBar,
    activeTab,
    onTabChange,
    projectName = "Projeto Sem Título",
    projectDescription,
    projectSwitcher,
}) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            if (mobile) setIsSidebarOpen(false);
        };

        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    return (
        <div className="h-screen flex bg-slate-50 overflow-hidden font-sans text-slate-900">
            {/* Mobile Overlay */}
            {isMobile && isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div
                className={`
          ${isMobile ? "fixed inset-y-0 left-0 z-50 shadow-xl" : "relative"}
          ${isMobile && !isSidebarOpen ? "-translate-x-full" : "translate-x-0"}
          transition-transform duration-300 ease-in-out
        `}
            >
                <Sidebar
                    isOpen={isMobile ? true : isSidebarOpen}
                    onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                    activeTab={activeTab}
                    onTabChange={(tab) => {
                        onTabChange(tab);
                        if (isMobile) setIsSidebarOpen(false);
                    }}
                />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300 relative">
                {/* Header */}
                <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 z-30 sticky top-0 shrink-0 shadow-sm transition-all duration-200">
                    <div className="px-6 py-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                            {isMobile && (
                                <button
                                    onClick={() => setIsSidebarOpen(true)}
                                    className="p-2 -ml-2 text-slate-600 hover:bg-slate-100/50 rounded-xl transition-colors"
                                >
                                    <Menu size={24} />
                                </button>
                            )}
                            <div className="flex flex-col min-w-0">
                                <h1 className="text-2xl font-bold text-slate-800 leading-tight truncate tracking-tight font-display">
                                    {projectName}
                                </h1>
                                {projectDescription && (
                                    <p className="text-sm text-slate-500 mt-0.5 line-clamp-1 truncate font-medium">
                                        {projectDescription}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                            {projectSwitcher}
                            {headerActions}
                        </div>
                    </div>

                    {/* Toolbar Area */}
                    {toolbar && (
                        <div className="px-6 py-2 border-t border-slate-100/50 bg-slate-50/30 backdrop-blur-sm">
                            {toolbar}
                        </div>
                    )}
                </header>

                {/* Scrollable Content */}
                <main className="flex-1 overflow-hidden relative z-0 flex flex-col p-4 sm:p-6">
                    <div className="h-full w-full flex flex-col animate-fade-in">{children}</div>
                </main>

                {/* Status Bar */}
                {statusBar && <div className="shrink-0 z-40">{statusBar}</div>}
            </div>
        </div>
    );
};
