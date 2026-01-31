import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Repository } from './RepositorySelectionInterface';

export interface ProjectPreview {
  id: string;
  title: string;
  description: string;
  objectives: string[];
  curriculum: {
    phase: string;
    title: string;
    description: string;
    tasks: string[];
    estimatedHours: number;
  }[];
  technologies: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: string;
  prerequisites: string[];
  learningOutcomes: string[];
  repository: Repository;
}

interface ProjectPreviewInterfaceProps {
  projectPreview: ProjectPreview;
  onCustomize: (customizations: Partial<ProjectPreview>) => void;
  onConfirm: () => void;
  onRegenerate: () => void;
  isRegenerating?: boolean;
  className?: string;
}

export const ProjectPreviewInterface: React.FC<ProjectPreviewInterfaceProps> = ({
  projectPreview,
  onCustomize,
  onConfirm,
  onRegenerate,
  isRegenerating = false,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'customize'>('overview');
  const [customizations, setCustomizations] = useState<Partial<ProjectPreview>>({});
  const [isEditing, setIsEditing] = useState<string | null>(null);

  // Apply customizations to preview
  const customizedPreview = { ...projectPreview, ...customizations };

  const handleCustomizationChange = (field: keyof ProjectPreview, value: any) => {
    const newCustomizations = { ...customizations, [field]: value };
    setCustomizations(newCustomizations);
    onCustomize(newCustomizations);
  };

  const handleArrayEdit = (field: keyof ProjectPreview, index: number, value: string) => {
    const currentArray = customizedPreview[field] as string[];
    const newArray = [...currentArray];
    newArray[index] = value;
    handleCustomizationChange(field, newArray);
  };

  const handleArrayAdd = (field: keyof ProjectPreview, value: string) => {
    const currentArray = (customizedPreview[field] as string[]) || [];
    handleCustomizationChange(field, [...currentArray, value]);
  };

  const handleArrayRemove = (field: keyof ProjectPreview, index: number) => {
    const currentArray = customizedPreview[field] as string[];
    const newArray = currentArray.filter((_, i) => i !== index);
    handleCustomizationChange(field, newArray);
  };

  const EditableText: React.FC<{
    value: string;
    onSave: (value: string) => void;
    multiline?: boolean;
    className?: string;
  }> = ({ value, onSave, multiline = false, className = '' }) => {
    const [editValue, setEditValue] = useState(value);
    const [editing, setEditing] = useState(false);

    const handleSave = () => {
      onSave(editValue);
      setEditing(false);
    };

    const handleCancel = () => {
      setEditValue(value);
      setEditing(false);
    };

    if (editing) {
      return (
        <div className="space-y-2">
          {multiline ? (
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white resize-none"
              rows={3}
              autoFocus
            />
          ) : (
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              autoFocus
            />
          )}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    return (
      <div
        className={`group cursor-pointer hover:bg-gray-700 p-2 rounded transition-colors ${className}`}
        onClick={() => setEditing(true)}
      >
        <span>{value}</span>
        <span className="ml-2 opacity-0 group-hover:opacity-100 text-blue-400 text-sm">
          ✏️ Edit
        </span>
      </div>
    );
  };

  const EditableList: React.FC<{
    items: string[];
    onUpdate: (items: string[]) => void;
    title: string;
  }> = ({ items, onUpdate, title }) => {
    const [newItem, setNewItem] = useState('');

    const handleAdd = () => {
      if (newItem.trim()) {
        onUpdate([...items, newItem.trim()]);
        setNewItem('');
      }
    };

    const handleRemove = (index: number) => {
      onUpdate(items.filter((_, i) => i !== index));
    };

    const handleEdit = (index: number, value: string) => {
      const newItems = [...items];
      newItems[index] = value;
      onUpdate(newItems);
    };

    return (
      <div className="space-y-3">
        <h4 className="font-medium text-white">{title}</h4>
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <EditableText
                value={item}
                onSave={(value) => handleEdit(index, value)}
                className="flex-1 text-sm"
              />
              <button
                onClick={() => handleRemove(index)}
                className="text-red-400 hover:text-red-300 text-sm"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder={`Add new ${title.toLowerCase().slice(0, -1)}`}
            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
            onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
          />
          <button
            onClick={handleAdd}
            className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            Add
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-white mb-2">
          {customizedPreview.title}
        </h3>
        <p className="text-gray-300 max-w-2xl mx-auto">
          {customizedPreview.description}
        </p>
        <div className="flex items-center justify-center gap-4 mt-4 text-sm">
          <span className={`
            px-3 py-1 rounded-full font-medium
            ${customizedPreview.difficulty === 'beginner' ? 'bg-green-800 text-green-200' :
              customizedPreview.difficulty === 'intermediate' ? 'bg-yellow-800 text-yellow-200' :
              'bg-red-800 text-red-200'}
          `}>
            {customizedPreview.difficulty}
          </span>
          <span className="text-gray-400">
            📅 {customizedPreview.estimatedDuration}
          </span>
          <span className="text-gray-400">
            🔗 {customizedPreview.repository.name}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-center">
        <div className="flex bg-gray-800 rounded-lg p-1">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'curriculum', label: 'Curriculum' },
            { id: 'customize', label: 'Customize' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                px-4 py-2 rounded-md text-sm font-medium transition-colors
                ${activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Objectives */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-3">Learning Objectives</h4>
              <ul className="space-y-2">
                {customizedPreview.objectives.map((objective, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-300">
                    <span className="text-green-400 mt-1">✓</span>
                    <span>{objective}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Technologies */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-3">Technologies You'll Learn</h4>
              <div className="flex flex-wrap gap-2">
                {customizedPreview.technologies.map((tech) => (
                  <span key={tech} className="px-3 py-1 bg-blue-800 text-blue-200 rounded-full text-sm">
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* Prerequisites */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-3">Prerequisites</h4>
              <ul className="space-y-1">
                {customizedPreview.prerequisites.map((prereq, index) => (
                  <li key={index} className="text-gray-300">• {prereq}</li>
                ))}
              </ul>
            </div>

            {/* Learning Outcomes */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-3">What You'll Build</h4>
              <ul className="space-y-1">
                {customizedPreview.learningOutcomes.map((outcome, index) => (
                  <li key={index} className="text-gray-300">• {outcome}</li>
                ))}
              </ul>
            </div>

            {/* Repository Info */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-white mb-2">Source Repository</h4>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-400 font-medium">{customizedPreview.repository.fullName}</p>
                  <p className="text-gray-300 text-sm">{customizedPreview.repository.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                    <span>⭐ {customizedPreview.repository.stars}</span>
                    <span>🍴 {customizedPreview.repository.forks}</span>
                    <span>📝 {customizedPreview.repository.language}</span>
                  </div>
                </div>
                <a
                  href={customizedPreview.repository.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  View Repository
                </a>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'curriculum' && (
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-white">Learning Curriculum</h4>
            <div className="space-y-4">
              {customizedPreview.curriculum.map((phase, index) => (
                <div key={index} className="border border-gray-600 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h5 className="font-semibold text-white">
                        Phase {index + 1}: {phase.title}
                      </h5>
                      <p className="text-gray-300 text-sm">{phase.description}</p>
                    </div>
                    <span className="text-sm text-gray-400">
                      ~{phase.estimatedHours}h
                    </span>
                  </div>
                  <div className="space-y-2">
                    <h6 className="text-sm font-medium text-gray-300">Tasks:</h6>
                    <ul className="space-y-1">
                      {phase.tasks.map((task, taskIndex) => (
                        <li key={taskIndex} className="text-sm text-gray-400 flex items-start gap-2">
                          <span className="text-blue-400 mt-1">•</span>
                          <span>{task}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">
                  Total Estimated Time: {customizedPreview.curriculum.reduce((total, phase) => total + phase.estimatedHours, 0)} hours
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'customize' && (
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-white mb-4">Customize Your Project</h4>
            
            {/* Title and Description */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Project Title</label>
                <EditableText
                  value={customizedPreview.title}
                  onSave={(value) => handleCustomizationChange('title', value)}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <EditableText
                  value={customizedPreview.description}
                  onSave={(value) => handleCustomizationChange('description', value)}
                  multiline
                  className="w-full"
                />
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Difficulty Level</label>
              <select
                value={customizedPreview.difficulty}
                onChange={(e) => handleCustomizationChange('difficulty', e.target.value)}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            {/* Editable Lists */}
            <EditableList
              items={customizedPreview.objectives}
              onUpdate={(items) => handleCustomizationChange('objectives', items)}
              title="Learning Objectives"
            />

            <EditableList
              items={customizedPreview.prerequisites}
              onUpdate={(items) => handleCustomizationChange('prerequisites', items)}
              title="Prerequisites"
            />

            <EditableList
              items={customizedPreview.learningOutcomes}
              onUpdate={(items) => handleCustomizationChange('learningOutcomes', items)}
              title="Learning Outcomes"
            />

            <EditableList
              items={customizedPreview.technologies}
              onUpdate={(items) => handleCustomizationChange('technologies', items)}
              title="Technologies"
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button
          onClick={onRegenerate}
          variant="secondary"
          disabled={isRegenerating}
        >
          {isRegenerating ? 'Regenerating...' : '🔄 Regenerate Project'}
        </Button>

        <div className="flex gap-3">
          <Button
            onClick={() => setActiveTab('customize')}
            variant="secondary"
          >
            Customize More
          </Button>
          <Button
            onClick={onConfirm}
            variant="primary"
            size="lg"
          >
            Create This Project
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProjectPreviewInterface;