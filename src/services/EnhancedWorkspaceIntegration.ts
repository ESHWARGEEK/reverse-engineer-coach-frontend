/**
 * EnhancedWorkspaceIntegration - Service for integrating enhanced workflow with workspace
 * 
 * Features:
 * - Enhanced project data structure handling
 * - AI-generated content pre-loading
 * - Workspace initialization with enhanced metadata
 * - AI coach context initialization
 * - Project analytics integration
 */

import { LearningProject } from '../store/index';
import { ProjectPreview } from '../components/workflow/ProjectPreviewInterface';
import { Repository } from '../components/workflow/RepositorySelectionInterface';
import { TechnologyPreference } from '../components/workflow/TechnologyPreferenceSelector';
import { SkillAssessmentData } from '../components/workflow/SkillAssessmentForm';

export interface EnhancedProjectData {
  // Basic project info
  id: string;
  title: string;
  description: string;
  
  // Enhanced workflow data
  skillAssessment: SkillAssessmentData;
  technologyPreferences: TechnologyPreference[];
  selectedRepositories: Repository[];
  projectPreview: ProjectPreview;
  
  // AI-generated content
  curriculum: {
    phase: string;
    title: string;
    description: string;
    tasks: string[];
    estimatedHours: number;
  }[];
  
  // Metadata
  workflowVersion: string;
  createdVia: 'enhanced_workflow' | 'simple_form';
  aiGeneratedContent: boolean;
  
  // User preferences preserved from workflow
  userPreferences: {
    experienceLevel: string;
    learningStyle: string;
    timeCommitment: string;
    motivation: string;
    learningGoals: string[];
  };
}

export interface WorkspaceInitializationOptions {
  preloadContent?: boolean;
  initializeAICoach?: boolean;
  enableAnalytics?: boolean;
  preserveWorkflowState?: boolean;
}

export class EnhancedWorkspaceIntegration {
  /**
   * Convert enhanced workflow data to standard LearningProject format
   */
  static convertToLearningProject(enhancedData: EnhancedProjectData): LearningProject {
    const primaryRepository = enhancedData.selectedRepositories[0];
    
    return {
      id: enhancedData.id,
      user_id: '', // Will be set by the API
      title: enhancedData.title,
      target_repository: primaryRepository?.url || '',
      architecture_topic: enhancedData.projectPreview.technologies.join(', '),
      concept_description: enhancedData.description,
      discovery_metadata: {
        // Enhanced metadata from workflow
        workflowVersion: enhancedData.workflowVersion,
        createdVia: enhancedData.createdVia,
        aiGeneratedContent: enhancedData.aiGeneratedContent,
        
        // Repository information
        repositories: enhancedData.selectedRepositories.map(repo => ({
          id: repo.id,
          name: repo.name,
          fullName: repo.fullName,
          url: repo.url,
          language: repo.language,
          stars: repo.stars,
          relevanceScore: repo.relevanceScore,
          selectionReasoning: repo.selectionReasoning
        })),
        
        // User assessment data
        skillAssessment: enhancedData.skillAssessment,
        technologyPreferences: enhancedData.technologyPreferences,
        userPreferences: enhancedData.userPreferences,
        
        // AI-generated curriculum
        enhancedCurriculum: enhancedData.curriculum,
        
        // Project preview data
        projectPreview: {
          objectives: enhancedData.projectPreview.objectives,
          prerequisites: enhancedData.projectPreview.prerequisites,
          learningOutcomes: enhancedData.projectPreview.learningOutcomes,
          estimatedDuration: enhancedData.projectPreview.estimatedDuration,
          difficulty: enhancedData.projectPreview.difficulty
        }
      },
      status: 'not_started' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      implementation_language: primaryRepository?.language || 'JavaScript',
      preferred_frameworks: enhancedData.technologyPreferences
        .filter(tech => tech.category === 'tool' || tech.category === 'frontend' || tech.category === 'backend') // Fix: use valid categories
        .map(tech => tech.name),
      language_specific_config: {
        primaryLanguage: primaryRepository?.language || 'JavaScript',
        technologies: enhancedData.technologyPreferences.map(tech => tech.name),
        experienceLevel: enhancedData.skillAssessment.experienceLevel,
        learningStyle: enhancedData.skillAssessment.learningStyle
      },
      total_tasks: enhancedData.curriculum.reduce((total, phase) => total + phase.tasks.length, 0),
      completed_tasks: 0,
      completion_percentage: 0
    };
  }

