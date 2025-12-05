import React, { useState, useEffect, useRef } from "react";
import { Network, ArrowRight, Calendar, Clock, CheckCircle, AlertCircle } from "lucide-react";
import type { ExtendedTask, TaskDependency } from "../types/types";
import { calculateCriticalPath } from "../utils/dateCalculations";

interface PertDiagramProps {
  tasks: ExtendedTask[];
  dependencies: TaskDependency[];
  onTaskClick?: (task: ExtendedTask) => void;
  showCriticalPath?: boolean;
}

interface NodePosition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

const PertDiagram: React.FC<PertDiagramProps> = ({
  tasks,
  dependencies,
  onTaskClick,
  showCriticalPath = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodePositions, setNodePositions] = useState<NodePosition[]>([]);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [criticalPath, setCriticalPath] = useState<string[]>([]);

  // Calculate critical path
  useEffect(() => {
    if (tasks.length > 0 && dependencies.length > 0) {
      const path = calculateCriticalPath(tasks, dependencies);
      setCriticalPath(path);
    }
  }, [tasks, dependencies]);

  // Calculate node positions (simple grid layout)
  useEffect(() => {
    if (!containerRef.current || tasks.length === 0) return;

    const containerWidth = containerRef.current.clientWidth;
    const nodeWidth = 180;
    const nodeHeight = 120;
    const horizontalSpacing = 60;
    const verticalSpacing = 80;

    const positions: NodePosition[] = [];

    // Group tasks by their start date for better visualization
    const tasksByDate = tasks.reduce((acc, task) => {
      const dateKey = task.start.toDateString();
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(task);
      return acc;
    }, {} as Record<string, ExtendedTask[]>);

    const dateGroups = Object.values(tasksByDate);

    let currentY = 40;
    dateGroups.forEach((group, groupIndex) => {
      const groupWidth = Math.min(group.length * (nodeWidth + horizontalSpacing), containerWidth - 40);
      const startX = (containerWidth - groupWidth) / 2;

      group.forEach((task, taskIndex) => {
        positions.push({
          id: task.id,
          x: startX + taskIndex * (nodeWidth + horizontalSpacing),
          y: currentY + groupIndex * (nodeHeight + verticalSpacing),
          width: nodeWidth,
          height: nodeHeight,
        });
      });
    });

    setNodePositions(positions);
  }, [tasks, containerRef.current?.clientWidth]);

  const getTaskColor = (task: ExtendedTask) => {
    if (criticalPath.includes(task.id) && showCriticalPath) {
      return "border-red-500 bg-red-50";
    }
    if (task.type === "milestone") {
      return "border-emerald-500 bg-emerald-50";
    }
    if (task.type === "project") {
      return "border-slate-500 bg-slate-50";
    }
    return "border-indigo-500 bg-indigo-50";
  };

  const getStatusIcon = (task: ExtendedTask) => {
    switch (task.status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case "in_progress":
        return <Clock className="w-4 h-4 text-amber-500" />;
      case "on_hold":
        return <AlertCircle className="w-4 h-4 text-slate-500" />;
      default:
        return <Calendar className="w-4 h-4 text-slate-400" />;
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  const calculateLinePath = (fromPos: NodePosition, toPos: NodePosition) => {
    const startX = fromPos.x + fromPos.width;
    const startY = fromPos.y + fromPos.height / 2;
    const endX = toPos.x;
    const endY = toPos.y + toPos.height / 2;

    // Create a curved path
    const midX = (startX + endX) / 2;
    return `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;
  };

  const getDependencyTypeLabel = (type: string) => {
    switch (type) {
      case "FS": return "TI";
      case "SS": return "II";
      case "FF": return "TT";
      case "SF": return "IT";
      default: return type;
    }
  };

  const handleTaskClick = (task: ExtendedTask) => {
    setSelectedTask(task.id);
    if (onTaskClick) {
      onTaskClick(task);
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-slate-400">
        <Network size={48} className="mb-4 opacity-50" />
        <h3 className="text-lg font-medium text-slate-600 mb-2">Diagrama de Rede (PERT)</h3>
        <p className="text-sm text-center max-w-md">
          Adicione tarefas e dependências para visualizar o diagrama de rede.
          O diagrama PERT mostra as relações entre tarefas e o caminho crítico.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3">
          <Network className="w-5 h-5 text-indigo-600" />
          <div>
            <h3 className="font-semibold text-slate-800">Diagrama de Rede (PERT)</h3>
            <p className="text-sm text-slate-500">
              {tasks.length} tarefas, {dependencies.length} dependências
              {showCriticalPath && criticalPath.length > 0 && `, ${criticalPath.length} tarefas críticas`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          {showCriticalPath && criticalPath.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span className="text-red-700 font-medium">Caminho Crítico</span>
            </div>
          )}
        </div>
      </div>

      {/* Diagram Container */}
      <div ref={containerRef} className="flex-1 relative overflow-auto bg-slate-50">
        <svg className="absolute inset-0 w-full h-full">
          {/* Draw dependency lines */}
          {dependencies.map((dep) => {
            const fromPos = nodePositions.find(p => p.id === dep.fromTaskId);
            const toPos = nodePositions.find(p => p.id === dep.toTaskId);

            if (!fromPos || !toPos) return null;

            const isCritical = showCriticalPath &&
              criticalPath.includes(dep.fromTaskId) &&
              criticalPath.includes(dep.toTaskId);

            const path = calculateLinePath(fromPos, toPos);

            return (
              <g key={dep.id}>
                <path
                  d={path}
                  fill="none"
                  stroke={isCritical ? "#ef4444" : "#94a3b8"}
                  strokeWidth={isCritical ? 2 : 1}
                  strokeDasharray={isCritical ? "none" : "5,5"}
                  className="transition-all"
                />
                {/* Arrow head */}
                <polygon
                  points="0,0 -6,-3 -6,3"
                  fill={isCritical ? "#ef4444" : "#94a3b8"}
                  transform={`translate(${toPos.x}, ${toPos.y + toPos.height / 2}) rotate(${
                    Math.atan2(toPos.y + toPos.height / 2 - (fromPos.y + fromPos.height / 2),
                    toPos.x - (fromPos.x + fromPos.width)) * 180 / Math.PI
                  })`}
                />
                {/* Dependency type label */}
                <text
                  x={(fromPos.x + fromPos.width + toPos.x) / 2}
                  y={(fromPos.y + fromPos.height / 2 + toPos.y + toPos.height / 2) / 2 - 10}
                  textAnchor="middle"
                  className="text-xs font-medium fill-slate-600"
                >
                  {getDependencyTypeLabel(dep.type)}
                  {dep.lag !== undefined && dep.lag !== 0 && (
                    <tspan dx="4" className="fill-slate-400">
                      {dep.lag > 0 ? `+${dep.lag}d` : `${dep.lag}d`}
                    </tspan>
                  )}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Task nodes */}
        {tasks.map((task) => {
          const position = nodePositions.find(p => p.id === task.id);
          if (!position) return null;

          const isCritical = showCriticalPath && criticalPath.includes(task.id);
          const isSelected = selectedTask === task.id;

          return (
            <div
              key={task.id}
              className={`absolute rounded-xl border-2 p-3 shadow-sm transition-all cursor-pointer hover:shadow-md hover:scale-105 ${
                getTaskColor(task)
              } ${isSelected ? "ring-2 ring-offset-2 ring-indigo-400" : ""}`}
              style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                width: `${position.width}px`,
                height: `${position.height}px`,
              }}
              onClick={() => handleTaskClick(task)}
            >
              <div className="flex flex-col h-full">
                {/* Task header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(task)}
                    <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                      {task.type === "milestone" ? "MARCO" : "TAREFA"}
                    </span>
                  </div>
                  {isCritical && showCriticalPath && (
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  )}
                </div>

                {/* Task name */}
                <h4 className="font-semibold text-slate-800 text-sm mb-2 line-clamp-2">
                  {task.name}
                </h4>

                {/* Task dates */}
                <div className="mt-auto space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Início:</span>
                    <span className="font-medium text-slate-700">
                      {formatDate(task.start)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Término:</span>
                    <span className="font-medium text-slate-700">
                      {formatDate(task.end)}
                    </span>
                  </div>
                  {task.progress > 0 && (
                    <div className="pt-1">
                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${task.progress}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-slate-500 text-right mt-0.5">
                        {task.progress}%
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="p-3 border-t border-slate-200 bg-white">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded border-2 border-indigo-500 bg-indigo-50"></div>
            <span className="text-slate-600">Tarefa Normal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded border-2 border-emerald-500 bg-emerald-50"></div>
            <span className="text-slate-600">Marco (Milestone)</span>
          </div>
          {showCriticalPath && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded border-2 border-red-500 bg-red-50"></div>
              <span className="text-slate-600">Tarefa Crítica</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <ArrowRight className="w-3 h-3 text-slate-400" />
            <span className="text-slate-600">Dependência</span>
          </div>
          <div className="flex items-center gap-2">
            <ArrowRight className="w-3 h-3 text-red-500" />
            <span className="text-slate-600">Dependência Crítica</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PertDiagram;