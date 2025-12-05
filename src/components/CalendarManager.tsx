import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Calendar, Plus, Trash2, Clock } from "lucide-react";
import { createDefaultCalendar } from "../utils/calendarCalculations";
import { DEFAULT_WORKING_DAYS } from "../utils/dateCalculations";
import type { ProjectCalendar, CalendarException } from "../types/types";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";

interface CalendarManagerProps {
    isOpen: boolean;
    onClose: () => void;
    calendars: ProjectCalendar[];
    onSave: (calendars: ProjectCalendar[]) => void;
    defaultCalendarId?: string;
    onSetDefault: (calendarId: string) => void;
}

const CalendarManager: React.FC<CalendarManagerProps> = ({
    isOpen,
    onClose,
    calendars,
    onSave,
    defaultCalendarId,
    onSetDefault,
}) => {
    const [currentCalendars, setCurrentCalendars] = useState<ProjectCalendar[]>([]);
    const [editingCalendar, setEditingCalendar] = useState<ProjectCalendar | null>(null);
    const [newException, setNewException] = useState<Omit<CalendarException, 'id'>>({
        name: "",
        startDate: new Date(),
        endDate: new Date(),
        isWorkingTime: true,
        description: "",
    });

    useEffect(() => {
        setCurrentCalendars(calendars.length > 0 ? [...calendars] : [createDefaultCalendar()]);
    }, [calendars]);

    const handleAddCalendar = () => {
        const newCal: ProjectCalendar = {
            id: `CAL-${Date.now()}`,
            name: "Novo Calendário",
            workingDays: DEFAULT_WORKING_DAYS,
            hoursPerDay: 8,
            workingHoursPerDay: [
                { start: "08:00", end: "12:00" },
                { start: "13:00", end: "17:00" },
            ],
            exceptions: [],
            isDefault: currentCalendars.length === 0,
        };
        setCurrentCalendars([...currentCalendars, newCal]);
        setEditingCalendar(newCal);
    };

    const handleUpdateCalendar = (updatedCalendar: ProjectCalendar) => {
        const updatedCalendars = currentCalendars.map((cal) =>
            cal.id === updatedCalendar.id ? updatedCalendar : cal
        );
        setCurrentCalendars(updatedCalendars);
        if (editingCalendar && editingCalendar.id === updatedCalendar.id) {
            setEditingCalendar(updatedCalendar);
        }
    };

    const handleDeleteCalendar = (calendarId: string) => {
        if (currentCalendars.length <= 1) {
            alert("Não é possível excluir o último calendário.");
            return;
        }
        const updatedCalendars = currentCalendars.filter((cal) => cal.id !== calendarId);
        setCurrentCalendars(updatedCalendars);
        if (editingCalendar && editingCalendar.id === calendarId) {
            setEditingCalendar(updatedCalendars[0] || null);
        }
    };

    const handleSave = () => {
        onSave(currentCalendars);
        onClose();
    };

    const handleAddException = () => {
        if (!editingCalendar) return;

        const exception: CalendarException = {
            ...newException,
            id: `EXC-${Date.now()}`,
        };

        const updatedCalendar = {
            ...editingCalendar,
            exceptions: [...editingCalendar.exceptions, exception],
        };

        handleUpdateCalendar(updatedCalendar);
        setNewException({
            name: "",
            startDate: new Date(),
            endDate: new Date(),
            isWorkingTime: true,
            description: "",
        });
    };

    const handleDeleteException = (exceptionId: string) => {
        if (!editingCalendar) return;

        const updatedCalendar = {
            ...editingCalendar,
            exceptions: editingCalendar.exceptions.filter((ex) => ex.id !== exceptionId),
        };

        handleUpdateCalendar(updatedCalendar);
    };

    const handleWorkingDayToggle = (day: number, calendar: ProjectCalendar) => {
        const updatedCalendar = {
            ...calendar,
            workingDays: calendar.workingDays.includes(day)
                ? calendar.workingDays.filter((d) => d !== day)
                : [...calendar.workingDays, day].sort((a, b) => a - b),
        };
        handleUpdateCalendar(updatedCalendar);
    };

    const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-100">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white z-10">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Calendar className="text-indigo-600" size={24} />
                            Gestão de Calendários
                        </h2>
                        <p className="text-sm text-slate-500 mt-0.5">
                            Configure calendários de projeto com dias úteis, horários e exceções
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600"
                    >
                        <X size={20} />
                    </Button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Calendar List */}
                    <div className="w-1/3 border-r border-slate-200 overflow-y-auto custom-scrollbar bg-slate-50/50">
                        <div className="p-4">
                            <Button
                                onClick={handleAddCalendar}
                                variant="primary"
                                className="w-full"
                                leftIcon={<Plus size={18} />}
                            >
                                Adicionar Calendário
                            </Button>
                        </div>
                        <div className="divide-y divide-slate-200 border-t border-slate-200">
                            {currentCalendars.map((calendar) => (
                                <div
                                    key={calendar.id}
                                    className={`p-4 cursor-pointer transition-all ${
                                        editingCalendar?.id === calendar.id
                                            ? "bg-white border-l-4 border-indigo-500 shadow-sm"
                                            : "hover:bg-white border-l-4 border-transparent"
                                    }`}
                                    onClick={() => setEditingCalendar(calendar)}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className={`font-medium ${editingCalendar?.id === calendar.id ? "text-indigo-700" : "text-slate-700"}`}>
                                            {calendar.name}
                                        </h3>
                                        <div className="flex items-center gap-1">
                                            {calendar.isDefault && (
                                                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 rounded-full">
                                                    Padrão
                                                </span>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-slate-400 hover:text-rose-500"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteCalendar(calendar.id);
                                                }}
                                            >
                                                <Trash2 size={14} />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-slate-500">
                                        <span>{calendar.workingDays.length} dias úteis</span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onSetDefault(calendar.id);
                                            }}
                                            className={`hover:underline ${defaultCalendarId === calendar.id ? "text-indigo-600 font-medium" : "text-slate-400 hover:text-indigo-600"}`}
                                        >
                                            {defaultCalendarId === calendar.id ? "Calendário Padrão" : "Definir como Padrão"}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Calendar Detail */}
                    <div className="w-2/3 overflow-y-auto custom-scrollbar bg-white">
                        {editingCalendar ? (
                            <div className="p-6 space-y-8">
                                {/* Basic Info */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                                        Configurações Gerais
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2 sm:col-span-1">
                                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                                Nome do Calendário
                                            </label>
                                            <Input
                                                type="text"
                                                value={editingCalendar.name}
                                                onChange={(e) =>
                                                    handleUpdateCalendar({
                                                        ...editingCalendar,
                                                        name: e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                        <div className="col-span-2 sm:col-span-1">
                                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                                Horas por Dia
                                            </label>
                                            <Input
                                                type="number"
                                                min="1"
                                                max="24"
                                                value={editingCalendar.hoursPerDay}
                                                onChange={(e) =>
                                                    handleUpdateCalendar({
                                                        ...editingCalendar,
                                                        hoursPerDay: parseInt(e.target.value) || 8,
                                                    })
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Working Days */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                                        Dias Úteis
                                    </h3>
                                    <div className="flex gap-2 flex-wrap">
                                        {dayNames.map((day, index) => (
                                            <button
                                                key={index}
                                                onClick={() => handleWorkingDayToggle(index, editingCalendar)}
                                                className={`
                                                    w-10 h-10 rounded-lg text-sm font-medium transition-all flex items-center justify-center
                                                    ${editingCalendar.workingDays.includes(index)
                                                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                                                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                                    }
                                                `}
                                            >
                                                {day}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Working Hours */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                                        Horários de Trabalho
                                    </h3>
                                    <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        {editingCalendar.workingHoursPerDay.map((hour, index) => (
                                            <div key={index} className="flex items-center gap-3">
                                                <Clock size={16} className="text-slate-400" />
                                                <Input
                                                    type="time"
                                                    value={hour.start}
                                                    onChange={(e) => {
                                                        const updatedHours = [...editingCalendar.workingHoursPerDay];
                                                        updatedHours[index].start = e.target.value;
                                                        handleUpdateCalendar({
                                                            ...editingCalendar,
                                                            workingHoursPerDay: updatedHours,
                                                        });
                                                    }}
                                                    className="w-32"
                                                />
                                                <span className="text-slate-400 font-medium">até</span>
                                                <Input
                                                    type="time"
                                                    value={hour.end}
                                                    onChange={(e) => {
                                                        const updatedHours = [...editingCalendar.workingHoursPerDay];
                                                        updatedHours[index].end = e.target.value;
                                                        handleUpdateCalendar({
                                                            ...editingCalendar,
                                                            workingHoursPerDay: updatedHours,
                                                        });
                                                    }}
                                                    className="w-32"
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-slate-400 hover:text-rose-500"
                                                    onClick={() => {
                                                        const updatedHours = editingCalendar.workingHoursPerDay.filter(
                                                            (_, i) => i !== index
                                                        );
                                                        handleUpdateCalendar({
                                                            ...editingCalendar,
                                                            workingHoursPerDay: updatedHours,
                                                        });
                                                    }}
                                                >
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
                                        ))}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                const newHour = { start: "08:00", end: "12:00" };
                                                handleUpdateCalendar({
                                                    ...editingCalendar,
                                                    workingHoursPerDay: [...editingCalendar.workingHoursPerDay, newHour],
                                                });
                                            }}
                                            className="w-full"
                                        >
                                            <Plus size={14} className="mr-2" />
                                            Adicionar Horário
                                        </Button>
                                    </div>
                                </div>

                                {/* Exceptions */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                                        Exceções e Feriados
                                    </h3>
                                    <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="col-span-2">
                                                <Input
                                                    placeholder="Nome da exceção (ex: Feriado Nacional)"
                                                    value={newException.name}
                                                    onChange={(e) => setNewException({ ...newException, name: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-slate-500 mb-1">Início</label>
                                                <Input
                                                    type="date"
                                                    value={newException.startDate.toISOString().split('T')[0]}
                                                    onChange={(e) => setNewException({ ...newException, startDate: new Date(e.target.value) })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-slate-500 mb-1">Fim</label>
                                                <Input
                                                    type="date"
                                                    value={newException.endDate.toISOString().split('T')[0]}
                                                    onChange={(e) => setNewException({ ...newException, endDate: new Date(e.target.value) })}
                                                />
                                            </div>
                                            <div className="col-span-2 flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id="isWorkingTime"
                                                    checked={newException.isWorkingTime}
                                                    onChange={(e) => setNewException({ ...newException, isWorkingTime: e.target.checked })}
                                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <label htmlFor="isWorkingTime" className="text-sm text-slate-700">
                                                    É dia de trabalho? (Ex: Sábado letivo)
                                                </label>
                                            </div>
                                            <div className="col-span-2">
                                                <Button onClick={handleAddException} disabled={!newException.name} size="sm" className="w-full">
                                                    Adicionar Exceção
                                                </Button>
                                            </div>
                                        </div>

                                        {editingCalendar.exceptions.length > 0 && (
                                            <div className="mt-4 space-y-2">
                                                {editingCalendar.exceptions.map((ex) => (
                                                    <div key={ex.id} className="flex items-center justify-between bg-white p-3 rounded border border-slate-200 text-sm">
                                                        <div>
                                                            <div className="font-medium text-slate-700">{ex.name}</div>
                                                            <div className="text-xs text-slate-500">
                                                                {new Date(ex.startDate).toLocaleDateString()} - {new Date(ex.endDate).toLocaleDateString()}
                                                            </div>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-slate-400 hover:text-rose-500"
                                                            onClick={() => handleDeleteException(ex.id)}
                                                        >
                                                            <Trash2 size={14} />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                <Calendar size={48} className="mb-4 opacity-20" />
                                <p>Selecione um calendário para editar</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <Button variant="ghost" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button variant="primary" onClick={handleSave}>
                        Salvar Alterações
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default CalendarManager;