  /**
   * Initialize workspace with enhanced project data
   */
  static async initializeWorkspace(
    enhancedData: EnhancedProjectData,
    options: WorkspaceInitializationOptions = {}
  ): Promise<{
    project: LearningProject;
    workspaceData: any;
    aiCoachContext?: any;
  }> {
    const {
      preloadContent = true,
      initializeAICoach = true,
      enableAnalytics = true,
      preserveWorkflowState = true
    } = options;

    // Convert to standard project format
    const project = this.convertToLearningProject(enhancedData);

    // Prepare workspace data with enhanced content
    const workspaceData = {
      // Basic workspace setup
      layout: {
        leftPaneWidth: 25,
        rightPaneWidth: 33,
        showTaskList: true,
        showReferenceCode: true
      },
      
      // Enhanced content pre-loading
      ...(preloadContent && {
        preloadedContent: {
          curriculum: enhancedData.curriculum,
          repositories: enhancedData.selectedRepositories,
          learningObjectives: enhancedData.projectPreview.objectives,
          prerequisites: enhancedData.projectPreview.prerequisites,
          learningOutcomes: enhancedData.projectPreview.learningOutcomes
        }
      }),
      
      // Workflow state preservation
      ...(preserveWorkflowState && {
        workflowState: {
          completedSteps: ['welcome', 'skill-assessment', 'technology-selection', 'repository-selection', 'project-preview'],
          userPreferences: enhancedData.userPreferences,
          selectedTechnologies: enhancedData.technologyPreferences,
          workflowVersion: enhancedData.workflowVersion
        }
      }),
      
      // Analytics setup
      ...(enableAnalytics && {
        analytics: {
          trackingEnabled: true,
          workflowSource: 'enhanced_workflow',
          userSegment: enhancedData.skillAssessment.experienceLevel,
          technologies: enhancedData.technologyPreferences.map(tech => tech.name),
          repositoryCount: enhancedData.selectedRepositories.length
        }
      })
    };

    // Initialize AI coach context
    let aiCoachContext;
    if (initializeAICoach) {
      aiCoachContext = this.createAICoachContext(enhancedData);
    }

    return {
      project,
      workspaceData,
      aiCoachContext
    };
  }

  /**
   * Create AI coach context from enhanced workflow data
   */
  private static createAICoachContext(enhancedData: EnhancedProjectData): any {
    return {
      // User profile for personalized coaching
      userProfile: {
        experienceLevel: enhancedData.skillAssessment.experienceLevel,
        currentSkills: enhancedData.skillAssessment.currentSkills,
        learningGoals: enhancedData.skillAssessment.learningGoals,
        learningStyle: enhancedData.skillAssessment.learningStyle,
        timeCommitment: enhancedData.skillAssessment.timeCommitment,
        motivation: enhancedData.skillAssessment.motivation
      },
      
      // Project context for relevant guidance
      projectContext: {
        title: enhancedData.title,
        description: enhancedData.description,
        technologies: enhancedData.technologyPreferences.map(tech => tech.name),
        repositories: enhancedData.selectedRepositories.map(repo => ({
          name: repo.name,
          description: repo.description,
          language: repo.language,
          topics: repo.topics
        })),
        difficulty: enhancedData.projectPreview.difficulty,
        estimatedDuration: enhancedData.projectPreview.estimatedDuration
      },
      
      // Learning path for progress tracking
      learningPath: {
        curriculum: enhancedData.curriculum,
        objectives: enhancedData.projectPreview.objectives,
        prerequisites: enhancedData.projectPreview.prerequisites,
        learningOutcomes: enhancedData.projectPreview.learningOutcomes,
        currentPhase: 0,
        currentTask: 0
      },
      
      // Coaching preferences
      coachingPreferences: {
        communicationStyle: this.inferCommunicationStyle(enhancedData.skillAssessment),
        feedbackFrequency: this.inferFeedbackFrequency(enhancedData.skillAssessment),
        supportLevel: this.inferSupportLevel(enhancedData.skillAssessment),
        focusAreas: enhancedData.skillAssessment.learningGoals
      }
    };
  }

  /**
   * Infer communication style from skill assessment
   */
  private static inferCommunicationStyle(skillAssessment: SkillAssessmentData): string {
    if (skillAssessment.experienceLevel === 'beginner') {
      return 'detailed_explanations';
    } else if (skillAssessment.experienceLevel === 'advanced') {
      return 'concise_technical';
    }
    return 'balanced';
  }

  /**
   * Infer feedback frequency from skill assessment
   */
  private static inferFeedbackFrequency(skillAssessment: SkillAssessmentData): string {
    if (skillAssessment.learningStyle === 'visual') {
      return 'frequent';
    } else if (skillAssessment.learningStyle === 'reading') {
      return 'minimal';
    }
    return 'moderate';
  }

