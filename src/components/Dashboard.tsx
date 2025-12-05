import React, { useMemo } from "react";
import { useMultiProject } from "../store/multiProjectStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/Card";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  CircleDashed,
  DollarSign,
  TrendingUp,
  Activity
} from "lucide-react";

const Dashboard: React.FC = () => {
  const { calculateProjectStats, activeProject: project } = useMultiProject();

  const stats = useMemo(() => calculateProjectStats(), [calculateProjectStats, project]);

  if (!project) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 p-1 overflow-y-auto h-full content-start">
      {/* Progress Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Progresso Total</CardTitle>
          <Activity className="h-4 w-4 text-slate-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{Math.round(stats.progressPercentage)}%</div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 mt-2">
            <div
              className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${stats.progressPercentage}%` }}
            ></div>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Baseado na duração das tarefas
          </p>
        </CardContent>
      </Card>

      {/* Total Cost Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Custo Total</CardTitle>
          <DollarSign className="h-4 w-4 text-slate-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.totalCost)}</div>
          <p className="text-xs text-slate-500 mt-1">
            Orçado: {formatCurrency(stats.budgetedCost)}
          </p>
          <div className={`text-xs mt-1 font-medium ${stats.costVariance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            Variação: {formatCurrency(stats.costVariance)}
          </div>
        </CardContent>
      </Card>

      {/* Critical Path Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Caminho Crítico</CardTitle>
          <TrendingUp className="h-4 w-4 text-slate-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.criticalPathLength} dias</div>
          <p className="text-xs text-slate-500 mt-1">
            Duração mínima do projeto
          </p>
        </CardContent>
      </Card>

      {/* Overdue Tasks Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tarefas Atrasadas</CardTitle>
          <AlertCircle className="h-4 w-4 text-rose-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-rose-600">{stats.overdueTasks}</div>
          <p className="text-xs text-slate-500 mt-1">
            Requer atenção imediata
          </p>
        </CardContent>
      </Card>

      {/* Task Status Breakdown - Spans 2 columns */}
      <Card className="col-span-1 md:col-span-2">
        <CardHeader>
          <CardTitle>Status das Tarefas</CardTitle>
          <CardDescription>Visão geral do andamento das {stats.totalTasks} tarefas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="flex items-center w-32 shrink-0 text-sm text-slate-600">
                <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" />
                Concluídas
              </div>
              <div className="flex-1 mx-2">
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${(stats.completedTasks / stats.totalTasks) * 100 || 0}%` }}
                  />
                </div>
              </div>
              <div className="w-12 text-right text-sm font-medium">{stats.completedTasks}</div>
            </div>

            <div className="flex items-center">
              <div className="flex items-center w-32 shrink-0 text-sm text-slate-600">
                <Clock className="mr-2 h-4 w-4 text-indigo-500" />
                Em Andamento
              </div>
              <div className="flex-1 mx-2">
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${(stats.inProgressTasks / stats.totalTasks) * 100 || 0}%` }}
                  />
                </div>
              </div>
              <div className="w-12 text-right text-sm font-medium">{stats.inProgressTasks}</div>
            </div>

            <div className="flex items-center">
              <div className="flex items-center w-32 shrink-0 text-sm text-slate-600">
                <CircleDashed className="mr-2 h-4 w-4 text-slate-400" />
                Não Iniciadas
              </div>
              <div className="flex-1 mx-2">
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-400 rounded-full"
                    style={{ width: `${(stats.notStartedTasks / stats.totalTasks) * 100 || 0}%` }}
                  />
                </div>
              </div>
              <div className="w-12 text-right text-sm font-medium">{stats.notStartedTasks}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Info - Spans 2 columns */}
      <Card className="col-span-1 md:col-span-2">
        <CardHeader>
          <CardTitle>Detalhes do Projeto</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4 text-sm">
            <div>
              <dt className="font-medium text-slate-500">Nome do Projeto</dt>
              <dd className="mt-1 text-slate-900 font-semibold">{project.name}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Data de Início</dt>
              <dd className="mt-1 text-slate-900">
                {project.startDate ? new Date(project.startDate).toLocaleDateString('pt-BR') : 'Não definida'}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="font-medium text-slate-500">Descrição</dt>
              <dd className="mt-1 text-slate-900">{project.description || "Sem descrição"}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Autor</dt>
              <dd className="mt-1 text-slate-900">{project.author || "Desconhecido"}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Versão</dt>
              <dd className="mt-1 text-slate-900">{project.version || "1.0"}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
