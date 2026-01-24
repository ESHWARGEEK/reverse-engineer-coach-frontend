import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { RepositoryDiscovery } from '../discovery/RepositoryDiscovery';

const mockRepository = {
  repository_url: 'https://github.com/test/repo',
  repository_name: 'test/repo',
  description: 'A test repository',
  stars: 1000,
  forks: 200,
  language: 'TypeScript',
  topics: ['react', 'typescript'],
  quality: {
    overall_score: 0.85,
    code_quality: 0.8,
    documentation_quality: 0.9,
    activity_score: 0.7,
    educational_value: 0.9,
    complexity_score: 0.6,
  },
  last_updated: '2024-01-01T00:00:00Z',
  owner: 'test',
  size_kb: 5000,
  has_readme: true,
  has_license: true,
  open_issues: 10,
  relevance_score: 0.9,
};

describe('RepositoryDiscovery', () => {
  it('renders loading state', () => {
    render(
      <RepositoryDiscovery
        concept="microservices"
        suggestions={[]}
        loading={true}
        onRepositorySelect={() => {}}
      />
    );
    
    expect(screen.getByText('Discovering Repositories')).toBeInTheDocument();
    expect(screen.getByText('Searching for the best repositories to learn "microservices"...')).toBeInTheDocument();
  });

  it('renders error state', () => {
    render(
      <RepositoryDiscovery
        concept="microservices"
        suggestions={[]}
        loading={false}
        error="Failed to discover repositories"
        onRepositorySelect={() => {}}
      />
    );
    
    expect(screen.getByText('Discovery Failed')).toBeInTheDocument();
    expect(screen.getByText('Failed to discover repositories')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(
      <RepositoryDiscovery
        concept="microservices"
        suggestions={[]}
        loading={false}
        onRepositorySelect={() => {}}
      />
    );
    
    expect(screen.getByText('No Repositories Found')).toBeInTheDocument();
    expect(screen.getByText('We couldn\'t find any repositories matching "microservices". Try refining your search or using different keywords.')).toBeInTheDocument();
  });

  it('renders repository suggestions', () => {
    render(
      <RepositoryDiscovery
        concept="microservices"
        suggestions={[mockRepository]}
        loading={false}
        onRepositorySelect={() => {}}
      />
    );
    
    expect(screen.getByText('Repository Suggestions')).toBeInTheDocument();
    expect(screen.getByText('Found 1 repositories for "microservices"')).toBeInTheDocument();
    expect(screen.getByText('test/repo')).toBeInTheDocument();
    expect(screen.getByText('A test repository')).toBeInTheDocument();
  });

  it('calls onRepositorySelect when repository is clicked', () => {
    const mockOnSelect = jest.fn();
    
    render(
      <RepositoryDiscovery
        concept="microservices"
        suggestions={[mockRepository]}
        loading={false}
        onRepositorySelect={mockOnSelect}
      />
    );
    
    const repositoryCard = screen.getByRole('button', { name: /Select repository test\/repo/i });
    fireEvent.click(repositoryCard);
    
    expect(mockOnSelect).toHaveBeenCalledWith(mockRepository);
  });

  it('shows repository quality scores', () => {
    render(
      <RepositoryDiscovery
        concept="microservices"
        suggestions={[mockRepository]}
        loading={false}
        onRepositorySelect={() => {}}
      />
    );
    
    // Overall quality score
    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('Very Good')).toBeInTheDocument();
    
    // Educational value and Documentation quality both show 90%
    const percentages = screen.getAllByText('90%');
    expect(percentages).toHaveLength(2);
    
    // Check for Educational and Documentation labels
    expect(screen.getByText('Educational')).toBeInTheDocument();
    expect(screen.getByText('Documentation')).toBeInTheDocument();
  });

  it('supports sorting repositories', () => {
    const repo1 = { ...mockRepository, stars: 500, quality: { ...mockRepository.quality, overall_score: 0.7 } };
    const repo2 = { ...mockRepository, repository_name: 'test/repo2', stars: 1500, quality: { ...mockRepository.quality, overall_score: 0.9 } };
    
    render(
      <RepositoryDiscovery
        concept="microservices"
        suggestions={[repo1, repo2]}
        loading={false}
        onRepositorySelect={() => {}}
      />
    );
    
    const sortSelect = screen.getByLabelText('Sort by:');
    fireEvent.change(sortSelect, { target: { value: 'stars' } });
    
    // Should sort by stars (repo2 has more stars)
    const repositoryCards = screen.getAllByRole('button', { name: /Select repository/i });
    expect(repositoryCards[0]).toHaveTextContent('test/repo2');
    expect(repositoryCards[1]).toHaveTextContent('test/repo');
  });
});