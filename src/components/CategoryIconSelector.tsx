import React, { useState } from 'react';
import {
  Code2,
  Binary, 
  Globe, 
  Database, 
  Bot, 
  BrainCircuit, 
  ShieldCheck, 
  Network, 
  LineChart, 
  Sigma, 
  GitBranch, 
  Boxes, 
  BookOpen, 
  Cloud, 
  Cpu,
  Terminal,
  Layers,
  Lock,
  Atom,
  Flame,
  FolderTree,
  BookMarked,
  Bookmark,
  Award,
  Zap,
  Laptop,
  Server,
  HardDrive,
  Smartphone,
  Sparkles,
  Compass,
  FileText,
  Lightbulb,
  GraduationCap,
  Workflow,
  Search
} from 'lucide-react';

export interface CategoryIconOption {
  id: string;
  name: string;
  category: string;
  component: React.ComponentType<{ className?: string }>;
}

export const CATEGORY_ICON_OPTIONS: CategoryIconOption[] = [
  // Programming & Dev
  { id: 'Code2', name: 'Code / Programming', category: 'Development', component: Code2 },
  { id: 'Terminal', name: 'Terminal / CLI', category: 'Development', component: Terminal },
  { id: 'GitBranch', name: 'Git / Version Control', category: 'Development', component: GitBranch },
  { id: 'Binary', name: 'Binary / Low Level', category: 'Development', component: Binary },
  { id: 'Boxes', name: 'Architecture / Packages', category: 'Development', component: Boxes },
  { id: 'Workflow', name: 'Workflow / Pipelines', category: 'Development', component: Workflow },

  // Web & Cloud & Infrastructure
  { id: 'Globe', name: 'Web / Internet', category: 'Cloud & Web', component: Globe },
  { id: 'Cloud', name: 'Cloud Computing', category: 'Cloud & Web', component: Cloud },
  { id: 'Server', name: 'Backend / Server', category: 'Cloud & Web', component: Server },
  { id: 'Network', name: 'Networking / TCP', category: 'Cloud & Web', component: Network },
  { id: 'HardDrive', name: 'Storage / Systems', category: 'Cloud & Web', component: HardDrive },
  { id: 'Cpu', name: 'Processor / OS', category: 'Cloud & Web', component: Cpu },
  { id: 'Laptop', name: 'Computing / Hardware', category: 'Cloud & Web', component: Laptop },
  { id: 'Smartphone', name: 'Mobile Development', category: 'Cloud & Web', component: Smartphone },

  // AI & Data Science
  { id: 'Bot', name: 'AI / Robotics', category: 'AI & Data', component: Bot },
  { id: 'BrainCircuit', name: 'Machine Learning', category: 'AI & Data', component: BrainCircuit },
  { id: 'Sparkles', name: 'Generative AI', category: 'AI & Data', component: Sparkles },
  { id: 'Database', name: 'Databases / SQL', category: 'AI & Data', component: Database },
  { id: 'LineChart', name: 'Analytics / Charts', category: 'AI & Data', component: LineChart },
  { id: 'Sigma', name: 'Mathematics / Stats', category: 'AI & Data', component: Sigma },
  { id: 'Atom', name: 'Quantum / Science', category: 'AI & Data', component: Atom },

  // Security & Systems
  { id: 'ShieldCheck', name: 'Cybersecurity / Defense', category: 'Security', component: ShieldCheck },
  { id: 'Lock', name: 'Cryptography / Auth', category: 'Security', component: Lock },

  // Academic & Library
  { id: 'BookOpen', name: 'Open Book', category: 'Academic', component: BookOpen },
  { id: 'BookMarked', name: 'Curated Collection', category: 'Academic', component: BookMarked },
  { id: 'Bookmark', name: 'Bookmark', category: 'Academic', component: Bookmark },
  { id: 'GraduationCap', name: 'Academics / Degree', category: 'Academic', component: GraduationCap },
  { id: 'Award', name: 'Excellence / Honors', category: 'Academic', component: Award },
  { id: 'FolderTree', name: 'Taxonomy / Directory', category: 'Academic', component: FolderTree },
  { id: 'FileText', name: 'Research Papers / Docs', category: 'Academic', component: FileText },
  { id: 'Lightbulb', name: 'Innovation / Theory', category: 'Academic', component: Lightbulb },
  { id: 'Compass', name: 'Guides / Career', category: 'Academic', component: Compass },
  { id: 'Flame', name: 'Trending / Popular', category: 'Academic', component: Flame },
  { id: 'Zap', name: 'Fast Track / Bootcamps', category: 'Academic', component: Zap },
  { id: 'Layers', name: 'Full Stack / Layers', category: 'Academic', component: Layers },
];

