declare module "select-philippines-address" {
  export interface Region {
    region_code: string
    region_name: string
  }

  export interface Province {
    province_code: string
    province_name: string
    region_code: string
  }

  export interface City {
    city_code: string
    city_name: string
    province_code: string
  }

  export interface Barangay {
    brgy_code: string
    brgy_name: string
    city_code: string
  }

  export function regions(): Promise<Region[]>
  export function provinces(regionCode: string): Promise<Province[]>
  export function cities(provinceCode: string): Promise<City[]>
  export function barangays(cityCode: string): Promise<Barangay[]>

  export function regionByCode(code: string): Promise<Region>
  export function provincesByCode(code: string): Promise<Province>
  export function provinceByName(name: string): Promise<Province>
}
