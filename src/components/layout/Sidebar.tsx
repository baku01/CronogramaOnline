import React from "react";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Settings,
  BarChart3,
  FileText,
  Network,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  activeTab,
  onTabChange
}) => {
  const menuItems = [
    { id: "gantt", label: "Cronograma", icon: <Calendar size={20} /> },
    { id: "pert", label: "Diagrama PERT", icon: <Network size={20} /> },
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
    { id: "resources", label: "Recursos", icon: <Users size={20} /> },
    { id: "reports", label: "Relatórios", icon: <FileText size={20} /> },
    { id: "analytics", label: "Análise", icon: <BarChart3 size={20} /> },
    { id: "settings", label: "Configurações", icon: <Settings size={20} /> },
  ];

  return (
    <aside
      className={`
        bg-slate-900 border-r border-slate-800 h-full flex flex-col transition-all duration-300 ease-in-out z-20 shadow-2xl
        ${isOpen ? "w-72" : "w-20"}
      `}
    >
      {/* Logo Area */}
      <div className={`h-16 flex items-center px-6 border-b border-slate-800 ${isOpen ? "justify-start" : "justify-center"}`}>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
          <LayoutDashboard className="text-white" size={18} />
        </div>
        <span className={`ml-3 font-bold text-lg text-white tracking-tight transition-opacity duration-200 ${isOpen ? "opacity-100" : "opacity-0 w-0 overflow-hidden"}`}>
          Cronograma<span className="text-indigo-400">.io</span>
        </span>
      </div>

      <div className="flex-1 py-6 flex flex-col gap-1.5 overflow-y-auto px-3 custom-scrollbar">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`
              flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 relative group
              ${activeTab === item.id
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/20"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
              }
            `}
            title={!isOpen ? item.label : undefined}
          >
            <span className={`${activeTab === item.id ? "text-white" : "text-slate-400 group-hover:text-slate-300"}`}>
              {item.icon}
            </span>

            <span className={`whitespace-nowrap font-medium transition-all duration-200 ${isOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 w-0 overflow-hidden"}`}>
              {item.label}
            </span>

            {/* Hover Tooltip for collapsed state */}
            {!isOpen && (
              <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl border border-slate-700">
                {item.label}
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center p-2 rounded-lg text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors"
        >
          {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>
    </aside>
  );
};
