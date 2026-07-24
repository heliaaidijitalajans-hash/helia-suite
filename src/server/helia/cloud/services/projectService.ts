/**
 * Projects — unlimited per org subject to plan limits.
 */

import { createId } from '../../utils/id.js';
import { AppError, NotFoundError, ValidationError } from '../../utils/errors.js';
import { getPlan } from '../plans/catalog.js';
import type { CloudDatabase } from '../persistence/cloudDatabase.js';
import type { Project, ProjectEnvironment } from '../types.js';
import { slugify } from '../utils.js';
import type { OrganizationService } from './organizationService.js';

export class ProjectService {
  constructor(
    private readonly db: CloudDatabase,
    private readonly organizations: OrganizationService,
  ) {}

  async create(input: {
    userId: string;
    organizationId: string;
    name: string;
    environment: ProjectEnvironment;
  }): Promise<Project> {
    await this.organizations.requireMembership(input.organizationId, input.userId, 'member');
    const org = await this.db.organizations.findById(input.organizationId);
    if (!org) throw new NotFoundError('Organization', input.organizationId);

    const plan = getPlan(org.planId);
    const existing = await this.db.projects.query((p) => p.organizationId === input.organizationId);
    if (existing.length >= plan.limits.maxProjectsPerOrg) {
      throw new AppError('Project limit reached for current plan', {
        statusCode: 402,
        code: 'PLAN_LIMIT',
      });
    }

    const name = input.name.trim();
    if (name.length < 2) throw new ValidationError('Project name is required');
    if (!['production', 'development', 'staging'].includes(input.environment)) {
      throw new ValidationError('Invalid environment');
    }

    let slug = slugify(name);
    if (existing.some((p) => p.slug === slug)) {
      slug = `${slug}-${createId('p').slice(-5)}`;
    }

    const now = new Date().toISOString();
    const project: Project = {
      id: createId('prj'),
      organizationId: input.organizationId,
      name,
      slug,
      environment: input.environment,
      createdAt: now,
      updatedAt: now,
      createdByUserId: input.userId,
    };
    await this.db.projects.upsert(project);
    return project;
  }

  async listForOrganization(organizationId: string, userId: string): Promise<Project[]> {
    await this.organizations.requireMembership(organizationId, userId);
    return this.db.projects.query((p) => p.organizationId === organizationId);
  }

  async listForUser(userId: string): Promise<Project[]> {
    const orgs = await this.organizations.listForUser(userId);
    const all: Project[] = [];
    for (const org of orgs) {
      const projects = await this.db.projects.query((p) => p.organizationId === org.id);
      all.push(...projects);
    }
    return all;
  }

  async getForUser(projectId: string, userId: string): Promise<Project> {
    const project = await this.db.projects.findById(projectId);
    if (!project) throw new NotFoundError('Project', projectId);
    await this.organizations.requireMembership(project.organizationId, userId);
    return project;
  }
}
