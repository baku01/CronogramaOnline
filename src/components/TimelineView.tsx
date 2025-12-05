import React from "react";
import { useMultiProject } from "../store/multiProjectStore";
import { format } from "date-fns";
import { Flag, CheckCircle } from "lucide-react";

const TimelineView: React.FC = () => {
    const { getTasks } = useMultiProject();
    const tasks = getTasks();

    // Filter important tasks for timeline (Milestones and Summaries)
    const timelineTasks = tasks.filter(
        t => t.type === 'milestone' || t.type === 'project' || t.priority === 'critical'
    ).sort((a, b) => a.start.getTime() - b.start.getTime());

    if (timelineTasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <p>Nenhum marco ou tarefa principal para exibir na Linha do Tempo.</p>
            </div>
        );
    }

    const minDate = timelineTasks.length > 0 ? new Date(timelineTasks[0].start) : new Date();
    const maxDate = timelineTasks.length > 0 ? new Date(timelineTasks[timelineTasks.length - 1].end) : new Date();

    // Add buffer
    minDate.setDate(minDate.getDate() - 5);
    maxDate.setDate(maxDate.getDate() + 5);

    const totalDuration = maxDate.getTime() - minDate.getTime();

    const getPosition = (date: Date) => {
        return ((date.getTime() - minDate.getTime()) / totalDuration) * 100;
    };

    return (
        <div className="h-full bg-white p-8 overflow-x-auto">
            <h2 className="text-xl font-bold text-slate-800 mb-8">Linha do Tempo do Projeto</h2>

            <div className="relative h-64 min-w-[800px]">
                {/* Time Axis Line */}
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-indigo-200 rounded-full" />

                {/* Tasks */}
                {timelineTasks.map((task, index) => {
                    const left = getPosition(new Date(task.start));
                    const isTop = index % 2 === 0; // Alternate top/bottom

                    return (
                        <div
                            key={task.id}
                            className="absolute flex flex-col items-center group"
                            style={{
                                left: `${left}%`,
                                top: isTop ? '20%' : '50%',
                                transform: 'translateX(-50%)'
                            }}
                        >
                            {/* Connector Line */}
                            <div className={`w-0.5 bg-indigo-300 absolute left-1/2 -translate-x-1/2 ${
                                isTop ? 'top-full h-12' : 'bottom-full h-12 mb-3' // Adjust spacing
                            }`} style={{
                                height: '30px',
                                top: isTop ? '100%' : 'auto',
                                bottom: isTop ? 'auto' : '100%'
                            }} />

                            {/* Node */}
                            <div className={`
                                z-10 w-4 h-4 rounded-full border-2
                                ${task.type === 'milestone' ? 'bg-emerald-500 border-white ring-2 ring-emerald-200' : 'bg-indigo-600 border-white ring-2 ring-indigo-200'}
                            `} />

                            {/* Label */}
                            <div className={`
                                absolute w-48 text-center p-2 rounded-lg bg-white shadow-md border border-slate-100
                                ${isTop ? 'bottom-full mb-4' : 'top-full mt-4'}
                            `}>
                                <div className="text-xs text-slate-500 font-mono mb-1">
                                    {format(new Date(task.start), 'dd/MM/yyyy')}
                                </div>
                                <div className="text-sm font-semibold text-slate-800 truncate" title={task.name}>
                                    {task.name}
                                </div>
                                <div className="flex items-center justify-center gap-1 mt-1">
                                    {task.type === 'milestone' && <Flag size={12} className="text-emerald-500" />}
                                    {task.status === 'completed' && <CheckCircle size={12} className="text-emerald-600" />}
                                    <span className="text-[10px] text-slate-400 capitalize">{task.type}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TimelineView;
