import * as turkey from 'turkey-neighbourhoods';

export function getCities() {
  return turkey.getCityNames();
}

export function getDistricts(cityName: string) {
  const city = turkey.cityList.find(c => c.name === cityName);
  if (!city) return [];
  return turkey.getDistrictsByCityCode(city.code);
}
