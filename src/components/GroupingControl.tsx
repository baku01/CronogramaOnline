import React from 'react';
import { Layers } from 'lucide-react';

export type GroupingOption = 'none' | 'status' | 'priority';

interface GroupingControlProps {
    grouping: GroupingOption;
    onGroupingChange: (grouping: GroupingOption) => void;
}

const GroupingControl: React.FC<GroupingControlProps> = ({ grouping, onGroupingChange }) => {
    return (
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1">
            <div className="px-2 text-slate-400">
                <Layers size={16} />
            </div>
            <select
                value={grouping}
                onChange={(e) => onGroupingChange(e.target.value as GroupingOption)}
                className="bg-transparent text-sm text-slate-600 font-medium focus:outline-none cursor-pointer pr-2"
            >
                <option value="none">Sem Agrupamento</option>
                <option value="status">Agrupar por Status</option>
                <option value="priority">Agrupar por Prioridade</option>
            </select>
        </div>
    );
};

export default GroupingControl;
