import React, { useState } from 'react';
import { calculateForwardPass } from '../utils/dateCalculations';
import type { ExtendedTask } from '../types/types';
import { TaskPriority, TaskStatus } from '../types/types';
import { addBusinessDays } from 'date-fns';

export const VerificationManager: React.FC = () => {
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (message: string) => {
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message} `]);
    };

    const clearLogs = () => setLogs([]);

    const verifyCalendarLogic = () => {
        addLog("--- Iniciando Verificação de Calendário ---");
        try {
            const startDate = new Date(2023, 0, 1); // Sunday
            const resultDate = addBusinessDays(startDate, 5);
            addLog(`Teste Básico: ${startDate.toLocaleDateString()} + 5 dias úteis = ${resultDate.toLocaleDateString()} `);

            addLog("Verificação manual recomendada: Crie uma tarefa de 5 dias começando numa sexta-feira. Ela deve terminar na quinta-feira seguinte (pulando Sáb/Dom).");
        } catch (e) {
            addLog(`Erro: ${e} `);
        }
    };

    const verifyConstraints = () => {
        addLog("--- Iniciando Verificação de Restrições ---");
        // Simulate a task with MSO constraint
        const task: ExtendedTask = {
            id: 'test-1',
            name: 'Test Task',
            start: new Date(2023, 0, 1),
            end: new Date(2023, 0, 2),
            type: 'task',
            progress: 0,
            status: TaskStatus.NOT_STARTED,
            priority: TaskPriority.MEDIUM,
            constraintType: 'MSO',
            constraintDate: new Date(2023, 0, 10),
            duration: 2,
            dependencies: []
        };

        const tasks = [task];
        // calculateForwardPass(tasks, dependencies, workingDays)
        const calculated = calculateForwardPass(tasks, []);

        const result = calculated.get(task.id);

        if (result && result.earlyStart.getTime() === new Date(2023, 0, 10).getTime()) {
            addLog("SUCESSO: Restrição MSO respeitada. Tarefa movida para 10/Jan.");
        } else {
            addLog(`FALHA: Restrição MSO ignorada.Data de início: ${result?.earlyStart.toLocaleDateString()} `);
        }
    };

    const verifyLeveling = () => {
        addLog("--- Verificação de Nivelamento ---");
        addLog("Esta verificação requer interação com o estado global e é melhor testada manualmente na interface.");
        addLog("Passos: 1. Crie duas tarefas para o mesmo recurso no mesmo período. 2. Clique em 'Nivelar'. 3. Verifique se uma tarefa foi movida.");
    };

    return (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-4">Diagnóstico e Verificação</h3>

            <div className="flex gap-2 mb-4">
                <button onClick={verifyCalendarLogic} className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm hover:bg-slate-50">
                    Verificar Calendário
                </button>
                <button onClick={verifyConstraints} className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm hover:bg-slate-50">
                    Verificar Restrições
                </button>
                <button onClick={verifyLeveling} className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm hover:bg-slate-50">
                    Verificar Nivelamento
                </button>
                <button onClick={clearLogs} className="px-3 py-1.5 text-slate-500 hover:text-slate-700 text-sm ml-auto">
                    Limpar
                </button>
            </div>

            <div className="bg-slate-900 text-slate-300 p-3 rounded-lg font-mono text-xs h-40 overflow-y-auto">
                {logs.length === 0 ? (
                    <span className="opacity-50">Aguardando execução...</span>
                ) : (
                    logs.map((log, i) => <div key={i}>{log}</div>)
                )}
            </div>
        </div>
    );
};
