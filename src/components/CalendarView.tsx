import React, { useState, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, User, CheckCircle, AlertCircle } from "lucide-react";
import type { ExtendedTask } from "../types/types";
import { useMultiProject } from "../store/multiProjectStore";

interface CalendarViewProps {
  onTaskClick?: (task: ExtendedTask) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ onTaskClick }) => {
  const { getTasks } = useMultiProject();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<ExtendedTask[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    setTasks(getTasks());
  }, [getTasks]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Get day of week for first day (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfWeek = firstDay.getDay();

    return { firstDay, lastDay, daysInMonth, firstDayOfWeek };
  };

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      const taskStart = new Date(task.start);
      const taskEnd = new Date(task.end);

      // Check if date is within task range
      return date >= taskStart && date <= taskEnd;
    });
  };

  const getTasksStartingOnDate = (date: Date) => {
    return tasks.filter(task => {
      const taskStart = new Date(task.start);
      return taskStart.toDateString() === date.toDateString();
    });
  };

  const getTasksEndingOnDate = (date: Date) => {
    return tasks.filter(task => {
      const taskEnd = new Date(task.end);
      return taskEnd.toDateString() === date.toDateString();
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "numeric",
      month: "short"
    });
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric"
    }).toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "in_progress":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "on_hold":
        return "bg-slate-100 text-slate-700 border-slate-200";
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-blue-100 text-blue-700 border-blue-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-3 h-3" />;
      case "in_progress":
        return <Clock className="w-3 h-3" />;
      case "on_hold":
      case "cancelled":
        return <AlertCircle className="w-3 h-3" />;
      default:
        return <CalendarIcon className="w-3 h-3" />;
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const { daysInMonth, firstDayOfWeek } = getDaysInMonth(currentDate);
  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  // Create array of days for the calendar grid
  const days = [];
  const totalCells = 42; // 6 weeks * 7 days

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push(null);
  }

  // Add days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
    days.push(date);
  }

  // Add empty cells for remaining cells
  while (days.length < totalCells) {
    days.push(null);
  }

  const selectedDateTasks = selectedDate ? getTasksForDate(selectedDate) : [];

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-5 h-5 text-indigo-600" />
          <div>
            <h3 className="font-semibold text-slate-800">Calendário</h3>
            <p className="text-sm text-slate-500">
              Visualização mensal das tarefas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-800 transition-colors"
            title="Mês anterior"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg">
            <span className="font-semibold text-slate-800">
              {formatMonthYear(currentDate)}
            </span>
          </div>

          <button
            onClick={handleNextMonth}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-800 transition-colors"
            title="Próximo mês"
          >
            <ChevronRight size={20} />
          </button>

          <button
            onClick={handleToday}
            className="ml-2 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            Hoje
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Calendar Grid */}
        <div className="flex-1 overflow-auto custom-scrollbar">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
            {dayNames.map((day, index) => (
              <div
                key={day}
                className={`p-3 text-center text-sm font-semibold ${index === 0 || index === 6
                    ? "text-slate-500"
                    : "text-slate-700"
                  }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 auto-rows-fr min-h-[calc(100vh-200px)]">
            {days.map((date, index) => {
              const isToday = date && date.toDateString() === new Date().toDateString();
              const isSelected = date && selectedDate && date.toDateString() === selectedDate.toDateString();
              const isCurrentMonth = date && date.getMonth() === currentDate.getMonth();
              const dateTasks = date ? getTasksForDate(date) : [];
              const startingTasks = date ? getTasksStartingOnDate(date) : [];
              const endingTasks = date ? getTasksEndingOnDate(date) : [];

              return (
                <div
                  key={index}
                  className={`min-h-[120px] border border-slate-100 p-2 flex flex-col ${!isCurrentMonth ? "bg-slate-50/50" : "bg-white"
                    } ${isSelected
                      ? "bg-indigo-50 border-indigo-300"
                      : "hover:bg-slate-50"
                    }`}
                  onClick={() => date && setSelectedDate(date)}
                >
                  {/* Day number */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-sm font-medium ${isToday
                          ? "w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center"
                          : isCurrentMonth
                            ? "text-slate-700"
                            : "text-slate-400"
                        }`}
                    >
                      {date ? date.getDate() : ""}
                    </span>

                    {startingTasks.length > 0 && (
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    )}
                    {endingTasks.length > 0 && (
                      <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    )}
                  </div>

                  {/* Tasks for this day */}
                  <div className="flex-1 space-y-1 overflow-y-auto custom-scrollbar">
                    {dateTasks.slice(0, 3).map((task) => (
                      <div
                        key={task.id}
                        className={`p-1.5 rounded text-xs cursor-pointer transition-all hover:shadow-sm border ${getStatusColor(task.status)
                          }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onTaskClick) onTaskClick(task);
                        }}
                      >
                        <div className="flex items-center gap-1 mb-0.5">
                          {getStatusIcon(task.status)}
                          <span className="font-medium truncate">{task.name}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] opacity-75">
                          <span>
                            {task.start.toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                          <span>{task.progress}%</span>
                        </div>
                      </div>
                    ))}

                    {dateTasks.length > 3 && (
                      <div className="text-xs text-slate-500 text-center p-1">
                        +{dateTasks.length - 3} mais
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar - Selected Date Details */}
        {selectedDate && (
          <div className="w-80 border-l border-slate-200 bg-white overflow-y-auto custom-scrollbar">
            <div className="p-4 border-b border-slate-200">
              <h4 className="font-semibold text-slate-800 mb-2">
                {formatDate(selectedDate)}
              </h4>
              <p className="text-sm text-slate-500">
                {selectedDateTasks.length} tarefa{selectedDateTasks.length !== 1 ? 's' : ''} neste dia
              </p>
            </div>

            <div className="p-4 space-y-4">
              {/* Tasks starting today */}
              {getTasksStartingOnDate(selectedDate).length > 0 && (
                <div>
                  <h5 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    Iniciam Hoje
                  </h5>
                  <div className="space-y-2">
                    {getTasksStartingOnDate(selectedDate).map((task) => (
                      <div
                        key={task.id}
                        className="p-3 bg-emerald-50 rounded-lg border border-emerald-100 cursor-pointer hover:bg-emerald-100 transition-colors"
                        onClick={() => onTaskClick && onTaskClick(task)}
                      >
                        <div className="font-medium text-slate-800 text-sm mb-1">
                          {task.name}
                        </div>
                        <div className="text-xs text-slate-600">
                          Duração: {Math.ceil((task.end.getTime() - task.start.getTime()) / (1000 * 60 * 60 * 24))} dias
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tasks ending today */}
              {getTasksEndingOnDate(selectedDate).length > 0 && (
                <div>
                  <h5 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    Terminam Hoje
                  </h5>
                  <div className="space-y-2">
                    {getTasksEndingOnDate(selectedDate).map((task) => (
                      <div
                        key={task.id}
                        className="p-3 bg-amber-50 rounded-lg border border-amber-100 cursor-pointer hover:bg-amber-100 transition-colors"
                        onClick={() => onTaskClick && onTaskClick(task)}
                      >
                        <div className="font-medium text-slate-800 text-sm mb-1">
                          {task.name}
                        </div>
                        <div className="text-xs text-slate-600">
                          Progresso: {task.progress}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* All tasks for today */}
              <div>
                <h5 className="text-sm font-semibold text-slate-700 mb-2">
                  Todas as Tarefas
                </h5>
                <div className="space-y-2">
                  {selectedDateTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`p-3 rounded-lg border cursor-pointer hover:shadow-sm transition-all ${getStatusColor(task.status)
                        }`}
                      onClick={() => onTaskClick && onTaskClick(task)}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div className="font-medium text-slate-800 text-sm">
                          {task.name}
                        </div>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(task.status)}
                          <span className="text-xs font-medium">
                            {task.progress}%
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-slate-600">
                        {task.start.toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit"
                        })} - {task.end.toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </div>
                      {task.resources && task.resources.length > 0 && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
                          <User size={12} />
                          <span>{task.resources.length} recurso{task.resources.length !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className="pt-4 border-t border-slate-200">
                <h5 className="text-sm font-semibold text-slate-700 mb-2">
                  Legenda
                </h5>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className="text-slate-600">Início da tarefa</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    <span className="text-slate-600">Término da tarefa</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200"></div>
                    <span className="text-slate-600">Concluída</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-amber-100 border border-amber-200"></div>
                    <span className="text-slate-600">Em andamento</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-blue-100 border border-blue-200"></div>
                    <span className="text-slate-600">Não iniciada</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarView;