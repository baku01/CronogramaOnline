import React, { useState } from "react";
import {
    Plus,
    Save,
    Download,
    Upload,
    Search,
    BarChart3,
    Settings,
    UsersRound,
    Target,
    SquareFunction,
    BarChartBig,
    Undo,
    Redo,
} from "lucide-react";
import { ViewMode } from "gantt-task-react";
import CalendarManager from "./CalendarManager";
import ResourceLevelingModal from "./ResourceLevelingModal";
import BaselineManager from "./BaselineManager";
import CustomFieldManager from "./CustomFieldManager";
import ReportingModal from "./ReportingModal";
import { useMultiProject } from "../store/multiProjectStore";
import { Button } from "./ui/Button";

interface ToolbarProps {
    onAddTask: () => void;
    onSave: () => void;
    onExport: () => void;
    onImport: () => void;
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
    onShowCriticalPath: (show: boolean) => void;
    showCriticalPath: boolean;
    onShowBaseline: (show: boolean) => void;
    showBaseline: boolean;
    searchQuery: string;
    onSearchChange: (query: string) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
    onAddTask,
    onSave,
    onExport,
    onImport,
    viewMode,
    onViewModeChange,
    onShowCriticalPath,
    showCriticalPath,
    onShowBaseline,
    showBaseline,
    searchQuery,
    onSearchChange,
}) => {
    const [showCalendarManager, setShowCalendarManager] = useState(false);
    const [showResourceLeveling, setShowResourceLeveling] = useState(false);
    const [showBaselineManager, setShowBaselineManager] = useState(false);
    const [showCustomFieldManager, setShowCustomFieldManager] = useState(false);
    const [showReporting, setShowReporting] = useState(false);
    const {
        getCalendars,
        setDefaultCalendar,
        activeProject: project,
        updateAllCalendars,
        undo,
        redo,
        canUndo,
        canRedo
    } = useMultiProject();

    return (
        <div className="bg-white border-b border-slate-200 px-4 py-3 shadow-sm z-20 relative">
            <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
                {/* Top Row (Mobile) / Left Section (Desktop): Primary Actions */}
                <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
                    <Button
                        onClick={onAddTask}
                        variant="primary"
                        leftIcon={<Plus size={18} />}
                        className="shadow-indigo-100"
                    >
                        Nova Tarefa
                    </Button>

                    <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block" />

                    <div className="flex items-center gap-1">
                        <Button onClick={onSave} variant="ghost" size="icon" title="Salvar Projeto">
                            <Save size={18} />
                        </Button>
                        <Button onClick={onExport} variant="ghost" size="icon" title="Exportar">
                            <Download size={18} />
                        </Button>
                        <Button onClick={onImport} variant="ghost" size="icon" title="Importar">
                            <Upload size={18} />
                        </Button>
                    </div>

                    <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block" />

                    <div className="flex items-center gap-1">
                        <Button
                            onClick={undo}
                            disabled={!canUndo}
                            variant="ghost"
                            size="icon"
                            title="Desfazer (Ctrl+Z)"
                            className={!canUndo ? "opacity-50 cursor-not-allowed" : ""}
                        >
                            <Undo size={18} />
                        </Button>
                        <Button
                            onClick={redo}
                            disabled={!canRedo}
                            variant="ghost"
                            size="icon"
                            title="Refazer (Ctrl+Y)"
                            className={!canRedo ? "opacity-50 cursor-not-allowed" : ""}
                        >
                            <Redo size={18} />
                        </Button>
                    </div>

                    <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block" />

                    {/* Management Tools */}
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 sm:pb-0 max-w-full">
                        <Button
                            onClick={() => setShowCalendarManager(true)}
                            variant="outline"
                            size="sm"
                            leftIcon={<Settings size={16} />}
                            title="Gerenciar Calendários"
                        >
                            <span className="hidden lg:inline">Calendários</span>
                        </Button>

                        <Button
                            onClick={() => setShowResourceLeveling(true)}
                            variant="outline"
                            size="sm"
                            leftIcon={<UsersRound size={16} />}
                            title="Nivelamento de Recursos"
                        >
                            <span className="hidden lg:inline">Recursos</span>
                        </Button>

                        <Button
                            onClick={() => setShowBaselineManager(true)}
                            variant="outline"
                            size="sm"
                            leftIcon={<Target size={16} />}
                            title="Gerenciar Linhas de Base"
                        >
                            <span className="hidden lg:inline">Baseline</span>
                        </Button>

                        <Button
                            onClick={() => setShowCustomFieldManager(true)}
                            variant="outline"
                            size="sm"
                            leftIcon={<SquareFunction size={16} />}
                            title="Campos Personalizados"
                        >
                            <span className="hidden lg:inline">Campos</span>
                        </Button>

                        <Button
                            onClick={() => setShowReporting(true)}
                            variant="outline"
                            size="sm"
                            leftIcon={<BarChartBig size={16} />}
                            title="Relatórios"
                        >
                            <span className="hidden lg:inline">Relatórios</span>
                        </Button>
                    </div>
                </div>

                {/* Bottom Row (Mobile) / Right Section (Desktop): View Controls & Search */}
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
                    {/* View Modes */}
                    <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200 w-full sm:w-auto justify-center">
                        <button
                            onClick={() => onViewModeChange(ViewMode.Day)}
                            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === ViewMode.Day
                                ? "bg-white text-indigo-600 shadow-sm"
                                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                                }`}
                        >
                            Dia
                        </button>
                        <button
                            onClick={() => onViewModeChange(ViewMode.Week)}
                            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === ViewMode.Week
                                ? "bg-white text-indigo-600 shadow-sm"
                                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                                }`}
                        >
                            Semana
                        </button>
                        <button
                            onClick={() => onViewModeChange(ViewMode.Month)}
                            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === ViewMode.Month
                                ? "bg-white text-indigo-600 shadow-sm"
                                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                                }`}
                        >
                            Mês
                        </button>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button
                            onClick={() => onShowCriticalPath(!showCriticalPath)}
                            variant={showCriticalPath ? "danger" : "outline"}
                            size="sm"
                            className={showCriticalPath ? "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100" : ""}
                            leftIcon={<BarChart3 size={16} />}
                            title={showCriticalPath ? "Ocultar Caminho Crítico" : "Mostrar Caminho Crítico"}
                        >
                            <span className="hidden sm:inline">Caminho Crítico</span>
                        </Button>

                        <Button
                            onClick={() => onShowBaseline(!showBaseline)}
                            variant={showBaseline ? "primary" : "outline"}
                            size="sm"
                            className={showBaseline ? "bg-slate-700 text-white hover:bg-slate-800" : ""}
                            leftIcon={<Target size={16} />}
                            title={showBaseline ? "Ocultar Linha de Base" : "Mostrar Linha de Base"}
                        >
                            <span className="hidden sm:inline">Baseline</span>
                        </Button>

                        <div className="relative flex-1 sm:w-48">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Buscar..."
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showCalendarManager && (
                <CalendarManager
                    isOpen={showCalendarManager}
                    onClose={() => setShowCalendarManager(false)}
                    calendars={getCalendars()}
                    defaultCalendarId={project?.defaultCalendarId}
                    onSave={(calendars) => {
                        updateAllCalendars(calendars);
                        setShowCalendarManager(false);
                    }}
                    onSetDefault={(calendarId) => {
                        setDefaultCalendar(calendarId);
                    }}
                />
            )}

            {showResourceLeveling && (
                <ResourceLevelingModal isOpen={showResourceLeveling} onClose={() => setShowResourceLeveling(false)} />
            )}

            {showBaselineManager && (
                <BaselineManager isOpen={showBaselineManager} onClose={() => setShowBaselineManager(false)} />
            )}

            {showCustomFieldManager && (
                <CustomFieldManager isOpen={showCustomFieldManager} onClose={() => setShowCustomFieldManager(false)} />
            )}

            {showReporting && <ReportingModal isOpen={showReporting} onClose={() => setShowReporting(false)} />}
        </div>
    );
};

export default Toolbar;
