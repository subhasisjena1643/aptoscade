'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient, handleAPIError, type Project } from '@/lib/api-client';

export interface UseCrowdfundingReturn {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  createProject: (projectData: Omit<Project, 'id' | 'progress'>) => Promise<Project>;
  getProject: (projectId: string) => Promise<Project>;
  contributeToProject: (projectId: string, amount: number, rewardTierId?: string) => Promise<void>;
  refreshProjects: () => Promise<void>;
}

export function useCrowdfunding(
  category?: string,
  status?: string
): UseCrowdfundingReturn {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const projectsData = await apiClient.getProjects({
        category,
        status,
        page: 1,
        limit: 20
      });
      setProjects(projectsData);
    } catch (err) {
      setError(handleAPIError(err));
    } finally {
      setIsLoading(false);
    }
  }, [category, status]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const createProject = async (projectData: Omit<Project, 'id' | 'progress'>): Promise<Project> => {
    try {
      setError(null);
      const newProject = await apiClient.createProject(projectData);
      setProjects(prev => [newProject, ...prev]);
      return newProject;
    } catch (err) {
      const errorMessage = handleAPIError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const getProject = async (projectId: string): Promise<Project> => {
    try {
      setError(null);
      return await apiClient.getProject(projectId);
    } catch (err) {
      const errorMessage = handleAPIError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const contributeToProject = async (
    projectId: string, 
    amount: number, 
    rewardTierId?: string
  ): Promise<void> => {
    try {
      setError(null);
      await apiClient.contributeToProject(projectId, {
        amount,
        rewardTierId,
        anonymous: false
      });
      
      // Refresh the project data to show updated funding
      await loadProjects();
    } catch (err) {
      const errorMessage = handleAPIError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const refreshProjects = async (): Promise<void> => {
    await loadProjects();
  };

  return {
    projects,
    isLoading,
    error,
    createProject,
    getProject,
    contributeToProject,
    refreshProjects
  };
}