export const renderCategoryIcon = (iconName: string, className = 'w-5 h-5') => {
  const match = CATEGORY_ICON_OPTIONS.find(opt => opt.id.toLowerCase() === (iconName || '').toLowerCase());
  if (match) {
    const Component = match.component;
    return <Component className={className} />;
  }
  return <BookOpen className={className} />;
};

interface CategoryIconSelectorProps {
  selectedIcon: string;
  onSelectIcon: (iconId: string) => void;
}

export const CategoryIconSelector: React.FC<CategoryIconSelectorProps> = ({
  selectedIcon,
  onSelectIcon,
}) => {
  const [iconSearch, setIconSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');

  const groups = ['ALL', 'Development', 'Cloud & Web', 'AI & Data', 'Security', 'Academic'];

  const filteredIcons = CATEGORY_ICON_OPTIONS.filter(icon => {
    const matchesSearch = !iconSearch || 
      icon.name.toLowerCase().includes(iconSearch.toLowerCase()) || 
      icon.id.toLowerCase().includes(iconSearch.toLowerCase());
    const matchesGroup = selectedGroup === 'ALL' || icon.category === selectedGroup;
    return matchesSearch && matchesGroup;
  });

  const activeOption = CATEGORY_ICON_OPTIONS.find(
    opt => opt.id.toLowerCase() === (selectedIcon || '').toLowerCase()
  ) || CATEGORY_ICON_OPTIONS[0];

  return (
    <div className="space-y-3">
      {/* Active Selected Icon Preview Banner */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            {renderCategoryIcon(selectedIcon, 'w-5 h-5')}
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 dark:text-indigo-400 block">
              Selected Icon
            </span>
            <p className="text-xs font-semibold text-slate-900 dark:text-white">
              {activeOption.name} <span className="font-mono text-[10px] text-slate-400">({activeOption.id})</span>
            </p>
          </div>
        </div>

        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-medium">
          {activeOption.category}
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={iconSearch}
            onChange={e => setIconSearch(e.target.value)}
            placeholder="Search icons (e.g. Code, Database, Cloud)..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
          {groups.map(grp => (
            <button
              key={grp}
              type="button"
              onClick={() => setSelectedGroup(grp)}
              className={`px-2 py-1 rounded-md text-[10px] font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                selectedGroup === grp
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {grp}
            </button>
          ))}
        </div>
      </div>

      {/* Icon Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-48 overflow-y-auto p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 scrollbar-thin">
        {filteredIcons.map(icon => {
          const isSelected = selectedIcon?.toLowerCase() === icon.id.toLowerCase();
          const IconComp = icon.component;
          return (
            <button
              key={icon.id}
              type="button"
              onClick={() => onSelectIcon(icon.id)}
              title={`${icon.name} (${icon.id})`}
              className={`p-2.5 rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-sm scale-105 ring-2 ring-indigo-400'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-700 hover:text-indigo-600 border border-slate-200/80 dark:border-slate-700/80'
              }`}
            >
              <IconComp className="w-5 h-5 shrink-0" />
              <span className="text-[9px] font-medium truncate w-full text-center">
                {icon.id}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
