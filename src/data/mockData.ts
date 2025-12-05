import {
  TaskStatus,
  TaskPriority,
  DependencyType,
  ResourceType,
} from '../types/types';
import type {
  Project,
  ExtendedTask,
  TaskDependency,
  Resource,
  ProjectCalendar,
  CustomField,
  TaskBaseline,
} from '../types/types';

const currentDate = new Date();
const currentYear = currentDate.getFullYear();
const currentMonth = currentDate.getMonth();

// Resources
export const mockResources: Resource[] = [
  {
    id: 'RES-001',
    name: 'João Silva',
    type: ResourceType.PERSON,
    costPerHour: 150,
    availability: 100,
    email: 'joao.silva@empresa.com',
  },
  {
    id: 'RES-002',
    name: 'Maria Santos',
    type: ResourceType.PERSON,
    costPerHour: 180,
    availability: 80,
    email: 'maria.santos@empresa.com',
  },
  {
    id: 'RES-003',
    name: 'Pedro Costa',
    type: ResourceType.PERSON,
    costPerHour: 120,
    availability: 100,
    email: 'pedro.costa@empresa.com',
  },
  {
    id: 'RES-004',
    name: 'Ana Oliveira',
    type: ResourceType.PERSON,
    costPerHour: 200,
    availability: 60,
    email: 'ana.oliveira@empresa.com',
  },
];

