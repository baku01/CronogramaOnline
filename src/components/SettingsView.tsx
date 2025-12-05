import React, { useState, useEffect } from "react";
import { Settings, Save, Calendar, Clock, Info, ChevronRight, ListChecks, Layers, GitBranch } from "lucide-react";
import { useProject } from "../store/projectStore";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import CalendarManager from "./CalendarManager";
import CustomFieldManager from "./CustomFieldManager";
import BaselineManager from "./BaselineManager";
import ScenarioManager from "./ScenarioManager";

import { VerificationManager } from "./VerificationManager";

const SettingsView: React.FC = () => {
    const {
        project,
        setProject,
        saveToLocalStorage,
        getCalendars,
        updateAllCalendars,
        setDefaultCalendar
    } = useProject();

    const [projectName, setProjectName] = useState("");
    const [projectDescription, setProjectDescription] = useState("");
    const [projectStartDate, setProjectStartDate] = useState("");
    const [projectEndDate, setProjectEndDate] = useState("");
    const [isCalendarManagerOpen, setIsCalendarManagerOpen] = useState(false);
    const [isCustomFieldManagerOpen, setIsCustomFieldManagerOpen] = useState(false);
    const [isBaselineManagerOpen, setIsBaselineManagerOpen] = useState(false);
    const [isScenarioManagerOpen, setIsScenarioManagerOpen] = useState(false);

    useEffect(() => {
        if (project) {
            setProjectName(project.name);
            setProjectDescription(project.description || "");
            setProjectStartDate(project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : "");
            setProjectEndDate(project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : "");
        }
    }, [project]);

    const handleSave = () => {
        if (!project) return;

        const updatedProject = {
            ...project,
            name: projectName,
            description: projectDescription,
            startDate: projectStartDate ? new Date(projectStartDate) : project.startDate,
            endDate: projectEndDate ? new Date(projectEndDate) : project.endDate,
            updatedAt: new Date()
        };

        setProject(updatedProject);
        saveToLocalStorage();
        alert("Configurações salvas com sucesso!");
    };

    if (!project) return null;

    const defaultCalendar = project.calendars?.find((c: any) => c.id === project.defaultCalendarId) || project.calendars?.[0];

    return (
        <div className="h-full bg-slate-50/50 p-6 flex flex-col gap-6 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Configurações do Projeto</h1>
                    <p className="text-slate-500 mt-1">Gerencie as informações gerais e preferências do projeto</p>
                </div>
                <Button onClick={handleSave}>
                    <Save size={18} className="mr-2" />
                    Salvar Alterações
                </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
                    {/* General Info */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <Info size={20} className="text-blue-600" />
                            Informações Gerais
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome do Projeto</label>
                                <Input
                                    value={projectName}
                                    onChange={(e) => setProjectName(e.target.value)}
                                    placeholder="Minha Obra Incrível"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Descrição</label>
                                <textarea
                                    value={projectDescription}
                                    onChange={(e) => setProjectDescription(e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all min-h-[100px] resize-y"
                                    placeholder="Descrição detalhada do projeto..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <Calendar size={20} className="text-blue-600" />
                            Datas e Prazos
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Data de Início</label>
                                <Input
                                    type="date"
                                    value={projectStartDate}
                                    onChange={(e) => setProjectStartDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Data de Término Prevista</label>
                                <Input
                                    type="date"
                                    value={projectEndDate}
                                    onChange={(e) => setProjectEndDate(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Calendars */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                <Clock size={20} className="text-blue-600" />
                                Calendários e Horários
                            </h3>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsCalendarManagerOpen(true)}
                            >
                                Gerenciar
                            </Button>
                        </div>

                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-slate-700">Calendário Padrão</span>
                                <span className="text-sm text-blue-600 font-medium">{defaultCalendar?.name || "Padrão"}</span>
                            </div>
                            <div className="text-xs text-slate-500 mb-3">
                                {defaultCalendar ? (
                                    <>
                                        {defaultCalendar.workingDays.length} dias úteis • {defaultCalendar.hoursPerDay}h por dia
                                    </>
                                ) : (
                                    "Nenhum calendário configurado"
                                )}
                            </div>

                            <div
                                className="flex items-center justify-between p-3 bg-white rounded border border-slate-200 cursor-pointer hover:border-blue-300 transition-colors group"
                                onClick={() => setIsCalendarManagerOpen(true)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                                        <Calendar size={16} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-slate-700 group-hover:text-blue-700 transition-colors">Configurar Dias Úteis</div>
                                        <div className="text-xs text-slate-500">Definir feriados, exceções e horários</div>
                                    </div>
                                </div>
                                <ChevronRight size={16} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                            </div>
                        </div>
                    </div>

                    {/* Advanced Settings */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 lg:col-span-2">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <Settings size={20} className="text-blue-600" />
                            Configurações Avançadas
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div
                                className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all group"
                                onClick={() => setIsCustomFieldManagerOpen(true)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                                        <ListChecks size={20} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-slate-900 group-hover:text-purple-700 transition-colors">Campos Personalizados</div>
                                        <div className="text-xs text-slate-500">Gerenciar campos extras</div>
                                    </div>
                                </div>
                                <ChevronRight size={18} className="text-slate-400 group-hover:text-purple-500 transition-colors" />
                            </div>

                            <div
                                className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all group"
                                onClick={() => setIsBaselineManagerOpen(true)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                                        <Layers size={20} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-slate-900 group-hover:text-green-700 transition-colors">Linhas de Base</div>
                                        <div className="text-xs text-slate-500">Gerenciar versões do projeto</div>
                                    </div>
                                </div>
                                <ChevronRight size={18} className="text-slate-400 group-hover:text-green-500 transition-colors" />
                            </div>

                            <div
                                className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all group"
                                onClick={() => setIsScenarioManagerOpen(true)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                                        <GitBranch size={20} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-slate-900 group-hover:text-amber-700 transition-colors">Cenários (What-If)</div>
                                        <div className="text-xs text-slate-500">Simular mudanças</div>
                                    </div>
                                </div>
                                <ChevronRight size={18} className="text-slate-400 group-hover:text-amber-500 transition-colors" />
                            </div>
                        </div>

                        <VerificationManager />
                    </div>
                </div>
            </div>

            <CalendarManager
                isOpen={isCalendarManagerOpen}
                onClose={() => setIsCalendarManagerOpen(false)}
                calendars={getCalendars()}
                onSave={updateAllCalendars}
                defaultCalendarId={project.defaultCalendarId}
                onSetDefault={setDefaultCalendar}
            />

            <CustomFieldManager
                isOpen={isCustomFieldManagerOpen}
                onClose={() => setIsCustomFieldManagerOpen(false)}
            />

            <BaselineManager
                isOpen={isBaselineManagerOpen}
                onClose={() => setIsBaselineManagerOpen(false)}
            />

            <ScenarioManager
                isOpen={isScenarioManagerOpen}
                onClose={() => setIsScenarioManagerOpen(false)}
            />
        </div>
    );
};

export default SettingsView;