  /**
   * Infer support level from skill assessment
   */
  private static inferSupportLevel(skillAssessment: SkillAssessmentData): string {
    if (skillAssessment.experienceLevel === 'beginner') {
      return 'high';
    } else if (skillAssessment.experienceLevel === 'advanced') {
      return 'low';
    }
    return 'medium';
  }

  /**
   * Update workspace with enhanced project data
   */
  static async updateWorkspaceData(
    projectId: string,
    enhancedData: Partial<EnhancedProjectData>
  ): Promise<void> {
    try {
      // In production, this would update the workspace via API
      const workspaceUpdate = {
        projectId,
        enhancedData,
        updatedAt: new Date().toISOString()
      };

      // Store in localStorage for now (in production, use API)
      const existingData = localStorage.getItem(`workspace_${projectId}`);
      const currentData = existingData ? JSON.parse(existingData) : {};
      
      const updatedData = {
        ...currentData,
        ...workspaceUpdate,
        enhancedData: {
          ...currentData.enhancedData,
          ...enhancedData
        }
      };

      localStorage.setItem(`workspace_${projectId}`, JSON.stringify(updatedData));
    } catch (error) {
      console.error('Failed to update workspace data:', error);
      throw new Error('Failed to update workspace with enhanced data');
    }
  }

  /**
   * Load enhanced workspace data
   */
  static async loadWorkspaceData(projectId: string): Promise<any> {
    try {
      // In production, this would load from API
      const data = localStorage.getItem(`workspace_${projectId}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to load workspace data:', error);
      return null;
    }
  }

  /**
   * Check if project was created via enhanced workflow
   */
  static isEnhancedProject(project: LearningProject): boolean {
    return project.discovery_metadata?.createdVia === 'enhanced_workflow' ||
           project.discovery_metadata?.workflowVersion !== undefined;
  }

  /**
   * Extract enhanced data from project
   */
  static extractEnhancedData(project: LearningProject): EnhancedProjectData | null {
    if (!this.isEnhancedProject(project)) {
      return null;
    }

    const metadata = project.discovery_metadata;
    if (!metadata) return null;

    return {
      id: project.id,
      title: project.title,
      description: project.concept_description || '',
      skillAssessment: metadata.skillAssessment || {},
      technologyPreferences: metadata.technologyPreferences || [],
      selectedRepositories: metadata.repositories || [],
      projectPreview: metadata.projectPreview || {},
      curriculum: metadata.enhancedCurriculum || [],
      workflowVersion: metadata.workflowVersion || '1.0.0',
      createdVia: metadata.createdVia || 'enhanced_workflow',
      aiGeneratedContent: metadata.aiGeneratedContent || false,
      userPreferences: metadata.userPreferences || {}
    } as EnhancedProjectData;
  }

  /**
   * Generate workspace analytics data
   */
  static generateAnalytics(enhancedData: EnhancedProjectData): any {
    return {
      workflowCompletion: {
        stepsCompleted: 5, // All enhanced workflow steps
        timeToComplete: Date.now(), // Would track actual time
        abandonmentPoints: [], // Track where users typically drop off
        userSatisfaction: null // To be collected later
      },
      
      userSegmentation: {
        experienceLevel: enhancedData.skillAssessment.experienceLevel,
        learningStyle: enhancedData.skillAssessment.learningStyle,
        timeCommitment: enhancedData.skillAssessment.timeCommitment,
        primaryTechnologies: enhancedData.technologyPreferences
          .filter(tech => tech.proficiency === 'expert' || tech.proficiency === 'intermediate')
          .map(tech => tech.name)
      },
      
      projectCharacteristics: {
        repositoryCount: enhancedData.selectedRepositories.length,
        averageRepositoryStars: enhancedData.selectedRepositories.reduce((sum, repo) => sum + repo.stars, 0) / enhancedData.selectedRepositories.length,
        primaryLanguage: enhancedData.selectedRepositories[0]?.language,
        projectComplexity: enhancedData.projectPreview.difficulty,
        estimatedDuration: enhancedData.projectPreview.estimatedDuration
      },
      
      aiUtilization: {
        aiGeneratedContent: enhancedData.aiGeneratedContent,
        repositoryDiscoveryUsed: enhancedData.selectedRepositories.some(repo => repo.relevanceScore > 0),
        curriculumGenerated: enhancedData.curriculum.length > 0,
        personalizationLevel: 'high' // Based on amount of user data collected
      }
    };
  }
}