// Tasks
export const mockTasks: ExtendedTask[] = [
  // Planejamento do Projeto
  {
    start: new Date(currentYear, currentMonth, 1),
    end: new Date(currentYear, currentMonth, 15),
    name: 'Planejamento do Projeto',
    id: 'ProjectPlanning',
    progress: 100,
    type: 'project',
    hideChildren: false,
    displayOrder: 1,
    status: TaskStatus.COMPLETED,
    priority: TaskPriority.HIGH,
    description: 'Fase de planejamento inicial do projeto',
  },
  {
    start: new Date(currentYear, currentMonth, 1),
    end: new Date(currentYear, currentMonth, 2),
    name: 'Definição de Escopo',
    id: 'Scope',
    progress: 100,
    type: 'task',
    project: 'ProjectPlanning',
    displayOrder: 2,
    status: TaskStatus.COMPLETED,
    priority: TaskPriority.HIGH,
    description: 'Definir escopo completo do projeto',
    duration: 2,
    effort: 16,
    cost: 2400,
    budgetedCost: 2400,
    resources: [{ resourceId: 'RES-001', allocation: 100 }],
  },
  {
    start: new Date(currentYear, currentMonth, 3),
    end: new Date(currentYear, currentMonth, 5),
    name: 'Levantamento de Requisitos',
    id: 'Requirements',
    progress: 100,
    dependencies: ['Scope'],
    type: 'task',
    project: 'ProjectPlanning',
    displayOrder: 3,
    status: TaskStatus.COMPLETED,
    priority: TaskPriority.HIGH,
    description: 'Levantar todos os requisitos funcionais e não-funcionais',
    duration: 3,
    effort: 24,
    cost: 4320,
    budgetedCost: 4500,
    resources: [
      { resourceId: 'RES-001', allocation: 50 },
      { resourceId: 'RES-002', allocation: 50 },
    ],
  },
  {
    start: new Date(currentYear, currentMonth, 6),
    end: new Date(currentYear, currentMonth, 10),
    name: 'Análise de Riscos',
    id: 'RiskAnalysis',
    progress: 100,
    dependencies: ['Requirements'],
    type: 'task',
    project: 'ProjectPlanning',
    displayOrder: 4,
    status: TaskStatus.COMPLETED,
    priority: TaskPriority.MEDIUM,
    description: 'Identificar e analisar riscos do projeto',
    duration: 5,
    effort: 40,
    cost: 6000,
    budgetedCost: 6000,
    resources: [{ resourceId: 'RES-003', allocation: 100 }],
  },
  {
    start: new Date(currentYear, currentMonth, 15),
    end: new Date(currentYear, currentMonth, 15),
    name: 'Aprovação do Plano',
    id: 'PlanApproval',
    progress: 100,
    dependencies: ['RiskAnalysis'],
    type: 'milestone',
    project: 'ProjectPlanning',
    displayOrder: 5,
    status: TaskStatus.COMPLETED,
    priority: TaskPriority.CRITICAL,
    description: 'Marco de aprovação do plano do projeto',
  },

  // Desenvolvimento
  {
    start: new Date(currentYear, currentMonth, 16),
    end: new Date(currentYear, currentMonth + 1, 5),
    name: 'Desenvolvimento',
    id: 'Development',
    progress: 45,
    type: 'project',
    hideChildren: false,
    displayOrder: 6,
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.HIGH,
    description: 'Fase de desenvolvimento do sistema',
  },
  {
    start: new Date(currentYear, currentMonth, 16),
    end: new Date(currentYear, currentMonth, 20),
    name: 'Configuração do Ambiente',
    id: 'EnvSetup',
    progress: 100,
    dependencies: ['PlanApproval'],
    type: 'task',
    project: 'Development',
    displayOrder: 7,
    status: TaskStatus.COMPLETED,
    priority: TaskPriority.HIGH,
    description: 'Configurar ambientes de desenvolvimento, teste e produção',
    duration: 5,
    effort: 40,
    cost: 4800,
    budgetedCost: 5000,
    resources: [{ resourceId: 'RES-003', allocation: 100 }],
    isCritical: true,
  },
  {
    start: new Date(currentYear, currentMonth, 21),
    end: new Date(currentYear, currentMonth, 28),
    name: 'Implementação Backend',
    id: 'Backend',
    progress: 60,
    dependencies: ['EnvSetup'],
    type: 'task',
    project: 'Development',
    displayOrder: 8,
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.HIGH,
    description: 'Desenvolver APIs e lógica de negócio do backend',
    duration: 8,
    effort: 64,
    cost: 9600,
    budgetedCost: 10000,
    resources: [
      { resourceId: 'RES-001', allocation: 100 },
      { resourceId: 'RES-003', allocation: 50 },
    ],
    isCritical: true,
  },
  {
    start: new Date(currentYear, currentMonth, 23),
    end: new Date(currentYear, currentMonth + 1, 2),
    name: 'Implementação Frontend',
    id: 'Frontend',
    progress: 40,
    dependencies: ['EnvSetup'],
    type: 'task',
    project: 'Development',
    displayOrder: 9,
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.HIGH,
    description: 'Desenvolver interfaces de usuário e componentes',
    duration: 8,
    effort: 64,
    cost: 11520,
    budgetedCost: 12000,
    resources: [
      { resourceId: 'RES-002', allocation: 80 },
      { resourceId: 'RES-004', allocation: 60 },
    ],
  },
  {
    start: new Date(currentYear, currentMonth + 1, 3),
    end: new Date(currentYear, currentMonth + 1, 5),
    name: 'Integração',
    id: 'Integration',
    progress: 0,
    dependencies: ['Backend', 'Frontend'],
    type: 'task',
    project: 'Development',
    displayOrder: 10,
    status: TaskStatus.NOT_STARTED,
    priority: TaskPriority.CRITICAL,
    description: 'Integrar frontend com backend e testar fluxos completos',
    duration: 3,
    effort: 24,
    cost: 0,
    budgetedCost: 4500,
    resources: [
      { resourceId: 'RES-001', allocation: 50 },
      { resourceId: 'RES-002', allocation: 50 },
    ],
    isCritical: true,
  },

  // Testes
  {
    start: new Date(currentYear, currentMonth + 1, 6),
    end: new Date(currentYear, currentMonth + 1, 15),
    name: 'Testes e QA',
    id: 'Testing',
    progress: 0,
    type: 'project',
    hideChildren: false,
    displayOrder: 11,
    status: TaskStatus.NOT_STARTED,
    priority: TaskPriority.HIGH,
    description: 'Fase de testes e garantia de qualidade',
  },
  {
    start: new Date(currentYear, currentMonth + 1, 6),
    end: new Date(currentYear, currentMonth + 1, 10),
    name: 'Testes Unitários',
    id: 'UnitTests',
    progress: 0,
    dependencies: ['Integration'],
    type: 'task',
    project: 'Testing',
    displayOrder: 12,
    status: TaskStatus.NOT_STARTED,
    priority: TaskPriority.MEDIUM,
    description: 'Criar e executar testes unitários',
    duration: 5,
    effort: 40,
    cost: 0,
    budgetedCost: 4800,
    resources: [{ resourceId: 'RES-003', allocation: 100 }],
  },
  {
    start: new Date(currentYear, currentMonth + 1, 11),
    end: new Date(currentYear, currentMonth + 1, 15),
    name: 'Testes de Integração',
    id: 'IntegrationTests',
    progress: 0,
    dependencies: ['UnitTests'],
    type: 'task',
    project: 'Testing',
    displayOrder: 13,
    status: TaskStatus.NOT_STARTED,
    priority: TaskPriority.HIGH,
    description: 'Executar testes de integração end-to-end',
    duration: 5,
    effort: 40,
    cost: 0,
    budgetedCost: 6000,
    resources: [
      { resourceId: 'RES-002', allocation: 50 },
      { resourceId: 'RES-004', allocation: 60 },
    ],
    isCritical: true,
  },
  {
    start: new Date(currentYear, currentMonth + 1, 15),
    end: new Date(currentYear, currentMonth + 1, 15),
    name: 'Release v1.0',
    id: 'Release',
    progress: 0,
    dependencies: ['IntegrationTests'],
    type: 'milestone',
    project: 'Testing',
    displayOrder: 14,
    status: TaskStatus.NOT_STARTED,
    priority: TaskPriority.CRITICAL,
    description: 'Marco de lançamento da versão 1.0',
    isCritical: true,
  },
];

