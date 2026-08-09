import { Company, CompanySlug, MonthlyAggregate, PortfolioSummary } from '../types';
import { firms } from '../firm/firms';
import { firmToCompany } from '../firm/toCompany';

export const companies: Company[] = firms.map(firmToCompany);

export const companiesMap: Record<CompanySlug, Company> = Object.fromEntries(
  companies.map((c) => [c.slug, c])
) as Record<CompanySlug, Company>;

export function getCompanyBySlug(slug: string): Company | undefined {
  return companiesMap[slug as CompanySlug];
}

export type { MonthlyAggregate, PortfolioSummary };
