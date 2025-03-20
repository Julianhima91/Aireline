import { NavigateFunction } from 'react-router-dom';

export function navigateToResults(navigate: NavigateFunction, batchId: string) {
  navigate(`/results?batch_id=${batchId}`, { replace: true });
}

export function navigateToSEOPage(fromLocation: string, toLocation: string, isCity: boolean = true) {
  const from = formatLocationForUrl(fromLocation);
  const to = formatLocationForUrl(toLocation);
  return isCity 
    ? `/bileta-avioni-${from}-${to}/`
    : `/fluturime-${from}-${to}/`;
}

export function formatLocationForUrl(location: string): string {
  return location
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric chars with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

export function parseLocationFromUrl(param: string): string {
  return param
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}