// Dependencies
export const mockDependencies: TaskDependency[] = [
  {
    id: 'DEP-001',
    fromTaskId: 'Scope',
    toTaskId: 'Requirements',
    type: DependencyType.FS,
  },
  {
    id: 'DEP-002',
    fromTaskId: 'Requirements',
    toTaskId: 'RiskAnalysis',
    type: DependencyType.FS,
  },
  {
    id: 'DEP-003',
    fromTaskId: 'RiskAnalysis',
    toTaskId: 'PlanApproval',
    type: DependencyType.FS,
  },
  {
    id: 'DEP-004',
    fromTaskId: 'PlanApproval',
    toTaskId: 'EnvSetup',
    type: DependencyType.FS,
    lag: 1,
  },
  {
    id: 'DEP-005',
    fromTaskId: 'EnvSetup',
    toTaskId: 'Backend',
    type: DependencyType.FS,
  },
  {
    id: 'DEP-006',
    fromTaskId: 'EnvSetup',
    toTaskId: 'Frontend',
    type: DependencyType.FS,
    lag: 2,
  },
  {
    id: 'DEP-007',
    fromTaskId: 'Backend',
    toTaskId: 'Integration',
    type: DependencyType.FS,
  },
  {
    id: 'DEP-008',
    fromTaskId: 'Frontend',
    toTaskId: 'Integration',
    type: DependencyType.FS,
  },
  {
    id: 'DEP-009',
    fromTaskId: 'Integration',
    toTaskId: 'UnitTests',
    type: DependencyType.FS,
  },
  {
    id: 'DEP-010',
    fromTaskId: 'UnitTests',
    toTaskId: 'IntegrationTests',
    type: DependencyType.FS,
  },
  {
    id: 'DEP-011',
    fromTaskId: 'IntegrationTests',
    toTaskId: 'Release',
    type: DependencyType.FS,
  },
];

