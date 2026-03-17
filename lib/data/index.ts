import { Company, CompanySlug, MonthlyAggregate, PortfolioSummary } from '../types';
import { northstarFoods } from './northstarFoods';
import { apexHealth } from './apexHealth';
import { vertexLogistics } from './vertexLogistics';
import { bluePeakSoftware } from './bluePeakSoftware';
import { harborHomeServices } from './harborHomeServices';

export const companies: Company[] = [
  northstarFoods,
  apexHealth,
  vertexLogistics,
  bluePeakSoftware,
  harborHomeServices,
];

export const companiesMap: Record<CompanySlug, Company> = {
  'northstar-foods': northstarFoods,
  'apex-health': apexHealth,
  'vertex-logistics': vertexLogistics,
  'bluepeak-software': bluePeakSoftware,
  'harbor-home-services': harborHomeServices,
};

export function getCompanyBySlug(slug: string): Company | undefined {
  return companiesMap[slug as CompanySlug];
}

export { northstarFoods, apexHealth, vertexLogistics, bluePeakSoftware, harborHomeServices };