// Default Calendar
export const mockCalendar: ProjectCalendar = {
  id: 'default',
  name: 'Calendário Padrão',
  workingDays: [1, 2, 3, 4, 5], // Monday to Friday
  hoursPerDay: 8,
  workingHoursPerDay: [
    { start: '08:00', end: '12:00' },
    { start: '13:00', end: '17:00' }
  ],
  exceptions: [
    {
      id: 'EXC-001',
      name: 'Feriado de Natal',
      startDate: new Date(currentYear, 11, 25), // December 25
      endDate: new Date(currentYear, 11, 25),
      isWorkingTime: false,
      description: 'Feriado Nacional'
    },
    {
      id: 'EXC-002',
      name: 'Ano Novo',
      startDate: new Date(currentYear + 1, 0, 1), // January 1
      endDate: new Date(currentYear + 1, 0, 1),
      isWorkingTime: false,
      description: 'Feriado Nacional'
    }
  ],
  isDefault: true
};

// Custom Fields for the project
export const mockCustomFields: CustomField[] = [
  {
    id: 'CF-001',
    name: 'Prioridade do Cliente',
    type: 'dropdown',
    description: 'Nível de prioridade definido pelo cliente',
    lookupTable: [
      { value: 'alta', label: 'Alta' },
      { value: 'media', label: 'Média' },
      { value: 'baixa', label: 'Baixa' }
    ],
    category: 'task',
    isRequired: false,
    isVisible: true,
    displayOrder: 1
  },
  {
    id: 'CF-002',
    name: 'Data de Revisão',
    type: 'date',
    description: 'Próxima data de revisão da tarefa',
    category: 'task',
    isRequired: false,
    isVisible: true,
    displayOrder: 2
  },
  {
    id: 'CF-003',
    name: 'Orçamento Aprovado',
    type: 'cost',
    description: 'Valor aprovado para execução da tarefa',
    category: 'task',
    isRequired: false,
    isVisible: true,
    displayOrder: 3
  }
];

// Baseline for the project
export const mockBaseline: TaskBaseline = {
  id: 'BASELINE-INITIAL',
  name: 'Linha de Base Inicial',
  description: 'Linha de base inicial do projeto',
  savedDate: new Date(currentYear, currentMonth - 1, 15),
  tasks: mockTasks.map(task => ({
    taskId: task.id,
    start: new Date(task.start),
    end: new Date(task.end),
    duration: task.duration,
    work: task.effort,
    cost: task.cost,
    progress: task.progress
  })),
  projectStartDate: new Date(currentYear, currentMonth, 1),
  projectEndDate: new Date(currentYear, currentMonth + 1, 15),
  totalCost: 55200
};

// Complete Project
export const mockProject: Project = {
  id: 'PROJ-001',
  name: 'Sistema de Gestão Empresarial',
  description: 'Desenvolvimento de sistema completo de gestão empresarial com módulos de vendas, estoque e financeiro',
  startDate: new Date(currentYear, currentMonth, 1),
  endDate: new Date(currentYear, currentMonth + 1, 15),
  status: TaskStatus.IN_PROGRESS,
  progress: 48,
  tasks: mockTasks.map((task, index) => {
    // Add custom fields to some tasks
    const customFields: { [key: string]: any } = {};
    if (index === 0) { // First task gets customer priority
      customFields['CF-001'] = 'alta';
      customFields['CF-002'] = new Date(currentYear, currentMonth, 10);
    } else if (index === 1) { // Second task gets budget
      customFields['CF-003'] = 5000;
    }

    return {
      ...task,
      customFields
    };
  }),
  dependencies: mockDependencies,
  resources: mockResources,
  calendars: [mockCalendar],
  defaultCalendarId: mockCalendar.id,
  baselines: [mockBaseline],
  customFields: mockCustomFields,
  totalCost: 38640,
  budgetedCost: 55200,
  criticalPath: ['EnvSetup', 'Backend', 'Integration', 'IntegrationTests', 'Release'],
  workingDays: [1, 2, 3, 4, 5], // Monday to Friday
  hoursPerDay: 8,
  createdAt: new Date(currentYear, currentMonth - 1, 15),
  updatedAt: new Date(),
  createdBy: 'Admin',
};
